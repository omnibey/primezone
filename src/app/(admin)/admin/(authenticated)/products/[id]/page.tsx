'use client';
export const runtime = 'edge';

import { useEffect, useState, useCallback, use, useRef } from 'react';
import { adminFetch, uploadToR2, triggerRevalidate } from '@/utils/adminApi';
import { useToast } from '../../layout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, Plus, Trash2, Upload, Image as ImageIcon, Images, X, GripVertical, Sparkles, CheckCircle2, AlertCircle, ExternalLink, Calendar, Search, Layout, Wand2 } from 'lucide-react';
import TipTapEditor from '@/components/admin/TipTapEditor';
import GalleryPicker from '@/components/admin/GalleryPicker';
import BloggerGalleryModal from '@/components/admin/BloggerGalleryModal';


const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const QUICK_VALUES_MAP: Record<string, string[]> = {
  'Color': ['Black', 'White', 'Red', 'Blue', 'Navy', 'Grey', 'Pink', 'Green', 'Yellow', 'Purple', 'Beige', 'Brown', 'Maroon', 'Olive', 'Gold', 'Silver'],
  'Size': ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48'],
  'Volume': ['10ml', '30ml', '50ml', '100ml', '150ml', '200ml', '250ml', '500ml', '1L'],
  'Weight': ['50g', '100g', '200g', '500g', '1kg'],
  'Material': ['Cotton', 'Polyester', 'Silk', 'Linen', 'Wool', 'Leather', 'Denim', 'Nylon', 'Canvas'],
  'Style': ['Casual', 'Formal', 'Sports', 'Party', 'Vintage', 'Modern', 'Minimalist'],
  'Flavor': ['Vanilla', 'Chocolate', 'Strawberry', 'Mint', 'Coffee'],
  'Scent': ['Lavender', 'Rose', 'Citrus', 'Vanilla', 'Mint']
};

