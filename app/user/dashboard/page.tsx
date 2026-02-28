
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    User, Leaf, TrendingUp, Sparkles,
    ShieldCheck, ArrowUpRight, CreditCard, Settings,
    Bell, LogOut, ChevronRight, Globe, Zap, Activity,
    DollarSign, Loader2, Pencil, Building, Hash,
    EthernetPortIcon, MapPin, AlertTriangle, CheckCircle,
    Info, BarChart2, Droplets, Sun, Menu, X, Lock,
    Copy, Gift, CheckCheck, Users, ShoppingBag, BadgeDollarSign,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Dynamic Leaflet (no SSR)                                            */
/* ------------------------------------------------------------------ */
const LeafletMap = dynamic(() => import('@/app/components/LeafletMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
            <p className="text-xs text-slate-400 font-medium">Loading map…</p>
        </div>
    ),
});

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
interface UserProfile {
    userId: string;
    name: string;
    aadhar_card_no: string;
    pan_card_no: string;
    bank_account_no: string;
    IFSC_no: string;
    entry_status: 'individual' | 'community';
    communityId?: string;
    community_name?: string;
    practices: string[];
    urea_amount: string;
    soil_type: string;
    landarea: number;
    landlocation: { lat: number; lng: number };
    current_crop: string[];
    previous_crop: string[];
    hasdone_process: boolean;
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

interface Suggestion {
    type: 'opportunity' | 'alert' | 'practice' | 'market' | 'warning';
    title: string;
    body: string;
    priority: 'high' | 'medium' | 'low';
}

/* ------------------------------------------------------------------ */
/*  Suggestion type config                                              */
/* ------------------------------------------------------------------ */
const SUGGESTION_CONFIG: Record<string, { icon: React.ElementType; colors: string; badge: string }> = {
    opportunity: { icon: Sparkles, colors: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200', badge: 'bg-emerald-400/20 text-emerald-300' },
    alert: { icon: AlertTriangle, colors: 'bg-amber-500/10  border-amber-400/30   text-amber-200', badge: 'bg-amber-400/20   text-amber-300' },
    practice: { icon: CheckCircle, colors: 'bg-blue-500/10   border-blue-400/30    text-blue-200', badge: 'bg-blue-400/20    text-blue-300' },
    market: { icon: BarChart2, colors: 'bg-purple-500/10 border-purple-400/30  text-purple-200', badge: 'bg-purple-400/20  text-purple-300' },
    warning: { icon: AlertTriangle, colors: 'bg-red-500/10    border-red-400/30     text-red-200', badge: 'bg-red-400/20     text-red-300' },
};

/* ------------------------------------------------------------------ */
export default function Dashboard() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileExists, setProfileExists] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [credits, setCredits] = useState<number>(0);
    const [balance, setBalance] = useState<number>(0);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [suggestSource, setSuggestSource] = useState<'ai' | 'intelligent' | ''>('');
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [activeSuggestIdx, setActiveSuggestIdx] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [payoutsLoading, setPayoutsLoading] = useState(false);
    const [txLoading, setTxLoading] = useState(false);
    const [authUser, setAuthUser] = useState<any>(null);

