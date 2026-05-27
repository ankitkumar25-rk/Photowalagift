import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, Heart } from 'lucide-react';
import { useAuthStore, useCartStore } from '../store';

import { brandAssets } from '../data/assets';
import { useWishlist } from '../contexts/WishlistContext';

export default function Navbar() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setScrolled] = useState(false);

  const location = useLocation();

  const user = useAuthStore((s) => s.user);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const logout = useAuthStore((s) => s.logout);
  const itemCount = useCartStore((s) => s.itemCount());

  const { wishlistCount } = useWishlist();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);



  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Shop' },
    { to: '/services', label: 'Services' },
    { to: '/bulk-orders', label: 'Bulk Deals', badge: 'New' },
  ];

  const headerClass = `sticky top-0 z-50 border-b transition-all duration-300 ${
    isScrolled
      ? 'glass-surface border-brand-primary/20 shadow-[0_10px_30px_-20px_rgba(122,50,24,0.5)]'
      : 'bg-cream-100/90 backdrop-blur-lg border-brand-primary/10'
  }`;

  return (
    <header className={headerClass}>

      <div className="relative max-w-screen-2xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between h-20 md:h-24 gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <div className="h-12 md:h-20 flex items-center justify-center">
              <img
                src={brandAssets.logo}
                alt="Photo Wala Gift"
                className="h-10 md:h-16 w-auto object-contain"
              />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((l) => {
              const isActive = l.to === '/' ? location.pathname === '/' : location.pathname.startsWith(l.to);
              return (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={(e) => {
                    if (l.to === '#') e.preventDefault();
                  }}
                  className={`relative px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center ${isActive
                    ? 'bg-brand-primary/10 text-brand-secondary'
                    : 'text-brand-primary hover:bg-brand-surface hover:text-brand-secondary'
                    }`}
                >
                  {l.label}
                  {l.badge && (
                    <span className="absolute -top-1 -right-3 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#d96a22] text-white rounded-md shadow-sm whitespace-nowrap">
                      {l.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">


            {/* Wishlist */}
            {user && (
              <Link to="/wishlist" className="btn-ghost p-2 relative hidden md:flex" aria-label="Wishlist">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="btn-ghost p-2 relative"
              aria-label="Cart"
              id="cart-link-btn"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* User */}
            <div className="hidden md:flex items-center">
              {isHydrating ? (
                <div className="w-8 h-8 bg-brand-primary/10 rounded-full" />
              ) : user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-brand-surface transition-colors">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center text-xs font-bold">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-brand-primary hidden sm:block">{user.name?.split(' ')[0] || 'User'}</span>
                  </button>
                  <div className="absolute right-0 top-12 w-48 bg-cream-50 rounded-2xl shadow-lg border border-brand-primary/20 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link to="/account" className="block px-4 py-2 text-sm text-brand-primary hover:bg-brand-surface font-medium">My Account</Link>
                    {['ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                      <a href="https://photowala-three.vercel.app/admin" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-brand-secondary hover:bg-brand-surface font-bold">Admin Panel</a>
                    )}
                    <Link to="/orders" className="block px-4 py-2 text-sm text-brand-primary hover:bg-brand-surface font-medium">My Orders</Link>
                    <Link to="/account/services" className="block px-4 py-2 text-sm text-brand-primary hover:bg-brand-surface font-medium">My Services</Link>
                    <hr className="my-1 border-brand-primary/20" />
                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">Logout</button>
                  </div>
                </div>
              ) : (
                <Link to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} className="btn-primary py-2 rounded-3xl px-4 text-xs">
                  <User className="w-4 h-4" /> Login
                </Link>
              )}
            </div>

            {/* Mobile menu toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setMenuOpen(!isMenuOpen)}
                className="btn-ghost p-2"
                aria-label="Menu"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-0 left-0 w-full h-screen z-100 bg-cream-50 p-6 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <img src={brandAssets.logo} alt="Logo" className="h-12 w-auto" />
              <button onClick={() => setMenuOpen(false)} className="p-2 bg-cream-200 rounded-full">
                <X className="w-6 h-6 text-brand-primary" />
              </button>
            </div>
            <div className="space-y-4">
              {navLinks.map((l) => {
                const isActive = l.to === '/' ? location.pathname === '/' : location.pathname.startsWith(l.to);
                return (
                  <Link
                    key={l.label}
                    to={l.to}
                    onClick={(e) => {
                      if (l.to === '#') e.preventDefault();
                      else setMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${isActive
                      ? 'bg-brand-primary/10 text-brand-secondary'
                      : 'text-brand-primary hover:bg-brand-surface hover:text-brand-secondary'
                      }`}
                  >
                    {l.label}
                    {l.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#d96a22] text-white rounded-md shadow-sm whitespace-nowrap">
                        {l.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              {!isHydrating && user && (
                <>
                  <Link
                    to="/account"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm font-semibold text-brand-primary rounded-lg hover:bg-brand-surface hover:text-brand-secondary transition-colors"
                  >
                    My Account
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm font-semibold text-brand-primary rounded-lg hover:bg-brand-surface hover:text-brand-secondary transition-colors"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/account/services"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm font-semibold text-brand-primary rounded-lg hover:bg-brand-surface hover:text-brand-secondary transition-colors"
                  >
                    My Services
                  </Link>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm font-semibold text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
              {!isHydrating && !user && (
                <Link
                  to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm font-semibold text-brand-primary rounded-lg hover:bg-brand-surface hover:text-brand-secondary transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
