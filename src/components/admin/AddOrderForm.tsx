'use client';

import { useState, useEffect, useRef } from 'react';
import { adminFetch, publicFetch } from '@/utils/adminApi';
import { useToast } from '@/components/admin/ToastContext';
import { useRouter } from 'next/navigation';
import { Suspense, use } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingBag, X, ChevronDown, Globe, MessageCircle, Share2, Camera, Phone, User, HelpCircle } from 'lucide-react';
import { BD_DISTRICTS } from '@/lib/districts';
import OrderLogs from '@/components/admin/OrderLogs';
import AdminVariantSelector from './AdminVariantSelectorModal';

// Define delivery area options
const DELIVERY_AREAS = [
  { val: 'inside', label: 'Inside Dhaka', icon: <Camera size={14} />, help: 'Dhaka City Corporation' },
  { val: 'outside', label: 'Outside Dhaka', icon: <Globe size={14} />, help: 'Anywhere else in BD' }
];

// Define order source options
const ORDER_SOURCES = [
  { val: 'WhatsApp', label: 'WhatsApp', icon: <MessageCircle size={14} /> },
  { val: 'Facebook', label: 'Facebook', icon: <Share2 size={14} /> },
  { val: 'Phone Call', label: 'Phone Call', icon: <Phone size={14} /> },
  { val: 'Website', label: 'Website', icon: <Globe size={14} /> },
  { val: 'In-Store', label: 'In-Store', icon: <User size={14} /> },
];

