'use client';

import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';


import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import {
  Sparkles,
  UserPlus,
  FileSpreadsheet,
  Mail,
  Download,
  Edit,
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  RotateCcw,
  Ban
} from 'lucide-react';

interface User {
  registration_id: number;
  full_name: string;
  email: string;
  phone_number: string;
  ticket_type: string;
  payment_proof: string;
  payment_status: string;
  used_entries: number;
  allowed_entries: number;
  emergency_contact_name: string;
  emergency_contact: string;
  blood_group: string;
  coupon_code?: string;
  club_affiliation?: string;
  bib_number?: number | string | null;
  utr?: string;
}

interface Analytics {
  hourlyEntries: {
    hour: string;
    entries: number;
  }[];

  recentEntries: {
    full_name: string;
    username: string;
    entry_time: string;
  }[];
}

export default function AdminPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  const exportExcel = () => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Ticket',
      'Category / Affiliation',
      'Other Participant Names',
      'UTR / UPI Ref',
      'Payment Status',
      'Coupon Used',
      'Entries'
    ];

    const escapeXml = (str: any) => {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const buildWorksheetXml = (sheetName: string, userList: User[]) => {
      let xml = `<Worksheet ss:Name="${escapeXml(sheetName)}"><Table>`;

      // Header Row
      xml += '<Row>';
      headers.forEach((h) => {
        xml += `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`;
      });
      xml += '</Row>';

      // Data Rows
      userList.forEach((u) => {
        xml += '<Row>';
        const rowData = [
          u.full_name,
          u.email,
          u.phone_number,
          u.ticket_type,
          u.club_affiliation || 'None',
          u.emergency_contact_name ? (u.emergency_contact_name.startsWith('Attendees: ') ? u.emergency_contact_name.replace('Attendees: ', '') : u.emergency_contact_name) : '-',
          u.utr || '-',
          u.payment_status,
          u.coupon_code || '-',
          `${u.used_entries}/${u.allowed_entries}`
        ];
        rowData.forEach((val) => {
          xml += `<Cell><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`;
        });
        xml += '</Row>';
      });

      xml += '</Table></Worksheet>';
      return xml;
    };

    const sortedAsc = [...users].sort((a, b) => Number(a.registration_id) - Number(b.registration_id));

    const sheetsData = [
      { name: 'Sheet 1 - All Registrations', data: users },
      { name: 'Sheet 2 - Accepted (Approved)', data: users.filter((u) => u.payment_status === 'approved') },
      { name: 'Sheet 3 - Pending Approval', data: users.filter((u) => u.payment_status === 'pending') },
      { name: 'Sheet 4 - Incomplete Drafts', data: users.filter((u) => u.payment_status === 'draft') },
      { name: 'Sheet 5 - Flash Sale Timeline', data: sortedAsc.filter((u, idx) => idx < 50 || u.coupon_code?.toLowerCase().includes('flash')) },
      { name: 'Sheet 6 - Early Bird (Slab 1)', data: sortedAsc.filter((u, idx) => idx >= 50 && idx < 150) },
      { name: 'Sheet 7 - Normal (Slab 2)', data: sortedAsc.filter((u, idx) => idx >= 150 && idx < 300) },
      { name: 'Sheet 8 - Slab 3 Timeline', data: sortedAsc.filter((u, idx) => idx >= 300) }
    ];

    let workbookXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="HeaderStyle">
   <Font ss:Bold="1" ss:Color="#000000"/>
   <Interior ss:Color="#FFD700" ss:Pattern="Solid"/>
  </Style>
 </Styles>`;

    sheetsData.forEach((s) => {
      workbookXml += buildWorksheetXml(s.name, s.data);
    });

    workbookXml += '</Workbook>';

    const blob = new Blob([workbookXml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Event_Registrations_MultiSheet.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCSV = () => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Ticket',
      'Category / Affiliation',
      'Other Participant Names',
      'UTR / UPI Ref',
      'Payment Status',
      'Coupon Used',
      'Entries'
    ];

    const rows = filteredUsers.map((user) => [
      user.full_name,
      user.email,
      user.phone_number,
      user.ticket_type,
      user.club_affiliation || 'None',
      user.emergency_contact_name ? (user.emergency_contact_name.startsWith('Attendees: ') ? user.emergency_contact_name.replace('Attendees: ', '') : user.emergency_contact_name) : '-',
      user.utr || '-',
      user.payment_status,
      user.coupon_code || '-',
      `${user.used_entries}/${user.allowed_entries}`
    ]);

    const csvContent =
      [headers, ...rows]
        .map((e) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendees_${statusFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ====================================
  // EXPORT REGISTERED EMAILS DIRECTORY CSV (BLOB UTF-8 + EXACT ALIGNMENT)
  // ====================================

  const exportEmailCSV = () => {
    const headers = [
      'Email Address',
      'Total Registered',
      'Approved Count',
      'Pending Count',
      'Draft Count',
      'Participant Names',
      'Phone Numbers',
      'Ticket Categories',
      'BIB Numbers',
      'Payment Statuses',
      'Clubs / Affiliations',
      'Coupons Used'
    ];

    const emailKeys = Object.keys(emailDirectoryMap).sort();

    const rows = emailKeys.map((emailKey) => {
      const regList = [...emailDirectoryMap[emailKey]].sort(
        (a, b) => Number(a.registration_id) - Number(b.registration_id)
      );
      const total = regList.length;
      const approved = regList.filter((u) => u.payment_status === 'approved').length;
      const pending = regList.filter((u) => u.payment_status === 'pending').length;
      const draft = regList.filter((u) => u.payment_status === 'draft').length;

      const names = regList.map((u) => u.full_name || 'N/A').join(' | ');
      const phones = Array.from(new Set(regList.map((u) => u.phone_number).filter(Boolean))).join(' | ');
      const tickets = regList.map((u) => u.ticket_type || 'N/A').join(' | ');
      const bibs = regList.map((u) => (u.bib_number ? `#${u.bib_number}` : '-')).join(' | ');
      const statuses = regList.map((u) => u.payment_status || 'pending').join(' | ');
      const clubs = Array.from(new Set(regList.map((u) => u.club_affiliation).filter(Boolean))).join(' | ') || 'None';
      const coupons = Array.from(new Set(regList.map((u) => u.coupon_code).filter(Boolean))).join(' | ') || 'None';

      return [
        emailKey,
        total,
        approved,
        pending,
        draft,
        names,
        phones,
        tickets,
        bibs,
        statuses,
        clubs,
        coupons
      ];
    });

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((e) => e.map((val) => `"${String(val || '').replace(/"/g, '""')}"`).join(','))
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Registered_Emails_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportEmailDetailedCSV = () => {
    const headers = [
      'Email Address',
      'Participant Name',
      'Phone Number',
      'Ticket Type',
      'Other Participant Names',
      'UTR / UPI Ref',
      'Payment Status',
      'Club / Affiliation',
      'Coupon Code',
      'Entries Used/Allowed'
    ];

    const sortedUsers = [...users].sort((a, b) => {
      const emailCompare = (a.email || '').toLowerCase().localeCompare((b.email || '').toLowerCase());
      if (emailCompare !== 0) return emailCompare;
      return Number(a.registration_id) - Number(b.registration_id);
    });

    const rows = sortedUsers.map((u) => [
      u.email || 'N/A',
      u.full_name || 'N/A',
      u.phone_number || 'N/A',
      u.ticket_type || 'N/A',
      u.emergency_contact_name ? (u.emergency_contact_name.startsWith('Attendees: ') ? u.emergency_contact_name.replace('Attendees: ', '') : u.emergency_contact_name) : '-',
      u.utr || '-',
      u.payment_status || 'pending',
      u.club_affiliation || 'None',
      u.coupon_code || '-',
      `${u.used_entries}/${u.allowed_entries}`
    ]);

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((e) => e.map((val) => `"${String(val || '').replace(/"/g, '""')}"`).join(','))
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Registered_Emails_Detailed_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const router = useRouter();

  // ====================================
  // STATES
  // ====================================

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  type StatusFilterType =
    | 'all'
    | 'approved'
    | 'pending'
    | 'draft'
    | 'rejected'
    | 'emails';

  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [slabFilter, setSlabFilter] = useState<string>('all');
  const [mounted, setMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [recoveringId, setRecoveringId] = useState<number | null>(null);

  const [analytics, setAnalytics] =
    useState<Analytics | null>(null);

  // ====================================
  // FETCH USERS
  // ====================================

  const fetchUsers = async () => {
    try {
      const adminToken = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
      if (!adminToken) {
        setIsAuthorized(false);
        if (typeof window !== 'undefined') {
          window.location.href = '/admin-login';
        }
        return;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/${id}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );

      if (response.data && response.data.success) {
        const rawRegistrations: User[] = response.data.registrations || [];
        const sortedRegistrations = [...rawRegistrations].sort(
          (a, b) => Number(a.registration_id) - Number(b.registration_id)
        );

        setUsers(sortedRegistrations);
        setIsAuthorized(true);
      } else {
        localStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_token');
        setIsAuthorized(false);
        if (typeof window !== 'undefined') {
          window.location.href = '/admin-login';
        }
      }
    } catch (error: any) {
      console.log('Admin Auth Error:', error);
      localStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_token');
      setIsAuthorized(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/admin-login';
      }
    }
  };

  // ====================================
  // FETCH ANALYTICS
  // ====================================

  const fetchAnalytics = async () => {
    try {
      const adminToken = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
      if (!adminToken) return;

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/analytics`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );

      setAnalytics(response.data);
    } catch (error: any) {
      console.log(error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_token');
        setIsAuthorized(false);
        if (typeof window !== 'undefined') window.location.href = '/admin-login';
      }
    }
  };

  // ====================================
  // APPROVE PAYMENT
  // ====================================

  const approvePayment = async (id: number) => {
    try {
      const adminToken = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
      setApprovingId(id);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/approve-payment/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );

      alert('Payment Approved & QR Sent');

      fetchUsers();
      fetchAnalytics();
    } catch (error: any) {
      console.log(error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_token');
        setIsAuthorized(false);
        if (typeof window !== 'undefined') window.location.href = '/admin-login';
      } else {
        alert('Approval Failed');
      }
    } finally {
      setApprovingId(null);
    }
  };

  // ====================================
  // REJECT REGISTRATION
  // ====================================

  const rejectRegistration = async (id: number) => {
    try {
      const adminToken = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
      setRejectingId(id);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/reject-registration/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );

      alert('Registration Moved to Rejected Section');
      fetchUsers();
      fetchAnalytics();
    } catch (error: any) {
      console.log(error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_token');
        setIsAuthorized(false);
        if (typeof window !== 'undefined') window.location.href = '/admin-login';
      } else {
        alert('Reject Failed');
      }
    } finally {
      setRejectingId(null);
    }
  };

  // ====================================
  // RECOVER REGISTRATION
  // ====================================

  const recoverRegistration = async (id: number) => {
    try {
      const adminToken = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
      setRecoveringId(id);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/recover-registration/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );

      alert('Registration Recovered to Incomplete Drafts');
      fetchUsers();
      fetchAnalytics();
    } catch (error: any) {
      console.log(error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_token');
        setIsAuthorized(false);
        if (typeof window !== 'undefined') window.location.href = '/admin-login';
      } else {
        alert('Recover Failed');
      }
    } finally {
      setRecoveringId(null);
    }
  };

  // ====================================
  // AUTH CHECK + LIVE REFRESH
  // ====================================

  useEffect(() => {
    setMounted(true);

    const adminToken = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');

    if (!adminToken) {
      setIsAuthorized(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/admin-login';
      }
      return;
    }

    fetchUsers();
    fetchAnalytics();

    const interval = setInterval(() => {
      fetchUsers();
      fetchAnalytics();
    }, 3000);

    return () => clearInterval(interval);
  }, [router, id]);

  // ====================================
  // ANALYTICS
  // ====================================

  const totalUsers = users.filter((user) => user.payment_status !== 'draft' && user.payment_status !== 'rejected').length;

  const approvedUsers = users.filter(
    (user) => user.payment_status === 'approved'
  ).length;

  const pendingUsers = users.filter(
    (user) => user.payment_status === 'pending'
  ).length;

  const draftUsers = users.filter(
    (user) => user.payment_status === 'draft'
  ).length;

  const rejectedUsers = users.filter(
    (user) => user.payment_status === 'rejected'
  ).length;

  const count5k = users.filter(
    (user) => user.ticket_type?.toUpperCase().includes('5K') && user.payment_status === 'approved'
  ).length;

  const count3k = users.filter(
    (user) => user.ticket_type?.toUpperCase().includes('3K') && user.payment_status === 'approved'
  ).length;

  // ====================================
  // REGISTERED EMAIL DIRECTORY GROUPING
  // ====================================

  const emailDirectoryMap = useMemo(() => {
    const map: { [email: string]: User[] } = {};
    const sortedAllUsers = [...users].sort(
      (a, b) => Number(a.registration_id) - Number(b.registration_id)
    );
    sortedAllUsers.forEach((user) => {
      const emailKey = (user.email || 'N/A').toLowerCase().trim();
      if (!map[emailKey]) {
        map[emailKey] = [];
      }
      map[emailKey].push(user);
    });
    return map;
  }, [users]);

  const uniqueEmailCount = Object.keys(emailDirectoryMap).length;

  const filteredEmailKeys = useMemo(() => {
    const emailKeys = Object.keys(emailDirectoryMap).sort();
    if (!search.trim()) return emailKeys;

    const query = search.toLowerCase().trim();
    return emailKeys.filter((email) => {
      if (email.includes(query)) return true;
      const regList = emailDirectoryMap[email];
      return regList.some(
        (u) =>
          u.full_name?.toLowerCase().includes(query) ||
          u.phone_number?.includes(query) ||
          (u.bib_number && String(u.bib_number).includes(query))
      );
    });
  }, [emailDirectoryMap, search]);

  const isMarathonUser = (user: User) => {
    const t = user.ticket_type?.toLowerCase() || '';
    return t.includes('5k') || t.includes('3k') || t.includes('10k') || t.includes('marathon') ||
           Boolean(user.emergency_contact_name && user.blood_group);
  };

  const sortedAscUsers = useMemo(() => {
    return [...users].sort((a, b) => Number(a.registration_id) - Number(b.registration_id));
  }, [users]);

  const countFlashSale = sortedAscUsers.filter((u, idx) => idx < 50 || u.coupon_code?.toLowerCase().includes('flash')).length;
  const countSlab1 = sortedAscUsers.filter((u, idx) => idx >= 50 && idx < 150).length;
  const countSlab2 = sortedAscUsers.filter((u, idx) => idx >= 150 && idx < 300).length;
  const countSlab3 = sortedAscUsers.filter((u, idx) => idx >= 300).length;

  const countMarathonAccepted = users.filter((u) => isMarathonUser(u) && u.payment_status === 'approved').length;
  const countMarathonPending = users.filter((u) => isMarathonUser(u) && u.payment_status === 'pending').length;
  const countMarathonDraft = users.filter((u) => isMarathonUser(u) && u.payment_status === 'draft').length;

  // ====================================
  // SEARCH & CATEGORY FILTER WITH BIB SORT
  // ====================================

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const query = search.toLowerCase().trim();
        const matchesSearch =
          !query ||
          user.full_name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.phone_number?.includes(query) ||
          (user.utr && user.utr.toLowerCase().includes(query)) ||
          (user.bib_number && String(user.bib_number).includes(query));

        if (!matchesSearch) return false;

        // Status filter dropdown
        if (statusFilter === 'all') {
          if (user.payment_status === 'rejected') return false;
        } else if (statusFilter === 'approved') {
          if (user.payment_status !== 'approved') return false;
        } else if (statusFilter === 'pending') {
          if (user.payment_status !== 'pending') return false;
        } else if (statusFilter === 'draft') {
          if (user.payment_status !== 'draft') return false;
        } else if (statusFilter === 'rejected') {
          if (user.payment_status !== 'rejected') return false;
        }

        // Slab filter dropdown
        const idx = sortedAscUsers.findIndex((u) => u.registration_id === user.registration_id);
        if (slabFilter === 'flash_sale') {
          const matchesFlash = idx < 50 || user.coupon_code?.toLowerCase().includes('flash');
          if (!matchesFlash) return false;
        }
        if (slabFilter === 'slab1' && !(idx >= 50 && idx < 150)) return false;
        if (slabFilter === 'slab2' && !(idx >= 150 && idx < 300)) return false;
        if (slabFilter === 'slab3' && !(idx >= 300)) return false;

        return true;
      })
      .sort((a, b) => {
        const bibA = a.bib_number ? Number(a.bib_number) : null;
        const bibB = b.bib_number ? Number(b.bib_number) : null;

        if (bibA !== null && bibB !== null && bibA !== bibB) {
          return bibB - bibA;
        }
        return b.registration_id - a.registration_id;
      });
  }, [users, search, statusFilter, slabFilter, sortedAscUsers]);

  if (!mounted || !isAuthorized) {
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

  // ====================================
  // MAIN RETURN
  // ====================================

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-8 font-sans selection:bg-amber-500 selection:text-black">
      {/* TOP HEADER TOOLBAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-600 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-200 via-white to-violet-300 bg-clip-text text-transparent tracking-tight">
              EventFlow Admin Console
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm font-medium">
              Manage event registrations, approve payments, and analyze attendance
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => window.open(`/register/${id}?admin=true`, '_blank')}
            className="flex-1 sm:flex-initial bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg"
          >
            <UserPlus size={16} />
            <span>Add Registration</span>
          </button>

          <button
            onClick={exportExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg"
          >
            <FileSpreadsheet size={16} />
            <span>Excel (.xls)</span>
          </button>

          <button
            onClick={exportEmailCSV}
            className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg"
          >
            <Mail size={16} />
            <span>Email Directory</span>
          </button>

          <button
            onClick={exportCSV}
            className="bg-zinc-800 hover:bg-zinc-700 text-gray-200 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 border border-zinc-700"
          >
            <Download size={16} />
            <span>Export View</span>
          </button>

          <button
            onClick={() => router.push(`/edit-event/${id}`)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2"
          >
            <Edit size={16} />
            <span>Edit Event</span>
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('admin_token');
              localStorage.removeItem('scanner_token');
              sessionStorage.removeItem('admin_token');
              sessionStorage.removeItem('scanner_token');
              setIsAuthorized(false);
              if (typeof window !== 'undefined') window.location.href = '/admin-login';
            }}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-gray-400">Total Registrations</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">{totalUsers}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            📊
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-emerald-400">Approved Passes</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{approvedUsers}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-amber-500/20 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-amber-400">Pending Approvals</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">{pendingUsers}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-orange-500/20 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-orange-400">Incomplete Drafts</p>
            <p className="text-2xl sm:text-3xl font-black text-orange-400 mt-1">{draftUsers}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>

      {/* SEARCH AND DROPDOWN FILTERS TOOLBAR */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 mb-6 shadow-xl backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* SEARCH BAR */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search attendee by name, email, phone, UTR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-400 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white bg-zinc-800 px-2 py-0.5 rounded-md"
              >
                Clear
              </button>
            )}
          </div>

          {/* DROPDOWN 1: REGISTRATION STATUS */}
          <div className="md:col-span-3">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                className="w-full p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-amber-300 font-bold text-xs sm:text-sm focus:outline-none focus:border-amber-400 appearance-none cursor-pointer pr-8"
              >
                <option value="all">📋 All Active Registrations ({totalUsers})</option>
                <option value="approved">✓ Approved / Accepted ({approvedUsers})</option>
                <option value="pending">⏳ Pending Approval ({pendingUsers})</option>
                <option value="draft">⚠️ Incomplete / Drafts ({draftUsers})</option>
                <option value="rejected">🚫 Rejected Section ({rejectedUsers})</option>
                <option value="emails">📧 Registered Email Directory ({uniqueEmailCount})</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* DROPDOWN 2: DANDIYA PRICING SLABS */}
          <div className="md:col-span-3">
            <div className="relative">
              <select
                value={slabFilter}
                onChange={(e) => setSlabFilter(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-cyan-300 font-bold text-xs sm:text-sm focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer pr-8"
              >
                <option value="all">🎟️ All Pricing Slabs</option>
                <option value="flash_sale">⚡ Flash Sale ({countFlashSale})</option>
                <option value="slab1">🐦 Early Bird / Slab 1 ({countSlab1})</option>
                <option value="slab2">🎫 Normal / Slab 2 ({countSlab2})</option>
                <option value="slab3">🔥 Slab 3 ({countSlab3})</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      {statusFilter === 'emails' ? (
        <div className="overflow-x-auto bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-6 mb-10">
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-amber-300">Registered Email IDs Directory</h2>
              <p className="text-gray-400 text-xs mt-1">
                List of unique email addresses with complete participant history.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={exportEmailCSV}
                className="bg-amber-400 hover:bg-amber-500 text-black px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow"
              >
                <Download size={14} /> Download Email Directory CSV
              </button>
              <button
                onClick={exportEmailDetailedCSV}
                className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow"
              >
                <Download size={14} /> Download Detailed CSV
              </button>
            </div>
          </div>

          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="bg-zinc-800 text-amber-300 font-bold text-xs uppercase tracking-wider border-b border-zinc-700">
                <th className="p-3.5">Email Address</th>
                <th className="p-3.5 text-center">Total Registered</th>
                <th className="p-3.5">Registered Participants & Pass Details</th>
                <th className="p-3.5">Phone Numbers</th>
                <th className="p-3.5 text-center">Status Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-xs">
              {filteredEmailKeys.map((email) => {
                const regList = emailDirectoryMap[email];
                const approved = regList.filter((u) => u.payment_status === 'approved').length;
                const pending = regList.filter((u) => u.payment_status === 'pending').length;
                const draft = regList.filter((u) => u.payment_status === 'draft').length;

                return (
                  <tr key={email} className="hover:bg-zinc-800/40 transition">
                    <td className="p-3.5 font-bold text-amber-200">{email}</td>
                    <td className="p-3.5 text-center font-black text-base text-cyan-300">{regList.length}</td>
                    <td className="p-3.5 space-y-1.5">
                      {regList.map((u) => (
                        <div key={u.registration_id} className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="font-bold text-white">{u.full_name}</span>
                          <span className="bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded font-medium text-[11px]">
                            {u.ticket_type}
                          </span>
                          {u.bib_number && (
                            <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold text-[11px]">
                              #{u.bib_number}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              u.payment_status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : u.payment_status === 'pending'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {u.payment_status}
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="p-3.5 text-gray-300">
                      {Array.from(new Set(regList.map((u) => u.phone_number).filter(Boolean))).join(', ')}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex justify-center gap-1.5 text-[11px] font-bold">
                        {approved > 0 && <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">✓ {approved} Approved</span>}
                        {pending > 0 && <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">⏳ {pending} Pending</span>}
                        {draft > 0 && <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">⚠️ {draft} Draft</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-zinc-800/90 text-zinc-300 font-bold text-xs uppercase tracking-wider border-b border-zinc-700/80">
                  <th className="p-4">Attendee Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Ticket Pass</th>
                  <th className="p-4">Affiliation / Club</th>
                  <th className="p-4">UPI UTR / Ref</th>
                  <th className="p-4 text-center">Payment Proof</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Entries</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs sm:text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-gray-400 font-medium">
                      No attendee registrations found matching the current search & dropdown filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.registration_id}
                      className="hover:bg-zinc-800/40 transition group"
                    >
                      {/* NAME */}
                      <td className="p-4 font-bold text-white whitespace-nowrap">
                        {user.full_name}
                        {user.bib_number && (
                          <span className="ml-2 bg-cyan-500/20 text-cyan-300 text-xs px-2 py-0.5 rounded font-mono border border-cyan-500/30">
                            #{user.bib_number}
                          </span>
                        )}
                      </td>

                      {/* CONTACT */}
                      <td className="p-4 whitespace-nowrap">
                        <p className="text-gray-200 text-xs font-semibold">{user.email}</p>
                        <p className="text-gray-400 text-xs">{user.phone_number}</p>
                      </td>

                      {/* TICKET PASS */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="bg-amber-400/10 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-lg font-bold text-xs">
                          {user.ticket_type}
                        </span>
                      </td>

                      {/* AFFILIATION */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-gray-300 text-xs font-medium">
                          {user.club_affiliation || 'Public'}
                        </span>
                      </td>

                      {/* UTR */}
                      <td className="p-4 whitespace-nowrap">
                        {user.utr ? (
                          <span className="bg-zinc-950 text-emerald-400 border border-zinc-800 px-2.5 py-1 rounded-md font-mono text-xs select-all">
                            {user.utr}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </td>

                      {/* PAYMENT PROOF */}
                      <td className="p-4 text-center whitespace-nowrap">
                        {user.payment_proof ? (
                          <a
                            href={user.payment_proof?.startsWith('http') ? user.payment_proof : `${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.payment_proof}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block hover:scale-105 transition"
                          >
                            <img
                              src={user.payment_proof?.startsWith('http') ? user.payment_proof : `${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.payment_proof}`}
                              alt="Proof"
                              className="w-16 h-10 object-cover rounded-lg border border-zinc-700 mx-auto"
                            />
                          </a>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="p-4 text-center whitespace-nowrap">
                        {user.payment_status === 'approved' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 size={12} />
                            Approved
                          </span>
                        ) : user.payment_status === 'draft' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            <AlertCircle size={12} />
                            Incomplete
                          </span>
                        ) : user.payment_status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            <Ban size={12} />
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Clock size={12} />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* ENTRY COUNT */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className="font-bold text-xs text-zinc-300">
                          {user.used_entries}/{user.allowed_entries}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td className="p-4 text-center whitespace-nowrap">
                        {user.payment_status === 'draft' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => approvePayment(user.registration_id)}
                              disabled={approvingId === user.registration_id}
                              className={`bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 rounded-lg font-bold text-xs transition shadow ${approvingId === user.registration_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {approvingId === user.registration_id ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => rejectRegistration(user.registration_id)}
                              disabled={rejectingId === user.registration_id}
                              className={`bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${rejectingId === user.registration_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <XCircle size={13} />
                              {rejectingId === user.registration_id ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        ) : user.payment_status === 'rejected' ? (
                          <button
                            onClick={() => recoverRegistration(user.registration_id)}
                            disabled={recoveringId === user.registration_id}
                            className={`bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-3.5 py-1.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 mx-auto ${recoveringId === user.registration_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <RotateCcw size={13} />
                            {recoveringId === user.registration_id ? 'Recovering...' : 'Recover'}
                          </button>
                        ) : user.payment_status !== 'approved' ? (
                          <button
                            onClick={() => approvePayment(user.registration_id)}
                            disabled={approvingId === user.registration_id}
                            className={`bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-1.5 rounded-lg font-bold text-xs transition shadow ${approvingId === user.registration_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {approvingId === user.registration_id ? 'Approving...' : 'Approve'}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}