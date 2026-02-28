"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Shield, ArrowRight, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AggregatorOnboarding() {
    const containerRef = useRef(null);
    const router = useRouter();
    const [dealerId, setDealerId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useGSAP(() => {
        gsap.from('.onboarding-card', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
            delay: 0.2
        });

        gsap.from('.header-text', {
            y: -20,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        });

        gsap.from('.bg-image', {
            scale: 1.1,
            opacity: 0,
            duration: 1.5,
            ease: 'power2.out'
        });
    }, { scope: containerRef });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dealerId.trim()) {
            setError('Dealer ID is required');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/aggregator/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ DealerId: dealerId })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/aggregator/dashboard');
                }, 2000);
            } else {
                setError(data.error || 'Failed to complete onboarding');
            }
        } catch (err: any) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome, Aggregator!</h2>
                    <p className="text-slate-500 mb-4">Your profile has been created successfully. Redirecting to your dashboard...</p>
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-white">
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1473341304170-98f5cb66a998?q=80&w=2070&auto=format&fit=crop"
                    alt="Industrial Growth Background"
                    className="bg-image w-full h-full object-cover opacity-10"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/100 backdrop-blur-[2px]"></div>
            </div>

            <div className="relative z-10 max-w-lg w-full">
                <Link href="/selectrole" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors w-fit mb-8 header-text">
                    <ArrowLeft className="w-5 h-5" />
                    Back to Role Selection
                </Link>

                <div className="text-center mb-10 header-text">
                    <div className="inline-flex p-3 bg-blue-50 rounded-2xl mb-4">
                        <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Aggregator Onboarding</h1>
                    <p className="text-slate-500">
                        Enter your Dealer ID to verify your status and start managing carbon deals.
                    </p>
                </div>

                <div className="onboarding-card bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-slate-200 shadow-2xl shadow-slate-200/50">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="dealerId" className="block text-sm font-semibold text-slate-700 mb-2">
                                Dealer ID
                            </label>
                            <input
                                id="dealerId"
                                type="text"
                                value={dealerId}
                                onChange={(e) => setDealerId(e.target.value)}
                                placeholder="e.g. AGG-123456"
                                className={`w-full px-4 py-3.5 rounded-xl border-2 text-base font-medium transition-all outline-none ${error
                                        ? 'border-red-200 focus:border-red-500 bg-red-50/50'
                                        : 'border-slate-100 focus:border-blue-500 bg-slate-50/50'
                                    }`}
                                disabled={isSubmitting}
                            />
                            {error && (
                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 px-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                            {isSubmitting ? 'Processing...' : 'Complete Onboarding'}
                            {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-400">
                            By clicking the button above, you agree to our terms of service for aggregators.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
