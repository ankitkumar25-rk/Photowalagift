import { useState, useEffect, useCallback, useRef } from 'react';
import ZoomableImage from '../components/ZoomableImage';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, Heart, Share2, Star,
  ChevronRight, ChevronLeft, Plus,
  Minus, Check, Award, Package, AlertCircle, ZoomIn,
  MessageSquare, Pencil, ImagePlus, X
} from 'lucide-react';
import { 
  MdSecurity, MdLocalShipping, MdAssignmentReturn 
} from 'react-icons/md';
import toast from 'react-hot-toast';
import { productsApi, usersApi, uploadApi } from '../api';
import { useCartStore, useAuthStore } from '../store';
import { useWishlist } from '../contexts/WishlistContext';
import ProductCard from '../components/ProductCard';

/* ------ helpers ------ */
function StarRating({ rating, size = 'sm', interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${sz} transition-colors ${
            n <= (interactive ? hovered || rating : rating)
              ? 'text-brand-secondary fill-amber-400'
              : 'text-gray-200 fill-gray-200'
          } ${interactive ? 'cursor-pointer' : ''}`}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange?.(n)}
        />
      ))}
    </div>
  );
}

function avgRating(reviews) {
  if (!reviews?.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

/* ------ Image Gallery ------ */
function ImageGallery({ images, name }) {
  const [active, setActive] = useState(0);

  if (!images?.length) {
    return (
      <div className="aspect-square rounded-3xl bg-brand-surface flex items-center justify-center text-8xl border border-cream-300">
        <Package className="w-20 h-20 text-cream-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main image with zoom */}
      <ZoomableImage 
        src={images[active]?.url} 
        alt={images[active]?.altText || name} 
        className="aspect-square rounded-3xl overflow-hidden bg-cream-100 border border-cream-200 group shadow-lg"
      />

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {images.slice(0, 3).map((img, i) => (
            <button
              key={img.id || i}
              onClick={() => setActive(i)}
              className={`shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                i === active 
                  ? 'border-brand-primary shadow-lg scale-105' 
                  : 'border-cream-200 hover:border-brand-primary hover:scale-105'
              }`}
            >
               <img 
                 src={img.url} 
                 alt={img.altText || name} 
                 className="w-full h-full object-cover" 
                 loading="lazy" 
               />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------ Review Card ------ */
function ReviewCard({ review }) {
  const date = new Date(review.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="p-5 rounded-2xl bg-white border border-cream-200 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
           {review.user?.avatarUrl ? (
             <img src={review.user.avatarUrl} alt={review.user.name} className="w-9 h-9 rounded-full object-cover" loading="lazy" width={36} height={36} />
           ) : (
            <div className="w-9 h-9 rounded-full bg-brand-surface text-brand-primary flex items-center justify-center text-sm font-bold shrink-0">
              {review.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 text-sm">{review.user?.name || 'Anonymous'}</p>
            <p className="text-xs text-gray-400">{date}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StarRating rating={review.rating} />
          {review.isVerified && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600">
              <Check className="w-3 h-3" /> Verified Purchase
            </span>
          )}
        </div>
      </div>
      {review.title && (
        <p className="font-semibold text-gray-800 text-sm">"{review.title}"</p>
      )}
      {review.body && (
        <p className="text-gray-600 text-sm leading-relaxed">{review.body}</p>
      )}
    </div>
  );
}

/* ------ Write Review Form ------ */
function ReviewForm({ productId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      await usersApi.addReview({ productId, rating, title, body });
      toast.success('Review submitted!');
      setRating(0); setTitle(''); setBody('');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={submit} className="p-5 rounded-2xl bg-brand-surface border border-brand-secondary space-y-4">
      <h4 className="font-bold text-gray-900 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-brand-primary" /> Write a Review
      </h4>
      <div>
        <p className="text-xs text-gray-500 mb-2 font-medium">Your Rating *</p>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>
      <div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field"
          placeholder="Review title (optional)"
        />
      </div>
      <div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="input-field resize-none"
          placeholder="Share your experience with this product..."
        />
      </div>
      <button type="submit" disabled={submitting || !rating} className="btn-primary w-full justify-center">
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}

/* ------ Removed Nutrition Table ------ */

/* -------- MAIN PAGE -------- */
export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addItem  = useCartStore((s) => s.addItem);
  const user     = useAuthStore((s) => s.user);
  const location = useLocation();
  const { isWishlisted, toggleWishlist: triggerWishlist, isPending: isWishlistPending } = useWishlist();

  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [related, setRelated]   = useState([]);
  const [qty, setQty]           = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [reviewsShown, setReviewsShown] = useState(4);

  // Customization state
  const [customizeEnabled, setCustomizeEnabled] = useState(false);
  const [customizeMode, setCustomizeMode]       = useState('text'); // 'text' | 'image'
  const [customizationText, setCustomizationText] = useState('');
  const [customizationImage, setCustomizationImage] = useState(null);   // { url, publicId }
  const [uploadingImage, setUploadingImage]     = useState(false);
  const fileInputRef = useRef(null);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await productsApi.getBySlug(slug);
      setProduct(data.data);
      // Fetch related products from same category
      if (data.data.category?.slug) {
        productsApi.list({ category: data.data.category.slug, limit: 4 })
          .then((r) => setRelated(r.data.data?.filter((p) => p.id !== data.data.id).slice(0, 4) || []))
          .catch((err) => {
            console.error('Failed to load related products:', err);
            setRelated([]);
          });
      }
    } catch {
      toast.error('Product not found');
      navigate('/products');
    } finally { setLoading(false); }
   }, [slug, navigate]);

  useEffect(() => { fetchProduct(); setQty(1); }, [fetchProduct]);

  const handleAddToCart = async () => {
    // Validate customization if enabled
    if (customizeEnabled) {
      if (customizeMode === 'text' && !customizationText.trim()) {
        toast.error('Please enter your brand/name for customization');
        return;
      }
      if (customizeMode === 'image' && !customizationImage) {
        toast.error('Please upload an image for customization');
        return;
      }
    }
    setAddingToCart(true);
    try {
      const customization = customizeEnabled
        ? (customizeMode === 'text'
            ? { customizationText: customizationText.trim() }
            : { customizationImageUrl: customizationImage.url })
        : {};
      await addItem(product.id, qty, customization);
      toast.success(
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span><b>{product.name}</b> added to cart!</span>
        </div>,
        { duration: 3000 }
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add to cart');
    } finally { setAddingToCart(false); }
  };

  const inWishlist = product ? isWishlisted(product.id) : false;

  const toggleWishlist = async () => {
    if (!user) {
      toast.error('Please login to use wishlist');
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    try {
      if (inWishlist) {
        await triggerWishlist({ productId: product.id, isWishlisted: true });
        toast.success('Removed from wishlist');
      } else {
        await triggerWishlist({ productId: product.id, isWishlisted: false });
        toast.success('Added to wishlist!');
      }
    } catch { toast.error('Failed to update wishlist'); }
  };

  const shareProduct = async () => {
    try {
      await navigator.share({ title: product.name, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploadingImage(true);
    try {
      const { data } = await uploadApi.uploadCustomization(file);
      setCustomizationImage({ url: data.data.url, publicId: data.data.publicId });
      toast.success('Image uploaded successfully');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeCustomizationImage = async () => {
    if (customizationImage?.publicId) {
      uploadApi.deleteImage(customizationImage.publicId).catch(() => {});
    }
    setCustomizationImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* --- Loading skeleton --- */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-4 w-48 bg-cream-200 rounded mb-8" />
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="aspect-square rounded-3xl bg-cream-200" />
          <div className="space-y-4">
            <div className="h-3 w-24 bg-cream-200 rounded" />
            <div className="h-8 w-3/4 bg-cream-200 rounded" />
            <div className="h-4 w-1/3 bg-cream-200 rounded" />
            <div className="h-6 w-1/4 bg-cream-200 rounded" />
            <div className="h-24 bg-cream-200 rounded" />
            <div className="h-12 bg-cream-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const discountPct = product.mrp
    ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
    : 0;
  const avg = avgRating(product.reviews);
  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= (product.lowStockAlert || 10);

  const TABS = [
    { id: 'description', label: 'Description' },
    { id: 'reviews',     label: `Reviews (${product._count?.reviews || 0})` },
  ];

  return (
    <div className="min-h-screen bg-cream-100 page-enter">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link to="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/products" className="hover:text-brand-primary transition-colors">Products</Link>
            {product.category && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link to={`/categories/${product.category.slug}`} className="hover:text-brand-primary transition-colors">
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium truncate max-w-40">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* -- Main product section -- */}
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16">
          {/* Images */}
          <div className="lg:sticky lg:top-24 h-fit">
            <ImageGallery images={product.images} name={product.name} />
          </div>

          {/* Product info */}
          <div className="space-y-6">
            {/* Category + badges */}
            <div className="flex items-center flex-wrap gap-2">
              {product.category && (
                <Link
                  to={`/categories/${product.category.slug}`}
                  className="text-xs font-bold text-brand-primary uppercase tracking-widest hover:text-brand-primary transition-colors"
                >
                  {product.category.name}
                </Link>
              )}
              {product.isFeatured && (
                <span className="badge-featured">
                  <Star className="w-3 h-3" /> Certified Premium
                </span>
              )}
              {product.isFeatured && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-brand-secondary text-white">
                  Featured
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating summary */}
            {product._count?.reviews > 0 && (
              <div className="flex items-center gap-3">
                <StarRating rating={Math.round(avg)} />
                <span className="font-bold text-gray-900">{avg.toFixed(1)}</span>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-sm text-brand-primary hover:underline"
                >
                  {product._count.reviews} review{product._count.reviews !== 1 ? 's' : ''}
                </button>
              </div>
            )}

            {/* Short desc */}
            {product.shortDesc && (
              <p className="text-gray-600 text-base leading-relaxed">{product.shortDesc}</p>
            )}

            {/* Price */}
            <div className="flex items-end gap-3">
              <span className="text-4xl font-extrabold text-brand-primary">₹{Number(product.price).toFixed(2)}</span>
              <span className="text-gray-400 mb-1 text-sm">/ {product.unit}</span>
              {discountPct > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl text-gray-400 line-through">₹{Number(product.mrp).toFixed(2)}</span>
                  <span className="px-2 py-0.5 bg-brand-secondary text-white text-sm font-extrabold rounded-lg">
                    {discountPct}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Stock */}
            <div>
              {!inStock ? (
                <div className="flex items-center gap-2 text-red-600 font-semibold">
                  <AlertCircle className="w-4 h-4" /> Out of Stock
                </div>
              ) : lowStock ? (
                <div className="flex items-center gap-2 text-brand-secondary font-semibold text-sm">
                  <Package className="w-4 h-4" /> Only {product.stock} left — hurry!
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                  <Check className="w-4 h-4" /> In Stock ({product.stock} available)
                </div>
              )}
            </div>

            {/* Customization Section */}
            {inStock && (
              <div className="rounded-2xl border-2 border-dashed border-brand-primary/30 bg-brand-surface/40 p-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => setCustomizeEnabled((v) => !v)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${customizeEnabled ? 'bg-brand-primary' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${customizeEnabled ? 'left-5' : 'left-1'}`} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Add Customization / Personalization</p>
                    <p className="text-xs text-gray-500">Add your brand, school, institute name or logo</p>
                  </div>
                </label>

                {customizeEnabled && (
                  <div className="space-y-3 pt-1">
                    {/* Mode toggle */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCustomizeMode('text')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${customizeMode === 'text' ? 'border-brand-primary bg-brand-primary text-white' : 'border-cream-300 text-gray-600 hover:border-brand-primary'}`}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Enter Text
                      </button>
                      <button
                        onClick={() => setCustomizeMode('image')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${customizeMode === 'image' ? 'border-brand-primary bg-brand-primary text-white' : 'border-cream-300 text-gray-600 hover:border-brand-primary'}`}
                      >
                        <ImagePlus className="w-3.5 h-3.5" /> Upload Image
                      </button>
                    </div>

                    {/* Text input */}
                    {customizeMode === 'text' && (
                      <div>
                        <input
                          type="text"
                          value={customizationText}
                          onChange={(e) => setCustomizationText(e.target.value)}
                          className="input-field text-sm"
                          placeholder="Enter brand/school/institute name to print..."
                          maxLength={120}
                        />
                        <p className="text-[11px] text-gray-400 mt-1">{customizationText.length}/120 characters</p>
                      </div>
                    )}

                    {/* Image upload */}
                    {customizeMode === 'image' && (
                      <div>
                        {customizationImage ? (
                           <div className="relative inline-block">
                             <img src={customizationImage.url} alt="Customization" className="w-24 h-24 object-cover rounded-xl border-2 border-brand-primary" loading="lazy" width={96} height={96} />
                             <button
                              onClick={removeCustomizationImage}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-brand-primary/40 rounded-xl text-sm font-semibold text-brand-primary hover:bg-brand-surface transition-colors w-full justify-center"
                          >
                            {uploadingImage ? (
                              <><div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" /> Uploading...</>
                            ) : (
                              <><ImagePlus className="w-4 h-4" /> Click to upload logo / image</>
                            )}
                          </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <p className="text-[11px] text-gray-400 mt-1">PNG, JPG, SVG — max 5MB</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Qty + add to cart */}
            {inStock && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border-2 border-cream-300 rounded-2xl px-3 py-2">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-xl hover:bg-cream-200 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-10 text-center font-bold text-gray-900 text-lg">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                      className="w-8 h-8 rounded-xl hover:bg-cream-200 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Total: <span className="font-bold text-brand-primary text-base">₹{(Number(product.price) * qty).toFixed(2)}</span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="btn-primary flex-1 justify-center py-3.5 text-base gap-2"
                    id={`add-to-cart-${product.id}`}
                  >
                    {addingToCart ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding...
                      </span>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" /> Add to Cart
                      </>
                    )}
                  </button>

                  <button
                    onClick={toggleWishlist}
                    disabled={isWishlistPending}
                    className={`w-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
                      inWishlist
                        ? 'border-red-400 bg-red-50 text-red-500 hover:bg-red-100'
                        : 'border-cream-300 hover:border-red-300 text-gray-400 hover:text-red-400 hover:bg-red-50'
                    }`}
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-5 h-5 ${inWishlist ? 'fill-red-400 text-red-400' : ''}`} />
                  </button>

                  <button
                    onClick={shareProduct}
                    className="w-14 rounded-2xl border-2 border-cream-300 flex items-center justify-center text-gray-400 hover:text-brand-primary hover:border-brand-secondary hover:bg-brand-surface transition-all"
                    aria-label="Share"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Go to cart link */}
            <div>
              <Link to="/cart" className="text-sm font-semibold text-brand-primary hover:text-brand-primary transition-colors flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4" /> View Cart
              </Link>
            </div>
            
            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-cream-200">
              {[
                { icon: <MdSecurity className="w-5 h-5 text-brand-primary" />, label: 'Secure Payment', sub: 'SSL encrypted' },
                { icon: <MdLocalShipping className="w-5 h-5 text-brand-primary" />, label: 'Fast Delivery',  sub: 'Free above ₹999' },
                { icon: <MdAssignmentReturn className="w-5 h-5 text-brand-primary" />, label: 'Easy Returns', sub: '7-day policy' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1 p-3 bg-cream-50 rounded-2xl">
                  <div className="bg-white p-2 rounded-xl shadow-sm mb-1">{icon}</div>
                  <p className="text-[10px] font-bold text-gray-800 leading-tight">{label}</p>
                  <p className="text-[9px] text-gray-400">{sub}</p>
                </div>
              ))}
            </div>

            {/* Tags + certifications */}
            {(product.tags?.length > 0 || product.certifications?.length > 0) && (
              <div className="space-y-3 pt-2">
                {product.tags?.length > 0 && (
                  <div className="bg-[#fdfbf7] border border-[#f3ebdf] p-6 rounded-2xl flex flex-wrap gap-2">
                    {product.tags.map((t) => (
                      <span key={t} className="px-2.5 py-1 bg-cream-200/60 hover:bg-cream-200 text-gray-600 text-xs font-semibold rounded-full transition-colors">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                {product.certifications?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {product.certifications.map((c) => (
                      <span key={c} className="flex items-center gap-1 px-2.5 py-1 bg-brand-surface text-brand-secondary text-xs font-bold rounded-full border border-brand-secondary">
                        <Award className="w-3 h-3" /> {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* -- Tabs -- */}
        <div className="card overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-cream-200 bg-cream-50 overflow-x-auto">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === id
                    ? 'border-brand-primary text-brand-primary bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-cream-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-6 xl:p-8">
            {/* Description */}
            {activeTab === 'description' && (
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-4">
                {product.description ? (
                  <p className="text-base">{product.description}</p>
                ) : (
                  <p className="text-gray-400 italic">No description available.</p>
                )}

                {/* SKU / weight */}
                <div className="grid sm:grid-cols-2 gap-4 not-prose pt-4 border-t border-cream-200">
                  {[
                    { label: 'Size',     value: product.unit || '—' },
                    { label: 'Weight',   value: product.weight ? `${product.weight}g` : '—' },
                    { label: 'Category', value: product.category?.name || '—' },
                    { label: 'SKU',      value: product.sku || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2 border-b border-cream-100 text-sm">
                      <span className="text-gray-500 font-medium">{label}</span>
                      <span className="font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {/* Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Rating summary */}
                {product.reviews?.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 p-5 bg-brand-surface rounded-2xl">
                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                      <p className="text-5xl font-extrabold text-brand-primary">{avg.toFixed(1)}</p>
                      <StarRating rating={Math.round(avg)} size="sm" />
                      <p className="text-xs text-gray-500 mt-1">{product._count?.reviews} reviews</p>
                    </div>
                    {/* Rating breakdown */}
                    <div className="flex-1 w-full space-y-1.5">
                      {[5, 4, 3, 2, 1].map((n) => {
                        const count = product.reviews.filter((r) => r.rating === n).length;
                        const pct = product.reviews.length ? (count / product.reviews.length) * 100 : 0;
                        return (
                          <div key={n} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-gray-600 font-medium">{n}</span>
                            <Star className="w-3 h-3 text-brand-secondary fill-amber-400 shrink-0" />
                            <div className="flex-1 h-1.5 bg-cream-200 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-secondary rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-6 text-gray-400 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Write review */}
                {user ? (
                  <ReviewForm productId={product.id} onSuccess={fetchProduct} />
                ) : (
                  <div className="p-4 bg-cream-100 rounded-2xl text-center text-sm text-gray-500">
                    <Link to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} className="text-brand-primary font-semibold hover:underline">Login</Link> to write a review
                  </div>
                )}

                {/* Review list */}
                {product.reviews?.length === 0 ? (
                  <div className="text-center py-10">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="font-semibold text-gray-600">No reviews yet</p>
                    <p className="text-sm text-gray-400">Be the first to review this product!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {product.reviews.slice(0, reviewsShown).map((r) => (
                      <ReviewCard key={r.id} review={r} />
                    ))}
                    {reviewsShown < product.reviews.length && (
                      <button
                        onClick={() => setReviewsShown((n) => n + 4)}
                        className="w-full py-3 text-sm font-semibold text-brand-primary hover:text-brand-primary border border-cream-200 rounded-xl hover:bg-brand-surface transition-all"
                      >
                        Show more reviews ({product.reviews.length - reviewsShown} remaining)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* -- Related products -- */}
        {related.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-gray-900">
                You Might Also Like
              </h2>
              <Link to={`/categories/${product.category?.slug}`} className="text-sm font-semibold text-brand-primary hover:text-brand-primary transition-colors">
                View all ?
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

