"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { formatPhone, normalizePhone } from "@/lib/format";

export type ProfileState = { ok?: boolean; error?: string };

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const parsed = z
    .object({ full_name: z.string().trim().min(1, "Please enter your name.").max(120), phone: z.string().trim().max(20) })
    .safeParse({ full_name: formData.get("full_name"), phone: formData.get("phone") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const local = parsed.data.phone ? normalizePhone(parsed.data.phone) : "";
  if (parsed.data.phone && !local) return { error: "Please enter a valid Brunei mobile number." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, phone: local ? formatPhone(local) : null })
    .eq("id", user.id);
  if (error) return { error: "Could not save. Please try again." };
  revalidatePath("/account");
  return { ok: true };
}
