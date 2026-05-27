import { useState, useEffect, createElement, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Lock, MapPin, Heart, Package, ChevronRight,
  Edit2, Trash2, Plus, Check, Star, LogOut, Camera,
  Phone, Mail, Shield, Home, Briefcase, X, Settings, CheckCircle, AlertCircle, LoaderCircle
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
          <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
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
/* ── Inline Address Form ── */
function AccountInlineAddressForm({ addr, onCancel, onSave }) {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState(
    addr || {
      label: 'Home',
      fullName: user?.name || '',
      phone: user?.phone || '',
      line1: user?.address || '',
      line2: '',
      city: user?.city || '',
      state: user?.state || '',
      pincode: user?.pincode || '',
      isDefault: false
    }
  );
  const [saving, setSaving] = useState(false);
  
  // Pincode & Autofill States
  const [pincodeStatus, setPincodeStatus] = useState(form.pincode && form.pincode.length === 6 ? 'success' : 'idle');
  const [postOffices, setPostOffices] = useState([]);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [showAreaHelper, setShowAreaHelper] = useState(false);
  const [pincodeStatusText, setPincodeStatusText] = useState('');
  
  const [autoFilledFields, setAutoFilledFields] = useState({
    line1: false,
    city: false,
    state: false
  });

  const lastSearchedPincode = useRef(form.pincode || '');
  const searchTimeoutRef = useRef(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Once user types, remove the auto-filled visual highlight
    setAutoFilledFields(prev => ({ ...prev, [name]: false }));
    
    if (name === 'line1') {
      setShowAreaHelper(false);
    }
  };

  const handleFieldFocus = (e) => {
    const { name } = e.target;
    // Tint disappears as soon as user focuses
    setAutoFilledFields(prev => ({ ...prev, [name]: false }));
  };

  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setForm(prev => ({ ...prev, pincode: value }));

    // Reset status to idle if less than 6 digits
    if (value.length < 6) {
      setPincodeStatus('idle');
      setPincodeStatusText('');
      setPostOffices([]);
      setShowAreaDropdown(false);
      setShowAreaHelper(false);
      
      // Clear line1, city, state back to empty
      setForm(prev => ({
        ...prev,
        line1: '',
        city: '',
        state: ''
      }));
      setAutoFilledFields({ line1: false, city: false, state: false });
      lastSearchedPincode.current = '';
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      return;
    }

    // Exactly 6 digits
    if (value.length === 6) {
      if (value === lastSearchedPincode.current) {
        return;
      }
      
      setPincodeStatus('loading');
      setPincodeStatusText('Fetching location details...');
      
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await api.get(`/address/pincode/${value}`);
          const data = res.data; // { city, state, postOffices }

          lastSearchedPincode.current = value;
          setPincodeStatus('success');
          
          const firstArea = data.postOffices && data.postOffices.length > 0 ? data.postOffices[0] : '';
          setPincodeStatusText(`📍 ${firstArea || data.city}, ${data.city}, ${data.state}`);

          // Set form fields
          setForm(prev => ({
            ...prev,
            city: data.city,
            state: data.state,
            line1: firstArea
          }));

          // Mark as auto-filled
          setAutoFilledFields({
            line1: !!firstArea,
            city: !!data.city,
            state: !!data.state
          });

          if (data.postOffices && data.postOffices.length > 0) {
            setPostOffices(data.postOffices);
            setShowAreaHelper(true);
            if (data.postOffices.length > 1) {
              setShowAreaDropdown(true);
            } else {
              setShowAreaDropdown(false);
            }
          } else {
            setPostOffices([]);
            setShowAreaDropdown(false);
            setShowAreaHelper(false);
          }
        } catch (err) {
          console.error(err);
          lastSearchedPincode.current = value;
          if (err.response?.status === 404) {
            setPincodeStatus('error');
            setPincodeStatusText('Invalid or unknown pincode');
          } else {
            // API down or network issue
            setPincodeStatus('api_down');
            setPincodeStatusText('Could not verify. Fill city and state manually.');
          }
        }
      }, 400);
    }
  };

  const handleAreaSelect = (area) => {
    setForm(prev => ({ ...prev, line1: area }));
    setAutoFilledFields(prev => ({ ...prev, line1: true }));
    setShowAreaDropdown(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.phone || !/^[0-9]{10}$/.test(form.phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    if (!form.pincode || !/^[0-9]{6}$/.test(form.pincode)) {
      toast.error('Pincode must be exactly 6 digits');
      return;
    }

    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-cream-200 p-6 sm:p-8 space-y-6 shadow-sm animate-in fade-in duration-300 max-w-xl mx-auto">
      <h3 className="font-bold text-xl text-gray-900 border-b border-cream-200 pb-4">
        {addr ? 'Edit Address' : 'Add New Address'}
      </h3>
      <form onSubmit={submit} className="space-y-6">
        <div className="flex gap-2">
          {['Home', 'Work', 'Other'].map((l) => (
            <button
              key={l} type="button"
              onClick={() => setForm((f) => ({ ...f, label: l }))}
              className={`flex-1 px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
                form.label === l
                  ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                  : 'bg-cream-100 border-transparent text-gray-700 hover:bg-cream-200'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* 1. Full Name & 2. Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Full Name *</label>
            <input 
              name="fullName" 
              value={form.fullName} 
              onChange={handleFieldChange} 
              onFocus={handleFieldFocus}
              required 
              className="input-field" 
              placeholder="John Doe" 
            />
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

        {/* 3. Pincode */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Pincode *</label>
          <div className="relative">
            <input 
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="pincode" 
              value={form.pincode} 
              onChange={handlePincodeChange} 
              required 
              maxLength="6"
              className={`input-field pr-10 border transition-all duration-200 ${
                pincodeStatus === 'success' ? 'border-[#2d6a4f] focus:ring-[#2d6a4f]/20' :
                pincodeStatus === 'error' ? 'border-[#c0392b] focus:ring-[#c0392b]/20' :
                'border-[#f5e7d8] focus:border-[#b88a2f] focus:ring-[#b88a2f]/20'
              }`}
              placeholder="6-digit pincode"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              {pincodeStatus === 'loading' && <LoaderCircle className="w-5 h-5 text-[#8a7060] animate-spin" />}
              {pincodeStatus === 'success' && <Check className="w-5 h-5 text-[#2d6a4f]" />}
              {pincodeStatus === 'error' && <X className="w-5 h-5 text-[#c0392b]" />}
            </div>
          </div>
          {pincodeStatusText && (
            <p className={`text-xs mt-1 font-medium ${
              pincodeStatus === 'loading' ? 'text-[#8a7060]' :
              pincodeStatus === 'success' ? 'text-[#2d6a4f]' :
              pincodeStatus === 'error' ? 'text-[#c0392b]' :
              'text-[#8a7060]' // api_down
            }`}>
              {pincodeStatusText}
            </p>
          )}
        </div>

        {/* 4. Address Line 1 */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Address Line 1 *</label>
          <input 
            type="text"
            name="line1" 
            value={form.line1} 
            onChange={handleFieldChange} 
            onFocus={handleFieldFocus}
            required 
            className={`input-field transition-all duration-200 ${
              autoFilledFields.line1 ? 'bg-[#f5efe8] border-[#b88a2f]' : ''
            }`} 
            placeholder="Flat, House no., Street, Area" 
          />
          {showAreaHelper && form.line1 && (
            <p className="text-xs text-[#8a7060] mt-1 italic">
              Area auto-filled. Add flat/house/street details above.
            </p>
          )}
          {showAreaDropdown && postOffices.length > 1 && (
            <div className="mt-2 bg-cream-50/50 border border-cream-200 rounded-xl p-3">
              <label className="text-[10px] font-bold text-[#8a7060] uppercase block mb-1">Select your area</label>
              <select 
                onChange={(e) => handleAreaSelect(e.target.value)} 
                value={form.line1}
                className="w-full bg-white border border-[#f5e7d8] rounded-lg px-2.5 py-1.5 text-xs text-[#5b3f2f] focus:outline-none focus:border-[#b88a2f]"
              >
                {postOffices.map((po, idx) => (
                  <option key={idx} value={po}>{po}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 5. Address Line 2 */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Address Line 2 (Optional)</label>
          <input 
            name="line2" 
            value={form.line2} 
            onChange={handleFieldChange} 
            onFocus={handleFieldFocus}
            className="input-field" 
            placeholder="Flat, Floor, Building" 
          />
        </div>

        {/* 6. City & 7. State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">City *</label>
            <input 
              name="city" 
              value={form.city} 
              onChange={handleFieldChange} 
              onFocus={handleFieldFocus}
              required 
              className={`input-field transition-all duration-200 ${
                autoFilledFields.city ? 'bg-[#f5efe8] border-[#b88a2f]' : ''
              }`} 
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">State *</label>
            <input 
              name="state" 
              value={form.state} 
              onChange={handleFieldChange} 
              onFocus={handleFieldFocus}
              required 
              className={`input-field transition-all duration-200 ${
                autoFilledFields.state ? 'bg-[#f5efe8] border-[#b88a2f]' : ''
              }`} 
            />
          </div>
        </div>

        {/* 8. Set as default address */}
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
          <button type="button" onClick={onCancel} className="btn-secondary flex-1 justify-center rounded-2xl py-3.5 text-xs font-bold uppercase tracking-wider">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center rounded-2xl py-3.5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand-primary/20">
            {saving ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : 'Save Address'}
          </button>
        </div>
      </form>
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
    if (profile.phone && !/^[0-9]{10}$/.test(profile.phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
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
            <div className="p-6 bg-brand-primary text-white rounded-2xl border border-brand-primary shadow-lg overflow-hidden relative">
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
            {addrModal ? (
              <AccountInlineAddressForm
                addr={typeof addrModal === 'object' ? addrModal : null}
                onCancel={() => setAddrModal(null)}
                onSave={saveAddress}
              />
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-xl text-gray-900">
                    Saved Addresses
                  </h2>
                  <button onClick={() => setAddrModal('new')} className="btn-primary py-2 px-4 text-sm gap-1.5 rounded-2xl">
                    <Plus className="w-4 h-4" /> Add Address
                  </button>
                </div>
                {addresses.length === 0 ? (
                  <div className="card p-12 text-center">
                    <MapPin className="w-14 h-14 mx-auto mb-3 text-cream-50/80" />
                    <h3 className="font-bold text-gray-800 text-lg mb-1">No addresses saved</h3>
                    <p className="text-gray-500 text-sm mb-4">Add a delivery address to speed up checkout</p>
                    <button onClick={() => setAddrModal('new')} className="btn-primary rounded-2xl">
                      <Plus className="w-4 h-4" /> Add First Address
                    </button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
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


    </div>
  );
}

