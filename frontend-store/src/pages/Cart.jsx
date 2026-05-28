import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowRight,
  Tag, Truck, Package, Gift, ChevronRight, RefreshCw,
  Pencil, Image as ImageIcon, CheckCircle
} from 'lucide-react';
import { useCartStore, useAuthStore } from '../store';
import toast from 'react-hot-toast';

import { 
  MdSecurity, MdLocalShipping, MdAssignmentReturn, 
  MdPhotoLibrary, MdBrush, MdPalette 
} from 'react-icons/md';

/* -- Quantity stepper -- */
function QtyControl({ item }) {
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const [loading, setLoading] = useState(false);

  const change = async (newQty) => {
    setLoading(true);
    try {
      if (newQty < 1) await removeItem(item.productId);
      else await updateItem(item.productId, newQty);
    } finally { setLoading(false); }
  };

  return (
    <div className={`flex items-center gap-1 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      <button
        onClick={() => change(item.quantity - 1)}
        className="w-8 h-8 rounded-xl border-2 border-cream-300 flex items-center justify-center hover:border-brand-secondary hover:bg-brand-surface transition-all"
      >
        <Minus className="w-3.5 h-3.5 text-gray-600" />
      </button>
      <span className="w-10 text-center font-bold text-gray-900">{item.quantity}</span>
      <button
        onClick={() => change(item.quantity + 1)}
        className="w-8 h-8 rounded-xl border-2 border-cream-300 flex items-center justify-center hover:border-brand-secondary hover:bg-brand-surface transition-all"
      >
        <Plus className="w-3.5 h-3.5 text-gray-600" />
      </button>
    </div>
  );
}

/* -- Single cart row -- */
function CartItem({ item }) {
  const removeItem = useCartStore((s) => s.removeItem);
  const [removing, setRemoving] = useState(false);

  const img = item.product?.images?.[0];
  const lineTotal = (Number(item.price) * item.quantity).toFixed(2);

  const handleRemove = async () => {
    if (!confirm('Remove this item?')) return;
    setRemoving(true);
    await removeItem(item.productId);
    toast.success('Removed from cart');
  };

  return (
    <div className={`flex gap-3 sm:gap-6 p-4 sm:p-6 transition-all ${removing ? 'opacity-30 scale-95' : ''}`}>
      {/* Image */}
      <Link to={`/products/${item.product?.slug}`} className="shrink-0">
        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-cream-100 border border-cream-200 group-hover:shadow-md transition-all">
           {img ? (
             <img src={img.url} alt={item.product?.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" loading="lazy" />
           ) : (
            <div className="w-full h-full flex items-center justify-center bg-cream-50">
              <Package className="w-8 h-8 text-cream-300" />
            </div>
          )}
        </div>
      </Link>

      {/* Content Area */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4">
          <div className="min-w-0">
            <Link to={`/products/${item.product?.slug}`}>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base hover:text-brand-primary transition-colors leading-snug line-clamp-2">
                {item.product?.name}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              {item.product?.unit && (
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider bg-cream-100 px-1.5 py-0.5 rounded-md">{item.product.unit}</span>
              )}
              <p className="text-xs sm:text-sm font-bold text-brand-primary">
                ₹{Number(item.price).toFixed(2)}
                <span className="text-[10px] font-normal text-gray-400 ml-1 italic">each</span>
              </p>
            </div>
          </div>

          {/* Line total - shown here on desktop, moved for mobile if needed, but flex-row handles it */}
          <div className="sm:text-right shrink-0 mt-1 sm:mt-0">
            <p className="font-bold text-base sm:text-xl text-gray-900 leading-none">₹{lineTotal}</p>
            {item.quantity > 1 && (
              <p className="text-[9px] sm:text-xs text-gray-400 mt-1 font-medium italic">{item.quantity} units</p>
            )}
          </div>
        </div>

        {/* Customization Details */}
        <div className="space-y-1.5 mt-2.5">
          {item.customizationText && (
            <div className="flex items-center gap-2 bg-amber-50/50 border border-amber-100 rounded-lg px-2.5 py-1.5">
              <Pencil className="w-3 h-3 text-amber-600 shrink-0" />
              <p className="text-[10px] font-medium text-amber-900 truncate">
                <span className="font-bold uppercase text-[8px] tracking-widest opacity-60 mr-1">Text:</span>
                {item.customizationText}
              </p>
            </div>
          )}
          {item.customizationImageUrl && (
            <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 rounded-lg px-2.5 py-1.5">
               <ImageIcon className="w-3 h-3 text-blue-600 shrink-0" />
               <a href={item.customizationImageUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                 View Design <ArrowRight className="w-2.5 h-2.5" />
               </a>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4">
          <QtyControl item={item} />
          <button
            onClick={handleRemove}
            disabled={removing}
            className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-red-400 hover:text-red-600 uppercase tracking-widest hover:bg-red-50 px-2 py-1.5 rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}

/* -- Skeleton loader -- */
function CartSkeleton() {
  return (
    <div className="animate-pulse space-y-0">
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-4 p-5 border-b border-cream-200">
          <div className="w-24 h-24 rounded-2xl bg-cream-200 shrink-0" />
          <div className="flex-1 space-y-3 py-1">
            <div className="h-4 bg-cream-200 rounded w-3/4" />
            <div className="h-3 bg-cream-200 rounded w-1/4" />
            <div className="h-8 bg-cream-200 rounded w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Cart() {
  const items     = useCartStore((s) => s.items);
  const isLoading = useCartStore((s) => s.isLoading);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotalFn = useCartStore((s) => s.subtotal);
  const user      = useAuthStore((s) => s.user);

  const subtotal = subtotalFn();
  const shipping = subtotal >= 1000 ? 0 : 49;
  const total    = subtotal + shipping;
  const freeShipRemaining = 1000 - subtotal;
  const freeShipProgress  = Math.min((subtotal / 1000) * 100, 100);

  const handleClear = async () => {
    if (!confirm('Clear all items from cart?')) return;
    await clearCart();
    toast.success('Cart cleared');
  };

  return (
    <div className="min-h-screen bg-cream-100 luxury-grain pt-28 sm:pt-32 pb-20 sm:pb-24 px-3 sm:px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-brand-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-100 h-100 bg-brand-secondary/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-gray-400 text-xs font-semibold uppercase tracking-widest mb-10 animate-in fade-in slide-in-from-left-4 duration-500">
          <Link to="/" className="hover:text-brand-secondary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-brand-primary">Shopping Cart</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-brand-primary leading-tight">
              Your <br />
              <span className="text-brand-secondary">Cart</span>
            </h1>
            <div className="flex items-center gap-4">
              <div className="h-0.5 w-12 bg-brand-secondary" />
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchCart()}
                className="px-6 py-3 rounded-pill border border-cream-200 bg-white text-brand-primary font-semibold text-xs uppercase tracking-wider hover:shadow-md transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button
                onClick={handleClear}
                className="px-6 py-3 rounded-pill bg-red-50 border border-red-100 text-red-600 font-semibold text-xs uppercase tracking-wider hover:shadow-md transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Clear
              </button>
            </div>
          )}
        </div>
        {isLoading ? (
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 card"><CartSkeleton /></div>
            <div className="lg:col-span-2 card h-64 animate-pulse bg-cream-100" />
          </div>
        ) : items.length === 0 ? (
          /* -- Empty state -- */
          <div className="card p-16 md:p-24 text-center relative overflow-hidden group max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-linear-to-b from-brand-surface/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-brand-surface rounded-3xl flex items-center justify-center mx-auto mb-8 text-brand-secondary border border-cream-200 shadow-sm">
                <ShoppingCart className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-brand-primary mb-3">Your Cart is Empty</h3>
              <p className="text-gray-500 text-sm mb-10 font-medium leading-relaxed">Discover our range of premium gifts, trophies, and mementos and start building your perfect order.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <Link to="/products" className="inline-flex items-center gap-2 px-10 py-4 rounded-pill bg-brand-primary text-white font-bold text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-brand-primary/20 transition-all">
                  <Gift className="w-4 h-4" /> Continue Shopping
                </Link>
                {user && (
                  <Link to="/orders" className="inline-flex items-center gap-2 px-10 py-4 rounded-pill border-2 border-brand-primary text-brand-primary font-bold text-xs uppercase tracking-widest hover:bg-brand-surface transition-all">
                    <Package className="w-4 h-4" /> My Orders
                  </Link>
                )}
              </div>

              {/* Quick categories */}
              <div className="pt-8 border-t border-cream-200">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Browse Categories</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    ['Trophies', '/categories/trophies'],
                    ['Corporate Gifts', '/categories/corporate-gifts'],
                    ['Momentos', '/categories/momentos'],
                    ['Personalized Gifts', '/products'],
                  ].map(([label, to]) => (
                    <Link key={to} to={to} className="px-3 py-1.5 bg-brand-surface text-brand-primary text-sm font-semibold rounded-xl hover:bg-brand-surface transition-colors">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* -- Cart items -- */}
            <div className="lg:col-span-3 card overflow-hidden border-2 border-cream-200 shadow-lg rounded-3xl">
              {/* Free shipping progress bar */}
              {shipping > 0 && (
                <div className="px-6 py-4 bg-linear-to-r from-brand-surface/40 to-transparent border-b-2 border-brand-secondary/20">
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-2.5 gap-2">
                    <span className="font-bold text-brand-primary flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <Truck className="w-4 h-4 shrink-0" /> <span className="truncate">Add ₹{freeShipRemaining.toFixed(0)} more for FREE Shipping</span>
                    </span>
                    <span className="text-brand-secondary font-bold text-xs bg-brand-surface px-2 sm:px-2.5 py-1 rounded-full shrink-0">{freeShipProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 bg-cream-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-brand-secondary rounded-full transition-all duration-500"
                      style={{ width: `${freeShipProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {shipping === 0 && (
                <div className="px-6 py-4 bg-linear-to-r from-green-50 to-transparent border-b-2 border-green-100 flex items-center gap-2 text-sm font-bold text-green-700">
                  <CheckCircle className="w-5 h-5" /> You've unlocked FREE shipping!
                </div>
              )}

              {/* Items list */}
              <div className="divide-y divide-cream-200">
                {items.map((item) => (
                  <CartItem key={item.id ?? item.productId} item={item} />
                ))}
              </div>

              {/* Continue shopping */}
              <div className="p-6 border-t-2 border-cream-200 bg-linear-to-r from-cream-50 to-transparent">
                <Link to="/products" className="inline-flex items-center gap-2.5 text-sm font-bold text-brand-primary hover:text-brand-secondary transition-colors group">
                  <Gift className="w-5 h-5 group-hover:scale-110 transition-transform" /> Continue Shopping
                </Link>
              </div>
            </div>

            {/* -- Order summary -- */}
            <div className="lg:col-span-2 space-y-4 sticky top-24">
              <div className="card p-4 sm:p-6 md:p-8 border-2 border-cream-200 shadow-lg rounded-3xl bg-white">
                <div className="flex items-center gap-3 pb-6 border-b-2 border-cream-200 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-brand-surface flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-5 h-5 text-brand-primary" />
                  </div>
                  <h2 className="font-bold text-lg sm:text-xl text-gray-900 truncate">Order Summary</h2>
                  <span className="badge-featured ml-auto">{items.length}</span>
                </div>

                <div className="space-y-4">
                  {/* Per-item breakdown */}
                  <div className="space-y-3 pb-4 border-b-2 border-cream-200 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((item) => (
                      <div key={item.id ?? item.productId} className="flex justify-between text-xs sm:text-sm gap-2 sm:gap-4">
                        <span className="text-gray-600 truncate flex-1">
                          {item.product?.name} <span className="text-[10px] font-bold text-gray-400">×{item.quantity}</span>
                        </span>
                        <span className="font-semibold text-gray-900 shrink-0">
                          ₹{(Number(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600 font-medium">Subtotal</span>
                    <span className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600 flex items-center gap-2 font-medium">
                      <Truck className="w-3.5 h-3.5" /> Shipping
                    </span>
                    {shipping === 0 ? (
                      <span className="font-bold text-green-600 flex items-center gap-1.5">
                        <Tag className="w-3 h-3" /> FREE
                      </span>
                    ) : (
                      <span className="font-bold text-gray-900">₹{shipping.toFixed(2)}</span>
                    )}
                  </div>

                  <div className="flex justify-between text-base sm:text-lg font-bold pt-4 border-t-2 border-cream-200 mt-2">
                    <span className="text-gray-900">Total</span>
                    <span className="text-brand-primary">₹{total.toFixed(2)}</span>
                  </div>
                </div>



                {/* CTA */}
                <Link to="/checkout" className="btn-primary w-full justify-center mt-6 text-sm sm:text-base py-3.5 sm:py-4 gap-2 rounded-2xl shadow-md hover:shadow-lg transition-all">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                </Link>
                {!user && (
                  <p className="text-center text-xs text-gray-500 font-medium mt-3 animate-pulse">
                    Have an account?{' '}
                    <Link to="/login?redirect=/checkout" className="text-brand-primary font-bold hover:text-brand-secondary transition-colors">
                      Login for faster checkout
                    </Link>
                  </p>
                )}
              </div>

              {/* Trust row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <MdSecurity className="w-5 h-5 text-brand-primary" />, label: 'Secure\nPayment' },
                  { icon: <MdLocalShipping className="w-5 h-5 text-brand-primary" />, label: 'Fast\nDelivery' },
                  { icon: <MdAssignmentReturn className="w-5 h-5 text-brand-primary" />, label: 'Easy\nReturns' },
                ].map(({ icon, label }) => (
                  <div key={label} className="card p-4 flex flex-col items-center gap-2 text-center border-2 border-cream-200 rounded-2xl hover:border-brand-secondary transition-all">
                    <div className="bg-white p-2 rounded-lg shadow-sm">{icon}</div>
                    <p className="text-[9px] font-bold text-gray-600 leading-tight whitespace-pre-line uppercase tracking-wider">{label}</p>
                  </div>
                ))}
              </div>

              {/* Recently continue browsing */}
              <div className="card p-6 border-2 border-cream-200 rounded-2xl">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Continue Exploring</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: <MdPhotoLibrary className="w-3.5 h-3.5" />, label: 'Canvas Prints', to: '/products' },
                    { icon: <MdBrush className="w-3.5 h-3.5" />, label: 'Custom Gifts', to: '/products' },
                    { icon: <MdPalette className="w-3.5 h-3.5" />, label: 'Design Service', to: '/products' },
                  ].map(({ icon, label, to }) => (
                    <Link key={label} to={to} className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-brand-surface text-brand-primary rounded-lg hover:bg-brand-surface transition-colors">
                      {icon} {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}