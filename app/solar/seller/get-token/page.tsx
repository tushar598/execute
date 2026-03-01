"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Sun, Zap, Battery, ChevronLeft, Loader2, CheckCircle, AlertCircle, Coins
} from 'lucide-react';

export default function GetSunToken() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [currentTokens, setCurrentTokens] = useState(0);

    const [result, setResult] = useState<{
        energyProduced: number;
        energyConsumed: number;
        leftoverEnergy: number;
        newTokens: number;
        totalTokensAvailable: number;
    } | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/solar/profile');
                if (!res.ok) { router.push('/login'); return; }
                const data = await res.json();
                if (!data.profile?.hasdone_process) { router.push('/solar/seller/onboarding'); return; }
                setCurrentTokens(data.sunToken?.tokensAvailable || 0);
            } catch { }
            setIsLoading(false);
        };
        load();
    }, [router]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError('');
        setResult(null);
        try {
            const res = await fetch('/api/solar/get-tokens', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to generate tokens');
            setResult({
                energyProduced: data.energyProduced,
                energyConsumed: data.energyConsumed,
                leftoverEnergy: data.leftoverEnergy,
                newTokens: data.newTokens,
                totalTokensAvailable: data.totalTokensAvailable,
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

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
                    <div className="w-9 h-9 bg-gradient-to-br from-amber-300 to-orange-400 rounded-xl flex items-center justify-center shadow-md shadow-amber-200/20">
                        <Sun className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">Get Sun Token</h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-bold leading-none mt-0.5">Energy → Tokens</p>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20 relative z-10">
                {/* Hero */}
                <div className="rounded-3xl overflow-hidden relative mb-8 shadow-lg shadow-amber-100/40">
                    <div className="relative bg-gradient-to-br from-amber-200 via-amber-300 to-orange-200 overflow-hidden">
                        <div className="p-6 sm:p-8 relative z-10">
                            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/50 border border-amber-300/40">
                                <Coins className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em]">Token Generation</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800 mb-3">Mint Sun Tokens</h2>
                            <p className="text-amber-800/70 text-sm mb-8 max-w-lg leading-relaxed">
                                Your solar panels produce energy. What you don't consume becomes leftover energy, which is converted into Sun Tokens at a rate of 1 kWh per token.
                            </p>
                            <div className="bg-white/60 border border-amber-200/50 rounded-2xl p-4 sm:p-5 inline-flex flex-col">
                                <p className="text-[10px] text-amber-700/60 font-bold uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1.5"><Sun className="w-3 h-3" /> Current Balance</p>
                                <p className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">{currentTokens} <span className="text-amber-500/50 text-lg">TKN</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Result Card */}
                {result && (
                    <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-lg shadow-emerald-100/40 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-3xl -z-0" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-emerald-800">Tokens Minted!</h2>
                                    <p className="text-xs text-emerald-600/70">Successfully converted leftover energy</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                                <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-1.5">Produced</p>
                                    <p className="text-lg font-bold text-amber-600">{result.energyProduced} <span className="text-sm font-medium text-slate-400">kWh</span></p>
                                </div>
                                <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-1.5">Consumed</p>
                                    <p className="text-lg font-bold text-slate-800">{result.energyConsumed} <span className="text-sm font-medium text-slate-400">kWh</span></p>
                                </div>
                                <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-1.5">Leftover</p>
                                    <p className="text-lg font-bold text-emerald-600">{result.leftoverEnergy} <span className="text-sm font-medium text-slate-400">kWh</span></p>
                                </div>
                                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/60 shadow-sm">
                                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-[0.15em] mb-1.5">New Tokens</p>
                                    <p className="text-lg font-bold text-amber-700 flex items-center gap-1.5">{result.newTokens} <Sun className="w-4 h-4 text-amber-500" /></p>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-3 flex items-center justify-between border border-emerald-100">
                                <span className="text-xs text-slate-500 font-medium">Total available tokens</span>
                                <span className="text-sm font-bold text-slate-900">{result.totalTokensAvailable} TKN</span>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Generate Form */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6 sm:p-8 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-50/50 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shadow-sm">
                                <Zap className="w-5 h-5 text-amber-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Read Smart Meter</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-lg">
                            Click below to read your smart meter data and calculate how many Sun Tokens you've earned from leftover solar energy.
                        </p>

                        {/* How it works */}
                        <div className="bg-slate-50/80 rounded-2xl p-5 sm:p-6 mb-8 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-5">How It Works</p>
                            <div className="space-y-4">
                                {[
                                    { n: '1', txt: <><span className="text-slate-900 font-medium">Your solar panels</span> produce energy (kWh)</>, cls: 'bg-slate-100 border-slate-200 text-slate-500' },
                                    { n: '2', txt: <>We subtract what you <span className="text-slate-900 font-medium">consumed for self-use</span></>, cls: 'bg-slate-100 border-slate-200 text-slate-500' },
                                    { n: '3', txt: <>Leftover energy is converted: <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">1 kWh = 1 Sun Token</span></>, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
                                    { n: '4', txt: <>Tokens are added to your balance — <span className="text-emerald-700 font-medium">ready to sell!</span></>, cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                                ].map((step) => (
                                    <div key={step.n} className="flex items-start sm:items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${step.cls}`}>{step.n}</div>
                                        <p className="text-sm text-slate-600">{step.txt}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-400/25 hover:shadow-xl hover:shadow-amber-400/30 text-base"
                        >
                            {isGenerating ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Reading Meter Data…</>
                            ) : (
                                <><Zap className="w-5 h-5" /> Calculate & Mint Tokens</>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
