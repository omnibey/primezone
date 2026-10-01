
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: "center", padding: "6rem 1rem" }}>
      <i className="ph-bold ph-warning-circle" style={{ fontSize: "5rem", color: "var(--primary-color)" }}></i>
      <h1 style={{ marginTop: "1rem" }}>404 - Page Not Found</h1>
      <p style={{ marginBottom: "2rem" }}>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
      <Link href="/" className="btn btn-primary" style={{ display: "inline-block", padding: "0.75rem 2rem", textDecoration: "none" }}>Back to Home</Link>
    </div>
  );
}
