'use client';
export const runtime = 'edge';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminFetch, triggerRevalidate } from '@/utils/adminApi';
import { useToast } from '../layout';
import Link from 'next/link';
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Package, Filter, X } from 'lucide-react';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('newest');
  
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [deleting, setDeleting] = useState(null);

  // Load categories for filter
  useEffect(() => {
    adminFetch('/categories').then(data => {
      setCategories(data.categories || data || []);
    }).catch(() => {});
  }, []);

  const loadProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      let endpoint = `/products?page=${page}&limit=20`;
      if (statusFilter !== 'all') endpoint += `&status=${statusFilter}`;
      if (appliedSearch.trim()) endpoint += `&search=${encodeURIComponent(appliedSearch.trim())}`;
      if (categoryFilter) endpoint += `&category=${encodeURIComponent(categoryFilter)}`;
      if (brandFilter) endpoint += `&brand=${encodeURIComponent(brandFilter)}`;
      if (modeFilter) endpoint += `&mode=${encodeURIComponent(modeFilter)}`;
      if (sortFilter !== 'newest') endpoint += `&sort=${encodeURIComponent(sortFilter)}`;

      const data = await adminFetch(endpoint);
      const productList = data.products || data || [];
      setProducts(productList);
      setTotalPages(data.pagination?.totalPages || data.totalPages || Math.ceil((data.pagination?.total || data.total || productList.length) / 20) || 1);
      setTotalCount(data.pagination?.total || data.total || productList.length);
      setCurrentPage(page);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, statusFilter, categoryFilter, brandFilter, modeFilter, sortFilter, showToast]);

  const handlePageChange = (page: number) => {
    loadProducts(page);
    // Persist page in URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    // If URL page changes externally (e.g. back button), load that page
    const page = parseInt(searchParams.get('page') || '1', 10);
    if (page !== currentPage) {
      loadProducts(page);
    }
  }, [searchParams, currentPage, loadProducts]);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    loadProducts(page);
  }, [loadProducts, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedSearch(search);
  };

  const deleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setDeleting(id);
    try {
      await adminFetch(`/products/${id}`, { method: 'DELETE' });
      showToast('Product deleted');
      await triggerRevalidate('products');
      loadProducts(currentPage);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(null);
    }
  };

  const getStatusClass = (s) => {
    const map = { active: 'admin-badge-active', draft: 'admin-badge-draft', archived: 'admin-badge-archived' };
    return map[s] || 'admin-badge-draft';
  };

  const hasFilters = statusFilter !== 'all' || categoryFilter || brandFilter || modeFilter || sortFilter !== 'newest' || search;

  const clearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setStatusFilter('all');
    setCategoryFilter('');
    setBrandFilter('');
    setModeFilter('');
    setSortFilter('newest');
  };

  return (
    <div>
      {/* Filters */}
      <div className="admin-card admin-mb-4">
        <div className="admin-card-body admin-p-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="admin-font-bold admin-text-slate-900 admin-text-sm">Products</span>
              <span className="admin-bg-gray-light admin-px-3 admin-py-0.5 admin-rounded-full admin-text-xs admin-font-medium">
                {totalCount} total
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {hasFilters && (
                <button className="admin-btn admin-btn-ghost admin-btn-sm admin-text-danger" onClick={clearFilters}>
                  <X size={14} /> Clear
                </button>
              )}
            </div>
          </div>
          <form onSubmit={handleSearch} className="admin-filter-bar" style={{ marginBottom: 0 }}>
            <div style={{ position: 'relative', flex: 2, minWidth: '180px' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, SKU..."
                className="admin-input"
                style={{ paddingLeft: 36 }}
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-select" style={{ minWidth: 120 }}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="admin-select" style={{ minWidth: 140 }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.name || c.slug}>{c.name}</option>)}
            </select>
            <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="admin-select" style={{ minWidth: 120 }}>
              <option value="">All Brands</option>
              <option value="SKIN1004">SKIN1004</option>
              <option value="Beauty of Joseon">Beauty of Joseon</option>
              <option value="COSRX">COSRX</option>
              <option value="Anua">Anua</option>
              <option value="Round Lab">Round Lab</option>
              <option value="AXIS-Y">AXIS-Y</option>
              <option value="Torriden">Torriden</option>
              <option value="Some By Mi">Some By Mi</option>
              <option value="Haruharu Wonder">Haruharu Wonder</option>
              <option value="The Face Shop">The Face Shop</option>
              <option value="Laneige">Laneige</option>
              <option value="Medi-Peel">Medi-Peel</option>
              <option value="Aplb">Aplb</option>
              <option value="Dabo">Dabo</option>
              <option value="Kerasys">Kerasys</option>
              <option value="Nature Skin">Nature Skin</option>
              <option value="Tocobo">Tocobo</option>
              <option value="iUNIK">iUNIK</option>
              <option value="Dr. Ceuracle">Dr. Ceuracle</option>
              <option value="Dr.Althea">Dr.Althea</option>
              <option value="TIAM">TIAM</option>
              <option value="Isntree">Isntree</option>
              <option value="Purito">Purito</option>
              <option value="Missha">Missha</option>
              <option value="Tonymoly">Tonymoly</option>
              <option value="Holika Holika">Holika Holika</option>
              <option value="Raip">Raip</option>
              <option value="Medicube">Medicube</option>
              <option value="Green Finger">Green Finger</option>
            </select>
            <select value={modeFilter} onChange={e => setModeFilter(e.target.value)} className="admin-select" style={{ minWidth: 120 }}>
              <option value="">All Types</option>
              <option value="non_variant">Non Variant</option>
              <option value="variant">Variant</option>
              <option value="variant_bulk_mode">Variant Bulk Mode</option>
            </select>
            <select value={sortFilter} onChange={e => setSortFilter(e.target.value)} className="admin-select" style={{ minWidth: 140 }}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="stock_low">Stock: Low to High</option>
              <option value="stock_high">Stock: High to Low</option>
            </select>
            <button type="submit" className="admin-btn admin-btn-secondary">
              <Search size={15} /> Search
            </button>
            <Link href="/admin/products/new" className="admin-btn admin-btn-primary" style={{ marginLeft: 'auto' }}>
              <Plus size={15} /> Add Product
            </Link>
          </form>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Product</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j}><div className="admin-skeleton admin-skeleton-text" style={{ width: `${50 + Math.random() * 50}%` }} /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-empty-state">
                    <Package size={40} style={{ opacity: 0.3 }} />
                    <p>No products found</p>
                  </td>
                </tr>
              ) : products.map((product) => {
                const images = typeof product.images === 'string' ? JSON.parse(product.images || '[]') : product.images || [];
                return (
                  <tr key={product.id}>
                    <td className="admin-text-muted" style={{ fontWeight: 600 }}>
                      <div style={{ fontSize: '0.9rem' }}>#{product.id}</div>
                      {product.is_variant_bulk_mode === 1 ? (
                        <div style={{ fontSize: '0.7rem', color: '#8b5cf6', marginTop: 4 }}>Variant Bulk</div>
                      ) : product.variant_count > 0 ? (
                        <div style={{ fontSize: '0.7rem', color: '#8b5cf6', marginTop: 4 }}>Variant</div>
                      ) : (
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>Standard</div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {images[0] ? (
                          <img src={images[0]} alt="" className="admin-image-preview" />
                        ) : (
                          <div className="admin-image-preview admin-bg-gray-light" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={20} className="admin-text-muted" />
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span className="admin-truncate admin-text-primary-dark">{product.title}</span>
                            {product.is_flash_sale === 1 && <span className="admin-inline-badge admin-bg-danger-light">FLASH</span>}
                          </div>
                          {product.brand && (
                            <div className="admin-text-primary" style={{ fontSize: '0.72rem', fontWeight: 600, marginTop: 2 }}>{product.brand}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="admin-text-muted" style={{ fontSize: '0.82rem' }}>
                      {product.mapped_categories || product.category || <span style={{ opacity: 0.5 }}>—</span>}
                    </td>
                    <td className="admin-text-muted" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{product.sku || '-'}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>৳{product.base_price?.toLocaleString()}</div>
                      {product.original_price && (
                        <div className="admin-text-muted" style={{ fontSize: '0.72rem', textDecoration: 'line-through' }}>
                          ৳{product.original_price?.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td>
                      {product.is_unlimited_stock ? (
                        <span className="admin-text-success" style={{ fontWeight: 600, fontSize: '0.82rem' }}>∞</span>
                      ) : (
                        <span className={product.stock < 5 ? 'admin-text-danger' : ''} style={{ fontWeight: 600 }}>
                          {product.stock}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge ${getStatusClass(product.status)}`}>{product.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <a
                          href={`/product/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-btn admin-btn-ghost admin-btn-sm admin-text-primary"
                          title="View on Storefront"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </a>
                        <Link
                          href={`/admin/products/${product.id}/landing`}
                          className="admin-btn admin-btn-ghost admin-btn-sm admin-text-success"
                          title="Design Landing Page"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          onClick={() => deleteProduct(product.id)}
                          disabled={deleting === product.id}
                          title="Delete"
                        >
                          <Trash2 size={14} className="admin-text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
            <div className="admin-pagination">
              <button className="admin-page-btn" disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)}>
                <ChevronLeft size={16} />
              </button>
              {(() => {
                const pages = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else if (currentPage <= 4) {
                  pages.push(1, 2, 3, 4, 5, '...', totalPages);
                } else if (currentPage >= totalPages - 3) {
                  pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                } else {
                  pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                }
                
                return pages.map((page, index) => {
                  if (page === '...') {
                    return <span key={`ellipsis-${index}`} style={{ padding: '0 8px', color: '#94a3b8' }}>...</span>;
                  }
                  return (
                    <button 
                      key={page} 
                      className={`admin-page-btn ${currentPage === page ? 'active' : ''}`} 
                      onClick={() => handlePageChange(page as number)}
                    >
                      {page}
                    </button>
                  );
                });
              })()}
              <button className="admin-page-btn" disabled={currentPage >= totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="admin-loading"><div className="admin-spinner"></div></div>}>
      <ProductsContent />
    </Suspense>
  );
}
