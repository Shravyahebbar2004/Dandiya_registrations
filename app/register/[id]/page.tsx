'use client';

import { useEffect, useState, use } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function RegisterPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);

  // =====================================
  // STATES
  // =====================================

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [totalAmount, setTotalAmount] = useState(0);
  const [allowedEntries, setAllowedEntries] = useState(0);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    emergency_contact_name: '',
    emergency_contact: '',
    blood_group: '',
    gender: '',
    club_affiliation: '',
    custom_club_name: ''
  });

  const [quantities, setQuantities] = useState<Record<string, number>>({
    solo: 0,
    couple: 0,
    group: 0,
    bulk: 0,
    dandiya: 1
  });

  const [participants, setParticipants] = useState<any[]>([]);

  const [step, setStep] = useState(1);

  const [activeSlabKey, setActiveSlabKey] = useState<string>('slab1');
  const [activeSlabName, setActiveSlabName] = useState<string>('Early Bird Offer');
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasAdminQuery = window.location.search.includes('admin=true');
      if (hasAdminQuery) {
        setIsAdminMode(true);
      }
    }
  }, []);

  // COUPON CODE STATES
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) {
      setCouponMessage({ type: 'error', text: 'Please enter a coupon code.' });
      return;
    }

    if (!event || !event.coupons) {
      setCouponMessage({ type: 'error', text: 'Invalid coupon code.' });
      return;
    }

    let coupons = [];
    try {
      coupons = typeof event.coupons === 'string' ? JSON.parse(event.coupons) : (event.coupons || []);
    } catch(e) {
      coupons = [];
    }

    const match = coupons.find((c: any) => c.code && c.code.trim().toUpperCase() === couponInput.trim().toUpperCase());

    if (!match) {
      setAppliedCoupon(null);
      setCouponMessage({ type: 'error', text: `Invalid coupon code '${couponInput}'.` });
      return;
    }

    const maxUses = Number(match.max_uses) || 0;
    const currentUses = Number(match.used_count) || 0;

    if (maxUses > 0 && currentUses >= maxUses) {
      setAppliedCoupon(null);
      setCouponMessage({ type: 'error', text: `Offer is over for coupon '${match.code}' (limit of ${maxUses} members reached). Continuing with actual prices.` });
      return;
    }

    setAppliedCoupon(match);
    setCouponMessage({ type: 'success', text: `Coupon '${match.code}' applied! Special price ₹${match.price} per ticket.` });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMessage(null);
  };

  const getDandiyaConfig = (evt: any) => {
    if (!evt || !evt.custom_pricing) return null;
    try {
      const parsed = typeof evt.custom_pricing === 'string' ? JSON.parse(evt.custom_pricing) : evt.custom_pricing;
      if (parsed && (parsed.type === 'dandiya_tiered' || parsed.flash_sale)) {
        return parsed;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const dandiyaConfig = getDandiyaConfig(event);
  const isDandiyaTiered = Boolean(dandiyaConfig);

  const hasCustomPricing = Boolean(!isDandiyaTiered && event?.custom_pricing && (() => {
    try {
      const parsed = typeof event.custom_pricing === 'string' ? JSON.parse(event.custom_pricing) : event.custom_pricing;
      return Array.isArray(parsed) && parsed.length > 0;
    } catch (e) {
      return false;
    }
  })());

  // Dynamic price calculator
  useEffect(() => {
    if (!event) return;
    
    let amount = 0;
    let entries = 0;

    const dandiyaCfg = getDandiyaConfig(event);

    if (dandiyaCfg) {
      const qty = Math.max(1, quantities.dandiya || 1);
      let unitPrice = 0;

      if (appliedCoupon && Number(appliedCoupon.price) >= 0) {
        unitPrice = Number(appliedCoupon.price);
      } else if (activeSlabKey === 'flash_sale') {
        unitPrice = Number(dandiyaCfg.flash_sale?.price) || 249;
      } else {
        const currentSlab = dandiyaCfg[activeSlabKey] || dandiyaCfg.slab1 || {};
        if (qty >= 10) {
          unitPrice = Number(currentSlab.price_10_plus) || (Number(currentSlab.price_1_4) || 299);
        } else if (qty >= 5) {
          unitPrice = Number(currentSlab.price_5_9) || (Number(currentSlab.price_1_4) || 299);
        } else {
          unitPrice = Number(currentSlab.price_1_4) || 299;
        }
      }

      amount = unitPrice * qty;
      entries = qty;
      setTotalAmount(amount);
      setAllowedEntries(entries);
      return;
    }

    if (hasCustomPricing) {
      try {
        const customPricing = typeof event.custom_pricing === 'string' 
          ? JSON.parse(event.custom_pricing) 
          : event.custom_pricing;
          
        customPricing.forEach((d: any) => {
          const qty = quantities[d.name] || 0;
          const price = appliedCoupon && Number(appliedCoupon.price) >= 0
            ? Number(appliedCoupon.price)
            : (Number(d[activeSlabKey]) || 0);
          amount += price * qty;
          
          let passEntries = 1;
          const lower = d.name?.toLowerCase() || '';
          if (lower.includes('couple')) passEntries = 2;
          else if (lower.includes('group') || lower.includes('5')) passEntries = 5;

          entries += qty * passEntries;
        });
      } catch (e) {
        console.error("Error parsing custom pricing", e);
      }
    } else {
      const soloPrice = appliedCoupon && Number(appliedCoupon.price) >= 0 ? Number(appliedCoupon.price) : (Number(event[`${activeSlabKey}_solo_price`]) || 0);
      amount += quantities.solo * soloPrice;
      entries += quantities.solo * 1;

      const couplePrice = Number(event[`${activeSlabKey}_couple_price`]) || 0;
      amount += quantities.couple * couplePrice;
      entries += quantities.couple * 2;

      const groupPrice = Number(event[`${activeSlabKey}_group_price`]) || 0;
      amount += quantities.group * groupPrice;
      entries += quantities.group * 4;

      const bulkPrice = Number(event.bulk_pass_price) || 0;
      amount += quantities.bulk * bulkPrice;
      entries += quantities.bulk * (Number(event.bulk_pass_entries) || 0);
    }

    setTotalAmount(amount);
    setAllowedEntries(entries);
  }, [quantities, activeSlabKey, event, appliedCoupon, hasCustomPricing]);

  const [paymentProof, setPaymentProof] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);

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
      const evt = response.data.event;
      setEvent(evt);

      const dandiyaCfg = getDandiyaConfig(evt);
      const now = new Date().getTime();
      const totalRegs = Number(evt.total_registrations) || 0;

      if (dandiyaCfg) {
        let slabKey = 'slab1';
        let slabName = "Early Bird Offer";
        let registrationClosed = false;

        const flash = dandiyaCfg.flash_sale || {};
        const s1 = dandiyaCfg.slab1 || {};
        const s2 = dandiyaCfg.slab2 || {};
        const s3 = dandiyaCfg.slab3 || {};

        const flashLimit = Number(flash.threshold) || 50;
        const s1Limit = Number(s1.threshold) || 150;
        const s2Limit = Number(s2.threshold) || 300;
        const s3Limit = Number(s3.threshold) || 500;

        const flashDeadlinePassed = flash.deadline ? now > new Date(flash.deadline).getTime() : false;
        const s1DeadlinePassed = s1.deadline ? now > new Date(s1.deadline).getTime() : false;
        const s2DeadlinePassed = s2.deadline ? now > new Date(s2.deadline).getTime() : false;
        const s3DeadlinePassed = s3.deadline ? now > new Date(s3.deadline).getTime() : false;

        if (evt.event_status === 'CLOSED' || evt.is_closed) {
          registrationClosed = true;
        } else if (flash.enabled !== false && totalRegs < flashLimit && !flashDeadlinePassed) {
          slabKey = 'flash_sale';
          slabName = "⚡ Flash Offer";
        } else if (totalRegs < s1Limit && !s1DeadlinePassed) {
          slabKey = 'slab1';
          slabName = "🐦 Early Bird Offer";
        } else if (totalRegs < s2Limit && !s2DeadlinePassed) {
          slabKey = 'slab2';
          slabName = "🎫 Normal Slab";
        } else if (s3.enabled && totalRegs < s3Limit && !s3DeadlinePassed) {
          slabKey = 'slab3';
          slabName = s3.name || "🔥 Last Chance Slab";
        } else {
          registrationClosed = true;
        }

        setActiveSlabKey(slabKey);
        setActiveSlabName(slabName);
        setIsClosed(registrationClosed);
        return;
      }

      // Determine Slab and Registration Status (2 Slabs with 150 Registration Thresholds or 12:00 AM IST Cutoff)
      const earlyBirdCutoff = evt.slab1_deadline ? new Date(evt.slab1_deadline).getTime() : new Date('2026-08-10T00:00:00+05:30').getTime();

      let slabKey = 'slab1';
      let slabName = "Early Bird Offer";
      let registrationClosed = false;

      // 1. Explicit Database Closed Status or Total Capacity limit (300) or Deadlines
      if (evt.event_status === 'CLOSED' || evt.is_closed || totalRegs >= 300) {
        registrationClosed = true;
      } else if (evt.slab2_deadline && now > new Date(evt.slab2_deadline).getTime()) {
        registrationClosed = true;
      } else if (evt.registration_deadline && now > new Date(evt.registration_deadline).getTime()) {
        registrationClosed = true;
      }

      if (!registrationClosed) {
        // Transition to Normal Slab after 12:00 AM IST or after 150 registrations
        if (now >= earlyBirdCutoff || totalRegs >= 150) {
          slabKey = 'slab2';
          slabName = "Normal Slab";
        } else {
          slabKey = 'slab1';
          slabName = "Early Bird Offer";
        }
      }

      setActiveSlabKey(slabKey);
      setActiveSlabName(slabName);
      setIsClosed(registrationClosed);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // HANDLE INPUT CHANGE
  // =====================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleParticipantChange = (index: number, field: string, value: string) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  // =====================================
  // HANDLE REGISTER
  // =====================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // EXPLICIT MANDATORY FIELD VALIDATION & NOTIFICATIONS
    const isMarathon = event.category?.toLowerCase()?.trim() === 'marathon';

    if (isMarathon) {
      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];
        if (!p.full_name?.trim()) {
          alert(`Please enter Full Name for Runner #${i + 1}!`);
          return;
        }
        if (!p.gender) {
          alert(`Please select Gender for Runner #${i + 1}!`);
          return;
        }
        if (!p.blood_group) {
          alert(`Please select Blood Group for Runner #${i + 1}!`);
          return;
        }
      }
    } else {
      if (!formData.full_name?.trim()) {
        alert("Please enter your Full Name!");
        return;
      }
      if (!formData.blood_group) {
        alert("Please select your Blood Group!");
        return;
      }
      if (!formData.gender) {
        alert("Please select your Gender!");
        return;
      }
    }

    if (!formData.email?.trim()) {
      alert("Please enter your Email Address!");
      return;
    }
    if (!formData.phone_number?.trim()) {
      alert("Please enter your Phone Number!");
      return;
    }
    if (!formData.emergency_contact_name?.trim()) {
      alert("Please enter Emergency Contact Name!");
      return;
    }
    if (!formData.emergency_contact?.trim()) {
      alert("Please enter Emergency Contact Number!");
      return;
    }
    if (!formData.club_affiliation) {
      alert("Please select your Club / Category Affiliation!");
      return;
    }
    if ((formData.club_affiliation === 'Rotaract Club' || formData.club_affiliation === 'Run Club') && !formData.custom_club_name?.trim()) {
      alert(`Please enter your ${formData.club_affiliation} Name!`);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      alert("Please enter a valid email address!");
      return;
    }

    const parsePhone = (phone: string) => {
      let cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 12 && cleaned.startsWith('91')) {
        cleaned = cleaned.substring(2);
      } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      return cleaned;
    };

    const phoneRegex = /^[6-9]\d{9}$/;
    
    if (!phoneRegex.test(parsePhone(formData.phone_number))) {
      alert("Please enter a valid 10-digit Indian phone number!");
      return;
    }

    if (!phoneRegex.test(parsePhone(formData.emergency_contact))) {
      alert("Please enter a valid 10-digit Indian phone number for Emergency Contact!");
      return;
    }

    try {
      setSubmitting(true);

      const tickets: string[] = [];
      const isMarathon = event.category?.toLowerCase()?.trim() === 'marathon';
      const dandiyaCfg = getDandiyaConfig(event);
      
      if (isMarathon) {
        participants.forEach(p => tickets.push(p.ticket_type));
      } else if (dandiyaCfg) {
        const qty = Math.max(1, quantities.dandiya || 1);
        tickets.push(`Dandiya Pass (${qty} ${qty > 1 ? 'Entries' : 'Entry'})`);
      } else {
        for (let i = 0; i < quantities.solo; i++) tickets.push('solo');
        for (let i = 0; i < quantities.couple; i++) tickets.push('couple');
        for (let i = 0; i < quantities.group; i++) tickets.push('group');
        for (let i = 0; i < quantities.bulk; i++) tickets.push('bulk');
      }

      if (tickets.length === 0) {
        alert("Please select at least one pass!");
        setSubmitting(false);
        return;
      }

      if (!paymentProof) {
        alert("Payment screenshot required!");
        setSubmitting(false);
        return;
      }

      // PREPARE DRAFT REGISTRATION DATA
      const draftData = new FormData();
      draftData.append('full_name', formData.full_name || (isMarathon && participants.length > 0 ? participants[0].full_name : 'Group Purchaser'));
      draftData.append('email', formData.email);
      draftData.append('phone_number', formData.phone_number);
      draftData.append('emergency_contact_name', formData.emergency_contact_name);
      draftData.append('emergency_contact', formData.emergency_contact);
      draftData.append('blood_group', formData.blood_group || '');
      draftData.append('gender', formData.gender || '');

      let finalClubAffiliation = formData.club_affiliation || '';
      if ((formData.club_affiliation === 'Rotaract Club' || formData.club_affiliation === 'Run Club') && formData.custom_club_name?.trim()) {
        finalClubAffiliation = `${formData.club_affiliation} (${formData.custom_club_name.trim()})`;
      }
      draftData.append('club_affiliation', finalClubAffiliation);
      draftData.append('tickets', JSON.stringify(tickets));
      if (isMarathon) {
        draftData.append('participants', JSON.stringify(participants));
      }
      draftData.append('total_amount', totalAmount.toString());
      draftData.append('allowed_entries', allowedEntries.toString());
      draftData.append('event_id', id);
      draftData.append('is_admin_mode', isAdminMode ? 'true' : 'false');

      if (paymentProof) {
        draftData.append('payment_proof', paymentProof);
      }

      // SEND OTP FIRST & SAVE DRAFT IMMEDIATELY
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/send-otp`,
        draftData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success) {
        setShowOtpModal(true);
      }
    } catch (error: any) {
      console.log('FULL ERROR:', error);
      alert(error?.response?.data?.message || 'Failed to send verification code. Please check your email address.');
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================
  // HANDLE OTP VERIFY AND REGISTER
  // =====================================

  const handleVerifyAndRegister = async () => {
    try {
      setOtpSending(true);

      const tickets: string[] = [];
      const isMarathon = event.category?.toLowerCase()?.trim() === 'marathon';
      const dandiyaCfg = getDandiyaConfig(event);
      
      if (isMarathon) {
        participants.forEach(p => tickets.push(p.ticket_type));
      } else if (dandiyaCfg) {
        const qty = Math.max(1, quantities.dandiya || 1);
        tickets.push(`Dandiya Pass (${qty} ${qty > 1 ? 'Entries' : 'Entry'})`);
      } else {
        for (let i = 0; i < quantities.solo; i++) tickets.push('solo');
        for (let i = 0; i < quantities.couple; i++) tickets.push('couple');
        for (let i = 0; i < quantities.group; i++) tickets.push('group');
        for (let i = 0; i < quantities.bulk; i++) tickets.push('bulk');
      }

      const submitData = new FormData();
      submitData.append('full_name', formData.full_name || (isMarathon && participants.length > 0 ? participants[0].full_name : 'Group Purchaser'));
      submitData.append('email', formData.email);
      submitData.append('phone_number', formData.phone_number);
      submitData.append('emergency_contact_name', formData.emergency_contact_name);
      submitData.append('emergency_contact', formData.emergency_contact);
      submitData.append('blood_group', formData.blood_group || '');
      submitData.append('gender', formData.gender || '');
      
      let finalClubAffiliation = formData.club_affiliation || '';
      if ((formData.club_affiliation === 'Rotaract Club' || formData.club_affiliation === 'Run Club') && formData.custom_club_name?.trim()) {
        finalClubAffiliation = `${formData.club_affiliation} (${formData.custom_club_name.trim()})`;
      }
      submitData.append('club_affiliation', finalClubAffiliation);
      
      // We pass tickets array as JSON
      submitData.append('tickets', JSON.stringify(tickets));
      
      if (isMarathon) {
        submitData.append('participants', JSON.stringify(participants));
      }
      
      submitData.append('total_amount', totalAmount.toString());
      submitData.append('allowed_entries', allowedEntries.toString());
      submitData.append('event_id', id);
      submitData.append('otp', otp);
      if (appliedCoupon) {
        submitData.append('coupon_code', appliedCoupon.code);
      }

      if (paymentProof) {
        submitData.append('payment_proof', paymentProof);
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/register`,
        submitData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('API RESPONSE:', response.data);
      setShowOtpModal(false);
      setSubmitted(true);
      console.log('REGISTRATION SUCCESS');

    } catch (error: any) {
      console.log('FULL ERROR:', error);
      alert(error?.response?.data?.message || 'Registration Failed');
    } finally {
      setOtpSending(false);
    }
  };

  // =====================================
  // UI HELPERS
  // =====================================

  const renderCounter = (type: string, label: string, subtitle: string, price: number) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 sm:p-5 bg-white/5 border border-white/10 rounded-3xl mb-4 hover:bg-white/10 transition">
      <div>
        <h3 className="text-lg sm:text-xl font-bold">{label}</h3>
        <p className="text-gray-400 text-xs sm:text-sm">{subtitle} • ₹{price}</p>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 bg-black/40 p-2 rounded-2xl self-end sm:self-auto">
        <button 
          type="button" 
          onClick={() => setQuantities({...quantities, [type]: Math.max(0, (quantities[type] || 0) - 1)})}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg sm:text-xl font-bold transition"
        >
          -
        </button>
        <span className="text-lg sm:text-xl font-bold w-4 text-center">{quantities[type] || 0}</span>
        <button 
          type="button"
          onClick={() => setQuantities({...quantities, [type]: (quantities[type] || 0) + 1})}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg sm:text-xl font-bold transition"
        >
          +
        </button>
      </div>
    </div>
  );



  // =====================================
  // RENDER BLOCKS
  // =====================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white text-2xl">
        Loading...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500 text-3xl font-bold">
        Event Not Found
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white text-center p-6">
        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[40px] p-8 md:p-12 max-w-xl shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 bg-green-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-green-500/30 text-green-400 font-black text-4xl">
            ✓
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-green-300 via-white to-cyan-300 bg-clip-text text-transparent">
            Registration Submitted Successfully! 🎉
          </h1>
          
          <p className="text-gray-300 text-base md:text-lg mb-6 leading-relaxed">
            Your registration is currently pending admin payment verification.
          </p>

          <div className="bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-pink-500/10 border border-white/10 rounded-3xl p-6 mb-8 text-left space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📩</span>
              <div>
                <h4 className="font-bold text-white text-base">Confirmation Email</h4>
                <p className="text-sm text-gray-300 leading-snug">
                  Once approved by the admin, your official QR Pass ticket will be sent directly to your registered email ID.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 pt-3 border-t border-white/10">
              <span className="text-2xl">🎟️</span>
              <div>
                <h4 className="font-bold text-white text-base">Check In "View My Ticket" Section</h4>
                <p className="text-sm text-gray-300 leading-snug">
                  You can also check your ticket status anytime in the <strong className="text-cyan-300">View My Ticket</strong> section using your registered email or phone number.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <Link href={`/my-ticket/${event?.event_id || id}`}>
              <button className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 px-8 py-3.5 rounded-2xl font-bold text-lg text-white shadow-xl transition hover:scale-105">
                Go to Ticket Section 🎟️
              </button>
            </Link>
          </div>

          <div className="border-t border-white/10 pt-6 text-gray-400 text-xs md:text-sm">
            <p className="mb-1 text-gray-400">For more information or urgent queries, contact:</p>
            <p className="font-bold text-white text-base">Shravya Hebbar</p>
            <p className="text-cyan-400 font-medium mt-1">
              📧 <a href="mailto:rotaractyelahanka.events@gmail.com" className="hover:underline">rotaractyelahanka.events@gmail.com</a> | 📞 <a href="tel:9611444945" className="hover:underline">9611444945</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isClosed && !isAdminMode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white text-center p-6">
        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[40px] p-8 md:p-14 max-w-xl shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <span className="text-4xl">🔒</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
            Online Registration Closed
          </h1>
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            Online registration for <strong className="text-white">{event.title}</strong> is now closed as the registration slab dates have ended.
          </p>

          <div className="border-t border-white/10 pt-6 text-gray-400 text-sm">
            <p className="mb-2">For any event queries, contact:</p>
            <p className="font-bold text-white text-base">Shravya Hebbar</p>
            <p className="text-cyan-400 font-medium mt-1">📧 <a href="mailto:rotaractyelahanka.events@gmail.com" className="hover:underline">rotaractyelahanka.events@gmail.com</a> | 📞 <a href="tel:9611444945" className="hover:underline">9611444945</a></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 md:p-10">
      {isAdminMode && (
        <div className="w-full max-w-3xl bg-amber-500/20 border border-amber-500/40 rounded-2xl p-4 mb-6 text-amber-200 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <div>
              <p className="font-bold text-amber-300">Admin Registration Mode Active</p>
              <p className="text-xs text-amber-200/80">Registration override enabled. You can register participants even when online registrations are closed for public users.</p>
            </div>
          </div>
        </div>
      )}

      {isDandiyaTiered && step === 1 ? (
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-10 w-full max-w-3xl shadow-2xl">
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-rose-500 text-black shadow-lg mb-3">
              ✨ Dandiya Raas Ticketing
            </span>
            <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-amber-200 via-rose-300 to-amber-400 bg-clip-text text-transparent">
              {event.title}
            </h1>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">
              Customize and select your passes. Dynamic discounts automatically unlock with group bookings!
            </p>
          </div>

          {/* ACTIVE OFFER BANNER */}
          {activeSlabKey === 'flash_sale' ? (
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border-2 border-amber-500/60 rounded-3xl p-6 mb-8 text-left shadow-[0_0_40px_rgba(245,158,11,0.25)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-full animate-pulse">
                      ⚡ Flash Sale Live
                    </span>
                    <span className="text-xs text-amber-300 font-bold">Limited Time Initial Drop</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    Flat <span className="text-amber-400">₹{dandiyaConfig.flash_sale?.price || 249}</span> per Ticket!
                  </h2>
                  <p className="text-amber-200/90 text-sm mt-1 max-w-md">
                    Exclusive launch offer for the first {dandiyaConfig.flash_sale?.threshold || 50} tickets. As soon as ticket #{dandiyaConfig.flash_sale?.threshold || 50} sells, the Early Bird tier starts!
                  </p>
                </div>
                <div className="bg-black/50 border border-amber-500/40 rounded-2xl p-4 text-center min-w-[170px] self-center md:self-auto">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Passes Sold</p>
                  <p className="text-2xl font-black text-amber-300 my-1">
                    {Number(event.total_registrations) || 0} / {dandiyaConfig.flash_sale?.threshold || 50}
                  </p>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-rose-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, ((Number(event.total_registrations) || 0) / (Number(dandiyaConfig.flash_sale?.threshold) || 50)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-amber-400/80 font-medium mt-1">
                    {Math.max(0, (Number(dandiyaConfig.flash_sale?.threshold) || 50) - (Number(event.total_registrations) || 0))} tickets remaining!
                  </p>
                </div>
              </div>
            </div>
          ) : activeSlabKey === 'slab1' ? (
            <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border-2 border-emerald-500/50 rounded-3xl p-6 mb-8 text-left shadow-[0_0_35px_rgba(16,185,129,0.2)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-emerald-500 text-black font-black text-xs uppercase tracking-wider rounded-full">
                      🐦 Early Bird Offer Active
                    </span>
                    <span className="text-xs text-emerald-300 font-bold">Phase 1 Volume Pricing</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    Early Bird Passes Available
                  </h2>
                  <p className="text-emerald-200/90 text-sm mt-1 max-w-md">
                    Take advantage of discounted rates with additional volume discounts on 5+ and 10+ ticket purchases. Valid up to {dandiyaConfig.slab1?.threshold || 150} tickets.
                  </p>
                </div>
                <div className="bg-black/50 border border-emerald-500/40 rounded-2xl p-4 text-center min-w-[160px] self-center md:self-auto">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Early Bird Capacity</p>
                  <p className="text-2xl font-black text-emerald-300 my-1">
                    {Number(event.total_registrations) || 0} / {dandiyaConfig.slab1?.threshold || 150}
                  </p>
                </div>
              </div>
            </div>
          ) : activeSlabKey === 'slab2' ? (
            <div className="bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-violet-500/20 border-2 border-blue-500/50 rounded-3xl p-6 mb-8 text-left shadow-[0_0_35px_rgba(59,130,246,0.2)]">
              <div>
                <span className="px-3 py-1 bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-full mb-2 inline-block">
                  🎫 Normal Slab Active
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  General Booking Phase
                </h2>
                <p className="text-blue-200/90 text-sm mt-1">
                  Standard passes with unlocked group volume discounts. Book your passes below!
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-3xl p-6 mb-8 text-left shadow-[0_0_35px_rgba(168,85,247,0.2)]">
              <div>
                <span className="px-3 py-1 bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-full mb-2 inline-block">
                  🔥 Last Chance Slab Active
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  Final Registration Phase
                </h2>
                <p className="text-purple-200/90 text-sm mt-1">
                  Last remaining passes for the event. Reserve before registrations close!
                </p>
              </div>
            </div>
          )}

          {/* VOLUME PRICING MATRIX DISPLAY */}
          {(() => {
            const currentSlab = dandiyaConfig[activeSlabKey] || dandiyaConfig.slab1 || {};
            const p1 = Number(currentSlab.price_1_4) || 299;
            const p5 = Number(currentSlab.price_5_9) || 269;
            const p10 = Number(currentSlab.price_10_plus) || 239;
            const currentQty = Math.max(1, quantities.dandiya || 1);

            if (activeSlabKey === 'flash_sale') {
              return null;
            }

            return (
              <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 mb-3 flex items-center gap-2">
                  <span>📊 Volume Pricing Matrix ({activeSlabName})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Tier 1 */}
                  <div className={`p-4 rounded-2xl border-2 transition-all ${currentQty >= 1 && currentQty <= 4 ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40' : 'bg-black/30 border-white/10 opacity-70'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-gray-300">1 - 4 Tickets</span>
                      {currentQty >= 1 && currentQty <= 4 && (
                        <span className="text-[10px] bg-amber-400 text-black font-black px-2 py-0.5 rounded-full">Active</span>
                      )}
                    </div>
                    <div className="text-2xl font-black text-white">₹{p1} <span className="text-xs font-normal text-gray-400">/ pass</span></div>
                    <p className="text-xs text-gray-400 mt-1">Standard Individual Rate</p>
                  </div>

                  {/* Tier 2 */}
                  <div className={`p-4 rounded-2xl border-2 transition-all ${currentQty >= 5 && currentQty <= 9 ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40' : 'bg-black/30 border-white/10 opacity-70'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-300">5 - 9 Tickets</span>
                      {currentQty >= 5 && currentQty <= 9 ? (
                        <span className="text-[10px] bg-amber-400 text-black font-black px-2 py-0.5 rounded-full">Active</span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full">Save ₹{p1 - p5}/ea</span>
                      )}
                    </div>
                    <div className="text-2xl font-black text-emerald-300">₹{p5} <span className="text-xs font-normal text-gray-400">/ pass</span></div>
                    <p className="text-xs text-gray-400 mt-1">Group Booking Discount</p>
                  </div>

                  {/* Tier 3 */}
                  <div className={`p-4 rounded-2xl border-2 transition-all ${currentQty >= 10 ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40' : 'bg-black/30 border-white/10 opacity-70'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-cyan-300">10+ Tickets</span>
                      {currentQty >= 10 ? (
                        <span className="text-[10px] bg-amber-400 text-black font-black px-2 py-0.5 rounded-full">Active</span>
                      ) : (
                        <span className="text-[10px] bg-cyan-500/30 text-cyan-300 font-bold px-2 py-0.5 rounded-full">Best Value</span>
                      )}
                    </div>
                    <div className="text-2xl font-black text-cyan-300">₹{p10} <span className="text-xs font-normal text-gray-400">/ pass</span></div>
                    <p className="text-xs text-gray-400 mt-1">Mega Bulk / Family Pass</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* QUANTITY CONTROLLER */}
          <div className="bg-black/40 border border-white/10 rounded-3xl p-6 sm:p-8 mb-8 text-center">
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">
              Select Number of Dandiya Passes
            </label>
            <div className="flex items-center justify-center gap-5 sm:gap-8 mb-6">
              <button
                type="button"
                onClick={() => setQuantities({ ...quantities, dandiya: Math.max(1, (quantities.dandiya || 1) - 1) })}
                className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-3xl font-black text-white transition border border-white/10 shadow-lg"
              >
                -
              </button>
              <div className="min-w-[120px]">
                <span className="text-5xl sm:text-6xl font-black text-amber-300 tracking-tight">
                  {quantities.dandiya || 1}
                </span>
                <p className="text-xs uppercase font-bold text-gray-400 tracking-widest mt-1">
                  {(quantities.dandiya || 1) > 1 ? 'Passes' : 'Pass'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuantities({ ...quantities, dandiya: Math.min(50, (quantities.dandiya || 1) + 1) })}
                className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-3xl font-black text-white transition border border-white/10 shadow-lg"
              >
                +
              </button>
            </div>

            {/* QUICK SELECTION PILLS */}
            <div className="flex flex-wrap justify-center gap-2 pt-2 border-t border-white/10">
              <span className="text-xs text-gray-400 font-bold self-center mr-2">Quick Pick:</span>
              {[
                { qty: 1, label: '1 Ticket' },
                { qty: 2, label: '2 Tickets (Couple)' },
                { qty: 5, label: '5 Tickets (Group)' },
                { qty: 10, label: '10 Tickets (Bulk)' }
              ].map(item => (
                <button
                  key={item.qty}
                  type="button"
                  onClick={() => setQuantities({ ...quantities, dandiya: item.qty })}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                    (quantities.dandiya || 1) === item.qty
                      ? 'bg-amber-500 text-black border-amber-400 font-black shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* INCLUSIONS NOTE */}
          <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-4 mb-8 flex items-center gap-3">
            <span className="text-2xl">🪩</span>
            <div className="text-left">
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">Pass Inclusions</p>
              <p className="text-sm text-gray-200">
                {dandiyaConfig.inclusions || 'Dandiya Sticks + Entry Pass + Refreshment Coupon Included'}
              </p>
            </div>
          </div>

          {/* PARTNER / COUPON CODE BOX */}
          {(() => {
            const hasCoupons = (() => {
              if (!event || !event.coupons) return false;
              try {
                const parsed = typeof event.coupons === 'string' ? JSON.parse(event.coupons) : event.coupons;
                return Array.isArray(parsed) && parsed.length > 0;
              } catch (e) {
                return false;
              }
            })();

            if (!hasCoupons) return null;

            return (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left">
                <label className="block text-sm font-bold text-amber-300 mb-2">Have a Partner / Coupon Code?</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Enter code" 
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 p-3.5 rounded-xl bg-black/40 border border-white/10 text-white uppercase tracking-wider font-bold text-sm focus:border-amber-500 outline-none"
                  />
                  <button 
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3.5 rounded-xl transition shadow-md"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <div className={`mt-3 p-3 rounded-xl text-sm font-bold flex items-center justify-between ${couponMessage.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                    <span>{couponMessage.text}</span>
                    {appliedCoupon && (
                      <button 
                        type="button" 
                        onClick={handleRemoveCoupon} 
                        className="text-xs underline hover:text-white ml-2"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ORDER TOTAL CARD */}
          <div className="bg-gradient-to-br from-amber-500/20 via-rose-500/10 to-purple-500/20 border border-amber-500/30 rounded-3xl p-6 mb-8 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300 text-sm">Passes Selected</span>
              <span className="font-bold text-white text-base">
                {quantities.dandiya || 1} x Dandiya Passes
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300 text-sm">Unit Price per Pass</span>
              <span className="font-bold text-amber-300 text-base">
                ₹{(totalAmount / Math.max(1, quantities.dandiya || 1)).toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-white/10 mt-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-400 font-bold block">Total Payable</span>
                <span className="text-xs text-amber-200/80">Valid for {allowedEntries} Entry Passes</span>
              </div>
              <span className="text-4xl font-black text-amber-400">
                ₹{totalAmount}
              </span>
            </div>
          </div>

          {/* PROCEED BUTTON */}
          <button
            type="button"
            onClick={() => {
              if (totalAmount === 0 || allowedEntries === 0) {
                return alert('Please select at least 1 ticket to continue.');
              }
              setStep(2);
            }}
            className="w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-600 hover:to-rose-600 text-black font-black text-xl py-5 rounded-2xl transition shadow-[0_0_35px_rgba(245,158,11,0.35)] hover:scale-[1.01]"
          >
            Proceed to Participant Details →
          </button>
        </div>
      ) : hasCustomPricing && step === 1 ? (
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-10 w-full max-w-3xl shadow-2xl">
          <h1 className="text-4xl md:text-5xl font-black mb-3 text-amber-300">
            {event?.category?.toLowerCase()?.includes('dandiya') || event?.category?.toLowerCase()?.includes('garba') 
              ? '🪩 Select Your Dandiya Passes' 
              : event?.category?.toLowerCase()?.trim() === 'marathon' 
                ? '🏃 Select Your Distance' 
                : '🎫 Select Your Ticket Passes'}
          </h1>
          <p className="text-gray-400 mb-8 text-lg">
            Choose your desired pass types below to proceed to registration.
          </p>
          
          <div className="space-y-6 mb-8">
            {event.custom_pricing ? (() => {
              try {
                const customPricing = typeof event.custom_pricing === 'string' ? JSON.parse(event.custom_pricing) : event.custom_pricing;
                return customPricing.map((d: any) => {
                  const price = appliedCoupon && Number(appliedCoupon.price) >= 0
                    ? Number(appliedCoupon.price)
                    : (Number(d[activeSlabKey]) || 0);
                  const passDetail = d.additional_info || (d.name.toLowerCase().includes('couple') ? 'Entry for 2 Members' : d.name.toLowerCase().includes('group') ? 'Group Pass' : '1 Member');
                  return (
                    <div key={d.name} className="p-6 md:p-8 rounded-3xl border-2 border-white/10 bg-black/40 mb-4">
                      {renderCounter(d.name, d.name, passDetail, price)}
                    </div>
                  );
                });
              } catch (e) {
                return <p className="text-red-500">Error loading custom tickets.</p>;
              }
            })() : null}
          </div>

          {/* PARTNER / COUPON CODE BOX (ONLY IF EVENT HAS COUPONS) */}
          {(() => {
            const hasCoupons = (() => {
              if (!event || !event.coupons) return false;
              try {
                const parsed = typeof event.coupons === 'string' ? JSON.parse(event.coupons) : event.coupons;
                return Array.isArray(parsed) && parsed.length > 0;
              } catch (e) {
                return false;
              }
            })();

            if (!hasCoupons) return null;

            return (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
                <label className="block text-sm font-bold text-cyan-300 mb-2">Have a Partner / Coupon Code?</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Enter the code" 
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 p-3.5 rounded-xl bg-black/40 border border-white/10 text-white uppercase tracking-wider font-bold text-sm focus:border-cyan-500 outline-none"
                  />
                  <button 
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 py-3.5 rounded-xl transition shadow-md"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <div className={`mt-3 p-3 rounded-xl text-sm font-bold flex items-center justify-between ${couponMessage.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                    <span>{couponMessage.text}</span>
                    {appliedCoupon && (
                      <button 
                        type="button" 
                        onClick={handleRemoveCoupon} 
                        className="text-xs underline hover:text-white ml-2"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          <button
            onClick={() => {
              if (totalAmount === 0 || allowedEntries === 0) return alert('Please add at least one ticket to your cart.');
              
              const newParticipants: any[] = [];
              Object.entries(quantities).forEach(([type, count]) => {
                if (count > 0) {
                  for (let i = 0; i < count; i++) {
                    newParticipants.push({
                      ticket_type: type,
                      full_name: '',
                      blood_group: '',
                      gender: ''
                    });
                  }
                }
              });
              setParticipants(newParticipants);
              setStep(2);
            }}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-black text-xl py-5 rounded-2xl transition shadow-[0_0_30px_rgba(34,211,238,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={totalAmount === 0}
          >
            Proceed to Registration
          </button>
        </div>
      ) : (
      <form
        onSubmit={handleSubmit}
        className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-5 sm:p-10 w-full max-w-2xl shadow-2xl"
      >
        <h1 className="text-3xl sm:text-5xl font-black mb-3">{event.title}</h1>
        <p className="text-gray-400 mb-8 sm:mb-10 text-sm sm:text-base">Register for this event</p>

        {/* PRIMARY CONTACT DETAILS */}
        <h2 className="text-xl sm:text-2xl font-bold text-violet-300 mb-4 border-b border-white/10 pb-2">Primary Contact (Purchaser)</h2>
        
        {event.category?.toLowerCase()?.trim() !== 'marathon' && (
          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleChange}
            required
            className="w-full p-4 rounded-2xl bg-black/30 border border-white/10 mb-5 focus:ring-2 focus:ring-violet-500 outline-none"
          />
        )}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full p-4 rounded-2xl bg-black/30 border border-white/10 mb-5 focus:ring-2 focus:ring-violet-500 outline-none"
        />
        <input
          type="text"
          name="phone_number"
          placeholder="Phone Number"
          value={formData.phone_number}
          onChange={handleChange}
          required
          className="w-full p-4 rounded-2xl bg-black/30 border border-white/10 mb-5 focus:ring-2 focus:ring-violet-500 outline-none"
        />
        <input
          type="text"
          name="emergency_contact_name"
          placeholder="Emergency Contact Name"
          value={formData.emergency_contact_name}
          onChange={handleChange}
          required
          className="w-full p-4 rounded-2xl bg-black/30 border border-white/10 mb-5 focus:ring-2 focus:ring-violet-500 outline-none"
        />
        <input
          type="text"
          name="emergency_contact"
          placeholder="Emergency Contact Number"
          value={formData.emergency_contact}
          onChange={handleChange}
          required
          className="w-full p-4 rounded-2xl bg-black/30 border border-white/10 mb-5 focus:ring-2 focus:ring-violet-500 outline-none"
        />
        {event.category?.toLowerCase()?.trim() !== 'marathon' && (
          <>
            <div className="mb-5">
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                required
                className="w-full p-4 rounded-2xl bg-black/30 border border-white/10 focus:ring-2 focus:ring-violet-500 outline-none text-gray-200"
              >
                <option value="" disabled>Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div className="mb-5">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full p-4 rounded-2xl bg-black/30 border border-white/10 focus:ring-2 focus:ring-violet-500 outline-none text-gray-300"
              >
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </>
        )}

        {/* CLUB / GROUP AFFILIATION */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-violet-300 mb-2">Club / Category Affiliation</label>
          <select
            name="club_affiliation"
            value={formData.club_affiliation}
            onChange={handleChange}
            required
            className="w-full p-4 rounded-2xl bg-black/30 border border-white/10 focus:ring-2 focus:ring-violet-500 outline-none text-gray-200"
          >
            <option value="" disabled>Select Club / Category</option>
            <option value="Rotaract Club">Rotaract Club</option>
            <option value="Run Club">Run Club</option>
            <option value="General Public / Other">General Public / Other</option>
          </select>
        </div>

        {/* SPECIFY CLUB NAME IF ROTARACT OR RUN CLUB IS SELECTED */}
        {formData.club_affiliation === 'Rotaract Club' && (
          <div className="mb-8">
            <label className="block text-sm font-bold text-cyan-300 mb-2">Rotaract Club Name</label>
            <input
              type="text"
              name="custom_club_name"
              placeholder="Rotaract Club Name"
              value={formData.custom_club_name}
              onChange={handleChange}
              required
              className="w-full p-4 rounded-2xl bg-black/30 border border-white/10 focus:ring-2 focus:ring-cyan-500 outline-none text-white"
            />
          </div>
        )}

        {formData.club_affiliation === 'Run Club' && (
          <div className="mb-8">
            <label className="block text-sm font-bold text-cyan-300 mb-2">Run Club Name</label>
            <input
              type="text"
              name="custom_club_name"
              placeholder="Run Club Name"
              value={formData.custom_club_name}
              onChange={handleChange}
              required
              className="w-full p-4 rounded-2xl bg-black/30 border border-white/10 focus:ring-2 focus:ring-cyan-500 outline-none text-white"
            />
          </div>
        )}

        {/* PARTICIPANT DETAILS (MARATHON ONLY) */}
        {event.category?.toLowerCase()?.trim() === 'marathon' && participants.length > 0 && (
          <div className="mt-8 mb-8 space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-cyan-300 mb-4 border-b border-white/10 pb-2">Participant Details</h2>
            {participants.map((p, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-2xl">
                <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-300">Participant {i + 1} • <span className="text-cyan-400">{p.ticket_type}</span></h3>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={p.full_name}
                  onChange={(e) => handleParticipantChange(i, 'full_name', e.target.value)}
                  required
                  className="w-full p-3 rounded-xl bg-black/30 border border-white/10 mb-4 focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={p.gender}
                    onChange={(e) => handleParticipantChange(i, 'gender', e.target.value)}
                    required
                    className="w-full p-3 rounded-xl bg-black/30 border border-white/10 focus:ring-2 focus:ring-cyan-500 outline-none text-gray-300 text-sm"
                  >
                    <option value="" disabled>Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <select
                    value={p.blood_group}
                    onChange={(e) => handleParticipantChange(i, 'blood_group', e.target.value)}
                    required
                    className="w-full p-3 rounded-xl bg-black/30 border border-white/10 focus:ring-2 focus:ring-cyan-500 outline-none text-gray-200 text-sm"
                  >
                    <option value="" disabled>Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* TICKET SELECTION OVERVIEW */}
        <div className="mb-4">
          <p className="text-gray-400 mb-2">Active Pricing Tier: <span className="text-cyan-300 font-bold">{activeSlabName}</span></p>
        </div>
        <div className="mb-8">
          {isDandiyaTiered ? (
            <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-amber-500/40 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {activeSlabName}
                  </span>
                  <span className="text-xs text-gray-400">1 QR Pass • {allowedEntries} Allowed Entries</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  {quantities.dandiya || 1} x Dandiya Passes
                </h3>
                <p className="text-sm text-gray-300 mt-0.5">
                  Rate: <span className="text-amber-300 font-bold">₹{(totalAmount / Math.max(1, quantities.dandiya || 1)).toFixed(0)}</span> per pass • Total: <span className="text-amber-300 font-bold">₹{totalAmount}</span>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition flex items-center gap-1.5"
              >
                ← Change Passes
              </button>
            </div>
          ) : hasCustomPricing ? (
            <div className="bg-amber-950/30 border border-amber-500/40 p-5 rounded-2xl flex justify-between items-center">
              <div>
                <p className="text-amber-300 font-bold mb-1">Passes Selected</p>
                <h3 className="text-xl font-black text-white">
                  {Object.entries(quantities).filter(([_, v]) => v > 0).map(([k, v]) => `${v}x ${k}`).join(', ') || 'No pass selected'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="text-amber-400 hover:text-amber-300 underline text-sm font-bold"
              >
                Change Passes
              </button>
            </div>
          ) : (
            <>
              {renderCounter('solo', 'Solo Pass', '1 Member', Number(event[`${activeSlabKey}_solo_price`]) || 0)}
              {renderCounter('couple', 'Couple Pass', '2 Members', Number(event[`${activeSlabKey}_couple_price`]) || 0)}
              {renderCounter('group', 'Group Pass', '4 Members', Number(event[`${activeSlabKey}_group_price`]) || 0)}
              {(Number(event.bulk_pass_price) > 0) && renderCounter('bulk', 'Bulk Pass', `${event.bulk_pass_entries || 0} Members`, Number(event.bulk_pass_price) || 0)}
            </>
          )}
        </div>

        {/* PARTNER / COUPON CODE BOX (ONLY IF EVENT HAS COUPONS) */}
        {(() => {
          const hasCoupons = (() => {
            if (!event || !event.coupons) return false;
            try {
              const parsed = typeof event.coupons === 'string' ? JSON.parse(event.coupons) : event.coupons;
              return Array.isArray(parsed) && parsed.length > 0;
            } catch (e) {
              return false;
            }
          })();

          if (!hasCoupons) return null;

          return (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
              <label className="block text-sm font-bold text-violet-300 mb-2">Have a Partner / Coupon Code?</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Enter the code" 
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 p-3.5 rounded-xl bg-black/40 border border-white/10 text-white uppercase tracking-wider font-bold text-sm focus:border-violet-500 outline-none"
                />
                <button 
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white font-bold px-6 py-3.5 rounded-xl transition shadow-md"
                >
                  Apply
                </button>
              </div>
              {couponMessage && (
                <div className={`mt-3 p-3 rounded-xl text-sm font-bold flex items-center justify-between ${couponMessage.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                  <span>{couponMessage.text}</span>
                  {appliedCoupon && (
                    <button 
                      type="button" 
                      onClick={handleRemoveCoupon} 
                      className="text-xs underline hover:text-white ml-2"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* PAYMENT BOX */}
        <div className="bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-white/10 rounded-3xl p-8 mb-8">
          <h2 className="text-3xl font-black mb-4">Payment Details</h2>
          <div className="flex justify-between items-center mb-5">
            <p className="text-xl text-gray-300">Selected Plan</p>
            <h3 className="text-2xl font-bold capitalize">{activeSlabName}</h3>
          </div>
          <div className="flex justify-between items-center mb-5">
            <p className="text-xl text-gray-300">Allowed Entries</p>
            <h3 className="text-2xl font-bold">{allowedEntries}</h3>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xl text-gray-300">Total Amount</p>
            <h1 className="text-5xl font-black text-violet-300">₹{totalAmount}</h1>
          </div>
        </div>

        <div className="bg-white text-black rounded-3xl p-6 mb-8 text-center shadow-xl">
          <h3 className="text-xl font-black text-blue-900 mb-3 uppercase tracking-wider">Canara Bank Official Payment QR</h3>
          <div className="max-w-xs mx-auto bg-white p-2 rounded-2xl border border-gray-200">
            <img
              src="/payment-qr.jpg"
              alt="Canara Bank UPI Payment QR"
              className="mx-auto rounded-xl max-h-96 w-auto object-contain"
            />
          </div>
          <p className="text-gray-800 mt-4 font-bold text-lg">Scan & Pay Using Any UPI App</p>
          <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
            <p className="text-gray-600 font-medium">UPI ID: <span className="font-bold text-gray-900 select-all">anirudha26hindupur@cnrb</span></p>
            <p className="text-gray-600 font-medium mt-1">Account Name: <span className="font-bold text-gray-900">H GIRISH PRASAD</span></p>
          </div>
        </div>

        {/* PAYMENT PROOF */}
        <label className="block text-gray-400 mb-2 ml-2">Upload Payment Screenshot</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPaymentProof(e.target.files?.[0])}
          required
          className="w-full mb-8 text-gray-300 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-violet-500 file:text-white hover:file:bg-violet-600 transition cursor-pointer"
        />

        {/* BUTTON */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-violet-500 hover:bg-violet-600 transition py-5 rounded-2xl font-bold text-xl disabled:opacity-50"
        >
          {submitting ? 'Sending Verification Code...' : 'Complete Registration'}
        </button>
      </form>
      )}
      {/* OTP MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-5">
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-[30px] p-8 md:p-12 w-full max-w-md shadow-2xl relative">
            <button 
              type="button"
              onClick={() => setShowOtpModal(false)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white"
            >
              ✕
            </button>
            <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-cyan-500/30">
              <ShieldCheck size={32} className="text-cyan-400" />
            </div>
            <h2 className="text-3xl font-black text-center mb-2">Verify Your Email</h2>
            <p className="text-gray-400 text-center mb-8">We've sent a 6-digit code to <strong>{formData.email}</strong>. Please enter it below to confirm your registration.</p>
            
            <input 
              type="text" 
              placeholder="Enter 6-digit code" 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center text-2xl font-bold tracking-widest text-white outline-none focus:border-cyan-500 transition mb-6"
              maxLength={6}
            />
            
            <button 
              type="button"
              onClick={handleVerifyAndRegister}
              disabled={otpSending || otp.length < 6}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-4 rounded-2xl transition disabled:opacity-50"
            >
              {otpSending ? 'Verifying...' : 'Verify & Register'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}