import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type PlanId = "starter" | "professional" | "enterprise";
type AgencyStatus = "trial" | "active" | "suspended";

const PLANS: PlanId[] = ["starter", "professional", "enterprise"];
const STATUSES: AgencyStatus[] = ["trial", "active", "suspended"];
const LANGUAGES = ["en", "ar"];

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isPlan(value: string): value is PlanId {
  return PLANS.includes(value as PlanId);
}

function isStatus(value: string): value is AgencyStatus {
  return STATUSES.includes(value as AgencyStatus);
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "SaaS Admin agency creation is not configured." },
      { status: 500 }
    );
  }

  const cookieStore = cookies();
  const userClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: adminProfile, error: profileError } = await userClient
    .from("users")
    .select("id,email,role,active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (adminProfile?.role !== "super_admin" || !adminProfile.active) {
    return NextResponse.json({ error: "Only super_admin can create agencies." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const agencyName = cleanString((body as any).agencyName);
  const ownerName = cleanString((body as any).ownerName);
  const ownerEmail = cleanString((body as any).ownerEmail).toLowerCase();
  const ownerPhone = cleanString((body as any).ownerPhone);
  const temporaryPassword = cleanString((body as any).temporaryPassword);
  const plan = cleanString((body as any).plan) || "starter";
  const status = cleanString((body as any).status) || "trial";
  const currency = cleanString((body as any).currency) || "OMR";
  const language = cleanString((body as any).language) || "en";

  if (!agencyName || !ownerName || !ownerEmail || !ownerPhone || !temporaryPassword) {
    return NextResponse.json({ error: "All required fields must be completed." }, { status: 400 });
  }
  if (!ownerEmail.includes("@")) {
    return NextResponse.json({ error: "Owner email must be valid." }, { status: 400 });
  }
  if (temporaryPassword.length < 8) {
    return NextResponse.json({ error: "Temporary password must be at least 8 characters." }, { status: 400 });
  }
  if (!isPlan(plan)) {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
  }
  if (!isStatus(status)) {
    return NextResponse.json({ error: "Invalid agency status selected." }, { status: 400 });
  }
  if (!LANGUAGES.includes(language)) {
    return NextResponse.json({ error: "Invalid language selected." }, { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let authUserId: string | null = null;
  let agencyId: string | null = null;

  try {
    const { data: authData, error: createUserError } = await adminClient.auth.admin.createUser({
      email: ownerEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { name: ownerName, agency_name: agencyName },
    });

    if (createUserError) throw createUserError;
    authUserId = authData.user?.id || null;
    if (!authUserId) throw new Error("Supabase Auth did not return a user id.");

    const { data: agency, error: agencyError } = await adminClient
      .from("agencies")
      .insert({
        name: agencyName,
        email: ownerEmail,
        phone: ownerPhone,
        currency,
        language,
        status,
        plan,
        updated_at: new Date().toISOString(),
      })
      .select("id,name,email,phone,plan,status,created_at")
      .single();

    if (agencyError) throw agencyError;
    agencyId = agency.id;

    const { error: profileInsertError } = await adminClient.from("users").insert({
      id: authUserId,
      agency_id: agencyId,
      email: ownerEmail,
      name: ownerName,
      role: "owner",
      active: true,
    });

    if (profileInsertError) throw profileInsertError;

    await adminClient.from("audit_logs").insert({
      admin_user_id: adminProfile.id,
      admin_email: adminProfile.email || user.email || "unknown-admin",
      action: "Agency created",
      target_agency_id: agencyId,
      target_agency_name: agencyName,
      notes: `Created ${agencyName} with ${plan} plan and ${status} status`,
    });

    return NextResponse.json({ agency });
  } catch (err) {
    if (agencyId) {
      await adminClient.from("agencies").delete().eq("id", agencyId);
    }
    if (authUserId) {
      await adminClient.auth.admin.deleteUser(authUserId);
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create agency." },
      { status: 500 }
    );
  }
}
