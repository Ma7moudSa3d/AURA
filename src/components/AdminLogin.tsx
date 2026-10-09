"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminPasswordStep, adminOtpStep } from "@/app/actions/auth";
import { supabaseBrowser } from "@/lib/supabase/client";

type Step = "password" | "otp" | "totp";

export default function AdminLogin({ initialStep }: { initialStep: Step }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialStep);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enroll, setEnroll] = useState<{ qr: string; secret: string } | null>(null);

  async function prepareTotp() {
    const sb = supabaseBrowser();
    const { data } = await sb.auth.mfa.listFactors();
    const verified = data?.totp?.find((f) => f.status === "verified");
    if (verified) { setFactorId(verified.id); setEnroll(null); }
    else {
      // clear stale unverified factors, then enroll a fresh one
      for (const f of data?.all ?? []) if (f.status === "unverified") await sb.auth.mfa.unenroll({ factorId: f.id });
      const { data: e, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "AURA admin" });
      if (error || !e) { setErr("Could not start MFA enrolment"); return; }
      setFactorId(e.id); setEnroll({ qr: e.totp.qr_code, secret: e.totp.secret });
    }
  }
  // If the page loaded straight into the TOTP step
  if (step === "totp" && !factorId && !err) { prepareTotp(); }

  const input = "input text-center tracking-[.5em]";
  return (
    <div className="mx-auto max-w-md space-y-5 border border-gold2/40 bg-surface p-8">
      <h1 className="h-display gold-text text-center text-4xl tracking-[.3em]">AURA</h1>
      <p className="text-center text-xs uppercase tracking-widest text-cream/50">
        {step === "password" ? "Owner sign-in · 1/3" : step === "otp" ? "Email code · 2/3" : "Authenticator · 3/3"}
      </p>

      {step === "password" && (
        <form className="space-y-4" action={(fd) => start(async () => {
          setErr(null); const r = await adminPasswordStep(fd);
          if (r.ok) setStep("otp"); else setErr("Invalid credentials or rate limited.");
        })}>
          <input name="email" type="email" required placeholder="Email" className="input" autoComplete="username" />
          <input name="password" type="password" required minLength={8} placeholder="Password" className="input" autoComplete="current-password" />
          <button disabled={pending} className="btn-gold w-full">Continue</button>
        </form>
      )}

      {step === "otp" && (
        <form className="space-y-4" action={(fd) => start(async () => {
          setErr(null); const r = await adminOtpStep(fd);
          if (r.ok) { setStep("totp"); } else setErr("Invalid or expired code.");
        })}>
          <p className="text-sm text-cream/60">Enter the code emailed to the owner address.</p>
          <input name="code" inputMode="numeric" pattern="\d{6,8}" required placeholder="••••••" className={input} autoComplete="one-time-code" />
          <button disabled={pending} className="btn-gold w-full">Verify</button>
        </form>
      )}

      {step === "totp" && (
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const code = String(new FormData(e.currentTarget).get("code") ?? "");
          start(async () => {
            setErr(null);
            const sb = supabaseBrowser();
            const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: factorId!, code });
            if (error) { setErr("Invalid authenticator code."); return; }
            router.push("/admin"); router.refresh();
          });
        }}>
          {enroll && (
            <div className="space-y-2 text-center text-sm text-cream/70">
              <p>Scan with Google Authenticator, Authy, or 1Password:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enroll.qr} alt="TOTP QR code" className="mx-auto h-44 w-44 bg-white p-2" />
              <p className="break-all font-mono text-xs text-cream/50">{enroll.secret}</p>
            </div>
          )}
          <input name="code" inputMode="numeric" pattern="\d{6}" required placeholder="000000" className={input} autoComplete="one-time-code" />
          <button disabled={pending || !factorId} className="btn-gold w-full">Unlock dashboard</button>
        </form>
      )}
      {err && <p role="alert" className="text-center text-sm text-red-400">{err}</p>}
    </div>
  );
}
