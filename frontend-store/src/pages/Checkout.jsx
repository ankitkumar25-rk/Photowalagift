import { useState, useEffect, useCallback, createElement, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Plus, Check, Truck, Package,
  ShoppingBag, ArrowLeft, X, ChevronDown, ChevronUp, ChevronRight,
  Shield, Tag, Info, CreditCard, Banknote, CheckCircle, AlertCircle
} from 'lucide-react';
import { 
  MdSecurity, MdLocalShipping, MdAssignmentReturn 
} from 'react-icons/md';
import toast from 'react-hot-toast';
import axios from 'axios'; // For external pincode API
import { useCartStore } from '../store';
import { usersApi, ordersApi, paymentsApi } from '../api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store';
import { loadRazorpayScript } from '../utils/razorpay';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import api from '../api/client'; // axiosInstance

/* -- Inline address form component -- */
function InlineAddressForm({ onSave, onCancel, showCancel = true }) {
  const user = useAuthStore((s) => s.user);
  
  const [form, setForm] = useState({
    label: 'Home',
    fullName: user?.name || '',
    phone: user?.phone || '',
    line1: user?.address || '',
    line2: '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    isDefault: false,
  });
  
  const [saving, setSaving] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [pincodeError, setPincodeError] = useState(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestedAddress, setSuggestedAddress] = useState('');

  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const { isLoaded } = useGoogleMaps();

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;
    if (autocompleteRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: 'IN' },
        fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
        types: ['address'],
      }
    );

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry || !place.address_components) {
        setIsValidAddress(false);
        return;
      }

      const get = (type) =>
        place.address_components.find(c => c.types.includes(type))?.long_name || '';

      const formatted = place.formatted_address;
      setForm(prev => ({
        ...prev,
        line1: formatted,
        city: get('locality') || get('sublocality_level_1') || get('administrative_area_level_2') || '',
        state: get('administrative_area_level_1') || '',
        pincode: get('postal_code') || '',
      }));
      setIsValidAddress(true);
    });
  }, [isLoaded]);

  const handle = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (e.target.name === 'line1') setIsValidAddress(false);
  };

  const handlePincodeChange = async (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setForm(prev => ({ ...prev, pincode: value }));
    setPincodeError(null);

    if (value.length === 6) {
      if (!/^[1-9][0-9]{5}$/.test(value)) {
        setPincodeError('Invalid pincode');
        return;
      }
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await res.json();
        if (data[0].Status === 'Success') {
          const po = data[0].PostOffice[0];
          setForm(prev => ({
            ...prev,
            city: po.District,
            state: po.State,
          }));
        } else {
          setPincodeError('Pincode not found');
        }
      } catch { /* fail silently */ }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.phone || !/^[0-9]{10}$/.test(form.phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    setIsValidating(true);
    try {
      const { data: vData } = await api.post('/users/addresses/validate', {
        addressLine1: form.line1,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      });

      if (vData.correctedAddress) {
        setSuggestedAddress(vData.correctedAddress);
        setShowSuggestionModal(true);
        return;
      }

      await performSave();
    } catch {
      await performSave();
    } finally {
      setIsValidating(false);
    }
  };

  const performSave = async (overriddenForm = null) => {
    setSaving(true);
    try {
      await onSave(overriddenForm || form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 bg-cream-50/30 p-5 sm:p-6 rounded-3xl border border-cream-200 animate-in fade-in duration-300">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Enter Delivery Details</p>
      <div className="flex gap-2">
        {['Home', 'Work', 'Other'].map((l) => (
          <button key={l} type="button"
            onClick={() => setForm((f) => ({ ...f, label: l }))}
            className={`flex-1 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              form.label === l ? 'bg-brand-primary text-white shadow-md' : 'bg-cream-100 text-gray-700 hover:bg-cream-200'
            }`}
          >{l}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Full Name *</label>
          <input name="fullName" value={form.fullName} onChange={handle} required className="input-field" placeholder="John Doe" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Phone *</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              if (val.length <= 10) setForm(f => ({ ...f, phone: val }));
            }}
            required
            pattern="[0-9]{10}"
            className="input-field"
            placeholder="10-digit mobile number"
          />
        </div>
      </div>

      <div className="relative">
        <label className="block text-xs uppercase tracking-wider text-[#5b3f2f]/60 mb-1.5 font-semibold">
          Address Line 1
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            name="line1"
            value={form.line1}
            onChange={handle}
            placeholder={isLoaded ? "Start typing your address..." : "Flat, House no., Street, Area"}
            autoComplete="off"
            required
            className={`w-full rounded-xl px-4 py-3 pr-10 border bg-white/80 text-[#5b3f2f] placeholder-[#5b3f2f]/30 focus:outline-none focus:ring-2 transition-all duration-200 font-[DM_Sans] ${
              isValidAddress ? 'border-green-400 focus:ring-green-100' : 'border-[#f5e7d8] focus:ring-[#b88a2f]/20 focus:border-[#b88a2f]'
            }`}
          />
          {isLoaded && (
            <>
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isValidAddress ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : form.line1 ? (
                  <MapPin className="w-5 h-5 text-[#b88a2f] animate-pulse" />
                ) : null}
              </div>
            </>
          )}
        </div>
        {isLoaded && !isValidAddress && form.line1?.length > 3 && (
          <p className="text-xs text-[#b88a2f] mt-1.5 flex items-center gap-1 italic">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            Select from suggestions for accurate delivery
          </p>
        )}
      </div>

      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Address Line 2 (Optional)</label>
        <input name="line2" value={form.line2} onChange={handle} className="input-field" placeholder="Flat, Floor, Building" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">City *</label>
          <input name="city" value={form.city} onChange={handle} required className="input-field" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">State *</label>
          <input name="state" value={form.state} onChange={handle} required className="input-field" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Pincode *</label>
          <input name="pincode" value={form.pincode} onChange={handlePincodeChange} required className="input-field" maxLength="6" />
          {pincodeError && (
            <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {pincodeError}
            </p>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isDefault}
          onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
          className="w-4 h-4 accent-brand-primary rounded" />
        <span className="text-sm font-medium text-gray-700">Set as default address</span>
      </label>

      <div className="flex gap-3">
        {showCancel && (
          <button type="button" onClick={onCancel} className="flex-1 py-3.5 border-2 border-cream-300 text-gray-700 font-bold rounded-2xl text-xs uppercase tracking-wider hover:bg-cream-50 transition-colors">
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving || isValidating}
          className="flex-1 bg-brand-primary text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-primary/20 hover:bg-brand-deep transition-all">
          {saving || isValidating ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isValidating ? 'Validating...' : 'Saving...'}
            </div>
          ) : 'Save & Continue'}
        </button>
      </div>

      {showSuggestionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
          <div className="bg-[#fffdfb] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-[#5b3f2f] text-lg mb-1">Suggested Address</h3>
            <p className="text-xs text-[#5b3f2f]/60 mb-4">Google found a more accurate version of your address</p>
            <div className="space-y-3 mb-6">
              <div className="bg-[#f5e7d8] rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#5b3f2f]/50 mb-1">You entered</p>
                <p className="text-sm text-[#5b3f2f]">{form.line1}</p>
              </div>
              <div className="bg-[#b88a2f]/10 border border-[#b88a2f]/30 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#b88a2f] mb-1">✓ Suggested</p>
                <p className="text-sm text-[#5b3f2f] font-medium">{suggestedAddress}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowSuggestionModal(false); performSave(); }}
                className="flex-1 border border-[#5b3f2f] text-[#5b3f2f] rounded-full py-2.5 text-sm font-semibold hover:bg-[#f5e7d8] transition-all duration-200"
              >Keep Mine</button>
              <button
                onClick={() => {
                  const updated = { ...form, line1: suggestedAddress };
                  setForm(updated);
                  setShowSuggestionModal(false);
                  performSave(updated);
                }}
                className="flex-1 bg-[#5b3f2f] text-white rounded-full py-2.5 text-sm font-semibold hover:bg-[#3b1d16] transition-all duration-200"
              >Use Suggested</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

/* -- Steps -- */
const STEPS = [
  { id: 1, label: 'Address' },
  { id: 2, label: 'Review' },
  { id: 3, label: 'Payment' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const items     = useCartStore((s) => s.items);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const clearCart = useCartStore((s) => s.clearCart);

  const [step, setStep]               = useState(1);
  const [addresses, setAddresses]     = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [notes, setNotes]             = useState('');
  const [placing, setPlacing]         = useState(false);
  const [showItems, setShowItems]     = useState(false);
  const [currentOrderData, setCurrentOrderData] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(null); // 'verifying' | null
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null); // 'RAZORPAY' | 'COD' | null

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isProfileComplete = useAuthStore((s) => s.isProfileComplete?.() || false);

  const subtotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const shipping = subtotal >= 1000 ? 0 : 49;
  const total    = subtotal + shipping;

  const loadAddresses = useCallback(async () => {
    try {
      const { data } = await usersApi.getAddresses();
      let list = data.data || [];

      // Automatically register and save user profile address if lists are empty but profile is complete
      if (list.length === 0 && user?.address && user?.city && user?.pincode) {
        try {
          const autoRes = await usersApi.addAddress({
            label: 'Home',
            fullName: user.name || 'Personal Profile',
            phone: user.phone || '',
            line1: user.address,
            line2: '',
            city: user.city,
            state: user.state || '',
            pincode: user.pincode,
            isDefault: true
          });
          if (autoRes.data?.data) {
            list = [autoRes.data.data];
          }
        } catch (autoErr) {
          console.error('[Checkout] Failed to auto-save profile address:', autoErr);
        }
      }

      setAddresses(list);
      const def = list.find((a) => a.isDefault) || list[0];
      if (def) {
        setSelectedAddr(def.id);
        setShowInlineForm(false);
      } else {
        setShowInlineForm(true);
      }
    } catch (err) {
      toast.error('Failed to load addresses');
    }
  }, [user]);

  useEffect(() => { loadAddresses(); }, [loadAddresses]);

  useEffect(() => {
    if (items.length === 0 && step !== 3) navigate('/cart');
  }, [items, step, navigate]);

  const addAddress = async (form) => {
    try {
      const { data } = await usersApi.addAddress(form);
      await loadAddresses();
      setSelectedAddr(data.data.id);
      setShowInlineForm(false);
      toast.success('Address added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
      throw err;
    }
  };

  const handleCreateOrder = async (method) => {
    if (!selectedAddr || placing) return;
    setPlacing(true);
    setPaymentInitiated(false);
    setRazorpayOrderId(null);

    try {
      if (method === 'COD') {
        const { data: orderRes } = await ordersApi.create({ 
          addressId: selectedAddr, 
          notes,
          paymentMethod: 'COD',
          idempotencyKey
        });
        await handlePaymentSuccess('COD', orderRes.data.id);
      } else {
        // Razorpay flow: Create Razorpay order first (Split flow fix)
        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
          toast.error('Failed to load payment gateway. Please check your connection.');
          setPlacing(false);
          return;
        }

        const { data: responseBody } = await paymentsApi.createOrder({
          amount: total, 
          currency: 'INR', 
          addressId: selectedAddr,
          notes,
          idempotencyKey
        });
        const rzpData = responseBody.data;
        
        setPaymentInitiated(true);
        setRazorpayOrderId(rzpData.razorpayOrderId);

        const options = {
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: 'Photowala',
          description: 'Product Order Checkout',
          order_id: rzpData.razorpayOrderId,
          handler: async (resp) => {
            try {
              setPaymentLoading('verifying');
              const { data: verifyData } = await paymentsApi.verifyPayment({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                addressId: selectedAddr,
                notes,
                idempotencyKey
              });

              if (verifyData.success) {
                await handlePaymentSuccess('RAZORPAY', verifyData.order.id);
              }
            } catch (vErr) {
              setPaymentLoading(null);
              toast.error(vErr.response?.data?.message || 'Payment verification failed. Contact support.');
              setPlacing(false);
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          theme: { color: '#5b3f2f' },
          modal: { 
            ondismiss: () => {
              setPlacing(false);
              setPaymentLoading(null);
              setPaymentInitiated(false);
              setRazorpayOrderId(null);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        
        rzp.on('payment.failed', (response) => {
          setPaymentLoading(null);
          toast.error(response.error?.description || 'Payment failed. Please try again.');
          setPlacing(false);
        });

        rzp.open();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
      setPlacing(false);
    }
  };

  const handlePaymentSuccess = async (method, orderId) => {
    // 1. Clear the cart immediately
    await clearCart();

    // 2. Invalidate caches
    await queryClient.invalidateQueries({ queryKey: ['cart'] });
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    await queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    await queryClient.invalidateQueries({ queryKey: ['user'] });

    // 3. Redirect to success page
    navigate(`/orders/${orderId}/success`, { replace: true });
    toast.success('Order placed successfully!');
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddr);

  return (
    <div className="min-h-screen bg-cream-100 luxury-grain pt-28 sm:pt-32 pb-20 sm:pb-24 px-3 sm:px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-brand-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-100 h-100 bg-brand-secondary/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-gray-400 text-xs font-semibold uppercase tracking-widest mb-10 animate-in fade-in slide-in-from-left-4 duration-500">
          <Link to="/" className="hover:text-brand-secondary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <Link to="/cart" className="hover:text-brand-secondary transition-colors">Cart</Link>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-brand-primary">Checkout</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-8 sm:mb-12">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-brand-primary leading-tight">
              Secure <br />
              <span className="text-brand-secondary">Checkout</span>
            </h1>
            <div className="flex items-center gap-4">
              <div className="h-0.5 w-12 bg-brand-secondary" />
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Step {step} of 3</p>
            </div>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="mb-8 sm:mb-12 p-3 sm:p-6 card flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step === s.id
                    ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20'
                    : step > s.id
                    ? 'bg-brand-secondary text-white'
                    : 'bg-cream-200 text-gray-400'
                }`}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <span className="font-bold text-[10px] sm:text-sm text-gray-700 hidden sm:inline uppercase tracking-widest">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${step > s.id ? 'bg-brand-secondary' : 'bg-cream-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ✅ Grid layout */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* ✅ Left column - Steps (Takes more space) */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">

            {/* STEP 1 — Address */}
            <div className={`card p-4 sm:p-6 md:p-8 transition-all ${step >= 1 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div className="flex items-center justify-between gap-4 pb-6 border-b border-cream-200 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-brand-surface flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-brand-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                </div>
                {step > 1 && (
                  <button onClick={() => setStep(1)} className="text-xs font-semibold text-brand-primary hover:text-brand-secondary transition-colors uppercase tracking-wider">
                    Change
                  </button>
                )}
              </div>

              {step === 1 && (
                <div className="space-y-6">
                  {showInlineForm ? (
                    <InlineAddressForm 
                      onSave={addAddress} 
                      onCancel={() => setShowInlineForm(false)} 
                      showCancel={addresses.length > 0} 
                    />
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select Delivery Address</p>
                      {addresses.map((a) => (
                        <label
                          key={a.id}
                          className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all group ${
                            selectedAddr === a.id
                              ? 'border-brand-secondary bg-linear-to-r from-brand-surface to-transparent shadow-md'
                              : 'border-cream-300 hover:border-brand-secondary hover:bg-cream-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            value={a.id}
                            checked={selectedAddr === a.id}
                            onChange={() => setSelectedAddr(a.id)}
                            className="mt-0.5 accent-brand-primary w-5 h-5 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-gray-900">{a.label}</span>
                              {a.isDefault && (
                                <span className="badge-featured text-[11px] px-2 py-1">Default</span>
                              )}
                            </div>
                            <p className="font-semibold text-gray-800 text-sm">{a.fullName}</p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                              {a.line1}{a.line2 ? `, ${a.line2}` : ''}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {a.city}, {a.state} – {a.pincode}
                            </p>
                            <p className="text-xs text-gray-500 mt-2 font-medium">{a.phone}</p>
                          </div>
                          {selectedAddr === a.id && (
                            <div className="shrink-0 mt-1">
                              <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center shadow-sm">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                        </label>
                      ))}

                      {/* Add New Address Button */}
                      <button
                        onClick={() => setShowInlineForm(true)}
                        className="w-full py-3 sm:py-4 border-2 border-dashed border-cream-400 rounded-2xl text-xs sm:text-sm font-bold text-brand-primary hover:border-brand-secondary hover:bg-brand-surface transition-all flex items-center justify-center gap-2 sm:gap-3 group mt-2"
                      >
                        <div className="w-5 h-5 rounded-full border-2 border-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all flex items-center justify-center">
                          <Plus className="w-3 h-3" />
                        </div>
                        Add New Delivery Address
                      </button>
                    </div>
                  )}

                  {/* Incomplete Profile Hint */}
                  {!isProfileComplete && (
                    <p className="text-xs text-[#8a7060] italic mt-4">
                      Save your address in My Account for faster checkout
                    </p>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-0.5 bg-linear-to-r from-cream-300 to-transparent" />
                    <span className="text-xs text-gray-400 font-semibold uppercase">Additional Info</span>
                    <div className="flex-1 h-0.5 bg-linear-to-l from-cream-300 to-transparent" />
                  </div>

                  {/* Order Notes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                      <span>Special Instructions</span>
                      <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 sm:px-4 py-3 rounded-2xl border-2 border-cream-200 focus:border-brand-secondary focus:outline-none transition-colors resize-none placeholder-gray-400 text-sm"
                      placeholder="Add any special instructions or delivery notes (e.g., ring doorbell twice, leave with security guard)"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 sm:gap-3 pt-4">
                    <button
                      onClick={() => navigate('/cart')}
                      className="flex-1 px-3 sm:px-6 py-3 sm:py-4 rounded-2xl border-2 border-cream-300 text-gray-700 font-bold text-sm sm:text-base hover:bg-cream-50 transition-colors"
                    >
                      Back to Cart
                    </button>
                    <button
                      onClick={() => {
                        if (!selectedAddr) { toast.error('Please select a delivery address'); return; }
                        setStep(2);
                      }}
                      className="flex-1 px-3 sm:px-6 py-3 sm:py-4 rounded-2xl bg-brand-primary text-white font-bold text-sm sm:text-base hover:bg-brand-secondary transition-colors shadow-md"
                    >
                      Review Order
                    </button>
                  </div>
                </div>
              )}

              {step > 1 && selectedAddress && (
                <div className="p-3 sm:p-4 bg-brand-surface rounded-2xl">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">{selectedAddress.label} — {selectedAddress.fullName}</p>
                  <p className="text-xs sm:text-sm text-gray-600 break-words">
                    {selectedAddress.line1}{selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}, {selectedAddress.city}, {selectedAddress.state} – {selectedAddress.pincode}
                  </p>
                </div>
              )}
            </div>

            {/* STEP 2 — Review */}
            {step >= 2 && (
              <div className="card p-4 sm:p-6 md:p-8">
                <div className="flex items-center justify-between gap-4 pb-6 border-b border-cream-200 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-brand-surface flex items-center justify-center">
                      <Package className="w-5 h-5 text-brand-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Review Items</h2>
                  </div>
                  {step > 2 && (
                    <button onClick={() => setStep(2)} className="text-xs font-semibold text-brand-primary hover:text-brand-secondary transition-colors uppercase tracking-wider">
                      Change
                    </button>
                  )}
                </div>

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="divide-y divide-cream-100">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-start gap-4 py-5 first:pt-0 last:pb-0">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-cream-100 border border-cream-200 shrink-0">
                            {item.product?.images?.[0]?.url ? (
                              <img
                                src={item.product.images[0].url}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-cream-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight mb-1">{item.product?.name}</p>
                            <div className="flex items-center gap-2 mb-2">
                              {item.product?.unit && <span className="text-[10px] font-bold text-gray-400 uppercase bg-cream-100 px-1.5 py-0.5 rounded-md">{item.product.unit}</span>}
                              <span className="text-xs font-medium text-gray-500">Qty: <span className="font-bold text-gray-900">{item.quantity}</span></span>
                            </div>
                            <p className="font-bold text-base text-brand-primary">
                              ₹{(Number(item.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setStep(3)}
                      className="group relative w-full bg-brand-primary text-white py-4 sm:py-5 rounded-2xl font-bold text-sm uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 hover:bg-brand-secondary transition-all flex items-center justify-center gap-3 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      <span>Continue to Payment</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}

                {step > 2 && (
                  <div className="p-4 bg-brand-surface rounded-2xl text-sm text-gray-600">
                    {items.length} item{items.length !== 1 ? 's' : ''} reviewed
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 — Payment */}
            {step >= 3 && (
              <div className="card p-4 sm:p-6 md:p-8">
                <div className="flex items-center gap-4 pb-6 border-b border-cream-200 mb-8">
                  <div className="w-10 h-10 rounded-2xl bg-brand-surface flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-brand-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Select Payment Method</h2>
                </div>

                <div className="space-y-8">
                  <div className="grid gap-4 sm:grid-cols-2 relative">
                    {/* Pay Online */}
                    <button
                      type="button"
                      onClick={() => !placing && setSelectedMethod('RAZORPAY')}
                      className={`group relative flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all duration-300 text-center overflow-hidden
                        ${selectedMethod === 'RAZORPAY' 
                          ? 'border-[#5a3f2f] bg-[#5a3f2f]/5 ring-1 ring-[#5a3f2f]' 
                          : 'border-cream-200 hover:border-[#b88a2f]/40 bg-white'}
                        ${placing ? 'pointer-events-none' : 'cursor-pointer'}
                        ${selectedMethod && selectedMethod !== 'RAZORPAY' ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
                      `}
                    >
                      {selectedMethod === 'RAZORPAY' && (
                        <div className="absolute top-3 right-3 bg-[#5a3f2f] text-white rounded-full p-1 shadow-lg z-10 animate-in zoom-in duration-200">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      
                      {placing && selectedMethod === 'RAZORPAY' && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 animate-in fade-in duration-200">
                          <div className="w-8 h-8 border-3 border-[#5a3f2f] border-t-transparent rounded-full animate-spin mb-2" />
                          <span className="text-[10px] font-bold text-[#5a3f2f] uppercase tracking-widest">Opening Razorpay...</span>
                        </div>
                      )}

                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                        ${selectedMethod === 'RAZORPAY' ? 'bg-[#5a3f2f] text-white shadow-lg' : 'bg-[#b88a2f]/10 text-[#b88a2f]'}
                      `}>
                        <CreditCard className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className={`font-bold transition-colors ${selectedMethod === 'RAZORPAY' ? 'text-[#5a3f2f]' : 'text-gray-900'}`}>Pay Online</h4>
                        <p className="text-[10px] text-[#5a3f2f]/60 uppercase tracking-widest font-black mt-1">UPI · Cards · Wallets</p>
                      </div>
                      <div className="mt-auto pt-4">
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Instant Activation</span>
                      </div>
                    </button>

                    {/* Cash on Delivery */}
                    <button
                      type="button"
                      onClick={() => !placing && setSelectedMethod('COD')}
                      className={`group relative flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all duration-300 text-center overflow-hidden
                        ${selectedMethod === 'COD' 
                          ? 'border-[#5a3f2f] bg-[#5a3f2f]/5 ring-1 ring-[#5a3f2f]' 
                          : 'border-cream-200 hover:border-green-200 bg-white'}
                        ${placing ? 'pointer-events-none' : 'cursor-pointer'}
                        ${selectedMethod && selectedMethod !== 'COD' ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
                      `}
                    >
                      {selectedMethod === 'COD' && (
                        <div className="absolute top-3 right-3 bg-[#5a3f2f] text-white rounded-full p-1 shadow-lg z-10 animate-in zoom-in duration-200">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      {placing && selectedMethod === 'COD' && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 animate-pulse">
                          <div className="w-8 h-8 border-3 border-[#5a3f2f] border-t-transparent rounded-full animate-spin mb-2" />
                          <span className="text-[10px] font-bold text-[#5a3f2f] uppercase tracking-widest">Placing Order...</span>
                        </div>
                      )}

                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                        ${selectedMethod === 'COD' ? 'bg-[#5a3f2f] text-white shadow-lg' : 'bg-green-100 text-green-600'}
                      `}>
                        <Banknote className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className={`font-bold transition-colors ${selectedMethod === 'COD' ? 'text-[#5a3f2f]' : 'text-gray-900'}`}>Cash on Delivery</h4>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1">Pay at your doorstep</p>
                      </div>
                      <div className="mt-auto pt-4">
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">No extra charges</span>
                      </div>
                    </button>
                  </div>

                  {/* Unified Action Button */}
                  <div className="pt-4 border-t border-cream-100">
                    <button
                      onClick={() => handleCreateOrder(selectedMethod)}
                      disabled={!selectedMethod || placing}
                      className={`group relative w-full py-4 sm:py-5 rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 overflow-hidden
                        ${!selectedMethod 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                          : 'bg-[#5a3f2f] text-white hover:bg-[#3b2a1f] shadow-[#5a3f2f]/20'}
                        ${placing ? 'opacity-90 cursor-not-allowed' : ''}
                      `}
                    >
                      {placing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{selectedMethod === 'RAZORPAY' ? 'Opening Razorpay...' : 'Placing Order...'}</span>
                        </>
                      ) : (
                        <>
                          {!selectedMethod && <span>Select Payment Method</span>}
                          {selectedMethod === 'RAZORPAY' && (
                            <>
                              <span>Proceed to Pay ₹{total.toLocaleString('en-IN')}</span>
                              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                          {selectedMethod === 'COD' && (
                            <>
                              <span>Place Order • Pay on Delivery</span>
                              <CheckCircle className="w-5 h-5" />
                            </>
                          )}
                        </>
                      )}
                    </button>
                    
                    <p className="text-[10px] text-gray-400 text-center mt-4 uppercase tracking-[0.15em] font-medium">
                      By placing this order, you agree to our <Link to="/terms" className="underline hover:text-gray-600">Terms & Conditions</Link>
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure Payment</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Fast Shipping</span>
                  </div>
                </div>
              </div>
            )}

          </div> {/* ✅ closes left column (lg:col-span-1) */}

          {/* ✅ Right column — Order Summary (Stickier & Slimmer) */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="card sticky top-24">
              <button
                onClick={() => setShowItems(!showItems)}
                className="w-full flex items-center justify-between p-4 border-b border-cream-200 lg:cursor-default"
              >
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-brand-primary" />
                  Order Summary
                  <span className="badge-featured">{items.length}</span>
                </h2>
                <span className="lg:hidden text-gray-400">
                  {showItems ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {/* Items list */}
              <div className={`overflow-hidden transition-all ${showItems ? 'max-h-96' : 'max-h-0 lg:max-h-none'}`}>
                <div className="p-4 divide-y divide-cream-200 max-h-72 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                      <div className="relative shrink-0">
                        <img
                          src={item.product?.images?.[0]?.url || 'https://placehold.co/48x48/d8f3dc/2d6a4f?text=??'}
                          alt={item.product?.name}
                          className="w-12 h-12 rounded-xl object-cover bg-cream-100"
                        />
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs leading-tight truncate">{item.product?.name}</p>
                        {item.product?.unit && <p className="text-[10px] text-gray-400">{item.product.unit}</p>}
                      </div>
                      <p className="font-bold text-gray-900 text-sm shrink-0">
                        ₹{(Number(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price breakdown */}
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> Shipping
                  </span>
                  {shipping === 0 ? (
                    <span className="font-semibold text-green-600 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> FREE
                    </span>
                  ) : (
                    <span className="font-semibold text-gray-900">₹{shipping.toFixed(2)}</span>
                  )}
                </div>

                {shipping > 0 && (
                  <div className="bg-brand-surface p-2.5 rounded-xl text-xs text-brand-secondary font-medium flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" />
                    Add ₹{(1000 - subtotal).toFixed(2)} more to get free shipping!
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold pt-3 border-t border-cream-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-brand-primary">₹{total.toFixed(2)}</span>
                </div>

                <div className="text-xs text-gray-400 text-center">
                  Including all taxes • Prices in INR
                </div>
              </div>

              {/* Trust badges */}
              <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                {[
                  { icon: <MdSecurity className="w-5 h-5 text-brand-primary" />, label: 'Secure\nPayment' },
                  { icon: <MdLocalShipping className="w-5 h-5 text-brand-primary" />, label: 'Fast\nDelivery' },
                  { icon: <MdAssignmentReturn className="w-5 h-5 text-brand-primary" />, label: 'Easy\nReturns' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 p-2 bg-cream-50 rounded-xl">
                    <div className="bg-white p-1.5 rounded-lg shadow-sm">{icon}</div>
                    <p className="text-[9px] text-gray-500 font-medium text-center leading-tight whitespace-pre-line">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div> {/* ✅ closes right column (lg:col-span-2) */}

        </div> {/* ✅ closes grid */}
      </div> {/* ✅ closes max-w-6xl */}



      {paymentLoading === 'verifying' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="bg-[#fffdfb] rounded-2xl p-8 text-center max-w-xs mx-4 shadow-2xl">
            <div className="w-12 h-12 border-4 border-[#b88a2f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#5b3f2f] font-semibold">
              Confirming your payment...
            </p>
            <p className="text-[#5b3f2f]/60 text-sm mt-1">
              Please do not close this window
            </p>
          </div>
        </div>
      )}
    </div> // ✅ closes min-h-screen
  );
}