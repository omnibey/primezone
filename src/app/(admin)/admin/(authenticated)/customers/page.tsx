"use client";
export const runtime = 'edge';

import { useState, useEffect, useCallback } from "react";
import { Search, Users } from "lucide-react";
import { adminFetch } from "@/utils/adminApi";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const fetchCustomers = useCallback(async (currentPage: number, searchTerm: string) => {
    try {
      setLoading(true);
      setError("");
      const res = await adminFetch(`/customers?page=${currentPage}&limit=50&search=${encodeURIComponent(searchTerm)}`);
      
      if (res && res.customers) {
        setCustomers(res.customers);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalCustomers(res.pagination?.total || 0);
      } else {
        setError("Failed to load customers.");
      }
    } catch (err: any) {
      setError(err.message || "Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(page, appliedSearch);
  }, [page, appliedSearch, fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Customers</h1>
          <p>Total {totalCustomers} registered customers</p>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: "20px", padding: "16px" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input"
              style={{ paddingLeft: "38px", width: "100%" }}
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">
            Search
          </button>
        </form>
      </div>

      {error && <div className="admin-alert admin-alert-danger" style={{ marginBottom: "20px" }}>{error}</div>}

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5}>
                      <div className="admin-skeleton admin-skeleton-text" style={{ width: `${50 + Math.random() * 50}%` }} />
                    </td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-empty-state">
                    <Users size={40} style={{ opacity: 0.3 }} />
                    <p>No customers found</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ 
                          width: "32px", 
                          height: "32px", 
                          background: "var(--primary-color)", 
                          color: "white", 
                          borderRadius: "50%", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          fontSize: "0.9rem", 
                          fontWeight: 600 
                        }}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        {c.name}
                      </div>
                    </td>
                    <td>{c.email}</td>
                    <td>{c.phone || "-"}</td>
                    <td>
                      {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td>
                      <button className="admin-btn admin-btn-secondary" style={{ padding: "6px 12px", fontSize: "0.85rem" }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="admin-btn admin-btn-secondary"
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="admin-btn admin-btn-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
