"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ShoppingCart, Loader2, ArrowLeft, Leaf, User,
    CheckCircle, AlertCircle, Globe, Building2,
    TrendingUp, Shield, BadgeIndianRupee, Download,
    QrCode, Award, Sprout
} from 'lucide-react';
import { MARKET_PRICE_PER_CREDIT } from '@/app/lib/constants';

const CREDIT_REQUEST_REASONS = [
    'Air Pollution Offset',
    'Industrial Waste Emissions',
    'Reforestation Support',
    'Supply Chain Emissions',
    'Manufacturing Footprint',
    'Transportation Emissions',
    'Energy Consumption Offset',
    'Other',
];

type PoolType = 'community' | 'individual';

interface UnifiedListing {
    poolType: PoolType;
    // community fields
    communityId?: string;
    communityName?: string;
    // individual fields
    userId?: string;
    farmerName?: string;
    // common
    availableCredits: number;
    pricePerCredit: number;
    totalValue: number;
    description: string;
}

interface PurchaseSummary {
    projectId: string;
    projectName: string;
    poolType: PoolType;
    communityId?: string;
    communityName?: string;
    farmerId?: string;
    farmerName?: string;
    totalCredits: number;
    pricePerCredit: number;
    totalPaid: number;
    reason: string;
    memberPayoutsCount?: number;
    txHash: string;
    transactionId: string;
}