export default function ProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const showToast = useToast();
  const router = useRouter();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [form, setForm] = useState({
    title: '', slug: '', sku: '', description: '', brand: '',
    tags: [], images: [], base_price: '', original_price: '',
    stock: 0, is_unlimited_stock: 0, is_variant_bulk_mode: 0,
    free_delivery: 0, free_delivery_min_qty: 0, free_delivery_min_amount: 0,
    status: 'active', is_flash_sale: 0, category: '', created_at: null,
    requires_shipping: 1,
  });
  const [digitalAssets, setDigitalAssets] = useState<any[]>([]);

  const [slugStatus, setSlugStatus] = useState(null); // { type: 'success' | 'error' | 'loading', message: '' }
  const [isFormDirty, setIsFormDirty] = useState(false);

  const [variants, setVariants] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [optionGroups, setOptionGroups] = useState([]);

  const [catSearch, setCatSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [savingCat, setSavingCat] = useState(false);
  const [catForm, setCatForm] = useState({
    name: '', slug: '', parent_id: '', image_url: '', description: '',
    is_active: 1, sort_order: 0, show_on_homepage: 0,
  });
  const [catGalleryOpen, setCatGalleryOpen] = useState(false);

  const generateCatSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  
  const handleCatNameChange = (value: string) => {
    setCatForm(prev => ({ ...prev, name: value, slug: generateCatSlug(value) }));
  };

  const handleCatSave = async () => {
    if (!catForm.name.trim()) return showToast('Name is required', 'error');
    setSavingCat(true);
    try {
      const payload = { ...catForm, sort_order: Number(catForm.sort_order) || 0 };
      const res = await adminFetch('/categories', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Category created');
      await triggerRevalidate('categories');
      
      // Refresh the categories list
      const data = await adminFetch('/categories');
      setCategories(data.categories || data || []);
      
      // Auto-select the newly created category if ID is returned
      if (res && res.id) {
        setSelectedCategories(prev => [...prev, res.id]);
      } else {
        // Fallback: try to find it by slug
        const cats = data.categories || data || [];
        const newCat = cats.find(c => c.slug === payload.slug);
        if (newCat) setSelectedCategories(prev => [...prev, newCat.id]);
      }
      
      setCatModalOpen(false);
      setCatForm({ name: '', slug: '', parent_id: '', image_url: '', description: '', is_active: 1, sort_order: 0, show_on_homepage: 0 });
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingCat(false);
    }
  };

  // Load categories
  useEffect(() => {
    adminFetch('/categories').then(data => {
      setCategories(data.categories || data || []);
    }).catch(() => {});
  }, []);

  // Load product if editing
  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const data = await adminFetch(`/products/${id}`);
        const product = data.product || data;
        const images = typeof product.images === 'string' ? JSON.parse(product.images || '[]') : product.images || [];
        const tags = typeof product.tags === 'string' ? JSON.parse(product.tags || '[]') : product.tags || [];

        setForm({
          title: product.title || '',
          slug: product.slug || '',
          sku: product.sku || '',
          description: product.description || '',
          brand: product.brand || '',
          tags,
          images,
          base_price: product.base_price || '',
          original_price: product.original_price || '',
          stock: product.stock ?? 0,
          is_unlimited_stock: product.is_unlimited_stock || 0,
          is_variant_bulk_mode: product.is_variant_bulk_mode || 0,
          free_delivery: product.free_delivery || 0,
          free_delivery_min_qty: product.free_delivery_min_qty || 0,
          free_delivery_min_amount: product.free_delivery_min_amount || 0,
          status: product.status || 'active',
          is_flash_sale: product.is_flash_sale || 0,
          category: product.category || '',
          created_at: product.created_at || null,
          requires_shipping: product.requires_shipping !== undefined ? product.requires_shipping : 1,
        });

        if (data.digital_assets) setDigitalAssets(data.digital_assets);

        if (data.variants && data.variants.length > 0) {
          const parsedVariants = data.variants.map(v => ({
            id: v.id,
            name: v.name || '',
            sku: v.sku || '',
            price: v.price || '',
            original_price: v.original_price || '',
            stock: v.stock ?? 0,
            is_unlimited_stock: v.is_unlimited_stock || 0,
            image_url: v.image_url || '',
            options: typeof v.options === 'string' ? JSON.parse(v.options || '{}') : v.options || {},
          }));
          setVariants(parsedVariants);

          const inferredGroups: Record<string, Set<string>> = {};
          parsedVariants.forEach((v: any) => {
            if (v.options && typeof v.options === 'object') {
              Object.entries(v.options).forEach(([key, value]) => {
                if (key && value) {
                  if (!inferredGroups[key]) inferredGroups[key] = new Set();
                  inferredGroups[key].add(String(value));
                }
              });
            }
          });
          
          const newOptionGroups = Object.keys(inferredGroups).map(key => ({
            name: key,
            values: Array.from(inferredGroups[key]).join(', ')
          }));
          
          if (newOptionGroups.length > 0) {
            setOptionGroups(newOptionGroups);
          }
        }

        if (product.categories) {
          setSelectedCategories(product.categories.map(c => c.id || c.category_id));
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew, showToast]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setIsFormDirty(true);
  };

  // Form dirty check
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

  // Slug Availability Checker
  useEffect(() => {
    if (!form.slug) {
      setSlugStatus(null);
      return;
    }
    const checkSlug = async () => {
      setSlugStatus({ type: 'loading', message: 'Checking availability...' });
      try {
        const res = await adminFetch(`/products/${encodeURIComponent(form.slug)}`);
        if (res && res.product) {
          if (!isNew && res.product.id == id) {
            setSlugStatus({ type: 'success', message: 'Available (Current Product)' });
          } else {
            setSlugStatus({ type: 'error', message: 'This slug is already used by another product!' });
          }
        } else {
          setSlugStatus({ type: 'success', message: 'Available' });
        }
      } catch (err) {
        if (err.message.includes('404') || err.message.includes('not found')) {
          setSlugStatus({ type: 'success', message: 'Available' });
        } else {
          setSlugStatus(null);
        }
      }
    };
    const timer = setTimeout(checkSlug, 600);
    return () => clearTimeout(timer);
  }, [form.slug, id, isNew]);

  // Auto-generate slug from title
  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (value) => {
    updateField('title', value);
    if (isNew || !form.slug) {
      updateField('slug', generateSlug(value));
    }
  };

  // Image upload
  const handleImageUpload = async (e) => {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadToR2(file, 'products');
        setForm(prev => ({ ...prev, images: [...prev.images, url] }));
        showToast('Image uploaded');
      }
    } catch (err) {
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  // Gallery Picker State
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [bloggerOpen, setBloggerOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<number | 'main' | null>(null);

  const handleGallerySelect = (url: string) => {
    if (galleryTarget === 'main') {
      setForm(prev => ({ ...prev, images: [...prev.images, url] }));
    } else if (typeof galleryTarget === 'number') {
      updateVariant(galleryTarget, 'image_url', url);
    }
  };
  // Option Groups
  const addOptionGroup = () => setOptionGroups(prev => [...prev, { name: '', values: '' }]);
  const updateOptionGroup = (index, field, value) => setOptionGroups(prev => prev.map((g, i) => i === index ? { ...g, [field]: value } : g));
  const removeOptionGroup = (index) => setOptionGroups(prev => prev.filter((_, i) => i !== index));

  const generateVariantsFromOptions = () => {
    const validGroups = optionGroups
      .map(g => ({ name: g.name.trim(), values: g.values.split(',').map(v => v.trim()).filter(v => v) }))
      .filter(g => g.name && g.values.length > 0);
    
    if (validGroups.length === 0) return showToast('Add valid option groups', 'error');

    const combine = (arrs) => arrs.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
    const combinations = combine(validGroups.map(g => g.values));
    const rows = Array.isArray(combinations[0]) ? combinations : combinations.map(c => [c]);

    const newVariants = rows.map((combo, index) => {
      const optionsObj = {};
      const nameParts = [];
      validGroups.forEach((g, idx) => {
        optionsObj[g.name] = combo[idx];
        nameParts.push(combo[idx]);
      });
      return {
        name: nameParts.join(' / '),
        price: form.base_price || '',
        original_price: form.original_price || '',
        stock: form.is_unlimited_stock === 1 ? 9999 : (form.stock || 0),
        is_unlimited_stock: form.is_unlimited_stock,
        sku: form.sku || '',
        image_url: '',
        options: optionsObj,
      };
    });
    setVariants(newVariants);
    showToast('Variants generated!');
  };

  // Variants
  const addVariant = () => {
    setVariants(prev => [...prev, {
      name: '', sku: '', price: '', original_price: '', stock: 0,
      is_unlimited_stock: 0, image_url: '', options: {},
    }]);
  };

  const updateVariant = (index, field, value) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const removeVariant = (index) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  // Tags
  const [tagInput, setTagInput] = useState('');
  const addTag = (val?: any) => {
    const tag = (val || tagInput).trim();
    if (tag && !form.tags.includes(tag)) {
      updateField('tags', [...form.tags, tag]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) {
      removeTag(form.tags[form.tags.length - 1]);
    }
  };

  const removeTag = (tag) => {
    updateField('tags', form.tags.filter(t => t !== tag));
  };

  // Bulk Actions & Advanced Management
  const [bulkEditPrice, setBulkEditPrice] = useState('');
  const [bulkEditOriginalPrice, setBulkEditOriginalPrice] = useState('');
  const [bulkEditStock, setBulkEditStock] = useState('');

  const applyBulkEdit = () => {
    if (!variants.length) return showToast('No variants to edit', 'error');
    setVariants(prev => prev.map(v => ({
      ...v,
      price: bulkEditPrice !== '' ? bulkEditPrice : v.price,
      original_price: bulkEditOriginalPrice !== '' ? bulkEditOriginalPrice : v.original_price,
      stock: bulkEditStock !== '' ? bulkEditStock : v.stock
    })));
    showToast('Bulk edit applied successfully!');
    setBulkEditPrice(''); setBulkEditOriginalPrice(''); setBulkEditStock('');
  };

  const autoGenerateSKUs = () => {
    if (!variants.length) return showToast('No variants to generate SKUs for', 'error');
    
    let baseSku = form.sku;
    if (!baseSku) {
      const titleStr = form.title.trim();
      const prefix = titleStr ? titleStr.split(' ').filter(w => w).map(w => w[0]).join('').toUpperCase().substring(0, 4) : 'PROD';
      baseSku = prefix + '-' + Math.floor(100 + Math.random() * 900);
      updateField('sku', baseSku);
    }
    
    setVariants(prev => prev.map(v => {
      let suffix = '';
      if (v.options && Object.keys(v.options).length > 0) {
        suffix = Object.values(v.options).map((val: any) => val.toString().toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4)).join('-');
      } else {
        suffix = v.name.toUpperCase().replace(/[^A-Z0-9]/g, '-').substring(0, 8);
      }
      return { ...v, sku: `${baseSku}-${suffix}`.replace(/-+/g, '-').replace(/^-|-$/g, '') };
    }));
    showToast('SKUs generated successfully!');
  };

  const applyImageToMatchingVariants = (index: number) => {
    const sourceVariant = variants[index];
    if (!sourceVariant.image_url) return showToast('Source variant has no image', 'error');
    if (!sourceVariant.options || Object.keys(sourceVariant.options).length === 0) {
       return showToast('Variant must have options to match against', 'error');
    }
    
    const optionKeys = Object.keys(sourceVariant.options);
    const primaryKey = optionKeys.find(k => k.toLowerCase().includes('color')) || optionKeys[0];
    const primaryValue = sourceVariant.options[primaryKey];
    
    let updatedCount = 0;
    setVariants(prev => prev.map((v, i) => {
      if (i !== index && v.options && v.options[primaryKey] === primaryValue) {
        updatedCount++;
        return { ...v, image_url: sourceVariant.image_url };
      }
      return v;
    }));
    
    showToast(`Image applied to ${updatedCount} matching variant(s)`);
  };

  // Category toggle
  const toggleCategory = (catId) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  // AI Description & Tags Generation
  const autoGenerateAIDescription = () => {
    if (!form.title.trim()) {
      showToast('Please enter a product title first.', 'error');
      return;
    }

    const lower = form.title.toLowerCase();
    const newTags = [...form.tags];
    const addTagIfMissing = (t) => { if (!newTags.includes(t)) newTags.push(t); };

    if (lower.includes('serum') || lower.includes('ampoule')) addTagIfMissing('Serum');
    if (lower.includes('sun') || lower.includes('sunscreen') || lower.includes('sun cream') || lower.includes('sun stick')) addTagIfMissing('Sunscreen');
    if (lower.includes('cream') || lower.includes('moisturizer') || lower.includes('lotion')) addTagIfMissing('Moisturizer');
    if (lower.includes('premium')) addTagIfMissing('Premium');
    if (lower.includes('new')) addTagIfMissing('New Arrival');
    if (form.brand) addTagIfMissing(form.brand);

    const brandPrefix = form.brand ? `<strong>${form.brand}</strong> এর ` : '';
    const aiHtml = `
<p>${brandPrefix}<strong>${form.title}</strong> একটি প্রিমিয়াম মানের অরিজিনাল প্রোডাক্ট, যা আপনার দৈনন্দিন জীবনের প্রয়োজন মেটাতে বিশেষভাবে তৈরি।</p>

<h3>✨ মূল বৈশিষ্ট্য ও উপকারিতা (Key Benefits):</h3>
<ul>
    <li>উন্নত কোয়ালিটি এবং টেকসই ডিজাইন।</li>
    <li>দৈনন্দিন ব্যবহারে অত্যন্ত আরামদায়ক এবং নিরাপদ।</li>
    <li>বেস্ট-ইন-ক্লাস পারফরম্যান্স এবং প্রিমিয়াম ফিল।</li>
    <li>আকর্ষণীয় আউটলুক যা সহজেই সবার নজর কাড়বে।</li>
</ul>

<p><strong>কেন কিনবেন?</strong><br/>
এটি শুধু একটি সাধারণ পণ্য নয়, বরং আপনার লাইফস্টাইলকে আরও সহজ ও সুন্দর করার জন্য এটি হতে পারে একটি দারুণ সংযোজন। 
অরিজিনাল প্রোডাক্টের নিশ্চয়তা পেতে এখনই অর্ডার করুন।</p>

<p><em>📦 ১০০% অথেন্টিক প্রোডাক্টের গ্যারান্টি সহ সারা বাংলাদেশে দ্রুত ক্যাশ অন হোম ডেলিভারিতে অর্ডার করুন!</em></p>
    `.trim();

    setForm(prev => ({ ...prev, tags: newTags, description: aiHtml }));
    showToast('✨ AI Description & Tags generated successfully!');
  };

  // Save
  const handleSave = async () => {
    if (!form.title.trim()) return showToast('Title is required', 'error');
    
    // If no variants, require base price
    if (variants.length === 0) {
      if (!form.base_price || Number(form.base_price) <= 0) {
        return showToast('Base Price is required for normal products', 'error');
      }
    } else {
      // Validate variants
      for (let i = 0; i < variants.length; i++) {
        if (!variants[i].price) {
          return showToast(`Variant row ${i + 1}: Price is required`, 'error');
        }
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        base_price: Number(form.base_price) || 0,
        original_price: form.original_price ? Number(form.original_price) : null,
        stock: Number(form.stock) || 0,
        free_delivery_min_qty: Number(form.free_delivery_min_qty) || 0,
        free_delivery_min_amount: Number(form.free_delivery_min_amount) || 0,
        images: form.images,
        tags: form.tags,
        categories: selectedCategories,
        is_variant_bulk_mode: form.is_variant_bulk_mode ? 1 : 0,
        requires_shipping: form.requires_shipping ? 1 : 0,
        digital_assets: digitalAssets,
        variants: variants.map((v, idx) => ({
          ...v,
          price: Number(v.price) || 0,
          original_price: v.original_price ? Number(v.original_price) : null,
          stock: Number(v.stock) || 0,
          options: typeof v.options === 'string' ? JSON.parse(v.options || '{}') : v.options,
          sort_order: idx
        })),
      };

      if (isNew) {
        await adminFetch('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('Product created!');
      } else {
        await adminFetch(`/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast('Product updated!');
      }

      await triggerRevalidate('products');
      setIsFormDirty(false);
      router.push('/admin/products');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <div className="admin-card-body">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="admin-skeleton admin-skeleton-text-lg" style={{ width: `${60 + Math.random() * 40}%`, marginBottom: 16 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <button className="admin-btn admin-btn-ghost" onClick={() => router.push('/admin/products')}>
          <ArrowLeft size={16} /> Back to Products
        </button>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {!isNew && form.created_at && (
            <div className="admin-bg-gray-light admin-border-b" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 500, border: '1px solid var(--admin-border-light)' }}>
              <Calendar size={14} /> Added: {new Date(form.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
          {!isNew && (
            <>
              <a href={`/product/${form.slug}`} target="_blank" rel="noreferrer" className="admin-btn admin-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderColor: '#cbd5e1' }}>
                <ExternalLink size={14} /> View Live
              </a>
            </>
          )}
          <select
            value={form.status}
            onChange={e => updateField('status', e.target.value)}
            className="admin-select"
            style={{ width: 'auto', minWidth: 120 }}
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : isNew ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="admin-grid-2" style={{ gridTemplateColumns: '1fr 360px', alignItems: 'start' }}>
        {/* Left Column */}
        <div>
          {/* Basic Info */}
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header">
              <h3 className="admin-card-title">Basic Information</h3>
            </div>
            <div className="admin-card-body">
              <div className="admin-form-group">
                <label className="admin-label">Title *</label>
                <input type="text" className="admin-input" value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Product title" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Slug</label>
                <input type="text" className="admin-input" value={form.slug} onChange={e => updateField('slug', e.target.value)} placeholder="product-slug" />
                {slugStatus ? (
                  <div style={{ fontSize: '0.85rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, color: slugStatus.type === 'success' ? '#10b981' : slugStatus.type === 'error' ? '#ef4444' : '#64748b' }}>
                    {slugStatus.type === 'success' && <CheckCircle2 size={14} />}
                    {slugStatus.type === 'error' && <AlertCircle size={14} />}
                    {slugStatus.message}
                  </div>
                ) : (
                  <div className="admin-form-hint">URL-friendly identifier. Auto-generated from title.</div>
                )}
              </div>
              
              {/* Tags Box */}
              <div className="admin-form-group">
                <label className="admin-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Search & SEO Tags</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'normal' }}>Type and press Enter or comma</span>
                </label>
                <div className="admin-bg-surface admin-border-b" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', border: '1px solid var(--admin-border)', borderRadius: 8, padding: '6px 10px', minHeight: 44, cursor: 'text' }} onClick={() => document.getElementById('tagInputInput').focus()}>
                  {form.tags.map(tag => (
                    <span key={tag} className="admin-bg-gray-light admin-text-primary-dark" style={{ padding: '3px 8px', borderRadius: 12, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      #{tag}
                      <X size={12} style={{ cursor: 'pointer', color: '#64748b' }} onClick={(e) => { e.stopPropagation(); removeTag(tag); }} />
                    </span>
                  ))}
                  <input
                    id="tagInputInput"
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add tag (e.g. summer, trending)..."
                    style={{ border: 'none', outline: 'none', fontSize: '0.88rem', flex: 1, minWidth: 150, padding: 4 }}
                  />
                </div>
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Popular:</span>
                  {['New Arrival', 'Best Seller', 'Featured', 'Trending', 'Discounted', 'Limited Edition', 'Top Rated', 'Restocked'].map(s => (
                    <button key={s} type="button" onClick={() => addTag(s)} className="admin-bg-gray-light admin-text-muted" style={{ border: 'none', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', cursor: 'pointer', transition: '0.2s' }}>+ {s}</button>
                  ))}
                </div>
              </div>

              <div className="admin-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="admin-label" style={{ marginBottom: 0 }}>Description</label>
                  <button type="button" className="admin-btn admin-btn-sm" onClick={autoGenerateAIDescription} style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', borderColor: '#c7d2fe', color: '#4338ca', fontWeight: 600 }}>
                    <Sparkles size={14} style={{ color: '#6366f1' }} /> Auto-Generate with AI
                  </button>
                </div>
                <TipTapEditor value={form.description} onChange={(val) => updateField('description', val)} />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header">
              <h3 className="admin-card-title">Images</h3>
            </div>
            <div className="admin-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label className="admin-label" style={{ marginBottom: 0 }}>Product Images (R2)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="file" ref={uploadInputRef} style={{ display: 'none' }} multiple accept="image/*" onChange={handleImageUpload} />
                  <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => { setGalleryTarget('main'); setGalleryOpen(true); }}>
                    <ImageIcon size={14} /> Browse R2
                  </button>
                  <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => { setGalleryTarget('main'); setBloggerOpen(true); }}>
                    <ImageIcon size={14} /> Browse Blogger
                  </button>
                </div>
              </div>
              <div className="admin-image-gallery" style={{ marginBottom: 12 }}>
                {form.images.map((url, i) => (
                  <div key={i} className="admin-image-gallery-item">
                    <img src={url} alt={`Product ${i + 1}`} />
                    <button type="button" className="admin-image-gallery-remove" onClick={() => removeImage(i)}>
                      <X size={10} />
                    </button>
                    <button type="button" onClick={() => setPreviewImage(url)} style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '4px', padding: '4px', border: 'none', cursor: 'pointer', display: 'flex', zIndex: 2 }} title="View Image">
                      <Search size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header">
              <h3 className="admin-card-title">Pricing & Stock</h3>
            </div>
            <div className="admin-card-body">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label className="admin-label">Price (৳) *</label>
                  <input type="number" className="admin-input" value={form.base_price} onChange={e => updateField('base_price', e.target.value)} onWheel={(e) => (e.target as HTMLInputElement).blur()} placeholder="0" min="0" step="0.01" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Compare at Price (৳)</label>
                  <input type="number" className="admin-input" value={form.original_price || ''} onChange={e => updateField('original_price', e.target.value)} onWheel={(e) => (e.target as HTMLInputElement).blur()} placeholder="Strike-through price" min="0" step="0.01" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">SKU</label>
                  <input type="text" className="admin-input" value={form.sku} onChange={e => updateField('sku', e.target.value)} placeholder="SKU-001" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Stock</label>
                  <input type="number" className="admin-input" value={form.stock} onChange={e => updateField('stock', e.target.value)} onWheel={(e) => (e.target as HTMLInputElement).blur()} disabled={form.is_unlimited_stock === 1} min="0" />
                </div>
              </div>
              <label className="admin-toggle" style={{ marginTop: 8 }}>
                <input type="checkbox" checked={form.is_unlimited_stock === 1} onChange={e => updateField('is_unlimited_stock', e.target.checked ? 1 : 0)} />
                <span className="admin-toggle-track" />
                <span className="admin-toggle-label">Unlimited Stock</span>
              </label>
            </div>
          </div>

          {/* Variants */}
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="admin-card-title">Variants</h3>
              <label className="admin-bg-primary-light" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, padding: '0.35rem 0.9rem', borderRadius: 20, userSelect: 'none' }}>
                <input type="checkbox" checked={form.is_variant_bulk_mode === 1} onChange={e => updateField('is_variant_bulk_mode', e.target.checked ? 1 : 0)} style={{ width: 15, height: 15, accentColor: '#1E40AF' }} />
                🛒 Variant Bulk Mode
              </label>
            </div>
            <div className="admin-card-body">
                {/* Option Groups Builder */}
                <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>Option Groups</h4>
                  {optionGroups.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                      {optionGroups.map((g, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <input type="text" className="admin-input" placeholder="Name (e.g. Size)" value={g.name} onChange={e => updateOptionGroup(i, 'name', e.target.value)} style={{ flex: 1 }} />
                            <input type="text" className="admin-input" placeholder="Values (comma separated)" value={g.values} onChange={e => updateOptionGroup(i, 'values', e.target.value)} style={{ flex: 2 }} />
                            <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => removeOptionGroup(i)} style={{ color: '#ef4444', padding: '8px' }}><Trash2 size={16} /></button>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                            {!g.name && (
                              <>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Popular Names:</span>
                                {Object.keys(QUICK_VALUES_MAP).map(n => (
                                  <button key={n} type="button" onClick={() => updateOptionGroup(i, 'name', n)} className="admin-bg-gray-light admin-text-muted" style={{ border: 'none', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', cursor: 'pointer', transition: '0.2s' }}>{n}</button>
                                ))}
                              </>
                            )}
                            {g.name && (
                              <>
                                {(() => {
                                  // Find matching key (case-insensitive)
                                  const matchKey = Object.keys(QUICK_VALUES_MAP).find(k => k.toLowerCase() === g.name.toLowerCase());
                                  const valuesToShow = matchKey ? QUICK_VALUES_MAP[matchKey] : QUICK_VALUES_MAP['Size']; // fallback to Size if unknown, or just show nothing? Let's show Size as fallback, or empty array. Wait, showing Size for 'Flavor' is bad. If no match, show nothing or a generic mix.
                                  const actualValuesToShow = matchKey ? QUICK_VALUES_MAP[matchKey] : [];
                                  
                                  if (actualValuesToShow.length === 0) return null;
                                  
                                  return (
                                    <>
                                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Quick Values:</span>
                                      {actualValuesToShow.map(v => (
                                        <button key={v} type="button" onClick={() => {
                                          const currentVals = g.values ? g.values.split(',').map(s=>s.trim()).filter(Boolean) : [];
                                          if (!currentVals.includes(v)) {
                                            updateOptionGroup(i, 'values', [...currentVals, v].join(', '));
                                          }
                                        }} className="admin-bg-gray-light admin-text-muted" style={{ border: 'none', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', cursor: 'pointer', transition: '0.2s' }}>{v}</button>
                                      ))}
                                    </>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="admin-btn admin-btn-secondary" onClick={addOptionGroup}><Plus size={14} /> Add Option</button>
                    {optionGroups.length > 0 && (
                      <button type="button" className="admin-btn admin-btn-primary" onClick={generateVariantsFromOptions}>Generate Variants</button>
                    )}
                  </div>
                </div>

                {variants.length > 0 && (
                  <div className="admin-bg-surface" style={{ marginBottom: 16, padding: 12, border: '1px solid var(--admin-border-light)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                       <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>Bulk Actions</h4>
                       <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={autoGenerateSKUs}>
                         <Wand2 size={14} /> Auto-Generate SKUs
                       </button>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                       <input type="number" className="admin-input" placeholder="Price" value={bulkEditPrice} onChange={e => setBulkEditPrice(e.target.value)} style={{ width: 100 }} />
                       <input type="number" className="admin-input" placeholder="Compare Price" value={bulkEditOriginalPrice} onChange={e => setBulkEditOriginalPrice(e.target.value)} style={{ width: 120 }} />
                       <input type="number" className="admin-input" placeholder="Stock" value={bulkEditStock} onChange={e => setBulkEditStock(e.target.value)} style={{ width: 100 }} />
                       <button type="button" className="admin-btn admin-btn-primary" onClick={applyBulkEdit}>Apply to All</button>
                    </div>
                  </div>
                )}

                {variants.length === 0 ? (
                  <div className="admin-empty-state" style={{ padding: '20px 16px' }}>
                    <p>No variants added yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {variants.map((v, i) => (
                      <div key={i} className="admin-bg-surface admin-border-b" style={{ padding: 12, borderRadius: 10, border: '1px solid var(--admin-border-light)' }}>
                        <div className="admin-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                          <div className="admin-form-group" style={{ marginBottom: 8 }}>
                            <label className="admin-label">Variant Name *</label>
                            <input type="text" className="admin-input" value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} placeholder="e.g. Red / XL" />
                          </div>
                          <div className="admin-form-group" style={{ marginBottom: 8 }}>
                            <label className="admin-label">Price (৳)</label>
                            <input type="number" className="admin-input" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} onWheel={(e) => (e.target as HTMLInputElement).blur()} min="0" step="0.01" />
                          </div>
                          <div className="admin-form-group" style={{ marginBottom: 8 }}>
                            <label className="admin-label">Stock</label>
                            <input type="number" className="admin-input" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} onWheel={(e) => (e.target as HTMLInputElement).blur()} min="0" />
                          </div>
                          <div className="admin-form-group" style={{ marginBottom: 8 }}>
                            <label className="admin-label">SKU</label>
                            <input type="text" className="admin-input" value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} />
                          </div>
                          <div className="admin-form-group" style={{ marginBottom: 8 }}>
                            <label className="admin-label">Compare Price</label>
                            <input type="number" className="admin-input" value={v.original_price || ''} onChange={e => updateVariant(i, 'original_price', e.target.value)} onWheel={(e) => (e.target as HTMLInputElement).blur()} min="0" step="0.01" />
                          </div>
                          <div className="admin-form-group" style={{ marginBottom: 8 }}>
                            <label className="admin-label">Image URL</label>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {v.image_url && (
                                <div style={{ position: 'relative', display: 'flex' }}>
                                  <img src={v.image_url} alt="Variant preview" style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 4, border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', display: 'block' }} />
                                  <button 
                                    type="button" 
                                    onClick={() => updateVariant(i, 'image_url', '')} 
                                    style={{ position: 'absolute', top: -6, right: -6, background: 'var(--admin-danger, #ef4444)', color: 'white', borderRadius: '50%', padding: 2, border: 'none', cursor: 'pointer', display: 'flex', zIndex: 2 }}
                                    title="Remove Image"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              )}
                              <input type="text" className="admin-input" style={{ flex: 1 }} value={v.image_url || ''} onChange={e => updateVariant(i, 'image_url', e.target.value)} placeholder="URL" />
                              <button type="button" className="admin-btn admin-btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setGalleryTarget(i); setGalleryOpen(true); }} title="Browse Gallery"><Images size={14} style={{ color: 'var(--admin-primary)' }} /></button>
                              <button type="button" className="admin-btn admin-btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setGalleryTarget(i); setBloggerOpen(true); }} title="Browse Blogger"><ImageIcon size={14} style={{ color: '#ec4899' }} /></button>
                              <button type="button" className="admin-btn admin-btn-outline" style={{ padding: '0 8px' }} onClick={() => applyImageToMatchingVariants(i)} title="Smart Apply Image (e.g. to all same colors)"><Wand2 size={14} style={{ color: '#8b5cf6' }} /></button>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => removeVariant(i)}>
                            <Trash2 size={13} style={{ color: '#ef4444' }} /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" className="admin-btn admin-btn-secondary" style={{ marginTop: 12, width: '100%' }} onClick={addVariant}>
                  <Plus size={16} /> Add Variant Row Manually
                </button>
              </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Categories */}
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="admin-card-title">Categories</h3>
              <button 
                type="button" 
                className="admin-btn admin-btn-ghost admin-btn-sm admin-text-primary" 
                style={{ padding: '4px 8px' }} 
                onClick={() => setCatModalOpen(true)}
              >
                <Plus size={14} /> Add new
              </button>
            </div>
            <div className="admin-card-body">
              <label className="admin-label">Multi-Category Selection</label>
              
              {/* Selected Category Pills */}
              {selectedCategories.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {selectedCategories.map(catId => {
                    const c = categories.find(x => x.id === catId);
                    if (!c) return null;
                    return (
                      <span key={catId} className="admin-bg-gray-light admin-text-primary-dark" style={{ border: '1px solid var(--admin-border-light)', padding: '4px 8px', borderRadius: 16, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {c.name}
                        <X size={12} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => toggleCategory(catId)} />
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Search Box */}
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  className="admin-input" 
                  placeholder="Search categories..." 
                  value={catSearch} 
                  onChange={e => setCatSearch(e.target.value)}
                  style={{ paddingLeft: 32, fontSize: '0.85rem', padding: '6px 12px 6px 32px' }} 
                />
              </div>

              {/* Category List */}
              <div className="admin-bg-surface admin-border-b" style={{ maxHeight: 250, overflowY: 'auto', border: '1px solid var(--admin-border-light)', borderRadius: 8, padding: 8 }}>
                {categories.length === 0 ? (
                  <div style={{ padding: 12, textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>No categories found</div>
                ) : (() => {
                  const query = catSearch.toLowerCase();
                  const mainCats = categories.filter(c => !c.parent_id).sort((a,b) => a.sort_order - b.sort_order);
                  
                  let hasMatch = false;
                  const result = mainCats.map(main => {
                    const subCats = categories.filter(c => c.parent_id === main.id).sort((a,b) => a.sort_order - b.sort_order);
                    const mainMatches = main.name.toLowerCase().includes(query);
                    const matchingSubs = subCats.filter(s => s.name.toLowerCase().includes(query));
                    
                    if (!mainMatches && matchingSubs.length === 0 && query) return null;
                    hasMatch = true;

                    const subsToRender = (query && !mainMatches) ? matchingSubs : subCats;

                    return (
                      <div key={main.id} style={{ marginBottom: 4 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', borderRadius: 6, fontSize: '0.85rem', color: 'var(--admin-text)', fontWeight: 600, background: selectedCategories.includes(main.id) ? 'var(--admin-primary-light, rgba(99,102,241,0.1))' : 'transparent' }}>
                          <input type="checkbox" checked={selectedCategories.includes(main.id)} onChange={() => toggleCategory(main.id)} style={{ accentColor: 'var(--admin-primary, #6366f1)' }} />
                          {main.name}
                        </label>
                        {subsToRender.length > 0 && (
                          <div style={{ paddingLeft: 24, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {subsToRender.map(sub => (
                              <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', cursor: 'pointer', borderRadius: 6, fontSize: '0.8rem', color: 'var(--admin-text-secondary)', background: selectedCategories.includes(sub.id) ? 'var(--admin-primary-light, rgba(99,102,241,0.1))' : 'transparent' }}>
                                <input type="checkbox" checked={selectedCategories.includes(sub.id)} onChange={() => toggleCategory(sub.id)} style={{ accentColor: 'var(--admin-primary, #6366f1)' }} />
                                {sub.name}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });

                  return hasMatch ? result : <div style={{ padding: 12, textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>No matches found</div>;
                })()}
              </div>
            </div>
          </div>

          {/* Brand */}
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header">
              <h3 className="admin-card-title">Organization</h3>
            </div>
            <div className="admin-card-body">
              <div className="admin-form-group">
                {form.brand && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    <span className="admin-bg-gray-light admin-text-primary-dark" style={{ border: '1px solid var(--admin-border-light)', padding: '4px 8px', borderRadius: 16, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {form.brand}
                      <X size={12} style={{ cursor: 'pointer', color: 'var(--admin-text-muted)' }} onClick={() => updateField('brand', '')} />
                    </span>
                  </div>
                )}
                
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
                  <input 
                    type="text" 
                    className="admin-input" 
                    placeholder="Search brands..." 
                    value={brandSearch} 
                    onChange={e => setBrandSearch(e.target.value)}
                    style={{ paddingLeft: 32, fontSize: '0.85rem', padding: '6px 12px 6px 32px' }} 
                  />
                </div>

                <div className="admin-bg-surface admin-border-b" style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--admin-border-light)', borderRadius: 8, padding: 8 }}>
                  {(() => {
                    const PREDEFINED_BRANDS = [
                      'SKIN1004', 'Beauty of Joseon', 'COSRX', 'Anua', 'Round Lab', 'AXIS-Y', 'Torriden',
                      'Some By Mi', 'Haruharu Wonder', 'The Face Shop', 'Laneige', 'Medi-Peel', 'Aplb',
                      'Dabo', 'Kerasys', 'Nature Skin', 'Tocobo', 'iUNIK', 'Dr. Ceuracle', 'Dr.Althea',
                      'TIAM', 'Isntree', 'Purito', 'Missha', 'Tonymoly', 'Holika Holika', 'Raip', 'Medicube',
                      'Green Finger', 'The Ordinary'
                    ];
                    const query = brandSearch.toLowerCase();
                    const visibleBrands = PREDEFINED_BRANDS.filter(b => b.toLowerCase().includes(query));
                    const hasExactMatch = PREDEFINED_BRANDS.some(b => b.toLowerCase() === query);

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {visibleBrands.length === 0 && !brandSearch && (
                          <div style={{ padding: 12, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.82rem' }}>No brands found</div>
                        )}
                        
                        {visibleBrands.map(b => (
                          <label key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', borderRadius: 6, fontSize: '0.85rem', color: 'var(--admin-text)', fontWeight: 500, background: form.brand === b ? 'var(--admin-primary-light, rgba(99,102,241,0.1))' : 'transparent' }}>
                            <input type="checkbox" checked={form.brand === b} onChange={() => { updateField('brand', form.brand === b ? '' : b); setBrandSearch(''); }} style={{ accentColor: 'var(--admin-primary, #6366f1)' }} />
                            {b}
                          </label>
                        ))}

                        {brandSearch && !hasExactMatch && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', borderRadius: 6, fontSize: '0.85rem', color: 'var(--admin-text)', fontWeight: 500, background: form.brand === brandSearch ? 'var(--admin-primary-light, rgba(99,102,241,0.1))' : 'transparent' }}>
                            <input type="checkbox" checked={form.brand === brandSearch} onChange={() => { updateField('brand', form.brand === brandSearch ? '' : brandSearch); setBrandSearch(''); }} style={{ accentColor: 'var(--admin-primary, #6366f1)' }} />
                            {brandSearch} <span style={{ fontSize: '0.75rem', color: 'var(--admin-primary)', marginLeft: 'auto' }}>Add new</span>
                          </label>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Tags</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {form.tags.map(tag => (
                    <span key={tag} className="admin-bg-primary-light admin-inline-badge" style={{ padding: '3px 10px' }}>
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: 0, fontSize: '0.85rem', lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    className="admin-input"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Add tag..."
                  />
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={addTag}>Add</button>
                </div>
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Popular:</span>
                  {['New Arrival', 'Best Seller', 'Featured', 'Trending', 'Discounted', 'Limited Edition', 'Top Rated', 'Restocked'].map(t => (
                    <button type="button" key={t} onClick={() => { setTagInput(t); setTimeout(() => addTag(), 0); }} className="admin-bg-gray-light admin-text-muted" style={{ border: '1px solid var(--admin-border-light)', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}>
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header">
              <h3 className="admin-card-title">Product & Delivery Type</h3>
            </div>
            <div className="admin-card-body">
              <div style={{ display: 'flex', gap: 20, marginBottom: form.requires_shipping === 1 ? 20 : 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                  <input type="radio" checked={form.requires_shipping === 1} onChange={() => updateField('requires_shipping', 1)} style={{ accentColor: 'var(--admin-primary)' }} />
                  🚚 Physical Product
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                  <input type="radio" checked={form.requires_shipping === 0} onChange={() => updateField('requires_shipping', 0)} style={{ accentColor: 'var(--admin-primary)' }} />
                  ☁️ Digital Product
                </label>
              </div>

              {form.requires_shipping === 1 && (
                <>
                  <label className="admin-toggle" style={{ marginBottom: 12 }}>
                    <input type="checkbox" checked={form.free_delivery === 1} onChange={e => updateField('free_delivery', e.target.checked ? 1 : 0)} />
                    <span className="admin-toggle-track" />
                    <span className="admin-toggle-label">Always Free Delivery</span>
                  </label>
                  <div className="admin-form-grid">
                    <div className="admin-form-group">
                      <label className="admin-label">Free if qty ≥</label>
                      <input type="number" className="admin-input" value={form.free_delivery_min_qty} onChange={e => updateField('free_delivery_min_qty', e.target.value)} onWheel={(e) => (e.target as HTMLInputElement).blur()} min="0" />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Free if total ≥</label>
                      <input type="number" className="admin-input" value={form.free_delivery_min_amount} onChange={e => updateField('free_delivery_min_amount', e.target.value)} onWheel={(e) => (e.target as HTMLInputElement).blur()} min="0" />
                    </div>
                  </div>
                </>
              )}
              
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--admin-border-light)' }}>
                <label className="admin-toggle">
                  <input type="checkbox" checked={form.is_flash_sale === 1} onChange={e => updateField('is_flash_sale', e.target.checked ? 1 : 0)} />
                  <span className="admin-toggle-track" />
                  <span className="admin-toggle-label">Flash Sale</span>
                </label>
              </div>
            </div>
          </div>

          {/* Digital Assets */}
          {form.requires_shipping === 0 && (
            <div className="admin-card" style={{ marginBottom: 16 }}>
              <div className="admin-card-header">
                <h3 className="admin-card-title">Digital Assets</h3>
              </div>
              <div className="admin-card-body">
                {digitalAssets.map((asset: any, i) => (
                  <div key={i} className="admin-bg-surface admin-border-b" style={{ padding: 12, borderRadius: 10, border: '1px solid var(--admin-border-light)', marginBottom: 12 }}>
                    <div className="admin-form-group" style={{ marginBottom: 8 }}>
                      <label className="admin-label">File Name (e.g. eBook PDF)</label>
                      <input type="text" className="admin-input" value={asset.name || ''} onChange={e => {
                        const newAssets = [...digitalAssets];
                        newAssets[i].name = e.target.value;
                        setDigitalAssets(newAssets);
                      }} />
                    </div>
                    <div className="admin-form-group" style={{ marginBottom: 8 }}>
                      <label className="admin-label">File URL / Download Link</label>
                      <input type="text" className="admin-input" value={asset.file_url || ''} placeholder="https://..." onChange={e => {
                        const newAssets = [...digitalAssets];
                        newAssets[i].file_url = e.target.value;
                        setDigitalAssets(newAssets);
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setDigitalAssets(digitalAssets.filter((_, idx) => idx !== i))}>
                        <Trash2 size={13} style={{ color: '#ef4444' }} /> Remove Asset
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="admin-btn admin-btn-secondary" style={{ width: '100%' }} onClick={() => setDigitalAssets([...digitalAssets, { name: '', file_url: '' }])}>
                  <Plus size={16} /> Add Digital Asset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Gallery Picker Component */}
      <GalleryPicker 
        defaultFolder="products/"
        isOpen={galleryOpen} 
        onClose={() => setGalleryOpen(false)} 
        onSelect={handleGallerySelect} 
      />
      <BloggerGalleryModal 
        isOpen={bloggerOpen} 
        onClose={() => setBloggerOpen(false)} 
        onSelect={handleGallerySelect} 
      />


      {/* Category Modal */}
      {catModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setCatModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Add Category</h3>
              <button type="button" className="admin-modal-close" onClick={() => setCatModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-label">Name *</label>
                <input type="text" className="admin-input" value={catForm.name} onChange={e => handleCatNameChange(e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Slug</label>
                <input type="text" className="admin-input" value={catForm.slug} onChange={e => setCatForm(p => ({ ...p, slug: e.target.value }))} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Parent Category</label>
                <select className="admin-select" value={catForm.parent_id} onChange={e => setCatForm(p => ({ ...p, parent_id: e.target.value }))}>
                  <option value="">None (Main Category)</option>
                  {categories.filter(c => !c.parent_id).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Image</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {catForm.image_url && (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={catForm.image_url} alt="" className="admin-image-preview" style={{ width: 60, height: 60, display: 'block' }} />
                      <button 
                        type="button" 
                        onClick={() => setCatForm(p => ({ ...p, image_url: '' }))} 
                        style={{ position: 'absolute', top: -6, right: -6, background: 'var(--admin-danger, #ef4444)', color: 'white', borderRadius: '50%', padding: 2, border: 'none', cursor: 'pointer', display: 'flex', zIndex: 2 }}
                        title="Remove Image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setCatGalleryOpen(true)} title="Upload or Browse Media">
                    <Upload size={14} /> Browse Media
                  </button>
                  <input type="text" className="admin-input" value={catForm.image_url} onChange={e => setCatForm(p => ({ ...p, image_url: e.target.value }))} placeholder="Or paste URL" style={{ flex: 1 }} />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Description</label>
                <textarea className="admin-textarea" rows={2} value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => setCatModalOpen(false)}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={handleCatSave} disabled={savingCat}>
                {savingCat ? 'Saving...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <GalleryPicker 
        defaultFolder="categories/"
        isOpen={catGalleryOpen} 
        onClose={() => setCatGalleryOpen(false)} 
        onSelect={(url) => { setCatForm(p => ({ ...p, image_url: url })); setCatGalleryOpen(false); }} 
      />

      {/* Image Preview Modal */}
      {previewImage && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 999999, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} alt="Preview" />
          <button type="button" onClick={() => setPreviewImage(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', border: 'none', color: 'white', cursor: 'pointer', padding: 8, display: 'flex' }}>
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
