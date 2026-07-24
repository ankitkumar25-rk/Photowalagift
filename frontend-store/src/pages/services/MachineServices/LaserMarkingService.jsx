import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Settings, Zap, UploadCloud,
  ShoppingCart, HelpCircle, ChevronLeft,
  Target, ShieldCheck, Info, Loader2
} from 'lucide-react';
import api from '../../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store';
import { toast } from 'react-hot-toast';
import CustomDropdown from '../../../components/CustomDropdown';

const MATERIAL_TYPES = ['Stainless Steel', 'Aluminum', 'Brass/Copper', 'Titanium', 'Anodized Metal', 'Industrial Plastics'];
const MARKING_TYPES = ['Surface Etching', 'Deep Engraving', 'Color Annealing (SS)', 'Carbonizing'];
const QUANTITY_TIERS = ['1 - 20 units', '21 - 100 units', '101 - 500 units', '500+ units'];

export default function LaserMarkingService() {
  const navigate = useNavigate();
  const [orderName, setOrderName] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [markingType, setMarkingType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [dimensions, setDimensions] = useState({ l: '', w: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentOrderData, setCurrentOrderData] = useState(null);

  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const canOrder = useMemo(() => {
    return (
      orderName.trim() &&
      materialType &&
      markingType &&
      quantity &&
      dimensions.l && dimensions.w &&
      selectedFile
    );
  }, [orderName, materialType, markingType, quantity, dimensions, selectedFile]);

  const handleAddOrder = async () => {
    if (!canOrder) return;
    if (!user) {
      toast.error('Please login or sign up to place an order.');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    toast.error('Price is not set by the provider, you can contact them..', { duration: 2000 });
    try {
      setLoading(true);
      let fileUrl = '';
      const formData = new FormData();
      formData.append('design', selectedFile);
      const uploadRes = await api.post('/uploads/design', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (uploadRes.data.success) {
        fileUrl = uploadRes.data.data.url;
      }

      const payload = {
        category: 'MACHINE',
        serviceName: 'Laser Marking Service',
        customerName: orderName.trim(),
        productName: materialType,
        quantity: 1,
        totalAmount: 0,
        fileUrl,
        fileOption: 'online',
        specialRemark: specialInstructions,
        details: {
          markingType,
          quantityTier: quantity,
          dimensions,
        }
      };

      const res = await api.post('/service-orders', payload);
      if (res.data.success) {
        const orderData = {
          orderId: res.data.orderId,
          orderNumber: res.data.orderNumber,
          orderType: 'SERVICE_ORDER',
          totalAmount: 120, // Fixed test amount for marking service
          serviceName: 'Laser Marking Service',
          category: 'MACHINE',
        };

        navigate('/checkout/service', { state: { orderData } });

        // Reset form
        setOrderName(''); setMaterialType(''); setMarkingType(''); setQuantity(''); setDimensions({ l: '', w: '' }); setSelectedFile(null); setSpecialInstructions('');
      }
    } catch (err) {
      console.error(err);
      alert('Order failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] font-sans">
      {/* Header Area */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/services" className="inline-flex items-center text-sm text-gray-500 hover:text-[#a64d24] mb-6 transition-colors font-medium">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Services
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Laser Marking Service</h1>
              <p className="text-gray-600 max-w-2xl leading-relaxed">
                High-speed fiber laser marking for industrial branding, serial numbers, and permanent identification on metals and plastics.
              </p>
            </div>
            <div className="bg-[#f0f7ff] border border-[#d1e9ff] rounded-2xl p-4 flex items-center gap-4">
              <div className="bg-[#3b71ca] p-3 rounded-xl text-white">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#3b71ca] uppercase tracking-wider">Laser Source</p>
                <p className="text-sm font-bold text-gray-900">20W/30W Fiber Laser</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* ── Left Side: Form ── */}
          <div className="flex-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">

              <div className="space-y-8">
                {/* Order Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Order Name</label>
                  <input
                    type="text"
                    value={orderName}
                    onChange={(e) => setOrderName(e.target.value)}
                    placeholder="e.g., Serial Number Marking - Batch A"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3b71ca]/20 focus:border-[#3b71ca] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Material Type */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Material</label>
                    <CustomDropdown
                      options={MATERIAL_TYPES}
                      value={materialType}
                      onChange={(e) => setMaterialType(e.target.value)}
                      placeholder="-- Select Material --"
                    />
                  </div>
                  {/* Marking Type */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Marking Type</label>
                    <CustomDropdown
                      options={MARKING_TYPES}
                      value={markingType}
                      onChange={(e) => setMarkingType(e.target.value)}
                      placeholder="-- Select Process --"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Quantity</label>
                    <CustomDropdown
                      options={QUANTITY_TIERS}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="-- Select Quantity --"
                    />
                  </div>
                  {/* Dimensions */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                      Marking Area <span className="text-[10px] text-gray-400 normal-case font-medium">(L x W in mm)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" placeholder="Length" value={dimensions.l} onChange={(e) => setDimensions({ ...dimensions, l: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-center focus:border-[#3b71ca] focus:outline-none" />
                      <input type="number" placeholder="Width" value={dimensions.w} onChange={(e) => setDimensions({ ...dimensions, w: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-center focus:border-[#3b71ca] focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Artwork / Logos / List</label>
                  <div className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all ${selectedFile ? 'border-blue-400 bg-blue-50/30' : 'border-[#d1a88b] bg-[#fffaf5] hover:bg-[#fbf4ea]'}`}>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.cdr,.psd,.jpg,.jpeg,.png,.csv,.xlsx"
                    />
                    <div className="bg-white p-5 rounded-2xl shadow-sm mb-4">
                      <UploadCloud className={`w-10 h-10 ${selectedFile ? 'text-blue-500' : 'text-[#3b71ca]'}`} />
                    </div>
                    {selectedFile ? (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-blue-600 font-medium">File ready for upload</p>
                        <button onClick={() => document.getElementById('file-upload').click()} className="mt-4 text-xs font-bold text-[#3b71ca] hover:underline uppercase tracking-wider">Change File</button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-900">Drag and drop or <button onClick={() => document.getElementById('file-upload').click()} className="text-[#3b71ca] hover:underline">click to upload</button></p>
                        <p className="text-[11px] text-gray-500 max-w-xs">Accepted formats: DXF, PLT, PDF, CDR, PNG (Max 50MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Instructions */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Special Instructions</label>
                  <textarea
                    rows="4"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="List specific serial numbers, QR code data, or required marking depth..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3b71ca]/20 focus:border-[#3b71ca] transition-all resize-none"
                  />
                </div>

                {/* Add Order Button */}
                <button
                  onClick={handleAddOrder}
                  disabled={!canOrder || loading}
                  className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] ${canOrder && !loading
                    ? 'bg-[#1c1a19] hover:bg-black text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    }`}
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShoppingCart className="w-6 h-6" />}
                  <span className="text-lg">{loading ? 'Processing...' : 'Add Order'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Right Side: Info Panel ── */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            <div className="bg-[#1c1a19] text-white rounded-3xl p-8 shadow-xl">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#f0ba9c]" /> Marking Specs
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-[#f0ba9c] uppercase mb-2">Permanent Bond</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Laser marking is non-removable and resistant to chemicals, abrasion, and heat.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#f0ba9c] uppercase mb-2">Data Integrity</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Ideal for GS1-compliant barcodes, UID, and logos on curved or flat surfaces.
                  </p>
                </div>
                <div className="pt-6 border-t border-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-400">Marking Speed</span>
                    <span className="text-sm font-bold">Up to 7000mm/s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-400">Durability</span>
                    <span className="text-sm font-bold text-green-400">Extreme</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-green-700" />
                <h3 className="font-bold text-gray-900">Industry standards</h3>
              </div>
              <ul className="space-y-3">
                {['MIL-STD-130 Compliant', 'ISO Certified marking', 'Deep engraving available', 'Cylindrical marking'].map((item, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#3b71ca]" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-4 text-gray-600 hover:text-gray-900 transition-colors font-semibold text-sm">
              <HelpCircle className="w-4 h-4" /> Industrial Quote?
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}