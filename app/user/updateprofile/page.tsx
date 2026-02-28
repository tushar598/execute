"use client";

import { useEffect, useState, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
    Leaf, Save, Loader2, CheckCircle2, AlertCircle,
    ArrowLeft, X, Plus, User,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
type SoilType = 'loam' | 'sandy' | 'clay' | 'alluvial' | 'black';

interface ProfileForm {
    aadhar_card_no: string;
    pan_card_no: string;
    bank_account_no: string;
    IFSC_no: string;
    urea_amount: string;
    soil_type: SoilType;
    landarea: string;
    practices: string[];
    current_crop: string[];
    previous_crop: string[];
    lat: string;
    lng: string;
}

interface FieldErrors { [key: string]: string; }

const PRACTICE_OPTIONS = [
    'Cover Cropping', 'No-Till Farming', 'Agroforestry', 'Composting',
    'Crop Rotation', 'Mulching', 'Green Manure', 'Biochar Application',
    'Organic Farming', 'Rotational Grazing',
];

const SOIL_TYPES: { value: SoilType; label: string }[] = [
    { value: 'loam', label: 'Loam' }, { value: 'sandy', label: 'Sandy' },
    { value: 'clay', label: 'Clay' }, { value: 'alluvial', label: 'Alluvial' },
    { value: 'black', label: 'Black' },
];

/* ================================================================== */
export default function UpdateProfilePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [errors, setErrors] = useState<FieldErrors>({});

    const [form, setForm] = useState<ProfileForm>({
        aadhar_card_no: '', pan_card_no: '',
        bank_account_no: '', IFSC_no: '',
        urea_amount: '', soil_type: 'loam',
        landarea: '', practices: [],
        current_crop: [], previous_crop: [],
        lat: '', lng: '',
    });

    const currentCropRef = useRef<HTMLInputElement>(null);
    const previousCropRef = useRef<HTMLInputElement>(null);

    /* Fetch existing profile to pre-fill */
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/users/getprofile');
                if (res.ok) {
                    const { profile } = await res.json();
                    setForm({
                        aadhar_card_no: profile.aadhar_card_no ?? '',
                        pan_card_no: profile.pan_card_no ?? '',
                        bank_account_no: profile.bank_account_no ?? '',
                        IFSC_no: profile.IFSC_no ?? '',
                        urea_amount: profile.urea_amount ?? '',
                        soil_type: profile.soil_type ?? 'loam',
                        landarea: profile.landarea?.toString() ?? '',
                        practices: profile.practices ?? [],
                        current_crop: profile.current_crop ?? [],
                        previous_crop: profile.previous_crop ?? [],
                        lat: profile.landlocation?.lat?.toString() ?? '',
                        lng: profile.landlocation?.lng?.toString() ?? '',
                    });
                }
            } catch { /* form still usable if fetch fails */ }
            finally { setIsLoading(false); }
        };
        load();
    }, []);

    /* Helpers */
    const set = (field: keyof ProfileForm, value: unknown) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const togglePractice = (p: string) =>
        setForm(prev => ({
            ...prev,
            practices: prev.practices.includes(p)
                ? prev.practices.filter(x => x !== p)
                : [...prev.practices, p],
        }));

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
        ref: React.RefObject<HTMLInputElement | null>
    ) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(field, ref); }
    };

    /* Validate */
    const validate = (): boolean => {
        const e: FieldErrors = {};
        if (!form.bank_account_no.trim()) e.bank_account_no = 'Bank account number is required';
        if (!form.IFSC_no.trim()) e.IFSC_no = 'IFSC code is required';
        if (form.practices.length === 0) e.practices = 'Select at least one practice';
        if (!form.urea_amount.trim()) e.urea_amount = 'Urea amount is required';
        if (form.current_crop.length === 0) e.current_crop = 'Add at least one current crop';
        if (form.previous_crop.length === 0) e.previous_crop = 'Add at least one previous crop';
        if (form.landarea && (isNaN(Number(form.landarea)) || Number(form.landarea) <= 0))
            e.landarea = 'Land area must be a positive number';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    /* Submit */
    const handleSave = async () => {
        if (!validate()) return;
        setIsSaving(true);
        setSaveError('');
        try {
            const fd = new FormData();
            const textFields: (keyof ProfileForm)[] = [
                'aadhar_card_no', 'pan_card_no', 'bank_account_no', 'IFSC_no',
                'urea_amount', 'soil_type', 'landarea',
            ];
            textFields.forEach(f => { if ((form[f] as string).trim()) fd.append(f, form[f] as string); });
            if (form.lat.trim()) fd.append('lat', form.lat);
            if (form.lng.trim()) fd.append('lng', form.lng);
            if (form.practices.length) fd.append('practices', JSON.stringify(form.practices));
            if (form.current_crop.length) fd.append('current_crop', JSON.stringify(form.current_crop));
            if (form.previous_crop.length) fd.append('previous_crop', JSON.stringify(form.previous_crop));

            const res = await fetch('/api/users/updateprofile', { method: 'PATCH', body: fd });
            const data = await res.json();
            if (!res.ok) { setSaveError(data?.error || 'Failed to update profile. Please try again.'); return; }
            setSaveSuccess(true);
            setTimeout(() => router.push('/user/dashboard'), 1800);
        } catch {
            setSaveError('Network error. Please check your connection.');
        } finally {
            setIsSaving(false);
        }
    };

    /* Success screen */
    if (saveSuccess) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Profile Updated!</h2>
                    <p className="text-slate-500 mb-4">Redirecting to dashboard…</p>
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
                </div>
            </div>
        );
    }

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
                    <button onClick={() => router.push('/user/dashboard')}
                        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <User className="w-8 h-8 text-indigo-500" /> Update Profile
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Edit your agricultural and banking details. All fields are optional — only filled fields will be updated.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                        <span className="ml-3 text-slate-500 font-medium">Loading your profile…</span>
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* KYC */}
                        {/* <Section title="Identity & KYC" icon="🪪">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FieldInput label="Aadhar Card Number" placeholder="XXXX XXXX XXXX"
                                    value={form.aadhar_card_no} onChange={v => set('aadhar_card_no', v)} />
                                <FieldInput label="PAN Card Number" placeholder="ABCDE1234F"
                                    value={form.pan_card_no} onChange={v => set('pan_card_no', v.toUpperCase())} />
                            </div>
                        </Section> */}

                        {/* Banking */}
                        <Section title="Banking Details" icon="🏦">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FieldInput label="Bank Account Number" placeholder="Enter account number"
                                    value={form.bank_account_no} onChange={v => set('bank_account_no', v)} error={errors.bank_account_no} />
                                <FieldInput label="IFSC Code" placeholder="e.g. SBIN0001234"
                                    value={form.IFSC_no} onChange={v => set('IFSC_no', v.toUpperCase())} error={errors.IFSC_no} />
                            </div>
                        </Section>

                        {/* Farm Details */}
                        <Section title="Farm Details" icon="🌾">
                            {/* Practices */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Farming Practices</label>
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

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <FieldInput label="Urea Amount (kg/acre)" placeholder="e.g. 50"
                                    value={form.urea_amount} onChange={v => set('urea_amount', v)} error={errors.urea_amount} />
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Soil Type</label>
                                    <select value={form.soil_type} onChange={e => set('soil_type', e.target.value as SoilType)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-medium text-sm focus:outline-none focus:border-slate-900 transition-all">
                                        {SOIL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <FieldInput label="Land Area (acres)" type="number" placeholder="e.g. 2.5"
                                    value={form.landarea} onChange={v => set('landarea', v)} error={errors.landarea} />
                            </div>

                            {/* GPS */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Land Location (GPS)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="number" step="any" placeholder="Latitude (e.g. 18.52)"
                                        value={form.lat} onChange={e => set('lat', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-slate-900 transition-all placeholder:text-slate-300" />
                                    <input type="number" step="any" placeholder="Longitude (e.g. 73.86)"
                                        value={form.lng} onChange={e => set('lng', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-slate-900 transition-all placeholder:text-slate-300" />
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
                        </Section>

                        {/* Error */}
                        {saveError && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-sm text-red-700">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" /> {saveError}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                            <button onClick={() => router.push('/user/dashboard')}
                                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all">
                                <ArrowLeft className="w-4 h-4" /> Cancel
                            </button>
                            <button onClick={handleSave} disabled={isSaving}
                                className="flex items-center gap-2 px-10 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed">
                                {isSaving
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                                    : <><Save className="w-4 h-4" /> Save Changes</>}
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <h2 className="text-base font-bold text-slate-900">{title}</h2>
            </div>
            <div className="p-8 space-y-5">{children}</div>
        </div>
    );
}

function FieldInput({ label, placeholder, value, onChange, error, type = 'text' }: {
    label: string; placeholder?: string; value: string;
    onChange: (v: string) => void; error?: string; type?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
            <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
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
                        <button type="button" onClick={() => onRemove(t)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                    </span>
                ))}
                <div className="flex items-center gap-1 flex-1 min-w-32">
                    <input ref={inputRef} type="text" placeholder={placeholder} onKeyDown={onKeyDown}
                        className="flex-1 text-sm font-medium text-slate-800 focus:outline-none bg-transparent placeholder:text-slate-300" />
                    <button type="button" onClick={onAdd} className="p-0.5 text-slate-400 hover:text-emerald-600"><Plus className="w-4 h-4" /></button>
                </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Press Enter or comma to add</p>
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
