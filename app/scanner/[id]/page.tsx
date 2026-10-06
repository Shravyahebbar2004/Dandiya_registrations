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

  const [scanResult, setScanResult] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const isScanningRef = useRef(true);

  // =====================================
  // AUTH CHECK
  // =====================================

  useEffect(() => {
    const token = localStorage.getItem('scanner_token');
    const adminToken = localStorage.getItem('admin_token');

    if (!token && !adminToken) {
      setIsAuthorized(false);
      router.push('/scanner-login');
      return;
    }

    setIsAuthorized(true);
  }, [router]);




  // =====================================
  // LOAD SCANNER
  // =====================================

  useEffect(() => {

    let scanner: any;



    const startScanner = async () => {

      const { Html5QrcodeScanner } = await import(

        'html5-qrcode'

      );



      scanner = new Html5QrcodeScanner(

        'reader',

        {

          fps: 5,

          qrbox: {

            width: 280,

            height: 280

          }

        },

        false

      );



      scanner.render(

        async (decodedText: string) => {

          if (!isScanningRef.current) return; // Prevent multiple requests if already paused

          try {

            // Pause UI to prevent rapid-fire scans
            isScanningRef.current = false;
            if (scannerRef.current) {
              scannerRef.current.pause(true);
            }

            const token = localStorage.getItem(

              'scanner_token'

            );



            const response = await axios.post(

              `${process.env.NEXT_PUBLIC_API_URL}/api/verify-ticket`,

              {

                qr_token: decodedText

              },

              {

                headers: {

                  Authorization:

                    `Bearer ${token}`

                }

              }

            );



            setScanResult(

              response.data

            );



          } catch (error) {

            console.log(error);

          }

        },

        (error: any) => {

          // Mute constant scanning errors to prevent lag
          // console.log(error);

        }

      );



      scannerRef.current = scanner;

    };



    startScanner();



    return () => {

      if (scannerRef.current) {

        scannerRef.current.clear()

          .catch(() => {});

      }

    };

  }, []);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 font-bold text-sm tracking-wide">
            Authenticating Scanner Access...
          </p>
        </div>
      </div>
    );
  }

  return (

  <main
    className="
      min-h-screen
      bg-gradient-to-br
      from-black
      via-zinc-950
      to-violet-950
      text-white
      p-6
      relative
      overflow-hidden
    "
  >

    {/* BACKGROUND GLOW */}

    <div className="
      absolute
      inset-0
      overflow-hidden
    ">

      <div className="
        absolute
        top-[-200px]
        left-[-200px]
        w-[500px]
        h-[500px]
        bg-violet-500/20
        blur-[180px]
        rounded-full
        animate-pulse
      "></div>

      <div className="
        absolute
        bottom-[-200px]
        right-[-200px]
        w-[500px]
        h-[500px]
        bg-cyan-500/20
        blur-[180px]
        rounded-full
        animate-pulse
      "></div>

    </div>

    <div className="relative z-10">

      {/* HEADER */}

      <div className="
        flex
        flex-col
        md:flex-row
        justify-between
        items-center
        gap-5
        mb-10
      ">

        <div>

          <h1
            className="
              text-5xl
              font-black
              bg-gradient-to-r
              from-cyan-300
              via-white
              to-violet-300
              bg-clip-text
              text-transparent
            "
          >
            QR Scanner
          </h1>

          <p
            className="
              text-gray-400
              mt-2
            "
          >
            EventFlow Verification Portal
          </p>

        </div>

        <button

          onClick={() => {

            localStorage.removeItem(

              'scanner_token'

            );

            router.push(

              '/scanner-login'

            );

          }}

          className="
            bg-red-500
            hover:bg-red-600
            px-6
            py-3
            rounded-2xl
            font-bold
            transition-all
          "

        >

          Logout

        </button>

      </div>

      {/* SCANNER CARD */}

      <div className={`
        bg-white/5
        border
        border-white/10
        backdrop-blur-xl
        rounded-[35px]
        p-6
        shadow-2xl
        transition-all
        duration-300
        ${scanResult ? 'hidden' : 'block'}
      `}>

        <div id="reader"></div>

      </div>

      {/* RESULT */}

      {

        scanResult && (

          <div className="
            mt-10
          ">

            {
              scanResult.success
                ? (
                  <div className="bg-emerald-500/10 border-2 border-emerald-500/40 backdrop-blur-2xl rounded-[35px] p-8 sm:p-10 text-center shadow-[0_0_50px_rgba(16,185,129,0.25)]">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/40 text-emerald-400 text-4xl font-black">
                      ✓
                    </div>

                    <h2 className="text-4xl sm:text-5xl font-black text-emerald-400 mb-2">
                      ENTRY ALLOWED ✅
                    </h2>
                    <p className="text-emerald-300/80 text-sm font-bold uppercase tracking-wider mb-6">
                      Scan #{scanResult.attendee.used_entries} of {scanResult.attendee.allowed_entries} Verified
                    </p>

                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 mb-4 text-left space-y-3">
                      <div>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Registered Attendee</span>
                        <p className="text-2xl sm:text-3xl font-black text-white">{scanResult.attendee.full_name}</p>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-white/10">
                        <div>
                          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Ticket Pass Type</span>
                          <p className="text-base font-bold text-amber-300">{scanResult.attendee.ticket_type}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Entries Used</span>
                          <p className="text-2xl font-black text-emerald-400">
                            {scanResult.attendee.used_entries} / {scanResult.attendee.allowed_entries}
                          </p>
                        </div>
                      </div>

                      {scanResult.attendee.phone_number && (
                        <div className="pt-2 border-t border-white/10 flex justify-between text-xs text-gray-400">
                          <span>Phone: <strong className="text-white">{scanResult.attendee.phone_number}</strong></span>
                          {scanResult.attendee.utr && <span>UTR: <strong className="text-amber-300 font-mono">{scanResult.attendee.utr}</strong></span>}
                        </div>
                      )}
                    </div>

                    <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3 text-xs sm:text-sm text-emerald-200 font-bold">
                      {scanResult.attendee.allowed_entries - scanResult.attendee.used_entries > 0 
                        ? `🎟️ ${scanResult.attendee.allowed_entries - scanResult.attendee.used_entries} more ${scanResult.attendee.allowed_entries - scanResult.attendee.used_entries === 1 ? 'entry' : 'entries'} remaining on this QR pass.`
                        : '🎉 Final entry used! All entries on this QR pass are now completed.'
                      }
                    </div>
                  </div>
                )
                : (
                  <div className="bg-rose-500/10 border-2 border-rose-500/40 backdrop-blur-2xl rounded-[35px] p-8 sm:p-10 text-center shadow-[0_0_50px_rgba(244,63,94,0.25)]">
                    <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-500/40 text-rose-400 text-4xl font-black">
                      ✕
                    </div>

                    <h2 className="text-4xl sm:text-5xl font-black text-rose-400 mb-4">
                      ENTRY DENIED ❌
                    </h2>

                    <p className="text-xl sm:text-2xl font-bold text-white mb-4">
                      {scanResult.message}
                    </p>

                    {scanResult.attendee && (
                      <div className="bg-black/40 border border-white/10 rounded-2xl p-6 text-left space-y-3">
                        <div>
                          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Registered Attendee</span>
                          <p className="text-2xl font-bold text-white">{scanResult.attendee.full_name}</p>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-white/10">
                          <div>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Ticket Type</span>
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
                )
            }

            {/* SCAN NEXT BUTTON */}
            <button
              onClick={() => {
                setScanResult(null);
                isScanningRef.current = true;
                if (scannerRef.current) {
                  scannerRef.current.resume();
                }
              }}
              className="
                w-full
                mt-8
                bg-cyan-500
                hover:bg-cyan-600
                text-black
                font-black
                text-xl
                py-5
                rounded-[25px]
                transition-all
                shadow-lg
                shadow-cyan-500/30
                hover:scale-105
              "
            >
              SCAN NEXT TICKET
            </button>

          </div>

        )

      }

    </div>

  </main>

);

}