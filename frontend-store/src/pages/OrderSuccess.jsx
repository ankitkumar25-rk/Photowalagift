import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight, Package, Calendar, CreditCard } from 'lucide-react';
import { ordersApi, productsApi } from '../api';
import toast from 'react-hot-toast';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await ordersApi.getById(orderId);
        setOrder(data.data);
      } catch (err) {
        console.error('Failed to fetch order:', err);
        toast.error('Could not load order details');
        navigate('/'); // Guard: redirect to home if order not found or unauthorized
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId, navigate]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data } = await productsApi.featured();
        const boughtIds = order?.items?.map(item => item.productId) || [];
        const filtered = (data.data || []).filter(p => !boughtIds.includes(p.id)).slice(0, 3);
        setRecommendations(filtered);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      }
    };
    if (order) {
      fetchRecommendations();
    }
  }, [order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f0e7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#b88a2f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Determine display content based on payment status
  const getStatusDisplay = () => {
    const status = order?.paymentStatus || 'PENDING';
    const amount = Number(order?.total || 0).toLocaleString('en-IN');

    switch (status) {
      case 'PAID':
        return {
          title: "Order Confirmed!",
          message: "Payment Received Successfully",
          badge: {
            text: "PAID",
            className: "bg-green-100 text-green-700",
            dotColor: "bg-green-500"
          }
        };
      case 'COD_PENDING':
        return {
          title: "Order Placed!",
          message: "Pay on Delivery",
          badge: {
            text: "Cash on Delivery",
            className: "bg-amber-100 text-amber-700",
            dotColor: "bg-amber-500"
          }
        };
      default: // PENDING
        return {
          title: "Order Placed!",
          message: "Payment Processing...",
          badge: {
            text: "Processing",
            className: "bg-orange-100 text-orange-700",
            dotColor: "bg-orange-500"
          }
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <div className="min-h-screen bg-[#f7f0e7] flex items-center justify-center px-4 py-12">
      <div className="bg-[#fffdfb] rounded-[2.5rem] shadow-2xl p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#b88a2f]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#5b3f2f]/5 rounded-full blur-3xl" />

        {/* Animated checkmark */}
        <div className="w-24 h-24 bg-[#f5e7d8] rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-once shadow-inner">
          <CheckCircle className="w-12 h-12 text-[#5b3f2f]" />
        </div>

        <h1 className="font-outfit text-3xl font-bold text-[#5b3f2f] mb-3 tracking-tight">
          {display.title}
        </h1>
        <p className="text-[#b88a2f] text-sm font-medium uppercase tracking-[0.2em] mb-8 px-4">
          {display.message}
        </p>

        {/* Order details card */}
        <div className="bg-[#faf8f5] border border-cream-200 rounded-3xl p-6 text-left mb-8 space-y-4">
          <div className="flex justify-between items-center border-b border-cream-100 pb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5b3f2f]/40 flex items-center gap-2">
              <Package className="w-3 h-3" /> Order ID
            </span>
            <span className="font-mono text-sm font-bold text-[#5b3f2f]">
              {order?.orderNumber || order?.id?.slice(0, 8).toUpperCase()}
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
              ₹{Number(order?.total).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5b3f2f]/40 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${display.badge.dotColor} animate-pulse`} /> Status
            </span>
            <span className={`${display.badge.className} font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full`}>
              {display.badge.text}
            </span>
          </div>
        </div>

        <p className="text-gray-500 text-xs mb-8 leading-relaxed max-w-[280px] mx-auto uppercase tracking-widest font-medium">
          A confirmation email has been sent to your registered address.
        </p>

        {/* Recommended Products Upsell Section */}
        {recommendations.length > 0 && (
          <div className="mt-8 pt-8 border-t border-cream-200 text-left mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="font-outfit text-sm font-bold text-[#5b3f2f] mb-1">You Might Also Like...</h3>
            <p className="text-[10px] text-gray-400 mb-4 uppercase tracking-wider font-semibold">Premium Personalized Gifts You Might Love</p>
            
            <div className="grid grid-cols-3 gap-3">
              {recommendations.map((prod) => (
                <Link 
                  key={prod.id} 
                  to={`/products/${prod.slug}`} 
                  className="bg-[#faf8f5] border border-cream-150 rounded-2xl p-2 hover:shadow-md transition-all hover:scale-105 duration-300 flex flex-col group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-cream-100 mb-2 shrink-0">
                    <img 
                      src={prod.images?.[0]?.url || 'https://placehold.co/120x120?text=Gift'} 
                      alt={prod.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                  <h4 className="text-[9px] font-bold text-gray-800 truncate leading-snug group-hover:text-brand-secondary transition-colors">{prod.name}</h4>
                  <p className="text-[9px] font-extrabold text-[#b88a2f] mt-0.5">₹{Number(prod.price).toFixed(0)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="group w-full bg-[#5b3f2f] text-white rounded-2xl py-5 font-bold text-sm uppercase tracking-[0.2em] shadow-xl shadow-[#5b3f2f]/20 hover:bg-[#3b1d16] transition-all duration-300 flex items-center justify-center gap-3"
          >
            <span>View Order Details</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <Link
            to="/products"
            className="w-full border-2 border-[#b88a2f] text-[#b88a2f] rounded-2xl py-4 font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#b88a2f]/5 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
