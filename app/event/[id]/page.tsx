'use client';

import { use, useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import {
  CalendarDays,
  MapPin,
  ArrowRight,
  Sparkles,
  Ticket,
  Music2,
  Trophy,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

// =====================================
// DANDIYA FESTIVE ANIMATION COMPONENT
// =====================================
function DandiyaAnimation() {
  return (
    <div className="relative w-full max-w-lg mx-auto my-6 sm:my-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent border border-amber-500/20 backdrop-blur-2xl shadow-[0_0_50px_rgba(245,158,11,0.12)] flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Festive Ambient Background Glow */}
      <div className="absolute w-72 h-72 sm:w-88 sm:h-88 bg-gradient-to-tr from-amber-500/20 via-rose-500/15 to-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Rotating Background Mandala Rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
        className="absolute w-56 h-56 sm:w-68 sm:h-68 border border-amber-400/20 rounded-full border-dashed pointer-events-none"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
        className="absolute w-44 h-44 sm:w-52 sm:h-52 border border-rose-400/20 rounded-full pointer-events-none"
      />

      {/* Animated Crossing Dandiya Sticks Stage */}
      <div className="relative w-56 h-48 sm:w-64 sm:h-56 flex items-center justify-center">
        {/* Left Dandiya Stick */}
        <motion.div
          animate={{
            rotate: [-30, -30, 16, 11, -30],
            x: [-8, -8, 12, 10, -8],
            y: [0, 0, -4, -2, 0],
          }}
          transition={{
            duration: 1.15,
            repeat: Infinity,
            times: [0, 0.38, 0.5, 0.58, 1],
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: 'bottom left' }}
          className="absolute left-9 sm:left-12 bottom-3 z-10"
        >
          <svg
            viewBox="0 0 36 170"
            className="w-10 h-36 sm:w-12 sm:h-44 filter drop-shadow-[0_0_14px_rgba(245,158,11,0.75)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Tassel at base */}
            <circle cx="18" cy="158" r="6" fill="#F43F5E" />
            <circle cx="13" cy="164" r="2.5" fill="#F59E0B" />
            <circle cx="23" cy="164" r="2.5" fill="#F59E0B" />
            <path d="M18 150 L18 158" stroke="#F59E0B" strokeWidth="2.5" />

            {/* Stick body */}
            <rect x="13" y="18" width="10" height="132" rx="5" fill="url(#leftDandiyaGrad)" stroke="#F59E0B" strokeWidth="1.5" />

            {/* Festive colored tape bands */}
            <rect x="13" y="32" width="10" height="8" fill="#F43F5E" />
            <rect x="13" y="44" width="10" height="4" fill="#FDE047" />
            <rect x="13" y="52" width="10" height="9" fill="#8B5CF6" />
            <rect x="13" y="65" width="10" height="5" fill="#10B981" />
            <rect x="13" y="74" width="10" height="10" fill="#F43F5E" />
            <rect x="13" y="88" width="10" height="5" fill="#FDE047" />
            <rect x="13" y="97" width="10" height="9" fill="#8B5CF6" />
            <rect x="13" y="110" width="10" height="7" fill="#F43F5E" />

            {/* Mirror sparkle dots */}
            <circle cx="18" cy="36" r="1.6" fill="#FFF" />
            <circle cx="18" cy="56" r="1.6" fill="#FFF" />
            <circle cx="18" cy="79" r="1.6" fill="#FFF" />
            <circle cx="18" cy="101" r="1.6" fill="#FFF" />

            {/* Golden tip */}
            <path d="M13 22 Q18 9 23 22 Z" fill="#FDE047" stroke="#F59E0B" strokeWidth="1.5" />
            <circle cx="18" cy="13" r="2" fill="#FFF" />

            <defs>
              <linearGradient id="leftDandiyaGrad" x1="13" y1="18" x2="23" y2="150" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F59E0B" />
                <stop offset="0.5" stopColor="#D97706" />
                <stop offset="1" stopColor="#B45309" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Right Dandiya Stick */}
        <motion.div
          animate={{
            rotate: [30, 30, -16, -11, 30],
            x: [8, 8, -12, -10, 8],
            y: [0, 0, -4, -2, 0],
          }}
          transition={{
            duration: 1.15,
            repeat: Infinity,
            times: [0, 0.38, 0.5, 0.58, 1],
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: 'bottom right' }}
          className="absolute right-9 sm:right-12 bottom-3 z-10"
        >
          <svg
            viewBox="0 0 36 170"
            className="w-10 h-36 sm:w-12 sm:h-44 filter drop-shadow-[0_0_14px_rgba(244,63,94,0.75)] -scale-x-100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Tassel at base */}
            <circle cx="18" cy="158" r="6" fill="#F59E0B" />
            <circle cx="13" cy="164" r="2.5" fill="#F43F5E" />
            <circle cx="23" cy="164" r="2.5" fill="#F43F5E" />
            <path d="M18 150 L18 158" stroke="#F43F5E" strokeWidth="2.5" />

            {/* Stick body */}
            <rect x="13" y="18" width="10" height="132" rx="5" fill="url(#rightDandiyaGrad)" stroke="#F43F5E" strokeWidth="1.5" />

            {/* Festive colored tape bands */}
            <rect x="13" y="32" width="10" height="8" fill="#F59E0B" />
            <rect x="13" y="44" width="10" height="4" fill="#10B981" />
            <rect x="13" y="52" width="10" height="9" fill="#EC4899" />
            <rect x="13" y="65" width="10" height="5" fill="#FDE047" />
            <rect x="13" y="74" width="10" height="10" fill="#8B5CF6" />
            <rect x="13" y="88" width="10" height="5" fill="#10B981" />
            <rect x="13" y="97" width="10" height="9" fill="#F59E0B" />
            <rect x="13" y="110" width="10" height="7" fill="#F43F5E" />

            {/* Mirror sparkle dots */}
            <circle cx="18" cy="36" r="1.6" fill="#FFF" />
            <circle cx="18" cy="56" r="1.6" fill="#FFF" />
            <circle cx="18" cy="79" r="1.6" fill="#FFF" />
            <circle cx="18" cy="101" r="1.6" fill="#FFF" />

            {/* Golden tip */}
            <path d="M13 22 Q18 9 23 22 Z" fill="#FEF08A" stroke="#F43F5E" strokeWidth="1.5" />
            <circle cx="18" cy="13" r="2" fill="#FFF" />

            <defs>
              <linearGradient id="rightDandiyaGrad" x1="13" y1="18" x2="23" y2="150" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F43F5E" />
                <stop offset="0.5" stopColor="#E11D48" />
                <stop offset="1" stopColor="#9F1239" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Clash Shockwave Impact Ring */}
        <motion.div
          animate={{
            scale: [0.2, 0.2, 1.9, 2.5],
            opacity: [0, 0, 0.9, 0],
          }}
          transition={{
            duration: 1.15,
            repeat: Infinity,
            times: [0, 0.46, 0.52, 0.76],
            ease: 'easeOut',
          }}
          className="absolute top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 border-amber-300 pointer-events-none z-20"
        />

        {/* Radiating Impact Sparks */}
        {[
          { x: -24, y: -20 },
          { x: 24, y: -20 },
          { x: -26, y: 16 },
          { x: 26, y: 16 },
        ].map((spark, i) => (
          <motion.div
            key={i}
            animate={{
              x: [0, 0, spark.x, spark.x * 1.3],
              y: [0, 0, spark.y, spark.y * 1.3],
              opacity: [0, 0, 1, 0],
              scale: [0, 0, 1.3, 0],
            }}
            transition={{
              duration: 1.15,
              repeat: Infinity,
              times: [0, 0.46, 0.51, 0.76],
              ease: 'easeOut',
            }}
            className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none text-amber-200 text-xs z-20 select-none font-bold"
          >
            ✦
          </motion.div>
        ))}

        {/* Center Spark Burst */}
        <motion.div
          animate={{
            scale: [0.3, 0.3, 1.5, 0.4],
            opacity: [0, 0, 1, 0],
          }}
          transition={{
            duration: 1.15,
            repeat: Infinity,
            times: [0, 0.46, 0.51, 0.72],
            ease: 'easeOut',
          }}
          className="absolute top-5 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center pointer-events-none"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-yellow-300 blur-md opacity-80" />
          <span className="absolute text-2xl text-amber-100 select-none">✨</span>
        </motion.div>
      </div>

      {/* Rhythmic Beat Tag with Equalizer Bars */}
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="mt-3 inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/40 border border-amber-400/30 backdrop-blur-md text-amber-300 text-xs sm:text-sm font-bold shadow-lg"
      >
        {/* Equalizer rhythm bars */}
        <div className="flex items-center gap-0.5">
          {[0.5, 1, 0.4, 0.85, 0.6].map((h, i) => (
            <motion.span
              key={i}
              animate={{ scaleY: [0.25, h, 0.25] }}
              transition={{
                duration: 0.75,
                repeat: Infinity,
                delay: i * 0.12,
                ease: 'easeInOut',
              }}
              className="w-1 h-3.5 bg-gradient-to-t from-amber-400 to-rose-400 rounded-full origin-bottom"
            />
          ))}
        </div>
        <span className="tracking-wide">Rhythmic Clashes • Non-Stop Garba & Raas</span>
      </motion.div>
    </div>
  );
}

