'use client';

import { useState, useEffect } from 'react';
import { adminListCoupons, adminCreateCoupon, adminDeleteCoupon, adminToggleCoupon } from '@/app/actions/admin';

type Coupon = {
  id: string;
  code: string;
  type?: string | null;
  value?: number | null;
  discount_percent?: number | null;
  discount_amount?: number | null;
  used_count?: number | null;
  max_uses?: number | null;
  expires_at?: string | null;
  free_shipping?: boolean;
  first_order_only?: boolean;
  is_active?: boolean;
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [type, setType] = useState('percent');
  const [value, setValue] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [freeShipping, setFreeShipping] = useState(false);
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      setCoupons((await adminListCoupons()) as Coupon[]);
    } catch (e) {
      console.error('Failed to load coupons', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      alert('Please enter coupon code');
      return;
    }

    setSaving(true);
    const numVal = parseFloat(value || '0');
    const codeUpper = code.trim().toUpperCase();

    const res = await adminCreateCoupon({
      code: codeUpper,
      type: (['fixed', 'BUNDLE_2X100_FREE50', 'BUNDLE_2X50_THIRD_HALF'].includes(type) ? type : 'percent') as any,
      value: numVal,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      max_uses: maxUses ? parseInt(maxUses) : null,
      free_shipping: freeShipping,
      first_order_only: firstOrderOnly,
    });
    const error = res.ok ? null : { message: res.error };
    setSaving(false);

    if (error) {
      alert('Error creating coupon: ' + error.message);
    } else {
      showToast('Coupon created successfully!');
      setCode('');
      setValue('');
      setExpiresAt('');
      setMaxUses('');
      setFreeShipping(false);
      setFirstOrderOnly(false);
      fetchCoupons();
    }
  };

  const handleToggle = async (c: Coupon) => {
    const res = await adminToggleCoupon(c.id, !c.is_active);
    if (res.ok) { showToast(c.is_active ? 'Coupon paused' : 'Coupon activated'); fetchCoupons(); }
    else alert('Error: ' + res.error);
  };

  const handleDeleteCoupon = async (id: string, codeName: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${codeName}"?`)) return;
    const res = await adminDeleteCoupon(id);
    if (res.ok) {
      showToast('Coupon deleted!');
      fetchCoupons();
    } else {
      alert('Error deleting coupon: ' + res.error);
    }
  };

  return (
    <div className="space-y-8 text-cream max-w-6xl mx-auto p-4">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gold2 text-ink px-4 py-2 rounded font-semibold shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSaveCoupon} className="border border-white/10 bg-surface p-5 space-y-4 rounded">
        <h3 className="text-gold font-bold text-lg border-b border-white/10 pb-2">Create New Coupon</h3>

        <div className="grid gap-3 sm:grid-cols-5">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            placeholder="CODE (e.g. AURAFIRST)"
            className="input uppercase bg-ink/50 border border-white/20 p-3 rounded text-cream"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input bg-ink/50 border border-white/20 p-3 rounded text-cream"
          >
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed Amount (EGP)</option>
            <option value="BUNDLE_2X100_FREE50">Offer: 2 x 100ML + a 50ML free</option>
            <option value="BUNDLE_2X50_THIRD_HALF">Offer: 3 x 50ML, third at 50% off</option>
          </select>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="number"
            step="0.01"
            min="0"
            placeholder={type.startsWith('BUNDLE_') ? 'Value (not used for offers)' : 'Value (e.g. 10)'}
            disabled={type.startsWith('BUNDLE_')}
            className="input bg-ink/50 border border-white/20 p-3 rounded text-cream"
          />
          <input
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            type="datetime-local"
            className="input bg-ink/50 border border-white/20 p-3 rounded text-cream"
          />
          <input
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            type="number"
            min="1"
            placeholder="Max uses"
            className="input bg-ink/50 border border-white/20 p-3 rounded text-cream"
          />
        </div>

        {/* Extra Options */}
        <div className="flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gold">
            <input
              type="checkbox"
              checked={freeShipping}
              onChange={(e) => setFreeShipping(e.target.checked)}
              className="w-4 h-4 accent-gold cursor-pointer"
            />
            🚚 Free Shipping (إلغاء مصاريف الشحن)
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-gold">
            <input
              type="checkbox"
              checked={firstOrderOnly}
              onChange={(e) => setFirstOrderOnly(e.target.checked)}
              className="w-4 h-4 accent-gold cursor-pointer"
            />
            🎉 First Order Only (للطلب الأول فقط لكل عميل)
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gold2 hover:bg-gold text-ink font-bold p-3 uppercase tracking-wider rounded transition disabled:opacity-50"
        >
          {saving ? 'SAVING...' : 'SAVE COUPON'}
        </button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto border border-white/10 bg-surface rounded">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase tracking-widest text-gold/70 border-b border-white/10 bg-ink/30">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Type</th>
              <th className="p-3">Value</th>
              <th className="p-3">Restrictions</th>
              <th className="p-3">Used</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-cream/50">
                  Loading coupons...
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-cream/50 italic">
                  No coupons found.
                </td>
              </tr>
            ) : (
              coupons.map((c) => {
                const val = c.value ?? c.discount_percent ?? c.discount_amount ?? 0;
                return (
                  <tr key={c.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="p-3 font-mono font-bold text-gold">
                      {c.code}
                      {c.is_active === false && <span className="ms-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-normal text-cream/60">PAUSED</span>}
                    </td>
                    <td className="p-3 uppercase text-xs text-cream/70">{c.type === 'BUNDLE_2X100_FREE50' ? '2x100ML + 50ML free' : c.type === 'BUNDLE_2X50_THIRD_HALF' ? '3x50ML, 3rd -50%' : c.type || 'percent'}</td>
                    <td className="p-3 font-mono">
                      {String(c.type).startsWith('BUNDLE_') ? 'Offer' : `${val} ${c.type === 'fixed' ? 'EGP' : '%'}`}
                    </td>
                    <td className="p-3 text-xs space-y-1">
                      {c.free_shipping && <div className="text-green-400">🚚 Free Shipping</div>}
                      {c.first_order_only && <div className="text-gold">🎉 First Order Only</div>}
                      {!c.free_shipping && !c.first_order_only && <div className="text-cream/40">—</div>}
                    </td>
                    <td className="p-3 font-mono">
                      {c.used_count ?? 0} / {c.max_uses ?? '∞'}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleToggle(c)}
                        className="px-3 py-1 border border-gold/60 text-gold hover:bg-gold hover:text-ink rounded text-xs font-semibold"
                      >
                        {c.is_active === false ? 'Activate' : 'Pause'}
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(c.id, c.code)}
                        className="px-3 py-1 bg-red-600/80 hover:bg-red-600 text-cream rounded text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
