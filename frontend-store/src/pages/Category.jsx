import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { categoriesApi } from '../api';
import ProductCard from '../components/ProductCard';

export default function Category() {
  const { slug } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoriesApi.getBySlug(slug).then(r => r.data.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="min-h-screen bg-cream-100 pt-32 pb-24 px-4 luxury-grain relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-brand-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-100 h-100 bg-brand-secondary/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-gray-400 text-xs font-semibold uppercase tracking-widest mb-10 animate-in fade-in slide-in-from-left-4 duration-500">
          <Link to="/" className="hover:text-brand-secondary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <Link to="/products" className="hover:text-brand-secondary transition-colors">Products</Link>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-brand-primary">{data?.name || slug}</span>
        </div>

        {/* Header */}
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-primary leading-tight">
            {data?.name || slug}
          </h1>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-0.5 w-12 bg-brand-secondary" />
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{data?.description || 'Explore our premium collection'}</p>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="bg-cream-200 aspect-square rounded-t-card" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-cream-300 rounded w-3/4" />
                  <div className="h-4 bg-cream-300 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.products?.length === 0 ? (
          <div className="card p-16 md:p-24 text-center relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-20 h-20 bg-brand-surface rounded-3xl flex items-center justify-center mx-auto mb-8 text-brand-secondary border border-cream-200 shadow-sm">
                📦
              </div>
              <h3 className="text-2xl font-bold text-brand-primary mb-3">No Products Available</h3>
              <p className="text-gray-500 text-sm mb-10 font-medium leading-relaxed">This category doesn't have any products yet. Check back soon!</p>
              <Link to="/products" className="inline-flex items-center gap-2 px-10 py-4 rounded-pill bg-brand-primary text-white font-bold text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-brand-primary/20 transition-all">
                Browse All Products <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {data?.products?.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

