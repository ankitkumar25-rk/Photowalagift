import { useState, useMemo, useEffect, createElement } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PenTool, StickyNote, Printer, FileText, Tag, Book, Mail,
  UploadCloud, ShoppingCart, HelpCircle, ChevronLeft, CheckCircle2, Info, Loader2, Paperclip
} from 'lucide-react';
import api from '../../../../api/client';
import { useAuthStore } from '../../../../store';
import CustomDropdown from '../../../../components/CustomDropdown';
import { 
  FaPenNib, FaNoteSticky, FaPrint, FaFileSignature, 
  FaTag, FaFileInvoiceDollar, FaEnvelope, FaRegSquare, FaRegCircle, FaBorderAll
} from 'react-icons/fa6';

const SIDEBAR_LINKS = [
  { id: 'pen', icon: FaPenNib, label: 'Pen', to: '/services/custom-printing/pen' },
  { id: 'sticker', icon: FaNoteSticky, label: 'Sticker Labels', to: '/services/custom-printing/sticker-labels', active: true },
  { id: 'digital', icon: FaPrint, label: 'Digital Paper Printing', to: '/services/custom-printing/digital-printing' },
  { id: 'letterhead', icon: FaFileSignature, label: 'Letterhead', to: '/services/custom-printing/letterhead' },
  { id: 'garment', icon: FaTag, label: 'Garment Tag', to: '/services/custom-printing/garment-tag' },
  { id: 'billbook', icon: FaFileInvoiceDollar, label: 'Bill Book', to: '/services/custom-printing/bill-book' },
  { id: 'envelope', icon: FaEnvelope, label: 'Envelope', to: '/services/custom-printing/envelope' },
];


const CUT_TYPES = [
  { id: 'no-cut', label: 'Sticker', subLabel: '(Without Half Cut)', path: '/services/custom-printing/sticker-labels/no-cut', icon: FaRegSquare },
  { id: 'round-cut', label: 'Sticker', subLabel: '(With Round Cut)', path: '/services/custom-printing/sticker-labels/round-cut', icon: FaRegCircle },
  { id: 'straight-cut', label: 'Sticker', subLabel: '(With Straight Cut)', path: '/services/custom-printing/sticker-labels/straight-cut', icon: FaBorderAll },
];

const SHEET_SIZES = ['7"x9.5" (Inch)'];
const LAMINATION_OPTIONS = ['Not Required', 'Gloss Lamination'];

const ROUND_OPTIONS = [
  '1 Round Sticker (170x170 MM)',
  '2 Round Stickers (115x115 MM)',
  '6 Round Stickers (75x75 MM)',
  '12 Round Stickers (55x55 MM)',
  '20 Round Stickers (40x40 MM)',
  '35 Round Stickers (30x30 MM)',
];

const STRAIGHT_OPTIONS = [
  '2 Sticker (Size - 178x118 MM)',
  '3 Sticker (Size - 178x79 MM)',
  '4 Sticker (Size - 178x59 MM)',
  '4 Sticker (Size - 90x118 MM)',
  '6 Sticker (Size - 178x40 MM)',
  '6 Sticker (Size - 90x80 MM)',
  '6 Sticker (Size - 60x120 MM)',
  '8 Sticker (Size - 90x59 MM)',
  '9 Sticker (Size - 60x80 MM)',
  '10 Sticker (Size - 178x24 MM)',
  '12 Sticker (Size - 90x40 MM)',
  '12 Sticker (Size - 60x60 MM)',
  '18 Sticker (Size - 60x40 MM)',
  '20 Sticker (Size - 90x24 MM)',
  '30 Sticker (Size - 60x24 MM)',
];

