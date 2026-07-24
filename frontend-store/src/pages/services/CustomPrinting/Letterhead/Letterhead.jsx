import { useState, useMemo, createElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PenTool, StickyNote, Printer, FileText, Tag, Book, Mail,
  HelpCircle, UploadCloud, AlertTriangle, ShoppingCart, Package, File, Loader2, Truck
} from 'lucide-react';
import api from '../../../../api/client';
import { useAuthStore } from '../../../../store';
import CustomDropdown from '../../../../components/CustomDropdown';
import { 
  FaPenNib, FaNoteSticky, FaPrint, FaFileSignature, 
  FaTag, FaFileInvoiceDollar, FaEnvelope
} from 'react-icons/fa6';
import { serviceAssets } from '../../../../data/assets';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SIDEBAR_LINKS = [
  { id: 'pen', icon: FaPenNib, label: 'Pen', to: '/services/custom-printing/pen' },
  { id: 'sticker', icon: FaNoteSticky, label: 'Sticker Labels', to: '/services/custom-printing/sticker-labels' },
  { id: 'digital', icon: FaPrint, label: 'Digital Paper Printing', to: '/services/custom-printing/digital-printing' },
  { id: 'letterhead', icon: FaFileSignature, label: 'Letterhead', to: '/services/custom-printing/letterhead', active: true },
  { id: 'garment', icon: FaTag, label: 'Garment Tag', to: '/services/custom-printing/garment-tag' },
  { id: 'billbook', icon: FaFileInvoiceDollar, label: 'Bill Book', to: '/services/custom-printing/bill-book' },
  { id: 'envelope', icon: FaEnvelope, label: 'Envelope', to: '/services/custom-printing/envelope' },
];


const LETTERHEAD_PRODUCTS_LIST = [
  { id: 'LH-1-A4', name: 'Letter Head - 70 GSM, Maplitho Paper ( A4 Size )', code: 'LH-1', size: 'A4 (8.26" X 11.69")', gsm: '70 GSM' },
  { id: 'LH-1-LT', name: 'Letter Head - 70 GSM, Maplitho Paper ( Letter Size )', code: 'LH-1', size: 'Letter Size (8.5" X 11.0")', gsm: '70 GSM' },
  { id: 'LH-2-A4', name: 'Letter Head - 90 GSM, Sunshine Paper ( A4 Size )', code: 'LH-2', size: 'A4 (8.26" X 11.69")', gsm: '90 GSM' },
  { id: 'LH-2-LT', name: 'Letter Head - 90 GSM, Sunshine Paper ( Letter Size )', code: 'LH-2', size: 'Letter Size (8.5" X 11.0")', gsm: '90 GSM' },
  { id: 'LH-3-A4', name: 'Letter Head - 100 GSM, Bond Paper ( A4 Size )', code: 'LH-3', size: 'A4 (8.26" X 11.69")', gsm: '100 GSM' },
  { id: 'LH-3-LT', name: 'Letter Head - 100 GSM, Bond Paper ( Letter Size )', code: 'LH-3', size: 'Letter Size (8.5" X 11.0")', gsm: '100 GSM' },
  { id: 'LH-4-A4', name: 'Letter Head - 100 GSM, Deo Paper ( A4 Size )', code: 'LH-4', size: 'A4 (8.26" X 11.69")', gsm: '100 GSM' },
  { id: 'LH-4-LT', name: 'Letter Head - 100 GSM, Deo Paper ( Letter Size )', code: 'LH-4', size: 'Letter Size (8.5" X 11.0")', gsm: '100 GSM' },
  { id: 'LH-4-UV-A4', name: 'Letter Head - 100 GSM, Deo Paper + UV ( A4 Size )', code: 'LH-4A', size: 'A4 (8.26" X 11.69")', gsm: '100 GSM' },
  { id: 'LH-4-UV-LT', name: 'Letter Head - 100 GSM, Deo Paper + UV ( Letter Size )', code: 'LH-4A', size: 'Letter Size (8.5" X 11.0")', gsm: '100 GSM' },
  { id: 'LH-4-GF-A4', name: 'Letter Head - 100 GSM, Deo Paper + Gold Foil ( A4 Size )', code: 'LH-4B', size: 'A4 (8.26" X 11.69")', gsm: '100 GSM' },
  { id: 'LH-4-GF-LT', name: 'Letter Head - 100 GSM, Deo Paper + Gold Foil ( Letter Size )', code: 'LH-4B', size: 'Letter Size (8.5" X 11.0")', gsm: '100 GSM' },
  { id: 'LH-5-A4', name: 'Letter Head - 115 GSM, Sunshine Paper ( A4 Size )', code: 'LH-5', size: 'A4 (8.26" X 11.69")', gsm: '115 GSM' },
  { id: 'LH-5-LT', name: 'Letter Head - 115 GSM, Sunshine Paper ( Letter Size )', code: 'LH-5', size: 'Letter Size (8.5" X 11.0")', gsm: '115 GSM' },
];

