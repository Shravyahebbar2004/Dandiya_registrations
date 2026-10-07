'use client';

import { useState, useEffect } from 'react';

import axios from 'axios';

import { useRouter, useParams } from 'next/navigation';

import {

  Sparkles,
  CalendarDays,
  MapPin,
  ImageIcon,
  Users,
  Ticket,
  Music2,
  Mic2,
  PartyPopper,
  ArrowRight,
  ScanLine,
  ShieldCheck

} from 'lucide-react';

import { motion } from 'framer-motion';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  // =====================================
  // AUTH CHECK
  // =====================================
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    const platformToken = localStorage.getItem('platform_token');
    if (!adminToken && !platformToken) {
      setIsAuthorized(false);
      router.push('/admin-login');
      return;
    }
    setIsAuthorized(true);
  }, [router]);

  // Auto logout on 5 minutes inactivity
  useEffect(() => {
    const INACTIVITY_LIMIT_MS = 5 * 60 * 1000;
    let lastActivity = Date.now();

    const resetActivity = () => {
      lastActivity = Date.now();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetActivity, { passive: true }));

    const idleTimer = setInterval(() => {
      if (Date.now() - lastActivity >= INACTIVITY_LIMIT_MS) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('scanner_token');
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('scanner_token');
        alert('Session expired due to inactivity. You have been logged out.');
        if (typeof window !== 'undefined') window.location.href = '/admin-login';
      }
    }, 5000);

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetActivity));
      clearInterval(idleTimer);
    };
  }, []);

  const [formData, setFormData] = useState({

    title: '',
    tagline: '',
    venue: '',
    event_date: '',
    organizer_name: '',
    organizer_username: '',
    organizer_password: '',
    description: '',
    category: '',
    whatsapp_link: '',

    slab1_solo_price: '',
    slab1_couple_price: '',
    slab1_group_price: '',
    slab1_deadline: '',
    slab2_solo_price: '',
    slab2_couple_price: '',
    slab2_group_price: '',
    slab2_deadline: '',
    slab3_solo_price: '',
    slab3_couple_price: '',
    slab3_group_price: '',
    slab3_deadline: '',

    bulk_pass_price: '',
    bulk_pass_entries: '',

    feature1_title: 'Attendees',
    feature1_value: '5K+',

    feature2_title: 'Smart Tickets',
    feature2_value: 'QR',

    feature3_title: 'Experience',
    feature3_value: 'Live'

  });

  const [bannerFile, setBannerFile] =
    useState<File | null>(null);

  const [bannerPreview, setBannerPreview] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  // NEW STATE FOR CUSTOM PRICING
  const [customPricing, setCustomPricing] = useState<any[]>([]);

  const addCustomDistance = () => {
    setCustomPricing([...customPricing, { name: '', slab1: '', slab2: '', slab3: '', bib_collection: '', start_time: '', wave_size: '100', wave_gap_mins: '15', route_map_url: '', additional_info: '' }]);
  };

  const updateCustomDistance = (index: number, field: string, value: string) => {
    const updated = [...customPricing];
    updated[index][field] = value;
    setCustomPricing(updated);
  };
  
  const removeCustomDistance = (index: number) => {
    const updated = customPricing.filter((_, i) => i !== index);
    setCustomPricing(updated);
  };

  // DANDIYA SPECIFIC TIERED & VOLUME PRICING STATE
  const [dandiyaPricing, setDandiyaPricing] = useState({
    flash_sale: {
      enabled: true,
      price: '249',
      threshold: '50',
      deadline: ''
    },
    slab1: {
      name: 'Early Bird Offer',
      threshold: '150',
      price_1_4: '299',
      price_5_9: '269',
      price_10_plus: '239',
      deadline: ''
    },
    slab2: {
      name: 'Normal Slab',
      threshold: '300',
      price_1_4: '399',
      price_5_9: '359',
      price_10_plus: '319',
      deadline: ''
    },
    slab3: {
      enabled: false,
      name: 'Last Chance Slab',
      threshold: '500',
      price_1_4: '499',
      price_5_9: '449',
      price_10_plus: '399',
      deadline: ''
    },
    inclusions: 'Free pair of wooden Dandiya sticks included + Live DJ & Dhol setup.'
  });

  const updateDandiyaPhase = (phase: 'flash_sale' | 'slab1' | 'slab2' | 'slab3', field: string, value: any) => {
    setDandiyaPricing(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        [field]: value
      }
    }));
  };

  const loadDandiyaPasses = () => {
    setDandiyaPricing({
      flash_sale: {
        enabled: true,
        price: '249',
        threshold: '50',
        deadline: ''
      },
      slab1: {
        name: 'Early Bird Offer',
        threshold: '150',
        price_1_4: '299',
        price_5_9: '269',
        price_10_plus: '239',
        deadline: ''
      },
      slab2: {
        name: 'Normal Slab',
        threshold: '300',
        price_1_4: '399',
        price_5_9: '359',
        price_10_plus: '319',
        deadline: ''
      },
      slab3: {
        enabled: false,
        name: 'Last Chance Slab',
        threshold: '500',
        price_1_4: '499',
        price_5_9: '449',
        price_10_plus: '399',
        deadline: ''
      },
      inclusions: 'Free pair of wooden Dandiya sticks included + Live DJ & Dhol setup.'
    });
  };

  // NEW STATE FOR PARTNER COUPON CODES
  const [partnerCoupons, setPartnerCoupons] = useState<any[]>([]);

  const addPartnerCoupon = () => {
    setPartnerCoupons([...partnerCoupons, { code: '', price: '', max_uses: '100', used_count: 0 }]);
  };

  const updatePartnerCoupon = (index: number, field: string, value: string) => {
    const updated = [...partnerCoupons];
    updated[index][field] = value;
    setPartnerCoupons(updated);
  };

  const removePartnerCoupon = (index: number) => {
    const updated = partnerCoupons.filter((_, i) => i !== index);
    setPartnerCoupons(updated);
  };

  // =====================================
  // FETCH EVENT DATA
  // =====================================

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/event/${id}`);
        const event = res.data.event;
        
        const formatDateTimeLocal = (dateString: string) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return '';
          const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).formatToParts(date);
          const get = (type: string) => parts.find(p => p.type === type)?.value || '';
          return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
        };

        setFormData({
          title: event.title || '',
          tagline: event.tagline || '',
          venue: event.venue || '',
          event_date: formatDateTimeLocal(event.event_date) || '',
          organizer_name: event.organizer_name || '',
          organizer_username: '',
          organizer_password: '',
          description: event.description || '',
          category: event.category || '',
          whatsapp_link: event.whatsapp_link || '',

          slab1_solo_price: event.slab1_solo_price || '',
          slab1_couple_price: event.slab1_couple_price || '',
          slab1_group_price: event.slab1_group_price || '',
          slab1_deadline: formatDateTimeLocal(event.slab1_deadline) || '',
          slab2_solo_price: event.slab2_solo_price || '',
          slab2_couple_price: event.slab2_couple_price || '',
          slab2_group_price: event.slab2_group_price || '',
          slab2_deadline: formatDateTimeLocal(event.slab2_deadline) || '',
          slab3_solo_price: event.slab3_solo_price || '',
          slab3_couple_price: event.slab3_couple_price || '',
          slab3_group_price: event.slab3_group_price || '',
          slab3_deadline: formatDateTimeLocal(event.slab3_deadline) || '',

          bulk_pass_price: event.bulk_pass_price || '',
          bulk_pass_entries: event.bulk_pass_entries || '',

          feature1_title: event.feature1_title || 'Attendees',
          feature1_value: event.feature1_value || '5K+',
          feature2_title: event.feature2_title || 'Smart Tickets',
          feature2_value: event.feature2_value || 'QR',
          feature3_title: event.feature3_title || 'Experience',
          feature3_value: event.feature3_value || 'Live'
        });

        if (event.banner_url) {
          const bannerUrl = event.banner_url.startsWith('http')
            ? event.banner_url
            : `${process.env.NEXT_PUBLIC_API_URL}${event.banner_url}`;
          setBannerPreview(bannerUrl);
        }

        if (event.custom_pricing) {
          try {
            const parsed = typeof event.custom_pricing === 'string' ? JSON.parse(event.custom_pricing) : event.custom_pricing;
            if (Array.isArray(parsed)) {
              setCustomPricing(parsed);
            } else if (parsed && typeof parsed === 'object') {
              if (parsed.flash_sale || parsed.slab1) {
                setDandiyaPricing({
                  flash_sale: {
                    enabled: parsed.flash_sale?.enabled ?? true,
                    price: String(parsed.flash_sale?.price ?? '249'),
                    threshold: String(parsed.flash_sale?.threshold ?? '50'),
                    deadline: formatDateTimeLocal(parsed.flash_sale?.deadline) || ''
                  },
                  slab1: {
                    name: parsed.slab1?.name || 'Early Bird Offer',
                    threshold: String(parsed.slab1?.threshold ?? '150'),
                    price_1_4: String(parsed.slab1?.price_1_4 ?? '299'),
                    price_5_9: String(parsed.slab1?.price_5_9 ?? '269'),
                    price_10_plus: String(parsed.slab1?.price_10_plus ?? '239'),
                    deadline: formatDateTimeLocal(parsed.slab1?.deadline) || ''
                  },
                  slab2: {
                    name: parsed.slab2?.name || 'Normal Slab',
                    threshold: String(parsed.slab2?.threshold ?? '300'),
                    price_1_4: String(parsed.slab2?.price_1_4 ?? '399'),
                    price_5_9: String(parsed.slab2?.price_5_9 ?? '359'),
                    price_10_plus: String(parsed.slab2?.price_10_plus ?? '319'),
                    deadline: formatDateTimeLocal(parsed.slab2?.deadline) || ''
                  },
                  slab3: {
                    enabled: Boolean(parsed.slab3?.enabled),
                    name: parsed.slab3?.name || 'Last Chance Slab',
                    threshold: String(parsed.slab3?.threshold ?? '500'),
                    price_1_4: String(parsed.slab3?.price_1_4 ?? '499'),
                    price_5_9: String(parsed.slab3?.price_5_9 ?? '449'),
                    price_10_plus: String(parsed.slab3?.price_10_plus ?? '399'),
                    deadline: formatDateTimeLocal(parsed.slab3?.deadline) || ''
                  },
                  inclusions: parsed.inclusions || 'Free pair of wooden Dandiya sticks included + Live DJ & Dhol setup.'
                });
              }
            }
          } catch(e) {
            console.error(e);
          }
        }

        if (event.coupons) {
          try {
            const parsedC = typeof event.coupons === 'string' ? JSON.parse(event.coupons) : event.coupons;
            if (Array.isArray(parsedC)) setPartnerCoupons(parsedC);
          } catch(e) {
            console.error(e);
          }
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchEvent();
  }, [id]);

  // =====================================
  // HANDLE INPUT
  // =====================================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement
    >
  ) => {

    setFormData({

      ...formData,

      [e.target.name]: e.target.value

    });

  };

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  // =====================================
  // HANDLE SUBMIT
  // =====================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setLoading(true);

    try {
      const data = new FormData();

      Object.entries(formData).forEach(([key, val]) => {
        data.append(key, val || '');
      });

      const isDandiyaCategory = formData.category?.toLowerCase()?.includes('dandiya') || formData.category?.toLowerCase()?.includes('garba');

      if (isDandiyaCategory) {
        data.append('custom_pricing', JSON.stringify({
          type: 'dandiya_tiered',
          ...dandiyaPricing
        }));
        data.append('slab1_solo_price', dandiyaPricing.slab1.price_1_4 || '');
        data.append('slab1_couple_price', String(Number(dandiyaPricing.slab1.price_1_4 || 0) * 2));
        data.append('slab1_group_price', String(Number(dandiyaPricing.slab1.price_5_9 || 0) * 4));
        data.append('slab1_deadline', dandiyaPricing.slab1.deadline || '');
        data.append('slab2_solo_price', dandiyaPricing.slab2.price_1_4 || '');
        data.append('slab2_couple_price', String(Number(dandiyaPricing.slab2.price_1_4 || 0) * 2));
        data.append('slab2_group_price', String(Number(dandiyaPricing.slab2.price_5_9 || 0) * 4));
        data.append('slab2_deadline', dandiyaPricing.slab2.deadline || formData.slab2_deadline || '');
        if (dandiyaPricing.slab3?.enabled) {
          data.append('slab3_solo_price', dandiyaPricing.slab3.price_1_4 || '');
          data.append('slab3_deadline', dandiyaPricing.slab3.deadline || '');
        }
      } else {
        data.append('custom_pricing', JSON.stringify(customPricing));
      }

      data.append('coupons', JSON.stringify(partnerCoupons));

      if (bannerFile) {
        data.append('banner', bannerFile);
      }

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/edit-event/${id}`,
        data,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      console.log(response.data);

      router.push(`/event/${id}`);

    } catch (error) {

      console.log(error);

      alert(
        'Event Update Failed'
      );

    } finally {

      setLoading(false);

    }

  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 font-bold text-sm tracking-wide">
            Authenticating Admin Access...
          </p>
        </div>
      </div>
    );
  }

  return (

    <main className="
      min-h-screen
      bg-gradient-to-br
      from-black
      via-zinc-950
      to-violet-950
      text-white
      overflow-hidden
      relative
    ">

      {/* BACKGROUND LIGHTS */}

      <div className="
        absolute
        inset-0
        overflow-hidden
      ">

        <div className="
          absolute
          top-[-200px]
          left-[-200px]
          w-[600px]
          h-[600px]
          bg-violet-500/20
          blur-[180px]
          rounded-full
          animate-pulse
        "></div>

        <div className="
          absolute
          bottom-[-200px]
          right-[-200px]
          w-[600px]
          h-[600px]
          bg-cyan-500/20
          blur-[180px]
          rounded-full
          animate-pulse
        "></div>

      </div>

      {/* MAIN */}

      <div className="
        relative
        z-10
        max-w-7xl
        mx-auto
        px-5
        py-32
      ">

        {/* HERO */}

        <motion.div

          initial={{ opacity: 0, y: 40 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.8 }}

          className="text-center mb-20"

        >

          <div className="
            inline-flex
            items-center
            gap-3
            bg-white/5
border-white/10
backdrop-blur-xl
hover:scale-105
transition            border
            border-white/10
            px-6
            py-3
            rounded-full
            mb-8
            backdrop-blur-xl
          ">

            <Sparkles
              className="text-cyan-300"
              size={18}
            />

            <p className="
              text-sm
              text-gray-300
            ">
              Launch Your Event Website Instantly
            </p>

          </div>

          <h1 className="
            text-6xl
            md:text-8xl
            font-black
            leading-tight
            mb-8
          ">

            Edit Your

            <span className="
              bg-gradient-to-r
              from-cyan-300
              to-violet-500
              text-transparent
              bg-clip-text
            ">
              {' '}Dream Event
            </span>

          </h1>

          <p className="
            text-xl
            md:text-2xl
            text-gray-400
            max-w-4xl
            mx-auto
            leading-relaxed
          ">

            Build premium event experiences
            with QR ticketing,
            registrations,
            scanner access,
            analytics and your own
            event website.

          </p>

        </motion.div>

        {/* GRID */}

        <div className="
          grid
          lg:grid-cols-2
          gap-12
          items-start
        ">

          {/* FORM */}

          <motion.form

            initial={{ opacity: 0, x: -40 }}

            animate={{ opacity: 1, x: 0 }}

            transition={{ duration: 0.8 }}

            onSubmit={handleSubmit}

            className="
              bg-white/5
              backdrop-blur-2xl
              border
              border-white/10
              rounded-[40px]
              p-8
              md:p-10
              shadow-2xl
            "

          >

            {/* EVENT TITLE */}

            <div className="mb-6">

              <label className="
                block
                mb-3
                text-lg
                text-gray-300
              ">
                Event Title
              </label>

              <input

                type="text"

                name="title"

                placeholder="Ex: Musical Jam 2026"

                value={formData.title}

                onChange={handleChange}

                required

                className="
                  w-full
                  p-5
                  rounded-2xl
                  bg-black/40
                  border
                  border-white/10
                  text-white
                "

              />

            </div>

            {/* TAGLINE */}

            <div className="mb-6">

              <label className="
                block
                mb-3
                text-lg
                text-gray-300
              ">
                Event Tagline
              </label>

              <input

                type="text"

                name="tagline"

                placeholder="Feel The Energy"

                value={formData.tagline}

                onChange={handleChange}

                className="
                  w-full
                  p-5
                  rounded-2xl
                  bg-black/40
                  border
                  border-white/10
                  text-white
                "

              />

            </div>

            {/* CATEGORY */}

            <div className="mb-6">

              <label className="
                text-gray-300
                mb-3
                block
                text-lg
              ">
                Event Category
              </label>

              <input

                type="text"

                name="category"

                placeholder="
Ex: Marathon, Tech Fest, Startup Meetup
                "

                value={formData.category}

                onChange={handleChange}

                list="event-categories"

                className="
                  w-full
                  p-5
                  rounded-2xl
                  bg-black/40
                  border
                  border-white/10
                  text-white
                "

              />

              <datalist id="event-categories">

                <option value="Music Festival" />

                <option value="Hackathon" />

                <option value="Marathon" />

                <option value="Startup Meetup" />

                <option value="Workshop" />

                <option value="Conference" />

                <option value="College Fest" />

                <option value="NGO Fundraiser" />

                <option value="Gaming Tournament" />

              </datalist>

            </div>

            {/* WHATSAPP LINK */}

            <div className="mb-6">

              <label className="
                text-gray-300
                mb-3
                block
                text-lg
              ">
                WhatsApp Group Link (Optional)
              </label>

              <input

                type="url"

                name="whatsapp_link"

                placeholder="https://chat.whatsapp.com/..."

                value={formData.whatsapp_link}

                onChange={handleChange}

                className="
                  w-full
                  p-5
                  rounded-2xl
                  bg-black/40
                  border
                  border-white/10
                  text-white
                "

              />

            </div>

            {/* VENUE */}

            <div className="mb-6">

              <label className="
                flex
                items-center
                gap-2
                mb-3
                text-lg
                text-gray-300
              ">

                <MapPin size={18} />

                Venue

              </label>

              <input

                type="text"

                name="venue"

                placeholder="
Ex: Bangalore International Arena
                "

                value={formData.venue}

                onChange={handleChange}

                className="
                  w-full
                  p-5
                  rounded-2xl
                  bg-black/40
                  border
                  border-white/10
                  text-white
                "

              />

            </div>

            {/* DATE */}

            <div className="mb-6">

              <label className="
                flex
                items-center
                gap-2
                mb-3
                text-lg
                text-gray-300
              ">

                <CalendarDays size={18} />

                Event Date

              </label>

              <input

                type="datetime-local"

                name="event_date"

                value={formData.event_date}

                onChange={handleChange}

                className="
                  w-full
                  p-5
                  rounded-2xl
                  bg-black/40
                  border
                  border-white/10
                  text-white
                "

              />

            </div>

            {/* ORGANIZER */}

            <div className="mb-6">

              <label className="
                block
                mb-3
                text-lg
                text-gray-300
              ">
                Organizer Name
              </label>

              <input

                type="text"

                name="organizer_name"

                placeholder="
Ex: EventFlow Studios
                "

                value={formData.organizer_name}

                onChange={handleChange}

                className="
                  w-full
                  p-5
                  rounded-2xl
                  bg-black/40
                  border
                  border-white/10
                  text-white
                  mb-5
                "

              />

            </div>

            {/* DESCRIPTION */}

            <div className="mb-8">

              <label className="
                block
                mb-3
                text-lg
                text-gray-300
              ">
                Event Description
              </label>

              <textarea

                name="description"

                rows={5}

                placeholder="
Tell attendees what makes your event special...
                "

                value={formData.description}

                onChange={handleChange}

                className="
                  w-full
                  p-5
                  rounded-2xl
                  bg-black/40
                  border
                  border-white/10
                  text-white
                "

              />

            </div>

            {(formData.category?.toLowerCase()?.includes('dandiya') || formData.category?.toLowerCase()?.includes('garba')) ? (
              /* DANDIYA DYNAMIC SLABS & VOLUME PRICING */
              <div className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
                      🪩 Dandiya Dynamic Pricing (Flash Offer + Quantity Volume Discounts)
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Configure threshold-based Flash Offer (e.g. ₹249 for first 50 tickets). Once threshold is reached, Early Bird and Slab 2 auto-activate with volume discount tiers (1-4, 5-9, 10+ tickets).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadDandiyaPasses}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 px-4 py-2.5 rounded-2xl text-sm font-bold transition flex items-center gap-2 whitespace-nowrap"
                  >
                    ✨ Reset to Default Dandiya Slabs
                  </button>
                </div>

                {/* PHASE 1: FLASH SALE OFFER */}
                <div className="mb-6 p-6 rounded-3xl border-2 border-amber-500/40 bg-amber-500/5 relative">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚡</span>
                      <div>
                        <h3 className="text-lg font-bold text-amber-300">Phase 1: Flash Offer (Threshold Limit)</h3>
                        <p className="text-xs text-amber-200/70">Offer terminates automatically as soon as the ticket threshold is sold out, instantly activating Early Bird Offer.</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-amber-300">
                      <input 
                        type="checkbox" 
                        checked={dandiyaPricing.flash_sale.enabled} 
                        onChange={(e) => updateDandiyaPhase('flash_sale', 'enabled', e.target.checked)} 
                        className="w-4 h-4 accent-amber-500" 
                      />
                      Enable Flash Sale
                    </label>
                  </div>

                  {dandiyaPricing.flash_sale.enabled && (
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-amber-300 text-xs font-bold mb-2">Flash Ticket Price (₹)</label>
                        <input 
                          type="number" 
                          placeholder="249" 
                          value={dandiyaPricing.flash_sale.price} 
                          onChange={(e) => updateDandiyaPhase('flash_sale', 'price', e.target.value)} 
                          className="w-full p-3.5 rounded-xl bg-black/50 border border-amber-500/30 text-white font-bold text-lg" 
                        />
                      </div>
                      <div>
                        <label className="block text-amber-300 text-xs font-bold mb-2">Ticket Threshold (Max Tickets)</label>
                        <input 
                          type="number" 
                          placeholder="50" 
                          value={dandiyaPricing.flash_sale.threshold} 
                          onChange={(e) => updateDandiyaPhase('flash_sale', 'threshold', e.target.value)} 
                          className="w-full p-3.5 rounded-xl bg-black/50 border border-amber-500/30 text-white font-bold text-lg" 
                        />
                        <p className="text-[11px] text-gray-400 mt-1">Closes after {dandiyaPricing.flash_sale.threshold || 50} tickets</p>
                      </div>
                      <div>
                        <label className="block text-gray-400 text-xs mb-2">Flash Deadline (Optional)</label>
                        <input 
                          type="datetime-local" 
                          value={dandiyaPricing.flash_sale.deadline} 
                          onChange={(e) => updateDandiyaPhase('flash_sale', 'deadline', e.target.value)} 
                          className="w-full p-3.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm" 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* PHASE 2: EARLY BIRD OFFER (SLAB 1) */}
                <div className="mb-6 p-6 rounded-3xl border border-cyan-500/30 bg-cyan-950/10">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🐦</span>
                      <div>
                        <h3 className="text-lg font-bold text-cyan-300">Phase 2: Early Bird Offer (Slab 1)</h3>
                        <p className="text-xs text-gray-400">Activates after Flash Offer. Set volume-based discounts per ticket count.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-cyan-300 text-xs font-bold mb-2">Slab 1 Ticket Limit (Threshold)</label>
                      <input 
                        type="number" 
                        placeholder="150" 
                        value={dandiyaPricing.slab1.threshold} 
                        onChange={(e) => updateDandiyaPhase('slab1', 'threshold', e.target.value)} 
                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white font-medium" 
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Applies up to {dandiyaPricing.slab1.threshold || 150} total registrations</p>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-2">Early Bird Deadline (Optional)</label>
                      <input 
                        type="datetime-local" 
                        value={dandiyaPricing.slab1.deadline} 
                        onChange={(e) => updateDandiyaPhase('slab1', 'deadline', e.target.value)} 
                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm" 
                      />
                    </div>
                  </div>

                  {/* VOLUME DISCOUNT TIERS FOR SLAB 1 */}
                  <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                    <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-3">Volume Quantity Discount Matrix (Per Ticket Price)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-xs text-gray-400 block mb-1">1 - 4 Tickets (Base Price &apos;a&apos;)</span>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-sm">₹</span>
                          <input 
                            type="number" 
                            placeholder="299" 
                            value={dandiyaPricing.slab1.price_1_4} 
                            onChange={(e) => updateDandiyaPhase('slab1', 'price_1_4', e.target.value)} 
                            className="w-full bg-black/40 p-2 rounded-lg text-white font-bold text-lg border border-white/10" 
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-cyan-500/20">
                        <span className="text-xs text-cyan-300 block mb-1">5 - 9 Tickets (Discounted)</span>
                        <div className="flex items-center gap-1">
                          <span className="text-cyan-400 text-sm">₹</span>
                          <input 
                            type="number" 
                            placeholder="269" 
                            value={dandiyaPricing.slab1.price_5_9} 
                            onChange={(e) => updateDandiyaPhase('slab1', 'price_5_9', e.target.value)} 
                            className="w-full bg-black/40 p-2 rounded-lg text-cyan-300 font-bold text-lg border border-cyan-500/30" 
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-emerald-500/20">
                        <span className="text-xs text-emerald-300 block mb-1">10+ Tickets (Bulk Discount)</span>
                        <div className="flex items-center gap-1">
                          <span className="text-emerald-400 text-sm">₹</span>
                          <input 
                            type="number" 
                            placeholder="239" 
                            value={dandiyaPricing.slab1.price_10_plus} 
                            onChange={(e) => updateDandiyaPhase('slab1', 'price_10_plus', e.target.value)} 
                            className="w-full bg-black/40 p-2 rounded-lg text-emerald-300 font-bold text-lg border border-emerald-500/30" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PHASE 3: NORMAL SLAB (SLAB 2) */}
                <div className="mb-6 p-6 rounded-3xl border border-violet-500/30 bg-violet-950/10">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎫</span>
                      <div>
                        <h3 className="text-lg font-bold text-violet-300">Phase 3: Normal Slab (Slab 2)</h3>
                        <p className="text-xs text-gray-400">Activates automatically after Early Bird threshold is reached.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-violet-300 text-xs font-bold mb-2">Slab 2 Ticket Limit (Threshold)</label>
                      <input 
                        type="number" 
                        placeholder="300" 
                        value={dandiyaPricing.slab2.threshold} 
                        onChange={(e) => updateDandiyaPhase('slab2', 'threshold', e.target.value)} 
                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white font-medium" 
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Applies up to {dandiyaPricing.slab2.threshold || 300} total registrations</p>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-2">Final Registration Closing Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={dandiyaPricing.slab2.deadline} 
                        onChange={(e) => {
                          updateDandiyaPhase('slab2', 'deadline', e.target.value);
                          setFormData(prev => ({ ...prev, slab2_deadline: e.target.value }));
                        }} 
                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm" 
                      />
                    </div>
                  </div>

                  {/* VOLUME DISCOUNT TIERS FOR SLAB 2 */}
                  <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                    <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-3">Volume Quantity Discount Matrix (Per Ticket Price)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-xs text-gray-400 block mb-1">1 - 4 Tickets (Standard Normal Rate)</span>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-sm">₹</span>
                          <input 
                            type="number" 
                            placeholder="399" 
                            value={dandiyaPricing.slab2.price_1_4} 
                            onChange={(e) => updateDandiyaPhase('slab2', 'price_1_4', e.target.value)} 
                            className="w-full bg-black/40 p-2 rounded-lg text-white font-bold text-lg border border-white/10" 
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-violet-500/20">
                        <span className="text-xs text-violet-300 block mb-1">5 - 9 Tickets (Discounted)</span>
                        <div className="flex items-center gap-1">
                          <span className="text-violet-400 text-sm">₹</span>
                          <input 
                            type="number" 
                            placeholder="359" 
                            value={dandiyaPricing.slab2.price_5_9} 
                            onChange={(e) => updateDandiyaPhase('slab2', 'price_5_9', e.target.value)} 
                            className="w-full bg-black/40 p-2 rounded-lg text-violet-300 font-bold text-lg border border-violet-500/30" 
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-emerald-500/20">
                        <span className="text-xs text-emerald-300 block mb-1">10+ Tickets (Bulk Discount)</span>
                        <div className="flex items-center gap-1">
                          <span className="text-emerald-400 text-sm">₹</span>
                          <input 
                            type="number" 
                            placeholder="319" 
                            value={dandiyaPricing.slab2.price_10_plus} 
                            onChange={(e) => updateDandiyaPhase('slab2', 'price_10_plus', e.target.value)} 
                            className="w-full bg-black/40 p-2 rounded-lg text-emerald-300 font-bold text-lg border border-emerald-500/30" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PHASE 4: OPTIONAL SLAB 3 */}
                <div className="mb-6 p-6 rounded-3xl border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔥</span>
                      <div>
                        <h3 className="text-lg font-bold text-pink-300">Phase 4: Optional Slab 3 (Last Chance / On-Spot)</h3>
                        <p className="text-xs text-gray-400">Enable if you want a final emergency/on-spot pricing tier after Slab 2.</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-pink-300">
                      <input 
                        type="checkbox" 
                        checked={dandiyaPricing.slab3.enabled} 
                        onChange={(e) => updateDandiyaPhase('slab3', 'enabled', e.target.checked)} 
                        className="w-4 h-4 accent-pink-500" 
                      />
                      Enable Slab 3
                    </label>
                  </div>

                  {dandiyaPricing.slab3.enabled && (
                    <>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-pink-300 text-xs font-bold mb-2">Slab 3 Ticket Limit (Threshold)</label>
                          <input 
                            type="number" 
                            placeholder="500" 
                            value={dandiyaPricing.slab3.threshold} 
                            onChange={(e) => updateDandiyaPhase('slab3', 'threshold', e.target.value)} 
                            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white font-medium" 
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-xs mb-2">Slab 3 Closing Deadline</label>
                          <input 
                            type="datetime-local" 
                            value={dandiyaPricing.slab3.deadline} 
                            onChange={(e) => updateDandiyaPhase('slab3', 'deadline', e.target.value)} 
                            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm" 
                          />
                        </div>
                      </div>
                      <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                        <h4 className="text-xs font-bold text-pink-300 uppercase tracking-wider mb-3">Volume Quantity Discount Matrix (Per Ticket Price)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-xs text-gray-400 block mb-1">1 - 4 Tickets</span>
                            <input 
                              type="number" 
                              placeholder="499" 
                              value={dandiyaPricing.slab3.price_1_4} 
                              onChange={(e) => updateDandiyaPhase('slab3', 'price_1_4', e.target.value)} 
                              className="w-full bg-black/40 p-2 rounded-lg text-white font-bold text-lg border border-white/10" 
                            />
                          </div>
                          <div className="p-3 bg-white/5 rounded-xl border border-pink-500/20">
                            <span className="text-xs text-pink-300 block mb-1">5 - 9 Tickets</span>
                            <input 
                              type="number" 
                              placeholder="449" 
                              value={dandiyaPricing.slab3.price_5_9} 
                              onChange={(e) => updateDandiyaPhase('slab3', 'price_5_9', e.target.value)} 
                              className="w-full bg-black/40 p-2 rounded-lg text-pink-300 font-bold text-lg border border-pink-500/30" 
                            />
                          </div>
                          <div className="p-3 bg-white/5 rounded-xl border border-emerald-500/20">
                            <span className="text-xs text-emerald-300 block mb-1">10+ Tickets</span>
                            <input 
                              type="number" 
                              placeholder="399" 
                              value={dandiyaPricing.slab3.price_10_plus} 
                              onChange={(e) => updateDandiyaPhase('slab3', 'price_10_plus', e.target.value)} 
                              className="w-full bg-black/40 p-2 rounded-lg text-emerald-300 font-bold text-lg border border-emerald-500/30" 
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* INCLUSIONS & NOTES */}
                <div className="bg-black/30 p-5 rounded-2xl border border-white/10">
                  <label className="block text-amber-300 text-sm font-bold mb-2">Pass Inclusions / Special Perks (Shown to attendee)</label>
                  <input 
                    type="text" 
                    value={dandiyaPricing.inclusions} 
                    onChange={(e) => setDandiyaPricing(prev => ({ ...prev, inclusions: e.target.value }))} 
                    placeholder="e.g. Free pair of wooden Dandiya sticks included + Live DJ & Dhol setup." 
                    className="w-full p-4 rounded-xl bg-black/50 border border-white/10 text-white text-sm" 
                  />
                </div>
              </div>
            ) : (formData.category?.toLowerCase()?.trim() === 'marathon' || customPricing.length > 0) ? (
              <div className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                      🏃 Manage Marathon Distances
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Add custom distances (e.g. 3k, 5k) and set their prices for Early Bird (Slab 1) and Normal (Slab 2) offers.
                    </p>
                  </div>
                </div>

                <div className="bg-black/20 p-6 rounded-3xl border border-cyan-500/30">
                  {/* Registration Closing Deadline */}
                  <div className="mb-8 bg-black/40 p-5 rounded-2xl border border-white/5">
                    <label className="block text-gray-300 text-sm font-bold mb-2">Registration Closing Date & Time (Final Closing Date)</label>
                    <input type="datetime-local" name="slab2_deadline" value={formData.slab2_deadline} onChange={handleChange} className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white" />
                  </div>

                  {customPricing.map((item, index) => (
                    <div key={index} className="mb-8 p-6 bg-white/5 border border-white/10 rounded-3xl relative">
                      <button type="button" onClick={() => removeCustomDistance(index)} className="absolute -top-3 -right-3 bg-red-500 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white hover:scale-110 transition shadow-lg">✕</button>
                      
                      <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <div>
                          <label className="block text-cyan-300 text-sm font-bold mb-2">Distance / Category Name</label>
                          <input type="text" placeholder="e.g. 5k" value={item.name} onChange={(e) => updateCustomDistance(index, 'name', e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white font-medium" />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">Early Bird Price (₹) [Slab 1]</label>
                          <input type="number" placeholder="299" value={item.slab1} onChange={(e) => updateCustomDistance(index, 'slab1', e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white" />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">Normal Slab Price (₹) [Slab 2]</label>
                          <input type="number" placeholder="399" value={item.slab2} onChange={(e) => updateCustomDistance(index, 'slab2', e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white" />
                        </div>
                      </div>

                      {/* DISTANCE ADVANCED INFO */}
                      <div className="bg-black/30 p-5 rounded-2xl border border-white/5">
                        <h4 className="text-cyan-300 text-sm font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                          Distance Details (For Pre-Registration View)
                        </h4>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="md:col-span-3">
                            <label className="block text-gray-400 text-xs mb-2">Additional Instructions / Bib Collection</label>
                            <input type="text" placeholder="e.g. Bib Collection at Expo Center on Oct 10" value={item.additional_info || ''} onChange={(e) => updateCustomDistance(index, 'additional_info', e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm" />
                          </div>
                          <div>
                            <label className="block text-gray-400 text-xs mb-2">Bib Collection Details</label>
                            <input type="text" placeholder="e.g. Oct 10th, Expo Center" value={item.bib_collection || ''} onChange={(e) => updateCustomDistance(index, 'bib_collection', e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm" />
                          </div>
                          <div>
                            <label className="block text-gray-400 text-xs mb-2">Base Race Start Time</label>
                            <input type="datetime-local" value={item.start_time || ''} onChange={(e) => updateCustomDistance(index, 'start_time', e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm" />
                          </div>
                          <div>
                            <label className="block text-gray-400 text-xs mb-2">Wave Capacity (Max Runners per Wave)</label>
                            <input type="number" placeholder="65" value={item.wave_size || '65'} onChange={(e) => updateCustomDistance(index, 'wave_size', e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm" />
                          </div>
                          <div>
                            <label className="block text-gray-400 text-xs mb-2">Wave Gap (Minutes)</label>
                            <input type="number" placeholder="15" value={item.wave_gap_mins || '15'} onChange={(e) => updateCustomDistance(index, 'wave_gap_mins', e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-gray-400 text-xs mb-2">Route Map Image URL</label>
                            <input type="text" placeholder="https://example.com/route.jpg" value={item.route_map_url || ''} onChange={(e) => updateCustomDistance(index, 'route_map_url', e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button type="button" onClick={addCustomDistance} className="w-full py-4 mt-2 border-2 border-dashed border-cyan-500/50 text-cyan-400 font-bold rounded-2xl hover:bg-cyan-500/10 transition">
                    + Add Distance Option
                  </button>
                </div>

                {/* PARTNER / COUPON CODES SECTION */}
                <div className="mt-8 bg-black/20 p-6 rounded-3xl border border-violet-500/30">
                  <h3 className="text-xl font-bold mb-3 text-violet-300">
                    Partner & Coupon Codes (Special Pricing)
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Set special codes (e.g. <strong className="text-white">YRCRCY</strong>) with custom lower prices for specific partners or limited members (e.g., first 100 members).
                  </p>

                  {partnerCoupons.map((c, index) => (
                    <div key={index} className="mb-4 p-5 bg-white/5 border border-white/10 rounded-2xl relative">
                      <button type="button" onClick={() => removePartnerCoupon(index)} className="absolute -top-3 -right-3 bg-red-500 w-7 h-7 rounded-full flex items-center justify-center font-bold text-white hover:scale-110 transition shadow-lg text-xs">✕</button>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-gray-400 text-xs mb-1">Coupon Code</label>
                          <input type="text" placeholder="e.g. YRCRCY" value={c.code} onChange={(e) => updatePartnerCoupon(index, 'code', e.target.value.toUpperCase())} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white uppercase font-bold tracking-wider text-sm" />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-xs mb-1">Special Ticket Price (₹)</label>
                          <input type="number" placeholder="199" value={c.price} onChange={(e) => updatePartnerCoupon(index, 'price', e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm" />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-xs mb-1">Usage Limit (First N Members)</label>
                          <input type="number" placeholder="100" value={c.max_uses} onChange={(e) => updatePartnerCoupon(index, 'max_uses', e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm" />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={addPartnerCoupon} className="w-full py-3.5 mt-2 border-2 border-dashed border-violet-500/50 text-violet-300 font-bold rounded-2xl hover:bg-violet-500/10 transition text-sm">
                    + Add Partner Coupon Code
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* SLAB PRICING */}
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-2 text-cyan-300">
                    Ticket Pricing Slabs (2 Slabs - 150 Registration Limit Each)
                  </h2>
                  <p className="text-gray-400 text-sm mb-6">
                    Registration starts in <strong className="text-cyan-300">Early Bird Offer</strong> (first 150 registrations), then automatically switches to <strong className="text-cyan-300">Normal Slab</strong> for the next 150 registrations (Total capacity limit: 300).
                  </p>
                  <div className="grid md:grid-cols-2 gap-5">
                    {/* SLAB 1 */}
                    <div className="bg-black/20 p-5 rounded-2xl border border-white/10">
                      <h3 className="font-bold mb-4 text-cyan-300">Slab 1 (Early Bird Offer - Max 150 Members)</h3>
                      <label className="block text-gray-400 text-sm mb-2">Deadline (Optional)</label>
                      <input type="datetime-local" name="slab1_deadline" value={formData.slab1_deadline} onChange={handleChange} className="w-full p-3 mb-4 rounded-xl bg-black/40 border border-white/10 text-white" />
                      <label className="block text-gray-400 text-sm mb-2">Solo Price (₹)</label>
                      <input type="number" name="slab1_solo_price" value={formData.slab1_solo_price} onChange={handleChange} placeholder="299" className="w-full p-3 mb-4 rounded-xl bg-black/40 border border-white/10 text-white" />
                      <label className="block text-gray-400 text-sm mb-2">Couple Price (₹)</label>
                      <input type="number" name="slab1_couple_price" value={formData.slab1_couple_price} onChange={handleChange} placeholder="499" className="w-full p-3 mb-4 rounded-xl bg-black/40 border border-white/10 text-white" />
                      <label className="block text-gray-400 text-sm mb-2">Group Price (₹)</label>
                      <input type="number" name="slab1_group_price" value={formData.slab1_group_price} onChange={handleChange} placeholder="999" className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white" />
                    </div>
                    {/* SLAB 2 */}
                    <div className="bg-black/20 p-5 rounded-2xl border border-white/10">
                      <h3 className="font-bold mb-4 text-cyan-300">Slab 2 (Normal Slab - Max 150 Members)</h3>
                      <label className="block text-gray-400 text-sm mb-2">Deadline (Optional)</label>
                      <input type="datetime-local" name="slab2_deadline" value={formData.slab2_deadline} onChange={handleChange} className="w-full p-3 mb-4 rounded-xl bg-black/40 border border-white/10 text-white" />
                      <label className="block text-gray-400 text-sm mb-2">Solo Price (₹)</label>
                      <input type="number" name="slab2_solo_price" value={formData.slab2_solo_price} onChange={handleChange} placeholder="399" className="w-full p-3 mb-4 rounded-xl bg-black/40 border border-white/10 text-white" />
                      <label className="block text-gray-400 text-sm mb-2">Couple Price (₹)</label>
                      <input type="number" name="slab2_couple_price" value={formData.slab2_couple_price} onChange={handleChange} placeholder="699" className="w-full p-3 mb-4 rounded-xl bg-black/40 border border-white/10 text-white" />
                      <label className="block text-gray-400 text-sm mb-2">Group Price (₹)</label>
                      <input type="number" name="slab2_group_price" value={formData.slab2_group_price} onChange={handleChange} placeholder="1299" className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white" />
                    </div>
                  </div>
                </div>

                {/* BULK PASS */}
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-6 text-pink-300">
                    Bulk Pass Options (Optional)
                  </h2>
                  <div className="bg-black/20 p-6 rounded-3xl border border-pink-500/30">
                    <p className="text-gray-400 mb-6">
                      Offer a custom bulk ticket that allows users to register multiple members at a flat price.
                    </p>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-gray-300 text-lg mb-2">Flat Price (₹)</label>
                        <input 
                          type="number" 
                          name="bulk_pass_price" 
                          value={formData.bulk_pass_price} 
                          onChange={handleChange} 
                          placeholder="5000" 
                          className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-lg mb-2">Number of Members</label>
                        <input 
                          type="number" 
                          name="bulk_pass_entries" 
                          value={formData.bulk_pass_entries} 
                          onChange={handleChange} 
                          placeholder="10" 
                          className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* EVENT HIGHLIGHTS */}

            <div className="mb-10">

              <h2 className="
                text-2xl
                font-bold
                mb-6
                text-cyan-300
              ">
                Event Highlights
              </h2>

              <div className="
                grid
                md:grid-cols-3
                gap-5
              ">

                {/* CARD 1 */}

                <div>

                  <input

                    type="text"

                    name="feature1_value"

                    placeholder="Ex: 10K+"

                    value={formData.feature1_value}

                    onChange={handleChange}

                    className="
                      w-full
                      p-4
                      rounded-2xl
                      bg-black/40
                      border
                      border-white/10
                      text-white
                      mb-3
                    "

                  />

                  <input

                    type="text"

                    name="feature1_title"

                    placeholder="Ex: Participants"

                    value={formData.feature1_title}

                    onChange={handleChange}

                    className="
                      w-full
                      p-4
                      rounded-2xl
                      bg-black/40
                      border
                      border-white/10
                      text-white
                    "

                  />

                </div>

                {/* CARD 2 */}

                <div>

                  <input

                    type="text"

                    name="feature2_value"

                    placeholder="Ex: Save Earth"

                    value={formData.feature2_value}

                    onChange={handleChange}

                    className="
                      w-full
                      p-4
                      rounded-2xl
                      bg-black/40
                      border
                      border-white/10
                      text-white
                      mb-3
                    "

                  />

                  <input

                    type="text"

                    name="feature2_title"

                    placeholder="Ex: Cause"

                    value={formData.feature2_title}

                    onChange={handleChange}

                    className="
                      w-full
                      p-4
                      rounded-2xl
                      bg-black/40
                      border
                      border-white/10
                      text-white
                    "

                  />

                </div>

                {/* CARD 3 */}

                <div>

                  <input

                    type="text"

                    name="feature3_value"

                    placeholder="Ex: 21KM"

                    value={formData.feature3_value}

                    onChange={handleChange}

                    className="
                      w-full
                      p-4
                      rounded-2xl
                      bg-black/40
                      border
                      border-white/10
                      text-white
                      mb-3
                    "

                  />

                  <input

                    type="text"

                    name="feature3_title"

                    placeholder="Ex: Marathon"

                    value={formData.feature3_title}

                    onChange={handleChange}

                    className="
                      w-full
                      p-4
                      rounded-2xl
                      bg-black/40
                      border
                      border-white/10
                      text-white
                    "

                  />

                </div>

              </div>

            </div>

            {/* EVENT POSTER / BANNER UPLOAD */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4 text-cyan-300 flex items-center gap-2">
                <ImageIcon size={24} />
                Event Poster / Banner Image
              </h2>
              <div className="p-6 rounded-3xl bg-black/40 border border-white/10 text-center">
                {bannerPreview ? (
                  <div className="relative mb-4 group rounded-2xl overflow-hidden max-h-64 border border-white/20">
                    <img
                      src={bannerPreview}
                      alt="Banner Preview"
                      className="w-full h-56 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <p className="text-white font-bold text-sm">Click below to replace poster</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 mb-4 border-2 border-dashed border-white/20 rounded-2xl bg-white/5 flex flex-col items-center justify-center">
                    <ImageIcon size={48} className="text-gray-400 mb-2" />
                    <p className="text-gray-400 text-sm">No poster image uploaded yet</p>
                  </div>
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white font-bold px-6 py-3.5 rounded-2xl transition shadow-lg hover:scale-105">
                  <ImageIcon size={20} />
                  {bannerPreview ? 'Change Event Poster Image' : 'Upload Event Poster Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBanner}
                    className="hidden"
                  />
                </label>
                {bannerFile && (
                  <p className="text-emerald-400 text-xs mt-3 font-semibold">
                    New poster selected: {bannerFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* SUBMIT */}

            <button

              type="submit"

              disabled={loading}

              className="
                w-full
                bg-violet-500
                hover:bg-violet-600
                disabled:bg-gray-500
                py-5
                rounded-2xl
                text-xl
                font-bold
                transition
                shadow-2xl
                shadow-violet-500/30
                hover:scale-[1.02]
                flex
                items-center
                justify-center
                gap-3
              "

            >

              {

                loading

                  ? 'Saving...'

                  : 'Save Event Details'

              }

              <ArrowRight size={22} />

            </button>

          </motion.form>

          {/* LIVE PREVIEW */}

          <motion.div

            initial={{ opacity: 0, x: 40 }}

            animate={{ opacity: 1, x: 0 }}

            transition={{ duration: 0.8 }}

            className="
              sticky
              top-28
            "

          >

            <div className="
              bg-white/5
              backdrop-blur-2xl
              border
              border-white/10
              rounded-[40px]
              overflow-hidden
              shadow-2xl
            ">

              {/* BANNER */}

              <div className="
                h-[300px]
                relative
                overflow-hidden
              ">

                {

                  bannerPreview ? (

                    <img

                      src={bannerPreview}

                      alt="Banner"

                      className="
                        w-full
                        h-full
                        object-cover
                      "

                    />

                  ) : (

                    <div className="
                      w-full
                      h-full
                      bg-gradient-to-br
                      from-violet-600
                      via-fuchsia-500
                      to-cyan-500
                      flex
                      items-center
                      justify-center
                    ">

                      <PartyPopper
                        size={90}
                        className="
                          text-white/70
                        "
                      />

                    </div>

                  )

                }

              </div>

              {/* CONTENT */}

              <div className="p-8">

                <div className="
                  inline-flex
                  items-center
                  gap-2
                  bg-white/5
border-white/10
backdrop-blur-xl
hover:scale-105
transition                  px-4
                  py-2
                  rounded-full
                  mb-6
                ">

                  <Music2
                    size={16}
                    className="
                      text-cyan-300
                    "
                  />

                  <p className="
                    text-sm
                    text-gray-300
                  ">

                    {

                      formData.category ||

                      'Event Category'

                    }

                  </p>

                </div>

                <h1 className="
                  text-5xl
                  font-black
                  mb-4
                ">

                  {

                    formData.title ||

                    'Your Event Name'

                  }

                </h1>

                <p className="
                  text-xl
                  text-gray-400
                  mb-8
                ">

                  {

                    formData.tagline ||

                    'Your event tagline'

                  }

                </p>

                {/* DETAILS */}

                <div className="
                  flex
                  flex-wrap
                  gap-4
                  mb-8
                ">

                  <div className="
                    bg-white/5
border-white/10
backdrop-blur-xl
hover:scale-105
transition                    px-5
                    py-3
                    rounded-2xl
                    flex
                    items-center
                    gap-3
                  ">

                    <MapPin
                      size={18}
                      className="
                        text-cyan-300
                      "
                    />

                    <p className="
                      text-gray-300
                    ">

                      {

                        formData.venue ||

                        'Your Venue'

                      }

                    </p>

                  </div>

                  <div className="
                    bg-white/5
border-white/10
backdrop-blur-xl
hover:scale-105
transition                    px-5
                    py-3
                    rounded-2xl
                    flex
                    items-center
                    gap-3
                  ">

                    <CalendarDays
                      size={18}
                      className="
                        text-violet-300
                      "
                    />

                    <p className="
                      text-gray-300
                    ">

                      {

                        formData.event_date ||

                        'Event Date'

                      }

                    </p>

                  </div>

                </div>

                {/* DESCRIPTION */}

                <p className="
                  text-gray-400
                  leading-relaxed
                  text-lg
                  mb-10
                ">

                  {

                    formData.description ||

                    'Your event description will appear here beautifully.'

                  }

                </p>

                {/* FEATURES */}

                <div className="
                  grid
                  md:grid-cols-3
                  gap-5
                ">

                  {/* CARD 1 */}

                  <div className="
                    bg-white/5
border-white/10
backdrop-blur-xl
hover:scale-105
transition                    border
                    border-white/10
                    rounded-3xl
                    p-5
                    text-center
                  ">

                    <Users
                      size={36}
                      className="
                        text-cyan-300
                        mx-auto
                        mb-3
                      "
                    />

                    <h3 className="
                      text-2xl
                      font-bold
                    ">

                      {

                        formData.feature1_value ||

                        '5K+'

                      }

                    </h3>

                    <p className="
                      text-gray-400
                    ">

                      {

                        formData.feature1_title ||

                        'Attendees'

                      }

                    </p>

                  </div>

                  {/* CARD 2 */}

                  <div className="
                    bg-white/5
border-white/10
backdrop-blur-xl
hover:scale-105
transition                    border
                    border-white/10
                    rounded-3xl
                    p-5
                    text-center
                  ">

                    <ShieldCheck
                      size={36}
                      className="
                        text-violet-300
                        mx-auto
                        mb-3
                      "
                    />

                    <h3 className="
                      text-2xl
                      font-bold
                    ">

                      {

                        formData.feature2_value ||

                        'QR'

                      }

                    </h3>

                    <p className="
                      text-gray-400
                    ">

                      {

                        formData.feature2_title ||

                        'Smart Tickets'

                      }

                    </p>

                  </div>

                  {/* CARD 3 */}

                  <div className="
                    bg-white/5
border-white/10
backdrop-blur-xl
hover:scale-105
transition                    border
                    border-white/10
                    rounded-3xl
                    p-5
                    text-center
                  ">

                    <ScanLine
                      size={36}
                      className="
                        text-pink-300
                        mx-auto
                        mb-3
                      "
                    />

                    <h3 className="
                      text-2xl
                      font-bold
                    ">

                      {

                        formData.feature3_value ||

                        'Live'

                      }

                    </h3>

                    <p className="
                      text-gray-400
                    ">

                      {

                        formData.feature3_title ||

                        'Experience'

                      }

                    </p>

                  </div>

                </div>

              </div>

            </div>

          </motion.div>

        </div>

      </div>

    </main>

  );

}