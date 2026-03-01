"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    TrendingUp, Loader2, Globe, Leaf, ChevronLeft, ChevronRight,
    CheckCircle2, AlertCircle, BadgeIndianRupee, Banknote
} from 'lucide-react';
import Link from 'next/link';

const MARKET_PRICE_PER_CREDIT = 350; // ₹ — must match app/lib/constants.ts

interface SaleSummary {
    creditsSold: number;
    pricePerCredit: number;
    totalValue: number;
    auditHash: string;
}

// export default function CommunityMarketplace() {
//     const router = useRouter();
//     const [communityId, setCommunityId] = useState('');
//     const [communityName, setCommunityName] = useState('');
//     const [availableCredits, setAvailableCredits] = useState(0);
//     const [sellAmount, setSellAmount] = useState<number>(0);
//     const [description, setDescription] = useState(
//         'Premium regenerative agricultural carbon credits verified by our local farming network.'
//     );
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSelling, setIsSelling] = useState(false);
//     const [saleSummary, setSaleSummary] = useState<SaleSummary | null>(null);
//     const [error, setError] = useState('');

//     useEffect(() => {
//         const load = async () => {
//             try {
//                 const authRes = await fetch('/api/communityadmin/getcommunityadmin');
//                 if (!authRes.ok) { router.push('/login'); return; }
//                 const authData = await authRes.json();
//                 const cid = authData.adminProfile?.community_id;
//                 if (!cid) { router.push('/community/dashboard'); return; }

//                 setCommunityId(cid);
//                 setCommunityName(authData.community?.community_name || cid);

//                 const creditsRes = await fetch(`/api/community/getcommunitycredit?community_id=${cid}`);
//                 if (creditsRes.ok) {
//                     const creditsData = await creditsRes.json();
//                     setAvailableCredits(creditsData.credits || 0);
//                     setSellAmount(creditsData.credits || 0);
//                 }
//             } catch (e) {
//                 console.error('Failed to load community data', e);
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         load();
//     }, [router]);

//     const handleSell = async () => {
//         if (!communityId || !description.trim()) return;
//         setIsSelling(true);
//         setError('');
//         setSaleSummary(null);

//         try {
//             const res = await fetch('/api/community/list_on_market', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ community_id: communityId, community_description: description, credits_to_sell: sellAmount }),
//             });
//             const data = await res.json();
//             if (res.ok) {
//                 setSaleSummary(data);
//                 setAvailableCredits(prev => prev - sellAmount);
//             } else {
//                 setError(data.error || 'Failed to sell credits.');
//             }
//         } catch (e) {
//             setError('Network error. Please try again.');
//         } finally {
//             setIsSelling(false);
//         }
//     };

//     if (isLoading) {
//         return (
//             <div className="min-h-screen bg-slate-50 flex items-center justify-center">
//                 <div className="flex flex-col items-center gap-4">
//                     <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
//                     <p className="text-slate-500 font-medium">Loading Carbon Exchange...</p>
//                 </div>
//             </div>
//         );
//     }

//     const estimatedValue = sellAmount * MARKET_PRICE_PER_CREDIT;

//     return (
//         <div className="min-h-screen bg-[#F8FAFC]">
//             {/* Header */}
//             <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
//                 <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
//                     <div className="flex items-center gap-4">
//                         <Link href="/community/dashboard" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all">
//                             <ChevronLeft className="w-5 h-5" />
//                         </Link>
//                         <div className="h-8 w-px bg-slate-200 mx-1" />
//                         <div>
//                             <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-none mb-1">Carbon Exchange</h1>
//                             <p className="text-[10px] sm:text-xs text-slate-400 font-medium font-mono uppercase tracking-wider">Direct Credit Listing</p>
//                         </div>
//                     </div>

//                     <div className="hidden sm:flex items-center gap-3">
//                         <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
//                             <Globe className="w-3.5 h-3.5" /> Market Live
//                         </div>
//                     </div>
//                 </div>
//             </header>

//             <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-20">

