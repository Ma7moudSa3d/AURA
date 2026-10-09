"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/app/actions/auth";

export default function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const t = useTranslations("account");
  const a = useTranslations("auth");
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();
  return (
    <form className="max-w-md space-y-4" action={(fd) => start(async () => { const r = await updateProfile(fd); setOk(r.ok); })}>
      <div><label className="label">{a("name")}</label><input name="full_name" defaultValue={name} required className="input" /></div>
      <div><label className="label">Phone</label><input name="phone" defaultValue={phone} className="input" /></div>
      <button disabled={pending} className="btn-gold">{t("save")}</button>
      {ok && <span className="ms-3 text-gold">✓</span>}
    </form>
  );
}
