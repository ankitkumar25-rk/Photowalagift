import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Download, Clock, User, 
  Mail, Phone, Package, Info, CheckCircle2,
  AlertCircle, Trash2, Printer, Settings, FileText, CreditCard
} from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import PaymentModal from '../../components/PaymentModal';

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const STATUS_LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'In Production',
  SHIPPED: 'Shipped',
  DELIVERED: 'Completed',
  CANCELLED: 'Cancelled'
};

export default function ServiceOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['service-order', id],
    queryFn: async () => {
      const { data } = await api.get(`/service-orders/${id}`);
      return data.data;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      await api.patch(`/service-orders/admin/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['service-order', id]);
      toast.success('Order status updated');
    }
  });

  const [trackingNumber, setTrackingNumber] = useState('');
  const updateTrackingMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/service-orders/admin/${id}/tracking`, { trackingNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['service-order', id]);
      toast.success('Tracking number updated');
      setTrackingNumber('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!window.confirm('Are you sure you want to delete this order?')) return;
      await api.delete(`/service-orders/admin/${id}`);
    },
    onSuccess: () => {
      toast.success('Order deleted');
      navigate(order.category === 'MACHINE' ? '/machine-orders' : '/print-orders');
    }
  });

  if (isLoading) return <div className="py-20 text-center text-gray-400">Loading order details...</div>;
  if (!order) return <div className="py-20 text-center text-red-500">Order not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-brand-primary/60 hover:text-brand-primary transition-all font-bold text-[11px] uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>
        <div className="flex gap-2">
           <button 
            onClick={() => deleteMutation.mutate()}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all text-xs font-black uppercase tracking-widest shadow-sm"
          >
            <Trash2 className="w-4 h-4" /> Delete Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Order Main Info */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-200 shadow-xs">
                    Service Order ({order.category})
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm font-bold text-gray-500">Order #{order.orderNumber}</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{order.serviceName}</h1>
              </div>
              <div className="text-right">
                <select 
                  value={order.status}
                  onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                  className="rounded-xl border-gray-200 text-sm font-bold focus:border-brand-primary focus:ring-brand-primary/20 bg-gray-50 px-4 py-2"
                >
                  {STATUS_FLOW.map(s => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s] || s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-gray-50">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Placed On</p>
                <p className="text-sm font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</p>
                <p className="text-sm font-bold text-gray-900">₹{order.totalAmount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</p>
                <p className="text-sm font-bold text-gray-900">{order.quantity} units</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">File Option</p>
                <p className="text-sm font-bold text-gray-900 uppercase">{order.fileOption}</p>
              </div>
            </div>
          </div>

          {/* Payment Status Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${order.paymentStatus === 'PAID' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Status</p>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                  {order.paymentStatus || 'PENDING'} 
                  {order.paymentMethod && <span className="text-xs text-gray-400 font-bold ml-2">via {order.paymentMethod}</span>}
                </h3>
                {order.razorpayPaymentId && (
                  <p className="text-xs font-bold text-brand-primary/60 mt-1 uppercase tracking-wider">
                    Payment ID: <span className="font-mono font-black text-[#5b3f2f]">{order.razorpayPaymentId}</span>
                  </p>
                )}
                {order.razorpayOrderId && (
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">
                    Razorpay Order ID: <span className="font-mono">{order.razorpayOrderId}</span>
                  </p>
                )}
              </div>
            </div>
            {order.paymentStatus !== 'PAID' && (
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="bg-brand-primary text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
              >
                Initiate Payment
              </button>
            )}
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-primary" /> Service Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
              {Object.entries(order.details || {}).map(([key, value]) => {
                if (key === 'pricing') return null;
                return (
                  <div key={key} className="flex justify-between items-center py-3 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-sm font-bold text-gray-800">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </div>
                );
              })}
            </div>

            {order.specialRemark && (
              <div className="mt-8 p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Special Remark</p>
                <p className="text-sm text-amber-900 font-medium italic">"{order.specialRemark}"</p>
              </div>
            )}
          </div>

          {/* File Download Card */}
          {order.fileUrl && (
             <div className="bg-brand-surface rounded-3xl p-8 border border-brand-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-brand-secondary">
                   <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-brand-primary uppercase tracking-tight">Artwork / Design File</h4>
                  <p className="text-[11px] text-brand-secondary font-bold uppercase tracking-wider">Attached via {order.fileOption}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (order.fileUrl === 'SEND_VIA_EMAIL') {
                    toast.info('Customer opted to send file via email.');
                    return;
                  }
                  const link = document.createElement('a');
                  link.href = order.fileUrl;
                  link.target = '_blank';
                  link.download = `artwork-${order.orderNumber}`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-brand-secondary hover:bg-brand-secondary/90 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-brand-secondary/20 uppercase text-xs tracking-widest"
              >
                <Download className="w-4 h-4" /> {order.fileUrl === 'SEND_VIA_EMAIL' ? 'Sent via Email' : 'Download File'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Customer Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-primary" /> Customer Info
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 uppercase">
                    {(order.customerName || order.user?.name)?.[0]}
                 </div>
                 <div>
                    <p className="text-sm font-bold text-gray-900">{order.customerName || order.user?.name}</p>
                    <p className="text-[11px] text-gray-400 font-medium">Customer Account Linked</p>
                 </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-medium">{order.user?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span className="text-xs font-medium">{order.user?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-50">
               <Link 
                to={`/customers/${order.userId}`}
                className="text-xs font-bold text-brand-primary hover:underline uppercase tracking-widest"
              >
                View Customer Profile →
              </Link>
            </div>
          </div>

            <div className="bg-[linear-gradient(180deg,#5a3f2f,#3b291f)] rounded-3xl p-8 text-white luxury-grain">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-6">Logistic Management</h3>
              
              <div className="mb-8 space-y-4">
                 <div className="space-y-2">
                    <p className="text-[10px] font-bold text-white/40 uppercase">Current Tracking ID</p>
                    <p className="font-mono text-sm font-bold text-brand-secondary">{order.trackingNumber || 'NOT ASSIGNED'}</p>
                 </div>
                 <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Assign Tracking #"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="flex-1 bg-white/5 border-white/10 rounded-xl text-xs font-bold focus:ring-1 focus:ring-brand-secondary px-3 py-2 text-white placeholder:text-white/20"
                    />
                    <button 
                      onClick={() => updateTrackingMutation.mutate()}
                      className="bg-brand-secondary hover:bg-brand-secondary/90 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all"
                    >
                      Set
                    </button>
                 </div>
              </div>

              <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-6">Workflow Status</h3>
              <div className="space-y-8 relative">
              {/* Vertical line */}
              <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-white/5" />
              
              {STATUS_FLOW.map((s, idx) => {
                const isCompleted = STATUS_FLOW.indexOf(order.status) >= idx;
                const isCurrent = order.status === s;
                return (
                  <div key={s} className="relative flex items-center gap-6">
                    <div className={`w-6 h-6 rounded-full border-2 z-10 flex items-center justify-center transition-all ${
                      isCompleted ? 'bg-brand-secondary border-brand-secondary shadow-lg shadow-brand-secondary/20' : 'bg-transparent border-white/10'
                    }`}>
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest ${isCurrent ? 'text-white' : isCompleted ? 'text-white/60' : 'text-white/20'}`}>
                        {STATUS_LABELS[s] || s}
                      </p>
                      {isCurrent && <p className="text-[10px] text-brand-secondary font-bold uppercase mt-1">Active Stage</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderData={{
            orderId: order.id,
            orderType: 'SERVICE_ORDER',
            totalAmount: Number(order.totalAmount),
            userName: order.customerName || order.user?.name || 'Customer',
            userEmail: order.user?.email || '',
            userPhone: order.user?.phone || '',
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['service-order', id]);
            toast.success('Payment recorded successfully');
          }}
        />
      )}
    </div>
  );
}
