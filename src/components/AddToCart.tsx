"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart-store";

export default function AddToCart(props: { product_id: string; slug: string; title: string; image: string | null; price: number; stock: number }) {
  const t = useTranslations("product");
  const add = useCart((s) => s.add);
  const out = props.stock <= 0;
  return (
    <motion.button whileTap={{ scale: 0.97 }} disabled={out} className="btn-gold w-full" onClick={() => add(props)}>
      {out ? t("soldOut") : t("addToCart")}
    </motion.button>
  );
}
