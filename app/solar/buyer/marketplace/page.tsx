"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Sun, Loader2, ChevronLeft, CheckCircle, ShoppingCart, MapPin,
    Filter, Coins, X, ArrowDown, CreditCard, Shield, Truck
} from 'lucide-react';

interface Listing {
    _id: string;
    sellerId: string;
    sellerName: string;
    tokens: number;
    pricePerToken: number;
    totalValue: number;
    location: { lat: number; lng: number };
    state: string;
}

// Portal renders children into document.body, escaping any parent stacking
// context (backdrop-filter / transform) that would clip position:fixed children
// to the parent's bounding box instead of the real viewport.
function Portal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return createPortal(children, document.body);
}

export default function SolarBuyerMarketplace() {
    const router = useRouter();
    const [listings, setListings] = useState<Listing[]>([]);
    const [buyerLocation, setBuyerLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [buyerState, setBuyerState] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [filterMode, setFilterMode] = useState<'state' | 'all'>('state');
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState<{ txHash: string; tokenAmount: number; totalAmount: number } | null>(null);
    const [error, setError] = useState('');
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    const loadListings = useCallback(async () => {
        try {
            const stateParam = filterMode === 'state' && buyerState ? `?state=${encodeURIComponent(buyerState)}` : '';
            const res = await fetch(`/api/solar/buyer/marketplace${stateParam}`);
            if (!res.ok) { router.push('/login'); return; }
            const data = await res.json();
            setListings(data.listings || []);
            if (data.buyerLocation) setBuyerLocation(data.buyerLocation);
            if (data.buyerState) setBuyerState(data.buyerState);
        } catch (err) { console.error(err); }
    }, [filterMode, buyerState, router]);

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await loadListings();
            setIsLoading(false);
        };
        init();
    }, [loadListings]);

    // Initialize map
    useEffect(() => {
        if (isLoading || !mapContainerRef.current) return;
        const initMap = async () => {
            const L = (await import('leaflet')).default;
            // @ts-ignore
            await import('leaflet/dist/leaflet.css');

            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

            const center = buyerLocation ? [buyerLocation.lat, buyerLocation.lng] : [20.5937, 78.9629];
            const zoom = buyerLocation ? 8 : 5;
            const map = L.map(mapContainerRef.current!, { scrollWheelZoom: true }).setView(center as [number, number], zoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
            mapRef.current = map;

            // Clear old markers
            markersRef.current.forEach(m => m.remove());
            markersRef.current = [];

            // Buyer pin (red)
            if (buyerLocation) {
                const buyerIcon = L.divIcon({
                    className: 'buyer-pin',
                    html: '<div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8],
                });
                const bm = L.marker([buyerLocation.lat, buyerLocation.lng], { icon: buyerIcon }).addTo(map);
                bm.bindPopup('<div style="font-size:12px;font-weight:bold;color:#ef4444">📍 Your Location</div>');
                markersRef.current.push(bm);
            }

            // Seller pins (green)
            listings.forEach(listing => {
                const sellerIcon = L.divIcon({
                    className: 'seller-pin',
                    html: '<div style="width:14px;height:14px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
                    iconSize: [14, 14],
                    iconAnchor: [7, 7],
                });
                const sm = L.marker([listing.location.lat, listing.location.lng], { icon: sellerIcon }).addTo(map);
                sm.bindPopup(`
                    <div style="font-size:12px;min-width:160px">
                        <p style="font-weight:bold;margin:0 0 4px">${listing.sellerName}</p>
                        <p style="color:#666;margin:0 0 2px">☀️ ${listing.tokens} Tokens</p>
                        <p style="color:#666;margin:0 0 2px">₹${listing.pricePerToken}/token</p>
                        <p style="font-weight:bold;color:#0d9488;margin:0">Total: ₹${listing.totalValue.toLocaleString()}</p>
                    </div>
                `);
                sm.on('click', () => setSelectedListing(listing));
                markersRef.current.push(sm);
            });

            setTimeout(() => map.invalidateSize(), 200);
        };
        initMap();
        return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    }, [isLoading, listings, buyerLocation]);

    const handlePurchase = async () => {
        if (!selectedListing) return;
        setIsPurchasing(true);
        setError('');
        try {
            const res = await fetch('/api/solar/buyer/buy-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId: selectedListing._id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Purchase failed');
            setPurchaseSuccess({
                txHash: data.transaction.txHash,
                tokenAmount: data.transaction.tokenAmount,
                totalAmount: data.transaction.totalAmount,
            });
            setSelectedListing(null);
            // Reload listings
            await loadListings();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsPurchasing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    <p className="text-slate-600 font-medium">Loading marketplace…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header
                FIX: Removed backdrop-blur-md → backdrop-filter creates a CSS stacking
                context that clips position:fixed children to this element's bounding box.
                bg-white/95 gives the same frosted look without the side effect. */}
            <header className="bg-white/95 border-b border-slate-200 fixed top-0 w-full z-[60] shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
                    <Link href="/solar/buyer/dashboard" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="w-8 h-8 bg-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/25">
                        <ShoppingCart className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900">Sun Token Marketplace</h1>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold leading-none">Buy Solar Energy</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            onClick={() => setFilterMode(f => f === 'state' ? 'all' : 'state')}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                        >
                            <Filter className="w-3.5 h-3.5" />
                            {filterMode === 'state' ? `${buyerState || 'State'}` : 'All India'}
                        </button>
                    </div>
                </div>
            </header>

            {/* FIX: Main layout — map now fills the remaining viewport height correctly.
                Using 100dvh with paddingTop instead of calc() prevents overflow on mobile.
                Map div uses absolute inset-0 so Leaflet always has a concrete pixel height. */}
            <main
                className="flex flex-col lg:flex-row"
                style={{ paddingTop: 64, height: '100dvh', maxHeight: '100dvh' }}
            >
                {/* Map Section */}
                <div className="lg:flex-[3] relative flex-1 min-h-0">
                    {/* FIX: absolute inset-0 gives Leaflet a concrete pixel height so the
                        map tiles render correctly and don't collapse to 0px. */}
                    <div ref={mapContainerRef} className="absolute inset-0 overflow-hidden" />

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 bg-white/95 rounded-xl px-4 py-3 shadow-lg border border-slate-200 z-[40]">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Map Legend</p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
                                <span className="text-xs text-slate-600 font-medium">You</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                                <span className="text-xs text-slate-600 font-medium">Sellers</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Listings Panel
                    FIX: Added min-h-0 so the flex child can shrink below its content height
                    and overflow-y-auto scrolls correctly inside the fixed-height parent. */}
                <div className="lg:flex-[2] bg-white border-l border-slate-200 flex flex-col min-h-0">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10 shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">Available Offers</h2>
                                <p className="text-[10px] text-slate-400 mt-0.5">{listings.length} listings · {filterMode === 'state' ? buyerState : 'All India'}</p>
                            </div>
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">{listings.length} active</span>
                        </div>
                    </div>

                    {/* FIX: overflow-y-auto on this inner div (not the parent) so only
                        the list scrolls, keeping the header sticky and visible. */}
                    <div className="overflow-y-auto flex-1">
                        {listings.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {listings.map(listing => (
                                    <div
                                        key={listing._id}
                                        className={`px-5 py-4 hover:bg-slate-50/70 transition-all cursor-pointer ${selectedListing?._id === listing._id ? 'bg-orange-50 border-l-4 border-orange-500' : ''}`}
                                        onClick={() => setSelectedListing(listing)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{listing.sellerName}</p>
                                                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400">
                                                    <MapPin className="w-3 h-3" />
                                                    <span>{listing.state}</span>
                                                </div>
                                            </div>
                                            <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-100 shrink-0">
                                                ☀️ {listing.tokens} TKN
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-xs text-slate-500">₹{listing.pricePerToken}/token</span>
                                            <span className="text-sm font-bold text-orange-700">₹{listing.totalValue.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-5 py-14 text-center">
                                <Coins className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-sm text-slate-500 font-medium">No listings available</p>
                                <p className="text-xs text-slate-400 mt-1">Try changing your filter to see more sellers.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* ─── All overlays rendered via Portal ─────────────────────────────────────
                FIX: Portal teleports these elements into document.body, completely outside
                the React component tree. This means position:fixed is always relative to
                the true viewport — never clipped by any ancestor's stacking context
                (caused by backdrop-filter, transform, will-change, or perspective).
                Without this, the modal was constrained to the map column's bounding box.
            ──────────────────────────────────────────────────────────────────────────── */}

            {/* Purchase Success Toast */}
            <Portal>
                {purchaseSuccess && (
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-emerald-600 text-white rounded-2xl shadow-2xl shadow-emerald-700/30 p-5 sm:p-6 max-w-sm w-[90%]">
                        <button onClick={() => setPurchaseSuccess(null)} className="absolute top-3 right-3 text-emerald-200 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-emerald-200" />
                            <h3 className="text-base font-bold">Purchase Complete!</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-emerald-500/30 rounded-xl p-2.5">
                                <p className="text-[9px] text-emerald-200 font-bold uppercase">Tokens</p>
                                <p className="text-sm font-bold">{purchaseSuccess.tokenAmount} ☀️</p>
                            </div>
                            <div className="bg-emerald-500/30 rounded-xl p-2.5">
                                <p className="text-[9px] text-emerald-200 font-bold uppercase">Paid</p>
                                <p className="text-sm font-bold">₹{purchaseSuccess.totalAmount.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bg-emerald-700/50 rounded-lg p-2">
                            <p className="text-[9px] text-emerald-200 font-bold uppercase">TX Hash</p>
                            <p className="text-[10px] font-mono text-emerald-100 break-all">{purchaseSuccess.txHash}</p>
                        </div>
                    </div>
                )}
            </Portal>

            {/* Error Toast */}
            <Portal>
                {error && (
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-red-600 text-white rounded-2xl shadow-2xl p-4 max-w-sm w-[90%] flex items-center gap-3">
                        <button onClick={() => setError('')} className="absolute top-2 right-2 text-red-200 hover:text-white"><X className="w-4 h-4" /></button>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}
            </Portal>

            {/* Purchase Modal */}
            <Portal>
                {selectedListing && !purchaseSuccess && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) setSelectedListing(null); }}
                    >
                        <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-2xl p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-slate-900">Purchase Sun Tokens</h3>
                                <button onClick={() => setSelectedListing(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                        <Sun className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{selectedListing.sellerName}</p>
                                        <p className="text-[10px] text-slate-400">{selectedListing.state}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-white rounded-lg p-2.5 text-center">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Tokens</p>
                                        <p className="text-sm font-bold text-amber-600">{selectedListing.tokens}</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-2.5 text-center">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Rate</p>
                                        <p className="text-sm font-bold text-slate-900">₹{selectedListing.pricePerToken}</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-2.5 text-center">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Total</p>
                                        <p className="text-sm font-bold text-orange-600">₹{selectedListing.totalValue.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Processing Flow */}
                            <div className="mb-5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Transaction Flow</p>
                                <div className="space-y-2">
                                    <FlowStep icon={<CreditCard className="w-3.5 h-3.5" />} label="Payment processed" color="text-orange-600 bg-orange-50" />
                                    <div className="flex justify-center"><ArrowDown className="w-3 h-3 text-slate-300" /></div>
                                    <FlowStep icon={<Shield className="w-3.5 h-3.5" />} label="Government verification" color="text-blue-600 bg-blue-50" />
                                    <div className="flex justify-center"><ArrowDown className="w-3 h-3 text-slate-300" /></div>
                                    <FlowStep icon={<Truck className="w-3.5 h-3.5" />} label="Tokens delivered to you" color="text-emerald-600 bg-emerald-50" />
                                    <div className="flex justify-center"><ArrowDown className="w-3 h-3 text-slate-300" /></div>
                                    <FlowStep icon={<Coins className="w-3.5 h-3.5" />} label="Payment credited to seller" color="text-amber-600 bg-amber-50" />
                                </div>
                            </div>

                            <button
                                onClick={handlePurchase}
                                disabled={isPurchasing}
                                className="w-full py-3.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-500/20 text-sm"
                            >
                                {isPurchasing ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                                ) : (
                                    <><ShoppingCart className="w-4 h-4" /> Buy {selectedListing.tokens} Tokens for ₹{selectedListing.totalValue.toLocaleString()}</>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Portal>
        </div>
    );
}

function FlowStep({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
    return (
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${color} border border-current/10`}>
            {icon}
            <span className="text-xs font-semibold">{label}</span>
        </div>
    );
}