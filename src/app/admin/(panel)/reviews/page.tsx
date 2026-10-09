import { supabaseServer } from "@/lib/supabase/server";
import { moderateReview } from "@/app/actions/admin";

export default async function Reviews() {
  const { data } = await supabaseServer().from("reviews").select("id, rating, body, is_approved, products(title_en)").order("created_at", { ascending: false });
  return (
    <div className="space-y-3">
      {(data ?? []).length === 0 && <p className="text-cream/50">No reviews yet.</p>}
      {(data ?? []).map((r: any) => (
        <div key={r.id} className="flex items-start justify-between gap-4 border border-white/5 bg-surface p-4">
          <div><p className="text-xs text-cream/50">{r.products?.title_en} · {r.is_approved ? "Approved" : "Pending"}</p><p className="text-gold">{"★".repeat(r.rating)}</p><p className="text-sm">{r.body}</p></div>
          <div className="flex gap-2">
            {!r.is_approved && <form action={moderateReview.bind(null, r.id, true)}><button className="btn-gold !px-3 !py-1">Approve</button></form>}
            <form action={moderateReview.bind(null, r.id, false)}><button className="btn-ghost !px-3 !py-1">Delete</button></form>
          </div>
        </div>))}
    </div>
  );
}
