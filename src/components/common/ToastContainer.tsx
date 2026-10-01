"use client";

import { useEffect, useState } from "react";
import useStore from "@/store/useStore";

const ToastItem = ({ toast, removeToast }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Small delay to allow CSS transition to work after mount
    const showTimer = setTimeout(() => {
      setShow(true);
    }, 10);

    const hideTimer = setTimeout(() => {
      setShow(false);
      // Wait for exit animation before completely removing
      setTimeout(() => {
        removeToast(toast.id);
      }, 300);
    }, 3500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [toast.id, removeToast]);

  return (
    <div 
      className={`toast-msg ${show ? "show" : ""} ${toast.type === "error" ? "toast-error" : ""}`}
      style={{ position: 'relative', top: 'auto', right: 'auto', bottom: 'auto', left: 'auto', transform: show ? 'translate(0)' : 'translate(calc(100% + 40px))', marginBottom: '10px' }}
    >
      {toast.type === "error" ? (
        <i className="ph-bold ph-warning-circle" style={{ color: "#EF4444" }}></i>
      ) : (
        <i className="ph-bold ph-check-circle" style={{ color: "#10B981" }}></i>
      )}
      <span id="toastText">{toast.message}</span>
    </div>
  );
};

export default function ToastContainer() {
  const toasts = useStore((state: any) => state.toasts);
  const removeToast = useStore((state: any) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      zIndex: 10002,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      pointerEvents: 'none'
    }} className="toast-container-wrapper">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
}
