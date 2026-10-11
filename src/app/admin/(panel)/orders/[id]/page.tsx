'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qjwisnczaffrouaadqzg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type OrderItem = {
  id: string;
  product_id: string;
  product_title_snapshot: string;
  qty: number;
  price: number;
  line_total: number;
};

type OrderDetail = {
  id: string;
  user_id: string;
  status: string;
  customer_name: string;
  customer_email: string;
  phone: string;
  shipping_address: string;
  shipping_city: string;
  txn_ref: string | null;
  subtotal: number;
  shipping_fee: number;
  discount_total: number;
  total: number;
  admin_note: string | null;
  payment_proof_url: string | null;
  created_at: string;
  order_items: OrderItem[];
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [status, setStatus] = useState<string>('pending');
  const [adminNote, setAdminNote] = useState<string>('');
  const [paymentProofUrlInput, setPaymentProofUrlInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showProofModal, setShowProofModal] = useState<boolean>(false);
  const [showEditProofModal, setShowEditProofModal] = useState<boolean>(false);

  useEffect(() => {
    if (!orderId) return;

    async function fetchOrder() {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_title_snapshot,
            qty,
            price,
            line_total
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
      } else if (data) {
        setOrder(data);
        setStatus(data.status || 'pending');
        setAdminNote(data.admin_note || '');
        setPaymentProofUrlInput(data.payment_proof_url || '');
      }
      setLoading(false);
    }

    fetchOrder();
  }, [orderId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = async () => {
    if (!orderId) return;
    setSaving(true);

    const { error } = await supabase
      .from('orders')
      .update({
        status: status,
        admin_note: adminNote,
        payment_proof_url: paymentProofUrlInput || null,
      })
      .eq('id', orderId);

    setSaving(false);

    if (error) {
      alert('Error saving order: ' + error.message);
    } else {
      showToast('Order updated successfully!');
      if (order) {
        setOrder({
          ...order,
          status,
          admin_note: adminNote,
          payment_proof_url: paymentProofUrlInput || null,
        });
      }
    }
  };

  const handleViewProof = () => {
    const proofUrl = order?.payment_proof_url || paymentProofUrlInput;
    if (proofUrl && proofUrl.trim() !== '') {
      setShowProofModal(true);
    } else {
      setShowEditProofModal(true);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-white/60">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mb-4"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-white">
        <p className="mb-4">Order not found.</p>
        <button
          onClick={() => router.push('/admin/orders')}
          className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-500"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const activeProofUrl = order.payment_proof_url || paymentProofUrlInput;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 text-white space-y-6">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-amber-600 text-black px-4 py-2 rounded font-medium shadow-lg transition-all">
          {toastMessage}
        </div>
      )}

      <button
        onClick={() => router.push('/admin/orders')}
        className="text-xs uppercase tracking-widest text-white/60 hover:text-white mb-2 inline-flex items-center gap-2"
      >
        ← Back to Orders
      </button>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column: Order Information */}
        <div className="space-y-4 border border-white/5 bg-surface p-5 text-sm">
          <div className="text-amber-500 font-mono break-all font-semibold">
            {order.id}
          </div>

          <div className="space-y-1">
            <div className="font-medium">{order.customer_name || 'Customer'}</div>
            <div className="text-white/70">
              {order.customer_email || 'No email provided'} · {order.phone || 'No phone'}
            </div>
          </div>

          <div className="text-white/80">
            {order.shipping_address || 'No address'}, {order.shipping_city || ''}
          </div>

          {order.txn_ref && (
            <div className="text-white/90 font-mono">
              Txn ref: <span className="text-amber-400">{order.txn_ref}</span>
            </div>
          )}

          <hr className="border-white/10 my-4" />

          {/* Items List */}
          <div className="space-y-3">
            {order.order_items && order.order_items.length > 0 ? (
              order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-1">
                  <div>
                    <span className="font-medium">
                      {item.product_title_snapshot || 'AURA Perfume'}
                    </span>
                    <span className="text-white/50 text-xs ml-2">x {item.qty}</span>
                  </div>
                  <div className="font-mono">
                    {item.line_total ? item.line_total : item.price * item.qty} EGP
                  </div>
                </div>
              ))
            ) : (
              <div className="text-white/40 italic">No order items found</div>
            )}
          </div>

          <hr className="border-white/10 my-4" />

          {/* Financial Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/60">
              <span>Shipping {order.shipping_fee ?? 60} · Discounts {order.discount_total ?? 0}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-amber-500">
              <span>Total</span>
              <span>{order.total} EGP</span>
            </div>
          </div>
        </div>

        {/* Right Column: Status & Payment Proof Actions */}
        <div className="space-y-4 border border-white/5 bg-surface p-5">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-white/70">
              Order Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-black/50 border border-white/20 p-3 text-white uppercase tracking-wider rounded focus:outline-none focus:border-amber-500"
            >
              <option value="pending">PENDING</option>
              <option value="pending_payment_verification">PENDING_PAYMENT_VERIFICATION</option>
              <option value="processing">PROCESSING</option>
              <option value="shipped">SHIPPED</option>
              <option value="delivered">DELIVERED</option>
              <option value="cancelled">CANCELLED</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-white/70">
              Internal Admin Note
            </label>
            <textarea
              rows={4}
              maxLength={1000}
              placeholder="Internal admin note"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="w-full bg-black/50 border border-white/20 p-3 text-white rounded focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-black font-semibold uppercase tracking-widest text-xs transition disabled:opacity-50"
          >
            {saving ? 'SAVING...' : 'SAVE'}
          </button>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleViewProof}
              className="w-full py-3 border border-amber-500/60 text-amber-400 hover:bg-amber-500/10 uppercase tracking-widest text-xs transition flex items-center justify-center gap-2"
            >
              📷 VIEW PAYMENT PROOF
              {activeProofUrl && (
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal 1: Display Image */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-lg max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-lg font-semibold text-amber-500">Payment Proof Image</h3>
              <button
                onClick={() => setShowProofModal(false)}
                className="text-white/60 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-center bg-black/40 p-2 rounded border border-white/5 min-h-[200px] items-center">
              {activeProofUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeProofUrl}
                  alt="Payment Proof"
                  className="max-h-[60vh] object-contain rounded"
                />
              ) : (
                <p className="text-white/50">No image available</p>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  setShowProofModal(false);
                  setShowEditProofModal(true);
                }}
                className="text-xs text-amber-400 underline"
              >
                Change / Edit Proof Link
              </button>
              <div className="flex gap-2">
                {activeProofUrl && (
                  <a
                    href={activeProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 border border-white/20 text-xs uppercase tracking-wider rounded hover:bg-white/10"
                  >
                    Open Full Link
                  </a>
                )}
                <button
                  onClick={() => setShowProofModal(false)}
                  className="px-4 py-2 bg-amber-600 text-black font-semibold text-xs uppercase tracking-wider rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Add/Edit Image Link */}
      {showEditProofModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-lg font-semibold text-amber-500">Payment Proof Link</h3>
              <button
                onClick={() => setShowEditProofModal(false)}
                className="text-white/60 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/70">
              {activeProofUrl
                ? 'Update the URL for the payment proof image:'
                : 'No payment proof image is currently attached. Paste an image URL below:'}
            </p>

            <input
              type="url"
              placeholder="https://..."
              value={paymentProofUrlInput}
              onChange={(e) => setPaymentProofUrlInput(e.target.value)}
              className="w-full bg-black/50 border border-white/20 p-3 text-sm text-white rounded focus:outline-none focus:border-amber-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEditProofModal(false)}
                className="px-4 py-2 border border-white/20 text-xs uppercase tracking-wider rounded hover:bg-white/10"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  await handleSave();
                  setShowEditProofModal(false);
                  if (paymentProofUrlInput) {
                    setShowProofModal(true);
                  }
                }}
                className="px-4 py-2 bg-amber-600 text-black font-semibold text-xs uppercase tracking-wider rounded"
              >
                Save Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
