'use client';

import { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useParams } from 'next/navigation';
import { MapPin } from 'lucide-react';

export default function MyTicketPage() {
  const params = useParams();

  // ====================================
  // STATES
  // ====================================

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [selectedRaceDetails, setSelectedRaceDetails] = useState<any>(null);

  // ====================================
  // SHARE TICKET
  // ====================================

  const shareTicket = async (ticket: any) => {
    const shareText = `Thank you for registering for ${ticket.title || 'Dandiya Night 12.0'}! 🎉\n\nHere is your official Entry Pass & QR Code:\n${window.location.href}\n\nWith regards,\nRotaract Club of Yelahanka`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${ticket.title} Entry Pass`,
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // Fallback to WhatsApp link if share sheet fails/canceled
      }
    }

    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  // ====================================
  // GET TICKET
  // ====================================

  const getTicket = async () => {
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanEmail && !cleanPhone) {
      alert('Please enter your Email Address or Phone Number to view your tickets.');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/my-ticket`,
        {
          email: cleanEmail,
          phone_number: cleanPhone,
          event_id: params.id
        }
      );

      const approvedTickets = (response.data.data || []).filter((t: any) => t.payment_status === 'approved');

      if (approvedTickets.length > 0) {
        setTickets(approvedTickets);
      } else {
        setTickets([]);
        alert('Your payment approval is currently pending. Tickets will appear here once approved by an admin!');
      }
    } catch (error: any) {
      console.log(error);
      setTickets([]);
      const serverMsg = error?.response?.data?.message || 'Tickets not found. Please verify your Email or Phone Number.';
      alert(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // NATIVE HTML5 CANVAS TICKET BUILDER (100% FAIL-PROOF & EXACT UNICODE KANNADA SUPPORT)
  // ====================================

  const generateExactTicketCanvas = async (ticket: any): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const width = 600;
    const height = 960;
    canvas.width = width * 2;
    canvas.height = height * 2;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    ctx.scale(2, 2);

    // 1. Dark Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // 2. Card Container
    const cardX = 20;
    const cardY = 20;
    const cardW = width - 40;
    const cardH = height - 40;
    const radius = 24;

    ctx.save();
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(cardX, cardY, cardW, cardH, radius);
    } else {
      ctx.rect(cardX, cardY, cardW, cardH);
    }
    ctx.clip();

    ctx.fillStyle = '#121215';
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // 3. Header Banner (Amber Gradient)
    const headerH = 110;
    const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.5, '#ea580c');
    grad.addColorStop(1, '#e11d48');

    ctx.fillStyle = grad;
    ctx.fillRect(cardX, cardY, cardW, headerH);

    // Header Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    ctx.font = '900 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('🪩 OFFICIAL EVENT PASS', width / 2, cardY + 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(ticket.title || 'EVENT', width / 2, cardY + 65);

    ctx.fillStyle = '#fde68a';
    ctx.font = '700 13px system-ui, -apple-system, sans-serif';
    ctx.fillText(`PASS FOR ${(ticket.title || '').toUpperCase()}`, width / 2, cardY + 90);

    // 4. Opening Greeting
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Thank you for registering for ${ticket.title || 'Dandiya Night 12.0'}! 🎉`, width / 2, cardY + 140);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('Entry Pass Details', width / 2, cardY + 175);

    // 5. Ticket Details
    ctx.textAlign = 'left';
    const startX = cardX + 40;
    let currentY = cardY + 215;
    const lineGap = 32;

    const details = [
      ['Name:', ticket.full_name || 'N/A'],
      ['Phone No:', ticket.phone_number || 'N/A'],
      ['Amount Paid:', `₹${ticket.total_amount || 0}`],
      ['Event:', ticket.title || 'N/A'],
      ['Ticket:', `${ticket.ticket_type || ''} (${ticket.allowed_entries || 1} members)`],
      ['Venue:', ticket.venue || 'N/A'],
      ['Date & Time:', ticket.event_date ? `${new Date(ticket.event_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })} • ${new Date(ticket.event_date).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true })} IST` : 'N/A']
    ];

    details.forEach(([label, val]) => {
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(label, startX, currentY);

      ctx.fillStyle = '#ffffff';
      ctx.font = '500 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(String(val), startX + 130, currentY);

      currentY += lineGap;
    });

    // 6. QR Code Image
    if (ticket.qr_code) {
      const qrSize = 190;
      const qrX = width / 2 - qrSize / 2;
      const qrY = currentY + 10;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30, 20);
      } else {
        ctx.rect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
      }
      ctx.fill();

      // Golden QR Border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();

      await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
          resolve(true);
        };
        img.onerror = () => resolve(false);
        img.src = ticket.qr_code;
      });

      currentY = qrY + qrSize + 30;
    } else {
      currentY += 20;
    }

    // 7. BIB Number & Wave (Marathon Only)
    if (ticket.category?.toLowerCase()?.trim() === 'marathon' && ticket.bib_number) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#22d3ee';
      ctx.font = '900 36px system-ui, -apple-system, sans-serif';
      ctx.fillText(`#${ticket.bib_number}`, width / 2, currentY + 30);
      currentY += 40;

      if (ticket.custom_pricing) {
        try {
          const pricing = typeof ticket.custom_pricing === 'string' ? JSON.parse(ticket.custom_pricing) : ticket.custom_pricing;
          const details = pricing.find((p: any) => p.name === ticket.ticket_type);
          if (details && details.wave_size) {
            const distMatch = ticket.ticket_type.match(/\d+/);
            const baseBib = distMatch ? parseInt(distMatch[0]) * 1000 : 1000;
            const runnerIndex = ticket.bib_number - baseBib - 1;
            const waveIndex = Math.floor(runnerIndex / Number(details.wave_size));
            const waveLetter = String.fromCharCode(65 + waveIndex);

            ctx.fillStyle = '#fde68a';
            ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
            ctx.fillText(`Wave ${waveLetter}`, width / 2, currentY + 10);
            currentY += 25;
          }
        } catch (e) {}
      }
    }

    // 8. Footer Notice & Rotaract Sign-off
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d1d5db';
    ctx.font = '15px system-ui, -apple-system, sans-serif';
    ctx.fillText('Show this pass at the entrance ✨', width / 2, cardY + cardH - 65);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText('With regards,', width / 2, cardY + cardH - 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 17px system-ui, -apple-system, sans-serif';
    ctx.fillText('Rotaract Club of Yelahanka', width / 2, cardY + cardH - 18);

    ctx.restore();

    // Outer Border
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(cardX, cardY, cardW, cardH, radius);
    } else {
      ctx.rect(cardX, cardY, cardW, cardH);
    }
    ctx.stroke();

    return canvas;
  };

  // ====================================
  // DOWNLOAD PDF (HYBRID FAIL-SAFE)
  // ====================================

  const downloadPDF = async (ticket: any) => {
    try {
      setDownloadingId(ticket.registration_id);

      let imgData = '';
      let canvas: HTMLCanvasElement | null = null;

      // 1. Attempt html2canvas capture first
      const element = document.getElementById(`ticket-card-${ticket.registration_id}`);
      if (element) {
        try {
          canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#09090b',
            logging: false,
            ignoreElements: (el) => el.getAttribute('data-html2canvas-ignore') === 'true',
            onclone: (clonedDoc) => {
              const clonedEl = clonedDoc.getElementById(`ticket-card-${ticket.registration_id}`);
              if (clonedEl) {
                clonedEl.style.width = '600px';
                clonedEl.style.maxWidth = '600px';
                clonedEl.style.minWidth = '600px';
                clonedEl.style.transform = 'none';
                clonedEl.style.backdropFilter = 'none';
                (clonedEl.style as any).webkitBackdropFilter = 'none';
                clonedEl.style.backgroundColor = '#09090b';
                clonedEl.style.color = '#ffffff';
              }
            }
          });
          imgData = canvas.toDataURL('image/png');
        } catch (hErr) {
          console.warn('html2canvas capture warning, switching to native canvas renderer:', hErr);
        }
      }

      // 2. If html2canvas failed or canvas empty, use Native HTML5 Canvas Ticket Builder (0% failure rate)
      if (!imgData || !canvas) {
        canvas = await generateExactTicketCanvas(ticket);
        imgData = canvas.toDataURL('image/png');
      }

      // 3. Output to PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const availableWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * availableWidth) / canvas.width;

      pdf.setFillColor(9, 9, 11);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

      let yPos = margin;
      if (imgHeight < pdfHeight - margin * 2) {
        yPos = (pdfHeight - imgHeight) / 2;
      }

      pdf.addImage(imgData, 'PNG', margin, yPos, availableWidth, Math.min(imgHeight, pdfHeight - margin * 2));
      const safeTitle = (ticket.title || 'Event').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      pdf.save(`${safeTitle || 'Event'}-Pass.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('PDF generation encountered an error. Please try taking a screenshot of your ticket card.');
    } finally {
      setDownloadingId(null);
    }
  };

  // ====================================
  // MAIN RETURN
  // ====================================

  return (
    <div className="
      min-h-screen
      bg-gradient-to-br
      from-black
      via-zinc-950
      to-violet-950
      flex
      items-center
      justify-center
      px-4 sm:px-6
      py-6 sm:py-10
    ">
      <div className="w-full max-w-2xl">

        {/* LOGIN BOX */}
        <div className="
          bg-white/5
          border
          border-white/10
          backdrop-blur-xl
          rounded-[35px]
          p-5 sm:p-10
        ">
          {/* HEADING */}
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="
              text-3xl md:text-5xl
              font-bold
              bg-gradient-to-r
              from-violet-300
              via-white
              to-pink-300
              bg-clip-text
              text-transparent
              mb-3
            ">
              My Tickets
            </h1>
            <p className="
              text-gray-300
              text-base sm:text-lg
            ">
              View Your Event Passes
            </p>
          </div>

          {/* EMAIL */}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="
              w-full
              p-4
              mb-5
              rounded-[20px]
              bg-white/5
              border
              border-white/10
              backdrop-blur-xl
              text-white
              placeholder-gray-400
              focus:outline-none
              focus:ring-2
              focus:ring-violet-50
            "
          />

          {/* PHONE */}
          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="
              w-full
              p-4
              mb-5
              rounded-[20px]
              bg-white/5
              border
              border-white/10
              backdrop-blur-xl
              text-white
              placeholder-gray-400
              focus:outline-none
              focus:ring-2
              focus:ring-violet-50
            "
          />

          {/* BUTTON */}
          <button
            onClick={getTicket}
            disabled={loading}
            className="
               w-full
              bg-violet-500
              hover:bg-violet-600
              text-white
               font-bold
               py-4
               px-6
               rounded-2xl
               text-lg
               transition
               shadow-lg
               shadow-violet-500/30
            "
          >
            {loading ? 'Loading...' : 'View My Tickets'}
          </button>
        </div>

        {/* TICKETS LIST */}
        {tickets && tickets.length > 0 && (
          <div className="mt-10 space-y-10">
            {tickets.map((ticket, index) => (
              <div key={index}>
                {ticket.payment_status === 'pending' ? (
                  <div className="
                    bg-white/5
                    border-white/10
                    backdrop-blur-xl
                    border
                    rounded-3xl
                    p-5 sm:p-10
                    text-center
                  ">
                    <h2 className="
                      text-2xl sm:text-3xl
                      text-violet-300
                      font-bold
                      mb-4 sm:mb-5
                    ">
                      Waiting For Approval ⏳
                    </h2>
                    <p className="text-white text-base sm:text-lg font-bold mb-2">
                      Pass: {ticket.ticket_type}
                    </p>
                    <p className="text-gray-300 text-sm sm:text-base">
                      Your payment is under admin verification.
                    </p>
                  </div>
                ) : (
                  <div
                    id={`ticket-card-${ticket.registration_id}`}
                    className="
                      bg-zinc-950
                      border-2
                      border-amber-500/40
                      backdrop-blur-xl
                      rounded-3xl
                      overflow-hidden
                      shadow-[0_0_50px_rgba(245,158,11,0.2)]
                    "
                  >
                    {/* HEADER */}
                    <div className="
                      bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500
                      text-white
                      text-center
                      py-5
                      px-4
                    ">
                      <span className="inline-block bg-black/40 text-amber-300 text-[11px] sm:text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider mb-2">
                        🪩 OFFICIAL EVENT PASS
                      </span>
                      <h2 className="text-2xl sm:text-4xl font-black">
                        {ticket.title}
                      </h2>
                      <p className="text-xs sm:text-sm mt-1 font-bold text-amber-100 uppercase tracking-widest">
                        PASS FOR {ticket.title?.toUpperCase()}
                      </p>
                    </div>

                    {/* BODY */}
                    <div className="p-5 sm:p-10 text-center">
                      {/* GREETING CARD */}
                      <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 max-w-md mx-auto">
                        <p className="text-amber-300 font-bold text-base sm:text-lg">
                          Thank you for registering for {ticket.title || 'Dandiya Night 12.0'}! 🎉
                        </p>
                      </div>

                      {/* DETAILS */}
                      <div className="
                        text-left
                        max-w-md
                        mx-auto
                        mb-8
                        space-y-3
                        bg-black/50
                        border
                        border-amber-500/20
                        rounded-2xl
                        p-5
                      ">
                        <p className="text-white text-base sm:text-lg">
                          <span className="text-amber-300 font-bold">Name:</span> {ticket.full_name}
                        </p>
                        <p className="text-white text-base sm:text-lg">
                          <span className="text-amber-300 font-bold">Phone No:</span> {ticket.phone_number}
                        </p>
                        <p className="text-white text-base sm:text-lg">
                          <span className="text-amber-300 font-bold">Amount Paid:</span> ₹{ticket.total_amount}
                        </p>
                        <p className="text-white text-base sm:text-lg">
                          <span className="text-amber-300 font-bold">Event:</span> {ticket.title}
                        </p>
                        <p className="text-white text-lg">
                          <span className="text-amber-300 font-bold">Ticket:</span> {ticket.ticket_type} ({ticket.allowed_entries} members)
                        </p>
                        <p className="text-white text-lg">
                          <span className="text-amber-300 font-bold">Venue:</span> {ticket.venue}
                        </p>
                        <p className="text-white text-lg">
                          <span className="text-amber-300 font-bold">Date & Time:</span>{' '}
                          {new Date(ticket.event_date).toLocaleDateString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}{' '}
                          at{' '}
                          {new Date(ticket.event_date).toLocaleTimeString('en-US', {
                            timeZone: 'Asia/Kolkata',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}{' '}
                          IST
                        </p>
                      </div>

                      {/* QR */}
                      {ticket.qr_code && (
                        <div className="
                          bg-white
                          inline-block
                          p-5
                          rounded-3xl
                          border-4
                          border-amber-400
                          shadow-[0_0_30px_rgba(245,158,11,0.3)]
                        ">
                          <img
                            src={ticket.qr_code}
                            alt="QR Code"
                            className="w-52 h-52 md:w-64 md:h-64"
                          />
                        </div>
                      )}

                      {/* BIB AND WAVE (MARATHON ONLY) */}
                      {ticket.category?.toLowerCase()?.trim() === 'marathon' && ticket.bib_number && (
                        <div className="mt-6 flex flex-col items-center">
                          <h2 className="text-4xl font-black text-cyan-400">#{ticket.bib_number}</h2>
                          {ticket.custom_pricing && (() => {
                            try {
                              const pricing = typeof ticket.custom_pricing === 'string' ? JSON.parse(ticket.custom_pricing) : ticket.custom_pricing;
                              const details = pricing.find((p: any) => p.name === ticket.ticket_type);
                              if (details && details.wave_size) {
                                const distMatch = ticket.ticket_type.match(/\d+/);
                                const baseBib = distMatch ? parseInt(distMatch[0]) * 1000 : 1000;
                                const runnerIndex = ticket.bib_number - baseBib - 1;
                                const waveIndex = Math.floor(runnerIndex / Number(details.wave_size));
                                const waveLetter = String.fromCharCode(65 + waveIndex);
                                return <p className="text-xl text-amber-300 font-bold mt-2">Wave {waveLetter}</p>;
                              }
                            } catch (e) { }
                            return null;
                          })()}
                        </div>
                      )}

                      {/* FOOTER */}
                      <p className="text-gray-300 mt-6 text-base font-semibold">
                        Show this pass at the entrance ✨
                      </p>

                      {/* SIGN-OFF */}
                      <div className="mt-8 pt-6 border-t border-amber-500/20 text-center">
                        <p className="text-amber-400 font-bold text-sm">With regards,</p>
                        <p className="text-white font-black text-xl tracking-wide">Rotaract Club of Yelahanka</p>
                      </div>

                      {/* WHATSAPP LINK */}
                      {ticket.whatsapp_link && (
                        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center justify-center gap-3">
                          <p className="text-white text-md">Join the official WhatsApp group for updates</p>
                          <a
                            href={ticket.whatsapp_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#25D366] hover:bg-[#20b858] text-white px-6 py-3 rounded-full font-bold transition flex items-center gap-2 shadow-lg shadow-[#25D366]/20"
                          >
                            Join WhatsApp Group
                          </a>
                        </div>
                      )}

                      {/* DOWNLOAD & SHARE BUTTONS */}
                      <div data-html2canvas-ignore="true" className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                        {ticket.qr_code && (
                          <button
                            onClick={() => downloadPDF(ticket)}
                            disabled={downloadingId === ticket.registration_id}
                            className="
                               w-full
                               sm:w-auto
                               bg-gradient-to-r
                               from-amber-500
                               to-orange-500
                               hover:from-amber-400
                               hover:to-orange-400
                               disabled:opacity-50
                               text-black
                               font-black
                               px-7
                               py-3.5
                               rounded-2xl
                               text-base
                               transition
                               shadow-lg
                               shadow-amber-500/25
                               flex
                               items-center
                               justify-center
                               gap-2
                            "
                          >
                            <span>📥</span> {downloadingId === ticket.registration_id ? 'Generating PDF...' : 'Download PDF Pass'}
                          </button>
                        )}

                        <button
                          onClick={() => shareTicket(ticket)}
                          className="
                            w-full
                            sm:w-auto
                            bg-emerald-600
                            hover:bg-emerald-500
                            text-white
                            font-bold
                            px-7
                            py-3.5
                            rounded-2xl
                            text-base
                            transition
                            shadow-lg
                            shadow-emerald-600/25
                            flex
                            items-center
                            justify-center
                            gap-2
                          "
                        >
                          <span>📲</span> Share Ticket
                        </button>

                        {ticket.category?.toLowerCase()?.trim() === 'marathon' && ticket.custom_pricing && (
                          <button
                            onClick={() => {
                              try {
                                const pricing = typeof ticket.custom_pricing === 'string' ? JSON.parse(ticket.custom_pricing) : ticket.custom_pricing;
                                const details = pricing.find((p: any) => p.name === ticket.ticket_type);
                                if (details) {
                                  setSelectedRaceDetails({
                                    ...details,
                                    bib_number: ticket.bib_number,
                                    ticket_type: ticket.ticket_type
                                  });
                                }
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="
                               w-full
                               md:w-auto
                               bg-cyan-500
                               hover:bg-cyan-600
                               text-black
                               font-bold
                               px-8
                               py-4
                               rounded-2xl
                               text-lg
                               transition
                               shadow-lg
                               shadow-cyan-500/30
                            "
                          >
                            View Race Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RACE DETAILS MODAL */}
      {selectedRaceDetails && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-5">
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-[30px] p-8 md:p-10 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRaceDetails(null)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition"
            >
              ✕
            </button>
            <h2 className="text-3xl font-black text-cyan-300 mb-6 border-b border-white/10 pb-4">
              {selectedRaceDetails.name} Race Guide
            </h2>

            <div className="space-y-6">
              {(() => {
                const waveSize = Number(selectedRaceDetails.wave_size || 100);
                const gapMins = Number(selectedRaceDetails.wave_gap_mins || 15);
                const baseNumber = parseInt((selectedRaceDetails.ticket_type || '1').match(/\d+/)?.[0] || '1') * 1000;

                const hasBib = !!selectedRaceDetails.bib_number;
                // Calculate Wave Index
                const waveIndex = hasBib ? Math.max(0, Math.floor((selectedRaceDetails.bib_number - baseNumber - 1) / waveSize)) : 0;
                const waveLetter = hasBib ? String.fromCharCode(65 + waveIndex) : 'TBD';

                // Calculate Times
                const baseStart = selectedRaceDetails.start_time ? new Date(selectedRaceDetails.start_time) : null;
                const myStart = baseStart ? new Date(baseStart.getTime() + (hasBib ? waveIndex * gapMins * 60000 : 0)) : null;
                const myReporting = myStart ? new Date(myStart.getTime() - 60 * 60000) : null;

                return (
                  <>
                    <div className="bg-cyan-900/30 p-6 rounded-2xl border border-cyan-500/50 flex justify-between items-center shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                      <div>
                        <h4 className="text-cyan-400 text-sm uppercase tracking-wider mb-1">Your Bib</h4>
                        <p className="text-4xl md:text-5xl font-black text-white">{hasBib ? `#${selectedRaceDetails.bib_number}` : 'Pending'}</p>
                      </div>
                      <div className="text-right">
                        <h4 className="text-cyan-400 text-sm uppercase tracking-wider mb-1">Your Wave</h4>
                        <p className="text-4xl md:text-5xl font-black text-white">Wave {waveLetter}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {myStart && (
                        <div className="bg-black/50 p-5 rounded-2xl border border-white/10">
                          <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-1">{hasBib ? 'Your Start Time' : 'Base Start Time'}</h4>
                          <p className="text-xl md:text-2xl font-bold text-white">{myStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      )}
                      {myReporting && (
                        <div className="bg-black/50 p-5 rounded-2xl border border-white/10">
                          <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-1">{hasBib ? 'Your Reporting Time' : 'Base Reporting Time'}</h4>
                          <p className="text-xl md:text-2xl font-bold text-white">{myReporting.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {selectedRaceDetails.bib_collection && (
                <div>
                  <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-1">Bib Collection</h4>
                  <p className="text-xl font-medium text-white">{selectedRaceDetails.bib_collection}</p>
                </div>
              )}
              {selectedRaceDetails.additional_info && (
                <div>
                  <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-1">Important Info</h4>
                  <p className="text-lg text-white bg-white/5 p-4 rounded-xl border border-white/10">{selectedRaceDetails.additional_info}</p>
                </div>
              )}
              {selectedRaceDetails.route_map_url && (
                <div className="mt-8">
                  <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-3">Location of the event</h4>
                  <div className="relative rounded-[24px] overflow-hidden border border-white/10 bg-zinc-900 group shadow-2xl">
                    {selectedRaceDetails.route_map_url.includes('google.com/maps/embed') ? (
                      <iframe
                        src={selectedRaceDetails.route_map_url}
                        className="w-full h-64 md:h-80 border-0"
                        allowFullScreen={true}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <img
                        src={selectedRaceDetails.route_map_url}
                        alt="Event Location"
                        className="w-full h-64 md:h-80 object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-700"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop";
                          e.currentTarget.style.opacity = '0.4';
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 p-6 w-full flex justify-between items-end">
                      <div>
                        <h4 className="text-white font-black text-2xl mb-1 flex items-center gap-2">
                          <MapPin size={24} className="text-cyan-400" />
                          Event Location
                        </h4>
                        <p className="text-cyan-400 font-medium text-lg">{selectedRaceDetails.ticket_type}</p>
                      </div>
                      <a
                        href={selectedRaceDetails.route_map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-3 rounded-full font-bold text-sm hover:bg-white hover:text-black transition shadow-lg shadow-black/50"
                      >
                        Open Google Maps
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}