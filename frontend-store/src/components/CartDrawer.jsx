import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store';
import { useEffect } from 'react';

export default function CartDrawer() {
  const { isOpen, closeCart, items, updateItem, removeItem, subtotal } = useCartStore();

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeCart]);

  const shipping = 0; // Free shipping on all orders!
  const total = subtotal() + shipping;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#5a3f2f]/35 z-40 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-[#faf4ed] z-50 shadow-2xl
                       flex flex-col transition-transform duration-300 ease-out
                       ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f0e3d7] bg-[#f5e7d8]/75">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#5b3f2f]" />
            <h2 className="font-bold text-lg text-[#5b3f2f]">Your Cart</h2>
            <span className="ml-1 px-2 py-0.5 bg-[#f0e3d7] text-[#5b3f2f] text-xs font-bold rounded-pill">
              {items.length} items
            </span>
          </div>
          <button onClick={closeCart} className="btn-ghost p-2" aria-label="Close cart">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
              <div className="text-6xl">🛒</div>
              <h3 className="font-bold text-xl text-[#5b3f2f]">Your cart is empty</h3>
              <p className="text-[#a68971] text-sm">Add some personalized magic!</p>
              <Link to="/products" onClick={closeCart} className="btn-primary">
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#f0e3d7]">
              {items.map((item) => {
                const img = item.product?.images?.[0];
                return (
                  <div key={item.id} className="flex gap-3 p-4 hover:bg-[#f5e7d8]/55 transition-colors">
                    {/* Product image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#f0e3d7] shrink-0">
                      {img ? (
                        <img src={img.url} alt={item.product?.name} className="w-full h-full object-cover" loading="lazy" width={64} height={64} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🏆</div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#5b3f2f] line-clamp-1">{item.product?.name}</p>
                      <p className="text-[#5b3f2f] font-bold text-sm">₹{Number(item.price).toFixed(0)}/{item.product?.unit}</p>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => item.quantity > 1 ? updateItem(item.productId, item.quantity - 1) : removeItem(item.productId)}
                          className="w-7 h-7 rounded-lg border border-cream-300 flex items-center justify-center hover:bg-brand-surface transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateItem(item.productId, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg border border-cream-300 flex items-center justify-center hover:bg-brand-surface transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => removeItem(item.productId)}
                          className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-sm font-bold text-brand-primary shrink-0">
                      ₹{(Number(item.price) * item.quantity).toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-cream-300 p-5 space-y-3 bg-[#fff5ee]">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-[#7a655c]">
                <span>Subtotal</span>
                <span className="font-semibold">₹{subtotal().toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#7a655c]">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-brand-primary font-semibold' : ''}>
                  {shipping === 0 ? 'FREE 🎉' : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-cream-300 pt-2 mt-2">
                <span>Total</span>
                <span className="text-brand-primary">₹{total.toFixed(0)}</span>
              </div>
            </div>



            <Link
              to="/checkout"
              onClick={closeCart}
              className="btn-primary w-full justify-center text-base"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/cart" onClick={closeCart} className="block text-center text-sm text-[#7a655c] hover:text-brand-primary transition-colors">
              View Full Cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
