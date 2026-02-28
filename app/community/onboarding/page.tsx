"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, Loader2, ArrowLeft, CheckCircle2, AlertCircle, Building2, MapPin, Users, Leaf } from 'lucide-react';
import Link from 'next/link';

const PRACTICE_OPTIONS = [
    'Cover Cropping', 'No-Till Farming', 'Agroforestry', 'Composting',
    'Crop Rotation', 'Mulching', 'Green Manure', 'Biochar Application',
    'Organic Farming', 'Rotational Grazing',
];

export default function CommunityOnboarding() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        community_name: '',
        community_id: '',
        community_admin_name: '',
        community_district: '',
        community_state: '',
        community_practices: [] as string[],
    });

    const togglePractice = (practice: string) => {
        setForm(prev => {
            const has = prev.community_practices.includes(practice);
            if (has) {
                return { ...prev, community_practices: prev.community_practices.filter(p => p !== practice) };
            } else {
                return { ...prev, community_practices: [...prev.community_practices, practice] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.community_name || !form.community_id || !form.community_admin_name || !form.community_district || !form.community_state) {
            setError('Please fill out all required text fields.');
            return;
        }

        if (form.community_practices.length === 0) {
            setError('Please select at least one community practice.');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/communityadmin/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/community/dashboard');
                }, 2000);
            } else {
                setError(data.error || 'Failed to complete onboarding. Community ID might already exist.');
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
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Community Created!</h2>
                    <p className="text-slate-500 mb-4">You are now the admin. Redirecting to your dashboard...</p>
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center py-12 px-4 overflow-hidden bg-white text-slate-900">
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1596484552835-13cb00cb75d7?q=80&w=2070&auto=format&fit=crop"
                    alt="Community Background"
                    className="w-full h-full object-cover opacity-[0.07]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/100 backdrop-blur-[1px]"></div>
            </div>

            <div className="relative z-10 max-w-2xl w-full">
                <Link href="/selectrole" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors w-fit mb-8">
                    <ArrowLeft className="w-5 h-5" />
                    Back to Role Selection
                </Link>

                <div className="text-center mb-10">
                    <div className="inline-flex p-4 bg-indigo-50 rounded-2xl mb-4">
                        <Users className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Create Community</h1>
                    <p className="text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
                        Register your community to start tracking impact and enabling members to join under your umbrella.
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xl shadow-slate-200/50">
                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-2xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section: Basic Info */}
                        <div className="space-y-5">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="w-4 h-4" /> Basic Information
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Community Name</label>
                                    <input
                                        type="text"
                                        value={form.community_name}
                                        onChange={(e) => setForm({ ...form, community_name: e.target.value })}
                                        placeholder="e.g. Green Valley Farmers"
                                        className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Community ID</label>
                                    <input
                                        type="text"
                                        value={form.community_id}
                                        onChange={(e) => setForm({ ...form, community_id: e.target.value })}
                                        placeholder="Unique Identifier (e.g. GVF-001)"
                                        className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Admin Full Name</label>
                                    <input
                                        type="text"
                                        value={form.community_admin_name}
                                        onChange={(e) => setForm({ ...form, community_admin_name: e.target.value })}
                                        placeholder="Your full name"
                                        className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Section: Location */}
                        <div className="space-y-5">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Location
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">District</label>
                                    <input
                                        type="text"
                                        value={form.community_district}
                                        onChange={(e) => setForm({ ...form, community_district: e.target.value })}
                                        placeholder="e.g. Nashik"
                                        className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">State</label>
                                    <input
                                        type="text"
                                        value={form.community_state}
                                        onChange={(e) => setForm({ ...form, community_state: e.target.value })}
                                        placeholder="e.g. Maharashtra"
                                        className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Section: Practices */}
                        <div className="space-y-5">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Leaf className="w-4 h-4" /> Allowed Practices
                            </h3>
                            <p className="text-sm text-slate-500">Select the sustainable farming practices supported by your community. This helps verify your members.</p>
                            <div className="flex flex-wrap gap-2.5">
                                {PRACTICE_OPTIONS.map(p => {
                                    const isSelected = form.community_practices.includes(p);
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => togglePractice(p)}
                                            className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${isSelected
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed h-[60px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                                    </>
                                ) : (
                                    <>
                                        Create Community Profile <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-center text-slate-400 mt-4 font-medium">
                                By proceeding, you agree to our terms of service for aggregators.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
