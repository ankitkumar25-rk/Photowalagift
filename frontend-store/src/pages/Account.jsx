import { useState, useEffect, createElement, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Lock, MapPin, Heart, Package, ChevronRight,
  Edit2, Trash2, Plus, Check, Star, LogOut, Camera,
  Phone, Mail, Shield, Home, Briefcase, X, Settings, CheckCircle, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';
import { usersApi, ordersApi } from '../api';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import api from '../api/client';

const TABS = [
  { id: 'profile',   label: 'Profile',   icon: User },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'security',  label: 'Security',  icon: Lock },
  { id: 'wishlist',  label: 'Wishlist',  icon: Heart },
  { id: 'services',  label: 'Services Ledger', icon: Settings },
];

/* ── Status badge ── */
function StatusBadge({ status }) {
  const map = {
    PENDING:    { bg: 'bg-[#b88a2f]', text: 'text-white', label: 'Pending' },
    CONFIRMED:  { bg: 'bg-blue-500', text: 'text-white', label: 'Confirmed' },
    PROCESSING: { bg: 'bg-purple-500', text: 'text-white', label: 'Processing' },
    SHIPPED:    { bg: 'bg-indigo-500', text: 'text-white', label: 'Shipped' },
    DELIVERED:  { bg: 'bg-green-500', text: 'text-white', label: 'Delivered' },
    CANCELLED:  { bg: 'bg-red-500', text: 'text-white', label: 'Cancelled' },
    REFUNDED:   { bg: 'bg-gray-500', text: 'text-white', label: 'Refunded' },
  };
  const s = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

/* ── Address card ── */
function AddressCard({ addr, onEdit, onDelete, onSetDefault }) {
  return (
    <div className={`relative p-4 rounded-2xl border-2 transition-all ${
      addr.isDefault ? 'border-brand-secondary bg-brand-surface' : 'border-cream-300 bg-white hover:border-brand-secondary'
    }`}>
      {addr.isDefault && (
        <span className="absolute top-3 right-3 badge-featured text-[10px]">
          <Check className="w-3 h-3" /> Default
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          addr.isDefault ? 'bg-brand-primary/10' : 'bg-cream-200'
        }`}>
          {addr.label === 'Work' ? (
            <Briefcase className="w-4 h-4 text-brand-primary" />
          ) : (
            <Home className="w-4 h-4 text-brand-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{addr.label} — {addr.fullName}</p>
          <p className="text-sm text-gray-600 mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
          <p className="text-sm text-gray-600">{addr.city}, {addr.state} —œ {addr.pincode}</p>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
            <Phone className="w-3 h-3" /> {addr.phone}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-cream-200">
        {!addr.isDefault && (
          <button
            onClick={() => onSetDefault(addr.id)}
            className="text-xs font-semibold text-brand-primary hover:text-brand-primary px-2 py-1 rounded-lg hover:bg-brand-surface transition-colors"
          >
            Set as Default
          </button>
        )}
        <button
          onClick={() => onEdit(addr)}
          className="ml-auto btn-ghost py-1 px-2 text-xs gap-1"
        >
          <Edit2 className="w-3 h-3" /> Edit
        </button>
        <button
          onClick={() => onDelete(addr.id)}
          className="btn-ghost py-1 px-2 text-xs text-red-500 hover:bg-red-50 gap-1"
        >
          <Trash2 className="w-3 h-3" /> Delete
        </button>
      </div>
    </div>
  );
}

/* ── Address modal ── */
function AddressModal({ addr, onClose, onSave }) {
  const [form, setForm] = useState(
    addr || { label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false }
  );
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

      setForm(prev => ({
        ...prev,
        line1: place.formatted_address,
        city: get('locality') || get('sublocality_level_1') || get('administrative_area_level_2'),
        state: get('administrative_area_level_1'),
        pincode: get('postal_code'),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
        <div className="flex items-center justify-between p-6 border-b border-cream-200">
          <h3 className="font-bold text-xl text-gray-900">
            {addr ? 'Edit Address' : 'Add New Address'}
          </h3>
          <button onClick={onClose} className="btn-ghost p-2"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="flex gap-2">
            {['Home', 'Work', 'Other'].map((l) => (
              <button
                key={l} type="button"
                onClick={() => setForm((f) => ({ ...f, label: l }))}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                  form.label === l
                    ? 'border-brand-secondary bg-brand-surface text-brand-primary'
                    : 'border-cream-300 text-gray-500 hover:border-brand-secondary'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Full Name *</label>
              <input name="fullName" value={form.fullName} onChange={handle} required className="input-field" placeholder="John Doe" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Phone *</label>
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
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-bold">
              Address Line 1 *
            </label>
            {isLoaded ? (
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  name="line1"
                  value={form.line1}
                  onChange={handle}
                  placeholder="Start typing your address..."
                  autoComplete="off"
                  required
                  className={`w-full rounded-xl px-4 py-3 pr-10 border bg-white text-[#5b3f2f] placeholder-[#5b3f2f]/30 focus:outline-none focus:ring-2 transition-all duration-200 font-[DM_Sans] ${
                    isValidAddress ? 'border-green-400 focus:ring-green-100' : 'border-[#f5e7d8] focus:ring-[#b88a2f]/20 focus:border-[#b88a2f]'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidAddress ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : form.line1 ? (
                    <MapPin className="w-5 h-5 text-[#b88a2f] animate-pulse" />
                  ) : null}
                </div>
                {!isValidAddress && form.line1?.length > 3 && (
                  <p className="text-[10px] text-[#b88a2f] mt-1 flex items-center gap-1 italic">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    Select from suggestions for accurate delivery
                  </p>
                )}
              </div>
            ) : (
              <input
                ref={inputRef}
                type="text"
                name="line1"
                value={form.line1}
                onChange={handle}
                placeholder="Flat, House no., Street, Area"
                required
                className="input-field"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Address Line 2 (Optional)</label>
            <input name="line2" value={form.line2} onChange={handle} className="input-field" placeholder="Flat, Floor, Building" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">City *</label>
              <input name="city" value={form.city} onChange={handle} required className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">State *</label>
              <input name="state" value={form.state} onChange={handle} required className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Pincode *</label>
              <input name="pincode" value={form.pincode} onChange={handlePincodeChange} required className="input-field" maxLength="6" />
              {pincodeError && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {pincodeError}
                </p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="w-4 h-4 accent-brand-primary rounded"
            />
            <span className="text-sm font-medium text-gray-700">Set as default address</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving || isValidating} className="btn-primary flex-1 justify-center">
              {saving || isValidating ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isValidating ? 'Validating...' : 'Saving...'}
                </div>
              ) : 'Save Address'}
            </button>
          </div>
        </form>

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
      </div>
    </div>
  );
}

