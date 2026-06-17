import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that do not require a session.
// /demo is the isolated demo workspace — it has its own DemoProvider and
// never interacts with the real Supabase auth session.
const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/demo'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = pathname === '/' || PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // When Supabase is not configured (e.g. local demo dev without a .env),
  // skip the server-side check and let the client handle auth state.
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  // Build a response object that we can mutate to forward refreshed cookies.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Forward any new/refreshed cookies to both the request and the
        // outgoing response so the browser and middleware stay in sync.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() validates the JWT with Supabase's auth servers — it does NOT
  // just decode the cookie locally. This detects expired/revoked sessions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated request to a protected route → send to login.
  if (!user && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  let profile: { role: string; active?: boolean } | null = null;
  const getProfile = async () => {
    if (profile) return profile;
    const { data } = await supabase
      .from('users')
      .select('role,active')
      .eq('id', user!.id)
      .maybeSingle();
    profile = data;
    return profile;
  };

  // Authenticated request to a public auth page (login/signup) → skip to app.
  // /reset-password is excluded: Supabase posts an auth code there even when
  // the user already has an active session (e.g. changing password while logged in).
  if (user && isPublicPath && !pathname.startsWith('/reset-password')) {
    const nextProfile = await getProfile();
    const targetPath = nextProfile?.role === 'super_admin' ? '/saas-admin' : '/dashboard';
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  if (user && pathname.startsWith('/dashboard')) {
    const nextProfile = await getProfile();
    if (nextProfile?.role === 'super_admin' && nextProfile?.active) {
      return NextResponse.redirect(new URL('/saas-admin', request.url));
    }
  }

  const isSaasAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/saas-admin');
  if (user && isSaasAdminPath) {
    const nextProfile = await getProfile();

    if (nextProfile?.role !== 'super_admin' || !nextProfile?.active) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on every route except Next.js internals, static files, and images.
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|icon.png|images).*)',
  ],
};
