"use client";
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

export default function About() {
    useGSAP(() => {
        gsap.from('.about-text', {
            scrollTrigger: { trigger: '.about-section', start: 'top 80%' },
            y: 50, opacity: 0, duration: 1, stagger: 0.2, ease: 'power3.out'
        });
        gsap.from('.about-image', {
            scrollTrigger: { trigger: '.about-section', start: 'top 70%' },
            scale: 0.9, opacity: 0, duration: 1.5, ease: 'power2.out'
        });
    });

    return (
        <section id="about" className="about-section py-20 sm:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Image */}
                    <div className="relative about-image order-2 lg:order-1">
                        <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10">
                            <img
                                src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=2070&auto=format&fit=crop"
                                alt="Sustainable farming practices"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                        {/* Floating stat card */}
                        <div className="absolute -bottom-6 -right-2 sm:-right-6 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 px-5 py-4">
                            <p className="text-2xl font-bold text-teal-600">₹12.5L+</p>
                            <p className="text-xs text-slate-500 font-medium">Paid to Farmers</p>
                        </div>
                        <div className="absolute -top-4 -left-4 w-32 h-32 bg-emerald-50 rounded-full -z-10 hidden lg:block" />
                    </div>

                    {/* Text */}
                    <div className="order-1 lg:order-2">
                        <span className="about-text inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-100 rounded-full text-xs font-bold text-teal-700 uppercase tracking-widest mb-6">
                            How It Works
                        </span>
                        <h2 className="about-text text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-slate-900 tracking-tight">
                            From soil to offset — a transparent carbon journey
                        </h2>
                        <p className="about-text text-base sm:text-lg text-slate-500 leading-relaxed mb-8">
                            Our platform connects <span className="text-slate-900 font-semibold">smallholder farmers</span> practicing sustainable agriculture with <span className="text-slate-900 font-semibold">corporations</span> seeking verified carbon credits. Every transaction is audited, hashed, and traceable.
                        </p>

                        <div className="about-text space-y-3 mb-8">
                            {[
                                'Farmers register land & sustainable practices',
                                'AI model estimates carbon sequestration',
                                'Credits are verified and listed on marketplace',
                                'Companies buy credits — 80% goes direct to farmer',
                            ].map((step, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-slate-600 font-medium">{step}</p>
                                </div>
                            ))}
                        </div>

                        <Link
                            href="/signup"
                            className="about-text inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/15 text-sm"
                        >
                            Join the Platform <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
