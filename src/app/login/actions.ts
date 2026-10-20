"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone, safeNext } from "@/lib/format";
import { rateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/env";

export type OtpState = { step: "phone" | "code"; phone?: string; error?: string; info?: string };

export async function sendOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const local = normalizePhone(String(formData.get("phone") ?? ""));
  if (!local) return { step: "phone", error: "Please enter a valid Brunei mobile number (7 digits)." };
  if (!(await rateLimit("otp", 5, 900))) return { step: "phone", error: "Too many codes requested. Please wait 15 minutes." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone: `+673${local}` });
  if (error) {
    console.error("signInWithOtp:", error.message);
    return { step: "phone", error: "We couldn't send the code. Please check the number and try again in a minute." };
  }
  return { step: "code", phone: local, info: `We sent a 6-digit code by SMS to +673 ${local}.` };
}

export async function verifyOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const local = normalizePhone(String(formData.get("phone") ?? ""));
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");
  const next = safeNext(String(formData.get("next") ?? ""));
  if (!local) return { step: "phone", error: "Please enter your mobile number again." };
  if (token.length < 6) return { step: "code", phone: local, error: "Enter the 6-digit code from the SMS." };
  if (!(await rateLimit("otp-verify", 10, 900))) return { step: "code", phone: local, error: "Too many attempts. Please wait 15 minutes." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ phone: `+673${local}`, token, type: "sms" });
  if (error) return { step: "code", phone: local, error: "That code is wrong or has expired. Request a new one." };
  redirect(next);
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? ""));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${SITE_URL()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}
