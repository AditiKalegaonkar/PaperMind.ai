import React, { useEffect, useState } from 'react';
import bus from './toast.js';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = bus.subscribe((t) => {
      setToasts((prev) => [...prev, { id: Date.now(), ...t }]);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const timer = setTimeout(() => {
      setToasts((t) => t.slice(1));
    }, 3500);
    return () => clearTimeout(timer);
  }, [toasts]);

  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 9999 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ marginBottom: 8, padding: '12px 16px', background: '#323232', color: '#fff', borderRadius: 6, boxShadow: '0 2px 6px rgba(0,0,0,.2)' }}>
          {t.message || 'Notification'}
        </div>
      ))}
    </div>
  );
}
