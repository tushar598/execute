"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, Shield, TrendingUp, Bell, LogOut, ChevronRight, LayoutDashboard,
    Plus, Loader2, CheckCircle2,
    ArrowUpRight,
    Search,
    Menu,
    X, MapPin, Leaf, UserCircle, AlertCircle, Lock
} from 'lucide-react';
import Link from 'next/link';

interface CommunityAdminProfile {
    _id: string;
    userId: string;
    community_id: string;
}

interface Community {
    community_name: string;
    community_id: string;
    community_district: string;
    community_admin: string;
    community_practices: string[];
    community_members_id: string[];
    community_state: string;
    createdAt: string;
}

interface UserProfileData {
    _id: string;
    userId: {
        _id: string;
        username: string;
        email: string;
        phone: string;
    };
    hasdone_process: boolean;
    landarea: number;
    practices: string[];
    entry_status: string;
    createdAt?: string;
}

interface AuditLog {
    _id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    timestamp: string;
    metadata: any;
    txHash: string;
    previousHash: string;
}

export default function CommunityDashboard() {
    const router = useRouter();
    const [adminProfile, setAdminProfile] = useState<CommunityAdminProfile | null>(null);
    const [community, setCommunity] = useState<Community | null>(null);
    const [members, setMembers] = useState<UserProfileData[]>([]);
    const [communityCredits, setCommunityCredits] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [saleTransactions, setSaleTransactions] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [salesLoading, setSalesLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // First verify token and get admin + community data
                const res = await fetch('/api/communityadmin/getcommunityadmin');

                if (res.ok) {
                    const data = await res.json();
                    setAdminProfile(data.adminProfile);
                    setCommunity(data.community);

                    if (data.community?.community_id) {
                        const membersRes = await fetch(`/api/community/get_specific_community_members_userprofile?community_id=${data.community.community_id}`);
                        if (membersRes.ok) {
                            const membersData = await membersRes.json();
                            setMembers(membersData.profiles || []);
                        }

                        const creditsRes = await fetch(`/api/community/getcommunitycredit?community_id=${data.community.community_id}`);
                        if (creditsRes.ok) {
                            const creditsData = await creditsRes.json();
                            setCommunityCredits(creditsData.credits || 0);
                        }
                    }
                } else if (res.status === 404) {
                    const verifyRes = await fetch('/api/communityadmin/verifycommunityadmin');
                    if (verifyRes.ok) {
                        const verifyData = await verifyRes.json();
                        if (!verifyData.exists) router.push('/community/onboarding');
                    } else router.push('/login');
                } else {
                    router.push('/login');
                }
            } catch (err) {
                console.error('Failed to fetch community data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router]);

    /* ---- Fetch Audit Logs once admin is loaded ---- */
    useEffect(() => {
        if (!adminProfile) return;
        const fetchLogs = async () => {
            setLogsLoading(true);
            try {
                // Fetch latest logs for the admin/community
                const res = await fetch(`/api/auditlogs?userId=${adminProfile.userId}&limit=6`);
                if (res.ok) {
                    const data = await res.json();
                    setAuditLogs(data.logs || []);
                }
            } catch (err) {
                console.error('Failed to fetch audit logs:', err);
            } finally {
                setLogsLoading(false);
            }
        };

        const fetchSales = async () => {
            setSalesLoading(true);
            try {
                const res = await fetch('/api/community/sale_transactions');
                if (res.ok) {
                    const data = await res.json();
                    setSaleTransactions(data.saleTransactions || []);
                }
            } catch (err) {
                console.error('Failed to fetch sale transactions:', err);
            } finally {
                setSalesLoading(false);
            }
        };

        fetchLogs();
        fetchSales();
    }, [adminProfile]);

    const formatAction = (action: string) => {
        return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getRelativeTime = (timestamp: string) => {
        const now = new Date();
        const then = new Date(timestamp);
        const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
                    <p className="text-slate-500 font-medium">Loading Community Dashboard...</p>
                </div>
            </div>
        );
    }

    const memberCount = community?.community_members_id?.length || 0;
    const practiceCount = community?.community_practices?.length || 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-teal-500/20">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-none mb-1">Community Admin</h1>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium font-mono uppercase tracking-wider">{community?.community_id || 'ID_PENDING'}</p>
                        </div>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6 mr-6">
                        <Link href="/community/dashboard" className="text-sm font-bold text-teal-600">Dashboard</Link>
                        <Link href="/community/communitymarketplace" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Marketplace</Link>
                        <Link href="/community/getcarboncredit" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Verify Credits</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        {/* <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
                        </button> */}
                        <div className="h-6 w-px bg-slate-200 mx-1" />
                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all text-sm border border-transparent">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center gap-2">
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-2 shadow-lg animate-in slide-in-from-top duration-300">
                        <Link href="/community/dashboard" className="block w-full px-4 py-3 text-sm font-bold text-teal-600 bg-teal-50 rounded-lg">Dashboard</Link>
                        <Link href="/community/communitymarketplace" className="block w-full px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg">Marketplace</Link>
                        <Link href="/community/getcarboncredit" className="block w-full px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg">Verify Credits</Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-red-500 font-bold hover:bg-red-50 transition-all text-sm rounded-lg border-t border-slate-50 mt-2 pt-4">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-20">

                {/* Community Details Banner */}
                {community && (
                    <div className="bg-gradient-to-br from-teal-900 to-emerald-950 rounded-[2rem] p-6 sm:p-10 mb-8 text-white relative overflow-hidden shadow-xl shadow-teal-900/20">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden sm:block">
                            <Users className="w-48 h-48" />
                        </div>
                        <div className="relative z-10 flex flex-col gap-6">
                            <div>
                                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 lg:max-w-2xl">{community.community_name}</h1>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-xl text-[10px] sm:text-xs font-bold border border-white/5 backdrop-blur-sm">
                                        <MapPin className="w-3.5 h-3.5 text-teal-300" />
                                        {community.community_district}, {community.community_state}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 rounded-xl text-[10px] sm:text-xs font-bold text-emerald-300 border border-emerald-500/10 backdrop-blur-sm">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Active Community
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
                    <StatCard
                        title="Total Members"
                        value={memberCount.toString()}
                        change="Active on platform"
                        icon={<Users className="w-5 h-5" />}
                        color="teal"
                    />
                    <StatCard
                        title="Registered Practices"
                        value={practiceCount.toString()}
                        change="Verified methods"
                        icon={<Leaf className="w-5 h-5" />}
                        color="emerald"
                    />
                    <StatCard
                        title="Aggregated Credits"
                        value={communityCredits.toLocaleString()}
                        change="Generated so far"
                        icon={<TrendingUp className="w-5 h-5" />}
                        color="blue"
                    />
                    <StatCard
                        title="Security Score"
                        value="100%"
                        change="Audit clean"
                        icon={<Shield className="w-5 h-5" />}
                        color="amber"
                    />
                </div>

                {/* Main Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Members Overview */}
                    <div className="lg:col-span-8 space-y-8">
                        <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
                            <div className="border-b border-slate-100 pb-5 mb-5 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <LayoutDashboard className="w-5 h-5 text-teal-600" />
                                    Community Members
                                </h2>
                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all border border-slate-100">
                                    <Plus className="w-4 h-4 text-slate-500" /> Invite
                                </button>
                            </div>

                            {members.length === 0 ? (
                                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50">
                                    <UserCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <h3 className="text-sm font-bold text-slate-700 mb-1">No Members Yet</h3>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                        Members can join your community during their onboarding process using your Community ID.
                                        <br /><span className="font-mono font-bold text-teal-600 mt-2 block bg-teal-50 py-1 rounded inline-block px-3">{community?.community_id}</span>
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto -mx-6 sm:mx-0">
                                    <div className="inline-block min-w-full align-middle px-6 sm:px-0">
                                        <div className="overflow-hidden border border-slate-100 rounded-2xl">
                                            <table className="min-w-full divide-y divide-slate-100 text-left">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username / Contact</th>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Land</th>
                                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Practices</th>
                                                        <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 bg-white">
                                                    {members.map((profile) => (
                                                        <tr key={profile._id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 text-xs font-bold">
                                                                        {profile.userId?.username?.charAt(0).toUpperCase() || 'U'}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-bold text-slate-700">{profile.userId?.username || 'Unknown'}</span>
                                                                        <span className="text-[10px] text-slate-400">{profile.userId?.email}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {profile.hasdone_process ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                        <CheckCircle2 className="w-2.5 h-2.5" /> Done
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                                                        <AlertCircle className="w-2.5 h-2.5" /> Pending
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="text-sm font-semibold text-slate-600">{profile.landarea || 0} Ac</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                                    {profile.practices?.slice(0, 2).map(p => (
                                                                        <span key={p} className="text-[9px] bg-slate-50 text-slate-500 font-bold px-1.5 py-0.5 rounded border border-slate-100">{p}</span>
                                                                    ))}
                                                                    {profile.practices?.length > 2 && <span className="text-[9px] text-slate-400">+{profile.practices.length - 2}</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all">
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Project Sales Section */}
                        <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
                            <div className="border-b border-slate-100 pb-5 mb-5">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                    Community Credit Sales
                                </h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Transaction History</p>
                            </div>

                            {salesLoading ? (
                                <div className="py-12 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-slate-200 mx-auto" />
                                </div>
                            ) : saleTransactions.length === 0 ? (
                                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50">
                                    <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <h3 className="text-sm font-bold text-slate-700 mb-1">No Sales Yet</h3>
                                    <p className="text-xs text-slate-500">Sales will appear once credits are purchased on the exchange.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {saleTransactions.map((sale) => (
                                        <div key={sale.projectId} className="p-5 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-all group">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-100">
                                                        <CheckCircle2 className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{sale.projectName}</h4>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Buyer: {sale.buyerName}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">Sold {getRelativeTime(sale.soldAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-extrabold text-emerald-600">₹{sale.totalCommunityPayout.toLocaleString()}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                        {sale.totalCredits.toLocaleString()} CRD · ₹{sale.pricePerCredit}/CRD
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Quick Access / Actions */}
                    <aside className="lg:col-span-4 space-y-6">
                        {/* Admin Profile Section */}
                        <section className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-teal-600" />
                                Admin Profile
                            </h2>
                            <div className="space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-teal-500/20">
                                        {community?.community_admin?.charAt(0) || 'A'}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administrator</p>
                                        <p className="text-lg font-bold text-slate-900 leading-tight">{community?.community_admin}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Community Referral ID</span>
                                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <span className="text-xs font-mono font-bold text-teal-700">{community?.community_id}</span>
                                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Verified</span>
                                        </div>
                                    </div>

                                    {community?.community_practices && (
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Managed Practices</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {community.community_practices.map((p: string) => (
                                                    <span key={p} className="text-[10px] bg-slate-50 text-slate-600 font-bold px-2 py-1 rounded-lg border border-slate-100">{p}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="bg-gradient-to-br from-teal-800 to-emerald-950 rounded-[2rem] p-6 sm:p-8 text-white relative shadow-xl shadow-teal-900/10">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-teal-300" />
                                Verification Terminal
                            </h2>
                            <p className="text-teal-100/70 text-sm mb-8 leading-relaxed">
                                Initiate verification for new members and generate aggregated credits for the exchange.
                            </p>
                            <div className="space-y-3">
                                <Link
                                    href="/community/getcarboncredit"
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-2xl transition-all shadow-lg shadow-teal-900/20"
                                >
                                    Verify Yield & Generate Credits <ArrowUpRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    href="/community/communitymarketplace"
                                    className="w-full flex items-center justify-center py-4 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold rounded-2xl transition-all text-sm"
                                >
                                    Access Carbon Exchange
                                </Link>
                            </div>
                        </section>

                        <section className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-indigo-500" />
                                Security Trail
                            </h2>
                            <div className="space-y-2">
                                {logsLoading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                                    </div>
                                ) : auditLogs.length > 0 ? (
                                    <div className="space-y-2">
                                        {auditLogs.map((log) => (
                                            <div key={log._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{formatAction(log.action)}</span>
                                                    <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-[10px] font-mono text-slate-400 truncate opacity-60">
                                                    🔗 {log.txHash.slice(0, 16)}...
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 text-center py-4">No security logs recorded.</p>
                                )}
                            </div>
                            <button className="w-full mt-6 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-100 transition-all border border-slate-100">
                                View Full History
                            </button>
                        </section>
                    </aside>
                </div>
            </main>
        </div>
    );
}

function StatCard({ title, value, change, icon, color }: {
    title: string;
    value: string;
    change: string;
    icon: React.ReactNode;
    color: 'blue' | 'emerald' | 'teal' | 'amber';
}) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        teal: 'bg-teal-50 text-teal-600 border-teal-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100'
    };

    return (
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex items-center justify-center mb-4 sm:mb-6 ${colorClasses[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">{value}</h3>
                <p className={`text-[10px] font-bold ${color === 'amber' || color === 'teal' ? 'text-teal-600' : 'text-slate-400'}`}>{change}</p>
            </div>
        </div>
    );
}