// ── Retirement Certificate Generator (jsPDF) ──────────────────────────────────
async function generateCertificate(summary: PurchaseSummary) {
    // Dynamic import so it only loads client-side
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297, H = 210;

    // Background gradient simulation (filled rect + overlay)
    doc.setFillColor(13, 78, 66); // deep teal
    doc.rect(0, 0, W, H, 'F');

    // Decorative border
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.rect(8, 8, W - 16, H - 16, 'S');
    doc.setLineWidth(0.2);
    doc.rect(10, 10, W - 20, H - 20, 'S');

    // Corner flourishes (simple circles)
    doc.setFillColor(255, 255, 255, 30);
    [14, W - 14].forEach(cx => {
        [14, H - 14].forEach(cy => {
            doc.circle(cx, cy, 4, 'S');
        });
    });

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(134, 239, 172); // emerald-300
    doc.text('CARBON CREDIT RETIREMENT CERTIFICATE', W / 2, 28, { align: 'center' });

    // Main title
    doc.setFontSize(30);
    doc.setTextColor(255, 255, 255);
    doc.text('Certificate of Carbon Retirement', W / 2, 48, { align: 'center' });

    // Divider line
    doc.setDrawColor(134, 239, 172);
    doc.setLineWidth(0.8);
    doc.line(40, 54, W - 40, 54);

    // Beneficiary
    doc.setFontSize(11);
    doc.setTextColor(167, 243, 208); // emerald-200
    doc.setFont('helvetica', 'normal');
    doc.text('THIS CERTIFIES THAT', W / 2, 66, { align: 'center' });

    const beneficiaryName = summary.poolType === 'community'
        ? (summary.communityName || 'Community Project')
        : (summary.farmerName || 'Farmer Project');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text(beneficiaryName.toUpperCase(), W / 2, 78, { align: 'center' });

    // Body text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(167, 243, 208);
    doc.text('HAS SUCCESSFULLY RETIRED', W / 2, 90, { align: 'center' });

    // Tonnage
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(134, 239, 172);
    doc.text(`${summary.totalCredits.toLocaleString()} Metric Tonnes of CO₂e`, W / 2, 103, { align: 'center' });

    // Impact line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    const farmerCount = summary.memberPayoutsCount || 1;
    doc.text(
        `Directly supporting ${farmerCount} smallholder farmer${farmerCount !== 1 ? 's' : ''} in their sustainable agriculture journey.`,
        W / 2, 116, { align: 'center' }
    );

    // Three detail columns
    const col1 = 55, col2 = W / 2, col3 = W - 55;
    const rowY = 132;

    // Serial number
    const year = new Date().getFullYear();
    const serial = `IND-${year}-FARM-${summary.transactionId.toString().slice(-3).toUpperCase()}`;
    doc.setFillColor(255, 255, 255, 15);

    // Draw 3 info boxes
    [[col1, 'SERIAL NO.', serial],
    [col2, 'ISSUE DATE', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })],
    [col3, 'TOTAL PAID', `₹${summary.totalPaid.toLocaleString()}`]].forEach(([x, label, val]) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(134, 239, 172);
        doc.text(String(label), Number(x), rowY, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(String(val), Number(x), rowY + 8, { align: 'center' });
    });

    // QR code placeholder box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(W - 46, H - 46, 32, 32, 2, 2, 'F');
    doc.setFontSize(6);
    doc.setTextColor(13, 78, 66);
    doc.setFont('helvetica', 'bold');
    doc.text('SCAN TO VERIFY', W - 30, H - 20, { align: 'center' });
    doc.text('RETIREMENT STATUS', W - 30, H - 16, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(167, 243, 208);
    doc.setFont('helvetica', 'normal');
    doc.text('This credit has been permanently retired and cannot be resold. Verified on the CarbonCredit Platform.',
        W / 2, H - 20, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`TX HASH: ${summary.txHash}`, W / 2, H - 14, { align: 'center' });

    doc.save(`retirement-certificate-${serial}.pdf`);
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CompanyMarketplace() {
    const router = useRouter();
    const [listings, setListings] = useState<UnifiedListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [purchaseSummary, setPurchaseSummary] = useState<PurchaseSummary | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const [selectedListing, setSelectedListing] = useState<UnifiedListing | null>(null);
    const [creditsRequested, setCreditsRequested] = useState(0);
    const [reason, setReason] = useState(CREDIT_REQUEST_REASONS[0]);
    const [isBuying, setIsBuying] = useState(false);

    const fetchListings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/company/marketplace?type=all');
            if (res.ok) {
                const data = await res.json();
                setListings(data.listings || []);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchListings(); }, []);

    const openRequestForm = (listing: UnifiedListing) => {
        setSelectedListing(listing);
        setCreditsRequested(Math.min(10, listing.availableCredits));
        setReason(CREDIT_REQUEST_REASONS[0]);
        setError('');
    };

    const handleBuy = async () => {
        if (!selectedListing) return;
        setIsBuying(true);
        setError('');
        setPurchaseSummary(null);

        const body = selectedListing.poolType === 'community'
            ? { poolType: 'community', communityId: selectedListing.communityId, creditsRequested, reason }
            : { poolType: 'individual', farmerId: selectedListing.userId, creditsRequested, reason };

        try {
            const res = await fetch('/api/company/buy_project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) {
                setPurchaseSummary(data.summary);
                setSelectedListing(null);
                fetchListings();
            } else {
                setError(data.error || 'Request failed');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsBuying(false);
        }
    };

    const handleDownloadCertificate = async () => {
        if (!purchaseSummary) return;
        setIsGeneratingPDF(true);
        try {
            await generateCertificate(purchaseSummary);
        } catch (e) {
            console.error('PDF generation error:', e);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const totalAvailableCredits = listings.reduce((a, l) => a + l.availableCredits, 0);
    const communityCount = listings.filter(l => l.poolType === 'community').length;
    const farmerCount = listings.filter(l => l.poolType === 'individual').length;

    // For the impact breakdown in the modal
    const totalForBreakdown = creditsRequested * (selectedListing?.pricePerCredit ?? MARKET_PRICE_PER_CREDIT);
    const farmerShare = Math.round(totalForBreakdown * 0.80);
    const platformFee = Math.round(totalForBreakdown * 0.15);
    const auditFee = Math.round(totalForBreakdown * 0.05);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center gap-3">
                    <button onClick={() => router.push('/company/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shrink-0">
                        <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-xl font-bold text-slate-900">Carbon Marketplace</h1>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Purchase verified carbon credits</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32">

                {/* Purchase Success Summary + Certificate */}
                {purchaseSummary && (
                    <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                                <h2 className="text-lg font-bold text-emerald-900">Credits Retired Successfully!</h2>
                            </div>
                            {/* Certificate download CTA */}
                            <button
                                onClick={handleDownloadCertificate}
                                disabled={isGeneratingPDF}
                                className="flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-700/20 text-sm disabled:opacity-60"
                            >
                                {isGeneratingPDF
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                                    : <><Award className="w-4 h-4" /> Download Retirement Certificate</>
                                }
                            </button>
                        </div>

                        {/* Certificate preview card */}
                        <div className="bg-gradient-to-br from-teal-900 to-emerald-900 rounded-2xl p-5 mb-4 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="flex items-start justify-between relative z-10">
                                <div>
                                    <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest mb-1">Retirement Certificate Preview</p>
                                    <p className="text-white font-bold text-lg">
                                        {purchaseSummary.poolType === 'community' ? purchaseSummary.communityName : purchaseSummary.farmerName}
                                    </p>
                                    <p className="text-emerald-200 text-sm mt-1">
                                        Retired <span className="font-bold text-white">{purchaseSummary.totalCredits.toLocaleString()} Metric Tonnes</span> of CO₂e
                                    </p>
                                    <p className="text-emerald-300 text-xs mt-1">
                                        Directly supported {purchaseSummary.memberPayoutsCount || 1} smallholder farmer{(purchaseSummary.memberPayoutsCount || 1) !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5">
                                        <p className="text-[9px] text-emerald-300 font-bold uppercase">Serial No.</p>
                                        <p className="text-xs font-mono text-white">IND-{new Date().getFullYear()}-FARM-{purchaseSummary.transactionId.toString().slice(-3).toUpperCase()}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                                        <QrCode className="w-8 h-8 text-teal-800" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary data grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            <div className="bg-white rounded-2xl p-4">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Source</p>
                                <p className="text-sm font-bold text-slate-900 capitalize">{purchaseSummary.poolType}</p>
                            </div>
                            <div className="bg-white rounded-2xl p-4">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Credits Retired</p>
                                <p className="text-sm font-bold text-emerald-600">{purchaseSummary.totalCredits.toLocaleString()} CRD</p>
                            </div>
                            <div className="bg-white rounded-2xl p-4">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Paid</p>
                                <p className="text-sm font-bold text-slate-900">₹{purchaseSummary.totalPaid.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-2xl p-4">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Rate</p>
                                <p className="text-sm font-bold text-teal-600">₹{purchaseSummary.pricePerCredit}/CRD</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-emerald-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Blockchain Audit Hash (SHA-256)</p>
                            <p className="text-xs font-mono text-slate-600 break-all">{purchaseSummary.txHash}</p>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">All Projects</p>
                        <p className="text-2xl font-bold text-slate-900">{listings.length}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Credits</p>
                        <p className="text-2xl font-bold text-emerald-600">{totalAvailableCredits.toLocaleString()} <span className="text-sm">CRD</span></p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Communities</p>
                        <p className="text-2xl font-bold text-teal-600">{communityCount}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Farmers</p>
                        <p className="text-2xl font-bold text-emerald-600">{farmerCount}</p>
                    </div>
                </div>

                {/* Checkout Modal */}
                {selectedListing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                                <BadgeIndianRupee className="w-5 h-5 text-teal-600" />
                                Request Credits
                            </h3>
                            <p className="text-xs text-slate-400 mb-5">
                                From:{' '}
                                <span className="font-bold text-teal-700">
                                    {selectedListing.poolType === 'community' ? selectedListing.communityName : selectedListing.farmerName}
                                </span>
                                {' '}· Up to {selectedListing.availableCredits.toLocaleString()} CRD at ₹{selectedListing.pricePerCredit}/CRD
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                    <p className="text-xs text-red-700">{error}</p>
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Credits Requested</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={selectedListing.availableCredits}
                                    value={creditsRequested}
                                    onChange={e => setCreditsRequested(Number(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            <div className="mb-5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Reason for Request</label>
                                <select
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                                >
                                    {CREDIT_REQUEST_REASONS.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Pricing Summary */}
                            <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs text-slate-500">Credits</span>
                                    <span className="text-xs font-bold text-slate-800">{creditsRequested.toLocaleString()} CRD</span>
                                </div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs text-slate-500">Rate</span>
                                    <span className="text-xs font-bold text-slate-800">₹{selectedListing.pricePerCredit}/CRD</span>
                                </div>
                                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-700">Total</span>
                                    <span className="text-lg font-bold text-teal-700">₹{totalForBreakdown.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* ── Impact Breakdown ─────────────────────────────── */}
                            {creditsRequested > 0 && totalForBreakdown > 0 && (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 mb-5">
                                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <Sprout className="w-3 h-3" /> Impact Breakdown — Where Your Money Goes
                                    </p>
                                    <div className="space-y-2">
                                        {/* Farmer share */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                                <span className="text-xs text-emerald-800 font-medium">Direct to Farmers' Accounts</span>
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">80%</span>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-900">₹{farmerShare.toLocaleString()}</span>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-full h-1.5 bg-emerald-200 rounded-full">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }} />
                                        </div>

                                        {/* Platform fee */}
                                        <div className="flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
                                                <span className="text-xs text-slate-700 font-medium">Platform Tech & Ops Fee</span>
                                                <span className="text-[10px] font-bold text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded-full">15%</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-800">₹{platformFee.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-200 rounded-full">
                                            <div className="h-full bg-teal-400 rounded-full" style={{ width: '15%' }} />
                                        </div>

                                        {/* Audit fee */}
                                        <div className="flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                                                <span className="text-xs text-slate-700 font-medium">3rd Party Audit & Verification</span>
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">5%</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-800">₹{auditFee.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-200 rounded-full">
                                            <div className="h-full bg-indigo-400 rounded-full" style={{ width: '5%' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setSelectedListing(null); setError(''); }}
                                    className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBuy}
                                    disabled={isBuying || creditsRequested <= 0 || creditsRequested > selectedListing.availableCredits}
                                    className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-500 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 shadow-lg shadow-teal-500/20"
                                >
                                    {isBuying ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><ShoppingCart className="w-4 h-4" /> Confirm & Pay</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Unified Listings Grid ───────────────────────────────────────── */}
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-teal-600" /> All Carbon Projects
                </h2>

                {isLoading ? (
                    <div className="flex items-center justify-center p-16">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                ) : listings.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
                        <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No listings yet</h3>
                        <p className="text-sm text-slate-500">Carbon credit pools will appear here once communities and farmers list their verified credits.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.map((listing) => {
                            const isCommunity = listing.poolType === 'community';
                            const key = isCommunity ? listing.communityId : listing.userId;
                            const name = isCommunity ? listing.communityName : listing.farmerName;
                            const accent = isCommunity ? 'teal' : 'emerald';

                            return (
                                <div key={key} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group">
                                    <div className="p-5 sm:p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCommunity ? 'bg-teal-50 text-teal-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {isCommunity ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {/* Source badge */}
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isCommunity
                                                    ? 'bg-teal-50 text-teal-700 border border-teal-100'
                                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                    }`}>
                                                    {isCommunity ? '🏘 Community' : '🌾 Farmer'}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 uppercase tracking-wider">
                                                    ● Available
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900 mb-1">{name}</h3>
                                        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{listing.description || 'Verified carbon credits'}</p>

                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">Available Credits</p>
                                                <p className="text-sm font-bold text-slate-900">{listing.availableCredits.toLocaleString()} CRD</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">Price / CRD</p>
                                                <p className="text-sm font-bold text-slate-900">₹{listing.pricePerCredit}</p>
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-xl border mb-4 ${isCommunity ? 'bg-teal-50 border-teal-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                            <p className={`text-[9px] font-bold uppercase ${isCommunity ? 'text-teal-500' : 'text-emerald-500'}`}>Pool Value</p>
                                            <p className={`text-xl font-bold ${isCommunity ? 'text-teal-900' : 'text-emerald-900'}`}>₹{listing.totalValue.toLocaleString()}</p>
                                        </div>

                                        <div className="flex items-center gap-2 mb-4">
                                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                            <p className="text-[10px] text-slate-500 font-medium">
                                                {isCommunity ? 'Community Verified' : 'AI Verified'} · SHA-256 Audit Trail
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => openRequestForm(listing)}
                                            className={`w-full py-3 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg ${isCommunity
                                                ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-500/20'
                                                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                                                }`}
                                        >
                                            <TrendingUp className="w-4 h-4" /> Request Credits
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
