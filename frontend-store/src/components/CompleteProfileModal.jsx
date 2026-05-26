import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../api/client';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

export default function CompleteProfileModal({ user, onComplete, isOpen }) {
  const [form, setForm] = useState({
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      const { data } = await api.post('/users/complete-profile', profileData);
      return data;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      onComplete();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!form.phone.trim()) {
      return toast.error('Phone number is required');
    }
    if (!/^[0-9]{10}$/.test(form.phone)) {
      return toast.error('Phone must be exactly 10 digits');
    }

    updateProfileMutation.mutate(form);
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 px-6 py-5 border-b border-cream-300 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Complete Your Profile</h2>
            <p className="text-sm text-gray-600 mt-1">Add your contact details to get started</p>
          </div>
          <button 
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
            <div className="flex">
              <div className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg flex items-center font-semibold text-gray-600">+91</div>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) setForm({ ...form, phone: val });
                }}
                placeholder="10-digit mobile number"
                className="flex-1 input-field rounded-l-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Must be exactly 10 digits (Indian format)</p>
          </div>

          {/* Address Section */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm">Primary Address (Optional)</h3>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
              <input
                type="text"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                placeholder="House no., Building name"
                className="input-field w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g., Delhi"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g., Delhi"
                  className="input-field w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 6) setForm({ ...form, pincode: val });
                  }}
                  placeholder="e.g., 110001"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  value={form.country}
                  disabled
                  className="input-field w-full bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>ℹ️ Note:</strong> You can always update your profile later from your account settings.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              disabled={updateProfileMutation.isPending}
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex-1 btn-primary justify-center py-3"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
