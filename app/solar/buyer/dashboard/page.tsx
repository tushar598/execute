"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Sun, ShoppingCart, LogOut, Loader2, Menu, X, Activity,
    Lock, ArrowUpRight, Wallet, IndianRupee, Coins
} from 'lucide-react';

interface Transaction {
    _id: string;
    tokenAmount: number;
    pricePerToken: number;
    totalAmount: number;
    status: string;
    txHash: string;
    createdAt: string;
    sellerName?: string;
}

interface AuditEntry {
    _id: string;
    action: string;
    txHash: string;
    timestamp: string;
}

export default function SolarBuyerDashboard() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
    const [totalTokensBought, setTotalTokensBought] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const profileRes = await fetch('/api/solar/profile');
                if (!profileRes.ok) { router.push('/login'); return; }
                const profileData = await profileRes.json();
                if (!profileData.profile?.hasdone_process) { router.push('/solar/buyer/onboarding'); return; }

                const txs: Transaction[] = profileData.transactions || [];
                setTransactions(txs);
                setTotalTokensBought(txs.reduce((a: number, t: Transaction) => a + (t.tokenAmount || 0), 0));
                setTotalSpent(txs.reduce((a: number, t: Transaction) => a + (t.totalAmount || 0), 0));

                const auditRes = await fetch('/api/auditlogs?limit=10');
                if (auditRes.ok) {
                    const ad = await auditRes.json();
                    setAuditLogs(ad.logs || []);
                }
            } catch (err) { console.error(err); } finally { setIsLoading(false); }
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
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    </div>
                    <p className="text-slate-800 font-semibold">Loading Buyer Dashboard</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/25">
                            <Sun className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight">Buyer Dashboard</p>
                            <p className="hidden sm:block text-[10px] text-slate-400 font-semibold uppercase tracking-widest leading-none">Sun Token</p>
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center gap-1">
                        <Link href="/solar/buyer/dashboard" className="px-4 py-2 text-sm font-semibold text-orange-700 bg-orange-50 rounded-lg border border-orange-100">Dashboard</Link>
                        <Link href="/solar/buyer/marketplace" className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all">Marketplace</Link>
                    </nav>
                    <div className="hidden md:flex items-center gap-2">
                        <div className="w-px h-5 bg-slate-200 mx-1" />
                        <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 shadow-lg">
                        <Link href="/solar/buyer/dashboard" className="block px-4 py-2.5 text-sm font-semibold text-orange-700 bg-orange-50 rounded-lg">Dashboard</Link>
                        <Link href="/solar/buyer/marketplace" className="block px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg">Marketplace</Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg"><LogOut className="w-4 h-4" /> Sign Out</button>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20 space-y-6">
                {/* Hero Banner */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <div className="relative bg-gradient-to-br from-orange-600 via-amber-600 to-amber-700 px-6 sm:px-8 pt-6 pb-10 overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Wallet className="w-4 h-4 text-orange-200" />
                                <span className="text-xs font-bold text-orange-200 uppercase tracking-widest">Sun Token Wallet</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Solar Energy Buyer</h2>
                            <p className="text-orange-100/80 text-sm mt-1">Track your Sun Token purchases and marketplace activity.</p>
                        </div>
                    </div>
                    <div className="bg-white px-4 sm:px-6 pb-4 -mt-5">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 -translate-y-4">
                            <div className="bg-orange-50 border border-orange-100 shadow-sm rounded-2xl p-4">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3 bg-orange-100 text-orange-600"><Coins className="w-4 h-4" /></div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Tokens Purchased</p>
                                <p className="text-xl font-bold text-orange-900">{totalTokensBought}</p>
                            </div>
                            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3 bg-slate-100 text-slate-500"><IndianRupee className="w-4 h-4" /></div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Spent</p>
                                <p className="text-xl font-bold text-slate-800">₹{totalSpent.toLocaleString()}</p>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 shadow-sm rounded-2xl p-4">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3 bg-amber-100 text-amber-600"><Activity className="w-4 h-4" /></div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Transactions</p>
                                <p className="text-xl font-bold text-amber-900">{transactions.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-6">
                        {/* Transaction History */}
                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                    <Activity className="w-3.5 h-3.5 text-indigo-500" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-800">Purchase History</h2>
                            </div>
                            {transactions.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {transactions.map(tx => (
                                        <div key={tx._id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{tx.tokenAmount} Sun Tokens</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{new Date(tx.createdAt).toLocaleString()}</p>
                                                <p className="text-[10px] font-mono text-slate-300 mt-0.5">{tx._id}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-teal-600">₹{tx.totalAmount.toLocaleString()}</p>
                                                <span className="inline-flex text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">{tx.status.replace(/_/g, ' ')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-6 py-14 text-center">
                                    <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500 font-medium">No purchases yet</p>
                                    <p className="text-xs text-slate-400 mt-1">Visit the marketplace to buy Sun Tokens.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="lg:col-span-4 space-y-6">
                        {/* Marketplace CTA */}
                        <section className="rounded-2xl overflow-hidden border border-orange-200 bg-gradient-to-br from-orange-600 to-amber-600 relative shadow-lg shadow-orange-900/10">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
                            <div className="relative z-10 p-6">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                                        <ShoppingCart className="w-4 h-4 text-orange-100" />
                                    </div>
                                    <h2 className="text-sm font-bold text-white">Sun Token Marketplace</h2>
                                </div>
                                <p className="text-xs text-orange-100/80 mb-5 leading-relaxed">Browse available solar energy tokens from sellers near you.</p>
                                <Link href="/solar/buyer/marketplace" className="w-full flex items-center justify-between p-4 bg-orange-500 hover:bg-orange-400 rounded-xl transition-all group shadow-md shadow-orange-900/20">
                                    <div>
                                        <p className="text-sm font-bold text-white leading-tight">Enter Marketplace</p>
                                        <p className="text-[10px] text-orange-100 uppercase tracking-widest font-bold mt-0.5">Buy Tokens</p>
                                    </div>
                                    <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-white/25 transition-all">
                                        <ArrowUpRight className="w-4 h-4 text-white" />
                                    </div>
                                </Link>
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
                                    {auditLogs.map(log => (
                                        <div key={log._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{log.action.replace(/_/g, ' ')}</span>
                                                <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-[10px] font-mono text-slate-400 truncate">🔗 {log.txHash.slice(0, 20)}…{log.txHash.slice(-6)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <Lock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-xs text-slate-400">No audit logs yet.</p>
                                </div>
                            )}
                        </section>
                    </aside>
                </div>
            </main>
        </div>
    );
}
