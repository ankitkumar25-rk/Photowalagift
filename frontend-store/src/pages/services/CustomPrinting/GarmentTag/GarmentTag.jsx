import { useState, useMemo, useEffect, createElement } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PenTool, StickyNote, Printer, FileText, Tag, Book, Mail,
  HelpCircle, UploadCloud, AlertTriangle, ShoppingCart, Package, File, Loader2, Truck, CheckCircle2, Scissors,
  ChevronLeft, ChevronRight, Sparkles, Layers
} from 'lucide-react';
import api from '../../../../api/client';
import { useAuthStore } from '../../../../store';
import CustomDropdown from '../../../../components/CustomDropdown';
import {
  FaPenNib, FaNoteSticky, FaPrint, FaFileSignature,
  FaTag, FaFileInvoiceDollar, FaEnvelope,
  FaStar, FaLayerGroup, FaWandMagicSparkles, FaSitemap
} from 'react-icons/fa6';
import { serviceAssets } from '../../../../data/assets';

const SIDEBAR_LINKS = [
  { id: 'pen', icon: FaPenNib, label: 'Pen', to: '/services/custom-printing/pen' },
  { id: 'sticker', icon: FaNoteSticky, label: 'Sticker Labels', to: '/services/custom-printing/sticker-labels' },
  { id: 'digital', icon: FaPrint, label: 'Digital Paper Printing', to: '/services/custom-printing/digital-printing' },
  { id: 'letterhead', icon: FaFileSignature, label: 'Letterhead', to: '/services/custom-printing/letterhead' },
  { id: 'garment', icon: FaTag, label: 'Garment Tag', to: '/services/custom-printing/garment-tag', active: true },
  { id: 'billbook', icon: FaFileInvoiceDollar, label: 'Bill Book', to: '/services/custom-printing/bill-book' },
  { id: 'envelope', icon: FaEnvelope, label: 'Envelope', to: '/services/custom-printing/envelope' },
];

const GARMENT_TYPES = [
  { id: 'gloss', label: 'Gloss Coated Tags', to: '/services/custom-printing/garment-gloss', icon: FaStar, imageBg: '#3a3a3a', detail: 'Hi-Gloss Finish' },
  { id: 'matt', label: 'Matt Lamination Tags', to: '/services/custom-printing/garment-matt', icon: FaLayerGroup, imageBg: '#2d4a3e', detail: 'Smooth Matt' },
  { id: 'uv', label: 'Matt Lamination + UV', to: '/services/custom-printing/garment-uv', icon: FaWandMagicSparkles, imageBg: '#c9a227', detail: 'Fine UV Effect' },
  { id: 'threads', label: 'Garment Threads', to: '/services/custom-printing/garment-thread', icon: FaSitemap, imageBg: '#e8dfd5', detail: 'Premium Seals' },
];

const SIZE_OPTIONS = ['Large', 'Medium', 'Small'];
const QUANTITY_OPTIONS = [2000, 4000, 6000, 8000, 10000];
const DIE_SHAPES = Array.from({ length: 10 }, (_, i) => `Die No. ${i + 1}`);

