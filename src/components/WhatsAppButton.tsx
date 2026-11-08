// src/components/WhatsAppButton.tsx
"use client"

interface WhatsAppButtonProps {
  number?: string | null
  message?: string
  label?: string
  className?: string
}

export default function WhatsAppButton({
  number = "",
  message = "Hello AURA",
  label = "Chat on WhatsApp",
  className = "",
}: WhatsAppButtonProps) {
  const cleanNumber = String(number || "").replace(/\D/g, "")
  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={cleanNumber ? url : "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={className || "inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold hover:text-cream transition"}
    >
      <span>💬</span>
      <span>{label}</span>
    </a>
  )
}
