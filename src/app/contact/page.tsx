import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const s: any = await getSettings();
  const email = s?.contact_email || "aurafragrances111@gmail.com";
  const wa = String(s?.whatsapp_number ?? "").replace(/\D/g, "");
  const phone = s?.contact_phone || (wa ? `+${wa}` : "");
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="h-display text-4xl text-cream">Contact Us • تواصل معنا</h1>
        <p className="text-cream/60 text-sm">We are always here to assist you with your orders and inquiries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-surface/80 border border-white/10 space-y-2 text-center">
          <h3 className="text-gold font-medium">Email</h3>
          <a href={`mailto:${email}`} className="text-sm text-cream/70 hover:text-gold">{email}</a>
        </div>
        <div className="p-6 rounded-2xl bg-surface/80 border border-white/10 space-y-2 text-center">
          <h3 className="text-gold font-medium">WhatsApp / Customer Care</h3>
          {wa ? (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" dir="ltr" className="text-sm text-cream/70 hover:text-gold">{phone}</a>
          ) : (
            <p dir="ltr" className="text-sm text-cream/70">{phone}</p>
          )}
        </div>
      </div>
    </div>
  );
}
