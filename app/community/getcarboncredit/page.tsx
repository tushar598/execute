"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, Shield, TrendingUp, ChevronLeft, LayoutDashboard,
    Loader2, CheckCircle2, Leaf, AlertCircle, MapPin
} from 'lucide-react';
import Link from 'next/link';

interface UserProfileData {
    _id: string;
    userId: {
        _id: string;
        username: string;
        email: string;
        phone: string;
    };
    hasdone_process: boolean;
    landarea: number;
    practices: string[];
    entry_status: string;
}

export default function GetCarbonCredit() {
    const router = useRouter();
    const [profiles, setProfiles] = useState<UserProfileData[]>([]);
    const [totalLandArea, setTotalLandArea] = useState(0);
    const [communityCredits, setCommunityCredits] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isApplying, setIsApplying] = useState(false);
    const [applyStatus, setApplyStatus] = useState<'idle' | 'applied' | 'calculating'>('idle');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // 1. Verify community admin status
                const authRes = await fetch('/api/communityadmin/getcommunityadmin');
                if (!authRes.ok) {
                    router.push('/login');
                    return;
                }
                const authData = await authRes.json();
                const communityId = authData.adminProfile?.community_id;

                if (!communityId) {
                    router.push('/community/dashboard');
                    return;
                }

                // 2. Fetch profiles and total land area
                const profileRes = await fetch(`/api/community/get_specific_community_members_userprofile?community_id=${communityId}`);
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setProfiles(profileData.profiles);
                    setTotalLandArea(profileData.totalLandArea);
                }

                // 3. Fetch community total credits (optional if already available, but good to have)
                // For now, we will assume 0 if it's the first time
                // A future endpoint could directly fetch `app/models/communitycarboncredits.ts`
                // Because communitycarboncredits might not exist initially, we default to 0.

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching verification data:', error);
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [router]);

    const handleApplyVerification = async () => {
        setApplyStatus('applied');
        setIsApplying(true);

        // Simulate agricultural department verification delay (10-15s)
        setTimeout(async () => {
            setApplyStatus('calculating');

            try {
                // Fetch the admin data to get community_id for the calculation API
                const authRes = await fetch('/api/communityadmin/getcommunityadmin');
                const authData = await authRes.json();
                const cId = authData.adminProfile?.community_id;

                // Prepare data for AI calculation
                // For the AI route we send community_id, and it will fetch members and calculate based on their land/practices.
                // Depending on how `divide_community_crdits` is structured, it might just need the community ID.
                const aiRes = await fetch('/api/ai/divide_community_crdits', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        community_id: cId,
                        total_land_area: totalLandArea,
                        // Could also mass send `profiles` if the AI endpoint expects it directly
                        profiles: profiles.filter(p => p.hasdone_process)
                    })
                });

                if (aiRes.ok) {
                    // Redirect to dashboard after successful calculation
                    router.push('/community/dashboard');
                } else {
                    console.error("AI Calculation failed");
                    setApplyStatus('idle');
                    setIsApplying(false);
                }

            } catch (error) {
                console.error("Calculation execution failed", error);
                setApplyStatus('idle');
                setIsApplying(false);
            }

        }, 12000); // 12 seconds wait
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
                    <p className="text-slate-500 font-medium">Gathering community verification data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/community/dashboard" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="h-8 w-px bg-slate-200 mx-1" />
                        <div>
                            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-none mb-1">Impact Verification</h1>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium font-mono uppercase tracking-wider">Audit & Generation</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-20">

                {/* Summary Banner */}
                <div className="bg-gradient-to-br from-teal-900 to-emerald-950 rounded-[2rem] p-8 sm:p-12 mb-8 text-white relative overflow-hidden shadow-xl shadow-teal-900/20">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden sm:block">
                        <Leaf className="w-64 h-64" />
                    </div>
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        <div className="lg:col-span-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 mb-6">
                                <Shield className="w-3.5 h-3.5 text-teal-300" /> Government Audit Ready
                            </div>
                            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4 lg:max-w-2xl text-white">Scale Your Community's Carbon Impact</h2>
                            <p className="text-teal-100/80 text-sm sm:text-base font-medium mb-8 leading-relaxed max-w-xl">
                                Verify your members' regenerative practices. Our AI engine audits land data to generate verified carbon credits ready for the global exchange.
                            </p>

                            <div className="flex flex-wrap gap-4 sm:gap-6">
                                <div className="bg-white/10 p-5 border border-white/5 rounded-2xl backdrop-blur-md min-w-[160px] shadow-sm">
                                    <p className="text-[10px] text-teal-300 font-bold uppercase tracking-widest mb-1.5 opacity-80">Aggregate Area</p>
                                    <p className="text-3xl font-black flex items-baseline gap-1.5">
                                        {totalLandArea.toFixed(1)} <span className="text-xs font-bold text-teal-300/60 lowercase tracking-normal">acres</span>
                                    </p>
                                </div>
                                <div className="bg-white/10 p-5 border border-white/5 rounded-2xl backdrop-blur-md min-w-[160px] shadow-sm">
                                    <p className="text-[10px] text-teal-300 font-bold uppercase tracking-widest mb-1.5 opacity-80">Existing Pool</p>
                                    <p className="text-3xl font-black flex items-baseline gap-1.5">
                                        {communityCredits} <span className="text-xs font-bold text-teal-300/60 lowercase tracking-normal">CCs</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="lg:col-span-4 h-full">
                            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-md flex flex-col justify-center text-center h-full relative group">
                                <div className="absolute inset-0 bg-white/10 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {applyStatus === 'idle' ? (
                                    <div className="relative z-10">
                                        <div className="w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center text-teal-300 mx-auto mb-6 shadow-lg shadow-teal-500/10 border border-teal-500/20">
                                            <Shield className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-lg font-black text-white mb-2">Initiate Audit</h3>
                                        <p className="text-xs text-teal-100/60 mb-8 leading-relaxed">Submit your community's aggregated data for AI-powered verification.</p>
                                        <button
                                            onClick={handleApplyVerification}
                                            className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-2xl transition-all shadow-xl shadow-teal-500/20 active:scale-[0.98]"
                                        >
                                            Verify & Generate
                                        </button>
                                    </div>
                                ) : applyStatus === 'applied' ? (
                                    <div className="relative z-10">
                                        <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-300 mx-auto mb-6 shadow-lg shadow-amber-500/10 border border-amber-500/20">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                        </div>
                                        <h3 className="text-lg font-black text-white mb-2 underline decoration-amber-500 underline-offset-8">Audit In Progress</h3>
                                        <p className="text-xs text-teal-100/60 mb-1 leading-relaxed mt-4">Consulting agricultural data...</p>
                                        <div className="mt-4 flex flex-col items-center gap-1">
                                            <span className="text-[10px] font-mono text-amber-300 font-bold tracking-tighter uppercase">Est. Completion: 12s</span>
                                            <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500 animate-progress origin-left" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative z-10">
                                        <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-300 mx-auto mb-6 shadow-lg shadow-blue-500/10 border border-blue-500/20">
                                            <TrendingUp className="w-8 h-8 animate-bounce" />
                                        </div>
                                        <h3 className="text-lg font-black text-white mb-2">Minting Credits</h3>
                                        <p className="text-xs text-teal-100/60 mb-6 leading-relaxed">AI engine calculating final carbon offset yields...</p>
                                        <div className="py-2 px-4 bg-white/10 rounded-full inline-block">
                                            <p className="text-[10px] text-blue-300 font-black uppercase tracking-widest">Redirecting Home</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Member Listing */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-8 sm:p-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Users className="w-6 h-6 text-teal-600" />
                                Member Dashboard
                            </h3>
                            <p className="text-sm text-slate-400 font-medium mt-1">Status of members contributing to the current credit pool.</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600">
                            Total Members: {profiles.length}
                        </div>
                    </div>

                    {profiles.length === 0 ? (
                        <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                                <AlertCircle className="w-10 h-10" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-600">No members to verify</h4>
                            <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                                Share your community ID with farmers to start building your impact network.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden border border-slate-100 rounded-2xl">
                            <table className="min-w-full divide-y divide-slate-100 text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Farmer Contact</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Area</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sustainable Practices</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 bg-white">
                                    {profiles.map((profile) => (
                                        <tr key={profile._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 text-sm font-black group-hover:bg-teal-600 group-hover:text-white transition-all">
                                                        {profile.userId?.username?.charAt(0).toUpperCase() || 'F'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700">{profile.userId?.username || 'Aggregator Member'}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter">{profile.userId?.phone || profile.userId?.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                {profile.hasdone_process ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                                                        <CheckCircle2 className="w-3 h-3" /> Fully Compliant
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 shadow-sm font-mono">
                                                        <AlertCircle className="w-3 h-3" /> PENDING DATA
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-1 text-sm font-black text-slate-700">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-300" />
                                                    {profile.landarea ? profile.landarea.toFixed(1) : '0.0'}
                                                    <span className="text-[10px] text-slate-400 font-medium ml-0.5">Ac</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                                                    {profile.practices?.length > 0 ? (
                                                        profile.practices.slice(0, 3).map(p => (
                                                            <span key={p} className="text-[9px] bg-slate-50 text-slate-500 font-black px-2 py-0.5 rounded-lg border border-slate-100 uppercase tracking-tighter">
                                                                {p}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-medium italic opacity-60">No practices recorded</span>
                                                    )}
                                                    {profile.practices?.length > 3 && (
                                                        <span className="text-[9px] text-teal-600 font-black">+{profile.practices.length - 3}</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
