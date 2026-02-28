"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Building2, Briefcase, TrendingUp, ShoppingCart,
    LogOut, Bell, Loader2, Menu, X, Globe, Shield,
    ArrowUpRight, CheckCircle, Package, Leaf, Lock, Activity,
    Wallet, Target, BarChart3, IndianRupee
} from 'lucide-react';

// Assumed total footprint for display (tonnes CO2e) — placeholder until ESG input is added
const TOTAL_FOOTPRINT_TONNES = 5000;

interface Project {
    _id: string;
    aggregatorId: string;
    projectName: string;
    projectDescription: string;
    totalCredits: number;
    pricePerCredit: number;
    status: string;
    createdAt: string;
}

interface AuditEntry {
    _id: string;
    action: string;
    entityType: string;
    txHash: string;
    timestamp: string;
    metadata: any;
}

interface Transaction {
    _id: string;
    type: string;
    fromId: string;
    toId: string;
    projectId?: string;
    creditAmount: number;
    pricePerCredit: number;
    totalValue: number;
    status: string;
    createdAt: string;
}

export default function CompanyDashboard() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState({
        totalListings: 0,
        totalCreditsBought: 0,
        totalSpent: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/company/marketplace');
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data.projects || []);
                }

                const auditRes = await fetch('/api/auditlogs?limit=10');
                if (auditRes.ok) {
                    const auditData = await auditRes.json();
                    setAuditLogs(auditData.logs || []);
                }

                const statsRes = await fetch('/api/company/totalaggregator');
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats({
                        totalListings: statsData.totalListings ?? 0,
                        totalCreditsBought: statsData.totalCreditsBought ?? 0,
                        totalSpent: statsData.totalSpent ?? 0,
                    });
                }

                const txRes = await fetch('/api/transactions/all_transactions?limit=10');
                if (txRes.ok) {
                    const txData = await txRes.json();
                    setTransactions(txData.transactions || []);
                }
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (err) {
            console.error('Logout failed:', err);
            router.push('/login');
        }
    };

    const netBalance = Math.max(0, TOTAL_FOOTPRINT_TONNES - stats.totalCreditsBought);
    const offsetPct = Math.min(100, Math.round((stats.totalCreditsBought / TOTAL_FOOTPRINT_TONNES) * 100));

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center shadow-sm">
                        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
                    </div>
                    <div className="text-center">
                        <p className="text-slate-800 font-semibold">Loading ESG Dashboard</p>
                        <p className="text-slate-400 text-sm mt-0.5">Fetching your carbon data…</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ── Header ── */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-teal-500/25">
                            <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">ESG Dashboard</p>
                            <p className="hidden sm:block text-[10px] text-slate-400 font-semibold uppercase tracking-widest leading-none">Corporate Carbon</p>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        <Link href="/company/dashboard" className="px-4 py-2 text-sm font-semibold text-teal-700 bg-teal-50 rounded-lg border border-teal-100">
                            Dashboard
                        </Link>
                        <Link href="/company/marketplace" className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all">
                            Marketplace
                        </Link>
                    </nav>

                    {/* Actions */}
                    <div className="hidden md:flex items-center gap-2">
                        {/* <button className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
                        </button> */}
                        <div className="w-px h-5 bg-slate-200 mx-1" />
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 shadow-lg">
                        <Link href="/company/dashboard" className="block px-4 py-2.5 text-sm font-semibold text-teal-700 bg-teal-50 rounded-lg">Dashboard</Link>
                        <Link href="/company/marketplace" className="block px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-all">Marketplace</Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20 space-y-6">

                {/* ── Carbon Wallet Banner ── */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">

                    {/* Gradient top section */}
                    <div className="relative bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 px-6 sm:px-8 pt-6 pb-10 overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-52 h-52 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Wallet className="w-4 h-4 text-teal-300" />
                                    <span className="text-xs font-bold text-teal-300 uppercase tracking-widest">Carbon Wallet</span>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Sustainability Control Center</h2>
                                <p className="text-teal-200/70 text-sm mt-1">Track emissions, offsets, and net carbon balance in real time.</p>
                            </div>
                            <div className="flex items-center gap-2 self-start bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-4 py-2 shrink-0">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-white text-xs font-bold">{offsetPct}% Neutralized</span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="relative z-10 space-y-2 pb-10">
                            <div className="flex justify-between text-[11px] font-semibold text-teal-300/70">
                                <span>Offset Progress</span>
                                <span>{stats.totalCreditsBought.toLocaleString()} / {TOTAL_FOOTPRINT_TONNES.toLocaleString()} T CO₂e</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-1000"
                                    style={{ width: `${offsetPct}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stat pills — pulled up over gradient */}
                    <div className="bg-white px-4 sm:px-6 pb-4 -mt-5">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 -translate-y-4">
                            <WalletPill
                                label="Total Footprint"
                                value={`${TOTAL_FOOTPRINT_TONNES.toLocaleString()} T`}
                                sub="CO₂e target"
                                icon={<Target className="w-4 h-4" />}
                                accent="slate"
                            />
                            <WalletPill
                                label="Total Offsets"
                                value={`${stats.totalCreditsBought.toLocaleString()} T`}
                                sub="Credits purchased"
                                icon={<Leaf className="w-4 h-4" />}
                                accent="emerald"
                            />
                            <WalletPill
                                label="Net Balance"
                                value={`${netBalance.toLocaleString()} T`}
                                sub="Gap remaining"
                                icon={<BarChart3 className="w-4 h-4" />}
                                accent={netBalance === 0 ? "emerald" : "amber"}
                            />
                            <WalletPill
                                label="Budget Spent"
                                value={`₹${(stats.totalSpent / 100000).toFixed(1)}L`}
                                sub={`₹${stats.totalSpent.toLocaleString()} total`}
                                icon={<IndianRupee className="w-4 h-4" />}
                                accent="teal"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Main Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ── Left Column ── */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Latest Projects */}
                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
                                        <Package className="w-3.5 h-3.5 text-teal-600" />
                                    </div>
                                    <h2 className="text-sm font-bold text-slate-800">Latest Carbon Projects</h2>
                                </div>
                                <Link href="/company/marketplace" className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors">
                                    View All <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {projects.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {projects.slice(0, 5).map((project) => (
                                        <div
                                            key={project._id}
                                            className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors group"
                                        >
                                            <div className="flex items-start gap-3.5">
                                                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0 group-hover:bg-teal-100 transition-colors">
                                                    <Briefcase className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 truncate">{project.projectName}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{project.projectDescription}</p>
                                                    <p className="text-[10px] text-slate-300 font-mono mt-1">by {project.aggregatorId}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-bold text-teal-600">₹{(project.totalCredits * project.pricePerCredit).toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{project.totalCredits.toLocaleString()} CRD · ₹{project.pricePerCredit}/CRD</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-6 py-14 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
                                        <Globe className="w-5 h-5 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-500">No projects available yet</p>
                                    <p className="text-xs text-slate-400 mt-1">Projects will appear as aggregators list them.</p>
                                </div>
                            )}
                        </section>

                        {/* Transaction History */}
                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                        <Activity className="w-3.5 h-3.5 text-indigo-500" />
                                    </div>
                                    <h2 className="text-sm font-bold text-slate-800">Transaction History</h2>
                                </div>
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Recent Activity</span>
                            </div>

                            {transactions.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {transactions.map((tx) => (
                                        <div key={tx._id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                                            <div className="flex items-start gap-3.5">
                                                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                                                    tx.type === 'purchase'
                                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                                        : 'bg-blue-50 border-blue-100 text-blue-500'
                                                }`}>
                                                    <TrendingUp className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 capitalize">{tx.type}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(tx.createdAt).toLocaleString()}</p>
                                                    <p className="text-[10px] text-slate-300 font-mono mt-0.5">{tx._id}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 space-y-1">
                                                <p className={`text-sm font-bold ${tx.type === 'purchase' ? 'text-emerald-600' : 'text-blue-500'}`}>
                                                    {tx.type === 'purchase' ? '+' : '−'}{tx.creditAmount.toLocaleString()} CRD
                                                </p>
                                                <p className="text-[10px] text-slate-400">₹{tx.totalValue.toLocaleString()}</p>
                                                <StatusBadge status={tx.status} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-6 py-14 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
                                        <Activity className="w-5 h-5 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-500">No transactions yet</p>
                                    <p className="text-xs text-slate-400 mt-1">Your purchase history will appear here.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ── Right Column ── */}
                    <aside className="lg:col-span-4 space-y-6">

                        {/* Marketplace CTA */}
                        <section className="rounded-2xl overflow-hidden border border-teal-200 bg-gradient-to-br from-teal-800 to-emerald-900 relative shadow-lg shadow-teal-900/10">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
                            <div className="relative z-10 p-6">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                                        <ShoppingCart className="w-4 h-4 text-teal-200" />
                                    </div>
                                    <h2 className="text-sm font-bold text-white">Carbon Marketplace</h2>
                                </div>
                                <p className="text-xs text-teal-200/70 mb-5 leading-relaxed">
                                    Browse and purchase verified carbon offset projects from trusted aggregators to meet your ESG goals.
                                </p>
                                <Link
                                    href="/company/marketplace"
                                    className="w-full flex items-center justify-between p-4 bg-teal-600 hover:bg-teal-500 rounded-xl transition-all group shadow-md shadow-teal-900/20"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-white leading-tight">Enter Marketplace</p>
                                        <p className="text-[10px] text-teal-200 uppercase tracking-widest font-bold mt-0.5">Purchase Terminal</p>
                                    </div>
                                    <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-white/25 transition-all">
                                        <ArrowUpRight className="w-4 h-4 text-white" />
                                    </div>
                                </Link>
                            </div>
                        </section>

                        {/* ESG Compliance */}
                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-800">ESG Compliance</h2>
                            </div>
                            <div className="space-y-2.5">
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <p className="text-xs text-emerald-700 font-medium">Carbon Neutral Target: On Track</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                                    <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                                    <p className="text-xs text-blue-700 font-medium">SHA-256 Audit Chain Active</p>
                                </div>
                            </div>
                        </section>

                        {/* Audit Trail */}
                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center">
                                    <Lock className="w-3.5 h-3.5 text-purple-500" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-800">Audit Trail</h2>
                                <span className="ml-auto text-[10px] font-bold text-slate-300 uppercase tracking-wider">SHA-256</span>
                            </div>

                            {auditLogs.length > 0 ? (
                                <div className="space-y-2 max-h-72 overflow-y-auto">
                                    {auditLogs.map((log) => (
                                        <div key={log._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/60 transition-colors">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{log.action.replace(/_/g, ' ')}</span>
                                                <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-[10px] font-mono text-slate-400 truncate">
                                                🔗 {log.txHash.slice(0, 20)}…{log.txHash.slice(-6)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <Lock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-xs text-slate-400">No audit logs yet. Logs appear as transactions occur.</p>
                                </div>
                            )}
                        </section>
                    </aside>
                </div>
            </main>
        </div>
    );
}

// ── WalletPill ──────────────────────────────────────────────────────────────────
type Accent = 'slate' | 'emerald' | 'amber' | 'teal';

const accentMap: Record<Accent, { card: string; icon: string; value: string }> = {
    slate:   { card: 'bg-white border border-slate-200 shadow-sm',           icon: 'bg-slate-100 text-slate-500',     value: 'text-slate-800' },
    emerald: { card: 'bg-emerald-50 border border-emerald-100 shadow-sm',    icon: 'bg-emerald-100 text-emerald-600', value: 'text-emerald-900' },
    amber:   { card: 'bg-amber-50 border border-amber-100 shadow-sm',        icon: 'bg-amber-100 text-amber-600',     value: 'text-amber-900'  },
    teal:    { card: 'bg-teal-50 border border-teal-100 shadow-sm',          icon: 'bg-teal-100 text-teal-600',       value: 'text-teal-900'   },
};

function WalletPill({ label, value, sub, icon, accent }: {
    label: string; value: string; sub: string;
    icon: React.ReactNode; accent: Accent;
}) {
    const a = accentMap[accent];
    return (
        <div className={`${a.card} rounded-2xl p-4`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${a.icon}`}>
                {icon}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
            <p className={`text-xl font-bold tracking-tight ${a.value}`}>{value}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{sub}</p>
        </div>
    );
}

// ── StatusBadge ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        pending:   'bg-amber-50 text-amber-700 border border-amber-200',
        failed:    'bg-red-50 text-red-600 border border-red-200',
    };
    return (
        <span className={`inline-flex text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${map[status] || map.pending}`}>
            {status}
        </span>
    );
}