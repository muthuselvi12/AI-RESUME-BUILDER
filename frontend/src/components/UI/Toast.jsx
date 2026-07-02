/**
 * components/UI/Toast.js — Simple toast notification system
 * Usage: import { toast } from './Toast'; then toast.success('Done!')
 */

import React, { useState, useEffect, useCallback } from 'react';

// Global toast state (simple singleton pattern)
let addToastFn = null;

export const toast = {
  success: (msg) => addToastFn?.({ msg, type: 'success' }),
  error:   (msg) => addToastFn?.({ msg, type: 'error' }),
  info:    (msg) => addToastFn?.({ msg, type: 'info' }),
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ msg, type }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  useEffect(() => { addToastFn = addToast; return () => { addToastFn = null; }; }, [addToast]);

  const colors = {
    success: { bg: '#ecfdf5', color: '#059669', border: '#6ee7b7' },
    error:   { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
    info:    { bg: '#eef2ff', color: '#4f46e5', border: '#a5b4fc' },
  };

  return (
    <div style={{ position:'fixed', bottom:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:8 }}>
      {toasts.map(({ id, msg, type }) => {
        const c = colors[type] || colors.info;
        return (
          <div key={id} style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: c.bg,
            color: c.color,
            border: `0.5px solid ${c.border}`,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            animation: 'fadeIn 0.2s ease',
            maxWidth: 320,
          }}>
            {msg}
          </div>
        );
      })}
    </div>
  );
}
