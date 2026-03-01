"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Sun, Zap, Battery, TrendingUp, LogOut, Loader2, Menu, X,
    MapPin, Gauge, IndianRupee, Activity, Lock, Wallet, ArrowUpRight, Coins, ShoppingCart
} from 'lucide-react';

interface SolarProfileData {
    address: string;
    coordinates: { lat: number; lng: number };
    state: string;
    digitalMeterNumber: string;
}

interface SunTokenData {
    totalEnergyProduced: number;
    totalEnergyConsumed: number;
    leftoverEnergy: number;
    tokensGenerated: number;
    tokensAvailable: number;
    tokensSold: number;
    balance: number;
}

interface Transaction {
    _id: string;
    tokenAmount: number;
    pricePerToken: number;
    totalAmount: number;
    status: string;
    txHash: string;
    createdAt: string;
}

interface AuditEntry {
    _id: string;
    action: string;
    txHash: string;
    timestamp: string;
}

export default function SolarSellerDashboard() {
    const router = useRouter();
    const [profile, setProfile] = useState<SolarProfileData | null>(null);
    const [sunToken, setSunToken] = useState<SunTokenData>({
        totalEnergyProduced: 0, totalEnergyConsumed: 0, leftoverEnergy: 0,
        tokensGenerated: 0, tokensAvailable: 0, tokensSold: 0, balance: 0,
    });
    const [userName, setUserName] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const profileRes = await fetch('/api/solar/profile');
                if (!profileRes.ok) { router.push('/login'); return; }
                const profileData = await profileRes.json();

                if (!profileData.profile?.hasdone_process) {
                    router.push('/solar/seller/onboarding');
                    return;
                }

                setProfile(profileData.profile);
                setSunToken(profileData.sunToken);
                setUserName(profileData.user?.username || 'Seller');
                setTransactions(profileData.transactions || []);

                const auditRes = await fetch('/api/auditlogs?limit=10');
                if (auditRes.ok) {
                    const auditData = await auditRes.json();
                    setAuditLogs(auditData.logs || []);
                }
            } catch (err) {
                console.error('Dashboard load error:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAll();
    }, [router]);

    const handleLogout = async () => {
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { }
        router.push('/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-5">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-300 flex items-center justify-center shadow-xl shadow-amber-200/30">
                            <Sun className="w-7 h-7 text-white animate-pulse" />
                        </div>
                        <div className="absolute -inset-4 rounded-3xl bg-amber-200/20 blur-2xl animate-pulse" />
                    </div>
                    <div className="text-center">
                        <p className="text-slate-800 font-bold text-lg tracking-tight">Solar Dashboard</p>
                        <p className="text-slate-400 text-sm mt-1">Loading your energy data…</p>
                    </div>
                </div>
            </div>
        );
    }

    const utilPct = sunToken.totalEnergyProduced > 0 ? Math.min(100, Math.round((sunToken.totalEnergyConsumed / sunToken.totalEnergyProduced) * 100)) : 0;

    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-amber-400/20">

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-amber-100/60 shadow-[0_1px_3px_rgba(251,191,36,0.06)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-amber-300 to-orange-400 rounded-xl flex items-center justify-center shadow-md shadow-amber-200/30">
                            <Sun className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">Solar Dashboard</p>
                            <p className="hidden sm:block text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em] leading-none mt-0.5">Sun Tokens</p>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-1 bg-amber-50/60 border border-amber-100 rounded-xl p-1">
                        <Link href="/solar/seller/dashboard" className="px-4 py-2 text-sm font-bold text-amber-700 bg-white rounded-lg shadow-sm border border-amber-200/60">Dashboard</Link>
                        <Link href="/solar/seller/get-token" className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-amber-700 hover:bg-white/60 rounded-lg transition-all">Get Token</Link>
                        <Link href="/solar/seller/sell-token" className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-amber-700 hover:bg-white/60 rounded-lg transition-all">Sell Tokens</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-px h-5 bg-slate-200" />
                        <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>

                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-500 hover:text-amber-600 rounded-lg transition-colors">
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-amber-100/60 bg-white px-4 py-3 space-y-1 shadow-xl absolute w-full">
                        <Link href="/solar/seller/dashboard" className="block px-4 py-3 text-sm font-bold text-amber-700 bg-amber-50 rounded-xl border border-amber-200/60">Dashboard</Link>
                        <Link href="/solar/seller/get-token" className="block px-4 py-3 text-sm font-medium text-slate-600 hover:bg-amber-50/50 rounded-xl transition-colors">Get Token</Link>
                        <Link href="/solar/seller/sell-token" className="block px-4 py-3 text-sm font-medium text-slate-600 hover:bg-amber-50/50 rounded-xl transition-colors">Sell Tokens</Link>
                        <div className="h-px bg-slate-100 my-2" />
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20 space-y-6 relative z-10">
                {/* Hero Banner */}
                <div className="rounded-3xl overflow-hidden relative shadow-lg shadow-amber-100/40">
                    {/* Gradient Banner */}
                    <div className="relative bg-gradient-to-br from-amber-200 via-amber-300 to-orange-200 overflow-hidden">

                        <div className="px-6 sm:px-8 pt-8 pb-12 relative z-10">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
                                <div>
                                    <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/50 border border-amber-300/40">
                                        <Sun className="w-3.5 h-3.5 text-amber-600" />
                                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em]">Solar Energy Connect</span>
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800">{userName}</h2>
                                    <p className="text-amber-800/70 text-sm mt-2 max-w-md leading-relaxed">Manage your solar production, trade excess energy, and monitor earnings.</p>
                                </div>
                                <div className="flex items-center gap-3 self-start bg-white/60 border border-amber-200/50 rounded-2xl px-5 py-4 shrink-0">
                                    <div className="relative">
                                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                                        <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-30" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-amber-700/60 font-bold uppercase tracking-[0.15em] leading-none mb-1.5">Available to Sell</span>
                                        <span className="text-slate-800 text-xl font-bold leading-none">{sunToken.tokensAvailable} <span className="text-amber-500/60 text-sm">TKN</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* Energy bar */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.15em]">
                                    <span className="text-amber-700/60">Network Utilization</span>
                                    <span className="text-slate-700">{sunToken.totalEnergyConsumed} <span className="text-amber-600/40">/</span> {sunToken.totalEnergyProduced} kWh</span>
                                </div>
                                <div className="h-3 bg-white/40 border border-amber-200/30 rounded-full overflow-hidden p-0.5">
                                    <div className="h-full bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400 rounded-full transition-all duration-1000"
                                        style={{ width: `${utilPct}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats — overlapping bottom of hero */}
                    <div className="bg-white px-4 sm:px-6 pb-5 -mt-5 relative z-20">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 -translate-y-4">
                            <GlassStat label="Produced" value={`${sunToken.totalEnergyProduced} kWh`} sub="Smart Meter Data" icon={<Zap className="w-4 h-4" />} color="amber" />
                            <GlassStat label="Consumed" value={`${sunToken.totalEnergyConsumed} kWh`} sub="Self Usage" icon={<Battery className="w-4 h-4" />} color="slate" />
                            <GlassStat label="Leftover" value={`${sunToken.leftoverEnergy} kWh`} sub="Eligible to Mint" icon={<TrendingUp className="w-4 h-4" />} color="emerald" />
                            <GlassStat label="Earnings" value={`₹${sunToken.balance.toLocaleString()}`} sub="From Token Sales" icon={<IndianRupee className="w-4 h-4" />} color="amber" />
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Profile Details */}
                        {profile && (
                            <section className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shadow-sm">
                                        <Gauge className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">Solar Profile</h2>
                                        <p className="text-xs text-slate-400">Installation Details</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-1.5">Meter Number</p>
                                        <p className="text-sm font-bold text-slate-900 font-mono">{profile.digitalMeterNumber}</p>
                                    </div>
                                    <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-1.5">State / Region</p>
                                        <p className="text-sm font-bold text-slate-900">{profile.state}</p>
                                    </div>
                                    <div className="sm:col-span-2 bg-slate-50/80 border border-slate-100 rounded-2xl p-4">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-1.5">Address</p>
                                        <p className="text-sm text-slate-600 leading-relaxed">{profile.address}</p>
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                                            <MapPin className="w-4 h-4 text-amber-500" />
                                            <p className="text-xs text-slate-400 font-mono bg-amber-50/50 px-2 py-1 rounded-md border border-amber-100">{profile.coordinates.lat.toFixed(4)}, {profile.coordinates.lng.toFixed(4)}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Token Summary */}
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shadow-sm">
                                    <Coins className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Sun Token Ledger</h2>
                                    <p className="text-xs text-slate-400">Minted and Sold tracking</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-5 hover:bg-amber-50/50 hover:border-amber-200/60 transition-all duration-300 group">
                                    <p className="text-[10px] text-amber-600/80 font-bold uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5"><Sun className="w-3 h-3" /> Minted</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight group-hover:text-amber-700 transition-colors">{sunToken.tokensGenerated}</p>
                                </div>
                                <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-5 shadow-sm shadow-amber-200/30 hover:shadow-md hover:shadow-amber-200/40 transition-all duration-300">
                                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Available</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-amber-700 tracking-tight">{sunToken.tokensAvailable}</p>
                                </div>
                                <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-5 hover:bg-emerald-50/50 hover:border-emerald-200/60 transition-all duration-300 group">
                                    <p className="text-[10px] text-emerald-600/80 font-bold uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5"><ShoppingCart className="w-3 h-3" /> Sold</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">{sunToken.tokensSold}</p>
                                </div>
                            </div>
                        </section>

                        {/* Transaction History */}
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100/80 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center">
                                    <Activity className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Transaction History</h2>
                                    <p className="text-[10px] text-slate-400 font-medium">Recent market activity</p>
                                </div>
                            </div>
                            {transactions.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {transactions.map(tx => (
                                        <div key={tx._id} className="px-6 py-5 flex items-center justify-between hover:bg-amber-50/30 transition-colors group">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">{tx.tokenAmount} Sun Tokens</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleString()}</p>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                    <p className="text-[10px] font-mono text-slate-300 bg-slate-50 border border-slate-100 px-1.5 rounded truncate max-w-[100px]">{tx._id}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-emerald-600">₹{tx.totalAmount.toLocaleString()}</p>
                                                <div className="mt-1.5"><StatusBadge status={tx.status} /></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-6 py-16 text-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                                        <Activity className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-sm text-slate-600 font-bold">No transactions yet</p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-[220px] mx-auto">Mint tokens and list them on the market to see activity.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column */}
                    <aside className="lg:col-span-4 space-y-6">
                        {/* Quick Actions */}
                        <section className="rounded-3xl overflow-hidden border border-amber-200/40 bg-amber-50/30 shadow-md shadow-amber-100/20 p-6 relative">
                            <div className="relative z-10 space-y-3">
                                <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-500" /> Actions
                                </h2>
                                <Link href="/solar/seller/get-token" className="w-full flex items-center justify-between p-4 bg-white hover:bg-amber-50/50 border border-slate-100 hover:border-amber-200 rounded-2xl transition-all group shadow-sm hover:shadow-md">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-2 group-hover:text-amber-600 transition-colors">Mint Sun Tokens</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.15em] font-bold mt-1">Convert Solar Energy</p>
                                    </div>
                                    <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-100 transition-all border border-amber-200/40">
                                        <ArrowUpRight className="w-4 h-4 text-amber-500" />
                                    </div>
                                </Link>
                                <Link href="/solar/seller/sell-token" className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-400 to-orange-300 hover:from-amber-300 hover:to-orange-200 text-white rounded-2xl transition-all group shadow-md shadow-amber-200/25">
                                    <div>
                                        <p className="text-sm font-bold leading-tight">Sell on Market</p>
                                        <p className="text-[10px] text-amber-100/70 uppercase tracking-[0.15em] font-bold mt-1">List available tokens</p>
                                    </div>
                                    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </div>
                                </Link>
                            </div>
                        </section>

                        {/* Audit Trail */}
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6 sm:p-7">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-200/60 flex items-center justify-center">
                                    <Lock className="w-4 h-4 text-violet-500" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-sm font-bold text-slate-900">Trust Layer</h2>
                                    <p className="text-[10px] text-slate-400">Blockchain Hash Records</p>
                                </div>
                                <span className="bg-slate-50 border border-slate-100 px-2 py-1 rounded text-[9px] font-bold text-slate-400 uppercase tracking-wider">SHA-256</span>
                            </div>

                            {auditLogs.length > 0 ? (
                                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                                    {auditLogs.map(log => (
                                        <div key={log._id} className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 hover:border-violet-200/60 hover:bg-violet-50/30 transition-colors group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.1em] bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200/60">{log.action.replace(/_/g, ' ')}</span>
                                                <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Lock className="w-3 h-3 text-slate-300 mt-0.5 shrink-0" />
                                                <p className="text-[10px] font-mono text-slate-400 break-all leading-relaxed group-hover:text-slate-500 transition-colors">{log.txHash}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    <div className="w-12 h-12 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                        <Lock className="w-5 h-5 text-slate-300" />
                                    </div>
                                    <p className="text-xs text-slate-400">No cryptographic records yet.</p>
                                </div>
                            )}
                        </section>
                    </aside>
                </div>
            </main>
        </div>
    );
}

// Components
type GlassColor = 'amber' | 'emerald' | 'slate';
const colorMap: Record<GlassColor, { card: string; icon: string }> = {
    amber: { card: 'bg-amber-50 border-amber-200/60 shadow-amber-100/40 hover:shadow-amber-200/50', icon: 'bg-amber-100/80 text-amber-600 border-amber-200/60' },
    emerald: { card: 'bg-emerald-50 border-emerald-200/60 shadow-emerald-100/40 hover:shadow-emerald-200/50', icon: 'bg-emerald-100/80 text-emerald-600 border-emerald-200/60' },
    slate: { card: 'bg-slate-50 border-slate-100 shadow-slate-100/40', icon: 'bg-slate-100 text-slate-500 border-slate-200/60' },
};

function GlassStat({ label, value, sub, icon, color }: { label: string; value: string; sub: string; icon: React.ReactNode; color: GlassColor }) {
    const c = colorMap[color];
    return (
        <div className={`border rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 ${c.card}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 border ${c.icon}`}>{icon}</div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">{label}</p>
            <p className="text-xl font-bold tracking-tight text-slate-900">{value}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">{sub}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        processing: 'bg-amber-50 text-amber-700 border-amber-200',
        govt_review: 'bg-blue-50 text-blue-700 border-blue-200',
        delivered: 'bg-teal-50 text-teal-700 border-teal-200',
        payment_sent: 'bg-violet-50 text-violet-700 border-violet-200',
    };
    return (
        <span className={`inline-flex text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${map[status] || map.processing}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}
