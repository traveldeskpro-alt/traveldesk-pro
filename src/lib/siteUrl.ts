// Canonical public URL of the deployed app.
//
// All Supabase auth callbacks (password reset, email verification, magic-link
// invites, and any other auth redirect) must point at the production domain —
// never at a Vercel preview host, `localhost`, or some other non-canonical
// origin captured from `window.location`. Relying on `window.location.origin`
// is unsafe because a reset/verification email requested from a preview build
// would email a link back to that preview host.
//
// Defaults to the production domain. Override per environment with
// NEXT_PUBLIC_SITE_URL (e.g. `http://localhost:3000` for local dev, or a
// staging domain). Trailing slashes are stripped so callers can safely append
// a path beginning with "/".
const FALLBACK_SITE_URL = "https://traveldeskpro.app";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL
).replace(/\/+$/, "");

// Build an absolute URL on the canonical site for a given path.
export function siteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