// --- DATA ---
const DATA = {
  gloss: {
    title: 'Gloss Coated Tags',
    code: 'Tag-1',
    class: 'Super Gloss Coated',
    core: 'Gloss Coat with Excellent printing',
    lamination: 'Hi-Gloss',
    images: [
      { id: 1, url: serviceAssets.garmentTagGloss, title: 'Gloss Tag Layout' },
      { id: 2, url: '/assets/images/services/garment_tag_2.png', title: 'Large & Medium Size Die' },
      { id: 3, url: '/assets/images/services/garment_tag_3.png', title: 'Small Size Die' },
    ],
    rates: {
      'Small': { 2000: 1.20, 4000: 1.10, 6000: 1.00, 8000: 0.95, 10000: 0.90 },
      'Medium': { 2000: 1.80, 4000: 1.65, 6000: 1.50, 8000: 1.45, 10000: 1.40 },
      'Large': { 2000: 2.50, 4000: 2.30, 6000: 2.10, 8000: 2.00, 10000: 1.90 },
    },
    printingOptions: ['Single Side with Black Back Printing'],
    specs: [
      { label: 'Size Must be as below ( Small Tags )', design: 'W: 56.00 mm X H: 54.00 mm', matter: 'W: 43.00 mm X H: 43.00 mm', cutting: 'W: 48.00 mm X H: 48.00 mm' },
      { label: 'Size Must be as below ( Medium Tags )', design: 'W: 54.00 mm X H: 90.00 mm', matter: 'W: 40.00 mm X H: 76.00 mm', cutting: 'W: 48.00 mm X H: 84.00 mm' },
      { label: 'Size Must be as below ( Large Tags )', design: 'W: 56.00 mm X H: 108.00 mm', matter: 'W: 42.00 mm X H: 94.00 mm', cutting: 'W: 50.00 mm X H: 102.00 mm' },
    ]
  },
  matt: {
    title: 'Matt Lamination Tags',
    code: 'Tag-2',
    class: 'Premium',
    core: 'Smooth Matt',
    lamination: 'Matt',
    images: [
      { id: 1, url: '/assets/images/services/garment_tag_2.png', title: 'Matt Lamination Tags' },
      { id: 2, url: '/assets/images/services/garment_tag_1.png', title: 'Large & Medium Size Die' },
      { id: 3, url: '/assets/images/services/garment_tag_3.png', title: 'Small Size Die' },
    ],
    rates: {
      'Small': { 2000: 1.40, 4000: 1.30, 6000: 1.20, 8000: 1.15, 10000: 1.10 },
      'Medium': { 2000: 2.10, 4000: 1.95, 6000: 1.80, 8000: 1.75, 10000: 1.70 },
      'Large': { 2000: 2.80, 4000: 2.60, 6000: 2.40, 8000: 2.30, 10000: 2.20 },
    },
    printingOptions: ['Both Side'],
    specs: [
      { label: 'Size Must be as below ( Small Tags )', design: 'W: 57.00 mm X H: 59.00 mm', matter: 'W: 44.00 mm X H: 44.00 mm', cutting: 'W: 50.00 mm X H: 50.00 mm' },
      { label: 'Size Must be as below ( Medium Tags )', design: 'W: 57.00 mm X H: 94.00 mm', matter: 'W: 45.00 mm X H: 82.00 mm', cutting: 'W: 50.50 mm X H: 87.50 mm' },
      { label: 'Size Must be as below ( Large Tags )', design: 'W: 58.50 mm X H: 113.50 mm', matter: 'W: 46.00 mm X H: 101.00 mm', cutting: 'W: 52.00 mm X H: 107.00 mm' },
    ]
  },
  uv: {
    title: 'Matt Lamination + UV',
    code: 'Tag-3',
    class: 'Premium',
    core: 'Smooth Matt with Fine UV',
    lamination: 'Matt',
    images: [
      { id: 1, url: '/assets/images/services/garment_tag_3.png', title: 'Spot UV Detail' },
      { id: 2, url: '/assets/images/services/garment_tag_1.png', title: 'Premium UV Finish' },
      { id: 3, url: '/assets/images/services/garment_tag_2.png', title: 'Large & Medium Size Die' },
    ],
    rates: {
      'Small': { 2000: 1.60, 4000: 1.50, 6000: 1.40, 8000: 1.35, 10000: 1.30 },
      'Medium': { 2000: 2.40, 4000: 2.25, 6000: 2.10, 8000: 2.05, 10000: 2.00 },
      'Large': { 2000: 3.20, 4000: 3.00, 6000: 2.80, 8000: 2.70, 10000: 2.60 },
    },
    productVariants: [
      'Single Side Printing + Single Side UV',
      'Both Side Printing + Single Side UV',
      'Both Side Printing + Both Side UV'
    ],
    specs: [
      { label: 'Size Must be as below ( Small Tags )', design: 'W: 57.00 mm X H: 59.00 mm', matter: 'W: 44.00 mm X H: 44.00 mm', cutting: 'W: 50.00 mm X H: 50.00 mm' },
      { label: 'Size Must be as below ( Medium Tags )', design: 'W: 57.00 mm X H: 94.00 mm', matter: 'W: 45.00 mm X H: 82.00 mm', cutting: 'W: 50.50 mm X H: 87.50 mm' },
      { label: 'Size Must be as below ( Large Tags )', design: 'W: 58.50 mm X H: 113.50 mm', matter: 'W: 46.00 mm X H: 101.00 mm', cutting: 'W: 52.00 mm X H: 107.00 mm' },
    ]
  },
  threads: {
    title: 'Garment Threads',
    products: [
      { id: 'TYPE_A', name: 'Type A - Thick', description: 'Premium Thick Hang Tag Seal Thread' },
      { id: 'TYPE_B', name: 'Type B - Slim', description: 'Standard Slim Hang Tag Seal Thread' },
      { id: 'TYPE_C', name: 'Type C - PVC', description: 'Durable PVC Coated Hang Tag Seal Thread' },
    ],
    colors: ['White', 'Black', 'Red', 'Blue', 'Brown', 'Cream', 'Orange', 'Green'],
    images: [
      { id: 1, url: serviceAssets.threadPremium, title: 'Premium Threads' },
      { id: 2, url: serviceAssets.threadStandard, title: 'Standard Threads' },
    ]
  }
};

