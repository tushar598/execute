"use client";
import Link from 'next/link';
import { Menu, X, Leaf } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useGSAP(() => {
        gsap.from('.nav-item', {
            y: -20, opacity: 0, duration: 0.5,
            stagger: 0.1, ease: 'power2.out'
        });
    });

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-slate-900/5 py-3'
            : 'bg-transparent py-5'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
                {/* Brand */}
                <Link href="/" className="nav-item flex items-center gap-2.5 group">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${scrolled
                        ? 'bg-teal-600 shadow-lg shadow-teal-500/25'
                        : 'bg-white/15 backdrop-blur-sm border border-white/20'
                        }`}>
                        <Leaf className={`w-5 h-5 transition-colors ${scrolled ? 'text-white' : 'text-emerald-300'}`} />
                    </div>
                    <span className={`font-bold text-xl tracking-tight transition-colors duration-300 ${scrolled ? 'text-slate-900' : 'text-white'}`}>
                        Eco<span className={`${scrolled ? 'text-teal-600' : 'text-emerald-300'}`}>Trade</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                {/* <div className={`hidden md:flex items-center gap-1 ${scrolled ? 'text-slate-600' : 'text-white/80'}`}>
                    {[
                        ['/', 'Home'],
                        ['/#about', 'How It Works'],
                        ['/#solutions', 'Platform'],
                        ['/#stats', 'Impact'],
                    ].map(([href, label]) => (
                        <Link
                            key={label}
                            href={href}
                            className={`nav-item px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${scrolled
                                ? 'hover:bg-slate-100 hover:text-slate-900'
                                : 'hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {label}
                        </Link>
                    ))}
                </div> */}

                {/* Desktop CTA */}
                <div className="hidden md:flex items-center gap-3 nav-item">
                    <Link
                        href="/login"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${scrolled
                            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/signup"
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg ${scrolled
                            ? 'bg-teal-600 text-white hover:bg-teal-500 shadow-teal-500/20'
                            : 'bg-white text-slate-900 hover:bg-white/90 shadow-white/10'
                            }`}
                    >
                        Get Started
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`md:hidden p-2 rounded-lg transition-colors ${scrolled
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-white hover:bg-white/10'
                        }`}
                >
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-2xl shadow-slate-900/10 md:hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 space-y-1">
                        {[
                            ['/', 'Home'],
                            ['/#about', 'How It Works'],
                            ['/#solutions', 'Platform'],
                            ['/#stats', 'Impact'],
                        ].map(([href, label]) => (
                            <Link
                                key={label}
                                href={href}
                                onClick={() => setIsOpen(false)}
                                className="block px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                            >
                                {label}
                            </Link>
                        ))}
                        <div className="h-px bg-slate-100 my-2" />
                        <Link
                            href="/login"
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/signup"
                            onClick={() => setIsOpen(false)}
                            className="block text-center bg-teal-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 hover:bg-teal-500 transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
