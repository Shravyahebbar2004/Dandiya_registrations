'use client';

import { useEffect } from 'react';

export default function AdminIndexPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin-login';
    }
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 font-bold text-sm">Redirecting to Admin Login Portal...</p>
      </div>
    </div>
  );
}
