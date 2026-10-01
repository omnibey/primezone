'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Loader2, CloudUpload } from 'lucide-react';
import { adminFetch, uploadToR2 } from '@/utils/adminApi';

interface GalleryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  defaultFolder?: string;
}

export default function GalleryPicker({ isOpen, onClose, onSelect, defaultFolder }: GalleryPickerProps) {
  
  // R2 State
  const [folder, setFolder] = useState(defaultFolder || 'logos/');
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  const uploadInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('store_custom_folders') || '[]');
      if (Array.isArray(saved)) setCustomFolders(saved);
    } catch(e) {}
  }, []);

  // When modal opens → reset folder to defaultFolder (if provided)
  useEffect(() => {
    if (isOpen) {
      const target = defaultFolder || 'logos/';
      setFolder(target);
    }
  }, [isOpen]); // Only fires when open/close changes — NOT on folder change

  // When folder changes (or modal first opens with correct folder) → load images
  useEffect(() => {
    if (isOpen) {
      loadImages(true);
    }
  }, [isOpen, folder]); // fires when folder changes OR modal opens

  const loadImages = async (reset = false) => {
    try {
      setLoading(true);
      setError('');
      
      const prefix = folder;
      
      const data = await adminFetch(`/images?prefix=${encodeURIComponent(prefix)}&t=${Date.now()}`);
      let fetchedImages = data?.images || [];
      
      // Sort newest first
      fetchedImages.sort((a: any, b: any) => {
        if (a.uploaded && b.uploaded) {
          const diff = new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime();
          if (diff !== 0 && !isNaN(diff)) return diff;
        }
        const timeA = parseInt((a.key || '').split('/')[1]?.split('-')[0] || '0');
        const timeB = parseInt((b.key || '').split('/')[1]?.split('-')[0] || '0');
        return timeB - timeA;
      });

      if (reset) {
        setImages(fetchedImages);
        setOffset(0);
      } else {
        setImages(prev => [...prev, ...fetchedImages]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load images.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      setError('');
      const prefix = folder;
      // Remove trailing slash for uploadToR2 if necessary, but uploadToR2 typically takes a folder name.
      // If folder is 'products/', we pass 'products'.
      const targetFolder = prefix.replace(/\/$/, '') || 'uploads';
      
      const fileArray = Array.from(files);
      const uploadPromises = fileArray.map(file => uploadToR2(file, targetFolder));
      const urls = await Promise.all(uploadPromises);
      
      // Auto-select all successful uploads
      urls.forEach(url => onSelect(url));
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload images.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const createNewFolder = () => {
    const rawName = window.prompt("Enter new folder name (e.g. blog-images):\n\nNote: Cloud storage automatically creates the folder when the first image is uploaded.");
    if (!rawName) return;
    const safeName = rawName.toLowerCase().replace(/[^a-z0-9_-]/g, '') + '/';
    if (!safeName || safeName === '/') return;

    const baseFolders = ['products/', 'categories/', 'banners/', 'logos/', ''];
    if (!customFolders.includes(safeName) && !baseFolders.includes(safeName)) {
      const updated = [...customFolders, safeName];
      setCustomFolders(updated);
      localStorage.setItem('store_custom_folders', JSON.stringify(updated));
    }
    setFolder(safeName);
  };

  const deleteImage = async (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      setDeleting(key);
      await adminFetch(`/images/${encodeURIComponent(key)}`, { method: 'DELETE' });
      setImages(prev => prev.filter(img => img.key !== key));
    } catch (err: any) {
      alert(err.message || 'Failed to delete image');
    } finally {
      setDeleting(null);
    }
  };

  if (!isOpen) return null;

  const currentSlice = images.slice(0, offset + limit);
  const hasMore = currentSlice.length < images.length;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', boxSizing: 'border-box' }}>
      <div style={{ background: 'var(--admin-surface)', borderRadius: '12px', width: '100%', maxWidth: '820px', height: '90vh', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        
        {/* Header */}
        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderRadius: '12px 12px 0 0', background: 'var(--admin-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--admin-text)', fontWeight: 600 }}>
              Media Library
            </h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* R2 Toolbar */}
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--admin-border)', display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--admin-surface)' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--admin-text-secondary)', fontWeight: 500 }}>Folder:</span>
                <select 
                  className="admin-input" 
                  style={{ width: '150px', padding: '0.4rem 0.6rem' }}
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                >
                  <option value="products/">products</option>
                  <option value="banners/">banners</option>
                  <option value="categories/">categories</option>
                  <option value="logos/">logos</option>
                  {customFolders.map(f => (
                    <option key={f} value={f}>{f.replace(/\/$/, '')} (custom)</option>
                  ))}
                  <option value="">(Root / All)</option>
                </select>
                <button type="button" className="admin-btn admin-btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={createNewFolder} title="Create New Folder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-1.22-1.82A2 2 0 0 0 7.53 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
                </button>
                
                <div style={{ flex: 1 }} />
                <button type="button" className="admin-btn admin-btn-outline" onClick={() => loadImages(true)} disabled={loading}>
                  {loading ? <Loader2 size={16} className="lucide-spin" /> : 'Refresh'}
                </button>
              </div>

              {/* R2 Grid & Upload */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--admin-bg)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Upload Zone */}
                <div 
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => uploadInputRef.current?.click()}
                  style={{ 
                    flex: 'none', padding: '1.5rem', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', 
                    border: '2px dashed var(--admin-border)', borderRadius: '12px', background: 'var(--admin-surface)', cursor: 'pointer', transition: 'all 0.2s' 
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--admin-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--admin-border)'}
                >
                  <CloudUpload style={{ fontSize: '2.5rem', color: 'var(--admin-text-muted)', width: 40, height: 40 }} />
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--admin-text)', margin: '0 0 4px 0' }}>Upload New Image</p>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', margin: 0 }}>Drag & Drop or click to browse files</p>
                  </div>
                  <button type="button" className="admin-btn admin-btn-primary" style={{ marginLeft: 'auto' }} disabled={uploading}>
                    {uploading ? <Loader2 size={16} className="lucide-spin" /> : 'Browse Files'}
                  </button>
                  <input type="file" ref={uploadInputRef} accept="image/*" multiple style={{ display: 'none' }} onChange={e => e.target.files && handleUpload(e.target.files)} />
                </div>

                {error && <div style={{ color: 'var(--admin-danger)', textAlign: 'center', padding: '1rem', background: 'var(--admin-danger-bg)', borderRadius: '8px' }}>{error}</div>}
                
                <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--admin-text)' }}>Gallery Images</h3>
                  </div>
                  
                  {!loading && currentSlice.length === 0 && !error && (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--admin-text-muted)' }}>
                      <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5, display: 'inline-block' }} />
                      <p>No images found in this folder.</p>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', alignContent: 'start', flex: 1 }}>
                    {currentSlice.map((img: any, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => { onSelect(img.url); onClose(); }}
                        style={{ 
                          background: 'var(--admin-bg)', 
                          border: '1px solid var(--admin-border)', 
                          borderRadius: '8px', 
                          overflow: 'hidden', 
                          cursor: 'pointer',
                          aspectRatio: '1/1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--admin-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                      >
                        <img 
                          src={img.url} 
                          alt={img.key} 
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                          onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span style="font-size:0.75rem;color:#94a3b8;padding:10px;text-align:center;word-break:break-all;">' + img.key + '</span>' }}
                        />
                        <button 
                          onClick={(e) => deleteImage(e, img.key)}
                          disabled={deleting === img.key}
                          style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(220,38,38,0.9)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
                          title="Delete Image"
                        >
                          {deleting === img.key ? <Loader2 size={12} className="lucide-spin" /> : '×'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {hasMore && (
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                      <button 
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={() => setOffset(prev => prev + limit)}
                      >
                        Load More
                      </button>
                    </div>
                  )}
                  
                  {loading && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Loader2 size={20} className="lucide-spin" /> Loading images...
                    </div>
                  )}
                </div>
              </div>
        </div>
      </div>
    </div>
  );
}
