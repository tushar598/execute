"use client";
import { Sprout, Users, Building2, Shield, ArrowUpRight } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

const solutions = [
    {
        icon: <Sprout className="w-6 h-6" />,
        title: "Farmer Verification",
        description: "AI-powered carbon estimation based on land area, soil type, crop rotation, and sustainable farming practices.",
        badge: "Step 1",
    },
    {
        icon: <Users className="w-6 h-6" />,
        title: "Community Aggregation",
        description: "Community admins pool verified credits from multiple farmers to create larger, more attractive carbon credit bundles.",
        badge: "Step 2",
    },
    {
        icon: <Building2 className="w-6 h-6" />,
        title: "Corporate Offsetting",
        description: "Companies browse the marketplace, purchase verified credits, and receive tamper-proof retirement certificates.",
        badge: "Step 3",
    },
    {
        icon: <Shield className="w-6 h-6" />,
        title: "Blockchain Audit Trail",
        description: "Every transaction is SHA-256 hashed, creating an immutable chain of custody from soil to retirement.",
        badge: "Always On",
    }
];

export default function Solutions() {
    useGSAP(() => {
        // Use autoAlpha (manages both opacity + visibility) so cards are
        // never invisibly blocking interaction if the trigger misfires.
        // `once: true` ensures the animation only plays once and completes.
        // `start: 'top 85%'` fires sooner so cards animate in before the
        // user has scrolled past the section.
        gsap.fromTo(
            '.solution-card',
            { autoAlpha: 0, y: 40 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.solutions-section',
                    start: 'top 85%',
                    once: true,
                },
            }
        );
    });

    return (
        <section id="solutions" className="solutions-section py-20 sm:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 sm:mb-16">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-100 rounded-full text-xs font-bold text-teal-700 uppercase tracking-widest mb-4">
                            Platform Features
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
                            End-to-end carbon credit lifecycle
                        </h2>
                    </div>
                    <a href="/signup" className="hidden md:flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/15 text-sm group">
                        Get Started
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                </div>

                {/* Cards — `will-change-transform` hints GPU compositing so
                    autoAlpha transitions render correctly on first paint. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {solutions.map((item, index) => (
                        <div
                            key={index}
                            className="solution-card will-change-transform group relative bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/5 cursor-default"
                        >
                            <div className="flex items-start justify-between mb-5">
                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 group-hover:shadow-lg group-hover:shadow-teal-500/20 transition-all duration-300">
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white border border-slate-100 px-2.5 py-1 rounded-full">
                                    {item.badge}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                                {item.title}
                                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                        </div>
                    ))}
                </div>

                {/* Mobile CTA */}
                <div className="mt-8 md:hidden">
                    <a href="/signup" className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/15 text-sm">
                        Get Started <ArrowUpRight className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </section>
    );
}