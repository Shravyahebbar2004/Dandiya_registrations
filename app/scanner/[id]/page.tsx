'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function ScannerPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  const router = useRouter();

  const scannerRef = useRef<any>(null);
  const isScanningRef = useRef(true);

  const [scanResult, setScanResult] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');
  const [scannerActive, setScannerActive] = useState<boolean>(true);

  // Sound Feedback Generator
  const playSound = (isSuccess: boolean) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        if (isSuccess) {
          navigator.vibrate([100, 50, 100]);
        } else {
          navigator.vibrate([300]);
        }
      }

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime); // Low pitch A3
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Audio context suppressed by browser policy if no gesture
    }
  };

  // =====================================
  // AUTH CHECK
  // =====================================

  useEffect(() => {
    const token =
      localStorage.getItem('scanner_token') ||
      localStorage.getItem('admin_token') ||
      sessionStorage.getItem('admin_token') ||
      sessionStorage.getItem('scanner_token');

    if (!token) {
      setIsAuthorized(false);
      router.push('/scanner-login');
      return;
    }

    setIsAuthorized(true);
  }, [router]);

  // =====================================
  // VERIFY TICKET FUNCTION
  // =====================================

  const handleVerifyCode = async (decodedText: string) => {
    if (!isScanningRef.current) return;
    isScanningRef.current = false;
    setLoading(true);

    try {
      const token =
        localStorage.getItem('scanner_token') ||
        localStorage.getItem('admin_token') ||
        sessionStorage.getItem('admin_token') ||
        sessionStorage.getItem('scanner_token');

      if (!token) {
        setIsAuthorized(false);
        router.push('/scanner-login');
        return;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/verify-ticket`,
        {
          qr_token: decodedText
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = response.data;
      setScanResult(data);

      if (data.success) {
        playSound(true);
      } else {
        playSound(false);
      }
    } catch (error: any) {
      console.error('Scan Error:', error);
      playSound(false);
      if (error.response?.status === 401) {
        localStorage.removeItem('scanner_token');
        localStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('scanner_token');
        setIsAuthorized(false);
        router.push('/scanner-login');
        return;
      }

      setScanResult({
        success: false,
        message: error.response?.data?.message || 'Network connection or server error'
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // INITIALIZE SCANNER
  // =====================================

  useEffect(() => {
    if (!isAuthorized) return;

    let html5QrcodeScanner: any = null;

    const startScanner = async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');

        html5QrcodeScanner = new Html5QrcodeScanner(
          'reader',
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250
            },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
          },
          false
        );

        html5QrcodeScanner.render(
          (decodedText: string) => {
            handleVerifyCode(decodedText);
          },
          () => {
            // Silence silent scan frame errors
          }
        );

        scannerRef.current = html5QrcodeScanner;
        setScannerActive(true);
      } catch (err) {
        console.error('Failed to start camera scanner:', err);
        setScannerActive(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [isAuthorized]);

  const resumeScanning = () => {
    setScanResult(null);
    setManualInput('');
    isScanningRef.current = true;
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-amber-300 font-bold text-sm tracking-wide">
            Authenticating Scanner Access...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 relative overflow-hidden">
      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-amber-500/15 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-orange-500/15 blur-[180px] rounded-full animate-pulse" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-2">
              <span>📷</span> QR Scanner
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
              Live Event Gate Verification Portal
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('scanner_token');
              localStorage.removeItem('admin_token');
              sessionStorage.removeItem('admin_token');
              sessionStorage.removeItem('scanner_token');
              router.push('/scanner-login');
            }}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition"
          >
            Logout
          </button>
        </div>

        {/* SCANNER CAMERA BOX */}
        <div className={`bg-zinc-900/90 border-2 border-amber-500/30 rounded-3xl p-5 shadow-2xl transition-all ${scanResult ? 'hidden' : 'block'}`}>
          <div className="text-center mb-3">
            <span className="inline-block bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {loading ? 'Verifying Ticket...' : 'Point camera at attendee QR pass'}
            </span>
          </div>

          <div id="reader" className="overflow-hidden rounded-2xl bg-black border border-white/10" />

          {/* MANUAL INPUT FALLBACK */}
          <div className="mt-5 pt-5 border-t border-white/10">
            <p className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-wider text-center">
              Or Enter Code / Token Manually
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualInput.trim()) {
                  handleVerifyCode(manualInput.trim());
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Paste QR Token string..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="flex-1 bg-black border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={loading || !manualInput.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition disabled:opacity-50"
              >
                Verify
              </button>
            </form>
          </div>
        </div>

        {/* SCAN RESULT OVERLAY */}
        {scanResult && (
          <div className="mt-4 animate-in fade-in zoom-in duration-200">
            {scanResult.success ? (
              <div className="bg-emerald-500/10 border-2 border-emerald-500/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.25)]">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/40 text-emerald-400 text-3xl font-black">
                  ✓
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">
                  ENTRY ALLOWED ✅
                </h2>
                <p className="text-emerald-300/90 text-xs sm:text-sm font-bold uppercase tracking-wider mb-5">
                  Scan Verified Successfully
                </p>

                <div className="bg-black/60 border border-white/10 rounded-2xl p-5 mb-4 text-left space-y-2.5">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Attendee Name</span>
                    <p className="text-2xl font-black text-white">{scanResult.attendee?.full_name}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-white/10">
                    <div>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Pass Type</span>
                      <p className="text-base font-bold text-amber-300">{scanResult.attendee?.ticket_type}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Entries Used</span>
                      <p className="text-2xl font-black text-emerald-400">
                        {scanResult.attendee?.used_entries} / {scanResult.attendee?.allowed_entries}
                      </p>
                    </div>
                  </div>

                  {scanResult.attendee?.phone_number && (
                    <div className="pt-2 border-t border-white/10 flex justify-between text-xs text-gray-400">
                      <span>Phone: <strong className="text-white">{scanResult.attendee.phone_number}</strong></span>
                      {scanResult.attendee.utr && <span>UTR: <strong className="text-amber-300 font-mono">{scanResult.attendee.utr}</strong></span>}
                    </div>
                  )}
                </div>

                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3 text-xs sm:text-sm text-emerald-200 font-bold">
                  {(Number(scanResult.attendee?.allowed_entries) - Number(scanResult.attendee?.used_entries)) > 0
                    ? `🎟️ ${Number(scanResult.attendee?.allowed_entries) - Number(scanResult.attendee?.used_entries)} more entry remaining on this QR pass.`
                    : '🎉 Final entry used! All entries on this pass are now completed.'
                  }
                </div>
              </div>
            ) : (
              <div className="bg-rose-500/10 border-2 border-rose-500/50 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(244,63,94,0.25)]">
                <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-rose-500/40 text-rose-400 text-3xl font-black">
                  ✕
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-rose-400 mb-2">
                  ENTRY DENIED ❌
                </h2>

                <p className="text-lg sm:text-xl font-bold text-white mb-4">
                  {scanResult.message}
                </p>

                {scanResult.attendee && (
                  <div className="bg-black/60 border border-white/10 rounded-2xl p-5 text-left space-y-2.5 mb-4">
                    <div>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Attendee Name</span>
                      <p className="text-xl font-bold text-white">{scanResult.attendee.full_name}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <div>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Pass Type</span>
                        <p className="text-sm font-bold text-amber-300">{scanResult.attendee.ticket_type}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Scans Used</span>
                        <p className="text-xl font-black text-rose-400">
                          {scanResult.attendee.used_entries} / {scanResult.attendee.allowed_entries}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NEXT SCAN BUTTON */}
            <button
              onClick={resumeScanning}
              className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-lg py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/25 active:scale-95"
            >
              SCAN NEXT TICKET
            </button>
          </div>
        )}
      </div>
    </main>
  );
}