export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-8">
      <h1 className="h-display text-4xl sm:text-5xl text-cream">Our Story • قصتنا</h1>
      <p className="text-cream/70 text-lg leading-relaxed max-w-2xl mx-auto font-light">
        At AURA, we craft luxury Extrait de Parfum compositions, meticulously formulated in Egypt using premium global ingredients.
      </p>
      <div className="p-8 rounded-2xl bg-surface/80 border border-gold/20 max-w-2xl mx-auto space-y-4 backdrop-blur-md">
        <h2 className="text-xl font-medium text-gold">فن صناعة العطور</h2>
        <p className="text-sm text-cream/60 leading-relaxed">
          في أورا، نبتكر عطوراً فاخرة بتركيز برفيوم عالي يضمن الثبات والفوحان الفريد، مصممة بعناية لتناسب أرقى الأذواق.
        </p>
      </div>
    </div>
  );
}