const AdminSearchableSelect = ({ options, value, onChange, placeholder, disabled, searchPlaceholder = "Search..." }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt: string) => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <div 
        className={`admin-input ${disabled ? 'admin-text-muted' : ''}`} 
        style={{ 
          cursor: disabled ? 'not-allowed' : 'pointer', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: disabled ? 'var(--admin-bg)' : '#fff'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: value ? 'inherit' : 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} style={{ flexShrink: 0, color: 'var(--admin-text-muted)' }} />
      </div>
      {isOpen && !disabled && (
        <div className="admin-bg-surface admin-border" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, borderRadius: 6, marginTop: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: 8, borderBottom: '1px solid var(--admin-border-light)' }}>
            <input 
              type="text" 
              className="admin-input"
              placeholder={searchPlaceholder} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{ padding: '6px 10px', fontSize: '0.85rem' }}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filteredOptions.length > 0 ? filteredOptions.map((opt: string) => (
              <div 
                key={opt}
                style={{ 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  fontSize: '0.85rem',
                  background: value === opt ? 'var(--admin-primary-light)' : 'transparent',
                  color: value === opt ? 'var(--admin-primary-dark)' : 'var(--admin-text)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = value === opt ? 'var(--admin-primary-light)' : 'var(--admin-bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = value === opt ? 'var(--admin-primary-light)' : 'transparent')}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                {opt}
              </div>
            )) : (
              <div style={{ padding: '12px', color: 'var(--admin-text-muted)', textAlign: 'center', fontSize: '0.85rem' }}>No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AddOrderForm({ editId = null }: { editId?: string | null }) {
  const showToast = useToast();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<any>(null);
  const [customer, setCustomer] = useState({
    name: '', phone: '', email: '', address: '', city: '', thana: '', delivery_area: 'outside', source: 'WhatsApp'
  });
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerResults, setSearchCustomerResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerSearchRef = useRef(null);

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paymentProvider, setPaymentProvider] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [deliveryFees, setDeliveryFees] = useState({ inside: 70, outside: 130 });

  // Load existing order if in edit mode
  useEffect(() => {
    if (editId) {
      const loadOrder = async () => {
        try {
          const res = await adminFetch(`/orders/${editId}`);
          if (res && res.order) {
            const o = res.order;
            setCustomer({
              name: o.customer_name || '',
              phone: o.phone || '',
              email: o.email || '',
              address: o.address || '',
              city: o.city || '',
              thana: o.thana || '',
              delivery_area: o.delivery_area || 'outside',
              source: o.source || 'WhatsApp'
            });
            setPaymentMethod(o.payment_method || 'cod');
            setPaymentProvider(o.payment_provider || '');
            setSenderNumber(o.sender_number || '');
            setNotes(o.notes || '');
            setDiscount(o.discount_amount || 0);

            if (o.items && Array.isArray(o.items)) {
              setOrderItems(o.items.map((i: any) => ({
                key: i.variant_id ? `${i.product_id}-${i.variant_id}` : `${i.product_id}`,
                product_id: i.product_id,
                title: i.title,
                variant_name: i.variant || i.variant_name || '',
                variant_id: i.variant_id || null,
                price: i.price,
                quantity: i.quantity,
                image: i.image || '',
                sku: i.sku || ''
              })));
            }
          }
        } catch (err: any) {
        console.error('DEBUG ERROR: ', err);
        }
      };
      loadOrder();
    }
  }, [editId]);

  // Load delivery fees from settings
  useEffect(() => {
    publicFetch('/settings').then(res => {
      const s = res?.data?.settings || res?.settings || {};
      if (s.delivery && typeof s.delivery.insideFee !== 'undefined') {
        setDeliveryFees(prev => ({ ...prev, inside: Number(s.delivery.insideFee) }));
      }
      if (s.delivery && typeof s.delivery.outsideFee !== 'undefined') {
        setDeliveryFees(prev => ({ ...prev, outside: Number(s.delivery.outsideFee) }));
      }
    }).catch(() => {});
  }, []);

  const hasManuallySelectedArea = useRef(false);

  // Bangla Address Phonetic Autocomplete
  const handleAddressBlur = () => {
    if (hasManuallySelectedArea.current) return;
    
    let n = customer.address.trim().toLowerCase();
    if (!n || n.length < 3) return;

    const h: any = {
      ক: "k", খ: "kh", গ: "g", ঘ: "gh", ঙ: "ng",
      চ: "c", ছ: "ch", জ: "j", ঝ: "jh", ঞ: "n",
      ট: "t", ঠ: "th", ড: "d", ড়: "r", ঢ: "dh", ঢ়: "rh", ণ: "n",
      ত: "t", থ: "th", দ: "d", ধ: "dh", ন: "n",
      প: "p", ফ: "f", ব: "b", ভ: "v", ম: "m",
      য: "j", য়: "y", র: "r", ল: "l",
      শ: "sh", ষ: "sh", স: "s", হ: "h",
      "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u",
      "ৃ": "ri", "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou",
      "ং": "ng", "ঃ": "h", "ঁ": "n",
      অ: "o", আ: "a", ই: "i", ঈ: "i", উ: "u", ঊ: "u",
      এ: "e", ঐ: "oi", ও: "o", ঔ: "ou"
    };

    let iStr = "";
    for (let a = 0; a < n.length; a++) {
      const eChar = n[a];
      if (h[eChar]) iStr += h[eChar];
      else if (eChar !== "্") iStr += eChar;
    }
    n = iStr;

    const p = (aStr: string) => {
      return aStr.toLowerCase()
        .replace(/ph/g, "f").replace(/v/g, "b").replace(/z/g, "j").replace(/sh/g, "s").replace(/ch/g, "c")
        .replace(/ou/g, "o").replace(/au/g, "o").replace(/oo/g, "u").replace(/ee/g, "i").replace(/e/g, "a")
        .replace(/y/g, "i").replace(/h/g, "").replace(/(.)\1+/g, "$1");
    };

    let tDist: string | null = null, oThana: string | null = null;
    const l: any[] = [];
    for (const dist in BD_DISTRICTS) {
      l.push({ type: "district", dist: dist, name: dist });
      (BD_DISTRICTS as any)[dist].forEach((th: string) => {
        l.push({ type: "thana", dist: dist, name: th });
      });
    }
    
    l.sort((a, b) => a.type !== b.type ? (a.type === "thana" ? -1 : 1) : b.name.length - a.name.length);

    for (const aItem of l) {
      try {
        const escaped = aItem.name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
        if (new RegExp("\\b" + escaped + "\\b", "i").test(n)) {
          if (aItem.type === "thana") {
            oThana = aItem.name;
            tDist = aItem.dist;
            break;
          } else if (aItem.type === "district" && !tDist) {
            tDist = aItem.dist;
          }
        }
      } catch {}
    }

    if (!oThana) {
      const normN = p(n).replace(/[^a-z0-9]/g, " ");
      for (const eItem of l) {
        const normItem = p(eItem.name).replace(/[^a-z0-9]/g, " ").trim();
        if (normItem.length >= 3 && new RegExp("\\b" + normItem + "\\b", "i").test(normN)) {
          if (eItem.type === "thana") {
            oThana = eItem.name;
            tDist = eItem.dist;
            break;
          } else if (eItem.type === "district" && !tDist) {
            tDist = eItem.dist;
          }
        }
      }
    }

    if (tDist) {
      setCustomer(prev => ({
        ...prev,
        city: tDist as string,
        thana: oThana || prev.thana,
        delivery_area: tDist!.toLowerCase() === "dhaka" ? "inside" : "outside"
      }));
    }
  };

  // Search products
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const data = await adminFetch(`/products?search=${encodeURIComponent(searchQuery)}&limit=10&include_variants=true`);
        setSearchResults(data.products || data || []);
        setShowDropdown(true);
      } catch { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search customers
  useEffect(() => {
    const query = customerSearchQuery.trim().replace(/\D/g, '');
    if (query.length < 5) { setSearchCustomerResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const data = await adminFetch(`/orders?search=${query}&limit=20`);
        const orders = data.orders || [];
        const unique = [];
        const seen = new Set();
        orders.forEach((o: any) => {
          if (!seen.has(o.phone)) { seen.add(o.phone); unique.push(o); }
        });
        setSearchCustomerResults(unique);
        setShowCustomerDropdown(true);
      } catch { setSearchCustomerResults([]); }
    }, 400);
    return () => clearTimeout(timer);
  }, [customerSearchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handler = (e: any) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target)) setShowCustomerDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectCustomer = (c: any) => {
    setCustomer({
      name: c.customer_name || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      city: c.city || '',
      thana: c.thana || '',
      delivery_area: c.city?.toLowerCase().includes('dhaka') ? 'inside' : 'outside',
      source: customer.source
    });
    setCustomerSearchQuery('');
    setShowCustomerDropdown(false);
  };

  const addProduct = (product: any, variant: any = null) => {
    const key = variant ? `${product.id}-${variant.id}` : `${product.id}`;
    if (orderItems.find((i: any) => i.key === key)) {
      setOrderItems(prev => prev.map((i: any) => i.key === key ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      const images = typeof product.images === 'string' ? JSON.parse(product.images || '[]') : product.images || [];
      setOrderItems(prev => [...prev, {
        key,
        product_id: product.id,
        title: product.title,
        variant_name: variant?.name || '',
        variant_id: variant?.id || null,
        price: variant?.price || product.base_price,
        image: variant?.image_url || images[0] || '',
        sku: variant?.sku || product.sku || '',
        quantity: 1,
      }]);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleAddVariants = (items: any[]) => {
    setOrderItems(prev => {
      const newItems = [...prev];
      items.forEach(item => {
        const key = item.variant_id ? `${item.product_id}-${item.variant_id}` : `${item.product_id}`;
        const existing = newItems.find(i => i.key === key);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          newItems.push({
            key,
            product_id: item.product_id,
            title: item.title,
            variant_name: item.variant || '',
            variant_id: item.variant_id || null,
            price: item.price,
            quantity: item.quantity,
            image: item.image || '',
            sku: item.sku || ''
          });
        }
      });
      return newItems;
    });
    setSelectedProductForVariant(null);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const updateQty = (key: string, delta: number) => {
    setOrderItems(prev => prev.map((i: any) => {
      if (i.key !== key) return i;
      const newQty = Math.max(1, i.quantity + delta);
      return { ...i, quantity: newQty };
    }));
  };

  const removeItem = (key: string) => {
    setOrderItems(prev => prev.filter((i: any) => i.key !== key));
  };

  const subtotal = orderItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
  const deliveryFee = customer.delivery_area === 'inside' ? deliveryFees.inside : deliveryFees.outside;
  const total = subtotal + deliveryFee - Number(discount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (orderItems.length === 0) return showToast('Add at least one product', 'error');
    if (!customer.name || !customer.phone || !customer.address || !customer.city) {
      return showToast('Fill in all required customer fields', 'error');
    }

    setSubmitting(true);
    try {
      const items = orderItems.map(i => ({
        product_id: i.product_id,
        title: i.title,
        variant: i.variant_name,
        variant_id: i.variant_id,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
        sku: i.sku,
      }));

      const payload = {
        ...customer,
        items,
        subtotal,
        delivery_fee: deliveryFee,
        total_amount: total,
        payment_method: paymentMethod,
        payment_provider: paymentMethod === 'full' ? paymentProvider : null,
        sender_number: paymentMethod === 'full' ? senderNumber : null,
        notes: notes || null,
        source: customer.source,
        discount_amount: Number(discount || 0),
      };

      if (editId) {
        await adminFetch(`/orders/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast('Order updated successfully!');
      } else {
        await adminFetch('/orders/manual', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('Order created successfully!');
      }

      router.push('/admin/orders');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="new-password">
      <div className="admin-grid-2" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        {/* Left: Customer Info */}
        <div>
          {/* Product Search */}
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-header">
              <h3 className="admin-card-title">Customer Info</h3>
            </div>
            <div className="admin-card-body">
              <div ref={customerSearchRef} style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={16} className="admin-text-muted" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  onFocus={() => customerResults.length > 0 && setShowCustomerDropdown(true)}
                  placeholder="Search past customer (phone number)..."
                  className="admin-input admin-bg-info-light admin-border-info"
                  style={{ paddingLeft: 36 }}
                  autoComplete="new-password"
                />
                {showCustomerDropdown && customerResults.length > 0 && (
                  <div className="admin-search-dropdown">
                    {customerResults.map(c => (
                      <div key={c.id || c.order_id} className="admin-search-item" onClick={() => selectCustomer(c)}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="admin-text-primary-dark" style={{ fontWeight: 500, fontSize: '0.84rem' }}>{c.customer_name}</div>
                          <div className="admin-text-muted" style={{ fontSize: '0.75rem' }}>{c.phone} | {c.city}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Name *</label>
                <input type="text" className="admin-input" value={customer.name} onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))} required autoComplete="new-password" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Phone *</label>
                <input type="text" className="admin-input" value={customer.phone} onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))} required autoComplete="new-password" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Email</label>
                <input type="email" className="admin-input" value={customer.email} onChange={e => setCustomer(p => ({ ...p, email: e.target.value }))} autoComplete="new-password" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Address *</label>
                <textarea className="admin-textarea" rows={2} value={customer.address} onBlur={handleAddressBlur} onChange={e => setCustomer(p => ({ ...p, address: e.target.value }))} required autoComplete="new-password" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Notes</label>
                <textarea className="admin-textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional order notes..." />
              </div>
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label className="admin-label">City/District *</label>
                  <AdminSearchableSelect 
                    options={Object.keys(BD_DISTRICTS).sort()} 
                    value={customer.city} 
                    placeholder="Select District" 
                    onChange={(val: string) => { 
                      hasManuallySelectedArea.current = true;
                      setCustomer(p => ({ 
                        ...p, 
                        city: val, 
                        thana: '',
                        delivery_area: val.toLowerCase() === 'dhaka' ? 'inside' : 'outside' 
                      }));
                    }} 
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Thana</label>
                  <AdminSearchableSelect 
                    options={customer.city && BD_DISTRICTS[customer.city as keyof typeof BD_DISTRICTS] ? BD_DISTRICTS[customer.city as keyof typeof BD_DISTRICTS].sort() : []} 
                    value={customer.thana} 
                    placeholder="Select Thana" 
                    disabled={!customer.city} 
                    onChange={(val: string) => { 
                      setCustomer(p => ({ ...p, thana: val }));
                    }} 
                  />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Delivery Area</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="deliveryArea" value="inside" checked={customer.delivery_area === 'inside'} onChange={() => { hasManuallySelectedArea.current = true; setCustomer(p => ({ ...p, delivery_area: 'inside', city: 'Dhaka', thana: '' }))}} />
                    Inside Dhaka (৳{deliveryFees.inside})
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="deliveryArea" value="outside" checked={customer.delivery_area === 'outside'} onChange={() => { hasManuallySelectedArea.current = true; setCustomer(p => ({ ...p, delivery_area: 'outside', city: '', thana: '' }))}} />
                    Outside Dhaka (৳{deliveryFees.outside})
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Products + Payment + Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Product Search */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Products</h3>
            </div>
            <div className="admin-card-body">
              <div ref={searchRef} style={{ position: 'relative' }}>
                <Search size={16} className="admin-text-muted" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  placeholder="Search products to add..."
                  className="admin-input"
                  style={{ paddingLeft: 36 }}
                />
                {showDropdown && searchResults.length > 0 && (
                  <div className="admin-search-dropdown">
                    {searchResults.map(product => {
                      const images = typeof product.images === 'string' ? JSON.parse(product.images || '[]') : product.images || [];
                      const variants = product.variants || [];
                      const hasVariants = variants.length > 0;
                      
                      if (hasVariants) {
                        return (
                          <div key={product.id} className="admin-search-item" onClick={() => setSelectedProductForVariant(product)}>
                            <img src={images[0] || '/placeholder.png'} alt="" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="admin-text-primary-dark admin-truncate" style={{ fontWeight: 500, fontSize: '0.84rem' }}>
                                {product.title}
                              </div>
                              <div className="admin-text-muted" style={{ fontSize: '0.75rem' }}>Select Variants...</div>
                            </div>
                            <Plus size={16} className="admin-text-primary" style={{ flexShrink: 0 }} />
                          </div>
                        );
                      }
                      return (
                        <div key={product.id} className="admin-search-item" onClick={() => addProduct(product)}>
                          <img src={images[0] || '/placeholder.png'} alt="" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="admin-text-primary-dark admin-truncate" style={{ fontWeight: 500, fontSize: '0.84rem' }}>
                              {product.title}
                            </div>
                            <div className="admin-text-muted" style={{ fontSize: '0.75rem' }}>৳{product.base_price}</div>
                          </div>
                          <Plus size={16} className="admin-text-primary" style={{ flexShrink: 0 }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* INLINE VARIANT SELECTOR */}
              {selectedProductForVariant && (
                <AdminVariantSelector 
                  product={selectedProductForVariant}
                  variants={selectedProductForVariant.variants || []}
                  onClose={() => setSelectedProductForVariant(null)}
                  onAdd={handleAddVariants}
                />
              )}

              {/* Selected Items */}
              {orderItems.length === 0 ? (
                !selectedProductForVariant && (
                  <div className="admin-empty-state" style={{ padding: '32px 16px' }}>
                    <ShoppingBag size={36} />
                    <p>Search and add products to the order</p>
                  </div>
                )
              ) : (
                <div style={{ marginTop: 16 }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map(item => (
                        <tr key={item.key}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {item.image && <img src={item.image} alt="" className="admin-image-preview" style={{ width: 36, height: 36, flexShrink: 0 }} />}
                              <div style={{ minWidth: 0, flex: 1 }}>
                              <div className="admin-text-primary-dark" style={{ fontWeight: 500, fontSize: '0.82rem', maxWidth: '280px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'normal', wordBreak: 'break-word' }}>{item.title}</div>
                              {item.variant_name && <div className="admin-text-muted admin-truncate" style={{ fontSize: '0.72rem', maxWidth: '280px' }}>{item.variant_name}</div>}
                              </div>
                            </div>
                          </td>
                          <td>৳{item.price}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <button type="button" className="admin-btn admin-btn-icon admin-btn-secondary admin-btn-sm" onClick={() => updateQty(item.key, -1)}>
                                <Minus size={12} />
                              </button>
                              <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                              <button type="button" className="admin-btn admin-btn-icon admin-btn-secondary admin-btn-sm" onClick={() => updateQty(item.key, 1)}>
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>৳{(item.price * item.quantity).toLocaleString()}</td>
                          <td>
                            <button type="button" className="admin-btn admin-btn-icon admin-btn-ghost admin-btn-sm admin-text-danger" onClick={() => removeItem(item.key)}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Order Source */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Order Source</h3>
            </div>
            <div className="admin-card-body">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { val: 'Website', label: 'Website', Icon: Globe },
                  { val: 'WhatsApp', label: 'WhatsApp', Icon: MessageCircle },
                  { val: 'Facebook', label: 'Facebook', Icon: Share2 },
                  { val: 'Instagram', label: 'Instagram', Icon: Camera },
                  { val: 'Phone Call', label: 'Phone', Icon: Phone },
                  { val: 'Walk-in', label: 'Walk-in', Icon: User },
                  { val: 'Other', label: 'Other', Icon: HelpCircle },
                ].map(src => (
                  <label key={src.val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '6px 12px', border: customer.source === src.val ? '2px solid var(--admin-primary)' : '1px solid var(--admin-border)', borderRadius: 6, background: customer.source === src.val ? 'var(--admin-primary-light)' : 'transparent' }}>
                    <input type="radio" name="orderSource" value={src.val} checked={customer.source === src.val} onChange={() => setCustomer(p => ({ ...p, source: src.val }))} style={{ display: 'none' }} />
                    <src.Icon size={14} className={customer.source === src.val ? 'admin-text-primary' : 'admin-text-muted'} />
                    <span style={{ fontSize: '0.85rem', fontWeight: customer.source === src.val ? 600 : 400, color: customer.source === src.val ? 'var(--admin-primary)' : 'inherit' }}>{src.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Payment</h3>
            </div>
            <div className="admin-card-body">
              <div className="admin-form-group">
                <label className="admin-label">Method</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                    Cash on Delivery
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="paymentMethod" value="full" checked={paymentMethod === 'full'} onChange={() => setPaymentMethod('full')} />
                    Full Payment
                  </label>
                </div>
              </div>
              {paymentMethod === 'full' && (
                <>
                  <div className="admin-form-group">
                    <label className="admin-label">Provider</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                      {[
                        {name: 'bKash', img: '/gateways/bkash.png'}, 
                        {name: 'Nagad', img: '/gateways/nagad.svg'}, 
                        {name: 'Rocket', img: '/gateways/rocket.png'}, 
                        {name: 'Upay', img: '/gateways/upay.svg'}
                      ].map(provider => (
                        <label key={provider.name} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '6px 12px', border: paymentProvider === provider.name ? '2px solid var(--admin-primary)' : '1px solid var(--admin-border)', borderRadius: 6, background: paymentProvider === provider.name ? 'var(--admin-primary-light)' : 'transparent' }}>
                          <input type='radio' name='provider_full' value={provider.name} checked={paymentProvider === provider.name} onChange={() => setPaymentProvider(provider.name)} style={{ display: 'none' }} /> 
                          <img src={provider.img} alt={provider.name} style={{ height: 24, objectFit: 'contain' }} />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Sender Number</label>
                    <input type="text" className="admin-input" value={senderNumber} onChange={e => setSenderNumber(e.target.value)} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="admin-card">
            <div className="admin-card-body" style={{ padding: 16 }}>
              <div className="admin-text-muted" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                <span>Subtotal ({orderItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="admin-text-muted" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                <span>Delivery</span>
                <span>৳{deliveryFee}</span>
              </div>
              <div className="admin-text-muted" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.85rem', alignItems: 'center' }}>
                <span>Discount</span>
                <input 
                  type="number" 
                  className="admin-input" 
                  style={{ width: 80, padding: '4px 8px', textAlign: 'right' }} 
                  value={discount} 
                  onChange={e => setDiscount(Number(e.target.value) || 0)}
                />
              </div>
              <div className="admin-text-primary-dark admin-border-t" style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontWeight: 700, fontSize: '1.05rem' }}>
                <span>Total</span>
                <span>৳{Math.max(0, total).toLocaleString()}</span>
              </div>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                style={{ width: '100%', marginTop: 16, padding: '12px' }}
                disabled={submitting || orderItems.length === 0}
              >
                {submitting ? (editId ? 'Updating...' : 'Creating Order...') : (editId ? 'Update Order' : 'Create Order')}
              </button>
            </div>
          </div>
          
          {/* Order Logs */}
          {editId && <OrderLogs orderId={editId} />}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </form>
  );
}