const BINDING_OPTIONS = ['Not Required', 'Pad (10 x 100 letter heads)', 'Pockets (10 x 100 Letter Heads)'];
const CUTTING_OPTIONS = ['Finishing Cut', 'Without Cutting'];
const QUANTITY_OPTIONS = [1000, 2000, 3000, 4000, 8000, 12000, 16000];
const PRINTING_OPTIONS = ['Single Side', 'Both Side'];

export default function Letterhead() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [orderName, setOrderName] = useState('');
  const [selProduct, setSelProduct] = useState('');
  const [printing, setPrinting] = useState('');
  const [binding, setBinding] = useState('');
  const [qty, setQty] = useState('');
  const [cuttingType, setCuttingType] = useState('');
  const [delivery, setDelivery] = useState('courier');
  const [fileOption, setFileOption] = useState('online');
  const [remark, setRemark] = useState('');
  const [file, setFile] = useState(null);
  const [finishing, setFinishing] = useState('Front Side');
  const [foilSide, setFoilSide] = useState('Front Side');
  const [foilColor, setFoilColor] = useState('Gold');
  const [loading, setLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = [
    { id: 1, url: serviceAssets.letterhead1, title: 'Letterhead Preview 1' },
    { id: 2, url: serviceAssets.letterhead2, title: 'Letterhead Preview 2' },
  ];

  const nextImage = () => setActiveImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);


  const selected = LETTERHEAD_PRODUCTS_LIST.find(p => p.id === selProduct);

  const pricing = useMemo(() => {
    if (!qty || !selProduct) return { subtotal: 0, gst: 0, total: 0, emailFee: 0 };
    
    const priceMap = {
      'LH-1': { 1000: 1.50, 2000: 1.30, 3000: 1.20, 4000: 1.10, 8000: 1.00, 12000: 0.95, 16000: 0.90 },
      'LH-2': { 1000: 1.80, 2000: 1.60, 3000: 1.50, 4000: 1.40, 8000: 1.30, 12000: 1.25, 16000: 1.20 },
      'LH-3': { 1000: 2.20, 2000: 2.00, 3000: 1.90, 4000: 1.80, 8000: 1.70, 12000: 1.65, 16000: 1.60 },
      'LH-4': { 1000: 2.50, 2000: 2.30, 3000: 2.20, 4000: 2.10, 8000: 2.00, 12000: 1.95, 16000: 0.90 },
      'LH-4A': { 1000: 3.50, 2000: 3.30, 3000: 3.20, 4000: 3.10, 8000: 3.00, 12000: 2.95, 16000: 2.90 },
      'LH-4B': { 1000: 4.50, 2000: 4.30, 3000: 4.20, 4000: 4.10, 8000: 4.00, 12000: 3.95, 16000: 3.90 },
      'LH-5': { 1000: 2.80, 2000: 2.60, 3000: 2.50, 4000: 2.40, 8000: 2.30, 12000: 2.25, 16000: 2.20 },
    };

    const productCode = selected?.code || 'LH-1';
    const unitPrice = priceMap[productCode]?.[Number(qty)] || 1.50;
    const base = Number(qty) * unitPrice;
    const emailFee = fileOption === 'email' ? 10 : 0;
    const subtotal = base + emailFee;
    const gst = subtotal * 0.18;
    
    return {
      subtotal: subtotal.toFixed(0),
      gst: gst.toFixed(0),
      total: (subtotal + gst).toFixed(0),
      emailFee
    };
  }, [qty, selProduct, selected, fileOption]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      const ext = f.name.split('.').pop().toLowerCase();
      const allowed = ['pdf', 'cdr', 'psd', 'jpeg', 'jpg', 'png'];
      if (allowed.includes(ext)) {
        setFile(f);
      } else {
        alert('Invalid format. Allowed: PDF, CDR, PSD, JPEG, PNG');
        e.target.value = null;
      }
    }
  };

  const handleAddOrder = async () => {
    if (!selProduct || !qty || (fileOption === 'online' && !file)) {
        alert('Please fill all mandatory fields and attach file.');
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
        if (uploadRes.data.success) {
          fileUrl = uploadRes.data.data.url;
        }
      }

      const payload = {
        category: 'PRINTING',
        serviceName: 'Letterhead',
        customerName: orderName.trim() || 'Letterhead Order',
        productName: selected.name,
        quantity: Number(qty),
        totalAmount: Number(pricing.total),
        fileUrl: fileUrl || (fileOption === 'email' ? 'SEND_VIA_EMAIL' : ''),
        fileOption: fileOption,
        specialRemark: remark,
        details: {
          printing,
          binding,
          size: selected.size,
          gsm: selected.gsm,
          delivery,
          cuttingType,
          uvSide: selected.code === 'LH-4A' ? finishing : 'None',
          foilSide: selected.code === 'LH-4B' ? foilSide : 'None',
          foilColor: selected.code === 'LH-4B' ? foilColor : 'None',
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
          serviceName: 'Letterhead',
          category: 'PRINTING',
        };

        navigate('/checkout/service', { state: { orderData } });

        setOrderName('');
        setSelProduct('');
        setQty(1000);
        setFile(null);
        setRemark('');
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
          <div className="text-[10px] md:text-sm font-medium mb-4 md:mb-8 flex flex-wrap items-center gap-2">
            <Link to="/" className="text-[#3b71ca] hover:text-[#285192]">Home</Link><span className="text-gray-500">›</span>
            <Link to="/services" className="text-[#3b71ca] hover:text-[#285192]">Our Services</Link><span className="text-gray-500">›</span>
            <Link to="/services/custom-printing" className="text-[#3b71ca] hover:text-[#285192]">Custom Printing</Link><span className="text-gray-500">›</span>
            <span className="text-[#a64d24]">Letterhead</span>
          </div>
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Order Name</label>
                <input type="text" value={orderName} onChange={(e)=>setOrderName(e.target.value)}
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें..."
                  className="w-full bg-[#fffaf5] border border-[#e8dfd5] rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#b65e2e]/20 outline-none transition-all placeholder:text-gray-300" />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Select Product</label>
                <CustomDropdown
                  options={LETTERHEAD_PRODUCTS_LIST.map(p => ({ value: p.id, label: p.name }))}
                  value={selProduct}
                  onChange={(e) => setSelProduct(e.target.value)}
                  placeholder="--Select Product--"
                />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 rounded-t-2xl">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select Detail</h3>
                </div>
                <div className="p-4 md:p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="w-full sm:w-32 flex items-center gap-2">
                        <Printer className="w-4 h-4 text-[#a64d24]" />
                        <span className="text-sm font-bold text-gray-700">Printing</span>
                    </div>
                    <div className="w-full sm:flex-1">
                      <CustomDropdown
                        options={PRINTING_OPTIONS}
                        value={printing}
                        onChange={(e) => setPrinting(e.target.value)}
                        placeholder="--Select--"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="w-full sm:w-32 flex items-center gap-2">
                        <Book className="w-4 h-4 text-[#a64d24]" />
                        <span className="text-sm font-bold text-gray-700">Binding</span>
                    </div>
                    <div className="w-full sm:flex-1">
                      <CustomDropdown
                        options={BINDING_OPTIONS}
                        value={binding}
                        onChange={(e) => setBinding(e.target.value)}
                        placeholder="--Select--"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="w-full sm:w-32 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#a64d24]" />
                        <span className="text-sm font-bold text-gray-700">Qty.</span>
                    </div>
                    <div className="w-full sm:flex-1">
                      <CustomDropdown
                        options={QUANTITY_OPTIONS}
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        placeholder="--Select--"
                      />
                    </div>
                  </div>
                  {selected?.gsm === '115 GSM' && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="w-full sm:w-32 flex items-center gap-2">
                          <Tag className="w-4 h-4 text-[#a64d24]" />
                          <span className="text-sm font-bold text-gray-700">Cutting Type</span>
                      </div>
                      <div className="w-full sm:flex-1">
                        <CustomDropdown
                          options={CUTTING_OPTIONS}
                          value={cuttingType}
                          onChange={(e) => setCuttingType(e.target.value)}
                          placeholder="--Select--"
                        />
                      </div>
                    </div>
                  )}
                  {/* Dynamic Finishing: Spot UV */}
                  {selected?.code === 'LH-4A' && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="w-full sm:w-32 flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-[#b65e2e]/20 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#b65e2e]" />
                          </div>
                          <span className="text-sm font-bold text-gray-700">Spot UV</span>
                      </div>
                      <div className="w-full sm:flex-1">
                        <CustomDropdown
                          options={['Front Side']}
                          value={finishing}
                          onChange={(e) => setFinishing(e.target.value)}
                          placeholder="--Select--"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dynamic Finishing: Gold Foil */}
                  {selected?.code === 'LH-4B' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="w-full sm:w-32 flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#b65e2e]/20 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#b65e2e]" />
                            </div>
                            <span className="text-sm font-bold text-gray-700">Foil</span>
                        </div>
                        <div className="w-full sm:flex-1">
                          <CustomDropdown
                            options={['Front Side']}
                            value={foilSide}
                            onChange={(e) => setFoilSide(e.target.value)}
                            placeholder="--Select--"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="w-full sm:w-32 flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#b65e2e]/20 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#b65e2e]" />
                            </div>
                            <span className="text-sm font-bold text-gray-700">Foil Color</span>
                        </div>
                        <div className="w-full sm:flex-1">
                          <CustomDropdown
                            options={['Gold', 'Silver', 'Copper']}
                            value={foilColor}
                            onChange={(e) => setFoilColor(e.target.value)}
                            placeholder="--Select--"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Option */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Select Delivery Option</label>
                <div className="flex flex-wrap gap-10">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="delivery" checked={delivery==='courier'} onChange={()=>setDelivery('courier')} className="hidden" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${delivery==='courier'?'border-[#b65e2e] bg-[#fffaf5]':'border-gray-300'}`}>
                      {delivery==='courier' && <div className="w-2.5 h-2.5 rounded-full bg-[#b65e2e]" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#a64d24]" />
                      <div>
                        <span className="text-sm font-bold text-gray-700">Deliver By Courier</span>
                        <p className="text-[10px] text-green-600 font-bold uppercase leading-none mt-1">Free Delivery</p>
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="delivery" checked={delivery==='transport'} onChange={()=>setDelivery('transport')} className="hidden" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${delivery==='transport'?'border-[#b65e2e] bg-[#fffaf5]':'border-gray-300'}`}>
                      {delivery==='transport' && <div className="w-2.5 h-2.5 rounded-full bg-[#b65e2e]" />}
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
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Select File Option</label>
                  <div className="flex gap-10 mb-6">
                    {['online', 'email'].map(opt => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" checked={fileOption===opt} onChange={()=>setFileOption(opt)} className="hidden" />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${fileOption===opt?'border-[#b65e2e]':'border-gray-300'}`}>
                          {fileOption===opt && <div className="w-2 h-2 rounded-full bg-[#b65e2e]" />}
                        </div>
                        <div className="flex items-center gap-2">
                          {opt === 'online' ? <UploadCloud className="w-4 h-4 text-[#a64d24]" /> : <Mail className="w-4 h-4 text-[#a64d24]" />}
                          <span className="text-sm font-bold text-gray-700 capitalize">{opt === 'online' ? 'Attach File Online' : 'Send via Email'}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {fileOption === 'online' ? (
                    <div className="border-2 border-dashed border-[#d1a88b] bg-[#fffaf5] rounded-2xl p-10 flex flex-col items-center justify-center group hover:bg-[#fbf4ea] transition-all cursor-pointer animate-in fade-in slide-in-from-top-2 duration-300"
                      onClick={() => document.getElementById('lh-file').click()}>
                      <input type="file" id="lh-file" className="hidden" onChange={handleFileChange} />
                      <div className="w-14 h-14 bg-white rounded-full shadow-sm border border-[#e8dfd5] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-7 h-7 text-[#a64d24]" />
                      </div>
                      <p className="text-sm font-bold text-gray-900 mb-1">{file ? file.name : 'Upload your Letterhead Artwork'}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PDF, CDR, PSD, JPG, PNG (MAX 50MB)</p>
                    </div>
                  ) : (
                    <div className="p-10 bg-[#fffaf5] border border-[#f3ebdf] rounded-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
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
                      <span className="font-bold text-gray-500">Applicable Cost</span>
                      <span className="font-bold text-gray-900">₹{pricing.subtotal}/-</span>
                    </div>
                    {pricing.emailFee > 0 && (
                      <div className="flex justify-between items-center text-sm text-[#a64d24] animate-in fade-in slide-in-from-left-2">
                        <span className="font-bold">Manual Handling Fee</span>
                        <span className="font-bold">₹{pricing.emailFee}/-</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-500">GST (18.00%)</span>
                      <span className="font-bold text-gray-900">₹{pricing.gst}/-</span>
                    </div>
                    <div className="flex justify-between items-center pt-5 border-t border-gray-100">
                      <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Total Amount Payable</span>
                      <span className="text-2xl font-black text-[#a64d24]">₹{pricing.total}/-</span>
                    </div>
                  </div>
                <div className="bg-gray-50/50 p-6 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Special Remark (Optional)</label>
                  <textarea value={remark} onChange={(e)=>setRemark(e.target.value)}
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
              
              {/* Product Preview */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="relative h-[240px] md:h-[320px] bg-[#fdfaf7] flex items-center justify-center p-6 md:p-10 overflow-hidden group">
                  <div className="relative w-full h-full flex items-center justify-center">
                    {images.map((img, idx) => (
                      <div key={img.id}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${
                          idx === activeImageIndex ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                        }`}>
                        <img src={img.url} alt={img.title} 
                          className="w-full h-full object-contain drop-shadow-2xl rounded-lg" />
                      </div>
                    ))}
                  </div>

                  {/* Slider Controls */}
                  <button onClick={prevImage}
                    className="absolute left-4 w-8 h-8 bg-white/90 rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-800 hover:bg-[#b65e2e] hover:text-white transition-all transform -translate-x-12 group-hover:translate-x-0 z-20">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={nextImage}
                    className="absolute right-4 w-8 h-8 bg-white/90 rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-800 hover:bg-[#b65e2e] hover:text-white transition-all transform translate-x-12 group-hover:translate-x-0 z-20">
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="absolute bottom-4 flex gap-1.5 z-20">
                    {images.map((_, idx) => (
                      <button key={idx} onClick={() => setActiveImageIndex(idx)}
                        className={`transition-all duration-300 rounded-full ${
                          idx === activeImageIndex ? 'w-6 h-1.5 bg-[#b65e2e]' : 'w-1.5 h-1.5 bg-gray-300'
                        }`} />
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20" />
                </div>
                <div className="p-8 border-l-4 border-[#b65e2e] bg-white">
                  <h3 className="text-base font-bold text-gray-900 uppercase mb-6 tracking-widest">Product Description</h3>
                  <ul className="space-y-4">
                    {[
                      { label: 'Product Ref.', val: 'LH/03rd Edition (Sample File)' },
                      { label: 'Product Code', val: selected?.code || '-' },
                      { label: 'Product Class', val: (selected?.code === 'LH-4A' || selected?.code === 'LH-4B') ? 'Premium' : 'Classic' },
                      { label: 'Product Size', val: selected?.size || '-' },
                      { label: 'Product Core', val: (selected?.code === 'LH-4A' || selected?.code === 'LH-4B') ? 'Excellent Printing with UV Effects' : 'Excellent Printing with Latest Machines' },
                      { label: 'Production Time', val: (selected?.code === 'LH-4A' || selected?.code === 'LH-4B') ? 'Within 72 hours from file upload' : 'Within 48 hours from file upload' },
                      { label: 'Paper Quality', val: selected?.gsm || '-' },
                      { label: 'Printing Options', val: printing || 'Single / Both Side' },
                      { label: 'Cutting Type', val: selected?.gsm === '115 GSM' ? (cuttingType || 'Not Required') : 'Not Applicable' },
                      { label: 'Binding Style', val: binding || 'Not Required' },
                      { label: 'Price Discount', val: 'applicable (System auto calculate) with increase in Quantity' },
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3 text-[11px] leading-tight">
                        <span className="text-[#b65e2e] mt-1">●</span>
                        <span className="font-semibold text-gray-400 w-32 shrink-0">{item.label} :</span>
                        <span className="font-bold text-gray-800">{item.val}</span>
                      </li>
                    ))}
                    {(selected?.code === 'LH-4A' || selected?.code === 'LH-4B') && (
                      <li className="flex gap-3 text-[11px] leading-tight">
                        <span className="text-[#b65e2e] mt-1">●</span>
                        <span className="font-bold text-blue-600">UV effects will be single side only</span>
                      </li>
                    )}
                  </ul>

                  <div className="mt-12 pt-10 border-t border-gray-100">
                    <h3 className="text-base font-bold text-gray-900 uppercase mb-5 tracking-widest">Our Specialization</h3>
                    <ul className="space-y-4">
                      {[
                        'Printing with latest Komori offset machines (2023 Model)',
                        'Innovative, Advanced & Equipped Post Printing Unit',
                        'Constant quality with reasonable price'
                      ].map((txt, idx) => (
                        <li key={idx} className="flex gap-3 text-[11px]">
                          <span className="text-[#b65e2e] mt-1">●</span>
                          <span className="font-bold text-gray-600 leading-snug">{txt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-[#fff4f2] border border-[#f5c6cb] rounded-2xl p-6 flex gap-4">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-red-800 uppercase tracking-widest mb-1">Attention Required</h4>
                  <p className="text-[11px] text-red-600 font-bold leading-relaxed">
                    Please ensure your artwork has at least 3mm bleed on all sides and high resolution (300 DPI) for best results.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