export default function EventPage({
  params
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = use(params);

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [isExpired, setIsExpired] = useState(false);

  // =====================================
  // FETCH EVENT
  // =====================================

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/event/${id}`
      );
      setEvent(response.data.event);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // COUNTDOWN TIMER
  // =====================================

  useEffect(() => {
    if (!event) return;

    const targetDate = new Date(event.event_date);

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (distance < 0) {
        setIsExpired(true);
        clearInterval(interval);
        return;
      }

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  // =====================================
  // LOADING & NOT FOUND STATES
  // =====================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080511] flex flex-col items-center justify-center text-white gap-4">
        <div className="w-12 h-12 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-amber-200/80 font-medium tracking-wider text-sm uppercase">Loading Dandiya Event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#080511] flex flex-col items-center justify-center text-red-400 text-center p-6">
        <h1 className="text-3xl font-black mb-2">Event Not Found</h1>
        <p className="text-gray-400 mb-6">The requested event could not be retrieved.</p>
        <Link href="/" className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition">
          Return to Events
        </Link>
      </div>
    );
  }

  const isDandiyaEvent = Boolean(
    event.category?.toLowerCase()?.includes('dandiya') ||
    event.category?.toLowerCase()?.includes('garba') ||
    event.title?.toLowerCase()?.includes('dandiya')
  );

  return (
    <main className="min-h-screen bg-[#090614] text-white overflow-hidden relative selection:bg-amber-500 selection:text-black">
      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-amber-500/15 via-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-2/3 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* FLOATING SUBTLE SPARKLES */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {[
          { top: '12%', left: '8%', delay: 0 },
          { top: '22%', right: '10%', delay: 1.2 },
          { top: '48%', left: '6%', delay: 2.1 },
          { top: '68%', right: '8%', delay: 0.8 },
          { top: '85%', left: '12%', delay: 1.7 },
        ].map((s, idx) => (
          <motion.div
            key={idx}
            style={{ top: s.top, left: s.left, right: s.right }}
            animate={{
              y: [-8, 8, -8],
              opacity: [0.2, 0.7, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: s.delay,
            }}
            className="absolute text-amber-300/40 text-xs sm:text-sm"
          >
            ✦
          </motion.div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-20 relative z-10">
        {/* TOP STATUS PILL */}
        <div className="text-center mb-4 sm:mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
            <span>✨</span>
            <span>{isDandiyaEvent ? 'Dandiya Raas 2026 • 12th Edition' : event.category || 'Featured Event'}</span>
          </span>
        </div>

        {/* HERO TITLE & TAGLINE */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-3 bg-gradient-to-r from-amber-100 via-rose-200 to-amber-300 bg-clip-text text-transparent tracking-tight">
            {event.title}
          </h1>
          {event.tagline && (
            <p className="text-sm sm:text-lg text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed">
              {event.tagline}
            </p>
          )}
        </div>

        {/* DANDIYA ANIMATION (SHOWN PROMINENTLY FOR DANDIYA/GARBA) */}
        {isDandiyaEvent && <DandiyaAnimation />}

        {/* BANNER IMAGE */}
        {event.banner_url && (
          <div className="w-full max-w-4xl mx-auto mb-8 sm:mb-12 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/80 bg-black/40">
            <img
              src={event.banner_url?.startsWith('http') ? event.banner_url : `${process.env.NEXT_PUBLIC_API_URL}/${event.banner_url?.replace(/\\/g, '/')}`}
              alt={event.title}
              className="w-full h-auto max-h-[70vh] object-contain mx-auto block"
            />
          </div>
        )}

        {/* MAIN CALL TO ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-5 mb-10 sm:mb-14 w-full max-w-md mx-auto">
          {!isExpired && (
            <Link href={`/register/${event.event_id}`} className="w-full sm:w-auto flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-rose-400 text-black font-black text-lg sm:text-xl py-4 px-8 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.35)] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Book Passes</span>
                <ArrowRight size={20} />
              </motion.button>
            </Link>
          )}
          {!isExpired && (
            <Link href={`/my-ticket/${event.event_id}`} className="w-full sm:w-auto flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 hover:border-amber-400/40 text-white font-bold text-base sm:text-lg py-4 px-6 rounded-2xl backdrop-blur-xl transition text-center shadow-lg cursor-pointer"
              >
                View My Ticket
              </motion.button>
            </Link>
          )}
        </div>

        {/* FESTIVE HIGHLIGHTS GRID (CLEAN & MODERN) */}
        {isDandiyaEvent && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mb-10 sm:mb-14">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-lg text-center hover:border-amber-400/30 transition">
              <span className="text-2xl sm:text-3xl block mb-1">🪩</span>
              <p className="font-bold text-white text-xs sm:text-sm">Live DJ & Dhol</p>
              <p className="text-[11px] text-gray-400">High-energy festive beats</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-lg text-center hover:border-rose-400/30 transition">
              <span className="text-2xl sm:text-3xl block mb-1">💃</span>
              <p className="font-bold text-white text-xs sm:text-sm">Garba & Raas</p>
              <p className="text-[11px] text-gray-400">Traditional Dandiya night</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-lg text-center hover:border-amber-400/30 transition">
              <span className="text-2xl sm:text-3xl block mb-1">🍲</span>
              <p className="font-bold text-white text-xs sm:text-sm">Festive Treats</p>
              <p className="text-[11px] text-gray-400">Delicious culinary stalls</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-lg text-center hover:border-purple-400/30 transition">
              <span className="text-2xl sm:text-3xl block mb-1">🏆</span>
              <p className="font-bold text-white text-xs sm:text-sm">Exciting Awards</p>
              <p className="text-[11px] text-gray-400">Best dancers & attire</p>
            </div>
          </div>
        )}

        {/* INFO: VENUE & DATE CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-10 sm:mb-14">
          <a
            href={event.venue_map_url || "https://maps.app.goo.gl/V38WwSw8WjvyPFfU9?g_st=ac"}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 backdrop-blur-xl flex items-start gap-4 transition group shadow-lg cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
              <MapPin size={22} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">Venue Location</span>
              <p className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition line-clamp-2">
                {event.venue}
              </p>
              <p className="text-xs text-amber-300/80 mt-1.5 flex items-center gap-1 font-medium">
                <span>📍 View Location on Google Maps</span> ↗
              </p>
            </div>
          </a>

          <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex items-start gap-4 shadow-lg">
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <CalendarDays size={22} className="text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-1">Date & Time</span>
              <p className="text-base sm:text-lg font-bold text-white">
                {new Date(event.event_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs text-gray-400 mt-1 font-medium">
                Starts at {new Date(event.event_date).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true })} IST
              </p>
            </div>
          </div>
        </div>

        {/* SIMPLE & MINIMALIST COUNTDOWN TIMER */}
        {!isExpired ? (
          <div className="mb-10 sm:mb-14 max-w-xl mx-auto text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300/80 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block mb-4">
              ⏳ Event Begins In
            </span>
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
              {[
                { val: timeLeft.days, label: 'DAYS' },
                { val: timeLeft.hours, label: 'HOURS' },
                { val: timeLeft.minutes, label: 'MINUTES' },
                { val: timeLeft.seconds, label: 'SECONDS' },
              ].map((t, idx) => (
                <div key={idx} className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-lg">
                  <span className="font-mono text-2xl sm:text-4xl font-black text-white block">
                    {String(t.val).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-wider mt-1 block">
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-10 max-w-lg mx-auto p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center">
            <h3 className="text-xl font-bold text-red-400 mb-1">Event Concluded</h3>
            <p className="text-sm text-gray-400">Registrations for this event have closed.</p>
          </div>
        )}

        {/* ABOUT EVENT */}
        {event.description && (
          <div className="max-w-3xl mx-auto rounded-3xl bg-white/[0.03] border border-white/10 p-6 sm:p-10 mb-14 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white">About the Event</h2>
            </div>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>
        )}

        {/* FOOTER */}
        <footer className="border-t border-white/10 pt-8 pb-4 text-center text-gray-500 text-xs sm:text-sm">
          <p className="mb-2">© 2026 EventFlow Platform. All Rights Reserved.</p>
          <p className="text-gray-400">
            For event inquiries, contact <strong className="text-white">Shravya Hebbar</strong> at{' '}
            <a href="mailto:rotaractyelahanka.events@gmail.com" className="text-amber-400 hover:underline font-medium">
              rotaractyelahanka.events@gmail.com
            </a>{' '}
            or call <span className="text-amber-400 font-medium">9611444945</span>
          </p>
        </footer>
      </div>
    </main>
  );
}