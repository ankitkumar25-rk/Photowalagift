import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight, Package, Calendar, CreditCard, Layers } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function ServiceConfirmation() {
  const { serviceOrderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceOrder = async () => {
      try {
        const { data } = await api.get(`/service-orders/${serviceOrderId}`);
        setOrder(data.data);
      } catch (err) {
        console.error('Failed to fetch service order:', err);
        toast.error('Could not load service order details');
        navigate('/'); 
      } finally {
        setLoading(false);
      }
    };

    if (serviceOrderId) fetchServiceOrder();
  }, [serviceOrderId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f0e7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#b88a2f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const amount = Number(order?.totalAmount || 0).toLocaleString('en-IN');

  return (
    <div className="min-h-screen bg-[#f7f0e7] flex items-center justify-center px-4 py-12">
      <div className="bg-[#fffdfb] rounded-[2.5rem] shadow-2xl p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden animate-in fade-in duration-500">
        {/* Decorative background circle */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#b88a2f]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#5b3f2f]/5 rounded-full blur-3xl" />

        {/* Animated checkmark */}
        <div className="w-24 h-24 bg-[#f5e7d8] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-bounce-once">
          <CheckCircle className="w-12 h-12 text-[#5b3f2f]" />
        </div>

        <h1 className="font-outfit text-3xl font-bold text-[#5b3f2f] mb-3 tracking-tight">
          Service Confirmed!
        </h1>
        <p className="text-[#b88a2f] text-sm font-medium uppercase tracking-[0.2em] mb-8 px-4">
          Our team will review and begin production
        </p>

        {/* Service Order details card */}
        <div className="bg-[#faf8f5] border border-cream-200 rounded-3xl p-6 text-left mb-8 space-y-4">
          <div className="flex justify-between items-center border-b border-cream-100 pb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5b3f2f]/40 flex items-center gap-2">
              <Package className="w-3 h-3" /> Service Order Ref.
            </span>
            <span className="font-mono text-sm font-bold text-[#5b3f2f] uppercase tracking-wider">
              {order?.orderNumber || order?.id?.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-cream-100 pb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5b3f2f]/40 flex items-center gap-2">
              <Layers className="w-3 h-3" /> Service Type
            </span>
            <span className="text-sm font-bold text-[#5b3f2f]">
              {order?.serviceName || 'Custom Service'}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-cream-100 pb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5b3f2f]/40 flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Date
            </span>
            <span className="text-sm font-bold text-[#5b3f2f]">
              {order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-cream-100 pb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5b3f2f]/40 flex items-center gap-2">
              <CreditCard className="w-3 h-3" /> Total Amount
            </span>
            <span className="font-bold text-lg text-[#5b3f2f]">
              ₹{amount}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5b3f2f]/40 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Status
            </span>
            <span className="bg-green-100 text-green-700 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
              PAID
            </span>
          </div>
        </div>

        <p className="text-gray-500 text-xs mb-10 leading-relaxed max-w-[320px] mx-auto uppercase tracking-widest font-medium">
          A designer will connect with you via email/phone shortly to confirm design blueprints.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/account/services')}
            className="group w-full bg-[#5b3f2f] text-white rounded-2xl py-5 font-bold text-sm uppercase tracking-[0.2em] shadow-xl shadow-[#5b3f2f]/20 hover:bg-[#3b1d16] transition-all duration-300 flex items-center justify-center gap-3"
          >
            <span>My Service Requests</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <Link
            to="/services"
            className="w-full border-2 border-[#b88a2f] text-[#b88a2f] rounded-2xl py-4 font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#b88a2f]/5 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse Other Services
          </Link>
        </div>
      </div>
    </div>
  );
}
