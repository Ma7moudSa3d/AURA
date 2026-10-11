'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qjwisnczaffrouaadqzg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState<string>('pending');
  const [adminNote, setAdminNote] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [showProofModal, setShowProofModal] = useState<boolean>(false);

  const getPublicUrl = (path: string, bucket: string) => {
    const clean = path.replace(/^(payment-proofs|receipts|proofs)\//, '').replace(/^\/+/, '');
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${clean}`;
  };

  useEffect(() => {
    if (!orderId) return;

    async function fetchOrder() {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (*)`)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
      } else if (data) {
        setOrder(data);
        setStatus(data.status || 'pending');
        setAdminNote(data.admin_note || '');

        const rawPath = data.payment_proof_path || '';
        const rawUrl = data.payment_proof_url || '';

        if (rawUrl && rawUrl.startsWith('http')) {
          setImageUrl(rawUrl);
        } else if (rawPath && rawPath.startsWith('http')) {
          setImageUrl(rawPath);
        } else if (rawPath) {
          setImageUrl(getPublicUrl(rawPath, 'payment-proofs'));
        }
      }
      setLoading(false);
    }

    fetchOrder();
  }, [orderId]);

  // Fallback to "receipts" bucket if image in "payment-proofs" fails
  const handleImageError = () => {
    const path = order?.payment_proof_path || '';
    if (path && imageUrl.includes('payment-proofs')) {
      setImageUrl(getPublicUrl(path, 'receipts'));
    }
  };

  const handleSave = async () => {
    if (!orderId) return;
    setSaving(true);

    const { error } = await supabase
      .from('orders')
      .update({
        status,
        admin_note: adminNote,
        payment_proof_url: imageUrl || null,
      })
      .eq('id', orderId);

    setSaving(false);

    if (error) {
      alert('Error saving order: ' + error.message);
    } else {
      alert('Order updated successfully!');
      if (order) {
        setOrder({ ...order, status, admin_note: adminNote });
      }
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-white/60">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="p-12 text-center text-white">
        <p className="mb-4">Order not found.</p>
        <button onClick={() => router.push('/admin/orders')} className="px-4 py-2 bg-amber-600 rounded">
          Back to Orders
        </button>
      </div>
    );
  }

  const txnRef = order.transaction_reference_id || order.txn_ref || '';
  const phone = order.customer_phone || order.phone || '';
  const address = order.address_line1 || order.shipping_address || '';
  const city = order.city || order.shipping_city || '';

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 text-white space-y-6">
      <button
        onClick={() => router.push('/admin/orders')}
        className="text-xs uppercase tracking-widest text-white/60 hover:text-white mb-2 inline-flex items-center gap-2"
      >
        ← Back to Orders
      </button>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Order Info */}
        <div className="space-y-4 border border-white/5 bg-surface p-5 text-sm">
          <div className="text-amber-500 font-mono break-all font-semibold">{order.id}</div>
          <div className="space-y-1">
            <div className="font-medium">{order.customer_name || 'Customer'}</div>
            <div className="text-white/70">
              {order.customer_email || 'No email'} · {phone || 'No phone'}
            </div>
          </div>
          <div className="text-white/80">{address || 'No address'}, {city}</div>
          {txnRef && (
            <div className="text-white/90 font-mono break-all">
              Txn ref: <span className="text-amber-400">{txnRef}</span>
            </div>
          )}
          <hr className="border-white/10 my-4" />
          <div className="space-y-3">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center py-1">
                <div>
                  <span className="font-medium">{item.product_title_snapshot || 'AURA Perfume'}</span>
                  <span className="text-white/50 text-xs ml-2">x {item.qty}</span>
                </div>
                <div className="font-mono">{item.line_total || item.price * item.qty} EGP</div>
              </div>
            ))}
          </div>
          <hr className="border-white/10 my-4" />
          <div className="flex justify-between text-lg font-bold text-amber-500">
            <span>Total</span>
            <span>{order.total} EGP</span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="space-y-4 border border-white/5 bg-surface p-5">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-white/70">Order Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-black/50 border border-white/20 p-3 text-white uppercase tracking-wider rounded"
            >
              <option value="pending">PENDING</option>
              <option value="processing">PROCESSING</option>
              <option value="shipped">SHIPPED</option>
              <option value="delivered">DELIVERED</option>
              <option value="cancelled">CANCELLED</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-white/70">Internal Admin Note</label>
            <textarea
              rows={4}
              placeholder="Internal admin note"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="w-full bg-black/50 border border-white/20 p-3 text-white rounded"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-black font-semibold uppercase tracking-widest text-xs transition disabled:opacity-50"
          >
            {saving ? 'SAVING...' : 'SAVE'}
          </button>

          <button
            onClick={() => setShowProofModal(true)}
            className="w-full py-3 border border-amber-500/60 text-amber-400 hover:bg-amber-500/10 uppercase tracking-widest text-xs transition flex items-center justify-center gap-2"
          >
            📷 VIEW PAYMENT PROOF
            {imageUrl && <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>}
          </button>
        </div>
      </div>

      {/* Modal */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-lg max-w-2xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-lg font-semibold text-amber-500">Payment Proof Image</h3>
              <button onClick={() => setShowProofModal(false)} className="text-white text-xl">✕</button>
            </div>

            <div className="flex justify-center bg-black/40 p-2 rounded border border-white/5 min-h-[300px] items-center">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Payment Proof"
                  className="max-h-[60vh] object-contain rounded"
                  onError={handleImageError}
                />
              ) : (
                <p className="text-white/50">No image available</p>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 border border-white/20 text-xs uppercase tracking-wider rounded hover:bg-white/10"
              >
                Open Full Link
              </a>
              <button
                onClick={() => setShowProofModal(false)}
                className="px-4 py-2 bg-amber-600 text-black font-semibold text-xs uppercase tracking-wider rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
