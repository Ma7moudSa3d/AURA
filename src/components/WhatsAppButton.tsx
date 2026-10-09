import { waLink } from "@/lib/format";

export default function WhatsAppButton({ number, message, label, className = "btn-ghost" }: { number: string; message: string; label: string; className?: string }) {
  return (
    <a href={waLink(number, message)} target="_blank" rel="noopener noreferrer" className={className}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M3 21l1.6-4.7A9 9 0 1 1 8 19.6L3 21Z" />
        <path d="M9 8.5c0 3.5 3 6.5 6.500 6.500l1-1.500-2-1-1 .8c-1-.4-2-1.400-2.400-2.400l.8-1-1-2L9 8.500Z" />
      </svg>
      {label}
    </a>
  );
}
