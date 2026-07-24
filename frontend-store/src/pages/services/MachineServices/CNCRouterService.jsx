import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PenTool, Scissors, UploadCloud,
  ShoppingCart, HelpCircle, ChevronLeft,
  Layers, HardHat, Info, Loader2
} from 'lucide-react';
import api from '../../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store';
import { toast } from 'react-hot-toast';
import CustomDropdown from '../../../components/CustomDropdown';

const MATERIAL_TYPES = ['Solid Wood', 'Plywood / MDF', 'Acrylic Sheets', 'Aluminum Composite (ACP)', 'PVC / Foam Board', 'Solid Surface (Corian)'];
const PROCESS_TYPES = ['2D Profile Cutting', '3D Carving / Bas-Relief', 'Drilling & Pocketing', 'V-Groove Folding'];
const QUANTITY_TIERS = ['1 - 5 units', '6 - 20 units', '21 - 50 units', '50+ units'];

export default function CNCRouterService() {
  const navigate = useNavigate();
  const [orderName, setOrderName] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [processType, setProcessType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [dimensions, setDimensions] = useState({ l: '', w: '', h: '' });
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
      processType &&
      quantity &&
      dimensions.l && dimensions.w && dimensions.h &&
      selectedFile
    );
  }, [orderName, materialType, processType, quantity, dimensions, selectedFile]);

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
        serviceName: 'CNC Router Service',
        customerName: orderName.trim(),
        productName: materialType,
        quantity: 1,
        totalAmount: 0,
        fileUrl,
        fileOption: 'online',
        specialRemark: specialInstructions,
        details: {
          processType,
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
          totalAmount: 150, // Fixed test amount for CNC service
          serviceName: 'CNC Router Service',
          category: 'MACHINE',
        };

        navigate('/checkout/service', { state: { orderData } });

        // Reset form
        setOrderName(''); setMaterialType(''); setProcessType(''); setQuantity(''); setDimensions({ l: '', w: '', h: '' }); setSelectedFile(null); setSpecialInstructions('');
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
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">CNC Router Service</h1>
              <p className="text-gray-600 max-w-2xl leading-relaxed">
                Precision 3D carving and large-format profile cutting for furniture, signage, and complex architectural components.
              </p>
            </div>
            <div className="bg-[#fff9db] border border-[#f5e7a1] rounded-2xl p-4 flex items-center gap-4">
              <div className="bg-[#f08c00] p-3 rounded-xl text-white">
                <PenTool className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#f08c00] uppercase tracking-wider">Bed Capacity</p>
                <p className="text-sm font-bold text-gray-900">8ft x 4ft Heavy Duty</p>
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
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Project Title</label>
                  <input
                    type="text"
                    value={orderName}
                    onChange={(e) => setOrderName(e.target.value)}
                    placeholder="e.g., Carved Oak Door Panel - Set of 4"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#f08c00]/20 focus:border-[#f08c00] transition-all"
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
                  {/* Process Type */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">CNC Process</label>
                    <CustomDropdown
                      options={PROCESS_TYPES}
                      value={processType}
                      onChange={(e) => setProcessType(e.target.value)}
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
                      Sheet Size / Dimensions <span className="text-[10px] text-gray-400 normal-case font-medium">(L x W x H in mm)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <input type="number" placeholder="L" value={dimensions.l} onChange={(e) => setDimensions({ ...dimensions, l: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-center focus:border-[#f08c00] focus:outline-none" />
                      <input type="number" placeholder="W" value={dimensions.w} onChange={(e) => setDimensions({ ...dimensions, w: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-center focus:border-[#f08c00] focus:outline-none" />
                      <input type="number" placeholder="H" value={dimensions.h} onChange={(e) => setDimensions({ ...dimensions, h: e.target.value })} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-center focus:border-[#f08c00] focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">CAD / 3D Model File</label>
                  <div className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all ${selectedFile ? 'border-orange-400 bg-orange-50/30' : 'border-[#d1a88b] bg-[#fffaf5] hover:bg-[#fbf4ea]'}`}>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".stl,.obj,.step,.pdf,.cdr,.dwg,.dxf"
                    />
                    <div className="bg-white p-5 rounded-2xl shadow-sm mb-4">
                      <UploadCloud className={`w-10 h-10 ${selectedFile ? 'text-orange-500' : 'text-[#f08c00]'}`} />
                    </div>
                    {selectedFile ? (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-orange-600 font-medium">File ready for upload</p>
                        <button onClick={() => document.getElementById('file-upload').click()} className="mt-4 text-xs font-bold text-[#f08c00] hover:underline uppercase tracking-wider">Change File</button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-900">Drag and drop or <button onClick={() => document.getElementById('file-upload').click()} className="text-[#f08c00] hover:underline">click to upload</button></p>
                        <p className="text-[11px] text-gray-500 max-w-xs">Accepted formats: STL, STEP, DXF, DWG, CDR (Max 200MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Instructions */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Technical Details</label>
                  <textarea
                    rows="4"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Mention specific tolerances, finishing requirements, or bit preferences if any..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#f08c00]/20 focus:border-[#f08c00] transition-all resize-none"
                  />
                </div>

                {/* Add Order Button */}
                <button
                  onClick={handleAddOrder}
                  disabled={!canOrder || loading}
                  className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] ${canOrder && !loading
                    ? 'bg-[#a64d24] hover:bg-[#8c3a1b] text-white shadow-lg hover:shadow-xl'
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
                <Layers className="w-5 h-5 text-[#f0ba9c]" /> Large Format
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-[#f0ba9c] uppercase mb-2">Massive Bed Size</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Our router can handle full 8ft x 4ft sheets, making it ideal for large signage and furniture parts.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#f0ba9c] uppercase mb-2">3D Depth</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Capable of intricate 3D carvings up to 150mm depth in solid wood and soft metals.
                  </p>
                </div>
                <div className="pt-6 border-t border-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-400">Production Time</span>
                    <span className="text-sm font-bold">4-5 Days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-400">Material Prep</span>
                    <span className="text-sm font-bold text-green-400">Professional</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <HardHat className="w-5 h-5 text-[#f08c00]" />
                <h3 className="font-bold text-gray-900">Safety & Precision</h3>
              </div>
              <ul className="space-y-3">
                {['Vacuum bed for stability', 'Automatic tool changer', 'Dust-free processing', 'Edge banding available'].map((item, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#f08c00]" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-4 text-gray-600 hover:text-gray-900 transition-colors font-semibold text-sm">
              <HelpCircle className="w-4 h-4" /> Signage Partnership?
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
