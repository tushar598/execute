"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Sun, Loader2, ChevronLeft, CheckCircle, AlertCircle, Banknote, Coins
} from 'lucide-react';
import { MARKET_PRICE_PER_TOKEN } from '@/app/lib/constants';

export default function SellSunToken() {
    const router = useRouter();
    const [availableTokens, setAvailableTokens] = useState(0);
    const [tokensToSell, setTokensToSell] = useState(0);
    const [sellerName, setSellerName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSelling, setIsSelling] = useState(false);
    const [error, setError] = useState('');
    const [saleSummary, setSaleSummary] = useState<{
        tokensSold: number;
        pricePerToken: number;
        totalValue: number;
        auditHash: string;
    } | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/solar/profile');
                if (!res.ok) { router.push('/login'); return; }
                const data = await res.json();
                if (!data.profile?.hasdone_process) { router.push('/solar/seller/onboarding'); return; }
                const avail = data.sunToken?.tokensAvailable || 0;
                setAvailableTokens(avail);
                setTokensToSell(avail);
                setSellerName(data.user?.username || 'Seller');
            } catch { }
            setIsLoading(false);
        };
        load();
    }, [router]);

    const handleSell = async () => {
        if (tokensToSell <= 0) return;
        setIsSelling(true); setError(''); setSaleSummary(null);
        try {
            const res = await fetch('/api/solar/list-tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tokensToSell }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to list tokens');
            setSaleSummary({ tokensSold: data.tokensSold, pricePerToken: data.pricePerToken, totalValue: data.totalValue, auditHash: data.auditHash });
            setAvailableTokens(prev => prev - data.tokensSold);
            setTokensToSell(0);
        } catch (err: any) { setError(err.message); }
        finally { setIsSelling(false); }
    };

    const estimatedValue = tokensToSell * MARKET_PRICE_PER_TOKEN;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-300 flex items-center justify-center shadow-xl shadow-amber-200/30">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                    <div className="absolute -inset-3 rounded-3xl bg-amber-200/20 blur-xl animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900">

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-amber-100/60 shadow-[0_1px_3px_rgba(251,191,36,0.06)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
                    <Link href="/solar/seller/dashboard" className="p-2 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-600 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-300 to-orange-400 rounded-xl flex items-center justify-center shadow-md shadow-amber-200/20">
                        <Banknote className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900">Sun Token Exchange</h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-bold leading-none">Sell Your Tokens</p>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20 relative z-10">
                {/* Hero */}
                <div className="rounded-3xl overflow-hidden relative mb-6 shadow-lg shadow-amber-100/40">
                    <div className="bg-gradient-to-br from-amber-200 via-amber-300 to-orange-200 relative overflow-hidden">
                        <div className="p-6 sm:p-8 relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Coins className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-bold text-amber-700 uppercase tracking-[0.2em]">Sun Token Exchange</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 mb-1">{sellerName || 'Your Tokens'}</h2>
                            <p className="text-amber-800/70 text-sm mb-6 max-w-lg">
                                Choose how many Sun Tokens to list at the current market rate. Buyers purchase them and payment goes to your account.
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white/60 border border-amber-200/50 rounded-xl p-3 sm:p-4">
                                    <p className="text-[9px] sm:text-[10px] text-amber-700/60 font-bold uppercase tracking-[0.15em] mb-1">Available</p>
                                    <p className="text-xl sm:text-2xl font-bold text-slate-800">{availableTokens}</p>
                                </div>
                                <div className="bg-white/60 border border-amber-200/50 rounded-xl p-3 sm:p-4">
                                    <p className="text-[9px] sm:text-[10px] text-amber-700/60 font-bold uppercase tracking-[0.15em] mb-1">Rate</p>
                                    <p className="text-xl sm:text-2xl font-bold text-slate-800">₹{MARKET_PRICE_PER_TOKEN}</p>
                                    <p className="text-[9px] text-amber-600/40 mt-0.5 hidden sm:block">per token</p>
                                </div>
                                <div className="bg-white/70 border border-amber-300/40 rounded-xl p-3 sm:p-4">
                                    <p className="text-[9px] sm:text-[10px] text-amber-700/70 font-bold uppercase tracking-[0.15em] mb-1">Selling</p>
                                    <p className="text-xl sm:text-2xl font-bold text-slate-800">{tokensToSell}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Success */}
                {saleSummary && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-lg shadow-emerald-100/40">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-base font-bold text-emerald-800">Tokens Listed Successfully!</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-white rounded-xl p-3 border border-emerald-100"><p className="text-[9px] text-slate-400 font-bold uppercase">Tokens</p><p className="text-sm font-bold text-amber-600">{saleSummary.tokensSold} ☀️</p></div>
                            <div className="bg-white rounded-xl p-3 border border-emerald-100"><p className="text-[9px] text-slate-400 font-bold uppercase">Rate</p><p className="text-sm font-bold text-slate-900">₹{saleSummary.pricePerToken}/TKN</p></div>
                            <div className="bg-white rounded-xl p-3 border border-emerald-100"><p className="text-[9px] text-slate-400 font-bold uppercase">Total</p><p className="text-sm font-bold text-emerald-700">₹{saleSummary.totalValue.toLocaleString()}</p></div>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-emerald-100">
                            <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Blockchain Audit Hash (SHA-256)</p>
                            <p className="text-xs font-mono text-slate-500 break-all">{saleSummary.auditHash}</p>
                        </div>
                        <p className="text-xs text-emerald-700 font-medium mt-3">Your tokens are now visible in the buyer marketplace.</p>
                    </div>
                )}

                {error && (
                    <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Sell Card */}
                {!saleSummary && (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5 sm:p-6">
                        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-amber-600" /> List Tokens for Sale
                        </h3>
                        <p className="text-xs text-slate-400 mb-5">Choose how many of your {availableTokens} tokens to list at ₹{MARKET_PRICE_PER_TOKEN}/token.</p>

                        {availableTokens > 0 && (
                            <div className="mb-5">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Tokens to sell</label>
                                    <span className="text-sm font-bold text-amber-600">{tokensToSell} / {availableTokens}</span>
                                </div>
                                <input type="range" min={1} max={availableTokens} value={tokensToSell} onChange={e => setTokensToSell(Number(e.target.value))} className="w-full h-2 bg-amber-100 rounded-full appearance-none cursor-pointer accent-amber-500" />
                                <div className="flex justify-between mt-2 gap-2">
                                    {[{ label: `Min (1)`, val: 1 }, { label: `Half (${Math.max(1, Math.floor(availableTokens / 2))})`, val: Math.max(1, Math.floor(availableTokens / 2)) }, { label: `Max (${availableTokens})`, val: availableTokens }].map(btn => (
                                        <button key={btn.label} onClick={() => setTokensToSell(btn.val)} className="text-[10px] font-bold text-slate-500 hover:text-amber-700 px-2 py-1 rounded bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 transition-all">{btn.label}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-50/80 rounded-xl p-4 mb-5 border border-slate-100">
                            <div className="flex justify-between items-center mb-2"><span className="text-xs text-slate-500">Tokens to list</span><span className="text-xs font-bold text-slate-900">{tokensToSell} TKN</span></div>
                            <div className="flex justify-between items-center mb-2"><span className="text-xs text-slate-500">Market price</span><span className="text-xs font-bold text-slate-900">₹{MARKET_PRICE_PER_TOKEN}/TKN</span></div>
                            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-700">Potential payout</span>
                                <span className="text-lg font-bold text-amber-600">₹{estimatedValue.toLocaleString()}</span>
                            </div>
                        </div>

                        <button onClick={handleSell} disabled={isSelling || tokensToSell <= 0} className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-400/25 text-sm">
                            {isSelling ? (<><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>) : availableTokens <= 0 ? (<><Sun className="w-4 h-4" /> No Tokens Available</>) : (<><Coins className="w-4 h-4" /> List {tokensToSell} Tokens for ₹{estimatedValue.toLocaleString()}</>)}
                        </button>

                        {availableTokens <= 0 && (
                            <p className="text-xs text-center text-slate-400 mt-3">Generate tokens first. <Link href="/solar/seller/get-token" className="text-amber-600 font-bold hover:underline">Generate now →</Link></p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