export default function Account() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const [tab, setTab] = useState('profile');
  const [profile, setProfile]   = useState({ name: '', phone: '' });
  const [saving, setSaving]     = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addrModal, setAddrModal] = useState(null); // null=closed, 'new'=new, addr obj=edit
  const [wishlist, setWishlist]   = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (user) setProfile({ name: user.name || '', phone: user.phone || '' });
  }, [user]);

  useEffect(() => {
    if (tab === 'addresses') loadAddresses();
    if (tab === 'wishlist')  loadWishlist();
    if (tab === 'profile')   loadRecentOrders();
    if (tab === 'services')  navigate('/account/services');
  }, [tab]);

  const loadAddresses = async () => {
    try { const { data } = await usersApi.getAddresses(); setAddresses(data.data); } catch (err) { toast.error('Failed to load addresses'); }
  };

  const loadWishlist = async () => {
    try { const { data } = await usersApi.getWishlist(); setWishlist(data.data); } catch (err) { toast.error('Failed to load wishlist'); }
  };

  const loadRecentOrders = async () => {
    try { const { data } = await ordersApi.myOrders({ limit: 3 }); setRecentOrders(data.data); } catch (err) { toast.error('Failed to load recent orders'); }
  };

  /* ── Profile save ── */
  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await usersApi.updateProfile(profile);
      const updatedUser = response.data?.data || response.data;
      if (updatedUser) {
        useAuthStore.getState().updateProfile(updatedUser);
      }
      await fetchMe();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  /* ── Password ── */
  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      await usersApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setPwSaving(false); }
  };

  /* ── Address actions ── */
  const saveAddress = async (form) => {
    try {
      let response;
      if (addrModal && typeof addrModal === 'object' && addrModal.id) {
        response = await usersApi.updateAddress(addrModal.id, form);
        toast.success('Address updated!');
      } else {
        response = await usersApi.addAddress(form);
        toast.success('Address added!');
      }
      const savedAddr = response.data?.data || response.data;
      if (savedAddr && (savedAddr.isDefault || addresses.length === 0)) {
        useAuthStore.getState().updateProfile({
          address: savedAddr.line1,
          city: savedAddr.city,
          state: savedAddr.state,
          pincode: savedAddr.pincode,
          phone: savedAddr.phone,
        });
      }
      await fetchMe();
      setAddrModal(null);
      loadAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
      throw err;
    }
  };

  const deleteAddress = async (id) => {
    if (!confirm('Delete this address?')) return;
    try {
      await usersApi.deleteAddress(id);
      toast.success('Address deleted');
      await fetchMe();
      loadAddresses();
    } catch { toast.error('Failed to delete'); }
  };

  const setDefaultAddress = async (id) => {
    try {
      await usersApi.setDefaultAddr(id);
      const target = addresses.find((a) => a.id === id);
      if (target) {
        useAuthStore.getState().updateProfile({
          address: target.line1,
          city: target.city,
          state: target.state,
          pincode: target.pincode,
          phone: target.phone,
        });
      }
      await fetchMe();
      loadAddresses();
    } catch { toast.error('Failed to set default'); }
  };

  const removeWishlist = async (productId) => {
    try {
      await usersApi.removeWishlist(productId);
      setWishlist((w) => w.filter((i) => i.productId !== productId));
      toast.success('Removed from wishlist');
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to remove from wishlist'); }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Logged out');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream-100 luxury-grain pt-24 pb-12 px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-brand-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-100 h-100 bg-brand-secondary/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-gray-400 text-xs font-semibold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
          <Link to="/" className="hover:text-brand-secondary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-brand-primary">My Account</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 p-6 md:p-8 bg-white rounded-3xl border border-cream-200 shadow-sm transition-all">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover shadow-sm border-2 border-cream-200" />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-brand-primary text-white flex items-center justify-center text-2xl md:text-3xl font-bold shadow-sm">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-brand-primary truncate">
                Welcome, {user.name?.split(' ')[0]?.toUpperCase()} 
              </h1>
              <p className="text-gray-500 flex items-center gap-1.5 mt-1 md:mt-2 text-xs md:text-sm font-medium truncate">
                <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" /> {user.email}
              </p>
              {user.phone && (
                <p className="text-gray-500 flex items-center gap-1.5 mt-1 text-xs md:text-sm font-medium truncate">
                  <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" /> {user.phone}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-red-100 transition-all w-full md:w-auto"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center p-1.5 bg-cream-100 rounded-pill border border-cream-200 mb-8 overflow-x-auto no-scrollbar whitespace-nowrap gap-1">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 md:px-6 py-2.5 rounded-xl md:rounded-pill text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300 shrink-0 ${
                tab === id 
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' 
                  : 'text-gray-500 hover:text-brand-primary hover:bg-brand-surface'
              }`}
            >
              {createElement(icon, { className: 'w-3.5 h-3.5 md:w-4 md:h-4' })} {label}
            </button>
          ))}
        </div>
        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card p-6">
                <h2 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-primary" /> Personal Information
                </h2>
                <form onSubmit={saveProfile} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Full Name</label>
                      <input
                        value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                        className="input-field bg-cream-50/50 focus:bg-white transition-all"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Phone</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 10) setProfile((p) => ({ ...p, phone: val }));
                        }}
                        pattern="[0-9]{10}"
                        className="input-field bg-cream-50/50 focus:bg-white transition-all"
                        placeholder="10-digit mobile number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Email (Read-only)</label>
                    <div className="relative">
                      <input value={user.email} disabled className="input-field opacity-60 cursor-not-allowed bg-cream-100/50" />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <button type="submit" disabled={saving} className="btn-primary w-full justify-center mt-4 py-4 shadow-xl shadow-brand-primary/10 hover:shadow-brand-primary/20">
                    {saving ? 'UPDATING PROFILE...' : 'UPDATE PERSONAL INFO'}
                  </button>
                </form>
              </div>
            </div>

            {/* Recent orders widget */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-brand-primary" /> Recent Orders
                </h3>
                <button onClick={() => navigate('/orders')} className="text-xs font-semibold text-brand-primary hover:text-brand-primary">
                  View all →
                </button>
              </div>
              {recentOrders.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => navigate(`/orders/${o.id}`)}
                      className="w-full text-left p-3 rounded-xl bg-cream-100 hover:bg-brand-surface transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-900">{o.orderNumber}</p>
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">₹{Number(o.total).toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Services history quick link */}
            <div className="card p-6 bg-brand-primary text-white">
              <h3 className="font-bold flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4" /> Machine & Print Services
              </h3>
              <p className="text-xs text-white/80 mb-4">Track your custom printing and laser cutting requests.</p>
              <button 
                onClick={() => navigate('/account/services')}
                className="w-full py-2 bg-white text-brand-primary rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] transition-transform"
              >
                View Services Ledger
              </button>
            </div>
          </div>
        )}

        {/* ── ADDRESSES TAB ── */}
        {tab === 'addresses' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-xl text-gray-900">
                Saved Addresses
              </h2>
              <button onClick={() => setAddrModal('new')} className="btn-primary py-2 px-4 text-sm gap-1.5">
                <Plus className="w-4 h-4" /> Add Address
              </button>
            </div>
            {addresses.length === 0 ? (
              <div className="card p-12 text-center">
                <MapPin className="w-14 h-14 mx-auto mb-3 text-cream-50/80" />
                <h3 className="font-bold text-gray-800 text-lg mb-1">No addresses saved</h3>
                <p className="text-gray-500 text-sm mb-4">Add a delivery address to speed up checkout</p>
                <button onClick={() => setAddrModal('new')} className="btn-primary">
                  <Plus className="w-4 h-4" /> Add First Address
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {addresses.map((a) => (
                  <AddressCard
                    key={a.id}
                    addr={a}
                    onEdit={(a) => setAddrModal(a)}
                    onDelete={deleteAddress}
                    onSetDefault={setDefaultAddress}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {tab === 'security' && (
          <div className="max-w-lg">
            <div className="card p-6">
              <h2 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-primary" /> Change Password
              </h2>
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Current Password</label>
                  <input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    required className="input-field" placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">New Password</label>
                  <input
                    type="password"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                    required minLength={8} className="input-field" placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Confirm New Password</label>
                  <input
                    type="password"
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                    required className="input-field" placeholder="Repeat new password"
                  />
                </div>
                {pwForm.newPassword && pwForm.confirm && pwForm.newPassword !== pwForm.confirm && (
                  <p className="text-sm text-red-500 font-medium">Passwords do not match</p>
                )}
                <button type="submit" disabled={pwSaving} className="btn-primary w-full justify-center">
                  {pwSaving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── WISHLIST TAB ── */}
        {tab === 'wishlist' && (
          <div>
            <h2 className="font-bold text-xl text-gray-900 mb-6">
              My Wishlist ({wishlist.length})
            </h2>
            {wishlist.length === 0 ? (
              <div className="card p-12 text-center">
                <Heart className="w-14 h-14 mx-auto mb-3 text-cream-50/80" />
                <h3 className="font-bold text-gray-800 text-lg mb-1">Your wishlist is empty</h3>
                <p className="text-gray-500 text-sm mb-4">Save products you love for later</p>
                <button onClick={() => navigate('/products')} className="btn-primary">
                  Explore Products
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {wishlist.map(({ product }) => (
                  <div key={product.id} className="card group">
                    <div className="relative aspect-square bg-cream-100 overflow-hidden">
                      <img
                        src={product.images?.[0]?.url || 'https://placehold.co/300x300/d8f3dc/2d6a4f?text=🏆'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={() => removeWishlist(product.id)}
                        className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</p>
                      <p className="text-brand-primary font-bold mt-1">₹{Number(product.price).toFixed(2)}</p>
                      <button
                        onClick={() => navigate(`/products/${product.slug}`)}
                        className="btn-primary w-full justify-center text-sm py-2 mt-2"
                      >
                        View Product
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Address Modal */}
      {addrModal !== null && (
        <AddressModal
          addr={typeof addrModal === 'object' ? addrModal : null}
          onClose={() => setAddrModal(null)}
          onSave={saveAddress}
        />
      )}
    </div>
  );
}

