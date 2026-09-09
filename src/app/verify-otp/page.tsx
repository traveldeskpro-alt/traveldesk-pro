"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Factor = {
  id: string;
  factor_type: string;
  status: string;
};

export default function VerifyOtpPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [factor, setFactor] = useState<Factor | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [isArabic, setIsArabic] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setLoading(true);
        setError("");

        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }

        if (
          typeof document !== "undefined" &&
          (document.documentElement.lang?.toLowerCase().startsWith("ar") ||
            document.documentElement.dir === "rtl")
        ) {
          setIsArabic(true);
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          router.replace("/login");
          return;
        }

        const { data: aalData, error: aalError } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (aalError) {
          throw aalError;
        }

        const currentLevel = aalData?.currentLevel ?? null;

        // The user has already completed MFA.
        if (currentLevel === "aal2") {
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("role, active")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profileError) {
            throw profileError;
          }

          if (profile?.role === "super_admin" && profile.active !== false) {
            router.replace("/saas-admin");
          } else {
            router.replace("/dashboard");
          }

          return;
        }

        const { data: factorsData, error: factorsError } =
          await supabase.auth.mfa.listFactors();

        if (factorsError) {
          throw factorsError;
        }

        const verifiedTotpFactor =
          factorsData?.totp?.find(
            (item) => item.status === "verified"
          ) ?? null;

        if (!mounted) {
          return;
        }

        if (!verifiedTotpFactor) {
          setError(
            isArabic
              ? "Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ ØªØ·Ø¨ÙŠÙ‚ Ù…ØµØ§Ø¯Ù‚Ø© Ù…ÙˆØ«Ù‘Ù‚ Ù„Ù‡Ø°Ø§ Ø§Ù„Ø­Ø³Ø§Ø¨."
              : "No verified authenticator was found for this account."
          );
          setLoading(false);
          return;
        }

        setFactor({
          id: verifiedTotpFactor.id,
          factor_type: verifiedTotpFactor.factor_type,
          status: verifiedTotpFactor.status,
        });

        setLoading(false);
      } catch (err) {
        console.error("MFA initialization error:", err);

        if (!mounted) {
          return;
        }

        setError(
          isArabic
            ? "ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØªØ­Ù‚Ù‚ Ø¨Ø®Ø·ÙˆØªÙŠÙ†. ÙŠØ±Ø¬Ù‰ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰."
            : "Unable to load two-factor verification. Please sign in again."
        );
        setLoading(false);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [router, isArabic]);

  const handleCodeChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
    setCode(digitsOnly);

    if (error) {
      setError("");
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!factor) {
      setError(
        isArabic
          ? "لا يوجد تطبيق مصادقة موثّق متاح."
          : "No verified authenticator is available."
      );
      return;
    }

    if (code.length !== 6) {
      setError(
        isArabic
          ? "أدخل رمز التحقق المكوّن من 6 أرقام."
          : "Enter the 6-digit verification code."
      );
      return;
    }

    if (!supabase) {
      setError(
        isArabic
          ? "خدمة المصادقة غير مهيأة."
          : "Authentication service is not configured."
      );
      return;
    }

    try {
      setVerifying(true);
      setError("");

      const { error: verifyError } =
        await supabase.auth.mfa.challengeAndVerify({
          factorId: factor.id,
          code,
        });

      if (verifyError) {
        throw verifyError;
      }

      const { data: aalData, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalError) {
        throw aalError;
      }

      if (aalData?.currentLevel !== "aal2") {
        throw new Error("MFA verification did not reach AAL2.");
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw sessionError ?? new Error("No active session.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role, active")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      setVerifying(false);

if (profile?.role === "super_admin" && profile.active !== false) {
  router.replace("/saas-admin");
} else {
  router.replace("/dashboard");
}
    } catch (err) {
      console.error("MFA verification error:", err);

      setCode("");

      setError(
        isArabic
          ? "رمز التحقق غير صحيح أو انتهت صلاحيته. حاول مرة أخرى."
          : "The verification code is incorrect or has expired. Please try again."
      );

      setVerifying(false);
    }
  };
  const handleSignOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } finally {
      router.replace("/login");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-slate-800 dark:border-t-white" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isArabic
              ? "Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØªØ­Ù‚Ù‚..."
              : "Loading verification..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 dark:bg-slate-950"
    >
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          {/* Header */}
          <div className="border-b border-slate-200 px-6 py-7 text-center dark:border-slate-800 sm:px-8">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <rect
                  width="18"
                  height="11"
                  x="3"
                  y="10"
                  rx="2"
                  ry="2"
                />
                <path d="M7 10V7a5 5 0 0 1 10 0v3" />
                <circle cx="12" cy="15.5" r="1" />
                <path d="M12 16.5v2" />
              </svg>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {isArabic
                ? "Ø§Ù„ØªØ­Ù‚Ù‚ Ø¨Ø®Ø·ÙˆØªÙŠÙ†"
                : "Two-factor authentication"}
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
              {isArabic
                ? "Ø§ÙØªØ­ ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© ÙˆØ£Ø¯Ø®Ù„ Ø§Ù„Ø±Ù…Ø² Ø§Ù„Ù…ÙƒÙˆÙ‘Ù† Ù…Ù† 6 Ø£Ø±Ù‚Ø§Ù… Ù„Ù„Ù…ØªØ§Ø¨Ø¹Ø©."
                : "Open your authenticator app and enter the 6-digit code to continue."}
            </p>
          </div>

          {/* Form */}
          <div className="px-6 py-7 sm:px-8">
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
              >
                {error}
              </div>
            )}

            {factor ? (
              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <label
                    htmlFor="otp-code"
                    className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    {isArabic ? "Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚" : "Verification code"}
                  </label>

                  <input
                    id="otp-code"
                    name="otp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                    value={code}
                    onChange={(event) =>
                      handleCodeChange(event.target.value)
                    }
                    placeholder="000000"
                    disabled={verifying}
                    aria-describedby="otp-help"
                    className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-center text-2xl font-semibold tracking-[0.45em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-slate-500 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-700 dark:focus:border-slate-500 dark:focus:ring-white/5"
                  />

                  <p
                    id="otp-help"
                    className="mt-2 text-center text-xs text-slate-500 dark:text-slate-500"
                  >
                    {isArabic
                      ? "Ø§Ù„Ø±Ù…Ø² ÙŠØªØºÙŠØ± ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ ÙƒÙ„ 30 Ø«Ø§Ù†ÙŠØ©."
                      : "The code changes automatically every 30 seconds."}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verifying || code.length !== 6}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dark:focus:ring-white/10"
                >
                  {verifying ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900" />
                      {isArabic
                        ? "Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ù‚Ù‚..."
                        : "Verifying..."}
                    </>
                  ) : isArabic ? (
                    "ØªØ­Ù‚Ù‚ ÙˆØ§Ù„Ù…ØªØ§Ø¨Ø¹Ø©"
                  ) : (
                    "Verify & Continue"
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
                  {isArabic
                    ? "Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø¹Ø§Ù…Ù„ Ù…ØµØ§Ø¯Ù‚Ø© Ù…ÙˆØ«Ù‘Ù‚. ÙŠØ±Ø¬Ù‰ Ø§Ù„ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù†Ø¸Ø§Ù… Ù‚Ø¨Ù„ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©."
                    : "A verified authenticator factor could not be found. Please contact your system administrator before continuing."}
                </div>
              </div>
            )}

            {/* Account action */}
            <div className="mt-7 border-t border-slate-200 pt-5 text-center dark:border-slate-800">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={verifying}
                className="text-sm font-medium text-slate-600 underline-offset-4 transition hover:text-slate-900 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:text-white"
              >
                {isArabic
                  ? "ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬ ÙˆØ§Ø³ØªØ®Ø¯Ø§Ù… Ø­Ø³Ø§Ø¨ Ø¢Ø®Ø±"
                  : "Sign out and use a different account"}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-600">
          TravelDesk Pro
        </p>
      </div>
    </main>
  );
}

