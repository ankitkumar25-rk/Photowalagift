import { useState, createElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PenTool, StickyNote, Printer, FileText, Tag, Book, Mail,
  HelpCircle, UploadCloud, AlertTriangle, ShoppingCart, Layers, Package, Truck, Scissors, Paperclip, Loader2
} from 'lucide-react';
import api from '../../../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../../store';
import CustomDropdown from '../../../../components/CustomDropdown';
import { 
  FaPenNib, FaNoteSticky, FaPrint, FaFileSignature, 
  FaTag, FaFileInvoiceDollar, FaEnvelope
} from 'react-icons/fa6';

const SIDEBAR_LINKS = [
  { id: 'pen', icon: FaPenNib, label: 'Pen', to: '/services/custom-printing/pen' },
  { id: 'sticker', icon: FaNoteSticky, label: 'Sticker Labels', to: '/services/custom-printing/sticker-labels' },
  { id: 'digital', icon: FaPrint, label: 'Digital Paper Printing', to: '/services/custom-printing/digital-printing', active: true },
  { id: 'letterhead', icon: FaFileSignature, label: 'Letterhead', to: '/services/custom-printing/letterhead' },
  { id: 'garment', icon: FaTag, label: 'Garment Tag', to: '/services/custom-printing/garment-tag' },
  { id: 'billbook', icon: FaFileInvoiceDollar, label: 'Bill Book', to: '/services/custom-printing/bill-book' },
  { id: 'envelope', icon: FaEnvelope, label: 'Envelope', to: '/services/custom-printing/envelope' },
];


const PAPER_PRODUCTS = [
  { id: 'letterhead', name: 'LETTER HEAD', detail: 'Production Time: 1 days', imageBg: '#2d4a3e', emoji: '📄' },
  { id: 'art', name: 'ART PAPER', detail: 'Production Time: 1 days', imageBg: '#3a3a3a', emoji: '🎨' },
  { id: 'texture', name: 'TEXTURE PAPER', detail: 'Production Time: 1 days', imageBg: '#e8e0d0', emoji: '🗒️' },
  { id: 'metallic', name: 'METALLIC PAPER', detail: 'Production Time: 1 days', imageBg: '#c9a227', emoji: '✨' },
  { id: 'ntpvc', name: 'NT / PVC SHEET', detail: 'Production Time: 1 days', imageBg: '#9e9e9e', emoji: '📋' },
  { id: 'gummed', name: 'PAPER GUMMING', detail: 'Production Time: 1 days', imageBg: '#d4b96a', emoji: '📒' },
  { id: 'pvcgum', name: 'PVC GUMMING', detail: 'Production Time: 1 days', imageBg: '#5fb8b0', emoji: '🗂️' },
  { id: 'only', name: 'ONLY PRINTING', detail: 'Production Time: 1 days', imageBg: '#1a1a1a', emoji: '🖨️' },
];

const ART_PAPER_OPTIONS = [
  'Digital Printout - 120 GSM',
  'Digital Printout - 170 GSM',
  'Digital Printout - 210 GSM',
  'Digital Printout - 250 GSM',
  'Digital Printout - 300 GSM',
  'Digital Printout - 350 GSM'
];

const TEXTURE_PAPER_OPTIONS = [
  '12x18 - Texture Sheet - SBS White - Code 101',
  '12x18 - Texture Sheet - SBS White - Code 102',
  '12x18 - Texture Sheet - SBS White - Code 103',
  '12x18 - Texture Sheet - SBS White - Code 104',
  '12x18 - Texture Sheet - SBS White - Code 105',
  '12x18 - Texture Sheet - SBS White - Code 106',
  '12x18 - Texture Sheet - SBS Natural - Code 107',
  '12x18 - Texture Sheet - SBS Natural - Code 108',
  '12x18 - Texture Sheet - Metallic Golden - Code 41',
  '12x18 - Texture Sheet - Metallic Silver - Code 42'
];

const METALLIC_PAPER_OPTIONS = [
  '12x18 - Metallic Golden - Code 51',
  '12x18 - Metallic Silver - Code 52'
];

const NTPVC_PAPER_OPTIONS = [
  '13x19 - PVC White (Matt) - 180 Micron',
  '13x19 - PVC Semi Transparent - 200 Micron'
];

const GUMMING_PAPER_OPTIONS = [
  'Normal Gumming',
  'Avery Dennison Gumming'
];

