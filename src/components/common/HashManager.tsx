"use client";

import { useEffect } from "react";
import useStore from "@/store/useStore";

export default function HashManager() {
  const setCartOpen = useStore((state) => state.setCartOpen);
  const setCheckoutOpen = useStore((state) => state.setCheckoutOpen);
  const isCartOpen = useStore((state) => state.isCartOpen);
  const isCheckoutOpen = useStore((state) => state.isCheckoutOpen);
  const isMobileNavOpen = useStore((state) => state.isMobileNavOpen);

  // 1. Reactive Global Scroll Lock
  useEffect(() => {
    const isAnyDrawerOpen = isCartOpen || isCheckoutOpen || isMobileNavOpen;
    
    if (isAnyDrawerOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.classList.add("drawer-open");
      document.documentElement.classList.add("drawer-open");
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.classList.remove("drawer-open");
      document.documentElement.classList.remove("drawer-open");
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.classList.remove("drawer-open");
      document.documentElement.classList.remove("drawer-open");
    };
  }, [isCartOpen, isCheckoutOpen, isMobileNavOpen]);

  // Hash Sync removed - keeping it purely state-driven for performance

  return null;
}
