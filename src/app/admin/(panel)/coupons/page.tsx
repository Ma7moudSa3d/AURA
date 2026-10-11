'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qjwisnczaffrouaadqzg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('code');

    if (error) {
      console.error('Error fetching coupons:', error);
    } else {
      setCoupons(data || []);
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
    if (!code.trim() || !value) {
      alert('Please fill in required fields');
      return;
    }

    setSaving(true);
    const numVal = parseFloat(value);
    const codeUpper = code.trim().toUpperCase();

    const discountPercent = type === 'percent' ? numVal : 0;
    const discountAmount = type === 'fixed' ? numVal : 0;

    const payload = {
      code: codeUpper,
      type: type,
      value: numVal,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      max_uses: maxUses ? parseInt(maxUses) : null,
      is_active: true,
      used_count: 0,
    };

    const { error } = await supabase.from('coupons').insert(payload);

    setSaving(false);

    if (error) {
      alert('Error creating coupon: ' + error.message);
    } else {
      showToast('Coupon created successfully!');
      setCode('');
      setValue('');
      setExpiresAt('');
      setMaxUses('');
      fetchCoupons();
    }
  };

  const handleDeleteCoupon = async (id: string, codeName: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${codeName}"?`)) return;

    const { error } = await supabase.from('coupons').delete().eq('id', id);

    if (error) {
      alert('Error deleting coupon: ' + error.message);
    } else {
      showToast('Coupon deleted!');
      fetchCoupons();
    }
  };

  return (
    <div className="space-y-8 text-white max-w-6xl mx-auto p-4">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-amber-600 text-black px-4 py-2 rounded font-semibold shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSaveCoupon}
        className="grid gap-3 border border-white/10 bg-surface p-5 sm:grid-cols-5 rounded"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          placeholder="CODE (e.g. AURA10)"
          className="input uppercase bg-black/50 border border-white/20 p-3 rounded text-white"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input bg-black/50 border border-white/20 p-3 rounded text-white"
        >
          <option value="percent">Percent (%)</option>
          <option value="fixed">Fixed Amount (EGP)</option>
        </select>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="Value (e.g. 10)"
          className="input bg-black/50 border border-white/20 p-3 rounded text-white"
        />
        <input
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          type="datetime-local"
          className="input bg-black/50 border border-white/20 p-3 rounded text-white"
        />
        <input
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          type="number"
          min="1"
          placeholder="Max uses"
          className="input bg-black/50 border border-white/20 p-3 rounded text-white"
        />
        <button
          type="submit"
          disabled={saving}
          className="btn-gold sm:col-span-5 bg-amber-600 hover:bg-amber-500 text-black font-bold p-3 uppercase tracking-wider rounded transition disabled:opacity-50"
        >
          {saving ? 'SAVING...' : 'SAVE COUPON'}
        </button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto border border-white/10 bg-surface rounded">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase tracking-widest text-amber-500/70 border-b border-white/10 bg-black/30">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Type</th>
              <th className="p-3">Value</th>
              <th className="p-3">Used</th>
              <th className="p-3">Expires</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-white/50">
                  Loading coupons...
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-white/50 italic">
                  No coupons found. Create one above!
                </td>
              </tr>
            ) : (
              coupons.map((c) => {
                const val = c.value ?? c.discount_percent ?? c.discount_amount ?? 0;
                const couponType = c.type ?? (c.discount_amount ? 'fixed' : 'percent');
                return (
                  <tr key={c.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="p-3 font-mono font-bold text-amber-400">{c.code}</td>
                    <td className="p-3 uppercase text-xs text-white/70">{couponType}</td>
                    <td className="p-3 font-mono">
                      {val} {couponType === 'percent' ? '%' : 'EGP'}
                    </td>
                    <td className="p-3 font-mono">
                      {c.used_count ?? 0} / {c.max_uses ?? '∞'}
                    </td>
                    <td className="p-3 text-xs text-white/70">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteCoupon(c.id, c.code)}
                        className="px-3 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded text-xs font-semibold"
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
