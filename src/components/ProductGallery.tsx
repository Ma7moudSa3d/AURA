"use client";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  if (!images.length) return <div className="grid aspect-[4/5] place-items-center bg-surface2 h-display text-7xl text-gold/30">A</div>;
  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden bg-surface2">
        <AnimatePresence mode="wait">
          <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Image src={images[i]} alt={alt} fill priority sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
          </motion.div>
        </AnimatePresence>
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((src, n) => (
            <button key={src} onClick={() => setI(n)} aria-label={`Image ${n + 1}`}
              className={`relative h-20 w-16 overflow-hidden border transition ${n === i ? "border-gold shadow-glow" : "border-white/10 opacity-60 hover:opacity-100"}`}>
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
