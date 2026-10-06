'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserCheck, QrCode } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();

  const [loginType, setLoginType] = useState<'admin' | 'scanner'>('admin');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (loginType === 'admin') {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`,
          formData
        );
        localStorage.setItem('admin_token', response.data.token);
        router.push(`/admin/${response.data.event_id || 1}`);
      } else {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/scanner/login`,
          formData
        );
        localStorage.setItem('scanner_token', response.data.token);
        router.push(`/scanner/${response.data.event_id || 1}`);
      }
    } catch (err: any) {
      console.log(err);
      setError(err.response?.data?.message || 'Invalid Username or Password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-violet-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-violet-500/20 blur-[180px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-amber-500/20 blur-[180px] rounded-full animate-pulse" />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-[35px] p-8 sm:p-10 shadow-2xl relative z-10"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
          <ShieldCheck className="text-black" size={34} />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-yellow-300 via-white to-violet-300 bg-clip-text text-transparent mb-2">
            Portal Login
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Select portal login mode to continue
          </p>
        </div>

        {/* LOGIN MODE TAB SELECTOR */}
        <div className="flex bg-black/40 border border-white/10 p-1.5 rounded-2xl mb-6 gap-1">
          <button
            type="button"
            onClick={() => { setLoginType('admin'); setError(''); }}
            className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
              loginType === 'admin'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserCheck size={16} />
            <span>Admin Login</span>
          </button>

          <button
            type="button"
            onClick={() => { setLoginType('scanner'); setError(''); }}
            className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
              loginType === 'scanner'
                ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <QrCode size={16} />
            <span>Scanner Login</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm font-bold text-center">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <input
            type="text"
            name="username"
            placeholder={loginType === 'admin' ? "Admin Username" : "Scanner Username"}
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-sm"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-rose-400 text-black font-black py-4 rounded-2xl text-lg transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : loginType === 'admin' ? 'Login as Admin' : 'Login as Scanner'}
        </button>
      </form>
    </main>
  );
}
