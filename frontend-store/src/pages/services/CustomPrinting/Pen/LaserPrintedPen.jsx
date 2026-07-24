import { useState, useMemo, createElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PenTool, StickyNote, Printer, FileText, Tag, Book, Mail,
  HelpCircle, UploadCloud, AlertTriangle, ShieldCheck, Award, ShoppingCart, Truck, Loader2, Paperclip
} from 'lucide-react';
import api from '../../../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../../store';
import { serviceAssets } from '../../../../data/assets';
import { toast } from 'react-hot-toast';
import CustomDropdown from '../../../../components/CustomDropdown';

import {
  FaPenNib, FaNoteSticky, FaPrint, FaFileSignature,
  FaTag, FaFileInvoiceDollar, FaEnvelope
} from 'react-icons/fa6';
import ZoomableImage from '../../../../components/ZoomableImage';

const SIDEBAR_LINKS = [
  { id: 'pen', icon: FaPenNib, label: 'Pen', to: '/services/custom-printing/pen', active: true },
  { id: 'sticker', icon: FaNoteSticky, label: 'Sticker Labels', to: '/services/custom-printing/sticker-labels' },
  { id: 'digital', icon: FaPrint, label: 'Digital Paper Printing', to: '/services/custom-printing/digital-printing' },
  { id: 'letterhead', icon: FaFileSignature, label: 'Letterhead', to: '/services/custom-printing/letterhead' },
  { id: 'garment', icon: FaTag, label: 'Garment Tag', to: '/services/custom-printing/garment-tag' },
  { id: 'billbook', icon: FaFileInvoiceDollar, label: 'Bill Book', to: '/services/custom-printing/bill-book' },
  { id: 'envelope', icon: FaEnvelope, label: 'Envelope', to: '/services/custom-printing/envelope' },
];


// Pen type price per unit (₹)
const PEN_PRICES = {
  1: 22, 2: 24, 3: 26, 4: 31, 5: 32, 6: 32, 7: 39, 8: 36, 9: 44, 10: 44,
  11: 44, 12: 44, 13: 37, 14: 37, 15: 44, 16: 49, 17: 54, 18: 69, 19: 74, 20: 74,
};

const PEN_TYPES = Object.keys(PEN_PRICES).map(Number);
const QTY_OPTIONS = [10, 25, 50, 100, 250, 500];
const GST_RATE = 0.18;

