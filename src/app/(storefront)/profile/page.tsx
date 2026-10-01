"use client";
export const runtime = 'edge';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/formatPrice";

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  
  // Guest profile state (legacy, but removed from UI)
  const [guestProfile, setGuestProfile] = useState({ name: "", phone: "", city: "Dhaka", address: "", thana: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (isGuest) {
      router.push("/login");
    }
  }, [isGuest, router]);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("customer_token");
    
    if (token) {
      fetch("/api/v1/customer/profile", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCustomer(data.data.customer);
          setOrders(data.data.orders || []);
          setDownloads(data.data.downloads || []);
          setAddresses(data.data.addresses || []);
        } else {
          // Token invalid or expired
          localStorage.removeItem("customer_token");
          setIsGuest(true);
        }
      })
      .catch(() => setIsGuest(true))
      .finally(() => setLoading(false));
    } else {
      setIsGuest(true);
      setLoading(false);
      try {
        const saved = localStorage.getItem("store_profile");
        if (saved) setGuestProfile(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleGuestSave = (e: any) => {
    e.preventDefault();
    localStorage.setItem("store_profile", JSON.stringify(guestProfile));
    setMsg("Details saved for faster checkout!");
    setTimeout(() => setMsg(""), 3000);
  };

  const logout = () => {
    localStorage.removeItem("customer_token");
    window.location.href = "/login";
  };

  if (!mounted || loading) return <div style={{ padding: "5rem", textAlign: "center", color: "#666" }}>Loading...</div>;

  if (isGuest) {
    return (
      <div style={{ padding: "5rem", textAlign: "center", color: "#666", minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Redirecting to login...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "2rem auto 4rem", padding: "0 1rem" }}>
      <h1 style={{ marginBottom: "2rem" }}>My Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "2rem" }}>
        
        {/* Sidebar */}
        <div className="profile-card">
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{customer?.name}</div>
            <div style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>{customer?.email}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button onClick={() => setActiveTab("orders")} style={{ textAlign: "left", padding: "0.8rem", background: activeTab === "orders" ? "var(--bg-light)" : "transparent", color: activeTab === "orders" ? "var(--primary-color)" : "inherit", border: "none", borderRadius: 4, fontWeight: activeTab === "orders" ? 600 : 500, cursor: "pointer" }}>📦 Order History</button>
            <button onClick={() => setActiveTab("downloads")} style={{ textAlign: "left", padding: "0.8rem", background: activeTab === "downloads" ? "var(--bg-light)" : "transparent", color: activeTab === "downloads" ? "var(--primary-color)" : "inherit", border: "none", borderRadius: 4, fontWeight: activeTab === "downloads" ? 600 : 500, cursor: "pointer" }}>☁️ My Downloads</button>
            <button onClick={() => setActiveTab("addresses")} style={{ textAlign: "left", padding: "0.8rem", background: activeTab === "addresses" ? "var(--bg-light)" : "transparent", color: activeTab === "addresses" ? "var(--primary-color)" : "inherit", border: "none", borderRadius: 4, fontWeight: activeTab === "addresses" ? 600 : 500, cursor: "pointer" }}>📍 Addresses</button>
            <button onClick={logout} style={{ textAlign: "left", padding: "0.8rem", background: "transparent", color: "#DC2626", border: "none", borderRadius: 4, fontWeight: 500, cursor: "pointer", marginTop: "1rem" }}>Log Out</button>
          </div>
        </div>

        {/* Content */}
        <div className="profile-card profile-card-large">
          {activeTab === "orders" && (
            <div>
              <h2 style={{ marginBottom: "1.5rem" }}>Order History</h2>
              {orders.length === 0 ? <p>No orders found.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  {orders.map((o: any) => (
                    <div key={o.id} style={{ border: "1px solid var(--border-color)", padding: 15, borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>Order #{o.id}</div>
                        <div style={{ fontSize: "0.85rem", color: "#666", marginTop: 4 }}>{new Date(o.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 600 }}>৳{formatPrice(o.total_amount)}</div>
                        <div style={{ fontSize: "0.85rem", background: "var(--bg-light)", padding: "2px 8px", borderRadius: 12, display: "inline-block", marginTop: 4 }}>{o.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "downloads" && (
            <div>
              <h2 style={{ marginBottom: "1.5rem" }}>My Downloads</h2>
              {downloads.length === 0 ? <p>No digital downloads available.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  {downloads.map((d: any, idx) => (
                    <div key={idx} style={{ border: "1px solid var(--border-color)", padding: 15, borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
                        <img src={JSON.parse(d.images || "[]")[0] || "https://placehold.co/100x100"} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4 }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{d.product_title}</div>
                          <div style={{ fontSize: "0.9rem", color: "#666", marginTop: 4 }}>File: {d.asset_name}</div>
                          <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 4 }}>Downloads: {d.download_count} {d.download_limit ? `/ ${d.download_limit}` : ''}</div>
                        </div>
                      </div>
                      <a href={`/api/v1/downloads/${d.token}`} target="_blank" className="primary-btn small-btn">
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "addresses" && (
            <div>
              <h2 style={{ marginBottom: "1.5rem" }}>Saved Addresses</h2>
              {addresses.length === 0 ? <p>No addresses saved.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  {addresses.map((a: any) => (
                    <div key={a.id} style={{ border: "1px solid var(--border-color)", padding: 15, borderRadius: 6 }}>
                      <div style={{ fontWeight: 600, marginBottom: 5 }}>{a.name} {a.is_default ? <span style={{ fontSize: "0.75rem", background: "#FEF3C7", color: "#D97706", padding: "2px 6px", borderRadius: 10, marginLeft: 8 }}>Default</span> : ''}</div>
                      <div style={{ color: "#666", fontSize: "0.9rem" }}>{a.phone}</div>
                      <div style={{ color: "#666", fontSize: "0.9rem" }}>{a.street}, {a.city} {a.postal_code}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