export default function StickerLabels() {
  const navigate = useNavigate();
  const { type } = useParams();
  const currentType = type || 'no-cut';
  const user = useAuthStore((s) => s.user);

  // State
  const [orderName, setOrderName]           = useState('');
  const [qty, setQty]                       = useState('1000');
  const [sheetSize, setSheetSize]           = useState('');
  const [lamination, setLamination]         = useState('');
  const [deliveryOption, setDeliveryOption] = useState('courier');
  const [designOption, setDesignOption]     = useState('online');
  const [selectedFile, setSelectedFile]     = useState(null);
  const [remark, setRemark]                 = useState('');
  const [stickerCount, setStickerCount]     = useState('');
  const [loading, setLoading]               = useState(false);

  // Reset variant specific state when type changes
  useEffect(() => {
    setStickerCount('');
  }, [currentType]);

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

  const config = useMemo(() => {
    switch(currentType) {
      case 'round-cut':
        return {
          code: 'ST-2',
          hasCount: true,
          options: ROUND_OPTIONS,
          guideImage: '/images/services/round-cut-guide.png',
          guideTitle: 'Round Cut Layout Guide (7"x9.5")',
          halfCutDetails: (
            <div className="flex flex-col">
              <span className="italic">Available with 6 cut size options:</span>
              {ROUND_OPTIONS.map((opt, i) => <span key={i} className="ml-2">⇒ {opt}</span>)}
            </div>
          )
        };
      case 'straight-cut':
        return {
          code: 'ST-3',
          hasCount: true,
          options: STRAIGHT_OPTIONS,
          guideImage: '/images/services/straight-cut-guide.png',
          guideTitle: 'Straight Cut Layout Guide (7"x9.5")',
          halfCutDetails: (
            <div className="flex flex-col">
              <span className="italic">Available with 15 cut size options</span>
            </div>
          )
        };
      case 'no-cut':
        return {
          code: 'ST-1',
          hasCount: false,
          options: [],
          guideImage: null,
          halfCutDetails: null
        };
      default:
        return null;
    }
  }, [currentType]);

  const pricing = useMemo(() => {
    const base = Number(qty) * 1.7;
    const lamCharge = lamination === 'Gloss Lamination' ? 200 : 0;
    const emailFee = designOption === 'email' ? 10 : 0;
    const subtotal = base + lamCharge + emailFee;
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    return {
      base: base.toFixed(2),
      lam: lamCharge.toFixed(2),
      gst: gst.toFixed(2),
      total: total.toFixed(2),
      emailFee
    };
  }, [qty, lamination, designOption]);

  const canOrder = Boolean(
    currentType &&
    !loading &&
    orderName.trim() && 
    Number(qty) >= 1000 && 
    sheetSize && 
    lamination &&
    (!config?.hasCount || stickerCount) &&
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
        serviceName: 'Sticker Label',
        customerName: orderName.trim(),
        productName: CUT_TYPES.find(t => t.id === currentType)?.label + ' ' + CUT_TYPES.find(t => t.id === currentType)?.subLabel,
        quantity: Number(qty),
        totalAmount: Number(pricing.total),
        fileUrl: fileUrl || (designOption === 'email' ? 'SEND_VIA_EMAIL' : ''),
        fileOption: designOption,
        specialRemark: remark,
        details: {
          sheetSize,
          lamination,
          stickerCount: stickerCount || 'Standard',
          delivery: deliveryOption,
          pricing: {
            base: pricing.base,
            lam: pricing.lam,
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
          serviceName: 'Sticker Label',
          category: 'PRINTING',
        };

        navigate('/checkout/service', { state: { orderData } });

        setOrderName('');
        setSelectedFile(null);
        setRemark('');
        setStickerCount('');
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

      <main className="flex-1 p-6 md:p-10 lg:p-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-sm font-medium mb-8 flex items-center gap-2">
            <Link to="/" className="text-[#3b71ca] hover:text-[#285192]">Home</Link><span className="text-gray-500">›</span>
            <Link to="/services" className="text-[#3b71ca] hover:text-[#285192]">Our Services</Link><span className="text-gray-500">›</span>
            <Link to="/services/custom-printing" className="text-[#3b71ca] hover:text-[#285192]">Custom Printing</Link><span className="text-gray-500">›</span>
            <span className="text-[#a64d24]">Sticker Labels</span>
          </div>
          
        <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Sticker Labels Customization</h1>
            <p className="text-sm text-gray-500">Select Cut Type and configure your order details below.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {CUT_TYPES.map((type) => (
              <Link 
                key={type.id} 
                to={type.path}
                className={`relative bg-white rounded-2xl border-2 p-5 flex flex-col items-center text-center transition-all ${
                  currentType === type.id ? 'border-[#b65e2e] shadow-lg ring-4 ring-[#b65e2e]/5' : 'border-gray-100 hover:border-[#b65e2e]'
                }`}
              >
                {type.id === 'round-cut' && (
                  <span className="absolute -top-3 bg-yellow-400 text-[10px] font-bold px-3 py-1 rounded-full text-white uppercase tracking-tighter shadow-sm">Popular</span>
                )}
                {currentType === type.id && (
                   <div className="absolute top-3 right-3 bg-[#b65e2e] rounded-full p-1 text-white">
                      <CheckCircle2 className="w-3 h-3" />
                   </div>
                )}
                <div className="w-20 h-20 bg-gray-50 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                   {createElement(type.icon, { className: "w-10 h-10 text-gray-400" })}
                </div>
                <h3 className="font-bold text-gray-900 leading-tight">{type.label}</h3>
                <p className="text-[11px] text-gray-500 mt-1">{type.subLabel}</p>
              </Link>
            ))}
          </div>

          {currentType ? (
            <div className="flex flex-col lg:flex-row gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="flex-1 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Order Name</label>
                  <input 
                    type="text" 
                    value={orderName}
                    onChange={(e) => setOrderName(e.target.value)}
                    placeholder="यहाँ अपने कस्टमर का नाम टाइप करें"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-5 py-4 focus:outline-none focus:border-[#b65e2e] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Quantity</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="1000"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-5 py-4 focus:outline-none focus:border-[#b65e2e]"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#b65e2e] font-bold">Min: 1000</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Sheet Size</label>
                    <CustomDropdown
                      options={SHEET_SIZES}
                      value={sheetSize}
                      onChange={(e) => setSheetSize(e.target.value)}
                      placeholder="--Select--"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Lamination</label>
                  <CustomDropdown
                    options={LAMINATION_OPTIONS}
                    value={lamination}
                    onChange={(e) => setLamination(e.target.value)}
                    placeholder="--Select--"
                  />
                </div>

                {config.hasCount && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Stickers Count Per Sheet</label>
                    <CustomDropdown
                      options={config.options}
                      value={stickerCount}
                      onChange={(e) => setStickerCount(e.target.value)}
                      placeholder="--Select--"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Select Delivery Option</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="delivery" 
                        checked={deliveryOption === 'courier'} 
                        onChange={() => setDeliveryOption('courier')}
                        className="w-4 h-4 text-[#b65e2e] focus:ring-[#b65e2e]" 
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-800">Deliver By Courier</span>
                        <p className="text-[10px] text-green-600 font-bold uppercase">Free Delivery</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="delivery" 
                        checked={deliveryOption === 'transport'} 
                        onChange={() => setDeliveryOption('transport')}
                        className="w-4 h-4 text-[#b65e2e] focus:ring-[#b65e2e]" 
                      />
                      <span className="text-sm font-semibold text-gray-800">Dispatch By Transport</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider text-center lg:text-left">Design File Upload</label>
                  <div className="flex justify-center lg:justify-start gap-8 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={designOption === 'online'} onChange={() => setDesignOption('online')} />
                      <div className="flex items-center gap-1.5">
                        <UploadCloud className="w-3.5 h-3.5 text-[#b65e2e]" />
                        <span className="text-xs font-medium text-gray-600">Attach File Online</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={designOption === 'email'} onChange={() => setDesignOption('email')} />
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#b65e2e]" />
                        <span className="text-xs font-medium text-gray-600">Send via Email</span>
                      </div>
                    </label>
                  </div>

                  {designOption === 'online' ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center text-center bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-300">
                      <input type="file" id="sticker-file" className="hidden" onChange={handleFileChange} />
                      <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                        <UploadCloud className="w-8 h-8 text-[#b65e2e]" />
                      </div>
                      <p className="text-sm font-bold text-gray-900 mb-1">{selectedFile ? selectedFile.name : 'Click to browse or drag and drop'}</p>
                      <p className="text-[10px] text-gray-400 mb-4 uppercase">PDF, JPG, PNG or CDR (Max 25MB)</p>
                      <button onClick={() => document.getElementById('sticker-file').click()} className="border-2 border-[#b65e2e] text-[#b65e2e] px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#b65e2e] hover:text-white transition-all bg-white shadow-sm">
                        {selectedFile ? 'Change Artwork' : 'Upload Artwork'}
                      </button>
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

                {config.guideImage && (
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-[#b65e2e]" /> {config.guideTitle}
                    </h4>
                    <img 
                      src={config.guideImage} 
                      alt={config.guideTitle} 
                      className="w-full rounded-xl shadow-sm border border-gray-200"
                    />
                    <p className="text-[10px] text-gray-400 mt-3 italic text-center leading-relaxed">
                      Please refer to the above sheet layouts to set your design dimensions accordingly for the 7"x9.5" sheet.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Special Remark (Optional)</label>
                  <textarea 
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="remarks for order processing team..."
                    rows="3"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-5 py-4 focus:outline-none focus:border-[#b65e2e] transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="w-full lg:w-80 shrink-0 space-y-6">
              <div className="bg-[#1c1a19] text-white rounded-3xl p-8 shadow-xl relative overflow-hidden border border-gray-800">
                <h3 className="font-bold text-xl mb-8 text-[#f0ba9c]">Order Summary</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Base Cost ({qty} Qty)</span>
                    <span className="font-semibold text-gray-200">₹{pricing.base}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Cutting Customization</span>
                    <span className="font-semibold text-gray-200">₹0.00</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Lamination ({lamination || 'None'})</span>
                    <span className="font-semibold text-gray-200">₹{pricing.lam}</span>
                  </div>
                  {pricing.emailFee > 0 && (
                    <div className="flex justify-between text-sm text-[#f0ba9c] animate-in fade-in slide-in-from-left-2">
                      <span className="font-bold italic">Manual Handling Fee</span>
                      <span className="font-bold">₹{pricing.emailFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>GST (18%)</span>
                    <span className="font-semibold text-gray-200">₹{pricing.gst}</span>
                  </div>
                  {designOption === 'online' && selectedFile && (
                    <div className="flex justify-between text-xs text-[#f0ba9c] pt-2">
                       <span className="flex items-center gap-1"><Paperclip className="w-3 h-3"/> File Attached:</span>
                       <span className="font-bold truncate max-w-[120px]">{selectedFile.name}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-baseline border-t border-gray-800 pt-6 mb-8">
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount Payable</span>
                   <span className="text-2xl font-black text-[#f0ba9c]">₹{pricing.total}</span>
                </div>
                <button 
                  onClick={handleAddOrder}
                  disabled={!canOrder}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm shadow-lg transition-all ${
                    canOrder ? 'bg-[#a64d24] hover:bg-[#8c3a1b] text-white cursor-pointer' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                  {loading ? 'Processing...' : 'Add Order'}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-4 leading-tight">
                  By clicking above, you agree to our terms of service regarding custom printing.
                </p>
              </div>

              <div className="bg-[#fdfcfb] rounded-3xl p-8 border border-orange-50 space-y-8">
                <div>
                  <h4 className="text-sm font-bold text-[#b65e2e] border-b-2 border-[#b65e2e] pb-1 mb-4 inline-block">Product Description</h4>
                  <ul className="space-y-2">
                    <li className="text-[11px] text-gray-600 flex gap-2">
                       <span className="font-bold shrink-0">• Product Ref. :</span>
                       <span>ST/ 2nd Edition (Sample File)</span>
                    </li>
                    <li className="text-[11px] text-gray-600 flex gap-2">
                       <span className="font-bold shrink-0">• Product Code :</span>
                       <span>{config.code}</span>
                    </li>
                    <li className="text-[11px] text-gray-600 flex gap-2">
                       <span className="font-bold shrink-0">• Product Size :</span>
                       <div className="flex flex-col">
                          <span className="italic">Available with</span>
                          <span className="font-bold">⇒ 7"X9.5"</span>
                       </div>
                    </li>
                    {config.halfCutDetails && (
                      <li className="text-[11px] text-gray-600 flex gap-2 pt-1">
                        <span className="font-bold shrink-0">• Half-Cut Options :</span>
                        {config.halfCutDetails}
                      </li>
                    )}
                    <li className="text-[11px] text-gray-600 flex gap-2 pt-2">
                       <span className="font-bold shrink-0">• Production Time :</span>
                       <span className="font-bold text-[#b65e2e]">Within 7 days from file upload</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#b65e2e] border-b-2 border-[#b65e2e] pb-1 mb-4 inline-block">Our Specialization</h4>
                  <ul className="space-y-3">
                    {[
                      'Printing with latest Komori offset machines (2023 Model)',
                      'Innovative, Advanced & Equipped Post Printing Unit',
                      'Constant quality with reasonable price'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#b65e2e] shrink-0 mt-0.5" />
                        <span className="text-[11px] text-gray-600 font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            </div>
          ) : (
            <div className="py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 bg-[#fdfaf7] rounded-full flex items-center justify-center mb-6">
                <Info className="w-10 h-10 text-[#b65e2e]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Cut Type Above</h3>
              <p className="text-gray-500 max-w-sm">Please choose a sticker category from the options above to view pricing and customization details.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
