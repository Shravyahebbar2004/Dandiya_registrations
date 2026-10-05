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
      'BIB Number',
      'Name',
      'Email',
      'Phone',
      'Ticket',
      'Club / Category',
      'UTR / UPI Ref',
      'Payment Status',
      'Coupon Used',
      'Entries',
      'Emergency Contact Name',
      'Emergency Contact No',
      'Blood Group'
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

    const sortUsersByBib = (userList: User[]) => {
      return [...userList].sort((a, b) => {
        const bibA = a.bib_number ? Number(a.bib_number) : null;
        const bibB = b.bib_number ? Number(b.bib_number) : null;
        if (bibA !== null && bibB !== null && bibA !== bibB) {
          return bibB - bibA;
        }
        return b.registration_id - a.registration_id;
      });
    };

    const buildWorksheetXml = (sheetName: string, userList: User[]) => {
      const sorted = sortUsersByBib(userList);
      let xml = `<Worksheet ss:Name="${escapeXml(sheetName)}"><Table>`;

      // Header Row
      xml += '<Row>';
      headers.forEach((h) => {
        xml += `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`;
      });
      xml += '</Row>';

      // Data Rows
      sorted.forEach((u) => {
        xml += '<Row>';
        const rowData = [
          u.bib_number ? `#${u.bib_number}` : '-',
          u.full_name,
          u.email,
          u.phone_number,
          u.ticket_type,
          u.club_affiliation || 'None',
          u.utr || '-',
          u.payment_status,
          u.coupon_code || '-',
          `${u.used_entries}/${u.allowed_entries}`,
          u.emergency_contact_name || '-',
          u.emergency_contact || '-',
          u.blood_group || '-'
        ];
        rowData.forEach((val) => {
          xml += `<Cell><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`;
        });
        xml += '</Row>';
      });

      xml += '</Table></Worksheet>';
      return xml;
    };

    const sheetsData = [
      { name: 'Sheet 1 - All Registrations', data: users },
      { name: 'Sheet 2 - Pending Approval', data: users.filter((u) => u.payment_status === 'pending') },
      { name: 'Sheet 3 - Approved', data: users.filter((u) => u.payment_status === 'approved') },
      { name: 'Sheet 4 - Incomplete Drafts', data: users.filter((u) => u.payment_status === 'draft') },
      { name: 'Sheet 5 - 5K Category (Approved)', data: users.filter((u) => u.ticket_type?.toUpperCase().includes('5K') && u.payment_status === 'approved') },
      { name: 'Sheet 6 - 3K Category (Approved)', data: users.filter((u) => u.ticket_type?.toUpperCase().includes('3K') && u.payment_status === 'approved') }
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
      'BIB Number',
      'Name',
      'Email',
      'Phone',
      'Ticket',
      'Club / Category',
      'UTR / UPI Ref',
      'Payment Status',
      'Coupon Used',
      'Entries',
      'Emergency Contact Name',
      'Emergency Contact No',
      'Blood Group'
    ];

    const rows = filteredUsers.map((user) => [
      user.bib_number ? `#${user.bib_number}` : '-',
      user.full_name,
      user.email,
      user.phone_number,
      user.ticket_type,
      user.club_affiliation || 'None',
      user.utr || '-',
      user.payment_status,
      user.coupon_code || '-',
      `${user.used_entries}/${user.allowed_entries}`,
      user.emergency_contact_name || '-',
      user.emergency_contact || '-',
      user.blood_group || '-'
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
      'BIB Number',
      'UTR / UPI Ref',
      'Payment Status',
      'Club / Affiliation',
      'Coupon Code',
      'Entries Used/Allowed',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Blood Group'
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
      u.bib_number ? `#${u.bib_number}` : '-',
      u.utr || '-',
      u.payment_status || 'pending',
      u.club_affiliation || 'None',
      u.coupon_code || '-',
      `${u.used_entries}/${u.allowed_entries}`,
      u.emergency_contact_name || '-',
      u.emergency_contact || '-',
      u.blood_group || '-'
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'draft' | '5k' | '3k' | 'emails'>('all');
  const [mounted, setMounted] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const [analytics, setAnalytics] =
    useState<Analytics | null>(null);

  // ====================================
  // FETCH USERS
  // ====================================

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/${id}`,
      );

      const rawRegistrations: User[] = response.data.registrations || [];
      const sortedRegistrations = [...rawRegistrations].sort(
        (a, b) => Number(a.registration_id) - Number(b.registration_id)
      );

      setUsers(sortedRegistrations);
    } catch (error) {
      console.log(error);
    }
  };

  // ====================================
  // FETCH ANALYTICS
  // ====================================

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analytics`,
      );

      setAnalytics(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // ====================================
  // APPROVE PAYMENT
  // ====================================

  const approvePayment = async (id: number) => {
    try {
      setApprovingId(id);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/approve-payment/${id}`,
      );

      alert('Payment Approved & QR Sent');

      fetchUsers();
      fetchAnalytics();
    } catch (error) {
      console.log(error);
      alert('Approval Failed');
    } finally {
      setApprovingId(null);
    }
  };

  // ====================================
  // AUTH CHECK + LIVE REFRESH
  // ====================================

  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem('admin_token');

    if (!token) {
      router.push('/admin-login');
      return;
    }

    fetchUsers();
    fetchAnalytics();

    const interval = setInterval(() => {
      fetchUsers();
      fetchAnalytics();
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  // ====================================
  // ANALYTICS
  // ====================================

  const totalUsers = users.filter((user) => user.payment_status !== 'draft').length;

  const approvedUsers = users.filter(
    (user) => user.payment_status === 'approved'
  ).length;

  const pendingUsers = users.filter(
    (user) => user.payment_status === 'pending'
  ).length;

  const draftUsers = users.filter(
    (user) => user.payment_status === 'draft'
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

  // ====================================
  // SEARCH & CATEGORY FILTER WITH BIB SORT
  // ====================================

  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.phone_number?.includes(search) ||
        (user.bib_number && String(user.bib_number).includes(search));

      if (!matchesSearch) return false;

      if (statusFilter === 'pending') return user.payment_status === 'pending';
      if (statusFilter === 'approved') return user.payment_status === 'approved';
      if (statusFilter === 'draft') return user.payment_status === 'draft';
      if (statusFilter === '5k') return user.ticket_type?.toUpperCase().includes('5K') && user.payment_status === 'approved';
      if (statusFilter === '3k') return user.ticket_type?.toUpperCase().includes('3K') && user.payment_status === 'approved';
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

  // ====================================
  // HYDRATION FIX
  // ====================================

  if (!mounted) {
    return null;
  }

  // ====================================
  // MAIN RETURN
  // ====================================

  return (
   <div
  className="
    min-h-screen
    bg-gradient-to-br
    from-black
    via-zinc-950
    to-violet-950
    text-white
    p-10
  "
>
      {/* HEADER */}

      <div
        className="
          flex
          flex-col
          md:flex-row
          justify-between
          items-center
          gap-5
          mb-10
        "
      >
        <h1
  className="
    text-6xl
    font-black
    bg-gradient-to-r
    from-yellow-300
    via-white
    to-violet-300
    bg-clip-text
    text-transparent
  "
>
  EventFlow Admin Console
</h1>

        <div className="flex flex-wrap gap-4">
          {/* REGISTER NEW PARTICIPANT (ADMIN MODE) */}
          <button
            onClick={() => window.open(`/register/${id}?admin=true`, '_blank')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg"
          >
            ➕ Add New Registration (Admin Mode)
          </button>

          {/* EXPORT MULTI-SHEET EXCEL */}
          <button
            onClick={exportExcel}
            className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg"
          >
            📊 Export Multi-Sheet Excel (.xls)
          </button>

          {/* EXPORT EMAIL DIRECTORY CSV */}
          <button
            onClick={exportEmailCSV}
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg"
          >
            📧 Export Email Directory CSV (.csv)
          </button>

          {/* EXPORT CSV */}
          <button
            onClick={exportCSV}
            className="bg-zinc-800 hover:bg-zinc-700 text-gray-200 px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg border border-white/10"
          >
            📄 Export Current View CSV
          </button>

          {/* EDIT EVENT */}

          <button
            onClick={() => router.push(`/edit-event/${id}`)}
            className="
              bg-blue-500
              hover:bg-blue-600
              px-6
              py-4
              rounded-2xl
              font-bold
              text-lg
              transition
              w-full
              md:w-auto
            "
          >
            Edit Event Details
          </button>

          {/* LOGOUT */}

          <button
            onClick={() => {
              localStorage.removeItem('admin_token');
              router.push('/admin-login');
            }}
            className="
              bg-red-500
              hover:bg-red-600
              px-6
              py-4
              rounded-2xl
              font-bold
              text-lg
              transition
              w-full
              md:w-auto
            "
          >
            Logout
          </button>
        </div>
      </div>

      {/* SEARCH */}

      <input
        type="text"
        placeholder="Search attendee by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="
          w-full
          mb-10
          p-4
          rounded-2xl
          bg-white/5
          border-white/10
          backdrop-blur-xl
          hover:scale-105
          transition          
          border
          text-white
          placeholder-gray-400
          focus:outline-none
          focus:ring-2
          focus:ring-yellow-400
        "
      />

      {/* ANALYTICS CARDS */}

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-3
          gap-6
          mb-10
        "
      >
        {/* TOTAL */}

        <div
          className="
            bg-white/5
border-white/10
backdrop-blur-xl
hover:scale-105
transition            
border
            bg-white/5
border-white/10
backdrop-blur-xl
hover:scale-105
transition            rounded-3xl
            p-8
            text-center
            backdrop-blur-xl
          "
        >
          <h2
            className="
              text-2xl
              text-gray-300
              mb-3
            "
          >
            Total Registrations
          </h2>

          <p
            className="
              text-5xl
              font-black
              text-yellow-300
            "
          >
            {totalUsers}
          </p>
        </div>

        {/* APPROVED */}

        <div
          className="
            bg-white/5
border-white/10
backdrop-blur-xl
hover:scale-105
transition            border
            border-white/20
            rounded-3xl
            p-8
            text-center
            backdrop-blur-xl
          "
        >
          <h2
            className="
              text-2xl
              text-gray-300
              mb-3
            "
          >
            Approved Tickets
          </h2>

          <p
            className="
              text-5xl
              font-black
              text-green-400
            "
          >
            {approvedUsers}
          </p>
        </div>

        {/* PENDING */}

        <div
          className="
            bg-white/5
border-white/10
backdrop-blur-xl
hover:scale-105
transition            border
            border-white/20
            rounded-3xl
            p-8
            text-center
            backdrop-blur-xl
          "
        >
          <h2
            className="
              text-2xl
              text-gray-300
              mb-3
            "
          >
            Pending Approvals
          </h2>

          <p
            className="
              text-5xl
              font-black
              text-red-400
            "
          >
            {pendingUsers}
          </p>
        </div>
      </div>

      {/* LIVE ANALYTICS GRAPH */}

      {analytics && (
        <div
          className="
            bg-white/5
border-white/10
backdrop-blur-xl
hover:scale-105
transition            border
            border-white/10
            rounded-3xl
            p-10
            mb-10
            backdrop-blur-xl
          "
        >
          <h2
            className="
              text-4xl
              font-black
              text-yellow-300
              mb-10
            "
          >
            Live Entry Analytics
          </h2>

          <ResponsiveContainer
            width="100%"
            height={400}
          >
            <LineChart
              data={analytics?.hourlyEntries || []}
            >
              <XAxis dataKey="hour" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="entries"
                stroke="#facc15"
                strokeWidth={4}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* RECENT ENTRIES */}

      {analytics && (
        <div
          className="
            bg-white/5
border-white/10
backdrop-blur-xl
hover:scale-105
transition            border
            border-white/10
            rounded-3xl
            p-10
            mb-10
            backdrop-blur-xl
          "
        >
          <h2
            className="
              text-4xl
              font-black
              text-yellow-300
              mb-8
            "
          >
            Recent Entries
          </h2>

          <div className="space-y-4">
            {analytics?.recentEntries?.map(
              (entry, index) => (
                <div
                  key={index}
                  className="
                    bg-black/40
                    border
                    border-white/10
                    rounded-2xl
                    p-5
                    flex
                    justify-between
                    items-center
                  "
                >
                  <div>
                    <p
                      className="
                        text-xl
                        font-bold
                      "
                    >
                      {entry.full_name}
                    </p>

                    <p
                      className="
                        text-gray-400
                      "
                    >
                      Scanned by {entry.username}
                    </p>
                  </div>

                  <p
                    className="
                      text-yellow-300
                    "
                  >
                    {new Date(
                      entry.entry_time
                    ).toLocaleTimeString()}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* STATUS TABS FILTER */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${statusFilter === 'all' ? 'bg-yellow-400 text-black shadow-lg' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}`}
        >
          All ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${statusFilter === 'pending' ? 'bg-yellow-400 text-black shadow-lg' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}`}
        >
          Pending Approval ({pendingUsers})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('approved')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${statusFilter === 'approved' ? 'bg-green-500 text-black shadow-lg' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}`}
        >
          Approved ({approvedUsers})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('draft')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${statusFilter === 'draft' ? 'bg-orange-500 text-black shadow-lg' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}`}
        >
          ⚠️ Incomplete / Drafts ({draftUsers})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('5k')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${statusFilter === '5k' ? 'bg-cyan-400 text-black shadow-lg' : 'bg-white/5 border border-cyan-500/30 text-cyan-300 hover:bg-white/10'}`}
        >
          🏃‍♂️ 5K Category ({count5k})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('3k')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${statusFilter === '3k' ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/5 border border-purple-500/30 text-purple-300 hover:bg-white/10'}`}
        >
          🏃‍♀️ 3K Category ({count3k})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('emails')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${statusFilter === 'emails' ? 'bg-amber-400 text-black shadow-lg' : 'bg-white/5 border border-amber-400/40 text-amber-300 hover:bg-white/10'}`}
        >
          📧 Registered Email IDs ({uniqueEmailCount})
        </button>
      </div>

      {/* CONDITIONAL TABLE VIEW */}
      {statusFilter === 'emails' ? (
        <div className="overflow-x-auto bg-white/5 border border-white/20 rounded-3xl backdrop-blur-xl p-6 mb-10">
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-yellow-300">Registered Email IDs Directory</h2>
              <p className="text-gray-400 text-sm mt-1">
                Real-time auto-updating list of all unique registered email addresses and their participants.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportEmailCSV}
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 shadow-lg"
              >
                📥 Download Grouped Email Directory CSV
              </button>
              <button
                onClick={exportEmailDetailedCSV}
                className="bg-amber-500 hover:bg-amber-600 text-black px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 shadow-lg"
              >
                📄 Download Detailed Participants CSV
              </button>
            </div>
          </div>

          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="bg-yellow-400 text-black">
                <th className="p-4">Email Address</th>
                <th className="p-4 text-center">Total Registered</th>
                <th className="p-4">Registered Participants & Pass Details</th>
                <th className="p-4">Phone Numbers</th>
                <th className="p-4 text-center">Status Summary</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmailKeys.map((email) => {
                const regList = emailDirectoryMap[email];
                const approved = regList.filter((u) => u.payment_status === 'approved').length;
                const pending = regList.filter((u) => u.payment_status === 'pending').length;
                const draft = regList.filter((u) => u.payment_status === 'draft').length;

                return (
                  <tr key={email} className="border-t border-white/10 hover:bg-white/5 transition">
                    <td className="p-4 font-bold text-yellow-200">{email}</td>
                    <td className="p-4 text-center font-black text-xl text-cyan-300">{regList.length}</td>
                    <td className="p-4 space-y-2">
                      {regList.map((u) => (
                        <div key={u.registration_id} className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-semibold text-white">{u.full_name}</span>
                          <span className="bg-yellow-400/10 text-yellow-300 px-2 py-0.5 rounded font-medium text-xs">
                            {u.ticket_type}
                          </span>
                          {u.bib_number && (
                            <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-bold text-xs">
                              #{u.bib_number}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                              u.payment_status === 'approved'
                                ? 'bg-green-500/20 text-green-300'
                                : u.payment_status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {u.payment_status}
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="p-4 text-gray-300 text-sm">
                      {Array.from(new Set(regList.map((u) => u.phone_number).filter(Boolean))).join(', ')}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2 text-xs font-bold">
                        {approved > 0 && <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded">✓ {approved} Approved</span>}
                        {pending > 0 && <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded">⏳ {pending} Pending</span>}
                        {draft > 0 && <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded">⚠️ {draft} Draft</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* TABLE */
        <div
          className="
            overflow-x-auto
            bg-white/5
            border-white/10
            backdrop-blur-xl
            hover:scale-105
            transition
            border
            border-white/20
            rounded-3xl
            backdrop-blur-xl
          "
        >
        <table
          className="
            w-full
            min-w-[1000px]
          "
        >
          <thead>
            <tr
              className="
                bg-yellow-400
                text-black
              "
            >
              <th className="p-5">BIB #</th>

              <th className="p-5">Name</th>

              <th className="p-5">Email</th>

              <th className="p-5">Phone</th>

              <th className="p-5">Ticket</th>

              <th className="p-5">Club / Category</th>

              <th className="p-5">Coupon Code</th>

              <th className="p-5">UTR / Ref #</th>

              <th className="p-5">Payment Proof</th>

              <th className="p-5">Approval</th>

              <th className="p-5">Entries</th>

              <th className="p-5">Emg. Name</th>

              <th className="p-5">Emg. Contact</th>

              <th className="p-5">Blood Group</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.registration_id}
                className="
                  text-center
                  border-t
                  border-white/10
                  hover:bg-white/5
                  transition
                "
              >
                {/* BIB NUMBER */}
                <td className="p-5">
                  {user.bib_number ? (
                    <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-1.5 rounded-xl font-black text-sm tracking-wider">
                      #{user.bib_number}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs font-semibold">-</span>
                  )}
                </td>

                {/* NAME */}

                <td className="p-5">
                  {user.full_name}
                </td>

                {/* EMAIL */}

                <td className="p-5">
                  {user.email}
                </td>

                {/* PHONE */}

                <td className="p-5">
                  {user.phone_number}
                </td>

                {/* TICKET */}

                <td className="p-5">
                  <span
                    className="
                      bg-yellow-400/10
                      text-yellow-300
                      px-4
                      py-2
                      rounded-xl
                      font-bold
                    "
                  >
                    {user.ticket_type}
                  </span>
                </td>

                {/* CLUB / CATEGORY */}
                <td className="p-5">
                  <span className="bg-cyan-400/10 text-cyan-300 border border-cyan-400/30 px-3 py-1.5 rounded-xl font-bold text-xs">
                    {user.club_affiliation || 'None'}
                  </span>
                </td>

                {/* COUPON CODE */}
                <td className="p-5">
                  {user.coupon_code ? (
                    <span className="bg-violet-500/20 text-violet-300 border border-violet-500/40 px-3 py-1.5 rounded-xl font-bold uppercase text-xs tracking-wider">
                      🏷️ {user.coupon_code}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs font-semibold">-</span>
                  )}
                </td>

                {/* UTR / UPI REF NUMBER */}
                <td className="p-5">
                  {user.utr ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-mono font-bold text-xs select-all">
                        {user.utr}
                      </span>
                      <span className="text-[10px] text-gray-400">UPI Ref</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-xs font-semibold">-</span>
                  )}
                </td>

                {/* PAYMENT IMAGE */}

                <td className="p-5">
                  <a 
                    href={user.payment_proof?.startsWith('http') ? user.payment_proof : `${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.payment_proof}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="cursor-pointer block hover:scale-105 transition"
                  >
                    <img
                      src={user.payment_proof?.startsWith('http') ? user.payment_proof : `${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.payment_proof}`}
                      alt="Payment Proof"
                    
                      className="
                         w-24
                         rounded-xl
                         mx-auto
                         border
                         border-white/20
                      "
                    />
                  </a>
                </td>

                {/* APPROVAL */}

                <td className="p-5">
                  {user.payment_status === 'approved' ? (
                    <span className="text-green-400 font-bold">Approved ✅</span>
                  ) : user.payment_status === 'draft' ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="bg-orange-500/20 text-orange-300 border border-orange-500/40 px-3 py-1 rounded-2xl font-bold text-xs mb-1">
                        ⚠️ Incomplete (OTP Sent)
                      </span>
                      <button
                        onClick={() => approvePayment(user.registration_id)}
                        disabled={approvingId === user.registration_id}
                        className={`bg-green-500 hover:bg-green-600 px-4 py-2 rounded-xl font-bold text-sm transition ${approvingId === user.registration_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {approvingId === user.registration_id ? 'Approving...' : 'Approve'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        approvePayment(
                          user.registration_id
                        )
                      }
                      disabled={approvingId === user.registration_id}
                      className={`
                        bg-green-500
                        hover:bg-green-600
                        px-6
                        py-4
                        rounded-2xl
                        font-bold
                        text-lg
                        transition
                        w-full
                        md:w-auto
                        ${approvingId === user.registration_id ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {approvingId === user.registration_id ? 'Approving...' : 'Approve'}
                    </button>
                  )}
                </td>

                {/* ENTRY COUNT */}

                <td className="p-5">
                  <span
                    className="
                      text-yellow-300
                      font-bold
                    "
                  >
                    {user.used_entries}/
                    {user.allowed_entries}
                  </span>
                </td>

                {/* EMERGENCY INFO */}

                <td className="p-5 text-gray-300 text-sm">
                  {user.emergency_contact_name || '-'}
                </td>

                <td className="p-5 text-gray-300 text-sm">
                  {user.emergency_contact || '-'}
                </td>

                <td className="p-5 text-red-400 font-bold">
                  {user.blood_group || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}