'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ScannerIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const scannerToken = localStorage.getItem('scanner_token');
    const adminToken = localStorage.getItem('admin_token');
    if (scannerToken || adminToken) {
      router.push('/scanner/1');
    } else {
      router.push('/scanner-login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 font-bold text-sm">Redirecting to Scanner Portal...</p>
      </div>
    </div>
  );
}
