"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard, Loader2, Globe, TrendingUp, Search, MapPin, Leaf,
    CheckCircle2, AlertCircle, ChevronRight, DollarSign, Package
} from 'lucide-react';
import Link from 'next/link';

interface MarketListing {
    communityId: string;
    communityName: string;
    community_description: string;
    community_carbon_credit_number: number;
    createdAt: string;
}

interface OwnedDeal {
    communityId: string;
    credits: number;
    pricePerCredit: number;
    totalValue: number;
    date: string;
}



export default function AggregatorMarketplace() {
    const router = useRouter();
    const [listings, setListings] = useState<MarketListing[]>([]);
    const [ownedDeals, setOwnedDeals] = useState<OwnedDeal[]>([]);
    const [aggregatorId, setAggregatorId] = useState<string>('');
    const [totalOwned, setTotalOwned] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isProposing, setIsProposing] = useState(false);

    // Modal state
    const [selectedCommunity, setSelectedCommunity] = useState<MarketListing | null>(null);
    const [creditsToBuy, setCreditsToBuy] = useState<number>(0);
    const [pricePerCredit, setPricePerCredit] = useState<number>(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch market listings
                const marketRes = await fetch('/api/aggregator/get_marketplace_data');
                if (marketRes.ok) {
                    const data = await marketRes.json();
                    setListings(data.communities);
                }

                // 2. Fetch aggregator's OWN deals (portfolio)
                const analyticsRes = await fetch('/api/aggregator/analytics');
                if (analyticsRes.ok) {
                    const analytics = await analyticsRes.json();
                    setAggregatorId(analytics.aggregatorId || '');
                    setTotalOwned(analytics.totalCredits || 0);

                    // Map recent deals to owned deals
                    const deals: OwnedDeal[] = (analytics.recentDeals || []).map((d: any) => ({
                        communityId: d.entityId,
                        credits: d.credits,
                        pricePerCredit: d.pricePerCredit,
                        totalValue: d.totalValue,
                        date: d.createdAt,
                    }));
                    setOwnedDeals(deals);
                }
            } catch (error) {
                console.error('Failed to load marketplace data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleProposeDeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCommunity || creditsToBuy <= 0 || pricePerCredit <= 0 || !aggregatorId) return;

        setIsProposing(true);
        try {
            const res = await fetch('/api/aggregator/aggregatordeal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    community_id: selectedCommunity.communityId,
                    aggregator_id: aggregatorId,  // Use actual DealerId
                    credits_offered: creditsToBuy,
                    price_per_credit: pricePerCredit
                })
            });

            if (res.ok) {
                setSelectedCommunity(null);
                setCreditsToBuy(0);
                setPricePerCredit(0);
                alert("Proposal sent successfully!");
            } else {
                const data = await res.json();
                alert(data.error || "Failed to send proposal.");
            }
        } catch (error) {
            console.error(error);
            alert("Error sending proposal");
        } finally {
            setIsProposing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
                    <p className="text-slate-500 font-medium">Scanning Market Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 fixed top-0 w-full z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                            A
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">Aggregator Terminal</h1>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Acquisition Board</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/aggregator/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                            Dashboard
                        </Link>
                        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                            Exit
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">

                {/* Global Market Overview */}
                <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/20">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Globe className="w-48 h-48" />
                    </div>
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h2 className="text-3xl font-extrabold tracking-tight mb-2">Live Market Liquidity</h2>
                            <p className="text-slate-300 text-sm font-medium mb-6 max-w-lg">
                                Scout farming communities worldwide. Propose custom OTC deals to acquire verified, high-quality agricultural carbon credits directly from the source.
                            </p>
                            <div className="flex gap-4 flex-wrap">
                                <div className="bg-white/10 p-4 border border-white/5 rounded-2xl w-full max-w-[200px] backdrop-blur-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Available Communities</p>
                                    <p className="text-3xl font-bold">{listings.length}</p>
                                </div>
                                <div className="bg-emerald-500/10 p-4 border border-emerald-500/20 rounded-2xl w-full max-w-[200px] backdrop-blur-sm">
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Total Pool Size</p>
                                    <p className="text-3xl font-bold text-emerald-400">
                                        {listings.reduce((sum, item) => sum + item.community_carbon_credit_number, 0).toLocaleString()} <span className="text-sm font-medium">CCs</span>
                                    </p>
                                </div>
                                <div className="bg-blue-500/10 p-4 border border-blue-500/20 rounded-2xl w-full max-w-[200px] backdrop-blur-sm">
                                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Your Credits Owned</p>
                                    <p className="text-3xl font-bold text-blue-400">
                                        {totalOwned.toLocaleString()} <span className="text-sm font-medium">CRD</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Your Purchased Credits */}
                {ownedDeals.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" /> Your Purchased Credits
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ownedDeals.map((deal, idx) => (
                                <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 uppercase tracking-wider">Community Deal</span>
                                        <span className="text-[10px] text-slate-400">{new Date(deal.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-mono mb-2">Community: <span className="font-bold text-slate-800">{deal.communityId}</span></p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-blue-50 rounded-xl px-3 py-2">
                                            <p className="text-[9px] text-blue-400 font-bold uppercase">Credits</p>
                                            <p className="text-sm font-bold text-blue-900">{deal.credits.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl px-3 py-2">
                                            <p className="text-[9px] text-emerald-400 font-bold uppercase">Total Value</p>
                                            <p className="text-sm font-bold text-emerald-900">₹{deal.totalValue.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" /> Active Community Listings
                    </h3>
                </div>

                {/* Deal Grid */}
                {listings.length === 0 ? (
                    <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 font-bold mb-1">Market is currently illiquid</p>
                        <p className="text-sm text-slate-500">No communities have listed their credits yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.map((listing) => (
                            <div key={listing.communityId} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow group flex flex-col items-start justify-between">
                                <div className="w-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-110 transition-transform">
                                            {listing.communityName.charAt(0)}
                                        </div>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            <CheckCircle2 className="w-3 h-3" /> Verified
                                        </span>
                                    </div>

                                    <h4 className="text-lg font-bold text-slate-900 mb-1">{listing.communityName}</h4>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                                        {listing.community_description}
                                    </p>

                                    <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Available Volume</p>
                                        <p className="text-2xl font-bold flex items-baseline gap-1 text-slate-800">
                                            {listing.community_carbon_credit_number.toLocaleString()} <span className="text-sm font-medium text-slate-500">Credits</span>
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedCommunity(listing)}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    Propose Deal <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Proposal Modal Overlay */}
            {selectedCommunity && (
                <div className="fixed text-black inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setSelectedCommunity(null)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
                        >
                            <AlertCircle className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-slate-900 mb-2">Draft Proposal</h3>
                        <p className="text-sm text-slate-500 mb-6">Create an OTC offer for <span className="font-bold text-slate-700">{selectedCommunity.communityName}</span>.</p>

                        <form onSubmit={handleProposeDeal} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                    Credits Required
                                </label>
                                <div className="relative">
                                    <Leaf className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedCommunity.community_carbon_credit_number}
                                        value={creditsToBuy || ''}
                                        onChange={e => setCreditsToBuy(Number(e.target.value))}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder={`Max: ${selectedCommunity.community_carbon_credit_number}`}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                                    Price Per Credit (INR)
                                </label>
                                <div className="relative">
                                    <span className="text-slate-400 font-bold absolute left-4 top-1/2 -translate-y-1/2">₹</span>
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        value={pricePerCredit || ''}
                                        onChange={e => setPricePerCredit(Number(e.target.value))}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="e.g. 15.50"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center my-6">
                                <span className="text-sm font-bold text-blue-900">Total Purchase Value</span>
                                <span className="text-xl font-black text-blue-600">
                                    ₹{((creditsToBuy || 0) * (pricePerCredit || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCommunity(null)}
                                    className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProposing || !creditsToBuy || !pricePerCredit}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center"
                                >
                                    {isProposing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Proposal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}