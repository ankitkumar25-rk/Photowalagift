import { useState, useMemo, createElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PenTool, StickyNote, Printer, FileText, Tag, Book, Mail,
  HelpCircle, UploadCloud, AlertTriangle, ShoppingCart, Package, File, Loader2, Truck, CheckCircle2,
  ChevronLeft, ChevronRight, Layers, Layout
} from 'lucide-react';
import api from '../../../../api/client';
import { useAuthStore } from '../../../../store';
import CustomDropdown from '../../../../components/CustomDropdown';
import { 
  FaPenNib, FaNoteSticky, FaPrint, FaFileSignature, 
  FaTag, FaFileInvoiceDollar, FaEnvelope
} from 'react-icons/fa6';

const SIDEBAR_LINKS = [
  { id: 'pen', icon: FaPenNib, label: 'Pen', to: '/services/custom-printing/pen' },
  { id: 'sticker', icon: FaNoteSticky, label: 'Sticker Labels', to: '/services/custom-printing/sticker-labels' },
  { id: 'digital', icon: FaPrint, label: 'Digital Paper Printing', to: '/services/custom-printing/digital-printing' },
  { id: 'letterhead', icon: FaFileSignature, label: 'Letterhead', to: '/services/custom-printing/letterhead' },
  { id: 'garment', icon: FaTag, label: 'Garment Tag', to: '/services/custom-printing/garment-tag' },
  { id: 'billbook', icon: FaFileInvoiceDollar, label: 'Bill Book', to: '/services/custom-printing/bill-book' },
  { id: 'envelope', icon: FaEnvelope, label: 'Envelope', to: '/services/custom-printing/envelope', active: true },
];

import env1 from '../../../../assets/images/services/envelope_1.png';
import env2 from '../../../../assets/images/services/envelope_2.png';
import env3 from '../../../../assets/images/services/envelope_3.png';

const Envelope_PRODUCTS = [
  {
    id: 'ENV_9X4',
    name: 'Envelopes - 9x4',
    images: [env1, env2],
    code: 'EN-1',
    size: 'Envelope (9"X4")',
    papers: ['70 GSM Maplitho Paper', '90 GSM Sunshine Paper', '100 GSM Deo Paper'],
    utility: 'For Office Letters'
  },
  {
    id: 'ENV_9_70',
    name: 'Envelopes - 9.70x4.20',
    images: [env2, env1, env3],
    code: 'EN-2',
    size: 'Envelope (9.7"X4.2")',
    papers: ['70 GSM Maplitho Paper', '90 GSM Sunshine Paper', '100 GSM Deo Paper'],
    utility: 'For Executive Office Letters'
  },
  {
    id: 'ENV_10_75',
    name: 'Envelopes - 10.75x4.75',
    images: [env3, env1, env2],
    code: 'EN-3',
    size: 'Envelope (10.75"X4.75")',
    papers: ['90 GSM Sunshine Paper'],
    utility: 'For Documents & Large Letters'
  },
  {
    id: 'ENV_5_7',
    name: 'Envelopes - 5x7',
    images: [env1, env2, env3],
    code: 'EN-4',
    size: 'Envelope (5"X7")',
    papers: ['70 GSM Maplitho Paper', '90 GSM Sunshine Paper', '100 GSM Deo Paper', '100 GSM Deo + UV Paper'],
    utility: 'For Invitations & Cards',
    hideWindow: true
  },
  {
    id: 'ENV_6_8',
    name: 'Envelopes - 6x8',
    images: [env2, env3, env1],
    code: 'EN-5',
    size: 'Envelope (6"X8")',
    papers: ['70 GSM Maplitho Paper', '90 GSM Sunshine Paper', '100 GSM Deo Paper'],
    utility: 'For Catalogues & Booklets',
    hideWindow: true
  },
  {
    id: 'ENV_8_60',
    name: 'Envelopes - 8.60x10.60',
    images: [env3, env1, env2],
    code: 'EN-6',
    size: 'Envelope (8.6"X10.6")',
    papers: ['90 GSM Sunshine Paper'],
    utility: 'For Large Documents & Files'
  },
  {
    id: 'ENV_9_40',
    name: 'Envelopes - 9.40x12.40',
    images: [env1, env3, env2],
    code: 'EN-7',
    size: 'Envelope (9.4"X12.4")',
    papers: ['90 GSM Art Paper', '115 GSM Art Paper', '170 GSM Art Paper'],
    utility: 'For Premium Catalogues'
  },
];

const WINDOW_OPTIONS = ['Not Required', 'Required'];
const FLAP_OPTIONS = ['Short Opening (with center pasting)', 'Long Opening (with side pasting)'];
const QTY_OPTIONS = [1000, 2000, 3000, 4000];