    // Referral state
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [referredCount, setReferredCount] = useState(0);
    const [referralLoading, setReferralLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    /* ---- Fetch auth user ---- */
    useEffect(() => {
        const fetchAuthUser = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setAuthUser(data.user);
                }
            } catch (err) {
                console.error('Failed to fetch auth user:', err);
            }
        };
        fetchAuthUser();
    }, []);

    /* ---- Fetch profile ---- */
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/users/getprofile');
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.profile || null);
                    setCredits(data.credits || 0);
                    setBalance(data.balance || 0);
                    setProfileExists(!!data.profile);
                } else {
                    setProfileExists(false);
                }
            } catch { setProfileExists(false); }
            finally { setIsLoading(false); }
        };
        fetchProfile();
    }, []);

    /* ---- Fetch Referral info on load ---- */
    useEffect(() => {
        const fetchReferral = async () => {
            try {
                const res = await fetch('/api/refferal');
                if (res.ok) {
                    const data = await res.json();
                    setReferralCode(data.code);
                    setReferredCount(data.referredCount || 0);
                }
            } catch { /* silent */ }
            finally { setReferralLoading(false); }
        };
        fetchReferral();
    }, []);

    /* ---- Fetch AI suggestions once profile is loaded ---- */
    useEffect(() => {
        if (!profile) return;
        const fetchSuggestions = async () => {
            setSuggestLoading(true);
            try {
                const res = await fetch('/api/ai/suggestion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        current_crop: profile.current_crop,
                        previous_crop: profile.previous_crop,
                        soil_type: profile.soil_type,
                        practices: profile.practices,
                        urea_amount: profile.urea_amount,
                        landarea: profile.landarea,
                        landlocation: profile.landlocation,
                        entry_status: profile.entry_status,
                    }),
                });
                const data = await res.json();
                if (res.ok) {
                    setSuggestions(data.suggestions ?? []);
                    setSuggestSource(data.source);
                }
            } catch { /* falls back silently */ }
            finally { setSuggestLoading(false); }
        };
        fetchSuggestions();
    }, [profile]);

    /* ---- Fetch Audit Logs once profile is loaded ---- */
    useEffect(() => {
        if (!profile) return;
        const fetchLogs = async () => {
            setLogsLoading(true);
            try {
                // Fetch logs for this specific user
                const res = await fetch(`/api/auditlogs?userId=${profile.userId}&limit=8`);
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

        const fetchPayouts = async () => {
            setPayoutsLoading(true);
            try {
                const res = await fetch('/api/users/my_payouts?limit=5');
                if (res.ok) {
                    const data = await res.json();
                    setPayouts(data.payouts || []);
                }
            } catch (err) {
                console.error('Failed to fetch payouts:', err);
            } finally {
                setPayoutsLoading(false);
            }
        };

        const fetchTransactions = async () => {
            setTxLoading(true);
            try {
                const res = await fetch(`/api/transactions/all_transactions?entityId=${profile.userId}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    setTransactions(data.transactions || []);
                }
            } catch (err) {
                console.error('Failed to fetch transactions:', err);
            } finally {
                setTxLoading(false);
            }
        };

        fetchLogs();
        fetchPayouts();
        fetchTransactions();
    }, [profile]);

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
        try { await fetch('/api/auth/logout', { method: 'POST' }); }
        catch { /* ignore */ }
        router.push('/login');
    };

    const handleGenerateReferral = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/refferal', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setReferralCode(data.code);
                setReferredCount(data.referredCount || 0);
            }
        } catch { /* silent */ }
        finally { setGenerating(false); }
    };

    const handleCopy = () => {
        if (!referralCode) return;
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const maskAccount = (acc: string) =>
        acc ? '•••• •••• ' + acc.slice(-4) : '—';

    /* ================================================================ */
    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12">

            {/* ---- Header ---- */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">

                    {/* Logo */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0">
                            <Leaf className="w-4 h-4 sm:w-6 sm:h-6" />
                        </div>
                        <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">Grento Dashboard</h1>
                    </div>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button> */}
                        <div className="h-6 w-px bg-slate-200" />
                        <button
                            onClick={() => router.push('/user/getcarboncredit')}
                            className="flex items-center gap-2 px-4 py-2 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 border border-emerald-200 transition-all text-sm"
                        >
                            <Leaf className="w-4 h-4" />
                            Get Credits
                        </button>
                        <button
                            onClick={() => router.push('/user/marketplace')}
                            className="flex items-center gap-2 px-4 py-2 text-teal-700 font-semibold rounded-lg hover:bg-teal-50 border border-teal-200 transition-all text-sm"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Sell Credits
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-all text-sm"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>

                    {/* Mobile nav: bell + hamburger */}
                    <div className="flex md:hidden items-center gap-2">
                        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>
                        <button
                            onClick={() => setMobileMenuOpen(o => !o)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-2 shadow-lg">
                        <button
                            onClick={() => { router.push('/user/getcarboncredit'); setMobileMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 border border-emerald-200 transition-all text-sm"
                        >
                            <Leaf className="w-4 h-4" />
                            Get Carbon Credits
                        </button>
                        <button
                            onClick={() => { router.push('/user/marketplace'); setMobileMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-teal-700 font-semibold rounded-lg hover:bg-teal-50 border border-teal-200 transition-all text-sm"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Sell My Credits
                        </button>
                        <button
                            onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-red-500 font-semibold rounded-lg hover:bg-red-50 transition-all text-sm"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 md:pt-32">

                {/* ---- Top Row: Profile Card + Carbon Credits ---- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 mb-6 sm:mb-8">

                    {/* Profile Card */}
                    <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-48">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                            </div>
                        ) : profile ? (
                            <>
                                <div className="flex items-start justify-between mb-4 sm:mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <User className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm sm:text-base">{authUser?.username || 'Farmer Profile'}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-400">
                                                {authUser?.email || (profile.entry_status + (profile.community_name ? ` · ${profile.community_name}` : ''))}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 shrink-0">
                                        Active
                                    </span>
                                </div>

                                {/* Stats grid — 2 cols on all sizes */}
                                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                                    <ProfileStat label="Available Balance" value={`₹${balance.toLocaleString()}`} accent="emerald" />
                                    <ProfileStat label="Land Area" value={`${profile.landarea} acres`} accent="indigo" />
                                    <ProfileStat label="Urea" value={`${profile.urea_amount} kg/ac`} accent="amber" />
                                    <ProfileStat label="Aadhar" value={`••••  ${profile.aadhar_card_no?.slice(-4) || '——'}`} accent="slate" />
                                </div>

                                {/* Practices */}
                                <div className="mb-3 sm:mb-4">
                                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Farming Practices</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {profile.practices.map(p => (
                                            <span key={p} className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full">{p}</span>
                                        ))}
                                        {profile.practices.length === 0 && <span className="text-xs text-slate-400">No practices listed</span>}
                                    </div>
                                </div>

                                {/* Crops */}
                                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-5">
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Current Crops</p>
                                        <div className="flex flex-wrap gap-1">
                                            {profile.current_crop.slice(0, 4).map(c => (
                                                <span key={c} className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{c}</span>
                                            ))}
                                            {profile.current_crop.length === 0 && <span className="text-xs text-slate-400">—</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Previous Crops</p>
                                        <div className="flex flex-wrap gap-1">
                                            {profile.previous_crop.slice(0, 4).map(c => (
                                                <span key={c} className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">{c}</span>
                                            ))}
                                            {profile.previous_crop.length === 0 && <span className="text-xs text-slate-400">—</span>}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push('/user/updateprofile')}
                                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <Pencil className="w-4 h-4" /> Update Profile
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600">Setup Required</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Farmer Profile</h3>
                                <p className="text-slate-500 text-sm mt-1 mb-6">Build your profile to start generating carbon credits.</p>
                                <button
                                    onClick={() => router.push('/user/onboarding')}
                                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    Start Onboarding <ChevronRight className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Carbon Credits */}
                    <div className="lg:col-span-7 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-800 shadow-xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-6 sm:p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                            <Leaf className="w-28 h-28 sm:w-48 sm:h-48 text-emerald-500" />
                        </div>

                        <div className="relative z-10 h-full flex flex-col justify-between gap-6 sm:gap-0">
                            {/* Top badge row */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
                                    <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                                    <span className="text-emerald-400 text-[10px] sm:text-xs font-bold uppercase">Asset Value</span>
                                </div>
                                <div className="flex items-center gap-1 text-emerald-400">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-sm font-bold">+12.4%</span>
                                </div>
                            </div>

                            {/* Stats Display */}
                            <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 mt-6 sm:mt-8">
                                <div className="flex-1">
                                    <p className="text-slate-400 font-medium text-xs sm:text-sm mb-2 uppercase tracking-widest">Available Carbon Credits</p>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-3xl xs:text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                                            {credits.toLocaleString()}
                                        </h2>
                                        <span className="text-emerald-500 font-bold text-lg sm:text-xl uppercase tracking-tighter">CRD Volume</span>
                                    </div>
                                    <p className="text-slate-500 text-[10px] sm:text-xs mt-2 italic">Volume of certified carbon assets</p>
                                </div>

                                <div className="flex-1 border-l sm:border-slate-800 sm:pl-10">
                                    <p className="text-slate-400 font-medium text-xs sm:text-sm mb-2 uppercase tracking-widest">Withdrawal Balance</p>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-3xl xs:text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                                            ₹{balance > 0 ? balance.toLocaleString() : '0'}
                                        </h2>
                                        <span className="text-indigo-400 font-bold text-lg sm:text-xl uppercase tracking-tighter">INR</span>
                                    </div>
                                    <p className="text-slate-500 text-[10px] sm:text-xs mt-2 italic">Cash earnings from credit sales</p>
                                </div>
                            </div>

                            {/* Buttons — full-width on mobile, auto on sm+ */}
                            {/* <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                                    <button className="flex-1 sm:flex-none px-5 sm:px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                                        <DollarSign className="w-4 h-4" /> Sell Credits
                                    </button>
                                    <button className="flex-1 sm:flex-none px-5 sm:px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition-all border border-white/10">
                                        Trade
                                    </button>
                                </div> */}
                        </div>
                    </div>
                </div>

                {/* ---- Referral Card ---- */}
                <div className="mb-6 sm:mb-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-emerald-500/30 shadow-lg text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <Gift className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-sm sm:text-base">Referral Programme</p>
                                <p className="text-emerald-100 text-[11px] sm:text-xs mt-0.5">
                                    Share your code — you both earn <strong>+1 Carbon Credit</strong> per signup!
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 self-start sm:self-auto">
                            <Users className="w-3.5 h-3.5 text-emerald-200" />
                            <span className="text-xs font-bold">{referredCount} referred</span>
                        </div>
                    </div>

                    <div className="mt-4">
                        {referralLoading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                                <span className="text-sm text-emerald-200">Loading…</span>
                            </div>
                        ) : referralCode ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex-1 min-w-0 bg-white/15 border border-white/25 rounded-xl px-4 py-2.5 font-mono text-sm sm:text-base font-bold tracking-widest truncate">
                                    {referralCode}
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shrink-0 ${copied
                                        ? 'bg-emerald-300 text-emerald-900'
                                        : 'bg-white text-emerald-700 hover:bg-emerald-50'
                                        }`}
                                >
                                    {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleGenerateReferral}
                                disabled={generating}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                                {generating ? 'Generating…' : 'Generate Referral ID'}
                            </button>
                        )}
                    </div>
                </div>

                {/* ---- Main Content Grid ---- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

                    {/* Left: Map + Transactions */}
                    <div className="lg:col-span-8 space-y-6 sm:space-y-8">

                        {/* Leaflet Map */}
                        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-4 sm:p-6 border-b border-slate-50 flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                        Climate Intelligence Map
                                    </h2>
                                    <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5">
                                        {profile?.landlocation
                                            ? `Your land: ${profile.landlocation.lat.toFixed(4)}°N, ${profile.landlocation.lng.toFixed(4)}°E`
                                            : 'Set your land location in your profile to see it here'}
                                    </p>
                                </div>
                                {profile?.landlocation && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full self-start xs:self-auto">
                                        <MapPin className="w-3.5 h-3.5" /> Location Pinned
                                    </div>
                                )}
                            </div>

                            {/* Map — shorter on mobile, taller on desktop */}
                            <div className="h-[260px] xs:h-[320px] sm:h-[380px] md:h-[420px] relative">
                                <LeafletMap
                                    lat={profile?.landlocation?.lat ?? null}
                                    lng={profile?.landlocation?.lng ?? null}
                                    onLocationSelect={() => { /* read-only in dashboard */ }}
                                />

                                {/* Overlay stats panel — hidden on very small screens */}
                                {profile?.landlocation && (
                                    <div className="hidden xs:block absolute top-4 left-4 z-[999] bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-white/50 p-3 sm:p-4 w-44 sm:w-56 pointer-events-none">
                                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mb-2">Land Overview</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] sm:text-xs font-medium text-slate-600 flex items-center gap-1">
                                                    <Droplets className="w-3 h-3 text-blue-500" />Soil
                                                </span>
                                                <span className="text-[11px] sm:text-xs font-bold text-slate-900 capitalize">{profile.soil_type}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] sm:text-xs font-medium text-slate-600 flex items-center gap-1">
                                                    <Sun className="w-3 h-3 text-amber-500" />Area
                                                </span>
                                                <span className="text-[11px] sm:text-xs font-bold text-slate-900">{profile.landarea} acres</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] sm:text-xs font-medium text-slate-600 flex items-center gap-1">
                                                    <Leaf className="w-3 h-3 text-emerald-500" />Crops
                                                </span>
                                                <span className="text-[11px] sm:text-xs font-bold text-slate-900">{profile.current_crop.length || '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Transactions with Banking Details */}
                        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-4 sm:p-6 border-b border-slate-50 flex items-center justify-between">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                                    Recent Activity &amp; Payments
                                </h2>
                                <button className="text-xs font-bold text-indigo-600 hover:underline whitespace-nowrap">Download Report</button>
                            </div>

                            {/* Banking details banner */}
                            {profile && (
                                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-indigo-50 border-b border-indigo-100">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        {/* Account */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                                <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] sm:text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Linked Bank Account</p>
                                                <p className="text-xs sm:text-sm font-bold text-indigo-900 mt-0.5 font-mono truncate">{maskAccount(profile.bank_account_no)}</p>
                                            </div>
                                        </div>
                                        {/* IFSC */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                                <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] sm:text-[10px] text-indigo-400 font-bold uppercase tracking-widest">IFSC Code</p>
                                                <p className="text-xs sm:text-sm font-bold text-indigo-900 mt-0.5 font-mono">{profile.IFSC_no || '—'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => router.push('/user/updateprofile')}
                                            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
                                        >
                                            <Pencil className="w-3 h-3" /> Edit
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="divide-y divide-slate-50">
                                {txLoading ? (
                                    <div className="p-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" />
                                    </div>
                                ) : transactions.length > 0 ? (
                                    transactions.map((tx, i) => (
                                        <div key={tx._id || i} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors gap-3">
                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.fromId === profile?.userId ? 'bg-slate-50 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {tx.fromId === profile?.userId
                                                        ? <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        : <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate capitalize">{tx.type} {tx.type === 'transfer' ? 'from Aggregator' : ''}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-[10px] sm:text-xs text-slate-500 truncate">{getRelativeTime(tx.createdAt)}</p>
                                                        {tx.pricePerCredit && (
                                                            <>
                                                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                                <p className="text-[10px] sm:text-xs font-bold text-indigo-600">Price: ₹{tx.pricePerCredit}/CRD</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`text-sm font-bold ${tx.fromId === profile?.userId ? 'text-slate-900' : 'text-emerald-600'}`}>
                                                    {tx.fromId === profile?.userId ? '+' : '-'} {tx.creditAmount.toLocaleString()} CRD
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold">Total: ₹{tx.totalValue.toLocaleString()}</p>
                                                <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${tx.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {tx.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center text-slate-400 text-xs">
                                        No recent activity found.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: AI Suggestions + Audit */}
                    <div className="lg:col-span-4 space-y-6 sm:space-y-8">

                        {/* AI Suggestions */}
                        <div className="bg-indigo-700 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-indigo-600/20 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                                <Sparkles className="w-20 h-20" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-200" />
                                        <h2 className="text-sm sm:text-base font-extrabold tracking-tight">AI Strategies</h2>
                                    </div>
                                    {suggestSource && (
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${suggestSource === 'ai' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-indigo-200'}`}>
                                            {suggestSource === 'ai' ? 'AI Powered' : 'Curated'}
                                        </span>
                                    )}
                                </div>
                                {profile && (
                                    <p className="text-indigo-300 text-[10px] mb-4 sm:mb-5">
                                        Personalised for your {profile.soil_type} soil &amp; {profile.current_crop.slice(0, 2).join(', ') || 'crops'}
                                    </p>
                                )}

                                {suggestLoading ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-300" />
                                        <p className="text-xs text-indigo-300 font-medium">Generating personalised strategies…</p>
                                    </div>
                                ) : suggestions.length > 0 ? (
                                    <>
                                        {/* Active suggestion card */}
                                        {(() => {
                                            const s = suggestions[activeSuggestIdx];
                                            const cfg = SUGGESTION_CONFIG[s.type] ?? SUGGESTION_CONFIG.practice;
                                            const Icon = cfg.icon;
                                            return (
                                                <div className={`border rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3 ${cfg.colors}`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="w-4 h-4" />
                                                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{s.type}</p>
                                                        </div>
                                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${cfg.badge}`}>
                                                            {s.priority}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs sm:text-sm font-bold text-white mb-1.5">{s.title}</p>
                                                    <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed">{s.body}</p>
                                                </div>
                                            );
                                        })()}

                                        {/* Navigation dots + arrows */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-1.5">
                                                {suggestions.map((_, i) => (
                                                    <button key={i} onClick={() => setActiveSuggestIdx(i)}
                                                        className={`h-1.5 rounded-full transition-all ${i === activeSuggestIdx ? 'bg-white w-4' : 'bg-white/30 w-1.5 hover:bg-white/50'}`} />
                                                ))}
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => setActiveSuggestIdx(i => Math.max(0, i - 1))}
                                                    disabled={activeSuggestIdx === 0}
                                                    className="px-2 py-1 text-[10px] font-bold bg-white/10 hover:bg-white/20 rounded-lg transition-all disabled:opacity-30"
                                                >‹</button>
                                                <button
                                                    onClick={() => setActiveSuggestIdx(i => Math.min(suggestions.length - 1, i + 1))}
                                                    disabled={activeSuggestIdx === suggestions.length - 1}
                                                    className="px-2 py-1 text-[10px] font-bold bg-white/10 hover:bg-white/20 rounded-lg transition-all disabled:opacity-30"
                                                >›</button>
                                            </div>
                                        </div>

                                        {/* All suggestions mini-list */}
                                        <div className="mt-4 space-y-1.5">
                                            {suggestions.map((s, i) => {
                                                const cfg = SUGGESTION_CONFIG[s.type] ?? SUGGESTION_CONFIG.practice;
                                                const Icon = cfg.icon;
                                                return (
                                                    <button key={i} onClick={() => setActiveSuggestIdx(i)}
                                                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-2 ${i === activeSuggestIdx ? 'bg-white/15' : 'hover:bg-white/10'}`}>
                                                        <Icon className="w-3.5 h-3.5 shrink-0 text-indigo-200" />
                                                        <p className="text-[11px] font-bold text-white/90 truncate">{s.title}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : !profile ? (
                                    <div className="bg-white/10 border border-white/20 p-4 rounded-2xl text-center py-8">
                                        <Info className="w-6 h-6 text-indigo-300 mx-auto mb-2" />
                                        <p className="text-xs text-indigo-200 font-medium">Complete your profile to receive personalised AI strategies for your farm.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white/10 border border-white/20 p-4 rounded-2xl">
                                        {[
                                            { icon: Zap, type: 'Opportunity', body: "Current soil moisture optimal for Cover Cropping. Boost S-Carbon by 1.2% next quarter." },
                                            { icon: DollarSign, type: 'Market Alert', body: "'Agroforestry Credits' surged 15%. Consider listing 2023 offsets today." },
                                        ].map((item, i) => (
                                            <div key={i} className={`${i > 0 ? 'mt-3 pt-3 border-t border-white/10' : ''}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <item.icon className="w-3.5 h-3.5 text-amber-300" />
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">{item.type}</p>
                                                </div>
                                                <p className="text-xs text-indigo-50 leading-relaxed font-medium">{item.body}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Audit Trail */}
                        <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                                    Audit Trail (SHA-256)
                                </h2>
                                <Settings className="w-4 h-4 text-slate-400 cursor-pointer" />
                            </div>
                            <div className="space-y-2">
                                {logsLoading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                                    </div>
                                ) : auditLogs.length > 0 ? (
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                        {auditLogs.map((log) => (
                                            <div key={log._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{formatAction(log.action)}</span>
                                                    <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                                                </div>
                                                <p className="text-[10px] font-mono text-slate-500 truncate" title={log.txHash}>
                                                    🔗 {log.txHash.slice(0, 24)}...{log.txHash.slice(-8)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <p className="text-[11px] text-slate-400">No security logs recorded yet.</p>
                                    </div>
                                )}
                            </div>
                            <button className="w-full mt-5 sm:mt-6 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> View Full Transparency Log
                            </button>
                        </section>
                    </div>
                </div>
            </main >
        </div >
    );
}

/* ------------------------------------------------------------------ */
function ProfileStat({ label, value, accent }: { label: string; value: string; accent: string }) {
    const colors: Record<string, string> = {
        emerald: 'bg-emerald-50 text-emerald-700',
        indigo: 'bg-indigo-50  text-indigo-700',
        amber: 'bg-amber-50   text-amber-700',
        slate: 'bg-slate-100  text-slate-700',
    };
    return (
        <div className={`rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 ${colors[accent] ?? colors.slate}`}>
            <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest opacity-60 mb-0.5">{label}</p>
            <p className="text-[11px] sm:text-xs font-bold capitalize truncate">{value}</p>
        </div>
    );
}