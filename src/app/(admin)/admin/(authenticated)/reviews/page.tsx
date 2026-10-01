'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { adminFetch, triggerRevalidate } from '@/utils/adminApi';
import { useToast } from '../layout';
import { Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export default function ReviewsPage() {
  const showToast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/reviews');
      setReviews(data.reviews || data || []);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReviews(); }, []);

  const toggleApprove = async (review) => {
    try {
      await adminFetch(`/reviews/${review.id}`, {
        method: 'PUT',
        body: JSON.stringify({ approved: review.approved ? 0 : 1 }),
      });
      showToast(review.approved ? 'Review unapproved' : 'Review approved');
      await triggerRevalidate('products');
      loadReviews();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const deleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      await adminFetch(`/reviews/${id}`, { method: 'DELETE' });
      showToast('Review deleted');
      await triggerRevalidate('products');
      loadReviews();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const renderStars = (rating) => {
    return (
      <div className="admin-stars">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
    );
  };

  const formatDate = (d) => {
    try { return new Date(d.replace(' ', 'T') + 'Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title"><Star size={18} /> Product Reviews</h3>
          <span className="admin-text-muted" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
            {reviews.length} total
          </span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j}><div className="admin-skeleton admin-skeleton-text" /></td>)}</tr>
                ))
              ) : reviews.length === 0 ? (
                <tr><td colSpan={7} className="admin-empty-state"><Star size={36} /><p>No reviews yet</p></td></tr>
              ) : reviews.map(review => (
                <tr key={review.id}>
                  <td className="admin-text-muted" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{formatDate(review.created_at)}</td>
                  <td className="admin-text-primary-dark admin-truncate" style={{ fontWeight: 500, maxWidth: 200 }}>
                    {review.product_title || `Product #${review.product_id}`}
                  </td>
                  <td>
                    <div className="admin-text-primary-dark" style={{ fontWeight: 500 }}>{review.reviewer_name}</div>
                    {review.verified ? <span className="admin-text-success" style={{ fontSize: '0.68rem', fontWeight: 600 }}>Verified</span> : null}
                  </td>
                  <td>{renderStars(review.rating)}</td>
                  <td className="admin-text-muted admin-truncate" style={{ maxWidth: 250, fontSize: '0.82rem' }}>
                    {review.body || <span className="admin-text-muted" style={{ fontStyle: 'italic' }}>No text</span>}
                  </td>
                  <td>
                    <span className={`admin-badge ${review.approved ? 'admin-badge-delivered' : 'admin-badge-pending'}`}>
                      {review.approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={() => toggleApprove(review)}
                        title={review.approved ? 'Unapprove' : 'Approve'}
                      >
                        {review.approved ?
                          <XCircle size={15} className="admin-text-warning" /> :
                          <CheckCircle size={15} className="admin-text-success" />
                        }
                      </button>
                      <button className="admin-btn admin-btn-ghost admin-btn-sm admin-text-danger" onClick={() => deleteReview(review.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
