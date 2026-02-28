"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, Shield, Briefcase, TrendingUp,
    Bell, LogOut, ChevronRight, LayoutDashboard,
    Search, Filter, Plus, Loader2, ArrowUpRight,
    CheckCircle2, AlertCircle, Menu, X, Globe, Package, Lock
} from 'lucide-react';
import Link from 'next/link';

interface AggregatorProfile {
    DealerId: string;
}

interface RecentDeal {
    _id: string;
    type: string;
    entityId: string;
    entityName: string;
    credits: number;
    pricePerCredit: number;
    totalValue: number;
    createdAt: string;
}

interface Analytics {
    aggregatorId: string;
    totalDeals: number;
    totalCredits: number;
    totalValue: number;
    activeCommunities: number;
    recentDeals: RecentDeal[];
}

interface AuditEntry {
    _id: string;
    action: string;
    entityType: string;
    txHash: string;
    timestamp: string;
    metadata: any;
}

export default function AggregatorDashboard() {
    const router = useRouter();
    const [profile, setProfile] = useState<AggregatorProfile | null>(null);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [soldProjects, setSoldProjects] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [soldLoading, setSoldLoading] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profileRes = await fetch('/api/aggregator/verifyaggregator');
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    if (profileData.exists) {
                        setProfile(profileData.aggregator);
                    } else {
                        router.push('/aggregator/onboarding');
                        return;
                    }
                } else {
                    router.push('/login');
                    return;
                }

                // Fetch live analytics
                const analyticsRes = await fetch('/api/aggregator/analytics');
                if (analyticsRes.ok) {
                    const analyticsData = await analyticsRes.json();
                    setAnalytics(analyticsData);
                }

                // Fetch audit logs
                const auditRes = await fetch('/api/auditlogs?limit=10');
                if (auditRes.ok) {
                    const auditData = await auditRes.json();
                    setAuditLogs(auditData.logs || []);
                }

                // Fetch sold projects
                setSoldLoading(true);
                const soldRes = await fetch('/api/aggregator/sold_projects');
                if (soldRes.ok) {
                    const soldData = await soldRes.json();
                    setSoldProjects(soldData.soldProjects || []);
                }
                setSoldLoading(false);
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router]);

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
                    <p className="text-slate-500 font-medium">Loading your cockpit...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">Aggregator Hub</h1>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium font-mono uppercase tracking-wider">{profile?.DealerId}</p>
                        </div>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6 mr-6">
                        <Link href="/aggregator/dashboard" className="text-sm font-bold text-blue-600">Dashboard</Link>
                        <Link href="/aggregator/project" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Projects</Link>
                        <Link href="/aggregator/marketplace" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Marketplace</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>
                        <div className="h-6 w-px bg-slate-200 mx-1" />
                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-all text-sm border border-transparent">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center gap-2">
                        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-2 shadow-lg">
                        <Link href="/aggregator/dashboard" className="block w-full px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 rounded-lg">Dashboard</Link>
                        <Link href="/aggregator/project" className="block w-full px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg">Projects</Link>
                        <Link href="/aggregator/marketplace" className="block w-full px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg">Marketplace</Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-red-500 font-bold hover:bg-red-50 transition-all text-sm rounded-lg border-t border-slate-50 mt-2 pt-4">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-20">
                {/* Stats Grid — Live Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
                    <StatCard
                        title="Total Managed Deals"
                        value={String(analytics?.totalDeals ?? 0)}
                        change="Accepted community deals"
                        icon={<Briefcase className="w-5 h-5" />}
                        color="blue"
                    />
                    <StatCard
                        title="Aggregated Credits"
                        value={(analytics?.totalCredits ?? 0).toLocaleString()}
                        change="Total CRD purchased"
                        icon={<TrendingUp className="w-5 h-5" />}
                        color="emerald"
                    />
                    <StatCard
                        title="Active Communities"
                        value={String(analytics?.activeCommunities ?? 0)}
                        change="Unique community partners"
                        icon={<Users className="w-5 h-5" />}
                        color="indigo"
                    />
                    <StatCard
                        title="Total Value (₹)"
                        value={`₹${(analytics?.totalValue ?? 0).toLocaleString()}`}
                        change="Credit portfolio value"
                        icon={<CheckCircle2 className="w-5 h-5" />}
                        color="amber"
                    />
                </div>

                {/* Main Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Recent Deals Table — LIVE DATA */}
                    <div className="lg:col-span-8 space-y-8">
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between min-w-[600px]">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <LayoutDashboard className="w-5 h-5 text-blue-600" />
                                    Active Deal Management
                                </h2>
                                <Link href="/aggregator/marketplace" className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
                                    <Plus className="w-4 h-4" /> New Deal
                                </Link>
                            </div>

                            {analytics?.recentDeals && analytics.recentDeals.length > 0 ? (
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entity</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Credits</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate (₹)</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 text-sm">
                                        {analytics.recentDeals.map((deal) => (
                                            <tr key={deal._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-slate-900 text-xs">{deal.entityName}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${deal.type === 'Community' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {deal.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-medium">{deal.credits.toLocaleString()} CRD</td>
                                                <td className="px-6 py-4 text-slate-600 font-medium">₹{deal.pricePerCredit.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right font-bold text-emerald-600">₹{deal.totalValue.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center">
                                    <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500 font-medium">No deals yet</p>
                                    <p className="text-xs text-slate-400 mt-1">Visit the Carbon Exchange to propose deals to communities.</p>
                                </div>
                            )}
                        </section>

                        {/* Sold Projects Section */}
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 mt-8">
                            <div className="border-b border-slate-50 pb-5 mb-5">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    Sold Projects
                                </h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Direct Sales to Companies</p>
                            </div>

                            {soldLoading ? (
                                <div className="py-12 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto" />
                                </div>
                            ) : soldProjects.length === 0 ? (
                                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50">
                                    <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <h3 className="text-sm font-bold text-slate-700 mb-1">No Projects Sold</h3>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                        Projects you bundle and list in the marketplace will appear here once purchased by a company.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {soldProjects.map((project) => (
                                        <div key={project._id} className="p-5 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50/50 transition-all group">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-100">
                                                        <TrendingUp className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors uppercase">{project.projectName}</h4>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                            <div className="flex items-center gap-1.5 ">
                                                                <span className="text-[10px] font-bold text-slate-400">Buyer:</span>
                                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{project.buyerName}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] font-bold text-slate-400">Credits:</span>
                                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{(project.totalCredits || 0).toLocaleString()} SOLD</span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-medium">Sold {getRelativeTime(project.updatedAt)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex flex-col items-end">
                                                        <p className="text-lg font-bold text-slate-900">₹{(project.totalValue || 0).toLocaleString()}</p>
                                                        <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">Profit:</span>
                                                            <span className="text-xs font-bold text-emerald-700">₹{(project.aggregatorProfit || 0).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Quick Access / Actions */}
                    <aside className="lg:col-span-4 space-y-8">
                        {/* Market Overview */}
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden relative">
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
                            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                Market Overview
                            </h2>
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Credits Owned</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-emerald-900">{(analytics?.totalCredits ?? 0).toLocaleString()}</span>
                                        <span className="text-xs text-emerald-600 font-bold">CRD</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Deals</p>
                                    <p className="text-lg font-bold text-slate-900">{analytics?.totalDeals ?? 0} Completed</p>
                                </div>
                            </div>
                        </section>

                        {/* Quick Links */}
                        <section className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative shadow-xl shadow-slate-900/20">
                            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                                <Globe className="w-20 h-20 text-blue-400" />
                            </div>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                Quick Actions
                            </h2>
                            <div className="space-y-3 relative z-10">
                                <Link href="/aggregator/marketplace" className="w-full flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-500 rounded-2xl border border-blue-400/50 transition-all group shadow-lg shadow-blue-500/20">
                                    <div>
                                        <p className="text-sm font-bold leading-tight">Enter Carbon Exchange</p>
                                        <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold mt-1">Buy Community Credits</p>
                                    </div>
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Search className="w-5 h-5 text-white" />
                                    </div>
                                </Link>
                                <Link href="/aggregator/project" className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all group">
                                    <div>
                                        <p className="text-sm font-bold leading-tight">Project Builder</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Bundle &amp; List for Companies</p>
                                    </div>
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Package className="w-5 h-5 text-white" />
                                    </div>
                                </Link>
                            </div>
                        </section>

                        {/* Audit Trail */}
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-purple-600" />
                                Audit Trail (SHA-256)
                            </h2>
                            {auditLogs.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {auditLogs.map((log) => (
                                        <div key={log._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{log.action.replace(/_/g, ' ')}</span>
                                                <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="text-[10px] font-mono text-slate-500 truncate" title={log.txHash}>
                                                🔗 {log.txHash.slice(0, 24)}...{log.txHash.slice(-8)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 text-center py-4">No audit logs yet.</p>
                            )}
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
    color: 'blue' | 'emerald' | 'indigo' | 'amber';
}) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100'
    };

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{value}</h3>
                <p className={`text-[10px] font-bold ${color === 'amber' ? 'text-amber-600' : 'text-slate-400'}`}>{change}</p>
            </div>
        </div>
    );
}
