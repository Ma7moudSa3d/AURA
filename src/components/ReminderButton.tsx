"use client";
import { useState, useTransition } from "react";
import { sendRemindersNow } from "@/app/actions/admin";

export default function ReminderButton() {
  const [res, setRes] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-4">
      <button disabled={pending} className="btn-ghost" onClick={() => start(async () => { const r = await sendRemindersNow(); setRes(`Checked ${r.checked}, sent ${r.sent}`); })}>Send abandoned-cart reminders now</button>
      {res && <span className="text-sm text-gold">{res}</span>}
    </div>
  );
}
