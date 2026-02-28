"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    TrendingUp, Loader2, Globe, Leaf, ChevronLeft,
    CheckCircle2, AlertCircle, BadgeIndianRupee, Banknote
} from 'lucide-react';
import Link from 'next/link';

const MARKET_PRICE_PER_CREDIT = 350; // ₹ — must match constants.ts

interface SaleSummary {
    creditsSold: number;
    pricePerCredit: number;
    totalValue: number;
    auditHash: string;
}

export default function FarmerMarketplace() {
    const router = useRouter();
    const [availableCredits, setAvailableCredits] = useState(0);
    const [sellAmount, setSellAmount] = useState<number>(0);
    const [farmerName, setFarmerName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSelling, setIsSelling] = useState(false);
    const [saleSummary, setSaleSummary] = useState<SaleSummary | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/users/getprofile');
                if (!res.ok) { router.push('/login'); return; }
                const data = await res.json();
                setAvailableCredits(data.credits || 0);
                setSellAmount(data.credits || 0);
                setFarmerName(data.profile?.userId?.username || 'Farmer');
            } catch (e) {
                console.error('Failed to load farmer data', e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [router]);

    const handleSell = async () => {
        if (availableCredits <= 0) return;
        setIsSelling(true);
        setError('');
        setSaleSummary(null);

        try {
            const res = await fetch('/api/users/list_on_market', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credits_to_sell: sellAmount })
            });
            const data = await res.json();
            if (res.ok) {
                setSaleSummary({
                    creditsSold: data.creditsSold,
                    pricePerCredit: data.pricePerCredit,
                    totalValue: data.totalValue,
                    auditHash: data.auditHash,
                });
                setAvailableCredits(prev => prev - sellAmount);
            } else {
                setError(data.error || 'Failed to list credits.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsSelling(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    </div>
                    <div className="text-center">
                        <p className="text-slate-800 font-semibold">Loading Carbon Exchange</p>
                        <p className="text-slate-400 text-sm mt-0.5">Fetching your credit data…</p>
                    </div>
                </div>
            </div>
        );
    }

    const estimatedValue = sellAmount * MARKET_PRICE_PER_CREDIT;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 fixed top-0 w-full z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
                    <Link href="/user/dashboard" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/25">
                        <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900">Carbon Exchange</h1>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold leading-none">Sell Your Credits</p>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">

                {/* Hero Banner */}
                <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-900 rounded-2xl p-6 sm:p-8 mb-6 text-white relative overflow-hidden shadow-lg shadow-emerald-900/15">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Leaf className="w-4 h-4 text-emerald-300" />
                            <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Carbon Exchange</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">{farmerName || 'Your Credits'}</h2>
                        <p className="text-emerald-200/70 text-sm mb-6 max-w-lg">
                            List your verified carbon credits at the current market rate. Companies purchase them and payment goes to your account.
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white/10 border border-white/10 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                                <p className="text-[9px] sm:text-[10px] text-emerald-300 font-bold uppercase tracking-widest mb-1">Available</p>
                                <p className="text-xl sm:text-2xl font-bold">{availableCredits.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/10 border border-white/10 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                                <p className="text-[9px] sm:text-[10px] text-emerald-300 font-bold uppercase tracking-widest mb-1">Rate</p>
                                <p className="text-xl sm:text-2xl font-bold">₹{MARKET_PRICE_PER_CREDIT}</p>
                                <p className="text-[9px] text-emerald-200/60 mt-0.5 hidden sm:block">per credit</p>
                            </div>
                            <div className="bg-emerald-500/20 border border-emerald-400/20 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                                <p className="text-[9px] sm:text-[10px] text-emerald-200 font-bold uppercase tracking-widest mb-1">Est. Value</p>
                                <p className="text-xl sm:text-2xl font-bold">₹{estimatedValue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Success Summary */}
                {saleSummary && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 sm:p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <h2 className="text-base font-bold text-emerald-900">Credits Listed Successfully!</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-white rounded-xl p-3">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Credits</p>
                                <p className="text-sm font-bold text-emerald-600">{saleSummary.creditsSold.toLocaleString()} CRD</p>
                            </div>
                            <div className="bg-white rounded-xl p-3">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Rate</p>
                                <p className="text-sm font-bold text-slate-900">₹{saleSummary.pricePerCredit}/CRD</p>
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
                        <p className="text-xs text-emerald-700 font-medium mt-3">Your credits are now visible in the company marketplace. Payment will be added to your balance when purchased.</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Sell Form */}
                {!saleSummary && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-emerald-600" />
                            List Credits at Market Price
                        </h3>
                        <p className="text-xs text-slate-400 mb-5">
                            Choose how many credits to list out of your {availableCredits.toLocaleString()} available at ₹{MARKET_PRICE_PER_CREDIT}/CRD.
                        </p>

                        <div className="mb-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount to List</label>
                                <span className="font-bold text-emerald-600 text-sm">{sellAmount.toLocaleString()} CRD</span>
                            </div>
                            <input
                                type="range"
                                min={availableCredits > 0 ? 1 : 0}
                                max={availableCredits}
                                value={sellAmount}
                                onChange={(e) => setSellAmount(Number(e.target.value))}
                                className="w-full accent-emerald-500 mt-2 cursor-pointer"
                                disabled={availableCredits <= 0}
                            />
                            <div className="flex justify-between mt-1 text-[10px] font-medium text-slate-400">
                                <span>1</span>
                                <span>{availableCredits.toLocaleString()} Max</span>
                            </div>
                        </div>

                        {/* Pricing breakdown */}
                        <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-500">Credits to list</span>
                                <span className="text-xs font-bold text-slate-900">{sellAmount.toLocaleString()} CRD</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-500">Market price</span>
                                <span className="text-xs font-bold text-slate-900">₹{MARKET_PRICE_PER_CREDIT}/CRD</span>
                            </div>
                            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-700">Potential payout</span>
                                <span className="text-lg font-bold text-emerald-600">₹{estimatedValue.toLocaleString()}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSell}
                            disabled={isSelling || availableCredits <= 0 || sellAmount <= 0}
                            className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20 text-sm"
                        >
                            {isSelling ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                            ) : availableCredits <= 0 ? (
                                <><Leaf className="w-4 h-4" /> No Credits Available</>
                            ) : (
                                <><BadgeIndianRupee className="w-4 h-4" /> List {sellAmount.toLocaleString()} Credits for ₹{estimatedValue.toLocaleString()}</>
                            )}
                        </button>

                        {availableCredits <= 0 && (
                            <p className="text-xs text-center text-slate-400 mt-3">
                                Apply for verification first to earn credits.{' '}
                                <Link href="/user/getcarboncredit" className="text-emerald-600 font-bold hover:underline">Apply now →</Link>
                            </p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
