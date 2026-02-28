"use client";

import { useState, useRef, KeyboardEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    User, Building2, Leaf, FileText,
    ChevronRight, ChevronLeft, X, Plus,
    Upload, CheckCircle2, AlertCircle,
    MapPin, Loader2, Search, Satellite,
    ShieldCheck, Sparkles,
} from 'lucide-react';

/* ---- Dynamic Leaflet (no SSR) ---- */
const LeafletMap = dynamic(() => import('@/app/components/LeafletMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
    ),
});

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
type EntryStatus = 'individual' | 'community';
type SoilType = 'loam' | 'sandy' | 'clay' | 'alluvial' | 'black';

interface FormState {
    // Step 1
    entry_status: EntryStatus;
    communityId: string;
    community_name: string;
    aadhar_card_no: string;
    pan_card_no: string;
    // Step 2
    bank_account_no: string;
    IFSC_no: string;
    // Step 3
    practices: string[];
    urea_amount: string;
    soil_type: SoilType;
    current_crop: string[];
    previous_crop: string[];
    // Step 4
    lat: string;
    lng: string;
    landarea: string;
    previous_climate_land_data: File | null;
    soil_test_report: File | null;
}

interface FieldErrors { [key: string]: string; }

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */
const PRACTICE_OPTIONS = [
    'Cover Cropping', 'No-Till Farming', 'Agroforestry', 'Composting',
    'Crop Rotation', 'Mulching', 'Green Manure', 'Biochar Application',
    'Organic Farming', 'Rotational Grazing',
];

const SOIL_TYPES: { value: SoilType; label: string }[] = [
    { value: 'loam', label: 'Loam' },
    { value: 'sandy', label: 'Sandy' },
    { value: 'clay', label: 'Clay' },
    { value: 'alluvial', label: 'Alluvial' },
    { value: 'black', label: 'Black' },
];

const STEPS = [
    { label: 'Identity', icon: User },
    { label: 'Banking', icon: Building2 },
    { label: 'Farm Details', icon: Leaf },
    { label: 'Documents', icon: FileText },
];

