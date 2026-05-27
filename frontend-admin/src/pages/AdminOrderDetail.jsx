import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import ShippingPanel from '../components/orders/ShippingPanel';

const STATUSES = [
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [trackingNumber, setTrackingNumber] = useState('');

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: async () => {
      const res = await api.get('/orders/' + id);
      return res.data?.data;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  const statusMut = useMutation({
    mutationFn: (status) => api.patch('/orders/' + id + '/status', { status }),
    onSuccess: () => {
      toast.success('Order status updated');
      qc.invalidateQueries({ queryKey: ['admin-order', id] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Unable to update order status'),
  });

  const trackingMut = useMutation({
    mutationFn: () => api.patch('/orders/' + id + '/tracking', { trackingNumber: trackingNumber.trim() }),
    onSuccess: () => {
      toast.success('Tracking updated');
      setTrackingNumber('');
      qc.invalidateQueries({ queryKey: ['admin-order', id] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Unable to update tracking'),
  });


  if (error) return <div className="card p-5 bg-red-50 border border-red-200"><p className="text-red-700 font-semibold">Failed to load order: {error.message}</p></div>;
  if (isLoading) return <div className="card p-5">Loading order details...</div>;
  if (!order) return <div className="card p-5">Order not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black text-[#b88a2f] uppercase tracking-[0.2em] mb-1">Detailed View</p>
          <h1 className="text-2xl font-bold text-[#5b3f2f] truncate">Order {order.orderNumber}</h1>
          <div className="flex items-center gap-3 mt-1">
             <span className={'badge-status ' + order.status.toLowerCase()}>{order.status}</span>
             <span className="text-xs font-semibold text-[#7a655c]/60">{new Date(order.createdAt).toLocaleString('en-IN')}</span>
          </div>
        </div>
        <Link to="/orders" className="btn-ghost justify-center sm:w-auto border-[#5b3f2f]/10 text-[#5b3f2f]">Back to Orders</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items Section */}
          <div className="card luxury-grain overflow-hidden">
            <div className="p-5 border-b border-[#5b3f2f]/5 flex items-center justify-between bg-[#fcf9f6]/50">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#b88a2f]">Purchased Items</h3>
              <span className="px-2 py-1 bg-[#5b3f2f] text-white text-[10px] font-black rounded-full leading-none">{order.items?.length || 0}</span>
            </div>
            <div className="divide-y divide-[#5b3f2f]/5">
              {order.items?.map((item) => (
                <div key={item.id} className="p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-5">
                  {/* Product Image Placeholder or actual if available */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#f5e7d8] border border-[#5b3f2f]/5 shrink-0 overflow-hidden shadow-inner flex items-center justify-center">
                     {item.product?.images?.[0] ? (
                        <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                     ) : <span className="text-2xl">📦</span>}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                       <div>
                         <p className="text-sm font-bold text-[#5b3f2f]">{item.productName || item.product?.name}</p>
                         <p className="text-[10px] font-black text-[#b88a2f] uppercase tracking-widest mt-1">Qty: {item.quantity} · Unit: {item.productUnit || item.product?.unit || 'N/A'}</p>
                       </div>
                       <p className="text-sm font-bold text-[#5b3f2f]">₹{Number(item.total || 0).toLocaleString('en-IN')}</p>
                    </div>

                    {/* Customization Details */}
                    {(item.customizationText || item.customizationImageUrl) && (
                      <div className="mt-4 space-y-3">
                        {item.customizationText && (
                          <div className="bg-[#fcf9f6] border border-[#5b3f2f]/5 rounded-xl p-4 shadow-sm">
                            <p className="text-[9px] font-black text-[#7a655c] uppercase tracking-widest mb-2 flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-[#b88a2f]"></span> Custom Text
                            </p>
                            <p className="text-sm font-medium text-[#5b3f2f] italic">"{item.customizationText}"</p>
                          </div>
                        )}
                        
                        {item.customizationImageUrl && (
                          <div className="bg-[#fcf9f6] border border-[#5b3f2f]/5 rounded-xl p-4 shadow-sm">
                            <p className="text-[9px] font-black text-[#7a655c] uppercase tracking-widest mb-3 flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Customer Asset
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                               <div className="relative group shrink-0">
                                  <img src={item.customizationImageUrl} alt="Custom" className="w-24 h-24 object-cover rounded-xl border border-[#5b3f2f]/10 shadow-md transition-transform group-hover:scale-105" />
                                  <a href={item.customizationImageUrl} target="_blank" className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl text-white text-[10px] font-black uppercase">Open</a>
                               </div>
                               <div className="flex flex-col gap-2 justify-center">
                                  <a href={item.customizationImageUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-[#b88a2f] hover:text-[#5b3f2f] transition-colors">↗ Full Resolution</a>
                                  <a href={item.customizationImageUrl} download={`custom-${item.id}.jpg`} className="text-[10px] font-black uppercase tracking-widest text-green-600 hover:text-green-700 transition-colors">⬇ Download for Print</a>
                               </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card p-6 luxury-grain space-y-4">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#b88a2f] border-b border-[#5b3f2f]/5 pb-4">Shipping Destination</h3>
             {order.address ? (
               <div className="text-sm text-[#5b3f2f] leading-7 bg-[#fcf9f6] p-5 rounded-2xl border border-[#5b3f2f]/5">
                 <p className="font-bold text-base mb-1">{order.address.fullName}</p>
                 <p className="opacity-80 font-medium">{[order.address.line1, order.address.line2].filter(Boolean).join(', ')}</p>
                 <p className="opacity-80 font-medium">{[order.address.city, order.address.state, order.address.pincode].filter(Boolean).join(', ')}</p>
                 <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-[#b88a2f]">{order.address.country || 'India'}</p>
               </div>
             ) : <p className="text-sm text-gray-500 italic">No destination set.</p>}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <div className="card p-6 space-y-6 luxury-grain">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#b88a2f] border-b border-[#5b3f2f]/5 pb-4">Financial Summary</h3>
            <div className="space-y-3 text-sm text-[#5b3f2f]">
              <p className="flex justify-between">
                 <span className="opacity-60">Subtotal</span>
                 <span className="font-bold">₹{Number(order.subtotal || 0).toLocaleString('en-IN')}</span>
              </p>
              <p className="flex justify-between">
                 <span className="opacity-60">Shipping</span>
                 <span className="font-bold">₹{Number(order.shippingCost || 0).toLocaleString('en-IN')}</span>
              </p>
              <div className="pt-3 border-t border-[#5b3f2f]/5">
                 <p className="flex justify-between text-base">
                    <span className="font-black uppercase tracking-widest text-[10px]">Grand Total</span>
                    <span className="font-black text-[#5b3f2f]">₹{Number(order.total || 0).toLocaleString('en-IN')}</span>
                 </p>
              </div>
              <div className="flex items-center justify-between mt-4 p-3 bg-[#fcf9f6] rounded-xl border border-[#5b3f2f]/5">
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Payment Status</span>
                 <span className={'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ' + (order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                    {order.paymentStatus || 'Pending'}
                 </span>
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-6 luxury-grain">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#b88a2f] border-b border-[#5b3f2f]/5 pb-4">Lifecycle Management</h3>
            
            {/* Recommended Quick Actions */}
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#7a655c]/60">Recommended Next Step</p>
              {order.status === 'PENDING' && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={statusMut.isPending}
                    onClick={() => statusMut.mutate('CONFIRMED')}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    ✓ Confirm Order
                  </button>
                  <button
                    type="button"
                    disabled={statusMut.isPending}
                    onClick={() => statusMut.mutate('CANCELLED')}
                    className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 font-bold text-[10px] uppercase tracking-wider hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    ✕ Cancel Order
                  </button>
                </div>
              )}
              {order.status === 'CONFIRMED' && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={statusMut.isPending}
                    onClick={() => statusMut.mutate('PROCESSING')}
                    className="w-full py-3 px-4 rounded-xl bg-purple-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-purple-700 shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    ⚙ Start Processing
                  </button>
                  <button
                    type="button"
                    disabled={statusMut.isPending}
                    onClick={() => statusMut.mutate('CANCELLED')}
                    className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 font-bold text-[10px] uppercase tracking-wider hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    ✕ Cancel Order
                  </button>
                </div>
              )}
              {order.status === 'PROCESSING' && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={statusMut.isPending}
                    onClick={() => statusMut.mutate('SHIPPED')}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    🚚 Mark Shipped
                  </button>
                  <button
                    type="button"
                    disabled={statusMut.isPending}
                    onClick={() => statusMut.mutate('CANCELLED')}
                    className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 font-bold text-[10px] uppercase tracking-wider hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    ✕ Cancel Order
                  </button>
                </div>
              )}
              {order.status === 'SHIPPED' && (
                <button
                  type="button"
                  disabled={statusMut.isPending}
                  onClick={() => statusMut.mutate('DELIVERED')}
                  className="w-full py-3 px-4 rounded-xl bg-green-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-green-700 shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  ✓ Mark Delivered
                </button>
              )}
              {['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status) && (
                <div className="p-3.5 bg-[#fcf9f6] rounded-xl border border-[#5b3f2f]/5 text-center">
                  <p className="text-xs font-bold text-[#5b3f2f] uppercase tracking-wider">Order Lifecycle Completed</p>
                  <p className="text-[10px] text-[#7a655c]/70 mt-1">Status: {order.status}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-[#5b3f2f]/5" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[#7a655c]/60">Manual Override</span>
              <div className="flex-1 h-px bg-[#5b3f2f]/5" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={statusMut.isPending}
                  onClick={() => statusMut.mutate(s)}
                  className={
                    'px-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ' +
                    (order.status === s
                      ? 'bg-[#5b3f2f] text-white border-[#5b3f2f] shadow-lg shadow-[#5b3f2f]/20'
                      : 'border-[#5b3f2f]/10 text-[#7a655c] hover:bg-[#f5e7d8] hover:border-[#5b3f2f]/30')
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6 space-y-6 luxury-grain">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#b88a2f] border-b border-[#5b3f2f]/5 pb-4">Logistics Tracking</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-[#7a655c] uppercase tracking-widest mb-1.5">Tracking ID</p>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    className="input-field bg-[#fcf9f6] text-xs"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder={order.trackingNumber || "Enter new tracking..."}
                  />
                  <button
                    type="button"
                    className="w-full py-3 rounded-xl bg-[#b88a2f] text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#a07a2a] transition-all disabled:opacity-50 active:scale-[0.98]"
                    disabled={trackingMut.isPending}
                    onClick={() => {
                      if (!trackingNumber.trim()) {
                        toast.error('Tracking number required');
                        return;
                      }
                      trackingMut.mutate();
                    }}
                  >
                    {trackingMut.isPending ? 'Syncing...' : 'Update Tracking'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <ShippingPanel
            order={order}
            onRefresh={() => {
              qc.invalidateQueries({ queryKey: ['admin-order', id] });
              qc.invalidateQueries({ queryKey: ['admin-orders'] });
            }}
          />
        </div>
      </div>
    </div>
  );
}
