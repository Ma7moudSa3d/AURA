"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus, getProofUrl } from "@/app/actions/admin";
import { ORDER_STATUSES } from "@/lib/types";

export default function OrderAdminPanel({ id, status, note, proofPath }: { id: string; status: string; note: string; proofPath: string | null }) {
  const router = useRouter();
  const [s, setS] = useState(status);
  const [n, setN] = useState(note);
  const [proof, setProof] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-4 border border-white/5 bg-surface p-5">
      <select value={s} onChange={(e) => setS(e.target.value)} className="input">{ORDER_STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
      <textarea value={n} onChange={(e) => setN(e.target.value)} rows={3} maxLength={1000} placeholder="Internal admin note" className="input" />
      <button disabled={pending} className="btn-gold" onClick={() => start(async () => { await updateOrderStatus(id, s, n); setSaved(true); router.refresh(); })}>Save</button>
      {saved && <span className="ms-3 text-gold">✓ saved</span>}
      {proofPath && (
        <div>
          <button className="btn-ghost" onClick={async () => setProof(await getProofUrl(proofPath))}>View payment proof</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {proof && <img src={proof} alt="Payment proof" className="mt-4 max-h-[480px] border border-white/10" />}
        </div>
      )}
    </div>
  );
}
