"use client";
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';
import { Sprout, Building2, TrendingUp } from 'lucide-react';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

const stats = [
    { target: 5000, suffix: '+', label: 'Tonnes CO₂e Offset', desc: 'Verified carbon credits retired through our platform', icon: TrendingUp, color: 'emerald' },
    { target: 200, suffix: '+', label: 'Farmers Onboarded', desc: 'Smallholder farmers earning from sustainable agriculture', icon: Sprout, color: 'teal' },
    { target: 50, suffix: '+', label: 'Companies Buying', desc: 'Corporations meeting ESG goals with verified credits', icon: Building2, color: 'blue' },
];

export default function Stats() {
    const containerRef = useRef(null);

    useGSAP(() => {
        const items = gsap.utils.toArray('.stat-item');
        items.forEach((stat: any) => {
            const valueElement = stat.querySelector('.stat-value');
            const target = parseInt(valueElement.getAttribute('data-target'));
            const suffix = valueElement.getAttribute('data-suffix') || '';
            const proxy = { val: 0 };
            gsap.to(proxy, {
                val: target, duration: 2.5, ease: 'power3.out',
                scrollTrigger: { trigger: stat, start: 'top 85%' },
                onUpdate: () => { valueElement.innerText = Math.ceil(proxy.val).toLocaleString() + suffix; }
            });
        });
    }, { scope: containerRef });

    return (
        <section id="stats" ref={containerRef} className="py-20 sm:py-28 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Section header */}
                <div className="text-center mb-12 sm:mb-16">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-bold text-emerald-700 uppercase tracking-widest mb-4">
                        Our Impact
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                        Numbers that speak for themselves
                    </h2>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    {stats.map(({ target, suffix, label, desc, icon: Icon, color }) => {
                        const colorClasses: Record<string, string> = {
                            emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-100',
                            teal: 'bg-teal-50 border-teal-100 text-teal-600 group-hover:bg-teal-100',
                            blue: 'bg-blue-50 border-blue-100 text-blue-600 group-hover:bg-blue-100',
                        };
                        const valueColors: Record<string, string> = {
                            emerald: 'group-hover:text-emerald-600',
                            teal: 'group-hover:text-teal-600',
                            blue: 'group-hover:text-blue-600',
                        };
                        return (
                            <div
                                key={label}
                                className="stat-item group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 sm:p-8"
                            >
                                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 transition-colors ${colorClasses[color]}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className={`text-4xl sm:text-5xl font-bold text-slate-900 mb-2 transition-colors ${valueColors[color]}`}>
                                    <span className="stat-value" data-target={target} data-suffix={suffix}>0{suffix}</span>
                                </h3>
                                <p className="text-sm font-bold text-slate-700 mb-1">{label}</p>
                                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