//                 {/* Hero Banner */}
//                 <div className="bg-gradient-to-br from-teal-900 to-emerald-950 rounded-[2rem] p-8 sm:p-12 mb-8 text-white relative overflow-hidden shadow-xl shadow-teal-900/20">
//                     <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden sm:block">
//                         <Globe className="w-64 h-64" />
//                     </div>
//                     <div className="relative z-10 max-w-2xl">
//                         <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">{communityName}</h2>
//                         <p className="text-teal-100/80 text-sm sm:text-base mb-8 leading-relaxed">
//                             Sell your community's carbon credits directly at the current market rate. No aggregator approval needed — funds are distributed to your members instantly upon purchase.
//                         </p>
//                         <div className="flex flex-wrap gap-4 sm:gap-6">
//                             <div className="bg-white/10 p-5 border border-white/5 rounded-2xl backdrop-blur-md min-w-[140px] shadow-sm">
//                                 <p className="text-[10px] text-teal-300 font-bold uppercase tracking-widest mb-1.5 opacity-80">Available Credits</p>
//                                 <p className="text-3xl font-black">{availableCredits.toLocaleString()}</p>
//                             </div>
//                             <div className="bg-white/10 p-5 border border-white/5 rounded-2xl backdrop-blur-md min-w-[140px] shadow-sm">
//                                 <p className="text-[10px] text-teal-300 font-bold uppercase tracking-widest mb-1.5 opacity-80">Market Rate</p>
//                                 <p className="text-3xl font-black">₹{MARKET_PRICE_PER_CREDIT}</p>
//                                 <p className="text-[10px] text-teal-200 mt-1 font-medium">per carbon credit</p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Success Summary */}
//                 {saleSummary && (
//                     <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-[2rem] p-8 animate-in zoom-in duration-300">
//                         <div className="flex items-center gap-4 mb-6">
//                             <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
//                                 <CheckCircle2 className="w-7 h-7" />
//                             </div>
//                             <div>
//                                 <h2 className="text-xl font-black text-emerald-900">Credits Listed Successfully!</h2>
//                                 <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider mt-0.5">Transaction Finalized</p>
//                             </div>
//                         </div>
//                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
//                             <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
//                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Credits Sold</p>
//                                 <p className="text-xl font-black text-emerald-600">{saleSummary.creditsSold.toLocaleString()} CRD</p>
//                             </div>
//                             <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
//                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Rate</p>
//                                 <p className="text-xl font-black text-slate-900">₹{saleSummary.pricePerCredit}/CRD</p>
//                             </div>
//                             <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
//                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Total Earned</p>
//                                 <p className="text-xl font-black text-emerald-700">₹{saleSummary.totalValue.toLocaleString()}</p>
//                             </div>
//                         </div>
//                         <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
//                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Blockchain Audit Hash (SHA-256)</p>
//                             <p className="text-xs font-mono text-slate-500 break-all bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">{saleSummary.auditHash}</p>
//                         </div>
//                         <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700 font-bold bg-white/50 py-2 px-4 rounded-full w-fit">
//                             <Globe className="w-3.5 h-3.5" /> Distributed to member balances proportionately
//                         </div>
//                     </div>
//                 )}

//                 {/* Error */}
//                 {error && (
//                     <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 animate-in slide-in-from-top-4">
//                         <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
//                             <AlertCircle className="w-5 h-5" />
//                         </div>
//                         <div className="pt-1">
//                             <p className="text-sm text-red-700 font-extrabold mb-1">Exchange Error</p>
//                             <p className="text-xs text-red-600/80 font-medium leading-relaxed">{error}</p>
//                         </div>
//                     </div>
//                 )}

//                 {/* Sell Form */}
//                 {!saleSummary && (
//                     <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-8 sm:p-10 relative">
//                         <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
//                             <Leaf className="w-32 h-32 text-emerald-600" />
//                         </div>