export default function GarmentTag() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('gloss');
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Form State
  const [orderName, setOrderName] = useState('');
  const [size, setSize] = useState('');
  const [printing, setPrinting] = useState('');
  const [qty, setQty] = useState('');
  const [dieShape, setDieShape] = useState('');
  const [delivery, setDelivery] = useState('courier');
  const [fileOption, setFileOption] = useState('online');
  const [remark, setRemark] = useState('');
  const [file, setFile] = useState(null);

  // UV specific
  const [productType, setProductType] = useState('');
  const [spotUV, setSpotUV] = useState('');

  // Thread specific
  const [selThread, setSelThread] = useState('');
  const [threadColor, setThreadColor] = useState('');

  // --- TAB MANAGEMENT ---
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('gloss')) setActiveTab('gloss');
    else if (path.includes('matt')) setActiveTab('matt');
    else if (path.includes('uv')) setActiveTab('uv');
    else if (path.includes('thread')) setActiveTab('threads');
    else setActiveTab('gloss');

    // Reset form on tab change
    setOrderName(''); setSize(''); setPrinting(''); setQty(''); setDieShape('');
    setProductType(''); setSpotUV(''); setSelThread(''); setThreadColor('');
    setFile(null); setRemark(''); setActiveImageIndex(0);
  }, [location.pathname]);

  // UV Sync
  useEffect(() => {
    if (activeTab === 'uv') {
      if (!productType) { setPrinting(''); setSpotUV(''); }
      else {
        setPrinting(productType.includes('Both Side Printing') ? 'Both Side' : 'Single Side');
        setSpotUV(productType.includes('Both Side UV') ? 'Both Side' : 'Single Side');
      }
    }
  }, [productType, activeTab]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Sync active index when tab changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [activeTab]);

  const activeData = DATA[activeTab];
  const currentImages = activeData?.images || [];

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % currentImages.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
  };

  // --- PRICING LOGIC ---
  const pricing = useMemo(() => {
    if (activeTab === 'threads') {
      if (!qty || !selThread) return { subtotal: 0, gst: 0, total: 0, emailFee: 0 };
      const base = Number(qty) * 0.85; // Simple thread pricing
      const emailFee = fileOption === 'email' ? 10 : 0;
      const subtotal = base + emailFee;
      const gst = subtotal * 0.18;
      return { subtotal: subtotal.toFixed(2), gst: gst.toFixed(2), total: (subtotal + gst).toFixed(2), emailFee };
    }

    if (!qty || !size) return { subtotal: 0, gst: 0, total: 0, emailFee: 0 };

    let unitPrice = activeData.rates[size]?.[Number(qty)] || 1.50;

    // Surcharges for UV variants
    if (activeTab === 'uv') {
      if (productType === 'Both Side Printing + Single Side UV') unitPrice += 0.40;
      else if (productType === 'Both Side Printing + Both Side UV') unitPrice += 0.80;
    }

    const base = Number(qty) * unitPrice;
    const emailFee = fileOption === 'email' ? 10 : 0;
    const subtotal = base + emailFee;
    const gst = subtotal * 0.18;

    return {
      subtotal: subtotal.toFixed(2),
      gst: gst.toFixed(2),
      total: (subtotal + gst).toFixed(2),
      emailFee
    };
  }, [qty, size, fileOption, activeTab, productType, selThread, activeData]);

  // --- ACTIONS ---
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
    const isThread = activeTab === 'threads';
    const mandatoryFilled = isThread ? (selThread && qty) : (size && qty);

    if (!mandatoryFilled || (fileOption === 'online' && !file)) {
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
        if (uploadRes.data.success) fileUrl = uploadRes.data.data.url;
      }

      const payload = {
        category: 'PRINTING',
        serviceName: activeData.title,
        customerName: orderName.trim() || `${activeData.title} Order`,
        productName: isThread ? selThread : size,
        quantity: Number(qty),
        totalAmount: Number(pricing.total),
        fileUrl: fileUrl || (fileOption === 'email' ? 'SEND_VIA_EMAIL' : ''),
        fileOption: fileOption,
        specialRemark: remark,
        details: isThread ? {
          selThread,
          threadColor,
          delivery,
          pricing: {
            subtotal: pricing.subtotal,
            gst: pricing.gst,
            emailFee: pricing.emailFee
          }
        } : {
          size,
          printing,
          dieShape,
          spotUV,
          productType,
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
          serviceName: activeData.title,
          category: 'PRINTING',
        };

        navigate('/checkout/service', { state: { orderData } });

        setOrderName('');
        setSize(''); setPrinting(''); setQty(''); setDieShape('');
        setProductType(''); setSpotUV(''); setSelThread(''); setThreadColor('');
        setFile(null); setRemark('');
      }
    } catch (err) {
      console.error(err);
      alert('Order failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % activeData.images.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + activeData.images.length) % activeData.images.length);

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-10 lg:p-12">
          {/* Breadcrumbs */}
          <div className="text-[10px] md:text-sm font-medium mb-4 md:mb-8 flex flex-wrap items-center gap-2">
            <Link to="/" className="text-[#3b71ca] hover:text-[#285192]">Home</Link><span className="text-gray-500">›</span>
            <Link to="/services" className="text-[#3b71ca] hover:text-[#285192]">Our Services</Link><span className="text-gray-500">›</span>
            <Link to="/services/custom-printing" className="text-[#3b71ca] hover:text-[#285192]">Custom Printing</Link><span className="text-gray-500">›</span>
            <span className="text-[#a64d24]">{activeData.title}</span>
          </div>


          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
            {/* Left Form Column */}
            <div className="flex-1 space-y-6">

              {/* Order Name */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Order Name</label>
                <input type="text" value={orderName} onChange={(e) => setOrderName(e.target.value)}
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें..."
                  className="w-full bg-[#fffaf5] border border-[#e8dfd5] rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#b65e2e]/20 outline-none transition-all placeholder:text-gray-300" />
              </div>

              <div className="bg-white rounded-2xl border border-[#e8dfd5] overflow-hidden shadow-sm">
                <div className="p-4 md:p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Layers className="w-5 h-5 text-[#a64d24]" />
                    <h3 className="text-base md:text-lg font-bold text-gray-900 uppercase tracking-wider">Select Product</h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-2">
                    {GARMENT_TYPES.map((p) => (
                      <Link
                        key={p.id}
                        to={p.to}
                        className={`rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 ${activeTab === p.id ? 'border-[#a64d24] shadow-md scale-[1.02]' : 'border-[#e8dfd5] hover:border-[#d1a88b] hover:shadow'}`}
                      >
                        <div className="relative h-24 flex items-center justify-center text-3xl" style={{ background: p.imageBg }}>
                          <div className={`${activeTab === p.id ? 'text-white' : 'text-white/70'}`}>
                            {createElement(p.icon)}
                          </div>
                          {activeTab === p.id && (
                            <span className="absolute top-1.5 right-1.5 bg-[#a64d24] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">SELECTED</span>
                          )}
                        </div>
                        <div className="p-2.5 bg-white">
                          <p className={`font-bold text-[11px] leading-tight mb-0.5 truncate ${activeTab === p.id ? 'text-[#a64d24]' : 'text-gray-800'}`}>{p.label}</p>
                          <p className="text-[10px] text-[#b65e2e]">{p.detail}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {activeTab === 'uv' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Select UV Variant</label>
                  <CustomDropdown
                    options={activeData.productVariants}
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    placeholder="--Select Variant--"
                  />
                </div>
              )}

              {activeTab === 'threads' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Select Thread Type</label>
                  <CustomDropdown
                    options={activeData.products.map(v => ({ value: v.id, label: v.name }))}
                    value={selThread}
                    onChange={(e) => setSelThread(e.target.value)}
                    placeholder="--Select Thread Type--"
                  />
                </div>
              )}

              {/* Detail Dropdowns */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
                <div className="bg-white px-6 py-4 border-b border-gray-100 rounded-t-2xl">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Select Detail</h3>
                </div>
                <div className="p-4 md:p-6 space-y-6">
                  {activeTab !== 'threads' ? (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="w-full sm:w-32 flex items-center gap-2">
                          <Tag className="w-4 h-4 text-[#a64d24]" />
                          <span className="text-sm font-bold text-gray-700">Size</span>
                        </div>
                        <div className="w-full sm:flex-1">
                          <CustomDropdown
                            options={SIZE_OPTIONS}
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            placeholder="--Select--"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="w-full sm:w-32 flex items-center gap-2">
                          <Printer className="w-4 h-4 text-[#a64d24]" />
                          <span className="text-sm font-bold text-gray-700">Printing</span>
                        </div>
                        <div className="w-full sm:flex-1">
                          <CustomDropdown
                            options={activeTab === 'uv' ? ['Single Side', 'Both Side'] : activeData.printingOptions}
                            value={printing}
                            onChange={(e) => setPrinting(e.target.value)}
                            placeholder="--Select--"
                          />
                        </div>
                      </div>
                      {activeTab === 'uv' && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 animate-in slide-in-from-left duration-300">
                          <div className="w-full sm:w-32 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#a64d24]" />
                            <span className="text-sm font-bold text-gray-700">Spot UV</span>
                          </div>
                          <div className="w-full sm:flex-1">
                            <CustomDropdown
                              options={['Single Side', 'Both Side']}
                              value={spotUV}
                              onChange={(e) => setSpotUV(e.target.value)}
                              placeholder="--Select--"
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="w-full sm:w-32 flex items-center gap-2">
                          <Tag className="w-4 h-4 text-[#a64d24]" />
                          <span className="text-sm font-bold text-gray-700">Qty.</span>
                        </div>
                        <div className="w-full sm:flex-1">
                          <CustomDropdown
                            options={QUANTITY_OPTIONS.map(o => ({ value: o, label: `${o} Pcs` }))}
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            placeholder="--Select--"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="w-full sm:w-32 flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-[#a64d24]" />
                          <span className="text-sm font-bold text-gray-700">Die Shape</span>
                        </div>
                        <div className="w-full sm:flex-1">
                          <CustomDropdown
                            options={DIE_SHAPES}
                            value={dieShape}
                            onChange={(e) => setDieShape(e.target.value)}
                            placeholder="--Select--"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="w-full sm:w-32 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#a64d24]" />
                          <span className="text-sm font-bold text-gray-700">Color</span>
                        </div>
                        <div className="w-full sm:flex-1">
                          <CustomDropdown
                            options={activeData.colors}
                            value={threadColor}
                            onChange={(e) => setThreadColor(e.target.value)}
                            placeholder="--Select Color--"
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
                            options={QUANTITY_OPTIONS.map(o => ({ value: o, label: `${o} Pcs` }))}
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            placeholder="--Select Qty--"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Delivery Option */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <label className="block text-sm font-bold text-gray-900 uppercase tracking-tight mb-4">Select Delivery Option</label>
                <div className="flex flex-wrap gap-10">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="delivery" checked={delivery === 'courier'} onChange={() => setDelivery('courier')} className="hidden" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${delivery === 'courier' ? 'border-[#b65e2e] bg-[#fffaf5]' : 'border-gray-300'}`}>
                      {delivery === 'courier' && <div className="w-2.5 h-2.5 rounded-full bg-[#b65e2e]" />}
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
                <label className="block text-sm font-bold text-gray-900 uppercase tracking-tight mb-4">Select File Option</label>
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
                    onClick={() => document.getElementById('unified-file').click()}>
                    <input type="file" id="unified-file" className="hidden" onChange={handleFileChange} />
                    <div className="w-14 h-14 bg-white rounded-full shadow-sm border border-[#e8dfd5] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-7 h-7 text-[#a64d24]" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1">{file ? file.name : 'Upload your Tag Artwork'}</p>
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
                    <span className="font-bold text-gray-500">Applicable Cost</span>
                    <span className="font-bold text-gray-900">₹{pricing.subtotal}/-</span>
                  </div>
                  {pricing.emailFee > 0 && (
                    <div className="flex justify-between items-center text-sm text-[#a64d24]">
                      <span className="font-bold">Manual Handling Fee</span>
                      <span className="font-bold">₹{pricing.emailFee.toFixed(2)}/-</span>
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

            {/* Right Column (Specs & Slider) */}
            <div className="w-full lg:w-[420px] space-y-6">

              {/* Product Preview Slider */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                <div className="relative h-[280px] md:h-[380px] bg-[#fdfaf7] flex items-center justify-center p-4 md:p-8 overflow-hidden">

                  {/* Main Image Slider */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    {currentImages.map((img, idx) => (
                      <div key={img.id}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${idx === activeImageIndex ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                          }`}>
                        <img src={img.url} alt={img.title}
                          className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-lg" />
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

                <div className="p-8 border-l-4 border-[#b65e2e] bg-white">
                  <h3 className="text-base font-bold text-gray-900 uppercase mb-6 tracking-widest">Product Description</h3>
                  {activeTab !== 'threads' ? (
                    <ul className="space-y-4">
                      {[
                        { label: 'Product Ref.', val: 'TAG/1st Edition (Sample File)' },
                        { label: 'Product Code', val: activeData.code },
                        { label: 'Product Class', val: activeData.class },
                        { label: 'Product Core', val: activeData.core },
                        { label: 'Production Time', val: 'Within 7-10 days from file upload' },
                        { label: 'Lamination Type', val: activeData.lamination },
                        { label: 'Available Sizes', val: 'Small, Medium, Large' },
                      ].map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-[11px] leading-tight">
                          <span className="text-[#b65e2e] mt-1">●</span>
                          <span className="font-semibold text-gray-400 w-32 shrink-0">{item.label} :</span>
                          <span className="font-bold text-gray-800">{item.val}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-4">
                      {activeData.products.map(p => (
                        <div key={p.id} className="p-4 bg-[#fffaf5] rounded-xl border border-[#e8dfd5]">
                          <p className="text-sm font-bold text-[#a64d24] mb-1">{p.name}</p>
                          <p className="text-[11px] text-gray-500 font-medium">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab !== 'threads' && (
                    <div className="mt-12 pt-10 border-t border-gray-100">
                      <h3 className="text-base font-bold text-gray-900 uppercase mb-5 tracking-widest">Points to be Noted</h3>
                      <ul className="space-y-6">
                        {activeData.specs.map((spec, idx) => (
                          <li key={idx} className="flex flex-col gap-1 text-[11px]">
                            <span className="font-bold text-[#b65e2e]">{spec.label}:</span>
                            <div className="grid grid-cols-1 gap-0.5 text-gray-600">
                              <span>Tag Design Size : <span className="font-bold text-red-600">{spec.design}</span></span>
                              <span>Text / Matter Area : <span className="font-bold text-red-600">{spec.matter}</span></span>
                              <span>Tag After Cutting : <span className="font-bold text-red-600">{spec.cutting}</span></span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning */}
              <div className="bg-[#fff4f2] border border-[#f5c6cb] rounded-2xl p-6 flex gap-4">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-red-800 uppercase tracking-widest mb-1">Attention Required</h4>
                  <p className="text-[11px] text-red-600 font-bold leading-relaxed">
                    Please ensure your artwork follows the specified dimensions and bleed areas to avoid design cutoff during the die-cutting process.
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
