"use client";
import { useState, useTransition } from "react";
import { sendRemindersNow, sendGoldenNow } from "@/app/actions/admin";

export default function ReminderButton() {
  const [res, setRes] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-4">
      <button disabled={pending} className="btn-ghost" onClick={() => start(async () => { const r = await sendRemindersNow(); setRes(`Checked ${r.checked}, sent ${r.sent}`); })}>Send abandoned-cart reminders now</button>
      <button disabled={pending} className="btn-ghost" onClick={() => { if (!confirm("Send the Golden Friday announcement to every user who has not received it yet?")) return; start(async () => { const r = await sendGoldenNow(); setRes(!r.live ? "Campaign is not live — nothing sent" : r.error && !r.sent ? `Failed: ${r.error}` : `Golden Friday: sent ${r.sent}, failed ${r.failed}${r.pending === 0 ? " (everyone already received it)" : ""}`); }); }}>Send Golden Friday announcement</button>
      {res && <span className="text-sm text-gold">{res}</span>}
    </div>
  );
}
