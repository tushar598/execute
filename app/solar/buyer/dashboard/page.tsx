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
                if (auditRes.ok) { const ad = await auditRes.json(); setAuditLogs(ad.logs || []); }
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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-5">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-300 flex items-center justify-center shadow-xl shadow-amber-200/30">
                            <Sun className="w-7 h-7 text-white animate-pulse" />
                        </div>
                        <div className="absolute -inset-4 rounded-3xl bg-amber-200/20 blur-2xl animate-pulse" />
                    </div>
                    <p className="text-slate-800 font-bold text-lg tracking-tight">Loading Buyer Dashboard</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-amber-400/20">

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-amber-100/60 shadow-[0_1px_3px_rgba(251,191,36,0.06)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-amber-300 to-orange-400 rounded-xl flex items-center justify-center shadow-md shadow-amber-200/20">
                            <Sun className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">Buyer Dashboard</p>
                            <p className="hidden sm:block text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em] leading-none mt-0.5">Sun Token</p>
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center gap-1 bg-amber-50/60 border border-amber-100 rounded-xl p-1">
                        <Link href="/solar/buyer/dashboard" className="px-4 py-2 text-sm font-bold text-amber-700 bg-white rounded-lg shadow-sm border border-amber-200/60">Dashboard</Link>
                        <Link href="/solar/buyer/marketplace" className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-amber-700 hover:bg-white/60 rounded-lg transition-all">Marketplace</Link>
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
                        <Link href="/solar/buyer/dashboard" className="block px-4 py-3 text-sm font-bold text-amber-700 bg-amber-50 rounded-xl border border-amber-200/60">Dashboard</Link>
                        <Link href="/solar/buyer/marketplace" className="block px-4 py-3 text-sm font-medium text-slate-600 hover:bg-amber-50/50 rounded-xl transition-colors">Marketplace</Link>
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
                    <div className="relative bg-gradient-to-br from-amber-200 via-amber-300 to-orange-200 overflow-hidden">
                        <div className="px-6 sm:px-8 pt-8 pb-12 relative z-10">
                            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/50 border border-amber-300/40">
                                <Wallet className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em]">Sun Token Wallet</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800">Solar Energy Buyer</h2>
                            <p className="text-amber-800/70 text-sm mt-2">Track your Sun Token purchases and marketplace activity.</p>
                        </div>
                    </div>
                    <div className="bg-white px-4 sm:px-6 pb-5 -mt-5 relative z-20">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 -translate-y-4">
                            <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 sm:p-5 shadow-md shadow-amber-100/40 hover:shadow-lg transition-all">
                                <div className="w-9 h-9 rounded-xl bg-amber-100/80 border border-amber-200 flex items-center justify-center mb-3"><Coins className="w-4 h-4 text-amber-600" /></div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">Tokens Purchased</p>
                                <p className="text-2xl font-bold text-amber-700 tracking-tight">{totalTokensBought}</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-md shadow-slate-100/40 hover:shadow-lg transition-all">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-3"><IndianRupee className="w-4 h-4 text-slate-500" /></div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">Total Spent</p>
                                <p className="text-2xl font-bold text-slate-800 tracking-tight">₹{totalSpent.toLocaleString()}</p>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-md shadow-slate-100/40 hover:shadow-lg transition-all">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center mb-3"><Activity className="w-4 h-4 text-orange-500" /></div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">Transactions</p>
                                <p className="text-2xl font-bold text-slate-800 tracking-tight">{transactions.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-6">
                        {/* Transaction History */}
                        <section className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100/80 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center">
                                    <Activity className="w-4 h-4 text-amber-600" />
                                </div>
                                <h2 className="text-base font-bold text-slate-900">Purchase History</h2>
                            </div>
                            {transactions.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {transactions.map(tx => (
                                        <div key={tx._id} className="px-6 py-5 flex items-center justify-between hover:bg-amber-50/30 transition-colors group">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{tx.tokenAmount} Sun Tokens</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleString()}</p>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                    <p className="text-[10px] font-mono text-slate-300 bg-slate-50 border border-slate-100 px-1.5 rounded truncate max-w-[100px]">{tx._id}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-amber-500">₹{tx.totalAmount.toLocaleString()}</p>
                                                <span className={`inline-flex text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border mt-1.5 ${tx.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{tx.status.replace(/_/g, ' ')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-6 py-16 text-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                                        <Activity className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-sm text-slate-600 font-bold">No purchases yet</p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-[220px] mx-auto">Visit the marketplace to buy Sun Tokens.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="lg:col-span-4 space-y-6">
                        {/* Marketplace CTA */}
                        <section className="rounded-3xl overflow-hidden border border-amber-200/50 bg-gradient-to-b from-amber-50/80 to-white shadow-lg shadow-amber-100/30 p-6 relative">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-100/30 rounded-full blur-3xl -z-0" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className="w-8 h-8 rounded-xl bg-amber-100/80 border border-amber-200 flex items-center justify-center">
                                        <ShoppingCart className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <h2 className="text-sm font-bold text-slate-900">Sun Token Marketplace</h2>
                                </div>
                                <p className="text-xs text-slate-500 mb-5 leading-relaxed">Browse available solar energy tokens from sellers near you.</p>
                                <Link href="/solar/buyer/marketplace" className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-2xl transition-all group shadow-lg shadow-amber-400/25">
                                    <div>
                                        <p className="text-sm font-bold leading-tight">Enter Marketplace</p>
                                        <p className="text-[10px] text-amber-100/70 uppercase tracking-[0.15em] font-bold mt-1">Buy Tokens</p>
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
                                    <h2 className="text-sm font-bold text-slate-900">Audit Trail</h2>
                                    <p className="text-[10px] text-slate-400">Hash Records</p>
                                </div>
                                <span className="bg-slate-50 border border-slate-100 px-2 py-1 rounded text-[9px] font-bold text-slate-400 uppercase tracking-wider">SHA-256</span>
                            </div>
                            {auditLogs.length > 0 ? (
                                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                                    {auditLogs.map(log => (
                                        <div key={log._id} className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 hover:border-violet-200/60 hover:bg-violet-50/30 transition-colors group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.1em] bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200/60">{log.action.replace(/_/g, ' ')}</span>
                                                <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-[10px] font-mono text-slate-400 truncate group-hover:text-slate-500 transition-colors">🔗 {log.txHash.slice(0, 20)}…{log.txHash.slice(-6)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    <div className="w-12 h-12 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                        <Lock className="w-5 h-5 text-slate-300" />
                                    </div>
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
