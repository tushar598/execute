"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Sun, Loader2, ChevronLeft, CheckCircle, AlertCircle, Banknote, Coins
} from 'lucide-react';

const MARKET_PRICE_PER_TOKEN = 7.5;

export default function SellSunToken() {
    const router = useRouter();
    const [availableTokens, setAvailableTokens] = useState(0);
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
                setAvailableTokens(data.sunToken?.tokensAvailable || 0);
                setSellerName(data.user?.username || 'Seller');
            } catch { }
            setIsLoading(false);
        };
        load();
    }, [router]);

    const handleSell = async () => {
        if (availableTokens <= 0) return;
        setIsSelling(true);
        setError('');
        setSaleSummary(null);
        try {
            const res = await fetch('/api/solar/list-tokens', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to list tokens');
            setSaleSummary({
                tokensSold: data.tokensSold,
                pricePerToken: data.pricePerToken,
                totalValue: data.totalValue,
                auditHash: data.auditHash,
            });
            setAvailableTokens(0);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSelling(false);
        }
    };

    const estimatedValue = availableTokens * MARKET_PRICE_PER_TOKEN;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 fixed top-0 w-full z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
                    <Link href="/solar/seller/dashboard" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="w-8 h-8 bg-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/25">
                        <Banknote className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900">Sun Token Exchange</h1>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold leading-none">Sell Your Tokens</p>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">
                {/* Hero */}
                <div className="bg-gradient-to-br from-orange-700 via-orange-800 to-red-900 rounded-2xl p-6 sm:p-8 mb-6 text-white relative overflow-hidden shadow-lg shadow-orange-900/15">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Coins className="w-4 h-4 text-orange-300" />
                            <span className="text-xs font-bold text-orange-300 uppercase tracking-widest">Sun Token Exchange</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">{sellerName || 'Your Tokens'}</h2>
                        <p className="text-orange-200/70 text-sm mb-6 max-w-lg">
                            List all your Sun Tokens at the current market rate. Buyers purchase them and payment goes to your account.
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white/10 border border-white/10 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                                <p className="text-[9px] sm:text-[10px] text-orange-300 font-bold uppercase tracking-widest mb-1">Available</p>
                                <p className="text-xl sm:text-2xl font-bold">{availableTokens}</p>
                            </div>
                            <div className="bg-white/10 border border-white/10 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                                <p className="text-[9px] sm:text-[10px] text-orange-300 font-bold uppercase tracking-widest mb-1">Rate</p>
                                <p className="text-xl sm:text-2xl font-bold">₹{MARKET_PRICE_PER_TOKEN}</p>
                                <p className="text-[9px] text-orange-200/60 mt-0.5 hidden sm:block">per token</p>
                            </div>
                            <div className="bg-orange-500/20 border border-orange-400/20 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                                <p className="text-[9px] sm:text-[10px] text-orange-200 font-bold uppercase tracking-widest mb-1">Est. Value</p>
                                <p className="text-xl sm:text-2xl font-bold">₹{estimatedValue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Success */}
                {saleSummary && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 sm:p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <h2 className="text-base font-bold text-emerald-900">Tokens Listed Successfully!</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-white rounded-xl p-3">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Tokens</p>
                                <p className="text-sm font-bold text-amber-600">{saleSummary.tokensSold} ☀️</p>
                            </div>
                            <div className="bg-white rounded-xl p-3">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Rate</p>
                                <p className="text-sm font-bold text-slate-900">₹{saleSummary.pricePerToken}/TKN</p>
                            </div>
                            <div className="bg-white rounded-xl p-3">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Total</p>
                                <p className="text-sm font-bold text-emerald-700">₹{saleSummary.totalValue.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-emerald-100">
                            <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Blockchain Audit Hash (SHA-256)</p>
                            <p className="text-xs font-mono text-slate-500 break-all">{saleSummary.auditHash}</p>
                        </div>
                        <p className="text-xs text-emerald-700 font-medium mt-3">Your tokens are now visible in the buyer marketplace. Payment will be added to your balance when purchased.</p>
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
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-orange-600" />
                            List All Tokens
                        </h3>
                        <p className="text-xs text-slate-400 mb-5">
                            All {availableTokens} tokens will be listed at ₹{MARKET_PRICE_PER_TOKEN}/token. Sun Tokens must be sold as a complete batch.
                        </p>

                        {/* Pricing */}
                        <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-500">Tokens to list</span>
                                <span className="text-xs font-bold text-slate-900">{availableTokens} TKN</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-500">Market price</span>
                                <span className="text-xs font-bold text-slate-900">₹{MARKET_PRICE_PER_TOKEN}/TKN</span>
                            </div>
                            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-700">Potential payout</span>
                                <span className="text-lg font-bold text-orange-600">₹{estimatedValue.toLocaleString()}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSell}
                            disabled={isSelling || availableTokens <= 0}
                            className="w-full py-3.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-500/20 text-sm"
                        >
                            {isSelling ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                            ) : availableTokens <= 0 ? (
                                <><Sun className="w-4 h-4" /> No Tokens Available</>
                            ) : (
                                <><Coins className="w-4 h-4" /> List {availableTokens} Tokens for ₹{estimatedValue.toLocaleString()}</>
                            )}
                        </button>

                        {availableTokens <= 0 && (
                            <p className="text-xs text-center text-slate-400 mt-3">
                                Generate tokens first from your solar energy.{' '}
                                <Link href="/solar/seller/get-token" className="text-amber-600 font-bold hover:underline">Generate now →</Link>
                            </p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
