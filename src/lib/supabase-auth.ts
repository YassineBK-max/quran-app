/*
 * ─── Supabase Auth — Email Verification & Password Reset ─────────────────────
 *
 * Dashboard setup (one-time):
 *   Authentication → URL Configuration
 *     Site URL:      https://your-app.com
 *     Redirect URLs: https://your-app.com/auth/verify
 *                    https://your-app.com/auth/reset-password
 *                    http://localhost:3000/auth/verify      (local dev)
 *                    http://localhost:3000/auth/reset-password
 *
 * All functions return null on success and an error string on failure.
 * When Supabase is not configured (!isSupabaseReady), functions return safe
 * no-ops so the app degrades gracefully to the localStorage-only flow.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { supabase, isSupabaseReady } from "./supabase";

// ── Sign-up ────────────────────────────────────────────────────────────────

export async function authSignUp(
  email: string,
  password: string,
  emailRedirectTo: string
): Promise<{ needsVerification: boolean; error: string | null }> {
  if (!supabase || !isSupabaseReady) {
    return { needsVerification: false, error: null };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { needsVerification: false, error: null };
    }
    // Supabase auth failure doesn't break localStorage auth — just skip verification
    console.warn("Supabase signUp:", error.message);
    return { needsVerification: false, error: null };
  }
  // session is null when Supabase requires email confirmation
  const needsVerification = !!data.user && !data.session && !data.user.email_confirmed_at;
  return { needsVerification, error: null };
}

// ── Resend verification email ──────────────────────────────────────────────

export async function authResendVerification(
  email: string,
  emailRedirectTo: string
): Promise<string | null> {
  if (!supabase || !isSupabaseReady) return "Supabase not configured.";
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo },
  });
  return error?.message ?? null;
}

// ── Email confirmation callback ────────────────────────────────────────────
// Handles both PKCE (code param) and OTP (token_hash + type params) flows.

export async function authConfirmEmail(params: {
  code?: string | null;
  tokenHash?: string | null;
  type?: string | null;
}): Promise<{ email: string | null; error: string | null }> {
  if (!supabase) return { email: null, error: "Supabase not configured." };

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) return { email: null, error: error.message };
    return { email: data.session?.user?.email ?? null, error: null };
  }

  if (params.tokenHash && (params.type === "email" || params.type === "signup")) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: params.tokenHash,
      type: "email",
    });
    if (error) return { email: null, error: error.message };
    return { email: data.user?.email ?? null, error: null };
  }

  return { email: null, error: "Missing verification parameters." };
}

// ── Password reset — send email ────────────────────────────────────────────

export async function authSendPasswordReset(
  email: string,
  redirectTo: string
): Promise<string | null> {
  if (!supabase || !isSupabaseReady) {
    return "Password reset requires Supabase to be configured. Contact your administrator.";
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  return error?.message ?? null;
}

// ── Password reset — exchange callback code ────────────────────────────────

export async function authExchangeResetCode(params: {
  code?: string | null;
  tokenHash?: string | null;
  type?: string | null;
}): Promise<{ email: string | null; error: string | null }> {
  if (!supabase) return { email: null, error: "Supabase not configured." };

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) return { email: null, error: error.message };
    return { email: data.session?.user?.email ?? null, error: null };
  }

  if (params.tokenHash && params.type === "recovery") {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: params.tokenHash,
      type: "recovery",
    });
    if (error) return { email: null, error: error.message };
    return { email: data.user?.email ?? null, error: null };
  }

  return { email: null, error: "Missing or invalid reset link parameters." };
}

// ── Password reset — set new password (call after exchangeResetCode) ───────

export async function authSetNewPassword(newPassword: string): Promise<string | null> {
  if (!supabase) return "Supabase not configured.";
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error?.message ?? null;
}

// ── Sign out Supabase session (call alongside local logout) ────────────────

export async function authSignOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut().catch(() => {});
}
