'use client';

import { use, useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import {
  CalendarDays,
  MapPin,
  ArrowRight,
  HelpCircle,
  MessageCircleQuestion,
  Send,
  CheckCircle2,
  AlertCircle,
  Baby,
  User,
  Mail,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

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

  // Queries & Community Q&A State
  const [queries, setQueries] = useState<any[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [queryContact, setQueryContact] = useState('');
  const [queryQuestion, setQueryQuestion] = useState('');
  const [submittingQuery, setSubmittingQuery] = useState(false);
  const [querySuccessMsg, setQuerySuccessMsg] = useState('');
  const [queryErrorMsg, setQueryErrorMsg] = useState('');

  const fetchQueries = async () => {
    try {
      setLoadingQueries(true);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/event/${id}/queries`);
      if (res.data && res.data.success) {
        setQueries(res.data.queries || []);
      }
    } catch (err) {
      console.log('Error fetching queries:', err);
    } finally {
      setLoadingQueries(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [id]);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryName.trim() || !queryQuestion.trim()) {
      setQueryErrorMsg('Please fill in both your name and your query.');
      return;
    }

    try {
      setSubmittingQuery(true);
      setQueryErrorMsg('');
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/event/${id}/queries`, {
        user_name: queryName,
        user_contact: queryContact,
        question: queryQuestion
      });

      if (res.data && res.data.success) {
        setQuerySuccessMsg('Your query has been submitted! Our organizers will answer it shortly.');
        setQueryName('');
        setQueryContact('');
        setQueryQuestion('');
        fetchQueries();
        setTimeout(() => setQuerySuccessMsg(''), 8000);
      }
    } catch (err: any) {
      setQueryErrorMsg(err.response?.data?.message || 'Failed to submit query. Please try again.');
    } finally {
      setSubmittingQuery(false);
    }
  };

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
      <div className="min-h-screen bg-[#07050d] flex flex-col items-center justify-center text-white gap-4">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-amber-200/70 font-medium tracking-widest text-xs uppercase">Loading Event Details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#07050d] flex flex-col items-center justify-center text-red-400 text-center p-6">
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
    <main className="min-h-screen bg-[#07050d] text-white overflow-hidden relative selection:bg-amber-500 selection:text-black">
      {/* SIMPLE & AESTHETIC BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Soft, elegant ambient light halos */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-b from-amber-500/12 via-rose-500/8 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-purple-700/10 rounded-full blur-[160px]" />
        <div className="absolute top-2/3 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[160px]" />

        {/* Minimal dot matrix overlay for subtle modern texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Delicate floating ambient sparkle motes */}
        {[
          { top: '15%', left: '10%' },
          { top: '25%', right: '12%' },
          { top: '55%', left: '8%' },
          { top: '75%', right: '10%' },
        ].map((p, idx) => (
          <div
            key={idx}
            style={{ top: p.top, left: p.left, right: p.right }}
            className="absolute text-amber-200/25 text-xs select-none"
          >
            ✦
          </div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-20 relative z-10">
        {/* CATEGORY STATUS PILL */}
        <div className="text-center mb-4 sm:mb-5">
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/[0.04] text-amber-300 border border-amber-500/25 backdrop-blur-md">
            <span>✨</span>
            <span>{isDandiyaEvent ? 'Dandiya - 2026' : event.category || 'Featured Event'}</span>
          </span>
        </div>

        {/* EVENT BANNER (POSTER ON TOP) */}
        {event.banner_url && (
          <div className="w-full max-w-4xl mx-auto mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/80 bg-black/40">
            <img
              src={
                event.banner_url?.startsWith('http')
                  ? event.banner_url
                  : `${process.env.NEXT_PUBLIC_API_URL}/${event.banner_url?.replace(/\\/g, '/')}`
              }
              alt={event.title}
              className="w-full h-auto max-h-[70vh] object-contain mx-auto block"
            />
          </div>
        )}

        {/* HERO TITLE & TAGLINE */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-3 bg-gradient-to-r from-white via-amber-100 to-rose-200 bg-clip-text text-transparent tracking-tight">
            {event.title}
          </h1>
          {event.tagline && (
            <p className="text-sm sm:text-lg text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed">
              {event.tagline}
            </p>
          )}
        </div>

        {/* MAIN CALL TO ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-8 sm:mb-12 w-full max-w-md mx-auto">
          {!isExpired && (
            <Link href={`/register/${event.event_id}`} className="w-full sm:w-auto flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-rose-400 text-black font-black text-base sm:text-lg py-3.5 px-6 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.3)] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🎟️ Book Passes</span>
                <ArrowRight size={18} />
              </motion.button>
            </Link>
          )}
          {!isExpired && (
            <Link href={`/my-ticket/${event.event_id}`} className="w-full sm:w-auto flex-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-400/40 text-white font-bold text-base py-3.5 px-6 rounded-2xl backdrop-blur-xl transition text-center shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🎫 View My Ticket</span>
              </motion.button>
            </Link>
          )}
        </div>

        {/* FESTIVE HIGHLIGHTS (WITH VIBRANT EMOJIS & CARDS) */}
        {isDandiyaEvent && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mb-8 sm:mb-12">
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-lg text-center hover:border-amber-400/40 transition flex flex-col justify-center items-center shadow-lg hover:bg-white/[0.05]">
              <span className="text-3xl sm:text-4xl mb-2">🪩</span>
              <p className="font-black text-white text-sm sm:text-base">Live DJ & Dhols</p>
              <p className="text-[11px] text-amber-200/80 font-medium mt-1">High-energy festive beats</p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-lg text-center hover:border-rose-400/40 transition flex flex-col justify-center items-center shadow-lg hover:bg-white/[0.05]">
              <span className="text-3xl sm:text-4xl mb-2">🕺</span>
              <p className="font-black text-white text-sm sm:text-base">Garba & Dandiya</p>
              <p className="text-[11px] text-rose-200/80 font-medium mt-1">Traditional Dandiya night</p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-lg text-center hover:border-amber-400/40 transition flex flex-col justify-center items-center shadow-lg hover:bg-white/[0.05]">
              <span className="text-3xl sm:text-4xl mb-2">🍲</span>
              <p className="font-black text-white text-sm sm:text-base">Festive Food Stalls</p>
              <p className="text-[11px] text-amber-200/80 font-medium mt-1">Delicious food & treats</p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-lg text-center hover:border-purple-400/40 transition flex flex-col justify-center items-center shadow-lg hover:bg-white/[0.05]">
              <span className="text-3xl sm:text-4xl mb-2">🏆</span>
              <p className="font-black text-white text-sm sm:text-base">Exciting Prizes</p>
              <p className="text-[11px] text-purple-200/80 font-medium mt-1">Best dancers & attire awards</p>
            </div>
          </div>
        )}

        {/* INFO: VENUE & DATE CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8 sm:mb-12">
          <a

            target="_blank"
            rel="noopener noreferrer"
            className="p-5 sm:p-6 rounded-2xl bg-white/[0.025] border border-white/10 hover:border-amber-400/40 backdrop-blur-xl flex items-start gap-4 transition group shadow-lg cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <MapPin size={22} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">Venue Location</span>
              <p className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition line-clamp-2">
                {event.venue}
              </p>
              <p className="text-xs text-amber-300/80 mt-1.5 flex items-center gap-1 font-medium">
                <span>📍 Location will be shared soon </span> ↗
              </p>
            </div>
          </a>

          <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.025] border border-white/10 backdrop-blur-xl flex items-start gap-4 shadow-lg">
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <CalendarDays size={22} className="text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-1">Event Date</span>
              <p className="text-base sm:text-lg font-bold text-white">
                {new Date(event.event_date).toLocaleDateString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* COUNTDOWN TIMER */}
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
                { val: timeLeft.seconds, label: 'SECONDS' }
              ].map((t, idx) => (
                <div key={idx} className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.025] border border-white/10 backdrop-blur-lg">
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
          <div className="max-w-3xl mx-auto rounded-3xl bg-white/[0.025] border border-white/10 p-6 sm:p-10 mb-14 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white">About the Event</h2>
            </div>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>
        )}

        {/* EVENT QUERIES & COMMUNITY Q&A SECTION */}
        <section className="max-w-3xl mx-auto mb-16">
          {/* SECTION HEADER */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/25 mb-3">
              <MessageCircleQuestion size={14} />
              <span>Event Queries & Guidelines</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-amber-200 via-white to-rose-200 bg-clip-text text-transparent">
              Frequently Asked Queries
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
              Everything you need to know before attending. Have a doubt? Ask our organizers below!
            </p>
          </div>

          {/* OFFICIAL CHILD ENTRY POLICY (PROMINENT HIGHLIGHT BANNER) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-purple-600/10 border-2 border-amber-500/40 p-6 sm:p-7 mb-8 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-44 h-44 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                <Baby size={26} className="text-amber-300" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ✓ Official Policy
                  </span>
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                    Child Entry Guidelines
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                  Kids Aged 5 & Below Enter for Free!
                </h3>
                <div className="mt-3 space-y-2 text-xs sm:text-sm text-gray-200 leading-relaxed">
                  <div className="flex items-start gap-2 bg-black/30 border border-amber-500/20 rounded-xl p-3">
                    <span className="text-emerald-400 font-bold shrink-0">👶</span>
                    <p>
                      <strong className="text-amber-200">Children aged 5 and below:</strong> Enjoy <span className="text-emerald-400 font-black">FREE ENTRY</span> to the event. No separate pass is required.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 bg-black/30 border border-amber-500/20 rounded-xl p-3">
                    <span className="text-amber-400 font-bold shrink-0">🎫</span>
                    <p>
                      <strong className="text-amber-200">Children above 5 years:</strong> Must possess a valid ticket purchased at the <span className="text-amber-300 font-bold">standard mentioned ticket price</span>.
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-2.5 italic">
                  * Note: Children must be accompanied by an adult. Age verification ID (school ID or birth certificate) may be requested at entry gates if required.
                </p>
              </div>
            </div>
          </div>

          {/* ANSWERED QUERIES LIST */}
          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" />
              <span>Organizer Verified Answers ({queries.length})</span>
            </h3>

            {loadingQueries ? (
              <div className="p-8 text-center bg-white/[0.02] border border-white/10 rounded-2xl">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-400">Loading queries...</p>
              </div>
            ) : queries.length === 0 ? (
              <div className="p-6 text-center bg-white/[0.02] border border-white/10 rounded-2xl text-gray-400 text-xs sm:text-sm">
                No answered queries yet. Be the first to ask the organizers below!
              </div>
            ) : (
              queries.map((q) => (
                <div
                  key={q.query_id}
                  className="rounded-2xl bg-white/[0.025] border border-white/10 p-5 sm:p-6 backdrop-blur-xl shadow-lg hover:border-amber-500/30 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="text-amber-400 font-black text-base shrink-0 mt-0.5">Q.</span>
                      <div>
                        <h4 className="text-white font-bold text-sm sm:text-base leading-snug">
                          {q.question}
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-2">
                          <span>Asked by <strong className="text-gray-300">{q.user_name}</strong></span>
                          <span>•</span>
                          <span>{new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </p>
                      </div>
                    </div>
                    {q.is_pinned && (
                      <span className="shrink-0 text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        📌 Pinned
                      </span>
                    )}
                  </div>

                  {q.answer && (
                    <div className="ml-5 p-3.5 sm:p-4 rounded-xl bg-amber-500/[0.07] border border-amber-500/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                        <CheckCircle2 size={13} className="text-amber-400" />
                        <span>Organizer Response</span>
                        {q.answered_by && <span className="text-gray-400 font-normal">({q.answered_by})</span>}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-medium">
                        {q.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* ASK YOUR QUERY FORM */}
          <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-black font-black">
                <HelpCircle size={20} className="text-black" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">Have a Query? Ask the Organizers</h3>
                <p className="text-gray-400 text-xs">
                  We review queries regularly and post official answers here.
                </p>
              </div>
            </div>

            {querySuccessMsg && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm flex items-start gap-2">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-400" />
                <span>{querySuccessMsg}</span>
              </div>
            )}

            {queryErrorMsg && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs sm:text-sm flex items-start gap-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
                <span>{queryErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleQuerySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Your Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={queryName}
                      onChange={(e) => setQueryName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-zinc-700 text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Email or WhatsApp Phone <span className="text-gray-500 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="e.g. rahul@gmail.com or 9876543210"
                      value={queryContact}
                      onChange={(e) => setQueryContact(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-zinc-700 text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Your Question / Query <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Will Dandiya sticks be available at the venue? What time does entry begin?"
                  value={queryQuestion}
                  onChange={(e) => setQueryQuestion(e.target.value)}
                  required
                  className="w-full p-3.5 rounded-xl bg-black/60 border border-zinc-700 text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition resize-none"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={submittingQuery}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-rose-400 text-black font-black text-xs sm:text-sm py-3 px-6 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submittingQuery ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Query...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Submit Query to Organizers</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </section>

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