const PVC_GUMMING_OPTIONS = [
  'PVC Gumming (White)',
  'PVC Gumming (Transparent)',
  'PVC Gumming (Golden)'
];

const HALFCUT_OPTIONS = [
  'Not Required',
  'Upto 10 Stickes',
  '11 to 20 Stickers',
  '21 to 50 Stickers',
  '51 to 100 Stickers'
];

const LAMINATION_OPTIONS = ['Matt Lamination', 'Gloss Lamination', 'Not Required'];
const QUANTITY_OPTIONS = ['100 Pcs', '250 Pcs', '500 Pcs', '1000 Pcs', '5000 Pcs'];
const SIZE_OPTIONS = ['12x18', '13x19'];

export default function DigitalPrinting() {
  const navigate = useNavigate();
  const [sel, setSel] = useState(null);
  const [qty, setQty] = useState(10); // Default to min
  const [size, setSize] = useState('12x18');
  const [printing, setPrinting] = useState('');
  const [lhType, setLhType] = useState('');
  const [artType, setArtType] = useState('');
  const [textureType, setTextureType] = useState('');
  const [metallicType, setMetallicType] = useState('');
  const [ntpvcType, setNtpvcType] = useState('');
  const [gumType, setGumType] = useState('');
  const [halfCut, setHalfCut] = useState('');
  const [lamination, setLamination] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('courier');
  const [dOpt, setDOpt] = useState('online');
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentOrderData, setCurrentOrderData] = useState(null);

  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const selected = PAPER_PRODUCTS.find((p) => p.id === sel);

  const isSpecial = ['art', 'texture', 'metallic', 'ntpvc', 'gummed', 'pvcgum'].includes(sel);
  const minQty = sel === 'only' ? 1 : (sel === 'gummed' || sel === 'pvcgum' ? 10 : (isSpecial ? 25 : 25));

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      const ext = f.name.split('.').pop().toLowerCase();
      const allowed = ['pdf', 'cdr', 'psd', 'jpeg', 'jpg', 'png'];
      if (allowed.includes(ext)) {
        setFile(f);
      } else {
        alert('Format not allowed. Allowed: PDF, CDR, PSD, JPEG, PNG');
        e.target.value = null;
      }
    }
  };

  const handleProductSelect = (id) => {
    setSel(id);
    const m = id === 'only' ? 1 : (id === 'gummed' || id === 'pvcgum' ? 10 : 25);
    if (qty < m) setQty(m);

    // Resets & Defaults
    if (id === 'only') {
      setSize('13x19');
      setPrinting('Single Side');
    } else {
      setPrinting('Single Side');
      if (id === 'pvcgum') setSize('13x19');
      else setSize('12x18');
    }

    if (id !== 'art' && id !== 'gummed' && id !== 'pvcgum') {
      setLamination('Not Required');
    }
  };

  const showLamination = (sel === 'art' && artType !== 'Digital Printout - 120 GSM' && artType !== '') || (sel === 'gummed' || sel === 'pvcgum');

  const handleAddOrder = async () => {
    if (!sel || !qty || qty < minQty || (dOpt === 'online' && !file)) return;
    if (!user) {
      toast.error('Please login or sign up to place an order.');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    toast.error('Price is not set by the provider, you can contact them..', { duration: 2000 });

    try {
      setLoading(true);
      let fileUrl = '';

      // 1. Upload File locally if attached
      if (dOpt === 'online' && file) {
        const formData = new FormData();
        formData.append('design', file);
        const uploadRes = await api.post('/uploads/design', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data.success) {
          fileUrl = uploadRes.data.data.url;
        }
      }

      const emailFee = dOpt === 'email' ? 10 : 0;

      // 2. Prepare Order Details
      const payload = {
        category: 'PRINTING',
        serviceName: 'Digital Paper Printing',
        customerName: name || 'Digital Print Order',
        productName: selected.name,
        quantity: Number(qty),
        totalAmount: 0, // Not calculated in this frontend module
        fileUrl: fileUrl || (dOpt === 'email' ? 'SEND_VIA_EMAIL' : ''),
        fileOption: dOpt,
        specialRemark: '',
        details: {
          type: (sel === 'letterhead' ? lhType : (sel === 'art' ? artType : (sel === 'texture' ? textureType : (sel === 'metallic' ? metallicType : (sel === 'ntpvc' ? ntpvcType : (sel === 'gummed' || sel === 'pvcgum' ? gumType : '')))))),
          size,
          printing,
          halfCut,
          lamination,
          delivery: deliveryOption,
          emailFee: dOpt === 'email' ? 10 : 0
        }
      };

      const orderRes = await api.post('/service-orders', payload);

      if (orderRes.data.success) {
        const orderData = {
          orderId: orderRes.data.orderId,
          orderNumber: orderRes.data.orderNumber,
          orderType: 'SERVICE_ORDER',
          totalAmount: 200, // Fixed test amount for digital printing
          serviceName: 'Digital Paper Printing',
          category: 'PRINTING',
        };

        navigate('/checkout/service', { state: { orderData } });
        
        // Reset essential states
        setFile(null);
        setName('');
      }
    } catch (err) {
      console.error('Order Submission Error:', err);
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

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-10 lg:p-12">
          <div className="text-[10px] md:text-sm font-medium mb-4 md:mb-8 flex flex-wrap items-center gap-2">
            <Link to="/" className="text-[#3b71ca] hover:text-[#285192]">Home</Link><span className="text-gray-500">›</span>
            <Link to="/services" className="text-[#3b71ca] hover:text-[#285192]">Our Services</Link><span className="text-gray-500">›</span>
            <Link to="/services/custom-printing" className="text-[#3b71ca] hover:text-[#285192]">Custom Printing</Link><span className="text-gray-500">›</span>
            <span className="text-[#a64d24]">Digital Paper Printing</span>
          </div>

          <div className="mb-6 md:mb-10">
            <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-2 md:mb-3 tracking-tight">Digital Paper Printing</h1>
            <p className="text-xs md:text-base text-gray-600 max-w-3xl leading-relaxed">Premium media options for professional-grade digital prints.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-full lg:w-2/3 flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-[#e8dfd5] overflow-hidden shadow-sm">
                <div className="p-4 md:p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-6"><Layers className="w-5 h-5 text-[#a64d24]" /><h3 className="text-base md:text-lg font-bold text-gray-900 uppercase tracking-wider">Select Product</h3></div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                    {PAPER_PRODUCTS.map((p) => (
                      <div key={p.id} onClick={() => {
                        setSel(p.id);
                        if (p.id !== 'letterhead') setLhType('');
                        if (p.id !== 'art') { setArtType(''); setLamination(''); }
                        if (p.id !== 'texture') setTextureType('');
                        if (p.id !== 'metallic') setMetallicType('');
                        if (p.id !== 'ntpvc') setNtpvcType('');
                        if (p.id !== 'gummed' && p.id !== 'pvcgum') { setGumType(''); setHalfCut(''); }
                        if (p.id === 'pvcgum') setSize('13x19');
                        if (p.id === 'only') setSize('');
                        setFile(null); // Reset file on product change
                        const nextMin = p.id === 'only' ? 1 : (['art', 'texture', 'metallic', 'ntpvc', 'gummed', 'pvcgum'].includes(p.id) ? 10 : 25);
                        if (qty < nextMin) setQty(nextMin);
                      }}
                        className={`rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 ${sel === p.id ? 'border-[#a64d24] shadow-md scale-[1.02]' : 'border-[#e8dfd5] hover:border-[#d1a88b] hover:shadow'}`}>
                        <div className="relative h-24 flex items-center justify-center text-4xl" style={{ background: p.imageBg }}>
                          <span className="opacity-70">{p.emoji}</span>
                          {sel === p.id && (
                            <span className="absolute top-1.5 right-1.5 bg-[#a64d24] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">SELECTED</span>
                          )}
                        </div>
                        <div className="p-2.5 bg-white">
                          <p className={`font-bold text-[11px] leading-tight mb-0.5 truncate ${sel === p.id ? 'text-[#a64d24]' : 'text-gray-800'}`}>{p.name}</p>
                          <p className="text-[10px] text-[#b65e2e]">{p.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {sel === 'letterhead' && (
                    <div className="mb-10 p-5 bg-[#faf8f5] rounded-xl border border-[#e8dfd5] animate-in fade-in slide-in-from-top-4 duration-300">
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#a64d24]" />
                        Choose Letterhead Paper Type
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { id: 'deo', name: 'Deo Paper', desc: 'Standard professional finish' },
                          { id: 'excel', name: 'Excel Bond Paper', desc: 'Premium high-grade texture' }
                        ].map((type) => (
                          <div
                            key={type.id}
                            onClick={() => setLhType(type.id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${lhType === type.id
                              ? 'border-[#a64d24] bg-white shadow-sm'
                              : 'border-transparent bg-white/50 hover:bg-white hover:border-[#d1a88b]'
                              }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className={`font-bold text-sm ${lhType === type.id ? 'text-[#a64d24]' : 'text-gray-700'}`}>{type.name}</span>
                              {lhType === type.id && <div className="w-2 h-2 rounded-full bg-[#a64d24]" />}
                            </div>
                            <p className="text-[11px] text-gray-500">{type.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200">
                  <div className="bg-white px-6 py-4 border-b border-gray-200">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Select Detail</h3>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center px-6 py-4 border-b border-gray-100 gap-4">
                    <div className="w-full sm:w-1/3 flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[#001a57]" />
                      <span className="text-sm font-bold text-[#001a57]">ORDER NAME</span>
                    </div>
                    <div className="w-full sm:w-2/3">
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="यहाँ अपने कस्टमर का नाम टाइप करें..."
                        className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500/50 outline-none placeholder:text-gray-300" />
                    </div>
                  </div>

                  {sel === 'art' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center px-6 py-4 border-b border-gray-100 gap-4 animate-in fade-in duration-300">
                      <div className="w-full sm:w-1/3 flex items-center gap-3">
                        <Layers className="w-4 h-4 text-[#001a57]" />
                        <span className="text-sm font-bold text-[#001a57]">SELECT PRODUCT</span>
                      </div>
                      <div className="w-full sm:w-2/3">
                        <CustomDropdown
                          options={ART_PAPER_OPTIONS}
                          value={artType}
                          onChange={(e) => {
                            setArtType(e.target.value);
                            setLamination('');
                          }}
                          placeholder="--Select Product--"
                        />
                      </div>
                    </div>
                  )}

                  {sel === 'texture' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center px-6 py-4 border-b border-gray-100 gap-4 animate-in fade-in duration-300">
                      <div className="w-full sm:w-1/3 flex items-center gap-3">
                        <Layers className="w-4 h-4 text-[#001a57]" />
                        <span className="text-sm font-bold text-[#001a57]">SELECT PRODUCT</span>
                      </div>
                      <div className="w-full sm:w-2/3">
                        <CustomDropdown
                          options={TEXTURE_PAPER_OPTIONS}
                          value={textureType}
                          onChange={(e) => setTextureType(e.target.value)}
                          placeholder="--Select Product--"
                        />
                      </div>
                    </div>
                  )}

                  {sel === 'metallic' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center px-6 py-4 border-b border-gray-100 gap-4 animate-in fade-in duration-300">
                      <div className="w-full sm:w-1/3 flex items-center gap-3">
                        <Layers className="w-4 h-4 text-[#001a57]" />
                        <span className="text-sm font-bold text-[#001a57]">SELECT PRODUCT</span>
                      </div>
                      <div className="w-full sm:w-2/3">
                        <CustomDropdown
                          options={METALLIC_PAPER_OPTIONS}
                          value={metallicType}
                          onChange={(e) => setMetallicType(e.target.value)}
                          placeholder="--Select Product--"
                        />
                      </div>
                    </div>
                  )}

                  {sel === 'ntpvc' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center px-6 py-4 border-b border-gray-100 gap-4 animate-in fade-in duration-300">
                      <div className="w-full sm:w-1/3 flex items-center gap-3">
                        <Layers className="w-4 h-4 text-[#001a57]" />
                        <span className="text-sm font-bold text-[#001a57]">SELECT PRODUCT</span>
                      </div>
                      <div className="w-full sm:w-2/3">
                        <CustomDropdown
                          options={NTPVC_PAPER_OPTIONS}
                          value={ntpvcType}
                          onChange={(e) => {
                            setNtpvcType(e.target.value);
                            if (e.target.value.includes('200 Micron')) setPrinting('1 Side');
                          }}
                          placeholder="--Select Product--"
                        />
                      </div>
                    </div>
                  )}

                  {(sel === 'gummed' || sel === 'pvcgum') && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center px-6 py-4 border-b border-gray-100 gap-4 animate-in fade-in duration-300">
                      <div className="w-full sm:w-1/3 flex items-center gap-3">
                        <Layers className="w-4 h-4 text-[#001a57]" />
                        <span className="text-sm font-bold text-[#001a57]">SELECT PRODUCT</span>
                      </div>
                      <div className="w-full sm:w-2/3">
                        <CustomDropdown
                          options={sel === 'gummed' ? GUMMING_PAPER_OPTIONS : PVC_GUMMING_OPTIONS}
                          value={gumType}
                          onChange={(e) => setGumType(e.target.value)}
                          placeholder="--Select Product--"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center px-6 py-4 border-b border-gray-100 gap-4">
                    <div className="w-full sm:w-1/3 flex items-center gap-3">
                      <Package className="w-4 h-4 text-[#001a57]" />
                      <span className="text-sm font-bold text-[#001a57]">Quantity</span>
                    </div>
                    <div className="w-full sm:w-2/3 flex items-center gap-3">
                      <input type="number" min={minQty} value={qty} onChange={(e) => setQty(Number(e.target.value))}
                        className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500/50" />
                      <span className="text-[11px] text-blue-500 font-medium">(Min Qty. : {minQty})</span>
                    </div>
                  </div>

                  {sel !== 'texture' && sel !== 'metallic' && sel !== 'ntpvc' && sel !== 'only' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center px-6 py-4 border-b border-gray-100 gap-4">
                      <div className="w-full sm:w-1/3 flex items-center gap-3">
                        <Tag className="w-4 h-4 text-[#001a57]" />
                        <span className="text-sm font-bold text-[#001a57]">Size</span>
                      </div>
                      <div className="w-full sm:w-2/3">
                        <CustomDropdown
                          options={sel === 'pvcgum' ? ['13x19'] : SIZE_OPTIONS}
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                          placeholder="--Select--"
                        />
                      </div>
                    </div>
                  )}

                  {(sel === 'gummed' || sel === 'pvcgum') && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center px-6 py-4 border-b border-gray-100 gap-4 animate-in fade-in duration-300">
                      <div className="w-full sm:w-1/3 flex items-center gap-3">
                        <Scissors className="w-4 h-4 text-[#001a57]" />
                        <span className="text-sm font-bold text-[#001a57]">Half Cut</span>
                      </div>
                      <div className="w-full sm:w-2/3">
                        <CustomDropdown
                          options={HALFCUT_OPTIONS}
                          value={halfCut}
                          onChange={(e) => setHalfCut(e.target.value)}
                          placeholder="--Select--"
                        />
                      </div>
                    </div>
                  )}

                  {showLamination && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center px-6 py-4 border-b border-gray-100 gap-4 animate-in fade-in duration-300">
                      <div className="w-full sm:w-1/3 flex items-center gap-3">
                        <Layers className="w-4 h-4 text-[#001a57]" />
                        <span className="text-sm font-bold text-[#001a57]">Lamination</span>
                      </div>
                      <div className="w-full sm:w-2/3">
                        <CustomDropdown
                          options={LAMINATION_OPTIONS}
                          value={lamination}
                          onChange={(e) => setLamination(e.target.value)}
                          placeholder="--Select--"
                        />
                      </div>
                    </div>
                  )}

                  {/* Printing Row */}
                  {sel !== 'gummed' && sel !== 'pvcgum' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center px-6 py-4 border-b border-gray-100 gap-4">
                      <div className="w-full sm:w-1/3 flex items-center gap-3">
                        <Printer className="w-4 h-4 text-[#001a57]" />
                        <span className="text-sm font-bold text-[#001a57]">Printing</span>
                      </div>
                      <div className="w-full sm:w-2/3">
                        <CustomDropdown
                          options={
                            sel === 'only'
                              ? ['Single Side', 'Both Side']
                              : sel !== 'texture' && !(sel === 'ntpvc' && ntpvcType.includes('200 Micron'))
                              ? ['1 Side', '2 Side']
                              : ['1 Side']
                          }
                          value={printing}
                          onChange={(e) => setPrinting(e.target.value)}
                          placeholder="--Select--"
                        />
                      </div>
                    </div>
                  )}

                  {/* SELECT DELIVERY OPTION (Added to match image) */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/30">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4">Select Delivery Option</h3>
                    <div className="space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="radio" name="delivery" checked={deliveryOption === 'courier'} onChange={() => setDeliveryOption('courier')}
                          className="mt-1 w-4 h-4 text-[#b65e2e] focus:ring-[#b65e2e]" />
                        <div>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-bold text-gray-800">Deliver By Courier</span>
                          </div>
                          <p className="text-[10px] text-green-600 font-bold uppercase mt-0.5">Free Delivery</p>
                          <p className="text-[11px] text-gray-500 mt-1 italic">Select Courier Option</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="radio" name="delivery" checked={deliveryOption === 'transport'} onChange={() => setDeliveryOption('transport')}
                          className="mt-1 w-4 h-4 text-[#b65e2e] focus:ring-[#b65e2e]" />
                        <div>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-bold text-gray-800">Dispatch By Transport</span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 italic">Freight Charges Extra (Paid at the time of delivery)</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Design File */}
                <div className="p-6 lg:p-8 border-t border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Design File</label>
                  <div className="flex items-center gap-6 mb-8">
                    {['online', 'email'].map((o) => (
                      <div key={o} className="flex items-center gap-2 cursor-pointer group" onClick={() => setDOpt(o)}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${dOpt === o ? 'border-[#b65e2e] bg-[#fffaf5]' : 'border-gray-300'}`}>
                          {dOpt === o && <div className="w-2.5 h-2.5 rounded-full bg-[#b65e2e]" />}
                        </div>
                        <div className="flex items-center gap-2">
                          {o === 'online' ? <UploadCloud className="w-4 h-4 text-[#a64d24]" /> : <Mail className="w-4 h-4 text-[#a64d24]" />}
                          <span className="text-sm font-bold text-gray-700 capitalize">{o === 'online' ? 'Attach File Online' : 'Send via Email'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {dOpt === 'online' ? (
                    <div
                      className="border-2 border-dashed border-[#d1a88b] bg-[#fffaf5] rounded-2xl p-10 flex flex-col items-center text-center hover:bg-[#fbf4ea] cursor-pointer transition-all animate-in fade-in slide-in-from-top-2 duration-300"
                      onClick={() => document.getElementById('file-upload').click()}
                    >
                      <UploadCloud className="w-12 h-12 text-[#a64d24] mb-4" />
                      <p className="text-sm font-bold text-gray-900 mb-1">
                        {file ? file.name : 'Drag and drop your design here'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">PDF, CDR, PSD, JPEG, PNG (Max 50MB)</p>
                      <button className="border-2 border-[#b65e2e] text-[#b65e2e] hover:bg-[#b65e2e] hover:text-white transition-all font-bold py-2.5 px-8 rounded-xl text-xs bg-white uppercase tracking-widest">
                        {file ? 'Change Artwork' : 'Upload Artwork'}
                      </button>
                      <input type="file" id="file-upload" className="hidden" accept=".pdf,.cdr,.psd,.jpeg,.jpg,.png" onChange={handleFileChange} />
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

                <div className="bg-[#fff4f2] border border-[#f5c6cb] rounded-lg p-4 flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div><h4 className="text-sm font-bold text-red-700">Resolution Requirement</h4>
                    <p className="text-xs text-red-600 mt-0.5">Designs must be at least 300 DPI for professional-quality digital printing results.</p></div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/3 flex flex-col gap-6 lg:sticky lg:top-6">
              <div className="bg-[#1c1a19] text-white rounded-2xl overflow-hidden shadow-lg border border-gray-800">
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-6 border-b border-gray-700 pb-3">Order Summary</h3>
                  {selected ? (
                    <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
                      <div className="text-xs text-gray-400 mb-1">Selected Product</div>
                      <div className="font-bold text-[#f0ba9c]">
                        {selected.name}
                        {sel === 'letterhead' && lhType && (
                          <span className="text-white ml-2 text-[10px] bg-[#a64d24] px-1.5 py-0.5 rounded uppercase">
                            {lhType === 'deo' ? 'Deo' : 'Excel Bond'}
                          </span>
                        )}
                        {sel === 'art' && artType && (
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-white text-[10px] bg-blue-600 px-1.5 py-0.5 rounded uppercase w-fit">
                              {artType}
                            </span>
                            {lamination && (
                              <span className="text-white text-[10px] bg-indigo-600 px-1.5 py-0.5 rounded uppercase w-fit">
                                {lamination}
                              </span>
                            )}
                          </div>
                        )}
                        {sel === 'texture' && textureType && (
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-white text-[10px] bg-emerald-600 px-1.5 py-0.5 rounded uppercase w-fit">
                              {textureType}
                            </span>
                          </div>
                        )}
                        {sel === 'metallic' && metallicType && (
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-white text-[10px] bg-amber-600 px-1.5 py-0.5 rounded uppercase w-fit">
                              {metallicType}
                            </span>
                          </div>
                        )}
                        {sel === 'ntpvc' && ntpvcType && (
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-white text-[10px] bg-sky-600 px-1.5 py-0.5 rounded uppercase w-fit">
                              {ntpvcType}
                            </span>
                          </div>
                        )}
                        {(sel === 'gummed' || sel === 'pvcgum') && gumType && (
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-white text-[10px] bg-rose-600 px-1.5 py-0.5 rounded uppercase w-fit">
                              {gumType}
                            </span>
                            {halfCut && (
                              <span className="text-white text-[10px] bg-orange-600 px-1.5 py-0.5 rounded uppercase w-fit">
                                HALF CUT: {halfCut}
                              </span>
                            )}
                            {lamination && (
                              <span className="text-white text-[10px] bg-indigo-600 px-1.5 py-0.5 rounded uppercase w-fit">
                                {lamination}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-300 mt-1">{selected.detail}</div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700 border-dashed text-center">
                      <span className="text-sm text-gray-400">Please select a paper type</span>
                    </div>
                  )}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Quantity</span><span className="font-medium">{qty || '-'}</span></div>
                    {sel !== 'texture' && sel !== 'metallic' && sel !== 'ntpvc' && sel !== 'only' && <div className="flex justify-between text-sm"><span className="text-gray-400">Paper Size</span><span className="font-medium">{size || '-'}</span></div>}
                    {sel !== 'gummed' && sel !== 'pvcgum' && <div className="flex justify-between text-sm"><span className="text-gray-400">Printing Side</span><span className="font-medium">{printing || '-'}</span></div>}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Design File</span>
                      <span className="font-medium truncate max-w-[120px] flex items-center gap-1">
                        {file ? <><Paperclip className="w-3 h-3" />{file.name}</> : (dOpt === 'online' ? 'Not Attached' : 'Email Selected')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Delivery</span><span className="font-medium capitalize">{deliveryOption}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">GST (18%)</span><span className="font-medium">-</span></div>
                  </div>
                  <div className="flex justify-between items-center mb-8 border-t border-gray-700 pt-4">
                    <span className="font-bold text-lg">Total Amount</span><span className="font-bold text-2xl">-</span>
                  </div>
                  <button
                    onClick={handleAddOrder}
                    disabled={loading || !sel || !qty || qty < minQty || !printing || !size || (sel === 'letterhead' && !lhType) || (sel === 'art' && !artType) || (sel === 'texture' && !textureType) || (sel === 'metallic' && !metallicType) || (sel === 'ntpvc' && !ntpvcType) || ((sel === 'gummed' || sel === 'pvcgum') && (!gumType || !halfCut)) || (showLamination && !lamination) || (dOpt === 'online' && !file)}
                    className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-colors mb-4 ${!loading && sel && qty && qty >= minQty && printing && size && (sel !== 'letterhead' || lhType) && (sel !== 'art' || artType) && (sel !== 'texture' || textureType) && (sel !== 'metallic' || metallicType) && (sel !== 'ntpvc' || ntpvcType) && (sel !== 'gummed' || gumType) && (sel !== 'pvcgum' || gumType) && (sel !== 'gummed' || halfCut) && (sel !== 'pvcgum' || halfCut) && (!showLamination || lamination) && (dOpt !== 'online' || file) ? 'bg-[#b65e2e] hover:bg-[#a15024] text-white cursor-pointer' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                    {loading ? 'Processing...' : 'Add Order'}
                  </button>
                  {qty > 0 && qty < minQty && <p className="text-rose-500 text-[10px] text-center mb-2 font-bold uppercase">Minimum order quantity for this product is {minQty} pcs</p>}
                  <p className="text-center text-xs text-gray-500 italic">{(sel && qty && (sel !== 'letterhead' || lhType) && (sel !== 'art' || artType) && (sel !== 'texture' || textureType) && (sel !== 'metallic' || metallicType) && (sel !== 'ntpvc' || ntpvcType) && (sel !== 'gummed' || gumType) && (sel !== 'pvcgum' || gumType) && (sel !== 'gummed' || halfCut) && (sel !== 'pvcgum' || halfCut) && (!showLamination || lamination) && (dOpt !== 'online' || file)) ? 'Est. delivery: 1 business day' : 'Select product, type, quantity & file to proceed'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



