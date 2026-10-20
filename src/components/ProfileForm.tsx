"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/account/actions";

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  return (
    <form action={action} className="flex flex-col gap-3.5">
      {state.error && <p role="alert" className="alert alert-error">{state.error}</p>}
      {state.ok && <p role="status" className="alert alert-ok">Saved.</p>}
      <label className="field"><span className="label">Full name</span><input className="input" name="full_name" defaultValue={name} required /></label>
      <label className="field"><span className="label">Mobile number</span>
        <span className="prefix"><span>+673</span><input name="phone" type="tel" inputMode="numeric" defaultValue={phone} placeholder="7XX XXXX" /></span>
      </label>
      <button type="submit" className="btn btn-dark" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}
