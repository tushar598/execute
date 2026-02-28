"use client";

import Link from 'next/link';
import { ArrowLeft, Loader2, Leaf, Eye, EyeOff } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
    const containerRef = useRef(null);
    const router = useRouter();
    const [role, setRole] = useState<'individual' | 'communityadmin' | 'company'>('individual');
    const [tradingMode, setTradingMode] = useState<'credits' | 'tokens'>('credits');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    const mode = data.tradingMode || 'credits';
                    if (data.role === 'individual') {
                        router.push(mode === 'tokens' ? '/solar/seller/dashboard' : '/user/dashboard');
                    } else if (data.role === 'communityadmin') {
                        router.push('/community/dashboard');
                    } else if (data.role === 'company') {
                        router.push(mode === 'tokens' ? '/solar/buyer/dashboard' : '/company/dashboard');
                    }
                }
            } catch (err) {
                console.error('Auth check failed:', err);
            }
        };
        checkAuth();
    }, [router]);

    useGSAP(() => {
        gsap.from('.login-content', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.2 });
        gsap.from('.login-image', { scale: 1.1, duration: 1.5, ease: 'power2.out' });
    }, { scope: containerRef });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, identifier, password, tradingMode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            if (role === "individual") {
                router.push(tradingMode === 'tokens' ? '/solar/seller/dashboard' : '/user/dashboard');
            } else if (role === "communityadmin") {
                router.push('/community/dashboard');
            } else {
                router.push(tradingMode === 'tokens' ? '/solar/buyer/dashboard' : '/company/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const roleLabels: Record<string, string> = {
        individual: 'Seller',
        communityadmin: 'Aggregator',
        company: 'Buyer',
    };

    const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all bg-slate-50 focus:bg-white text-sm text-slate-900";

    return (
        <div ref={containerRef} className="min-h-screen flex bg-white text-slate-900 overflow-hidden">
            {/* Left — Enhanced Image Panel */}
            <div className="hidden lg:block w-1/2 relative overflow-hidden bg-teal-950">
                <img
                    src="/greensignin.jpg"
                    alt="Sustainable Agriculture"
                    className="login-image absolute inset-0 w-full h-full object-cover opacity-80"
                />
                {/* Visual Overlay Layer */}
                <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-slate-900/40 to-transparent backdrop-blur-[1px]" />
                
                <div className="relative h-full flex flex-col justify-between p-12 xl:p-16 text-white z-10">
                    <Link href="/" className="flex items-center gap-2 hover:text-emerald-300 transition-all w-fit text-sm font-semibold drop-shadow-md">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    
                    <div className="login-content max-w-md">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center shadow-xl">
                                <Leaf className="w-6 h-6 text-emerald-300" />
                            </div>
                            <span className="font-bold text-2xl tracking-tight drop-shadow-lg">Carbon<span className="text-emerald-400">Credit</span></span>
                        </div>
                        
                        <h2 className="text-4xl xl:text-5xl font-extrabold mb-6 tracking-tight leading-[1.1] drop-shadow-2xl">
                            Offset carbon. <br />
                            <span className="text-emerald-400">Empower sellers.</span>
                        </h2>
                        
                        <p className="text-lg text-emerald-50/90 leading-relaxed font-medium drop-shadow-md">
                            Sign in to manage your carbon credits, track your sustainability goals, and make a real impact in rural India.
                        </p>
                    </div>

                    <div className="login-content flex items-center gap-4 text-emerald-200/60 text-xs font-medium uppercase tracking-[0.2em]">
                        <span>Secure Access</span>
                        <div className="w-8 h-[1px] bg-emerald-200/30" />
                        <span>Sustainability Verified</span>
                    </div>
                </div>
            </div>

            {/* Right — Form Panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-16 bg-white overflow-y-auto">
                <div className="max-w-md w-full login-content">
                    {/* Mobile brand (Visible only on small screens) */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl text-slate-900">Carbon<span className="text-teal-600">Credit</span></span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Welcome Back</h1>
                        <p className="text-slate-500 text-sm">Please enter your details to sign in.</p>
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

                    {/* Trading Mode Toggle */}
                    {role !== 'communityadmin' && (
                        <div className="mb-8">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1">I want to deal with</p>
                            <div className="flex p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50">
                                {(['credits', 'tokens'] as const).map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setTradingMode(m)}
                                        className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${
                                            tradingMode === m
                                                ? m === 'credits'
                                                    ? 'bg-white text-emerald-600 shadow-md ring-1 ring-black/5'
                                                    : 'bg-white text-amber-600 shadow-md ring-1 ring-black/5'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {m === 'credits' ? '🌿 Carbon Credits' : '☀️ Sun Tokens'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl font-medium animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1">
                                {(role === 'individual' || role === 'communityadmin') ? 'Email or User ID' : 'Company Email or ID'}
                            </label>
                            <input
                                type="text"
                                required
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className={inputCls}
                                placeholder={(role === 'individual' || role === 'communityadmin') ? 'you@example.com' : 'company@example.com'}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`${inputCls} pr-12`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-teal-600 transition-colors rounded-lg"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm py-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
                                <span className="text-slate-500 text-xs font-medium group-hover:text-slate-700 transition-colors">Remember me</span>
                            </label>
                            <a href="#" className="text-teal-600 hover:text-teal-700 font-bold text-xs transition-colors">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-500 transition-all shadow-xl shadow-teal-600/20 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Processing...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-slate-500">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-teal-600 hover:text-teal-700 font-bold ml-1 transition-colors">Sign up for free</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}