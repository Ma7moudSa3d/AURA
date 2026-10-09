"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({ onDelete, label = "Delete" }: { onDelete: () => Promise<void>; label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} className="text-xs text-red-400 hover:underline"
      onClick={() => { if (confirm("Are you sure?")) start(async () => { await onDelete(); router.refresh(); }); }}>{label}</button>
  );
}
