"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Sun, MapPin, FileText, CreditCard, ChevronRight, ChevronLeft,
    CheckCircle, Loader2, AlertCircle, Upload, Search
} from 'lucide-react';

const STEPS = [
    { title: 'Location', icon: MapPin, desc: 'Address & coordinates' },
    { title: 'Meter & Bill', icon: FileText, desc: 'Meter number & electricity bill' },
    { title: 'Bank Details', icon: CreditCard, desc: 'Payment information' },
];

export default function SolarBuyerOnboarding() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [address, setAddress] = useState('');
    const [state, setState] = useState('');
    const [lat, setLat] = useState<number>(20.5937);
    const [lng, setLng] = useState<number>(78.9629);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const [digitalMeterNumber, setDigitalMeterNumber] = useState('');
    const [electricityBill, setElectricityBill] = useState<File | null>(null);
    const [bankAccountNo, setBankAccountNo] = useState('');
    const [IFSCNo, setIFSCNo] = useState('');
    const [aadharCardNo, setAadharCardNo] = useState('');
    const [panCardNo, setPanCardNo] = useState('');

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch('/api/solar/profile');
                if (res.ok) {
                    const data = await res.json();
                    if (data.profile?.hasdone_process) router.push('/solar/buyer/dashboard');
                }
            } catch { }
        };
        check();
    }, [router]);

    useEffect(() => {
        if (step !== 0 || !mapContainerRef.current) return;
        const initMap = async () => {
            const L = (await import('leaflet')).default;
            // @ts-ignore
            await import('leaflet/dist/leaflet.css');
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

            const map = L.map(mapContainerRef.current!, { scrollWheelZoom: true }).setView([lat, lng], 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
            const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
            marker.on('dragend', () => { const p = marker.getLatLng(); setLat(p.lat); setLng(p.lng); reverseGeocode(p.lat, p.lng); });
            map.on('click', (e: any) => { marker.setLatLng(e.latlng); setLat(e.latlng.lat); setLng(e.latlng.lng); reverseGeocode(e.latlng.lat, e.latlng.lng); });
            mapRef.current = map; markerRef.current = marker;
            setTimeout(() => map.invalidateSize(), 200);
        };
        initMap();
        return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    }, [step]);

    const reverseGeocode = async (latitude: number, longitude: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            if (data.display_name) setAddress(data.display_name);
            if (data.address?.state) setState(data.address.state);
        } catch { }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=in`);
            const data = await res.json();
            if (data.length > 0) {
                const { lat: nLat, lon: nLng, display_name } = data[0];
                setLat(parseFloat(nLat)); setLng(parseFloat(nLng)); setAddress(display_name);
                if (mapRef.current && markerRef.current) { mapRef.current.setView([parseFloat(nLat), parseFloat(nLng)], 14); markerRef.current.setLatLng([parseFloat(nLat), parseFloat(nLng)]); }
                const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${nLat}&lon=${nLng}&format=json`);
                const revData = await revRes.json();
                if (revData.address?.state) setState(revData.address.state);
            }
        } catch { }
        setIsSearching(false);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true); setError('');
        try {
            const fd = new FormData();
            fd.append('address', address); fd.append('lat', String(lat)); fd.append('lng', String(lng)); fd.append('state', state);
            fd.append('digitalMeterNumber', digitalMeterNumber); fd.append('bankAccountNo', bankAccountNo);
            fd.append('IFSCNo', IFSCNo); fd.append('aadharCardNo', aadharCardNo); fd.append('panCardNo', panCardNo);
            if (electricityBill) fd.append('electricityBill', electricityBill);
            const res = await fetch('/api/solar/onboarding', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Onboarding failed');
            setSuccess(true);
            setTimeout(() => router.push('/solar/buyer/dashboard'), 2000);
        } catch (err: any) { setError(err.message); } finally { setIsSubmitting(false); }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <CheckCircle className="w-8 h-8 text-orange-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Buyer Profile Created!</h2>
                    <p className="text-sm text-slate-500">Redirecting to dashboard…</p>
                </div>
            </div>
        );
    }

    const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-slate-50 focus:bg-white text-sm text-slate-900";
    const labelCls = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5";

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/25">
                            <Sun className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-slate-900 text-lg">Grento</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Buyer Onboarding</span>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-20">
                <div className="flex items-center justify-between mb-8">
                    {STEPS.map((s, i) => (
                        <div key={i} className="flex items-center flex-1">
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-xs font-bold ${i === step ? 'bg-orange-50 text-orange-700 border border-orange-200' : i < step ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {i < step ? <CheckCircle className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                                <span className="hidden sm:inline">{s.title}</span>
                            </div>
                            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-1">{STEPS[step].title}</h2>
                    <p className="text-sm text-slate-500 mb-6">{STEPS[step].desc}</p>

                    {step === 0 && (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search location in India…" className={inputCls} />
                                <button onClick={handleSearch} disabled={isSearching} className="px-4 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-400 transition-all disabled:opacity-50 shrink-0">
                                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                </button>
                            </div>
                            <div ref={mapContainerRef} className="h-64 rounded-xl border border-slate-200 overflow-hidden z-0" />
                            <div><label className={labelCls}>Address</label><textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className={inputCls} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={labelCls}>State</label><input value={state} onChange={e => setState(e.target.value)} className={inputCls} /></div>
                                <div><label className={labelCls}>Coordinates</label><input value={`${lat.toFixed(4)}, ${lng.toFixed(4)}`} readOnly className={`${inputCls} bg-slate-100`} /></div>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <div><label className={labelCls}>Digital Meter Number</label><input value={digitalMeterNumber} onChange={e => setDigitalMeterNumber(e.target.value)} placeholder="e.g. DM-2024-78901" className={inputCls} /></div>
                            <div>
                                <label className={labelCls}>Electricity Bill (PDF)</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-orange-300 transition-colors">
                                    <input type="file" accept=".pdf" onChange={e => setElectricityBill(e.target.files?.[0] || null)} className="hidden" id="billUpload" />
                                    <label htmlFor="billUpload" className="cursor-pointer">
                                        <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-slate-500">{electricityBill ? electricityBill.name : 'Click to upload PDF'}</p>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={labelCls}>Aadhar Card Number</label><input value={aadharCardNo} onChange={e => setAadharCardNo(e.target.value)} placeholder="XXXX XXXX XXXX" className={inputCls} /></div>
                                <div><label className={labelCls}>PAN Card Number</label><input value={panCardNo} onChange={e => setPanCardNo(e.target.value)} placeholder="ABCDE1234F" className={inputCls} /></div>
                            </div>
                            <div><label className={labelCls}>Bank Account Number</label><input value={bankAccountNo} onChange={e => setBankAccountNo(e.target.value)} className={inputCls} /></div>
                            <div><label className={labelCls}>IFSC Code</label><input value={IFSCNo} onChange={e => setIFSCNo(e.target.value)} placeholder="e.g. SBIN0001234" className={inputCls} /></div>
                        </div>
                    )}

                    <div className="flex justify-between mt-8">
                        {step > 0 ? (
                            <button onClick={() => { setStep(s => s - 1); setError(''); }} className="flex items-center gap-2 px-5 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm">
                                <ChevronLeft className="w-4 h-4" /> Back
                            </button>
                        ) : <div />}
                        {step < STEPS.length - 1 ? (
                            <button onClick={() => setStep(s => s + 1)} className="flex items-center gap-2 px-5 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-500 transition-all text-sm shadow-lg shadow-orange-500/20">
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-500 transition-all text-sm shadow-lg shadow-orange-500/20 disabled:opacity-50">
                                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle className="w-4 h-4" /> Complete Setup</>}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
