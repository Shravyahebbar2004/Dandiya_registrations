'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface AttendeeData {
  registration_id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  ticket_type?: string;
  used_entries: number;
  allowed_entries: number;
  emergency_contact_name?: string;
  utr?: string;
  payment_status?: string;
}

interface ScanResult {
  success: boolean;
  message: string;
  attendee?: AttendeeData;
}

export default function ScannerPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  const router = useRouter();

  const html5QrCodeRef = useRef<any>(null);
  const isScanningRef = useRef<boolean>(true);

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');
  
  // Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  // Sound & Vibration Feedback
  const playSound = (isSuccess: boolean) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        if (isSuccess) {
          navigator.vibrate([100, 50, 100]);
        } else {
          navigator.vibrate([300, 100, 300]);
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

      const data: ScanResult = response.data;
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
        message: error.response?.data?.message || 'Network connection or server verification error'
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // CAMERA START / STOP CONTROLS
  // =====================================

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Camera stop cleanup warning:', e);
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async (targetCameraId?: string) => {
    setIsInitializing(true);
    setCameraError(null);

    try {
      await stopCamera();

      const { Html5Qrcode } = await import('html5-qrcode');

      // Check available cameras & request permissions
      let cameras: Array<{ id: string; label: string }> = [];
      try {
        cameras = await Html5Qrcode.getCameras();
        setAvailableCameras(cameras);
      } catch (permErr: any) {
        console.warn('Camera list warning:', permErr);
      }

      const html5QrCode = new Html5Qrcode('reader');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0
      };

      const onSuccess = (decodedText: string) => {
        handleVerifyCode(decodedText);
      };

      const onError = () => {
        // Suppress frame scan noise
      };

      if (targetCameraId) {
        // Start specific camera by ID
        await html5QrCode.start(targetCameraId, config, onSuccess, onError);
        setSelectedCameraId(targetCameraId);
      } else {
        // Try Environment (Back) Camera first
        try {
          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            onSuccess,
            onError
          );
        } catch (envErr) {
          console.warn('FacingMode environment failed, attempting camera list fallback:', envErr);

          if (cameras.length > 0) {
            // Find back/rear camera in list or pick last camera
            const backCam = cameras.find((c) =>
              /back|rear|environment|main/i.test(c.label)
            ) || cameras[cameras.length - 1];

            await html5QrCode.start(backCam.id, config, onSuccess, onError);
            setSelectedCameraId(backCam.id);
          } else {
            throw new Error('No camera detected or permission denied.');
          }
        }
      }

      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Failed to start camera:', err);
      setCameraError(
        err.message ||
          'Camera access failed. Please ensure camera permissions are granted in your browser settings.'
      );
      setIsCameraActive(false);
    } finally {
      setIsInitializing(false);
    }
  };

  // Start camera on authorization
  useEffect(() => {
    if (isAuthorized) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isAuthorized]);

  const resumeScanning = () => {
    setScanResult(null);
    setManualInput('');
    isScanningRef.current = true;
    if (!isCameraActive) {
      startCamera(selectedCameraId || undefined);
    }
  };

  // File Upload QR Code Reader Fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = html5QrCodeRef.current || new Html5Qrcode('reader');
      
      const decodedText = await html5QrCode.scanFile(file, true);
      if (decodedText) {
        handleVerifyCode(decodedText);
      }
    } catch (err: any) {
      alert('Could not read QR code from image file. Please try another clear image.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse Group Ticket Holder names
  const getGroupMembers = (raw?: string) => {
    if (!raw) return [];
    const cleaned = raw.replace(/^(Attendees|Group Members|Other Holders|Guests):\s*/i, '').trim();
    if (!cleaned) return [];
    return cleaned
      .split(/[,;\n]+/)
      .map((name) => name.trim())
      .filter(Boolean);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-amber-300 font-bold text-sm tracking-wide">
            Authenticating Gatekeeper Access...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-amber-500/15 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-orange-500/15 blur-[180px] rounded-full animate-pulse" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white flex items-center gap-2">
              <span>📷</span> Gate Scanner
            </h1>
            <p className="text-amber-400/80 text-xs sm:text-sm font-semibold mt-0.5">
              Live Mobile Pass Verification & Entry Tracker
            </p>
          </div>

          <button
            onClick={() => {
              stopCamera();
              localStorage.removeItem('scanner_token');
              localStorage.removeItem('admin_token');
              sessionStorage.removeItem('admin_token');
              sessionStorage.removeItem('scanner_token');
              router.push('/scanner-login');
            }}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition"
          >
            Logout
          </button>
        </div>

        {/* SCANNER CAMERA BOX */}
        <div className={`bg-zinc-900/90 border-2 border-amber-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl transition-all ${scanResult ? 'hidden' : 'block'}`}>
          
          {/* CAMERA STATUS BAR & CONTROLS */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                {isCameraActive ? 'Rear Camera Ready' : 'Camera Off'}
              </span>
            </div>

            <div className="flex gap-2">
              {!isCameraActive ? (
                <button
                  onClick={() => startCamera(selectedCameraId || undefined)}
                  disabled={isInitializing}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <span>📷</span> {isInitializing ? 'Starting...' : 'Open Back Camera'}
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 border border-white/10 font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1"
                >
                  <span>⏹️</span> Stop Camera
                </button>
              )}

              {availableCameras.length > 1 && (
                <button
                  onClick={() => {
                    const currentIndex = availableCameras.findIndex((c) => c.id === selectedCameraId);
                    const nextIndex = (currentIndex + 1) % availableCameras.length;
                    startCamera(availableCameras[nextIndex].id);
                  }}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs px-3 py-1.5 rounded-xl transition"
                  title="Switch Camera"
                >
                  🔄 Lens
                </button>
              )}
            </div>
          </div>

          {/* CAMERA VIEWPORT CONTAINER */}
          <div className="relative overflow-hidden rounded-2xl bg-black border border-white/10 min-h-[280px] flex items-center justify-center">
            <div id="reader" className="w-full h-full overflow-hidden" />

            {!isCameraActive && !isInitializing && (
              <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/30 text-3xl">
                  📷
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Camera Scanner Stopped</h3>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Tap the button below to grant camera permission and open the back camera for scanning passes.
                  </p>
                </div>
                <button
                  onClick={() => startCamera(selectedCameraId || undefined)}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-black text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-amber-500/20"
                >
                  📸 Start Camera & Allow Access
                </button>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <p className="text-red-300 font-bold text-sm">{cameraError}</p>
                <button
                  onClick={() => startCamera()}
                  className="bg-red-500 hover:bg-red-400 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                >
                  Retry Camera Request
                </button>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20 space-y-3">
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-amber-300 font-bold text-sm tracking-wide">
                  Verifying Ticket & Logging Entry...
                </p>
              </div>
            )}
          </div>

          {/* ACTION / MANUAL SCAN OPTIONS */}
          <div className="mt-5 pt-4 border-t border-white/10 space-y-4">
            <div>
              <p className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-wider">
                Option 1: Enter Ticket Token Code Manually
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
                  placeholder="Paste or type QR Ticket code..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 bg-black border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
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

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Option 2: Upload Ticket Screenshot
              </span>
              <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-amber-300 text-xs font-bold px-4 py-2 rounded-xl transition">
                <span>📁 Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* SCAN RESULT OVERLAY CARD */}
        {scanResult && (
          <div className="mt-2 animate-in fade-in zoom-in duration-200">
            {scanResult.success ? (
              <div className="bg-emerald-950/40 border-2 border-emerald-500/60 backdrop-blur-2xl rounded-3xl p-5 sm:p-7 text-center shadow-[0_0_50px_rgba(16,185,129,0.25)]">
                
                {/* VERIFICATION BADGE */}
                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/40 text-emerald-400 text-3xl font-black">
                  ✓
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1 tracking-tight">
                  ENTRY ALLOWED ✅
                </h2>
                <p className="text-emerald-300/90 text-xs sm:text-sm font-bold uppercase tracking-wider mb-5">
                  Valid Ticket Verified Successfully
                </p>

                {/* DETAILS CONTAINER */}
                <div className="bg-black/80 border border-white/15 rounded-2xl p-5 text-left space-y-4 shadow-inner">
                  
                  {/* MAIN USER INFORMATION */}
                  <div className="border-b border-white/10 pb-3">
                    <span className="text-[11px] text-amber-400 font-extrabold uppercase tracking-widest block mb-1">
                      👤 Main Ticket Purchaser (Primary Holder)
                    </span>
                    <p className="text-2xl font-black text-white leading-tight">
                      {scanResult.attendee?.full_name}
                    </p>
                    {scanResult.attendee?.phone_number && (
                      <p className="text-xs text-gray-300 font-semibold mt-1 flex items-center gap-1.5">
                        <span>📞 Phone:</span>
                        <span className="text-white font-bold">{scanResult.attendee.phone_number}</span>
                      </p>
                    )}
                    {scanResult.attendee?.email && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                        <span>✉️ Email:</span>
                        <span className="text-gray-200 font-mono">{scanResult.attendee.email}</span>
                      </p>
                    )}
                  </div>

                  {/* OTHER TICKET HOLDERS / GROUP MEMBERS */}
                  {scanResult.attendee?.emergency_contact_name && getGroupMembers(scanResult.attendee.emergency_contact_name).length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                      <span className="text-xs text-amber-300 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <span>👥</span> Group Ticket Holders ({getGroupMembers(scanResult.attendee.emergency_contact_name).length} Other Persons):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {getGroupMembers(scanResult.attendee.emergency_contact_name).map((personName, idx) => (
                          <div
                            key={idx}
                            className="bg-black/60 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold text-gray-100"
                          >
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span>{personName}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-amber-200/70 italic mt-1">
                        * Verify attendee identity against the listed group member names above.
                      </p>
                    </div>
                  )}

                  {/* PASS TYPE & TIMES SCANNED COUNT */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="bg-zinc-900/80 p-3 rounded-xl border border-white/10">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Pass Tier
                      </span>
                      <p className="text-sm sm:text-base font-bold text-amber-300 mt-0.5">
                        {scanResult.attendee?.ticket_type}
                      </p>
                    </div>

                    <div className="bg-zinc-900/80 p-3 rounded-xl border border-white/10">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Times Scanned / Total Entries
                      </span>
                      <p className="text-xl font-black text-emerald-400 mt-0.5 flex items-baseline gap-1">
                        <span>{scanResult.attendee?.used_entries}</span>
                        <span className="text-xs text-gray-400 font-normal">out of</span>
                        <span>{scanResult.attendee?.allowed_entries} times</span>
                      </p>
                    </div>
                  </div>

                  {/* SCAN COUNT STATUS INDICATOR */}
                  <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3 text-xs sm:text-sm text-emerald-200 font-bold text-center">
                    {(Number(scanResult.attendee?.allowed_entries) - Number(scanResult.attendee?.used_entries)) > 0
                      ? `🎟️ ${Number(scanResult.attendee?.allowed_entries) - Number(scanResult.attendee?.used_entries)} more entry scan(s) remaining on this pass.`
                      : '🎉 All allowed entry scans for this pass are now completed.'
                    }
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-rose-950/40 border-2 border-rose-500/60 backdrop-blur-2xl rounded-3xl p-5 sm:p-7 text-center shadow-[0_0_50px_rgba(244,63,94,0.25)]">
                <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-rose-500/40 text-rose-400 text-3xl font-black">
                  ✕
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-rose-400 mb-2">
                  ENTRY DENIED ❌
                </h2>

                <p className="text-base sm:text-lg font-bold text-white mb-4 bg-black/60 p-3 rounded-xl border border-rose-500/30">
                  {scanResult.message}
                </p>

                {scanResult.attendee && (
                  <div className="bg-black/80 border border-white/15 rounded-2xl p-4 text-left space-y-3 mb-4">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Main Ticket Purchaser
                      </span>
                      <p className="text-lg font-bold text-white">{scanResult.attendee.full_name}</p>
                    </div>

                    {scanResult.attendee.emergency_contact_name && getGroupMembers(scanResult.attendee.emergency_contact_name).length > 0 && (
                      <div className="bg-zinc-900/90 p-2.5 rounded-xl border border-white/10 text-xs">
                        <span className="text-gray-400 font-bold block mb-1">Group Holders:</span>
                        <p className="text-gray-200">{getGroupMembers(scanResult.attendee.emergency_contact_name).join(', ')}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Pass Type</span>
                        <p className="text-xs font-bold text-amber-300">{scanResult.attendee.ticket_type}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Scans Used</span>
                        <p className="text-lg font-black text-rose-400">
                          {scanResult.attendee.used_entries} / {scanResult.attendee.allowed_entries}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SCAN NEXT TICKET ACTION BUTTON */}
            <button
              onClick={resumeScanning}
              className="w-full mt-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-lg py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/25 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>📷</span> SCAN NEXT TICKET
            </button>
          </div>
        )}
      </div>
    </main>
  );
}