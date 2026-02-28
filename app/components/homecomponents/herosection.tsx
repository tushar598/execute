"use client";
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowRight, Leaf, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { useRef, useEffect, useState, useCallback } from 'react';

export default function Hero() {
    const sectionRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

    // Lazy-load: only set the video src when the section is in view
    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldLoadVideo(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    // FIX 1: Manually trigger .load() after video element mounts,
    // because preload="none" suppresses auto-fetching in many browsers,
    // which prevents onCanPlay from ever firing.
    useEffect(() => {
        if (shouldLoadVideo && videoRef.current) {
            videoRef.current.load();
        }
    }, [shouldLoadVideo]);

    // Play the video once the source is loaded
    const handleCanPlay = useCallback(() => {
        setVideoLoaded(true);
        videoRef.current?.play().catch(() => { });
    }, []);

    useGSAP(() => {
        const tl = gsap.timeline();
        tl.from('.hero-bg-wrapper', { scale: 1.05, duration: 2.5, ease: 'power2.out' })
            .from('.hero-text-line', {
                y: 100, opacity: 0, duration: 1,
                stagger: 0.2, ease: 'power3.out'
            }, '-=1.8')
            .from('.hero-card', {
                y: 40, opacity: 0, duration: 0.8,
                stagger: 0.15, ease: 'power3.out'
            }, '-=0.8');
    });

    return (
        <section ref={sectionRef} className="relative min-h-screen w-full overflow-hidden bg-slate-900 text-white">
            {/* ── Background Video ── */}
            <div className="hero-bg-wrapper absolute inset-0 z-0">
                {shouldLoadVideo && (
                    <video
                        ref={videoRef}
                        muted
                        loop
                        playsInline
                        preload="none"
                        onCanPlay={handleCanPlay}
                        // FIX 2: Raised opacity from opacity-40 to opacity-60
                        // so the video is actually visible through the overlays
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-60' : 'opacity-0'}`}
                    >
                        <source src="/farm.mp4" type="video/mp4" />
                    </video>
                )}

                {/* FIX 3: Reduced overlay opacity values so they no longer
                    completely bury the video underneath them */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/20 to-slate-900/80" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 via-transparent to-transparent" />
            </div>

            {/* ── Content ── */}
            <div className="relative z-10 h-full min-h-screen max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-center pt-28 pb-20 sm:pt-32 sm:pb-28">
                {/* Badge */}
                <div className="overflow-hidden mb-6">
                    <div className="hero-text-line inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">India&apos;s Dual Green Energy & Carbon Platform</span>
                    </div>
                </div>

                {/* Headlines */}
                <div className="max-w-5xl">
                    <div className="overflow-hidden">
                        <h1 className="hero-text-line text-4xl sm:text-6xl lg:text-8xl font-bold tracking-tighter leading-[0.95] mb-2 sm:mb-3">
                            Trade Energy.
                        </h1>
                    </div>
                    <div className="overflow-hidden">
                        <h1 className="hero-text-line text-4xl sm:text-6xl lg:text-8xl font-bold tracking-tighter leading-[0.95] mb-2 sm:mb-3">
                            Offset Carbon.
                        </h1>
                    </div>
                    <div className="overflow-hidden">
                        <h1 className="hero-text-line text-4xl sm:text-6xl lg:text-8xl font-bold tracking-tighter leading-[0.95] mb-8 sm:mb-12">
                            Build Tomorrow.
                        </h1>
                    </div>
                </div>

                {/* Sub-text + CTA */}
                <div className="hero-text-line max-w-xl mb-10 sm:mb-14">
                    <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-6 sm:mb-8">
                        A decentralized marketplace connecting renewable energy producers and sustainable farmers with consumers and corporations. Trade Sun Tokens or verified Carbon credits peer-to-peer.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Link
                            href="/signup"
                            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-teal-600/25 text-sm sm:text-base"
                        >
                            Start Trading <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 text-white font-bold rounded-2xl transition-all text-sm sm:text-base"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl">
                    {[
                        { icon: Leaf, label: 'AI-Verified Credits', desc: 'ML-powered carbon estimation' },
                        { icon: Shield, label: 'SHA-256 Audit Trail', desc: 'Tamper-proof blockchain hash' },
                        { icon: Users, label: 'Direct to Farmers', desc: '80% payout to growers' },
                    ].map(({ icon: Icon, label, desc }) => (
                        <div key={label} className="hero-card bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 hover:bg-white/12 transition-colors">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3">
                                <Icon className="w-4 h-4 text-emerald-300" />
                            </div>
                            <p className="text-sm font-bold text-white mb-0.5">{label}</p>
                            <p className="text-xs text-slate-400">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}