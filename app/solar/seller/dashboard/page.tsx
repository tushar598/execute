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

                // Fetch audit logs
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-orange-100 flex items-center justify-center shadow-lg shadow-orange-500/10">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    </div>
                    <div className="text-center">
                        <p className="text-slate-900 font-bold flex items-center gap-2">
                            <Sun className="w-4 h-4 text-orange-500" /> Loading Solar Dashboard
                        </p>
                        <p className="text-slate-500 text-sm mt-1">Fetching your energy data…</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-orange-500/20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20">
                            <Sun className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">Solar Dashboard</p>
                            <p className="hidden sm:block text-[10px] text-orange-600 font-bold uppercase tracking-widest leading-none mt-0.5">Sun Tokens</p>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
                        <Link href="/solar/seller/dashboard" className="px-4 py-2 text-sm font-bold text-orange-700 bg-white rounded-lg shadow-sm border border-orange-100">Dashboard</Link>
                        <Link href="/solar/seller/get-token" className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all">Get Token</Link>
                        <Link href="/solar/seller/sell-token" className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all">Sell Tokens</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-px h-5 bg-slate-200" />
                        <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>

                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-3 space-y-1 shadow-md absolute w-full">
                        <Link href="/solar/seller/dashboard" className="block px-4 py-3 text-sm font-bold text-orange-700 bg-orange-50 rounded-xl border border-orange-100">Dashboard</Link>
                        <Link href="/solar/seller/get-token" className="block px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-colors">Get Token</Link>
                        <Link href="/solar/seller/sell-token" className="block px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-colors">Sell Tokens</Link>
                        <div className="h-px bg-slate-100 my-2" />
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20 space-y-6">
                {/* Solar Hero Banner */}
                <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-transparent pointer-events-none" />
                    <div className="relative px-6 sm:px-8 pt-8 pb-12 overflow-hidden border-b border-slate-100">
                        <div className="absolute -top-20 -right-20 w-72 h-72 bg-orange-100/50 rounded-full blur-[80px] pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-100/40 rounded-full blur-[60px] pointer-events-none" />

                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
                            <div>
                                <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 backdrop-blur-md">
                                    <Sun className="w-3.5 h-3.5 text-orange-500" />
                                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Solar Energy Connect</span>
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">{userName}</h2>
                                <p className="text-slate-500 text-sm mt-2 max-w-md leading-relaxed">Manage your solar production, trade excess energy for tokens, and monitor your earnings in real-time.</p>
                            </div>
                            <div className="flex items-center gap-3 self-start bg-white border border-slate-200 rounded-2xl px-5 py-3 shrink-0 shadow-sm">
                                <div className="relative">
                                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                    <div className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-75" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Available to Sell</span>
                                    <span className="text-slate-900 text-lg font-bold leading-none">{sunToken.tokensAvailable} <span className="text-slate-400 text-sm">TKN</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Energy bar */}
                        <div className="relative z-10 space-y-2.5 pb-4">
                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                <span>Network Utilization</span>
                                <span className="text-orange-600">{sunToken.totalEnergyConsumed} <span className="text-slate-400">/</span> {sunToken.totalEnergyProduced} kWh</span>
                            </div>
                            <div className="h-3 bg-slate-100 border border-slate-200 rounded-full overflow-hidden p-0.5 shadow-inner">
                                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                                    style={{ width: `${sunToken.totalEnergyProduced > 0 ? Math.min(100, Math.round((sunToken.totalEnergyConsumed / sunToken.totalEnergyProduced) * 100)) : 0}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-slate-50/80 px-4 sm:px-6 pb-6 pt-6 border-t border-slate-100">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatPill label="Produced" value={`${sunToken.totalEnergyProduced} kWh`} sub="Smart Meter Data" icon={<Zap className="w-4 h-4" />} accent="amber" />
                            <StatPill label="Consumed" value={`${sunToken.totalEnergyConsumed} kWh`} sub="Self Usage" icon={<Battery className="w-4 h-4" />} accent="slate" />
                            <StatPill label="Leftover" value={`${sunToken.leftoverEnergy} kWh`} sub="Eligible to Mint" icon={<TrendingUp className="w-4 h-4" />} accent="emerald" />
                            <StatPill label="Earnings" value={`₹${sunToken.balance.toLocaleString()}`} sub="From Token Sales" icon={<IndianRupee className="w-4 h-4" />} accent="teal" />
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Profile Details */}
                        {profile && (
                            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                                        <Gauge className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">Solar Profile</h2>
                                        <p className="text-xs text-slate-500">Installation Details</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Meter Number</p>
                                        <p className="text-sm font-bold text-slate-800 font-mono">{profile.digitalMeterNumber}</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">State / Region</p>
                                        <p className="text-sm font-bold text-slate-800">{profile.state}</p>
                                    </div>
                                    <div className="sm:col-span-2 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Address</p>
                                        <p className="text-sm text-slate-700 leading-relaxed">{profile.address}</p>
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                                            <MapPin className="w-4 h-4 text-orange-500" />
                                            <p className="text-xs text-slate-500 font-mono bg-white px-2 py-1 rounded-md border border-slate-100">{profile.coordinates.lat.toFixed(4)}, {profile.coordinates.lng.toFixed(4)}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Token Summary */}
                        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                                    <Coins className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Sun Token Ledger</h2>
                                    <p className="text-xs text-slate-500">Minted and Sold tracking</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:bg-orange-50 hover:border-orange-100 transition-colors">
                                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Sun className="w-3 h-3" /> Minted</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{sunToken.tokensGenerated}</p>
                                </div>
                                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 shadow-[inset_0_0_15px_rgba(249,115,22,0.05)] hover:bg-orange-100 transition-colors">
                                    <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Available</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-orange-700 tracking-tight">{sunToken.tokensAvailable}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:bg-amber-50 hover:border-amber-100 transition-colors">
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><ShoppingCart className="w-3 h-3" /> Sold</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{sunToken.tokensSold}</p>
                                </div>
                            </div>
                        </section>

                        {/* Transaction History */}
                        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                                    <Activity className="w-4 h-4 text-orange-500" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Transaction History</h2>
                                    <p className="text-[10px] text-slate-500 font-medium">Recent market activity</p>
                                </div>
                            </div>
                            {transactions.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {transactions.map(tx => (
                                        <div key={tx._id} className="px-6 py-5 flex items-center justify-between hover:bg-orange-50/50 transition-colors group">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{tx.tokenAmount} Sun Tokens</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleString()}</p>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <p className="text-[10px] font-mono text-slate-400 border border-slate-100 bg-slate-50 px-1 rounded truncate max-w-[100px]">{tx._id}</p>
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
                                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                                        <Activity className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <p className="text-sm text-slate-700 font-bold">No transactions yet</p>
                                    <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">Mint tokens and list them on the market to see activity.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column */}
                    <aside className="lg:col-span-4 space-y-6">
                        {/* Quick Actions */}
                        <section className="rounded-3xl overflow-hidden border border-orange-200 bg-white shadow-sm p-1.5 relative">
                            <div className="bg-orange-50/50 rounded-[1.3rem] p-6 relative z-10 space-y-3">
                                <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-orange-500" /> Actions
                                </h2>
                                <Link href="/solar/seller/get-token" className="w-full flex items-center justify-between p-4 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-2xl transition-all group shadow-sm">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-2 group-hover:text-orange-600 transition-colors">Mint Sun Tokens</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Convert Solar Energy</p>
                                    </div>
                                    <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-100 transition-all border border-orange-100">
                                        <ArrowUpRight className="w-4 h-4 text-orange-500" />
                                    </div>
                                </Link>
                                <Link href="/solar/seller/sell-token" className="w-full flex items-center justify-between p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl transition-all group shadow-md shadow-orange-500/20">
                                    <div>
                                        <p className="text-sm font-bold leading-tight">Sell on Market</p>
                                        <p className="text-[10px] text-orange-200 uppercase tracking-widest font-bold mt-1">List available tokens</p>
                                    </div>
                                    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all border border-white/10">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </div>
                                </Link>
                            </div>
                        </section>

                        {/* Audit Trail */}
                        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                                    <Lock className="w-4 h-4 text-purple-500" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-sm font-bold text-slate-900">Trust Layer</h2>
                                    <p className="text-[10px] text-slate-500">Blockchain Hash Records</p>
                                </div>
                                <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-[9px] font-bold text-slate-600 uppercase tracking-wider">SHA-256</span>
                            </div>

                            {auditLogs.length > 0 ? (
                                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                    {auditLogs.map(log => (
                                        <div key={log._id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 transition-colors group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest bg-purple-100 px-2 py-0.5 rounded-full">{log.action.replace(/_/g, ' ')}</span>
                                                <span className="text-[10px] text-slate-500 font-medium">{new Date(log.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Lock className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                                                <p className="text-[10px] font-mono text-slate-500 break-all leading-relaxed group-hover:text-slate-700 transition-colors">{log.txHash}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    <div className="w-12 h-12 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                        <Lock className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <p className="text-xs text-slate-500">No cryptographic records yet.</p>
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
type Accent = 'amber' | 'emerald' | 'teal' | 'slate';
const accentMap: Record<Accent, { card: string; icon: string; value: string; line: string }> = {
    amber: { card: 'bg-white hover:bg-orange-50 border border-slate-200 shadow-sm', icon: 'bg-orange-50 text-orange-500 border border-orange-100', value: 'text-slate-900', line: 'bg-orange-100' },
    emerald: { card: 'bg-white hover:bg-emerald-50 border border-slate-200 shadow-sm', icon: 'bg-emerald-50 text-emerald-500 border border-emerald-100', value: 'text-slate-900', line: 'bg-emerald-100' },
    teal: { card: 'bg-white hover:bg-teal-50 border border-slate-200 shadow-sm', icon: 'bg-teal-50 text-teal-500 border border-teal-100', value: 'text-slate-900', line: 'bg-teal-100' },
    slate: { card: 'bg-white hover:bg-slate-50 border border-slate-200 shadow-sm', icon: 'bg-slate-50 text-slate-600 border border-slate-200', value: 'text-slate-900', line: 'bg-slate-100' },
};

function StatPill({ label, value, sub, icon, accent }: { label: string; value: string; sub: string; icon: React.ReactNode; accent: Accent }) {
    const a = accentMap[accent];
    return (
        <div className={`relative overflow-hidden ${a.card} rounded-3xl p-5 sm:p-6 transition-colors`}>
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl ${a.line} opacity-50 pointer-events-none -mr-10 -mt-10`} />
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${a.icon}`}>{icon}</div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
                </div>
                <div className="mt-2">
                    <p className={`text-2xl font-bold tracking-tight ${a.value}`}>{value}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">{sub}</p>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        processing: 'bg-orange-50 text-orange-600 border-orange-200',
        govt_review: 'bg-blue-50 text-blue-600 border-blue-200',
        delivered: 'bg-teal-50 text-teal-600 border-teal-200',
        payment_sent: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    };
    return (
        <span className={`inline-flex text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${map[status] || map.processing}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}