export default function Envelope() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [orderName, setOrderName] = useState('');
  const [product, setProduct] = useState('ENV_9X4');
  const [paperType, setPaperType] = useState('');
  const [windowCut, setWindowCut] = useState('');
  const [flap, setFlap] = useState('');
  const [qty, setQty] = useState('');

  const [delivery, setDelivery] = useState('courier');
  const [fileOption, setFileOption] = useState('online');
  const [remark, setRemark] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const activeProduct = Envelope_PRODUCTS.find(p => p.id === product);

  const handleProductChange = (val) => {
    setProduct(val);
    setPaperType('');
    setQty('');
    setActiveImageIndex(0);
  };
  const currentImages = activeProduct?.images || [];

  const nextImage = () => setActiveImageIndex((prev) => (prev + 1) % currentImages.length);
  const prevImage = () => setActiveImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);

  const pricing = useMemo(() => {
    if (!qty) return { subtotal: 0, gst: 0, total: 0, emailFee: 0 };
    const baseRate = paperType.includes('100 GSM') ? 2.50 : 1.80;
    const base = Number(qty) * baseRate;
    const emailFee = fileOption === 'email' ? 10 : 0;
    const subtotal = base + emailFee;
    const gst = subtotal * 0.18;
    return {
      subtotal: subtotal.toFixed(2),
      gst: gst.toFixed(2),
      total: (subtotal + gst).toFixed(2),
      emailFee
    };
  }, [qty, paperType, fileOption]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      const ext = f.name.split('.').pop().toLowerCase();
      const allowed = ['pdf', 'cdr', 'psd', 'jpeg', 'jpg', 'png'];
      if (allowed.includes(ext)) setFile(f);
      else { alert('Invalid format. Allowed: PDF, CDR, PSD, JPEG, PNG'); e.target.value = null; }
    }
  };

  const handleAddOrder = async () => {
    if (!paperType || !qty || (!activeProduct.hideWindow && !windowCut) || !flap || (fileOption === 'online' && !file)) {
      alert('Please fill all mandatory fields (Paper, Flap, Qty, and Design).');
      return;
    }
    if (!user) {
      toast.error('Please login or sign up to place an order.');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    toast.error('Price is not set by the provider, you can contact them..', { duration: 2000 });
    try {
      setLoading(true);
      let fileUrl = '';
      if (fileOption === 'online' && file) {
        const formData = new FormData();
        formData.append('design', file);
        const uploadRes = await api.post('/uploads/design', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data.success) fileUrl = uploadRes.data.data.url;
      }
      const payload = {
        category: 'PRINTING',
        serviceName: 'Envelope',
        customerName: orderName.trim() || 'Envelope Order',
        productName: activeProduct?.name,
        quantity: Number(qty),
        totalAmount: Number(pricing.total),
        fileUrl: fileUrl || (fileOption === 'email' ? 'SEND_VIA_EMAIL' : ''),
        fileOption: fileOption,
        specialRemark: remark,
        details: {
          paperType,
          windowCut,
          flap,
          delivery,
          pricing: {
            subtotal: pricing.subtotal,
            gst: pricing.gst,
            emailFee: pricing.emailFee
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
          serviceName: 'Envelope',
          category: 'PRINTING',
        };

        navigate('/checkout/service', { state: { orderData } });

        setOrderName(''); setPaperType(''); setWindowCut(''); setFlap(''); setQty(''); setFile(null); setRemark('');
      }
    } catch (err) {
      console.error(err);
      alert('Order failed: ' + (err.response?.data?.message || err.message));
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

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-10 lg:p-12">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-6">

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Order Name</label>
                <input type="text" value={orderName} onChange={(e) => setOrderName(e.target.value)}
                  placeholder="Enter customer name or order reference..."
                  className="w-full bg-[#fffaf5] border border-[#e8dfd5] rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#b65e2e]/20 outline-none transition-all placeholder:text-gray-300" />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Select Product</label>
                <CustomDropdown
                  options={Envelope_PRODUCTS.map(p => ({ value: p.id, label: p.name }))}
                  value={product}
                  onChange={(e) => handleProductChange(e.target.value)}
                  placeholder="Select Product"
                />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#fffaf5] px-6 py-4 border-b border-[#e8dfd5]">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select Detail</h3>
                </div>
                <div className="p-4 md:p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="w-full sm:w-32 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#a64d24]" />
                      <span className="text-sm font-bold text-gray-700">Paper Type</span>
                    </div>
                    <div className="w-full sm:flex-1">
                      <CustomDropdown
                        options={activeProduct.papers}
                        value={paperType}
                        onChange={(e) => setPaperType(e.target.value)}
                        placeholder="--Select--"
                      />
                    </div>
                  </div>
                  {!activeProduct.hideWindow && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="w-full sm:w-32 flex items-center gap-2">
                        <Layout className="w-4 h-4 text-[#a64d24]" />
                        <span className="text-sm font-bold text-gray-700">Window Cutting</span>
                      </div>
                      <div className="w-full sm:flex-1">
                        <CustomDropdown
                          options={WINDOW_OPTIONS}
                          value={windowCut}
                          onChange={(e) => setWindowCut(e.target.value)}
                          placeholder="--Select--"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="w-full sm:w-32 flex items-center gap-2">
                      <Layout className="w-4 h-4 text-[#a64d24]" />
                      <span className="text-sm font-bold text-gray-700">Flap Opening</span>
                    </div>
                    <div className="w-full sm:flex-1">
                      <CustomDropdown
                        options={FLAP_OPTIONS}
                        value={flap}
                        onChange={(e) => setFlap(e.target.value)}
                        placeholder="--Select--"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="w-full sm:w-32 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#a64d24]" />
                      <span className="text-sm font-bold text-gray-700">Qty.</span>
                    </div>
                    <div className="w-full sm:flex-1">
                      <CustomDropdown
                        options={QTY_OPTIONS}
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        placeholder="--Select--"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Option */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 text-left">Select Delivery Option</label>
                <div className="flex flex-wrap gap-10">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="delivery" checked={delivery === 'courier'} onChange={() => setDelivery('courier')} className="hidden" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${delivery === 'courier' ? 'border-[#b65e2e] bg-[#fffaf5]' : 'border-gray-300'}`}>
                      {delivery === 'courier' && <div className="w-2.5 h-2.5 rounded-full bg-[#b65e2e]" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#a64d24]" />
                      <div className="text-left">
                        <span className="text-sm font-bold text-gray-700">Deliver By Courier</span>
                        <p className="text-[10px] text-green-600 font-bold uppercase leading-none mt-1">Free Delivery</p>
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="delivery" checked={delivery === 'transport'} onChange={() => setDelivery('transport')} className="hidden" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${delivery === 'transport' ? 'border-[#b65e2e] bg-[#fffaf5]' : 'border-gray-300'}`}>
                      {delivery === 'transport' && <div className="w-2.5 h-2.5 rounded-full bg-[#b65e2e]" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-bold text-gray-700">Dispatch By Transport</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* File Option */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 text-left">Select File Option</label>
                <div className="flex gap-10 mb-6">
                  {['online', 'email'].map(opt => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" checked={fileOption === opt} onChange={() => setFileOption(opt)} className="hidden" />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${fileOption === opt ? 'border-[#b65e2e]' : 'border-gray-300'}`}>
                        {fileOption === opt && <div className="w-2 h-2 rounded-full bg-[#b65e2e]" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {opt === 'online' ? <UploadCloud className="w-4 h-4 text-[#a64d24]" /> : <Mail className="w-4 h-4 text-[#a64d24]" />}
                        <span className="text-sm font-bold text-gray-700 capitalize">{opt === 'online' ? 'Attach File Online' : 'Send via Email'}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {fileOption === 'online' ? (
                  <div className="border-2 border-dashed border-[#d1a88b] bg-[#fffaf5] rounded-2xl p-10 flex flex-col items-center justify-center group hover:bg-[#fbf4ea] transition-all cursor-pointer"
                    onClick={() => document.getElementById('bb-file').click()}>
                    <input type="file" id="bb-file" className="hidden" onChange={handleFileChange} />
                    <div className="w-14 h-14 bg-white rounded-full shadow-sm border border-[#e8dfd5] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-7 h-7 text-[#a64d24]" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1">{file ? file.name : 'Upload your Design Artwork'}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PDF, CDR, PSD, JPG, PNG (MAX 50MB)</p>
                  </div>
                ) : (
                  <div className="p-10 bg-[#fffaf5] border border-[#f3ebdf] rounded-2xl flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-[#e8dfd5] flex items-center justify-center mb-4">
                      <Mail className="w-8 h-8 text-[#a64d24]" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 mb-1">Send to photowala@gmail.com</h4>
                    <p className="text-sm font-bold text-gray-500">Manual processing fee <span className="text-[#a64d24]">₹10.00</span> will be added.</p>
                  </div>
                )}
              </div>

              {/* Pricing & Remark */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-500 text-left">Applicable Cost</span>
                    <span className="font-bold text-gray-900">₹{pricing.subtotal}/-</span>
                  </div>
                  {pricing.emailFee > 0 && (
                    <div className="flex justify-between items-center text-sm text-[#a64d24]">
                      <span className="font-bold">Manual Handling Fee</span>
                      <span className="font-bold">₹{pricing.emailFee.toFixed(2)}/-</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm text-left">
                    <span className="font-bold text-gray-500 text-left">GST (18.00%)</span>
                    <span className="font-bold text-gray-900">₹{pricing.gst}/-</span>
                  </div>
                  <div className="flex justify-between items-center pt-5 border-t border-gray-100 text-left">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px] text-left">Total Amount Payable</span>
                    <span className="text-2xl font-black text-[#a64d24]">₹{pricing.total}/-</span>
                  </div>
                </div>
                <div className="bg-gray-50/50 p-6 border-t border-gray-100 text-left">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 text-left">Special Remark (Optional)</label>
                  <textarea value={remark} onChange={(e) => setRemark(e.target.value)}
                    placeholder="remarks for order processing team..."
                    className="w-full bg-[#fffaf5] border border-[#e8dfd5] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#b65e2e]/10 h-24 transition-all" />
                </div>
                <button onClick={handleAddOrder} disabled={loading}
                  className="w-full bg-[#b65e2e] hover:bg-[#a15024] text-white font-bold py-5 uppercase tracking-widest text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                  {loading ? 'Processing Order...' : 'Add Order'}
                </button>
              </div>

            </div>

            {/* Right Column */}
            <div className="w-full lg:w-[420px] space-y-6">

              {/* Product Preview Slider */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                <div className="relative h-[280px] sm:h-[380px] bg-[#fdfaf7] flex items-center justify-center p-4 sm:p-8 overflow-hidden">

                  {/* Main Image Slider */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    {currentImages.map((img, idx) => (
                      <div key={idx}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${idx === activeImageIndex ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                          }`}>
                        <img src={img} alt="Envelope"
                          className="w-full h-full object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.1)] sm:drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-lg group-hover:scale-105 transition-transform duration-700" />
                      </div>
                    ))}
                  </div>

                  {/* Slider Controls */}
                  <button onClick={prevImage}
                    className="absolute left-4 w-10 h-10 bg-white/90 rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-800 hover:bg-[#b65e2e] hover:text-white transition-all transform -translate-x-12 group-hover:translate-x-0 z-20">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={nextImage}
                    className="absolute right-4 w-10 h-10 bg-white/90 rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-800 hover:bg-[#b65e2e] hover:text-white transition-all transform translate-x-12 group-hover:translate-x-0 z-20">
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-6 flex gap-2 z-20">
                    {currentImages.map((_, idx) => (
                      <button key={idx} onClick={() => setActiveImageIndex(idx)}
                        className={`transition-all duration-300 rounded-full ${idx === activeImageIndex ? 'w-8 h-2 bg-[#b65e2e]' : 'w-2 h-2 bg-gray-300'
                          }`} />
                    ))}
                  </div>
                </div>

                <div className="p-8 border-l-4 border-[#b65e2e] bg-white text-left">
                  <h3 className="text-xs font-bold text-gray-900 uppercase mb-6 tracking-[0.2em] text-left">Product Description</h3>
                  <ul className="space-y-4">
                    {[
                      { label: 'Product Ref.', val: 'EN/02nd Edition (Sample File)' },
                      { label: 'Product Code', val: activeProduct.code },
                      { label: 'Product Class', val: 'Regular' },
                      { label: 'Product Size', val: activeProduct.size },
                      { label: 'Production Time', val: 'Within 4 Day from file upload' },
                      { label: 'Paper Option', val: activeProduct.papers.join(', ') },
                      { label: 'Utility', val: activeProduct.utility },
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-4 text-[11px] leading-relaxed">
                        <span className="text-[#b65e2e] font-black mt-1">/</span>
                        <span className="font-bold text-gray-400 w-32 shrink-0 uppercase tracking-wider text-left">{item.label} :</span>
                        <span className="font-black text-gray-800 text-left">{item.val}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-10 pt-8 border-t border-gray-100 text-left">
                    <h3 className="text-xs font-bold text-gray-900 uppercase mb-5 tracking-[0.2em] text-left">Important Note</h3>
                    <ul className="space-y-3">
                      <li className="flex gap-3 text-[11px] font-bold text-gray-500 leading-tight">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        <span>Price discount applicable with increase in Quantity</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-10 pt-8 border-t border-gray-100 bg-gray-50/30 -mx-8 px-8 pb-8 text-left">
                    <h3 className="text-xs font-bold text-gray-900 uppercase mb-5 tracking-[0.2em] text-left">Our Specialization</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        'Printing with latest Komori offset machines (2023 Model)',
                        'Innovative, Advanced & Equipped Post Printing Unit',
                        'Constant quality with reasonable price'
                      ].map((spec, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <Package className="w-4 h-4 text-[#a64d24]" />
                          <span className="text-[10px] font-bold text-gray-600 leading-tight">{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
