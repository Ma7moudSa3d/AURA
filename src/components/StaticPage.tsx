export default function StaticPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container-x max-w-3xl py-16">
      <h1 className="h-display mb-8 text-5xl">{title}</h1>
      <div className="space-y-4 leading-relaxed text-cream/75">{children}</div>
    </div>
  );
}
