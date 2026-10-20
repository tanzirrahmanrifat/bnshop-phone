import "server-only";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/format";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

/** Upload one image to the public "media" bucket (admin RLS). Returns its public URL, or null if no file. */
export async function uploadImage(supabase: SupabaseClient, file: FormDataEntryValue | null, folder: string): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Images must be JPG, PNG, WebP or AVIF.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Images must be 5 MB or smaller.");
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

export function str(fd: FormData, key: string, max = 2000): string {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}

export function num(fd: FormData, key: string): number | null {
  const raw = String(fd.get(key) ?? "").trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on" || fd.get(key) === "true";
}

export function slugOr(fd: FormData, key: string, fallbackFrom: string): string {
  return slugify(str(fd, key) || fallbackFrom);
}

/** Redirect back with a message shown by <AdminNotice />. */
export function done(path: string, message: string, isError = false): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${isError ? "error" : "saved"}=${encodeURIComponent(message)}`);
}

/** datetime-local value (Brunei time, UTC+8) → ISO string. */
export function bruneiLocalToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}:00+08:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO → datetime-local value in Brunei time. */
export function isoToBruneiLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 8 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}
