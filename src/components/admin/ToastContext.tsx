'use client';

import { createContext, useContext } from 'react';

export const ToastContext = createContext<any>(null);

export function useToast() {
  return useContext(ToastContext);
}
