"use client";

import { useActionState } from "react";
import { sendOtp, signInWithGoogle, verifyOtp, type OtpState } from "@/app/login/actions";

export function LoginForm({ next }: { next: string }) {
  const [sent, send, sending] = useActionState<OtpState, FormData>(sendOtp, { step: "phone" });
  const [verified, verify, verifying] = useActionState<OtpState, FormData>(verifyOtp, { step: "code" });
  const onCode = sent.step === "code" && verified.step !== "phone";
  const phone = verified.phone ?? sent.phone ?? "";

  return (
    <div className="flex flex-col gap-5">
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button type="submit" className="btn btn-outline w-full">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h6c-.3 1.4-1 2.6-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9C3.9 20.6 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.8 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7H2.1C1.4 8.5 1 10.2 1 12s.4 3.5 1.1 5l3.7-2.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.5 2.1 15 1 12 1 7.7 1 3.9 3.4 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z"/></svg>
          Continue with Google
        </button>
      </form>

      <p aria-hidden="true" className="flex items-center gap-3 text-[13px] text-subtle before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
        or use your mobile number
      </p>

      {!onCode ? (
        <form action={send} className="flex flex-col gap-3.5">
          {sent.error && <p role="alert" className="alert alert-error">{sent.error}</p>}
          <label className="field"><span className="label">Mobile number</span>
            <span className="prefix"><span>+673</span><input name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="7XX XXXX" required /></span>
          </label>
          <button type="submit" className="btn btn-dark w-full" disabled={sending}>{sending ? "Sending code…" : "Send code by SMS"}</button>
        </form>
      ) : (
        <form action={verify} className="flex flex-col gap-3.5">
          {sent.info && !verified.error && <p role="status" className="alert alert-ok">{sent.info}</p>}
          {verified.error && <p role="alert" className="alert alert-error">{verified.error}</p>}
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="next" value={next} />
          <label className="field"><span className="label">6-digit code</span>
            <input className="input text-center text-2xl tracking-[0.4em]" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus />
          </label>
          <button type="submit" className="btn btn-dark w-full" disabled={verifying}>{verifying ? "Checking…" : "Verify and sign in"}</button>
          <button type="button" className="text-sm font-bold text-accent" onClick={() => window.location.reload()}>Use a different number</button>
        </form>
      )}
    </div>
  );
}
