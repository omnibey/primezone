import React, { useState, useEffect } from 'react';
import { adminFetch } from '@/utils/adminApi';
import { useToast } from '@/components/admin/ToastContext';
import { MessageSquare, Clock, Send, User } from 'lucide-react';

export default function OrderLogs({ orderId }: { orderId: string | number }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (orderId) {
      loadLogs();
    }
  }, [orderId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await adminFetch(`/orders/${orderId}/logs`);
      if (res && res.logs) {
        setLogs(res.logs);
      }
    } catch (err: any) {
      addToast('Failed to load order logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      setSubmitting(true);
      await adminFetch(`/orders/${orderId}/logs`, {
        method: 'POST',
        body: JSON.stringify({ note: noteText })
      });
      setNoteText('');
      addToast('Note added', 'success');
      loadLogs();
    } catch (err: any) {
      addToast('Failed to add note', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-card" style={{ border: '1px solid var(--admin-border)', marginTop: 20 }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <MessageSquare size={16} className="admin-text-primary" />
        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-text)' }}>Order Logs & Notes</h4>
      </div>
      
      <div style={{ padding: '20px' }}>
        {/* Add Note Input */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input 
            type="text" 
            className="admin-input" 
            placeholder="Add an internal note..." 
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            disabled={submitting}
          />
          <button 
            className="admin-btn-primary" 
            onClick={handleAddNote} 
            disabled={submitting || !noteText.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Send size={14} /> {submitting ? '...' : 'Add'}
          </button>
        </div>

        {/* Logs List */}
        {loading ? (
          <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No logs yet for this order.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {logs.map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: 12, borderLeft: '2px solid var(--admin-border)', paddingLeft: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--admin-text)', fontWeight: 600 }}>
                      <User size={12} /> {log.admin_name}
                      <span className="admin-badge admin-badge-primary" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>{log.action}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                      <Clock size={12} /> {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  {log.note && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--admin-text)', background: 'var(--admin-bg)', padding: '8px 12px', borderRadius: 6, marginTop: 6 }}>
                      {log.note}
                    </div>
                  )}
                  
                  {log.changes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
                      {(() => {
                        try {
                          const changes = JSON.parse(log.changes);
                          const parts = [];
                          if (changes.status) {
                            parts.push(`Status: ${changes.status.from} \u2192 ${changes.status.to}`);
                          }
                          if (changes.updated_fields) {
                            parts.push(`Changed: ${changes.updated_fields}`);
                          }
                          return parts.join(' | ') || 'Unknown';
                        } catch (e) {
                          return 'Updated';
                        }
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
