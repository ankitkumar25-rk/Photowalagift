import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useCartStore, useAuthStore } from '../store';
import { useWishlist } from '../contexts/WishlistContext';
import toast from 'react-hot-toast';
import { useCallback, memo } from 'react';
import { brandAssets } from '../data/assets';

const ProductCard = memo(function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();

  const { isWishlisted: checkWishlisted, toggleWishlist, isPending } = useWishlist();
  const productWishlisted = checkWishlisted(product.id);

  const handleWishlistClick = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
        return;
      }
      try {
        await toggleWishlist({ productId: product.id, isWishlisted: productWishlisted });
        toast.success(productWishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️');
      } catch {
        toast.error('Failed to update wishlist');
      }
    },
    [toggleWishlist, product.id, productWishlisted, user, navigate, location]
  );

  const discountPct = product.mrp
    ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
    : 0;

  const primaryImage = product.images?.find((i) => i.isPrimary) || product.images?.[0];

  const handleAddToCart = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await addItem(product.id, 1);
        toast.success(`${product.name} added to cart!`, {
          action: { label: 'View Cart', onClick: () => navigate('/cart') },
        });
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to add to cart');
      }
    },
    [addItem, product.id, product.name, navigate]
  );

  return (
    <Link to={`/products/${product.slug}`} className="product-card group block">
      {/* Image */}
      <div className="relative overflow-hidden bg-[#f5e7d8] aspect-square">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            width={300}
            height={300}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#f0e3d7] p-12">
            <img src={brandAssets.logo} alt="Photowala" className="w-full h-full object-contain opacity-20 grayscale" />
          </div>
        )}

        {/* Badges and Actions */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <button
            onClick={handleWishlistClick}
            disabled={isPending}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
              productWishlisted
                ? 'bg-red-50 text-red-500 shadow-sm'
                : 'bg-white/70 text-gray-500 hover:bg-white hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${productWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isFeatured && (
            <span className="badge-featured">
              <Star className="w-3 h-3" /> Premium
            </span>
          )}
          {discountPct > 0 && (
            <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-pill bg-[#d96a22] text-white shadow-[0_6px_18px_-8px_rgba(217,106,34,0.75)]">
              {discountPct}% OFF
            </span>
          )}
        </div>

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-[#faf4ed] text-[#5b3f2f] text-sm font-bold px-4 py-2 rounded-lg">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {product.category && (
          <p className="text-xs text-[#b88a2f] font-semibold uppercase tracking-wider mb-1">
            {product.category.name}
          </p>
        )}
        <h3 className="font-semibold text-[#5b3f2f] line-clamp-2 leading-snug mb-2 group-hover:text-[#b88a2f] transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product._count?.reviews > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3.5 h-3.5 text-[#b88a2f] fill-amber-400" />
            <span className="text-xs text-[#a68971]">({product._count.reviews} reviews)</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-end justify-between mt-auto">
          <div>
            <span className="text-xl font-bold text-[#5b3f2f]">₹{Number(product.price).toFixed(0)}</span>
            <span className="text-xs text-[#a68971] ml-1">/{product.unit}</span>
            {discountPct > 0 && (
              <span className="block text-xs text-[#b59885] line-through">₹{Number(product.mrp).toFixed(0)}</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#b88a2f] text-white text-sm font-semibold
                       transition-all duration-200 hover:bg-[#5b3f2f] hover:shadow-[0_10px_24px_-10px_rgba(91,63,47,0.8)]
                       disabled:opacity-40 disabled:cursor-not-allowed"
            id={`add-to-cart-${product.id}`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:block">Add</span>
          </button>
        </div>
      </div>
    </Link>
  );
});

export default ProductCard;
