import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, CreditCard, Banknote, ShieldCheck, 
  CheckCircle2, Loader2, Printer, Settings, 
  ChevronRight, Receipt, Tag
} from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';
import { useQueryClient } from '@tanstack/react-query';
import { loadRazorpayScript } from '../utils/razorpay';

export default function ServiceCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  
  const [loading, setLoading] = useState(null); // 'cod' | 'razorpay' | null
  const [orderData, setOrderData] = useState(location.state?.orderData || null);

  useEffect(() => {
    if (!orderData) {
      toast.error('Session expired. Please try again.');
      navigate('/services');
    }
  }, [orderData, navigate]);

  if (!orderData) return null;


  const handleRazorpay = async () => {
    setLoading('razorpay');
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Failed to load payment gateway. Please check your connection.');
        setLoading(null);
        return;
      }

      const { data: responseBody } = await api.post('/payments/create-order', {
        amount: orderData.totalAmount,
        currency: 'INR',
        orderId: orderData.orderId,
        orderType: 'SERVICE_ORDER',
      });
      const rzpData = responseBody.data;

      const options = {
        key: rzpData.keyId,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'Photowala',
        description: 'Professional Service Order',
        image: '/logo.png', 
        order_id: rzpData.razorpayOrderId,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderData.orderId,
              orderType: 'SERVICE_ORDER',
            });
            toast.success('Payment successful! 🎉');
            handleSuccess();
          } catch (err) {
            console.error('Verification error:', err);
            toast.error('Payment verification failed.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#5b3f2f' },
        modal: {
          ondismiss: async () => {
            try {
              await api.delete(`/service-orders/${orderData.orderId}`);
            } catch (e) {
              /* ignore */
            }
            setLoading(null);
            toast.error('Payment cancelled.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Razorpay error:', err);
      toast.error('Could not initiate payment.');
      setLoading(null);
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
    navigate(`/services/confirmation/${orderData.orderId}`);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] page-enter">
      {/* Header */}
      <header className="bg-white border-b border-cream-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/services" className="flex items-center gap-2 text-gray-500 hover:text-brand-primary transition-colors text-sm font-bold uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Cancel Checkout
          </Link>
          <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
             <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Secure Checkout Environment</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-16">
          
          {/* Left Column: Payment Methods */}
          <div className="lg:col-span-3 space-y-8 order-2 lg:order-1">
            <div>
              <div className="flex items-center gap-4 mb-2">
                 <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold">1</div>
                 <h1 className="text-3xl font-bold text-brand-primary leading-tight">Choose Payment <span className="text-brand-secondary">Method</span></h1>
              </div>
              <p className="text-gray-500 text-sm ml-12">Select your preferred transaction mode for this professional service request.</p>
            </div>

            <div className="ml-0 lg:ml-12">
               {/* Razorpay Option */}
               <button
                onClick={handleRazorpay}
                disabled={!!loading}
                className={`group w-full flex flex-col items-center gap-6 p-10 rounded-[2.5rem] border-2 transition-all duration-500 text-center relative overflow-hidden
                  ${loading === 'razorpay' ? 'border-brand-secondary bg-brand-surface shadow-inner' : 'border-cream-200 bg-white hover:border-brand-secondary hover:shadow-2xl hover:-translate-y-1'}`}
               >
                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${loading === 'razorpay' ? 'bg-brand-secondary text-white' : 'bg-brand-surface text-brand-secondary group-hover:bg-brand-secondary group-hover:text-white'}`}>
                    {loading === 'razorpay' ? <Loader2 className="w-8 h-8 animate-spin" /> : <CreditCard className="w-8 h-8" />}
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-brand-primary">Pay with Razorpay</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Debit/Credit Cards · UPI · NetBanking · Wallets</p>
                 </div>
                 <div className="pt-6 border-t border-cream-100 w-full">
                    <span className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] bg-brand-surface px-4 py-1.5 rounded-full">Secure Payment Gateway</span>
                 </div>
               </button>
            </div>

            {/* Security Badges */}
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-10 ml-0 lg:ml-12 border-t border-cream-200">
               <div className="flex items-center gap-2 text-gray-400">
                  <ShieldCheck className="w-5 h-5 text-brand-secondary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">SSL Encrypted</span>
               </div>
               <div className="flex items-center gap-2 text-gray-400">
                  <CheckCircle2 className="w-5 h-5 text-brand-secondary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Verified Payment</span>
               </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-[#1c1a19] text-white rounded-[3rem] p-8 lg:p-10 shadow-2xl sticky top-28 border border-gray-800">
               <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-6">
                  <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center text-brand-secondary">
                     {orderData.category === 'MACHINE' ? <Settings className="w-7 h-7" /> : <Printer className="w-7 h-7" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-tight">{orderData.serviceName}</h3>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Service Specification</p>
                  </div>
               </div>

               <div className="space-y-5 mb-10">
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-400 flex items-center gap-2"><Receipt className="w-4 h-4" /> Order Ref.</span>
                     <span className="font-bold text-brand-secondary uppercase tracking-widest">{orderData.orderNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-400 flex items-center gap-2"><Tag className="w-4 h-4" /> Subtotal</span>
                     <span className="font-bold">₹{orderData.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-400 flex items-center gap-2">🚚 Logistics</span>
                     <span className="font-bold text-green-500 uppercase text-xs tracking-widest">Complimentary</span>
                  </div>
               </div>

               <div className="pt-8 border-t border-gray-800 mb-8">
                  <div className="flex justify-between items-end mb-2">
                     <span className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">Total Payable</span>
                     <span className="text-3xl font-bold text-brand-secondary">₹{orderData.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 text-right uppercase tracking-widest font-medium">Including 18% GST & Service Charges</p>
               </div>

               <div className="bg-gray-800/50 rounded-2xl p-4 flex gap-4 items-start border border-gray-700/50">
                  <ShieldCheck className="w-5 h-5 text-brand-secondary shrink-0" />
                  <p className="text-[10px] text-gray-400 leading-relaxed uppercase tracking-wider">Your transaction is protected by enterprise-grade encryption. No financial data is stored on our servers.</p>
               </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
