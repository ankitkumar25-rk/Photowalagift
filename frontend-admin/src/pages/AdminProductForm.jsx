import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

const EMPTY_FORM = {
  name: '',
  description: '',
  shortDesc: '',
  categoryId: '',
  price: '',
  mrp: '',
  unit: 'kg',
  stock: '0',
  lowStockAlert: '10',
  sku: '',
  isFeatured: false,
  tags: '',
  certifications: '',
  weight: '',
};

function toArray(input) {
  if (!input.trim()) return [];
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AdminProductForm() {
  const { slug, id } = useParams();
  const location = useLocation();
  const isEdit = location.pathname.endsWith('/edit');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  
  // imageSlots will store either a File object (new upload) or a URL (existing)
  const [imageSlots, setImageSlots] = useState([null, null, null]);
  const [previews, setPreviews] = useState(['', '', '']);

  const looksLikeUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data || []),
    staleTime: 1000 * 60 * 30,
  });

  const { data: productData, isLoading: loadingProduct } = useQuery({
    queryKey: ['admin-product', id || slug],
    enabled: isEdit && Boolean(id || slug),
    queryFn: async () => {
      if (id) {
        const byId = await api.get('/products/id/' + id);
        return byId.data?.data;
      }
      if (looksLikeUuid(slug)) {
        const byIdFallback = await api.get('/products/id/' + slug);
        return byIdFallback.data?.data;
      }
      const bySlug = await api.get('/products/' + slug);
      return bySlug.data?.data;
    },
    retry: false,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (!productData) return;

    setForm({
      name: productData.name || '',
      description: productData.description || '',
      shortDesc: productData.shortDesc || '',
      categoryId: productData.categoryId || '',
      price: productData.price?.toString() || '',
      mrp: productData.mrp?.toString() || '',
      unit: productData.unit || 'kg',
      stock: productData.stock?.toString() || '0',
      lowStockAlert: productData.lowStockAlert?.toString() || '10',
      sku: productData.sku || '',
      isFeatured: Boolean(productData.isFeatured),
      tags: Array.isArray(productData.tags) ? productData.tags.join(', ') : '',
      certifications: Array.isArray(productData.certifications) ? productData.certifications.join(', ') : '',
      weight: productData.weight?.toString() || '',
    });

    const existingImages = productData.images || [];
    const newSlots = [null, null, null];
    const newPreviews = ['', '', ''];

    existingImages.slice(0, 3).forEach((img, idx) => {
      newSlots[idx] = img; // store the image object to retain metadata
      newPreviews[idx] = img.url;
    });

    setImageSlots(newSlots);
    setPreviews(newPreviews);
  }, [productData]);

  const handleFileChange = (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newPreviews = [...previews];
      newPreviews[idx] = reader.result;
      setPreviews(newPreviews);

      const newSlots = [...imageSlots];
      newSlots[idx] = file;
      setImageSlots(newSlots);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = (idx) => {
    const newPreviews = [...previews];
    newPreviews[idx] = '';
    setPreviews(newPreviews);

    const newSlots = [...imageSlots];
    newSlots[idx] = null;
    setImageSlots(newSlots);
  };

  const saveMut = useMutation({
    mutationFn: async (formData) => {
      if (isEdit) return api.put('/products/' + productData.id, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-inventory'] });
      toast.success(isEdit ? 'Product updated' : 'Product created');
      navigate('/products');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Unable to save product'),
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.categoryId) return toast.error('Category is required');
    if (Number.isNaN(Number(form.price)) || Number(form.price) <= 0) return toast.error('Price must be greater than 0');
    if (Number.isNaN(Number(form.mrp)) || Number(form.mrp) <= 0) return toast.error('MRP must be greater than 0');
    
    // Primary image check
    if (!imageSlots[0]) return toast.error('Primary image is required');

    const fd = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (key === 'tags' || key === 'certifications') {
        fd.append(key, toArray(val).join(','));
      } else {
        fd.append(key, val);
      }
    });

    // Handle images
    const existingImagesData = [];
    imageSlots.forEach((slot, idx) => {
      if (slot instanceof File) {
        fd.append('images', slot);
      } else if (slot && typeof slot === 'object' && slot.url) {
        existingImagesData.push({
          url: slot.url,
          publicId: slot.publicId,
          altText: slot.altText || form.name,
          isPrimary: idx === 0,
          sortOrder: idx
        });
      }
    });

    if (existingImagesData.length > 0) {
      // Send existing images as JSON string if any
      fd.append('imagesData', JSON.stringify(existingImagesData));
    }

    saveMut.mutate(fd);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#5b3f2f]">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
          <p className="text-[#7a655c] text-sm mt-0.5">{isEdit ? 'Refine your product details and inventory settings.' : 'Create a new masterpiece in your catalog.'}</p>
        </div>
        <Link to="/products" className="btn-ghost justify-center sm:w-auto border-[#5b3f2f]/10 text-[#5b3f2f]">Back to Catalog</Link>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loadingProduct && isEdit && <p className="text-sm text-gray-500 col-span-full">Loading product essence...</p>}

        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-6 luxury-grain">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#b88a2f] border-b border-[#5b3f2f]/5 pb-4">General Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#7a655c] mb-2">Product Name</label>
                <input
                  type="text"
                  className="input-field bg-[#fcf9f6]"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#7a655c] mb-2">Category</label>
                <select
                  className="input-field bg-[#fcf9f6]"
                  value={form.categoryId}
                  onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  required
                >
                  <option value="">Select category</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#7a655c] mb-2">Product Identifiers & Specifications</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">SKU</span>
                    <input
                      type="text"
                      placeholder="SKU Code"
                      className="input-field bg-[#fcf9f6]"
                      value={form.sku}
                      onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                    />
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Size (e.g. 10-15 inch, pc)</span>
                    <input
                      type="text"
                      placeholder="Size / Unit"
                      className="input-field bg-[#fcf9f6]"
                      value={form.unit}
                      onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                    />
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Weight (grams)</span>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Weight (g)"
                      className="input-field bg-[#fcf9f6]"
                      value={form.weight}
                      onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#7a655c] mb-2">Short Description</label>
              <input
                type="text"
                className="input-field bg-[#fcf9f6]"
                value={form.shortDesc}
                onChange={(e) => setForm((prev) => ({ ...prev, shortDesc: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#7a655c] mb-2">Detailed Description</label>
              <textarea
                rows={6}
                className="input-field bg-[#fcf9f6] resize-none"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          {/* Image Gallery */}
          <div className="card p-6 space-y-6 luxury-grain">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#b88a2f] border-b border-[#5b3f2f]/5 pb-4">Product Imagery</h3>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#7a655c]/60">
                      {idx === 0 ? 'Primary Visual' : `Angle ${idx + 1}`}
                    </p>
                    <div className={`relative aspect-[4/5] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden bg-[#fcf9f6] ${previews[idx] ? 'border-[#b88a2f]/20 shadow-inner' : 'border-[#5b3f2f]/10 hover:border-[#b88a2f]/30'}`}>
                      {previews[idx] ? (
                        <>
                          <img src={previews[idx]} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="p-2 bg-white/90 text-red-500 rounded-full shadow-xl hover:scale-110 transition-transform"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6 text-center group">
                          <Upload className="w-6 h-6 text-[#b88a2f]/40 mb-3 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#7a655c]/60">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(idx, e)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="card p-6 space-y-6 luxury-grain">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#b88a2f] border-b border-[#5b3f2f]/5 pb-4">Pricing & Inventory</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#7a655c] mb-2">Sale Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field bg-[#fcf9f6] text-lg font-bold text-[#5b3f2f]"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#7a655c] mb-2">MRP (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field bg-[#fcf9f6] text-[#7a655c]/50 line-through"
                  value={form.mrp}
                  onChange={(e) => setForm((prev) => ({ ...prev, mrp: e.target.value }))}
                  required
                />
              </div>

              <div className="pt-4 border-t border-[#5b3f2f]/5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#7a655c] mb-2">Current Stock</label>
                <input
                  type="number"
                  min="0"
                  className="input-field bg-[#fcf9f6]"
                  value={form.stock}
                  onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#7a655c] mb-2">Low Stock Alert</label>
                <input
                  type="number"
                  min="0"
                  className="input-field bg-[#fcf9f6]"
                  value={form.lowStockAlert}
                  onChange={(e) => setForm((prev) => ({ ...prev, lowStockAlert: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-6 luxury-grain">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#b88a2f] border-b border-[#5b3f2f]/5 pb-4">Attributes & Tags</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#7a655c] mb-2">Search Tags</label>
                <input
                  type="text"
                  className="input-field bg-[#fcf9f6]"
                  value={form.tags}
                  onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g. gift, customized"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#7a655c] mb-2">Certifications</label>
                <input
                  type="text"
                  className="input-field bg-[#fcf9f6]"
                  value={form.certifications}
                  onChange={(e) => setForm((prev) => ({ ...prev, certifications: e.target.value }))}
                  placeholder="e.g. ISO, Premium"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  className="w-4 h-4 rounded border-[#5b3f2f]/20 text-[#b88a2f] focus:ring-[#b88a2f]"
                  checked={form.isFeatured}
                  onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                />
                <label htmlFor="isFeatured" className="text-[10px] font-black uppercase tracking-widest text-[#5b3f2f]">
                  Show in Featured Section
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <button 
              type="submit" 
              className="w-full py-4 rounded-2xl bg-[#5b3f2f] text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-[#5b3f2f]/20 hover:bg-[#4a3427] transition-all disabled:opacity-50 active:scale-[0.98]"
              disabled={saveMut.isPending}
            >
              {saveMut.isPending ? 'Processing...' : isEdit ? 'Update Masterpiece' : 'Unveil Product'}
            </button>
            <Link to="/products" className="w-full py-4 rounded-2xl border border-[#5b3f2f]/10 text-[#5b3f2f] text-xs font-black uppercase tracking-[0.2em] text-center hover:bg-[#f5e7d8] transition-all">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
