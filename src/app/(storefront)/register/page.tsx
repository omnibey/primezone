"use client";
export const runtime = 'edge';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("customer_token", data.token);
        router.push("/profile");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Create Account</h1>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", padding: "0.8rem", border: "1px solid var(--border-color)", borderRadius: 4, fontSize: "1rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "0.8rem", border: "1px solid var(--border-color)", borderRadius: 4, fontSize: "1rem" }}
          />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "0.8rem", border: "1px solid var(--border-color)", borderRadius: 4, fontSize: "1rem" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="auth-btn"
          style={{ cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
      <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.9rem", color: "var(--text-light)" }}>
        Already have an account? <Link href="/login" style={{ color: "var(--primary-color)", fontWeight: 600 }}>Login</Link>
      </div>
    </div>
  );
}