export default function LaserPrintedPen() {
  const navigate = useNavigate();
  const [orderName, setOrderName] = useState('');
  const [penType, setPenType] = useState('');
  const [qty, setQty] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('courier');
  const [designOption, setDesignOption] = useState('online');
  const [remark, setRemark] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentOrderData, setCurrentOrderData] = useState(null);

  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      const allowed = ['pdf', 'cdr', 'psd', 'jpeg', 'jpg', 'png'];
      if (allowed.includes(ext)) {
        setSelectedFile(file);
      } else {
        alert('Invalid format. Allowed: PDF, CDR, PSD, JPEG, PNG');
      }
    }
  };

  // Live price calculation
  const pricing = useMemo(() => {
    if (!penType || !qty || Number(qty) <= 0) return null;

    const target = PEN_PRICES[Number(penType)] || 74;
    const q = Number(qty);

    // Logarithmic decay formula: price = target + (150 - target) * (1 - log(qty) / log(500))
    // Clamp effective qty to [1, 500] for unit price curve
    const effectiveQtyForDecay = Math.min(Math.max(q, 1), 500);
    const unitCost = Math.round(target + (150 - target) * (1 - Math.log(effectiveQtyForDecay) / Math.log(500)));

    const baseCost = unitCost * q;
    const emailCharge = designOption === 'email' ? 10 : 0;
    const applicable = baseCost + emailCharge;
    const gst = applicable * GST_RATE;
    const total = applicable + gst;

    return {
      unitCost,
      baseCost: baseCost.toFixed(2),
      emailCharge: emailCharge.toFixed(2),
      applicable: applicable.toFixed(2),
      gst: gst.toFixed(2),
      total: total.toFixed(2),
    };
  }, [penType, qty, designOption]);

  const canOrder = Boolean(
    !loading &&
    orderName.trim() &&
    penType &&
    qty &&
    (designOption === 'email' || (designOption === 'online' && selectedFile))
  );

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

      if (designOption === 'online' && selectedFile) {
        const formData = new FormData();
        formData.append('design', selectedFile);
        const uploadRes = await api.post('/uploads/design', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data.success) {
          fileUrl = uploadRes.data.data.url;
        }
      }

      const payload = {
        category: 'PRINTING',
        serviceName: 'Laser Printed Pen',
        customerName: orderName.trim(),
        productName: `Type ${penType}`,
        quantity: Number(qty),
        totalAmount: Number(pricing.total),
        fileUrl: fileUrl || (designOption === 'email' ? 'SEND_VIA_EMAIL' : ''),
        fileOption: designOption,
        specialRemark: remark,
        details: {
          deliveryOption: 'courier',
          penType: String(penType),
          pricing: {
            applicableCost: Number(pricing.applicable),
            emailCharge: Number(pricing.emailCharge),
            gst: Number(pricing.gst),
          }
        }
      };

      const res = await api.post('/service-orders', payload);
      if (res.data.success) {
        const orderData = {
          orderId: res.data.orderId,
          orderNumber: res.data.orderNumber,
          orderType: 'SERVICE_ORDER',
          totalAmount: Number(pricing.total),
          serviceName: 'Laser Printed Pen',
          category: 'PRINTING',
        };

        navigate('/checkout/service', { state: { orderData } });

        setOrderName('');
        setPenType('');
        setQty('');
        setSelectedFile(null);
        setRemark('');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to place order: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-[#f2eee9] border-b md:border-b-0 md:border-r border-[#e8dfd5] flex flex-col p-4 md:p-6 shrink-0">
        <div className="mb-4 md:mb-8 text-left hidden md:block">
          <h2 className="text-xl font-bold text-gray-900 mb-1 font-outfit uppercase tracking-tighter text-left">Service Index</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-left">Explore Categories</p>
        </div>

        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 no-scrollbar">
          {SIDEBAR_LINKS.map((link) => (
            <Link key={link.id} to={link.to}
              className={`flex items-center gap-3 px-4 py-2.5 md:py-3.5 rounded-xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap ${link.active
                ? 'bg-[#b65e2e] text-white shadow-lg'
                : 'text-gray-500 hover:bg-[#e8dfd5] hover:text-gray-900'
                }`}>
              {createElement(link.icon, { className: `w-3.5 h-3.5 md:w-4 h-4 shrink-0 ${link.active ? '' : 'text-gray-400'}` })}
              <span className="uppercase tracking-wider">{link.label}</span>
            </Link>
          ))}
        </nav>

      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 p-6 md:p-10 lg:p-12">
        {/* Breadcrumb */}
        <div className="text-sm font-medium mb-8 flex items-center gap-2">
          <Link to="/" className="text-[#3b71ca] hover:text-[#285192] transition-colors">Home</Link>
          <span className="text-gray-500">›</span>
          <Link to="/services" className="text-[#3b71ca] hover:text-[#285192] transition-colors">Our Services</Link>
          <span className="text-gray-500">›</span>
          <Link to="/services/custom-printing" className="text-[#3b71ca] hover:text-[#285192] transition-colors">Custom Printing</Link>
          <span className="text-gray-500">›</span>
          <span className="text-[#a64d24]">Pen</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Laser Printed Pens</h1>
          <p className="text-gray-600 max-w-3xl leading-relaxed">
            Precision-etched branding for executive gifts and corporate identity. Choose your pen model and quantity —  price updates live.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ── Left Column ── */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-[#e8dfd5] p-6 lg:p-8 shadow-sm">

              {/* SELECT PRODUCT */}
              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Select Product</h3>
                <CustomDropdown
                  options={['Laser Printed Pens']}
                  value="Laser Printed Pens"
                  placeholder="Select Product"
                />
              </div>

              {/* SELECT DETAIL */}
              <div className="border-t border-gray-100 pt-6 mb-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Select Detail</h3>

                {/* Order Name */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Order Name</label>
                  <input type="text" value={orderName} onChange={(e) => setOrderName(e.target.value)}
                    placeholder="e.g. Quarterly Executive Pens"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b65e2e]/50 focus:border-[#b65e2e] transition-shadow" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Pen Type */}
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-[#3b71ca] mb-2">
                      <PenTool className="w-3.5 h-3.5" /> Pen Type
                    </label>
                    <CustomDropdown
                      options={PEN_TYPES}
                      value={penType}
                      onChange={(e) => setPenType(e.target.value)}
                      placeholder="-- Select Pen Type --"
                    />
                  </div>

                  {/* Qty */}
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-[#3b71ca] mb-2">
                      <Tag className="w-3.5 h-3.5" /> Qty.
                    </label>
                    <CustomDropdown
                      options={QTY_OPTIONS}
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder="-- Select Qty --"
                    />
                  </div>
                </div>
              </div>

              {/* LIVE PRICE SUMMARY (shows when both selected) */}
              {pricing && (
                <div className="bg-[#fdf8f4] border border-[#e8dfd5] rounded-xl p-5 mb-8 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Base Cost ({qty} × ₹{pricing.unitCost})</span>
                    <span className="font-semibold text-gray-800">₹{pricing.baseCost}</span>
                  </div>
                  {designOption === 'email' && (
                    <div className="flex justify-between text-sm text-[#a64d24]">
                      <span>Email Processing Fee</span>
                      <span className="font-semibold">₹10.00</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="font-semibold text-gray-800">₹{pricing.gst}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-[#e8dfd5] pt-2 mt-2">
                    <span className="font-bold text-gray-900">Amount Payable</span>
                    <span className="font-bold text-[#a64d24] text-base">₹{pricing.total}</span>
                  </div>
                </div>
              )}

              {/* SELECT DELIVERY OPTION */}
              <div className="border-t border-gray-100 pt-6 mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Select Delivery Option</h3>
                <div className="flex items-start gap-3 cursor-pointer" onClick={() => setDeliveryOption('courier')}>
                  <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${deliveryOption === 'courier' ? 'border-[#b65e2e]' : 'border-gray-300'}`}>
                    {deliveryOption === 'courier' && <div className="w-2 h-2 rounded-full bg-[#b65e2e]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#3b71ca]" />
                      <span className="text-sm font-semibold text-gray-800">Deliver By Courier</span>
                    </div>
                    <p className="text-xs text-green-600 font-medium mt-0.5">Free Delivery</p>
                  </div>
                </div>
              </div>

              {/* SELECT FILE OPTION */}
              <div className="border-t border-gray-100 pt-6 mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Select File Option</h3>
                <div className="flex items-center gap-6 mb-5">
                  {['online', 'email'].map((opt) => (
                    <div key={opt} className="flex items-center gap-2 cursor-pointer" onClick={() => setDesignOption(opt)}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${designOption === opt ? 'border-[#b65e2e]' : 'border-gray-300'}`}>
                        {designOption === opt && <div className="w-2 h-2 rounded-full bg-[#b65e2e]" />}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UploadCloud className="w-3.5 h-3.5 text-[#3b71ca]" />
                        <span className="text-sm font-medium text-gray-800">{opt === 'online' ? 'Attach File' : 'Send via Email'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {designOption === 'email' ? (
                  <div className="p-10 bg-[#fffaf5] border border-[#f3ebdf] rounded-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-[#e8dfd5] flex items-center justify-center mb-4">
                      <Mail className="w-8 h-8 text-[#a64d24]" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 mb-1">Send to photowala@gmail.com</h4>
                    <p className="text-sm font-bold text-gray-500">Manual processing fee <span className="text-[#a64d24]">₹10.00</span> will be added.</p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#d1a88b] bg-[#fffaf5] rounded-xl p-8 flex flex-col items-center text-center hover:bg-[#fbf4ea] transition-all animate-in fade-in slide-in-from-top-2 duration-300 relative"
                    onClick={() => document.getElementById('pen-file-upload').click()}>
                    <input
                      type="file"
                      id="pen-file-upload"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.cdr,.psd,.jpg,.jpeg,.png"
                    />
                    <UploadCloud className="w-10 h-10 text-[#a64d24] mb-4" />
                    <p className="text-sm font-bold text-gray-900 mb-1">
                      {selectedFile ? selectedFile.name : 'Drag and drop your logo here'}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">PDF, CDR, PSD, JPG, or PNG (Max 100MB)</p>
                    <button
                      className="border-2 border-[#b65e2e] text-[#b65e2e] hover:bg-[#b65e2e] hover:text-white transition-all font-black py-2.5 px-8 rounded-xl text-xs bg-white uppercase tracking-widest shadow-sm"
                    >
                      {selectedFile ? 'Change Artwork' : 'Upload Artwork'}
                    </button>
                    {selectedFile && (
                      <p className="mt-3 text-[10px] text-green-600 font-bold uppercase tracking-wider animate-bounce">
                        File selected successfully!
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="bg-[#fff4f2] border border-[#f5c6cb] rounded-lg p-4 flex gap-3 mb-6 items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-700">Email Submission Warning</h4>
                  <p className="text-xs text-red-600 mt-0.5">Orders sent via email may experience a 24-hour delay in processing for manual verification.</p>
                </div>
              </div>

              {/* Special Remark */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Special Remark</label>
                  <span className="text-xs text-gray-400">{remark.length} / 250</span>
                </div>
                <textarea rows="3" maxLength={250} value={remark} onChange={(e) => setRemark(e.target.value)}
                  placeholder="Any specific placement instructions?"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#b65e2e]/50 focus:border-[#b65e2e] transition-shadow resize-none" />
              </div>
            </div>


          </div>

          {/* ── Right Column (Summary) ── */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="bg-[#1c1a19] text-white rounded-2xl overflow-hidden shadow-lg border border-gray-800">
              <div className="relative h-48 w-full">
                <img src={serviceAssets.penPreview} alt="Pen Preview" className="w-full h-full object-cover opacity-80" />
                <div className="absolute top-4 right-4 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow">
                  Free Delivery
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-[#1c1a19] to-transparent" />
              </div>

              {/* Sample Gallery */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-gray-900/40 border-b border-gray-800">
                <ZoomableImage
                  src={serviceAssets.penSample1}
                  alt="Pen Sample 1"
                  className="w-full h-24 rounded-xl border border-gray-700 bg-gray-800 shadow-inner"
                />
                <ZoomableImage
                  src={serviceAssets.penSample2}
                  alt="Pen Sample 2"
                  className="w-full h-24 rounded-xl border border-gray-700 bg-gray-800 shadow-inner"
                />
              </div>

              <div className="p-6">
                <h3 className="font-bold text-lg mb-6 border-b border-gray-700 pb-3">Order Summary</h3>

                {designOption === 'online' && selectedFile && (
                  <div className="bg-gray-800 rounded-lg p-3 mb-3 border border-gray-700">
                    <div className="text-xs text-gray-400 mb-0.5">Attached File</div>
                    <div className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5" />
                      {selectedFile.name}
                    </div>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Base Cost</span>
                    <span className="font-medium">{pricing ? `₹${pricing.baseCost}` : '-'}</span>
                  </div>
                  {designOption === 'email' && (
                    <div className="flex justify-between text-sm text-[#f0ba9c]">
                      <span className="text-gray-400 italic">Email Charge</span>
                      <span className="font-medium">₹10.00</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">GST (18.00%)</span>
                    <span className="font-medium">{pricing ? `₹${pricing.gst}` : '-'}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-8 border-t border-gray-700 pt-4">
                  <span className="font-bold text-lg">Amount Payable</span>
                  <span className={`font-bold text-2xl ${pricing ? 'text-[#f0ba9c]' : 'text-white'}`}>
                    {pricing ? `₹${pricing.total}` : '-'}
                  </span>
                </div>

                <button
                  onClick={handleAddOrder}
                  disabled={!canOrder}
                  className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-colors mb-4 ${canOrder ? 'bg-[#b65e2e] hover:bg-[#a15024] text-white cursor-pointer' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                  {loading ? 'Processing...' : 'Add Order'}
                </button>
                <p className="text-center text-xs text-gray-500 italic">
                  {canOrder ? 'Free Courier Delivery · Est. 5-7 days' : 'Select pen type & quantity'}
                </p>
              </div>
            </div>


          </div>
        </div>
      </main>
    </div>
  );
}


