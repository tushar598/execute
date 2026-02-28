import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-white pt-16 sm:pt-20 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 mb-12 sm:mb-16">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-2">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                                <Leaf className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight">
                                Eco<span className="text-emerald-400">Trade</span>
                            </span>
                        </div>
                        <p className="text-slate-400 max-w-md leading-relaxed text-sm mb-6">
                            India&apos;s transparent decentralized energy and carbon marketplace connecting producers with consumers. Every transaction is verified, hashed, and traceable from source to grid.
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Platform Active</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold mb-5 text-sm uppercase tracking-widest text-slate-300">Platform</h4>
                        <ul className="space-y-3 text-slate-400 text-sm">
                            <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                            <li><Link href="/signup" className="hover:text-white transition-colors">Create Account</Link></li>
                            <li><Link href="/#about" className="hover:text-white transition-colors">How It Works</Link></li>
                            <li><Link href="/#solutions" className="hover:text-white transition-colors">Features</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-bold mb-5 text-sm uppercase tracking-widest text-slate-300">Legal</h4>
                        <ul className="space-y-3 text-slate-400 text-sm">
                            <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
                    <p>© 2026 EcoTrade Platform. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Twitter</a>
                        <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                        <a href="#" className="hover:text-white transition-colors">GitHub</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
