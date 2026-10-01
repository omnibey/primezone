"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="container" style={{ textAlign: "center", padding: "6rem 1rem" }}>
      <i className="ph-bold ph-warning-circle" style={{ fontSize: "5rem", color: "var(--error-color)" }}></i>
      <h1 style={{ marginTop: "1rem" }}>Oops! Something went wrong.</h1>
      <p style={{ marginBottom: "2rem" }}>We encountered an unexpected error while loading this page. Our team has been notified.</p>
      
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <button
          onClick={() => reset()}
          className="btn btn-primary"
          style={{ cursor: "pointer" }}
        >
          <i className="ph-bold ph-arrows-clockwise" style={{ marginRight: "5px" }}></i> Try Again
        </button>
        <Link 
          href="/"
          className="btn btn-secondary"
          style={{ textDecoration: "none", background: "var(--bg-light)", color: "var(--text-color)" }}
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
