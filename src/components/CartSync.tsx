"use client";
import { useEffect, useRef } from "react";
import { useCart, type CartLine } from "@/lib/cart-store";
import { syncCart, loadCart } from "@/app/actions/cart";
import { supabaseBrowser } from "@/lib/supabase/client";
import { imageUrl, effectivePrice } from "@/lib/format";
import type { Product } from "@/lib/types";

/** For signed-in users: hydrate the cart from DB on first load (if local is empty) and debounce-save changes. */
export default function CartSync({ loggedIn }: { loggedIn: boolean }) {
  const lines = useCart((s) => s.lines);
  const replace = useCart((s) => s.replace);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!loggedIn || hydrated.current) return;
    hydrated.current = true;
    (async () => {
      if (useCart.getState().lines.length) return; // local cart wins; it will be saved below
      const remote = await loadCart();
      if (!remote.length) return;
      const { data } = await supabaseBrowser().from("products").select("*, product_images(path, sort_order)").in("id", remote.map((r) => r.product_id));
      const next: CartLine[] = (data as Product[] | null ?? []).map((p) => ({
        product_id: p.id, slug: p.slug, title: p.title_en, image: p.product_images?.[0] ? imageUrl(p.product_images[0].path) : null,
        price: effectivePrice(p), stock: p.stock_qty, qty: Math.min(remote.find((r) => r.product_id === p.id)!.qty, Math.max(1, p.stock_qty)),
      }));
      replace(next);
    })();
  }, [loggedIn, replace]);

  useEffect(() => {
    if (!loggedIn || !hydrated.current) return;
    const t = setTimeout(() => { syncCart(lines.map((l) => ({ product_id: l.product_id, qty: l.qty }))); }, 800);
    return () => clearTimeout(t);
  }, [lines, loggedIn]);

  return null;
}
