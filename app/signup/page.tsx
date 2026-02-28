"use client";

import Link from 'next/link';
import { ArrowLeft, Loader2, Leaf, Eye, EyeOff } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Signup() {
    const containerRef = useRef(null);
    const router = useRouter();
    const [role, setRole] = useState<'individual' | 'communityadmin' | 'company'>('individual');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        username: '', userId: '', phone: '', email: '',
        companyName: '', companyEmail: '', companyId: '', companyPhone: '',
        password: '', confirmPassword: '', referralCode: '',
    });

    useGSAP(() => {
        gsap.from('.signup-content', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.2 });
        gsap.from('.signup-image', { scale: 1.1, duration: 1.5, ease: 'power2.out' });
    }, { scope: containerRef });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        const registrationData = (role === 'individual' || role === 'communityadmin')
            ? {
                role, username: formData.username, userId: formData.userId,
                phone: formData.phone, email: formData.email, password: formData.password,
                ...(formData.referralCode.trim() ? { referralCode: formData.referralCode.trim() } : {})
            }
            : {
                role, companyName: formData.companyName, companyEmail: formData.companyEmail,
                companyId: formData.companyId, companyPhone: formData.companyPhone, password: formData.password
            };

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registrationData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');
            if (role === 'individual') router.push('/user/dashboard');
            else if (role === 'communityadmin') router.push('/community/dashboard');
            else router.push('/company/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const roleLabels: Record<string, string> = {
        individual: 'Farmer',
        communityadmin: 'Aggregator',
        company: 'Company',
    };

    const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all bg-slate-50 focus:bg-white text-sm";

    return (
        <div ref={containerRef} className="min-h-screen flex bg-white overflow-hidden">
            {/* Left — Enhanced Image Panel */}
            <div className="hidden lg:block w-1/2 relative overflow-hidden bg-emerald-950">
                <img
                    src="/greensignup.jpg"
                    alt="Sustainable Energy Landscape"
                    className="signup-image absolute inset-0 w-full h-full object-cover opacity-80"
                />
                {/* Visual Overlay Layer */}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-slate-900/40 to-transparent backdrop-blur-[1px]" />
                
                <div className="relative h-full flex flex-col justify-between p-12 xl:p-16 text-white z-10">
                    <Link href="/" className="flex items-center gap-2 hover:text-emerald-300 transition-all w-fit text-sm font-semibold drop-shadow-md">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    
                    <div className="signup-content max-w-lg">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center shadow-xl">
                                <Leaf className="w-6 h-6 text-emerald-300" />
                            </div>
                            <span className="font-bold text-2xl tracking-tight drop-shadow-lg">Carbon<span className="text-emerald-400">Credit</span></span>
                        </div>
                        
                        <h2 className="text-4xl xl:text-5xl font-extrabold mb-6 tracking-tight leading-[1.1] drop-shadow-2xl">
                            A greener future <br />
                            <span className="text-emerald-400">starts with you.</span>
                        </h2>
                        
                        <p className="text-lg text-emerald-50/90 leading-relaxed font-medium max-w-md drop-shadow-md">
                            Join India&apos;s leading carbon credit platform. Empowering farmers, aggregators, and corporations to build a sustainable tomorrow.
                        </p>
                    </div>

                    <div className="signup-content flex items-center gap-4 text-emerald-200/60 text-xs font-medium uppercase tracking-[0.2em]">
                        <span>Secure Registration</span>
                        <div className="w-8 h-[1px] bg-emerald-200/30" />
                        <span>Sustainability Verified</span>
                    </div>
                </div>
            </div>

            {/* Right — Form Panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12 lg:p-16 bg-white overflow-y-auto">
                <div className="max-w-md w-full signup-content">
                    {/* Mobile brand (Visible only on small screens) */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl text-slate-900">Carbon<span className="text-teal-600">Credit</span></span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Create Account</h1>
                        <p className="text-slate-500 text-sm">Fill in the details to start your journey.</p>
                    </div>

                    {/* Role Selector */}
                    <div className="flex p-1 bg-slate-100/80 rounded-2xl mb-8 border border-slate-200/50">
                        {(['individual', 'communityadmin', 'company'] as const).map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRole(r)}
                                className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${role === r
                                    ? 'bg-white text-teal-600 shadow-md ring-1 ring-black/5'
                                    : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                {roleLabels[r]}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl font-medium animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4 text-slate-900">
                        {(role === 'individual' || role === 'communityadmin') ? (
                            <>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">Username</label>
                                    <input type="text" name="username" required value={formData.username} onChange={handleChange} className={inputCls} placeholder="johndoe" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">User ID</label>
                                    <input type="text" name="userId" required value={formData.userId} onChange={handleChange} className={inputCls} placeholder="USER123" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">Phone</label>
                                        <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className={inputCls} placeholder="+91 98765 43210" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">Email</label>
                                        <input type="email" name="email" required value={formData.email} onChange={handleChange} className={inputCls} placeholder="you@example.com" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">
                                        Referral Code <span className="text-slate-300 font-normal normal-case">(optional)</span>
                                    </label>
                                    <input type="text" name="referralCode" value={formData.referralCode} onChange={handleChange} className={`${inputCls} font-mono tracking-widest uppercase`} placeholder="PROMO2024" maxLength={20} />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">Company Name</label>
                                    <input type="text" name="companyName" required value={formData.companyName} onChange={handleChange} className={inputCls} placeholder="Acme Sustainability Corp" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">Company ID</label>
                                        <input type="text" name="companyId" required value={formData.companyId} onChange={handleChange} className={inputCls} placeholder="CORP123" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">Phone</label>
                                        <input type="tel" name="companyPhone" required value={formData.companyPhone} onChange={handleChange} className={inputCls} placeholder="+91 98765 43210" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">Company Email</label>
                                    <input type="email" name="companyEmail" required value={formData.companyEmail} onChange={handleChange} className={inputCls} placeholder="contact@acme.com" />
                                </div>
                            </>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">Password</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={inputCls}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-[34px] text-slate-400 hover:text-teal-600 transition-colors p-1 rounded-md"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 ml-1">Confirm</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={inputCls}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 py-2">
                            <input type="checkbox" required className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
                            <span className="text-slate-500 text-xs">
                                I agree to the <a href="#" className="text-teal-600 hover:underline font-semibold">Terms of Service</a>
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-500 transition-all shadow-xl shadow-teal-600/20 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Processing...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link href="/login" className="text-teal-600 hover:text-teal-700 font-bold ml-1 transition-colors">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}