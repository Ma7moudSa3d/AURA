export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <h1 className="h-display text-4xl text-center text-amber-100">Frequently Asked Questions</h1>
      <div className="space-y-4">
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
          <h3 className="text-amber-400 font-medium">How long does shipping take?</h3>
          <p className="text-sm text-neutral-300">Shipping takes 2 to 4 business days anywhere in Egypt.</p>
        </div>
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
          <h3 className="text-amber-400 font-medium">What payment options do you support?</h3>
          <p className="text-sm text-neutral-300">InstaPay (Full or 25% Deposit) and Cash on Delivery (COD).</p>
        </div>
      </div>
    </div>
  );
}