//                         <div className="mb-10">
//                             <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
//                                 <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
//                                     <Banknote className="w-6 h-6" />
//                                 </div>
//                                 Sell Credits to Market
//                             </h3>
//                             <p className="text-sm text-slate-500 max-w-md">
//                                 Directly list your community credits on the global exchange at the current fixed market rate.
//                             </p>
//                         </div>

//                         <div className="space-y-8">
//                             <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
//                                 <div className="flex justify-between items-center mb-6">
//                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
//                                         Amount to List
//                                     </label>
//                                     <span className="text-xl font-black text-emerald-600 bg-white px-4 py-1.5 rounded-2xl border border-emerald-100 shadow-sm ring-4 ring-emerald-50">
//                                         {sellAmount.toLocaleString()} <span className="text-xs text-emerald-400 ml-1">CRD</span>
//                                     </span>
//                                 </div>
//                                 <input
//                                     type="range"
//                                     min={availableCredits > 0 ? 1 : 0}
//                                     max={availableCredits}
//                                     value={sellAmount}
//                                     onChange={(e) => setSellAmount(Number(e.target.value))}
//                                     className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 hover:accent-emerald-500 transition-all"
//                                     disabled={availableCredits <= 0}
//                                 />
//                                 <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
//                                     <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> Min 1</span>
//                                     <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">{availableCredits.toLocaleString()} Max Available</span>
//                                 </div>
//                             </div>

//                             <div className="space-y-3">
//                                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
//                                     Credit Pool Description
//                                 </label>
//                                 <textarea
//                                     value={description}
//                                     onChange={e => setDescription(e.target.value)}
//                                     rows={3}
//                                     className="w-full px-6 py-5 rounded-[1.5rem] border border-slate-200 text-sm text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all resize-none shadow-sm hover:border-slate-300"
//                                     placeholder="Describe the environmental impact of your carbon credits..."
//                                 />
//                             </div>

//                             {/* Payout Calculation */}
//                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                                 <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100/50 flex flex-col items-center text-center">
//                                     <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1 opacity-70">Total Payout</p>
//                                     <p className="text-2xl font-black text-emerald-900 leading-none">₹{estimatedValue.toLocaleString()}</p>
//                                     <p className="text-[10px] text-emerald-600 font-extrabold mt-2 underline underline-offset-4 pointer-events-none opacity-50">Subject to verification</p>
//                                 </div>
//                                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
//                                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 opacity-70">Current Rate</p>
//                                     <p className="text-2xl font-black text-slate-900 leading-none">₹{MARKET_PRICE_PER_CREDIT}</p>
//                                     <p className="text-[10px] text-slate-400 font-extrabold mt-2 underline underline-offset-4 pointer-events-none opacity-50">Market Standard</p>
//                                 </div>
//                             </div>

//                             <button
//                                 onClick={handleSell}
//                                 disabled={isSelling || availableCredits <= 0 || sellAmount <= 0}
//                                 className="w-full py-5 sm:py-6 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-200 text-white font-black rounded-[1.5rem] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-teal-600/20 active:scale-[0.98]"
//                             >
//                                 {isSelling ? (
//                                     <><Loader2 className="w-6 h-6 animate-spin" /> Processing Marketplace Transaction...</>
//                                 ) : availableCredits <= 0 ? (
//                                     <><AlertCircle className="w-6 h-6" /> Insufficient Credits</>
//                                 ) : (
//                                     <><BadgeIndianRupee className="w-6 h-6" /> Sell Credits for ₹{estimatedValue.toLocaleString()}</>
//                                 )}
//                             </button>

//                             {availableCredits <= 0 && (
//                                 <div className="text-center">
//                                     <p className="text-xs text-slate-400 font-bold mb-4">No credits available in community pool.</p>
//                                     <Link href="/community/getcarboncredit" className="text-xs font-black text-teal-600 hover:text-teal-700 flex items-center justify-center gap-1 uppercase tracking-widest">
//                                         Verify New Yield <ChevronRight className="w-3.5 h-3.5" />
//                                     </Link>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 )}
//             </main>
//         </div>
//     );
// }
