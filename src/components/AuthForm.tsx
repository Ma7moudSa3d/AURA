"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { login, signup, forgotPassword, updatePassword, type Res } from "@/app/actions/auth";

type Mode = "login" | "signup" | "forgot" | "reset";

export default function AuthForm({ mode, next = "/" }: { mode: Mode; next?: string }) {
  const t = useTranslations("auth");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const action = { login, signup, forgot: forgotPassword, reset: updatePassword }[mode];
  const q = next && next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form className="mx-auto max-w-md space-y-5 border border-white/5 bg-surface p-8"
      action={(fd) => start(async () => {
        setMsg(null);
        const r: Res | undefined = await action(fd);
        if (!r) return; // redirected
        if (r.ok) setMsg({ kind: "ok", text: r.info === "VERIFY" ? t("verify") : r.info === "SENT" ? t("resetSent") : "✓" });
        else setMsg({ kind: "err", text: t("error") });
      })}>
      <h1 className="h-display text-4xl">{{ login: t("loginTitle"), signup: t("signupTitle"), forgot: t("resetTitle"), reset: t("newPassword") }[mode]}</h1>
      <input type="hidden" name="next" value={next} />
      {mode === "signup" && <div><label className="label">{t("name")}</label><input name="full_name" required minLength={2} className="input" autoComplete="name" /></div>}
      {mode !== "reset" && <div><label className="label">{t("email")}</label><input name="email" type="email" required className="input" autoComplete="email" /></div>}
      {mode !== "forgot" && <div><label className="label">{mode === "reset" ? t("newPassword") : t("password")}</label>
        <input name="password" type="password" required minLength={8} className="input" autoComplete={mode === "login" ? "current-password" : "new-password"} /></div>}
      {msg && <p role="alert" className={msg.kind === "ok" ? "text-sm text-gold" : "text-sm text-red-400"}>{msg.text}</p>}
      <button disabled={pending} className="btn-gold w-full">
        {{ login: t("login"), signup: t("signup"), forgot: t("reset"), reset: t("update") }[mode]}
      </button>
      <div className="space-y-2 text-center text-sm text-cream/60">
        {mode === "login" && <><p><Link className="text-gold" href="/forgot-password">{t("forgot")}</Link></p><p>{t("noAccount")} <Link className="text-gold" href={`/signup${q}`}>{t("signup")}</Link></p></>}
        {mode === "signup" && <p>{t("haveAccount")} <Link className="text-gold" href={`/login${q}`}>{t("login")}</Link></p>}
      </div>
    </form>
  );
}
