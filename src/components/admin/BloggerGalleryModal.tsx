'use client';

import React, { useEffect } from 'react';

interface BloggerGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function BloggerGalleryModal({ isOpen, onClose, onSelect }: BloggerGalleryModalProps) {
  useEffect(() => {
    if (isOpen) {
      const channel = new BroadcastChannel('store_image_sync');
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'image_click' && event.data?.url) {
          onSelect(event.data.url);
          onClose();
        }
      };
      
      channel.addEventListener('message', handleMessage);
      return () => {
        channel.removeEventListener('message', handleMessage);
        channel.close();
      };
    }
  }, [isOpen, onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', boxSizing: 'border-box' }}>
      <div style={{ background: 'var(--admin-surface)', borderRadius: '12px', width: '100%', maxWidth: '1000px', height: '90vh', maxHeight: '800px', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        
        {/* Header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderRadius: '12px 12px 0 0', background: 'var(--admin-bg)' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Select Image from Blogger</span>
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--admin-text-muted)', lineHeight: 1, padding: '0 4px' }}>
            &times;
          </button>
        </div>

        {/* Iframe */}
        <div style={{ flex: 1, width: '100%', overflow: 'hidden', borderRadius: '0 0 12px 12px' }}>
          <iframe 
            src="/admin/blogger-images.html?picker=true" 
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
