"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Package, Plus, Loader2, ArrowLeft, Shield,
    CheckCircle, XCircle, ShoppingCart, TrendingUp,
    Layers, ChevronRight, AlertCircle
} from 'lucide-react';

interface Project {
    _id: string;
    projectName: string;
    projectDescription: string;
    sourceCommunityIds: string[];
    totalCredits: number;
    pricePerCredit: number;
    status: 'open' | 'sold' | 'cancelled';
    buyerCompanyId?: string;
    createdAt: string;
}

export default function AggregatorProjectPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [availableCredits, setAvailableCredits] = useState(0);
    const [sourceCommunityIds, setSourceCommunityIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [totalCredits, setTotalCredits] = useState('');
    const [pricePerCredit, setPricePerCredit] = useState('');

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/aggregator/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
                setAvailableCredits(data.availableCredits || 0);
                setSourceCommunityIds(data.sourceCommunityIds || []);
            } else if (res.status === 401) {
                router.push('/login');
            }
        } catch (err) {
            console.error('Failed to fetch projects:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchProjects(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setFormLoading(true);

        try {
            const res = await fetch('/api/aggregator/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectName,
                    projectDescription,
                    totalCredits: Number(totalCredits),
                    pricePerCredit: Number(pricePerCredit),
                    sourceCommunityIds,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess('Project created and listed on the Company marketplace!');
                setShowForm(false);
                setProjectName('');
                setProjectDescription('');
                setTotalCredits('');
                setPricePerCredit('');
                fetchProjects();
            } else {
                setError(data.error || 'Failed to create project');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setFormLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
                    <p className="text-slate-500 font-medium">Loading projects...</p>
                </div>
            </div>
        );
    }

    const totalBundled = projects.filter(p => p.status !== 'cancelled').reduce((a, p) => a + p.totalCredits, 0);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/aggregator/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shrink-0">
                            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-xl font-bold text-slate-900">Project Builder</h1>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Bundle credits for company marketplace</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20"
                    >
                        <Plus className="w-4 h-4" /> Create Project
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Available Credits</p>
                        <p className="text-2xl font-bold text-emerald-600">{availableCredits.toLocaleString()} <span className="text-sm">CRD</span></p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Bundled in Projects</p>
                        <p className="text-2xl font-bold text-purple-600">{totalBundled.toLocaleString()} <span className="text-sm">CRD</span></p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Projects</p>
                        <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
                    </div>
                </div>

                {/* Success / Error messages */}
                {success && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                        <p className="text-sm text-emerald-700 font-medium">{success}</p>
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Create Project Form */}
                {showForm && (
                    <div className="mb-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-purple-600" />
                            New Carbon Credit Project
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-5 text-black">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Project Name</label>
                                    <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} required
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all" placeholder="e.g. GreenFarm Offset Bundle Q1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Credits to Bundle</label>
                                    <input type="number" value={totalCredits} onChange={e => setTotalCredits(e.target.value)} required min="1" max={availableCredits}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all" placeholder={`Max: ${availableCredits}`} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Project Description</label>
                                <textarea value={projectDescription} onChange={e => setProjectDescription(e.target.value)} required rows={3}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all resize-none" placeholder="Describe the carbon offset project for potential buyers..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Price per Credit (₹)</label>
                                <input type="number" value={pricePerCredit} onChange={e => setPricePerCredit(e.target.value)} required min="0.01" step="0.01"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all" placeholder="e.g. 35.00" />
                            </div>
                            {totalCredits && pricePerCredit && (
                                <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1">Projected Revenue</p>
                                    <p className="text-2xl font-bold text-purple-900">₹{(Number(totalCredits) * Number(pricePerCredit)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button type="submit" disabled={formLoading}
                                    className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {formLoading ? 'Creating...' : 'Create & List Project'}
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Projects List */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-600" />
                        Your Projects
                    </h2>
                    {projects.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
                            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 mb-2">No projects yet</h3>
                            <p className="text-sm text-slate-500 mb-6">Bundle your purchased credits into projects to list on the Company Marketplace.</p>
                            <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-500 transition-all">
                                Create Your First Project
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map((project) => (
                                <div key={project._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-lg transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${project.status === 'open' ? 'bg-emerald-50 text-emerald-600' : project.status === 'sold' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {project.status === 'open' ? '● Listed' : project.status === 'sold' ? '✓ Sold' : '✗ Cancelled'}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium">{new Date(project.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 mb-1">{project.projectName}</h3>
                                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{project.projectDescription}</p>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">Credits</p>
                                            <p className="text-sm font-bold text-slate-900">{project.totalCredits.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">Price/CRD</p>
                                            <p className="text-sm font-bold text-slate-900">₹{project.pricePerCredit}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                                        <p className="text-[9px] text-purple-500 font-bold uppercase">Total Value</p>
                                        <p className="text-lg font-bold text-purple-900">₹{(project.totalCredits * project.pricePerCredit).toLocaleString()}</p>
                                    </div>
                                    {project.status === 'sold' && project.buyerCompanyId && (
                                        <p className="mt-3 text-[10px] text-blue-600 font-bold flex items-center gap-1">
                                            <ShoppingCart className="w-3 h-3" /> Purchased by Company
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
