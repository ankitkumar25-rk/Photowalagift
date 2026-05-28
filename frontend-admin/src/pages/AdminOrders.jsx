import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import PaginationControls from '../components/PaginationControls';

const STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

export default function AdminOrders() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-orders', status, page],
    queryFn: () => api.get('/orders/admin/all', { params: { status: status || undefined, page, limit: 20 } }).then(r => r.data),
    staleTime: 1000 * 60, // 1 minute
  });

  if (error) {
    return <div className="card p-5 bg-red-50 border border-red-200"><p className="text-red-700 font-semibold">Failed to load orders: {error.message}</p></div>;
  }

  const statusMut = useMutation({
    mutationFn: ({id, status, trackingNumber}) => api.patch('/orders/' + id + '/status', { status, trackingNumber }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); toast.success('Status updated'); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Error'),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-gray-400 text-sm mt-0.5">{data?.meta?.total || 0} total orders</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', ...STATUSES].map(s => (
            <button key={s} onClick={() => {setStatus(s); setPage(1);}}
              className={'px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ' +
                (status === s 
                  ? 'bg-brand-primary text-white border-brand-primary shadow-md' 
                  : 'bg-white border-brand-primary/10 text-brand-primary/60 hover:border-brand-primary/30')}>
              {s || 'All Orders'}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="sm:hidden divide-y divide-[#5b3f2f]/5">
          {isLoading ? Array(6).fill(0).map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              <div className="h-8 bg-gray-100 rounded animate-pulse w-full" />
            </div>
          )) : data?.data?.map((order) => (
            <div key={order.id} className="p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-[#b88a2f] uppercase tracking-[0.2em]">{order.orderNumber}</p>
                  <p className="text-sm font-bold text-[#5b3f2f] mt-1 truncate">{order.user?.name || order.guestName || order.shippingName || 'Guest'}</p>
                  <p className="text-[10px] font-semibold text-[#7a655c]/60 truncate">{order.user?.email || order.guestEmail || 'No email'}</p>
                </div>
                <span className={'badge-status ' + order.status.toLowerCase()}>{order.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-[#7a655c] uppercase tracking-widest">Total</p>
                  <p className="text-sm font-bold text-[#5b3f2f]">₹{Number(order.total).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#7a655c] uppercase tracking-widest">Payment</p>
                  <span className={'text-[10px] font-black uppercase tracking-widest ' + (order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-amber-600')}>
                    {order.paymentStatus || 'Pending'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#7a655c] uppercase tracking-widest">Date</p>
                  <p className="text-xs font-semibold text-[#5b3f2f]/70">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1.5 flex-1">
                    {order.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={statusMut.isPending}
                        onClick={() => statusMut.mutate({ id: order.id, status: 'CONFIRMED', trackingNumber: order.trackingNumber ?? undefined })}
                        className="w-full py-1.5 rounded-lg bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1"
                      >
                        ✓ Confirm Order
                      </button>
                    )}
                    {order.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        disabled={statusMut.isPending}
                        onClick={() => statusMut.mutate({ id: order.id, status: 'PROCESSING', trackingNumber: order.trackingNumber ?? undefined })}
                        className="w-full py-1.5 rounded-lg bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1"
                      >
                        ⚙ Start Processing
                      </button>
                    )}
                    {order.status === 'PROCESSING' && (
                      <button
                        type="button"
                        disabled={statusMut.isPending}
                        onClick={() => statusMut.mutate({ id: order.id, status: 'SHIPPED', trackingNumber: order.trackingNumber ?? undefined })}
                        className="w-full py-1.5 rounded-lg bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1"
                      >
                        🚚 Mark Shipped
                      </button>
                    )}
                    {order.status === 'SHIPPED' && (
                      <button
                        type="button"
                        disabled={statusMut.isPending}
                        onClick={() => statusMut.mutate({ id: order.id, status: 'DELIVERED', trackingNumber: order.trackingNumber ?? undefined })}
                        className="w-full py-1.5 rounded-lg bg-green-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1"
                      >
                        ✓ Mark Delivered
                      </button>
                    )}
                    <select
                      className="input-field py-1 text-xs w-full mt-1 bg-white"
                      value={order.status}
                      onChange={e => statusMut.mutate({ id: order.id, status: e.target.value, trackingNumber: order.trackingNumber ?? undefined })}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <Link to={'/orders/' + order.id} className="px-4 py-2 rounded-lg bg-[#f5e7d8] text-[#5b3f2f] text-[10px] font-black uppercase tracking-widest hover:bg-[#5b3f2f] hover:text-white transition-all self-end shrink-0">
                    View
                  </Link>
                </div>
                <input
                  type="text"
                  className="input-field py-2 text-xs w-full"
                  placeholder="Tracking #"
                  defaultValue={order.trackingNumber || ''}
                  onBlur={(e) => {
                    if (e.target.value !== (order.trackingNumber || '')) {
                      statusMut.mutate({ id: order.id, status: order.status, trackingNumber: e.target.value || undefined });
                    }
                  }}
                />
              </div>
            </div>
          ))}

          {!isLoading && (!data?.data || data.data.length === 0) && (
            <p className="p-4 text-sm text-gray-500 italic">No orders found.</p>
          )}
        </div>

        <div className="hidden sm:block overflow-x-auto luxury-grain">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#5b3f2f]/5">
                {['Order #', 'Customer', 'Total', 'Payment', 'Status', 'Date', 'Update Status', 'Tracking #', 'Details'].map(h => (
                  <th key={h} className="text-left text-[10px] font-black text-brand-primary/60 uppercase tracking-[0.2em] px-6 py-5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#5b3f2f]/5">
              {isLoading ? Array(8).fill(0).map((_, i) => (
                <tr key={i}>{Array(9).fill(0).map((_, j) => (
                  <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                ))}</tr>
              )) : data?.data?.map(order => (
                <tr key={order.id} className="hover:bg-[#f7f0e7]/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-mono font-bold text-[#5b3f2f]">{order.orderNumber}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-[#5b3f2f]">{order.user?.name || order.guestName || order.shippingName || 'Guest'}</p>
                    <p className="text-[10px] font-semibold text-[#7a655c]/60 truncate max-w-[150px]">{order.user?.email || order.guestEmail || 'No email'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-[#5b3f2f]">₹{Number(order.total).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <span className={'badge-status ' + (order.paymentStatus === 'PAID' ? 'delivered' : 'pending')}>
                      {order.paymentStatus || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={'badge-status ' + order.status.toLowerCase()}>{order.status}</span>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-semibold text-[#7a655c]/60">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {order.status === 'PENDING' && (
                        <button
                          type="button"
                          disabled={statusMut.isPending}
                          onClick={() => statusMut.mutate({ id: order.id, status: 'CONFIRMED', trackingNumber: order.trackingNumber ?? undefined })}
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                        >
                          Confirm
                        </button>
                      )}
                      {order.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          disabled={statusMut.isPending}
                          onClick={() => statusMut.mutate({ id: order.id, status: 'PROCESSING', trackingNumber: order.trackingNumber ?? undefined })}
                          className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                        >
                          Process
                        </button>
                      )}
                      {order.status === 'PROCESSING' && (
                        <button
                          type="button"
                          disabled={statusMut.isPending}
                          onClick={() => statusMut.mutate({ id: order.id, status: 'SHIPPED', trackingNumber: order.trackingNumber ?? undefined })}
                          className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                        >
                          Ship
                        </button>
                      )}
                      {order.status === 'SHIPPED' && (
                        <button
                          type="button"
                          disabled={statusMut.isPending}
                          onClick={() => statusMut.mutate({ id: order.id, status: 'DELIVERED', trackingNumber: order.trackingNumber ?? undefined })}
                          className="px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-[9px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                        >
                          Deliver
                        </button>
                      )}
                      <select
                        className="input-field py-1 px-1.5 text-[10px] w-20 bg-white"
                        value={order.status}
                        onChange={e => statusMut.mutate({ id: order.id, status: e.target.value, trackingNumber: order.trackingNumber ?? undefined })}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      className="input-field py-1 text-xs w-32"
                      placeholder="Tracking #"
                      defaultValue={order.trackingNumber || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (order.trackingNumber || '')) {
                          statusMut.mutate({ id: order.id, status: order.status, trackingNumber: e.target.value || undefined });
                        }
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link to={'/orders/' + order.id} className="p-2 rounded-lg text-[#b88a2f] hover:bg-[#b88a2f]/10 transition-colors inline-block">
                      <ExternalLink size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationControls
          page={page}
          total={data?.meta?.total || 0}
          limit={20}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