/* ================================================================== */
/*  Main Component                                                      */
/* ================================================================== */
export default function ProfilePage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});

    /* ---- Community lookup state ---- */
    const [communityLookupId, setCommunityLookupId] = useState('');
    const [communityLookupStatus, setCommunityLookupStatus] = useState<
        'idle' | 'loading' | 'found' | 'not_found'
    >('idle');
    const [communityLookupError, setCommunityLookupError] = useState('');

    /* ---- Climate report state ---- */
    const [isGeneratingClimate, setIsGeneratingClimate] = useState(false);
    const [climateError, setClimateError] = useState('');
    const [climatePdfPreviewUrl, setClimatePdfPreviewUrl] = useState('');
    const [climateSource, setClimateSource] = useState<'gemini' | 'mock' | ''>('');

    /* ---- Map search state ---- */
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    const [form, setForm] = useState<FormState>({
        entry_status: 'individual',
        communityId: '', community_name: '',
        aadhar_card_no: '', pan_card_no: '',
        bank_account_no: '', IFSC_no: '',
        practices: [], urea_amount: '',
        soil_type: 'loam',
        current_crop: [], previous_crop: [],
        lat: '', lng: '', landarea: '',
        previous_climate_land_data: null,
        soil_test_report: null,
    });

    const currentCropRef = useRef<HTMLInputElement>(null);
    const previousCropRef = useRef<HTMLInputElement>(null);
    const climateFileRef = useRef<HTMLInputElement>(null);
    const soilFileRef = useRef<HTMLInputElement>(null);

    /* -------------------------------------------------------- helpers */
    const set = useCallback((field: keyof FormState, value: unknown) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }, []);

    const togglePractice = (p: string) => {
        setForm(prev => {
            const has = prev.practices.includes(p);
            const next = has ? prev.practices.filter(x => x !== p) : [...prev.practices, p];
            return { ...prev, practices: next };
        });
        setErrors(prev => { const n = { ...prev }; delete n.practices; return n; });
    };

    const addTag = (field: 'current_crop' | 'previous_crop', ref: React.RefObject<HTMLInputElement | null>) => {
        const val = ref.current?.value.trim();
        if (!val) return;
        setForm(prev => ({ ...prev, [field]: [...prev[field], val] }));
        setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        if (ref.current) ref.current.value = '';
    };

    const removeTag = (field: 'current_crop' | 'previous_crop', tag: string) =>
        setForm(prev => ({ ...prev, [field]: prev[field].filter(t => t !== tag) }));

    const handleTagKeyDown = (
        e: KeyboardEvent<HTMLInputElement>,
        field: 'current_crop' | 'previous_crop',
        ref: React.RefObject<HTMLInputElement | null>,
    ) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(field, ref); }
    };

    /* ---- Map location select ---- */
    const handleLocationSelect = useCallback((lat: number, lng: number) => {
        set('lat', lat.toFixed(6));
        set('lng', lng.toFixed(6));
        setClimateError('');
    }, [set]);

    /* ---- OpenStreetMap / Nominatim search ---- */
    const handleMapSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchError('');
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
                { headers: { 'User-Agent': 'Grento-App/1.0' } }
            );
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                set('lat', parseFloat(lat).toFixed(6));
                set('lng', parseFloat(lon).toFixed(6));
            } else {
                setSearchError('Location not found. Try a different search term.');
            }
        } catch {
            setSearchError('Search failed. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    /* ---- Community lookup ---- */
    const handleCommunityLookup = async () => {
        if (!communityLookupId.trim()) { setCommunityLookupError('Please enter a Community ID'); return; }
        setCommunityLookupStatus('loading');
        setCommunityLookupError('');
        try {
            const res = await fetch(`/api/community/getspecific_community?community_id=${encodeURIComponent(communityLookupId.trim())}`);
            const data = await res.json();
            if (res.ok && data.community) {
                const c = data.community;
                set('communityId', c.community_id);
                set('community_name', c.community_name);
                // Auto-select matching practices
                if (Array.isArray(c.community_practices) && c.community_practices.length > 0) {
                    const matched = c.community_practices.filter((p: string) => PRACTICE_OPTIONS.includes(p));
                    setForm(prev => ({ ...prev, practices: matched }));
                }
                setCommunityLookupStatus('found');
            } else {
                setCommunityLookupStatus('not_found');
                setCommunityLookupError(data.error || 'Community not found with that ID.');
            }
        } catch {
            setCommunityLookupStatus('not_found');
            setCommunityLookupError('Failed to verify community. Please try again.');
        }
    };

    /* ---- Climate report generation ---- */
    const handleGenerateClimateReport = async () => {
        if (!form.lat || !form.lng) {
            setClimateError('Please select your land location on the map first.');
            return;
        }
        setIsGeneratingClimate(true);
        setClimateError('');
        setClimatePdfPreviewUrl('');
        try {
            const res = await fetch('/api/ai/getclimatehistory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: parseFloat(form.lat), lng: parseFloat(form.lng) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to generate report');

            // Convert base64 to Blob → File → URL
            const byteChars = atob(data.pdf);
            const byteArr = new Uint8Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
            const blob = new Blob([byteArr], { type: 'application/pdf' });
            const file = new File([blob], data.filename || 'climate_report.pdf', { type: 'application/pdf' });

            set('previous_climate_land_data', file);
            const previewUrl = URL.createObjectURL(blob);
            setClimatePdfPreviewUrl(previewUrl);
            setClimateSource(data.source);
        } catch (err: any) {
            setClimateError(err.message || 'Failed to generate climate report.');
        } finally {
            setIsGeneratingClimate(false);
        }
    };

    /* ---- Validation ---- */
    const validate = (): boolean => {
        const e: FieldErrors = {};
        if (step === 0) {
            if (form.entry_status === 'community') {
                if (communityLookupStatus !== 'found') e.communityId = 'Please verify your Community ID before proceeding.';
            }
            if (!form.aadhar_card_no.trim()) e.aadhar_card_no = 'Aadhar card number is required';
            if (!form.pan_card_no.trim()) e.pan_card_no = 'PAN card number is required';
        }
        if (step === 1) {
            if (!form.bank_account_no.trim()) e.bank_account_no = 'Bank account number is required';
            if (!form.IFSC_no.trim()) e.IFSC_no = 'IFSC code is required';
        }
        if (step === 2) {
            if (form.practices.length === 0) e.practices = 'Select at least one practice';
            if (!form.urea_amount.trim()) e.urea_amount = 'Urea amount is required';
            if (form.current_crop.length === 0) e.current_crop = 'Add at least one current crop';
            if (form.previous_crop.length === 0) e.previous_crop = 'Add at least one previous crop';
        }
        if (step === 3) {
            if (!form.lat || !form.lng) e.lat = 'Please select your land location on the map';
            if (!form.landarea.trim() || isNaN(Number(form.landarea)) || Number(form.landarea) <= 0)
                e.landarea = 'Valid land area is required';
            if (!form.previous_climate_land_data) e.previous_climate_land_data = 'Climate land data file is required';
            if (!form.soil_test_report) e.soil_test_report = 'Soil test report file is required';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (validate()) setStep(s => s + 1); };
    const back = () => { setErrors({}); setStep(s => s - 1); };

    /* ---- Submission ---- */
    const handleSubmit = async () => {
        if (!validate()) return;
        setIsSubmitting(true);
        setSubmitError('');
        try {
            const fd = new FormData();
            fd.append('entry_status', form.entry_status);
            fd.append('aadhar_card_no', form.aadhar_card_no);
            fd.append('pan_card_no', form.pan_card_no);
            fd.append('bank_account_no', form.bank_account_no);
            fd.append('IFSC_no', form.IFSC_no);
            fd.append('practices', JSON.stringify(form.practices));
            fd.append('urea_amount', form.urea_amount);
            fd.append('soil_type', form.soil_type);
            fd.append('landarea', form.landarea);
            fd.append('lat', form.lat);
            fd.append('lng', form.lng);
            fd.append('current_crop', JSON.stringify(form.current_crop));
            fd.append('previous_crop', JSON.stringify(form.previous_crop));
            if (form.entry_status === 'community') {
                fd.append('communityId', form.communityId);
                fd.append('community_name', form.community_name);
            }
            fd.append('previous_climate_land_data', form.previous_climate_land_data as File);
            fd.append('soil_test_report', form.soil_test_report as File);

            const res = await fetch('/api/users/onboarding', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) { setSubmitError(data?.error || 'Something went wrong. Please try again.'); return; }
            setSubmitSuccess(true);
            setTimeout(() => router.push('/user/dashboard'), 2000);
        } catch {
            setSubmitError('Network error. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ---- Success Screen ---- */
    if (submitSuccess) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Profile Created!</h2>
                    <p className="text-slate-500 mb-4">Redirecting you to your dashboard…</p>
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
                </div>
            </div>
        );
    }

    /* ================================================================ */
    /*  Render                                                            */
    /* ================================================================ */
    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-slate-200 z-40">
                <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                            <Leaf className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-900 text-lg">Grento</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Seller Onboarding</span>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
                {/* Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900">Build Your Profile</h1>
                    <p className="text-slate-500 mt-1">Complete all 4 steps to start earning carbon credits.</p>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center gap-0 mb-10">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const done = i < step;
                        const active = i === step;
                        return (
                            <div key={i} className="flex items-center flex-1">
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${done ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' :
                                        active ? 'bg-slate-900 text-white shadow-md' :
                                            'bg-slate-100 text-slate-400'
                                        }`}>
                                        {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-[10px] font-bold mt-1.5 ${active ? 'text-slate-900' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-100 px-8 py-5">
                        <h2 className="text-lg font-bold text-slate-900">{STEPS[step].label}</h2>
                        <p className="text-sm text-slate-500">Step {step + 1} of {STEPS.length}</p>
                    </div>

                    <div className="p-8 space-y-7">

                        {/* ======== STEP 0 — Identity ======== */}
                        {step === 0 && (
                            <>
                                {/* Entry type */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3">Entry Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(['individual', 'community'] as EntryStatus[]).map(opt => (
                                            <button key={opt} type="button"
                                                onClick={() => {
                                                    set('entry_status', opt);
                                                    if (opt === 'individual') {
                                                        set('communityId', '');
                                                        set('community_name', '');
                                                        setCommunityLookupStatus('idle');
                                                        setCommunityLookupId('');
                                                    }
                                                }}
                                                className={`py-4 rounded-2xl border-2 font-bold capitalize text-sm transition-all ${form.entry_status === opt
                                                    ? 'border-slate-900 bg-slate-900 text-white'
                                                    : 'border-slate-200 text-slate-500 hover:border-slate-400'
                                                    }`}
                                            >
                                                {opt === 'individual' ? '👤 Individual' : '🏘️ Community'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Community lookup */}
                                {form.entry_status === 'community' && (
                                    <div className="space-y-3">
                                        <label className="block text-sm font-bold text-slate-700">Community ID</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Enter your Community ID"
                                                value={communityLookupId}
                                                onChange={e => { setCommunityLookupId(e.target.value); setCommunityLookupStatus('idle'); setCommunityLookupError(''); }}
                                                className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium text-slate-800 focus:outline-none transition-all placeholder:text-slate-300 ${errors.communityId ? 'border-red-300' : communityLookupStatus === 'found' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 focus:border-slate-900'
                                                    }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCommunityLookup}
                                                disabled={communityLookupStatus === 'loading'}
                                                className="px-5 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-700 transition-all disabled:opacity-60 flex items-center gap-2"
                                            >
                                                {communityLookupStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                                Verify
                                            </button>
                                        </div>

                                        {communityLookupStatus === 'found' && (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-bold text-emerald-800">Community Verified!</p>
                                                    <p className="text-xs text-emerald-700 mt-0.5">
                                                        <span className="font-semibold">{form.community_name}</span>
                                                        {form.practices.length > 0 && ` · ${form.practices.length} practice(s) auto-selected`}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {(communityLookupStatus === 'not_found' || communityLookupError) && (
                                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
                                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-sm text-red-700">{communityLookupError}</p>
                                            </div>
                                        )}
                                        {errors.communityId && <ErrorMsg msg={errors.communityId} />}
                                    </div>
                                )}

                                <FieldInput label="Aadhar Card Number" placeholder="XXXX XXXX XXXX"
                                    value={form.aadhar_card_no} onChange={v => set('aadhar_card_no', v)} error={errors.aadhar_card_no} />
                                <FieldInput label="PAN Card Number" placeholder="ABCDE1234F"
                                    value={form.pan_card_no} onChange={v => set('pan_card_no', v.toUpperCase())} error={errors.pan_card_no} />
                            </>
                        )}

                        {/* ======== STEP 1 — Banking ======== */}
                        {step === 1 && (
                            <>
                                <FieldInput label="Bank Account Number" placeholder="Enter your account number"
                                    value={form.bank_account_no} onChange={v => set('bank_account_no', v)} error={errors.bank_account_no} />
                                <FieldInput label="IFSC Code" placeholder="e.g. SBIN0001234"
                                    value={form.IFSC_no} onChange={v => set('IFSC_no', v.toUpperCase())} error={errors.IFSC_no} />
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700 flex gap-3">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                                    <span>Your banking details are encrypted and used only for carbon credit payouts. They are never shared with third parties.</span>
                                </div>
                            </>
                        )}

                        {/* ======== STEP 2 — Farm Details ======== */}
                        {step === 2 && (
                            <>
                                {/* Practices */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3">
                                        Farming Practices
                                        {form.entry_status === 'community' && form.practices.length > 0 && (
                                            <span className="ml-2 text-xs font-normal text-emerald-600">(auto-filled from community)</span>
                                        )}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {PRACTICE_OPTIONS.map(p => (
                                            <button key={p} type="button" onClick={() => togglePractice(p)}
                                                className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${form.practices.includes(p)
                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                                    : 'border-slate-200 text-slate-500 hover:border-emerald-400'
                                                    }`}>
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.practices && <ErrorMsg msg={errors.practices} />}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FieldInput label="Urea Amount (kg/acre)" placeholder="e.g. 50"
                                        value={form.urea_amount} onChange={v => set('urea_amount', v)} error={errors.urea_amount} />
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Soil Type</label>
                                        <select value={form.soil_type} onChange={e => set('soil_type', e.target.value as SoilType)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-medium text-sm focus:outline-none focus:border-slate-900 transition-all">
                                            {SOIL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <TagInput label="Current Crops" placeholder="Type crop & press Enter"
                                    tags={form.current_crop} inputRef={currentCropRef}
                                    onAdd={() => addTag('current_crop', currentCropRef)}
                                    onRemove={t => removeTag('current_crop', t)}
                                    onKeyDown={e => handleTagKeyDown(e, 'current_crop', currentCropRef)}
                                    error={errors.current_crop} />

                                <TagInput label="Previous Crops" placeholder="Type crop & press Enter"
                                    tags={form.previous_crop} inputRef={previousCropRef}
                                    onAdd={() => addTag('previous_crop', previousCropRef)}
                                    onRemove={t => removeTag('previous_crop', t)}
                                    onKeyDown={e => handleTagKeyDown(e, 'previous_crop', previousCropRef)}
                                    error={errors.previous_crop} />
                            </>
                        )}

                        {/* ======== STEP 3 — Documents & Location ======== */}
                        {step === 3 && (
                            <>
                                {/* Map Section */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-emerald-600" />
                                        Land Location
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3">Search for your village/district or click directly on the map to pin your land location.</p>

                                    {/* Search bar */}
                                    <div className="flex gap-2 mb-3">
                                        <input type="text" placeholder="Search location (e.g. Nashik, Maharashtra)"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleMapSearch(); }}
                                            className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-slate-900 transition-all placeholder:text-slate-300"
                                        />
                                        <button type="button" onClick={handleMapSearch} disabled={isSearching}
                                            className="px-4 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-700 transition-all disabled:opacity-60 flex items-center gap-2">
                                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                            Search
                                        </button>
                                    </div>
                                    {searchError && <ErrorMsg msg={searchError} />}

                                    {/* Map */}
                                    <div className={`h-80 rounded-2xl overflow-hidden border-2 transition-all ${errors.lat ? 'border-red-300' : 'border-slate-200'}`}>
                                        <LeafletMap
                                            lat={form.lat ? parseFloat(form.lat) : null}
                                            lng={form.lng ? parseFloat(form.lng) : null}
                                            onLocationSelect={handleLocationSelect}
                                        />
                                    </div>

                                    {/* Coord display */}
                                    <div className="mt-2 flex gap-2">
                                        <div className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-mono ${form.lat ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-400'}`}>
                                            {form.lat ? `Lat: ${form.lat}` : 'Latitude — not set'}
                                        </div>
                                        <div className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-mono ${form.lng ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-400'}`}>
                                            {form.lng ? `Lng: ${form.lng}` : 'Longitude — not set'}
                                        </div>
                                    </div>
                                    {errors.lat && <ErrorMsg msg={errors.lat} />}
                                </div>

                                {/* Land area */}
                                <FieldInput label="Land Area (in acres)" placeholder="e.g. 2.5" type="number"
                                    value={form.landarea} onChange={v => set('landarea', v)} error={errors.landarea} />

                                {/* Climate Report */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Satellite className="w-4 h-4 text-indigo-500" />
                                        Previous Climate &amp; Land Data
                                    </label>
                                    <p className="text-xs text-slate-500 mb-3">Generate your location's historical climate report automatically, or upload manually.</p>

                                    {/* Generate button */}
                                    <button type="button" onClick={handleGenerateClimateReport}
                                        disabled={isGeneratingClimate || !form.lat || !form.lng}
                                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4">
                                        {isGeneratingClimate ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Generating Climate Report via AI…</>
                                        ) : (
                                            <><Sparkles className="w-4 h-4" /> Generate Climate Report</>
                                        )}
                                    </button>

                                    {climateError && (
                                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-sm text-red-700 mb-4">
                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {climateError}
                                        </div>
                                    )}

                                    {/* PDF Preview */}
                                    {climatePdfPreviewUrl && (
                                        <div className="mb-4 rounded-2xl overflow-hidden border-2 border-emerald-300 bg-emerald-50">
                                            <div className="px-4 py-2 bg-emerald-600 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                    <span className="text-white text-xs font-bold">Climate Report Generated</span>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${climateSource === 'gemini' ? 'bg-white/20 text-white' : 'bg-amber-400/80 text-amber-900'}`}>
                                                    {climateSource === 'gemini' ? 'AI' : 'Reference Data'}
                                                </span>
                                            </div>
                                            <iframe
                                                src={climatePdfPreviewUrl}
                                                className="w-full h-64"
                                                title="Climate Report Preview"
                                            />
                                            <p className="px-4 py-2 text-xs text-emerald-700 font-medium">
                                                ✅ Auto-filled as climate land data file. You may still override below.
                                            </p>
                                        </div>
                                    )}

                                    {/* Manual upload (always available) */}
                                    <FileUploadField
                                        label={climatePdfPreviewUrl ? 'Override Climate Report (optional)' : 'Upload Manually'}
                                        hint="PDF, CSV, JPG, or PNG of your land's historical climate record"
                                        file={form.previous_climate_land_data}
                                        onChange={files => { if (files?.[0]) { set('previous_climate_land_data', files[0]); setClimatePdfPreviewUrl(''); } }}
                                        error={errors.previous_climate_land_data}
                                        optional={!!climatePdfPreviewUrl}
                                    />
                                </div>

                                {/* Soil Test Report */}
                                <FileUploadField
                                    label="Soil Test Report"
                                    hint="Upload a PDF, image, or CSV of your latest soil test"
                                    file={form.soil_test_report}
                                    onChange={files => { if (files?.[0]) set('soil_test_report', files[0]); }}
                                    error={errors.soil_test_report}
                                />

                                {submitError && (
                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-sm text-red-700">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" /> {submitError}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer navigation */}
                    <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                        <button type="button" onClick={back} disabled={step === 0}
                            className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>

                        {step < STEPS.length - 1 ? (
                            <button type="button" onClick={next}
                                className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-700 transition-all shadow-sm">
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-500 transition-all shadow-sm shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed">
                                {isSubmitting
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                                    : <><CheckCircle2 className="w-4 h-4" /> Create Profile</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                       */
/* ------------------------------------------------------------------ */
function FieldInput({ label, placeholder, value, onChange, error, type = 'text' }: {
    label: string; placeholder?: string; value: string;
    onChange: (v: string) => void; error?: string; type?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
            <input type={type} placeholder={placeholder} value={value}
                onChange={e => onChange(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium text-slate-800 focus:outline-none transition-all placeholder:text-slate-300 ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-slate-900'}`} />
            {error && <ErrorMsg msg={error} />}
        </div>
    );
}

function TagInput({ label, placeholder, tags, inputRef, onAdd, onRemove, onKeyDown, error }: {
    label: string; placeholder?: string; tags: string[];
    inputRef: React.RefObject<HTMLInputElement | null>;
    onAdd: () => void; onRemove: (t: string) => void;
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void; error?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
            <div className={`min-h-[52px] w-full px-3 py-2 rounded-xl border-2 flex flex-wrap gap-2 items-center transition-all ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 focus-within:border-slate-900'}`}>
                {tags.map(t => (
                    <span key={t} className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full">
                        {t}
                        <button type="button" onClick={() => onRemove(t)} className="hover:text-red-600 transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                ))}
                <div className="flex items-center gap-1 flex-1 min-w-32">
                    <input ref={inputRef} type="text" placeholder={placeholder} onKeyDown={onKeyDown}
                        className="flex-1 text-sm font-medium text-slate-800 focus:outline-none bg-transparent placeholder:text-slate-300" />
                    <button type="button" onClick={onAdd} className="p-0.5 text-slate-400 hover:text-emerald-600 transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Press Enter or comma to add</p>
            {error && <ErrorMsg msg={error} />}
        </div>
    );
}

function FileUploadField({ label, hint, file, onChange, error, optional = false }: {
    label: string; hint?: string; file: File | null;
    onChange: (files: FileList | null) => void; error?: string; optional?: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
                {label}
                {optional && <span className="ml-1 text-xs font-normal text-slate-400">(optional — AI report already filled)</span>}
            </label>
            <div onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer w-full border-2 border-dashed rounded-2xl p-5 text-center transition-all hover:border-slate-400 ${file ? 'border-emerald-400 bg-emerald-50' : error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                <input ref={inputRef} type="file" accept=".pdf,.csv,.jpg,.jpeg,.png"
                    onChange={e => onChange(e.target.files)} className="sr-only" />
                {file ? (
                    <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                        <p className="text-sm font-bold text-emerald-700">{file.name}</p>
                        <p className="text-xs text-emerald-500">{(file.size / 1024).toFixed(1)} KB — click to replace</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Upload className="w-7 h-7" />
                        <p className="text-sm font-bold text-slate-600">Click to upload</p>
                        {hint && <p className="text-xs">{hint}</p>}
                        <p className="text-[10px] text-slate-300 mt-1">PDF, CSV, JPG, PNG</p>
                    </div>
                )}
            </div>
            {error && <ErrorMsg msg={error} />}
        </div>
    );
}

function ErrorMsg({ msg }: { msg: string }) {
    return (
        <p className="flex items-center gap-1 text-xs text-red-500 font-semibold mt-1.5">
            <AlertCircle className="w-3 h-3 shrink-0" /> {msg}
        </p>
    );
}
