"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Leaf, Shield, TrendingUp, ChevronLeft,
    Loader2, CheckCircle2, AlertCircle, Sprout
} from 'lucide-react';
import Link from 'next/link';

interface FarmerProfile {
    landarea: number;
    practices: string[];
    soil_type: string;
    current_crop: string[];
    hasdone_process: boolean;
    entry_status: string;
}

export default function GetCarbonCredit() {
    const router = useRouter();
    const [profile, setProfile] = useState<FarmerProfile | null>(null);
    const [credits, setCredits] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isApplying, setIsApplying] = useState(false);
    const [applyStatus, setApplyStatus] = useState<'idle' | 'applied' | 'calculating' | 'done'>('idle');
    const [creditsAwarded, setCreditsAwarded] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/users/getprofile');
                if (!res.ok) { router.push('/login'); return; }
                const data = await res.json();
                if (!data.profile) { router.push('/user/onboarding'); return; }
                setProfile(data.profile);
                setCredits(data.credits || 0);
            } catch (e) {
                console.error('Failed to load profile', e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [router]);

    const handleApplyVerification = async () => {
        setError('');
        setApplyStatus('applied');
        setIsApplying(true);

        setTimeout(async () => {
            setApplyStatus('calculating');
            try {
                const res = await fetch('/api/ai/individual_credits', { method: 'POST' });
                const data = await res.json();
                if (res.ok) {
                    setCreditsAwarded(data.creditsAwarded || 0);
                    setApplyStatus('done');
                    setTimeout(() => router.push('/user/dashboard'), 3000);
                } else {
                    setError(data.error || 'Verification failed. Please try again.');
                    setApplyStatus('idle');
                    setIsApplying(false);
                }
            } catch {
                setError('Network error. Please try again.');
                setApplyStatus('idle');
                setIsApplying(false);
            }
        }, 12000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    </div>
                    <div className="text-center">
                        <p className="text-slate-800 font-semibold">Loading Farm Data</p>
                        <p className="text-slate-400 text-sm mt-0.5">Preparing your verification portal…</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile?.hasdone_process) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Profile Incomplete</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Please complete your farmer profile onboarding before applying for carbon credits.
                    </p>
                    <Link
                        href="/user/onboarding"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-500 transition-all shadow-lg shadow-teal-500/20 text-sm"
                    >
                        Complete Onboarding
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 fixed top-0 w-full z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/user/dashboard" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/25">
                            <Leaf className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-900">Carbon Credit Verification</h1>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold leading-none">Individual Farmer</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5">
                        <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-700">{credits} credits</span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">

                {/* Error Banner */}
                {error && (
                    <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Hero Banner */}
                <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 mb-6 text-white relative overflow-hidden shadow-lg shadow-emerald-900/15">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-4 h-4 text-emerald-300" />
                                <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Verification Portal</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Verification Readiness</h2>
                            <p className="text-emerald-200/70 text-sm mb-5 leading-relaxed max-w-lg">
                                Your farm data will be submitted for AI-powered verification. Credits are calculated based on land area, practices, soil type, and crops.
                            </p>
                            <div className="flex gap-3 flex-wrap">
                                <div className="bg-white/10 border border-white/10 rounded-xl p-3 sm:p-4 backdrop-blur-sm min-w-[120px]">
                                    <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-widest mb-1">Land Area</p>
                                    <p className="text-xl sm:text-2xl font-bold">{profile?.landarea?.toFixed(1)} <span className="text-sm text-emerald-200/60">acres</span></p>
                                </div>
                                <div className="bg-white/10 border border-white/10 rounded-xl p-3 sm:p-4 backdrop-blur-sm min-w-[120px]">
                                    <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-widest mb-1">Current Credits</p>
                                    <p className="text-xl sm:text-2xl font-bold">{credits} <span className="text-sm text-emerald-200/60">CRD</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-center text-center">
                            {applyStatus === 'idle' && (
                                <>
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                                        <Shield className="w-6 h-6 text-emerald-300" />
                                    </div>
                                    <h3 className="font-bold mb-1 text-sm">Ready for Audit</h3>
                                    <p className="text-xs text-emerald-100/60 mb-4">Submit your farm data for verification.</p>
                                    <button
                                        onClick={handleApplyVerification}
                                        className="w-full py-3 bg-white text-emerald-900 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg shadow-white/10 text-sm"
                                    >
                                        Apply for Verification
                                    </button>
                                </>
                            )}
                            {applyStatus === 'applied' && (
                                <>
                                    <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-3" />
                                    <h3 className="font-bold text-amber-400 mb-1 text-sm">Verification Applied</h3>
                                    <p className="text-xs text-emerald-100/60 mb-1">Awaiting department review...</p>
                                    <p className="text-[10px] text-emerald-200/50 font-mono mt-2">Expected wait: ~12s</p>
                                </>
                            )}
                            {applyStatus === 'calculating' && (
                                <>
                                    <TrendingUp className="w-10 h-10 text-blue-400 mx-auto mb-3 animate-pulse" />
                                    <h3 className="font-bold text-blue-400 mb-1 text-sm">Calculating Yield</h3>
                                    <p className="text-xs text-emerald-100/60 mb-1">AI model generating credits...</p>
                                    <p className="text-[10px] text-emerald-200/50 font-mono mt-2">Redirecting shortly.</p>
                                </>
                            )}
                            {applyStatus === 'done' && (
                                <>
                                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                                    <h3 className="font-bold text-emerald-300 mb-1 text-sm">Credits Awarded!</h3>
                                    <p className="text-2xl font-bold text-white mt-1">+{creditsAwarded} CRD</p>
                                    <p className="text-xs text-emerald-200/50 mt-2">Redirecting to dashboard...</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Farm Details */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                            <Sprout className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">Your Farm Summary</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Land Area</p>
                            <p className="text-base font-bold text-slate-900">{profile?.landarea} acres</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Soil Type</p>
                            <p className="text-base font-bold text-slate-900 capitalize">{profile?.soil_type || '—'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2">Farming Practices</p>
                            <div className="flex flex-wrap gap-1.5">
                                {profile?.practices?.length ? profile.practices.map(p => (
                                    <span key={p} className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-100">{p}</span>
                                )) : <span className="text-xs text-slate-400 italic">None</span>}
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2">Current Crops</p>
                            <div className="flex flex-wrap gap-1.5">
                                {profile?.current_crop?.length ? profile.current_crop.map(c => (
                                    <span key={c} className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-100">{c}</span>
                                )) : <span className="text-xs text-slate-400 italic">None</span>}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-emerald-900 mb-0.5">Profile Verified</p>
                            <p className="text-xs text-emerald-700">Your farm profile is complete. Apply for verification to receive carbon credits.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
