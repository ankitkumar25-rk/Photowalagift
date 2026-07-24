import { useState, useCallback, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X, ChevronRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { productsApi, categoriesApi } from '../api';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { getSessionShuffleSeed, seededShuffle } from '../utils/shuffle';

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'price-asc',      label: 'Price: Low to High' },
  { value: 'price-desc',     label: 'Price: High to Low' },
  { value: 'name-asc',       label: 'Name A-Z' },
];

const PAGE_SIZE = 20;

export default function Products() {
  const [filters, setFilters] = useState({ page: 1 });
  const [sortValue, setSortValue] = useState('createdAt-desc');
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Retrieve or initialize session seed once per session
  const sessionSeed = useMemo(() => getSessionShuffleSeed(), []);

  const setFilter = useCallback((key, value) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }, []);

  const clearFilter = useCallback((key) => {
    setFilters((f) => {
      const n = { ...f };
      delete n[key];
      return { ...n, page: 1 };
    });
  }, []);

  const handleSearchChange = (val) => {
    setSearchInput(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      if (val.trim()) {
        setFilter('search', val.trim());
      } else {
        clearFilter('search');
      }
    }, 450);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    clearFilter('search');
  };

  const [sort, order] = sortValue.split('-');

  // Default view is when default sort is selected and no search, category, or price filters are active
  const isDefaultSort = sortValue === 'createdAt-desc';
  const isDefaultView = isDefaultSort && !filters.search && !filters.category && !filters.minPrice && !filters.maxPrice && !filters.isFeatured;

  // In default view, fetch full catalog to allow session-seeded shuffling across all pages
  const queryParams = useMemo(() => {
    if (isDefaultView) {
      return { ...filters, page: 1, limit: 200 };
    }
    return { ...filters, limit: PAGE_SIZE, sort, order };
  }, [filters, isDefaultView, sort, order]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', queryParams, sort, order, isDefaultView],
    queryFn: () => productsApi.list(queryParams).then((r) => r.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoriesApi.list().then((r) => r.data.data),
    staleTime: 1000 * 60 * 30, // 30 minutes - categories change rarely
  });

  const { displayProducts, totalPages, totalCount } = useMemo(() => {
    const rawList = data?.data || [];
    if (isDefaultView) {
      const shuffled = seededShuffle(rawList, sessionSeed);
      const total = shuffled.length;
      const pages = Math.ceil(total / PAGE_SIZE);
      const currentPage = filters.page || 1;
      const startIdx = (currentPage - 1) * PAGE_SIZE;
      const paged = shuffled.slice(startIdx, startIdx + PAGE_SIZE);
      return { displayProducts: paged, totalPages: pages, totalCount: total };
    }
    return {
      displayProducts: rawList,
      totalPages: data?.meta?.totalPages || 1,
      totalCount: data?.meta?.total || rawList.length,
    };
  }, [data, isDefaultView, sessionSeed, filters.page]);

  const pageNumbers = totalPages > 1
    ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : [];

  const shopSchema = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    "name": "Shop Personalised Gifts & Custom Trophies",
    "description": "Explore Photowala Gift's catalog of premium personalized trophies, corporate awards, photo mugs, custom plaques, and engraved keepsakes. Secure checkouts and pan-India shipping.",
    "url": window.location.href
  };

  return (
    <div className="min-h-screen bg-cream-100 pt-24 md:pt-32 pb-24 px-4 luxury-grain relative overflow-hidden">
      <SEO
        title="Shop Premium Personalised Gifts & Custom Trophies"
        description="Explore the Photowala Gift catalog for high-end custom trophies, wooden awards, photo mugs, printed plaques, and custom corporate gift solutions. Crafted with precision in India."
        keywords="personalised gifts catalogue, custom trophies price, order corporate awards, buy photo mugs online, custom engraved plaques, Photowala Gift products"
        schemaMarkup={shopSchema}
      />
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-brand-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-100 h-100 bg-brand-secondary/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-gray-400 text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-6 sm:mb-10 animate-in fade-in slide-in-from-left-4 duration-500">
          <Link to="/" className="hover:text-brand-secondary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-brand-primary">Shop All Products</span>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 sm:mb-12">
          {/* Title and stats */}
          <div className="space-y-2 shrink-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-brand-primary leading-tight">
              All <span className="text-brand-secondary">Products</span>
            </h1>
            <div className="flex items-center gap-4">
              <div className="h-0.5 w-8 bg-brand-secondary" />
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{totalCount || 0} premium items available</p>
            </div>
          </div>

          {/* Search bar (pill shape with gold border) */}
          <div className="flex-1 max-w-lg xl:max-w-xl relative group">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search for trophies, corporate gifts, mementos..."
              className="w-full pl-6 pr-12 py-3 sm:py-3.5 rounded-full border-2 border-brand-secondary/35 bg-white text-brand-primary font-medium text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/15 transition-all shadow-[0_4px_16px_rgba(91,63,47,0.04)]"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <Search className="w-4 h-4 text-brand-secondary shrink-0" />
            </div>
          </div>

          {/* Sort selection */}
          <div className="shrink-0 w-full md:w-auto flex items-center gap-3 relative animate-in fade-in duration-300">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-full border border-cream-200 bg-white text-brand-primary font-semibold text-xs uppercase tracking-wider cursor-pointer transition-all hover:bg-cream-50"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
            
            <div className="relative flex-1 md:flex-none">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="w-full md:w-56 px-6 py-3.5 flex items-center justify-between rounded-full border-2 border-brand-secondary/35 bg-white text-brand-primary font-bold text-xs uppercase tracking-wider focus:outline-none focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/15 transition-all shadow-[0_4px_16px_rgba(91,63,47,0.04)] cursor-pointer"
              >
                <span>{SORT_OPTIONS.find(o => o.value === sortValue)?.label}</span>
                <span className={`transition-transform duration-200 text-[10px] shrink-0 text-brand-secondary ${showSortDropdown ? 'rotate-180' : ''}`}>▼</span>
              </button>
              
              {showSortDropdown && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSortDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-[#fffdfb] border border-brand-secondary/25 rounded-2xl shadow-[0_10px_30px_rgba(91,63,47,0.15)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    {SORT_OPTIONS.map((o) => {
                      const isSelected = o.value === sortValue;
                      return (
                        <button
                          key={o.value}
                          onClick={() => {
                            setSortValue(o.value);
                            setShowSortDropdown(false);
                          }}
                          className={`w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-brand-primary text-white'
                              : 'text-brand-primary hover:bg-brand-surface hover:text-brand-secondary'
                          }`}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Sidebar Filters */}
        <aside className={`${
          showFilters ? 'fixed inset-0 z-40 md:static md:z-auto' : 'hidden md:block'
        } w-full md:w-64 md:shrink-0`}>
          {showFilters && (
            <div
              className="md:hidden fixed inset-0 bg-black/50"
              onClick={() => setShowFilters(false)}
            />
          )}
          <div className={`${
            showFilters ? 'fixed inset-y-0 left-0 w-80 max-w-full md:static' : ''
          } bg-cream-50 md:bg-transparent rounded-r-2xl md:rounded-none shadow-lg md:shadow-none transform transition-transform duration-300 md:transform-none`}>
            <div className="p-4 md:p-0">
              <div className="flex items-center justify-between md:hidden mb-4">
                <h2 className="text-lg font-bold text-gray-800">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="btn-ghost p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="card p-5 space-y-5">
                {/* Categories */}
                <div>
                  <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Category</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="cat" checked={!filters.category} onChange={() => clearFilter('category')} className="accent-brand-primary" />
                      <span className="text-sm text-gray-700">All Categories</span>
                    </label>
                    {catData?.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="cat" checked={filters.category === cat.slug} onChange={() => setFilter('category', cat.slug)} className="accent-brand-primary" />
                        <span className="text-sm text-gray-700">{cat.name}</span>
                        <span className="ml-auto text-xs text-gray-400">({cat._count?.products})</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Price Range</h3>
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <input type="number" placeholder="Min ₹" className="input-field py-2 text-sm flex-1" onBlur={(e) => e.target.value ? setFilter('minPrice', e.target.value) : clearFilter('minPrice')} />
                    <input type="number" placeholder="Max ₹" className="input-field py-2 text-sm flex-1" onBlur={(e) => e.target.value ? setFilter('maxPrice', e.target.value) : clearFilter('maxPrice')} />
                  </div>
                </div>

                {/* Premium Only */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={filters.isFeatured === 'true'} onChange={(e) => e.target.checked ? setFilter('isFeatured', 'true') : clearFilter('isFeatured')} className="accent-brand-primary w-4 h-4 rounded" />
                    <span className="text-sm text-gray-700 font-medium">✨ Featured Only</span>
                  </label>
                </div>
              </div>

            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 w-full">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="bg-cream-200 aspect-square" />
                  <div className="p-3 sm:p-4 space-y-2">
                    <div className="h-3 bg-cream-300 rounded w-3/4" />
                    <div className="h-4 bg-cream-300 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="card p-16 md:p-24 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-linear-to-b from-brand-surface/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-brand-surface rounded-3xl flex items-center justify-center mx-auto mb-8 text-brand-secondary border border-cream-200 shadow-sm">
                  🔍
                </div>
                <h3 className="text-2xl font-bold text-brand-primary mb-3">No Products Found</h3>
                <p className="text-gray-500 text-sm mb-10 max-w-sm mx-auto font-medium leading-relaxed">Try adjusting your filters or browse our categories to find what you're looking for.</p>
                <button
                  onClick={() => {
                    setFilters({ page: 1 });
                    setSearchInput('');
                  }}
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-pill bg-brand-primary text-white font-bold text-xs uppercase tracking-widest hover:bg-brand-deep transition-all shadow-lg hover:shadow-brand-primary/20 cursor-pointer"
                >
                  Clear Filters <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8 flex-wrap">
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => setFilters((f) => ({ ...f, page }))}
                  className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                    (filters.page || 1) === page
                      ? 'bg-brand-primary text-white'
                      : 'bg-white text-gray-600 border border-cream-300 hover:border-brand-secondary'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

