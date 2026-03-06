import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
    CheckCircle,
    Shield,
    FileCheck,
    Building,
    User,
    DollarSign,
    Calendar,
    Download,
    Award,
    ArrowLeft
} from 'lucide-react';

export function ApprovedProjectPlan() {
    const location = useLocation();
    const state = location.state as { formData?: { contractorName: string; companyName: string; licenseNumber: string; bidAmount: string; estimatedWeeks: string }; project?: { meta?: { projectId?: string; createdAt?: string; updatedAt?: string; version?: number }; homeowner?: { firstName?: string }; property?: { address?: string } } } | undefined;
    const formData = state?.formData || {
        contractorName: 'Demo Contractor',
        companyName: 'Smith Construction LLC',
        licenseNumber: 'AZ ROC #123456',
        bidAmount: '415000',
        estimatedWeeks: '24'
    };
    const project = state?.project;
    const projectName = project?.property?.address
        ? `${(project.property.address.split(',')[0] || project.property.address).trim()} Expansion`
        : 'The Smith Residence Expansion';
    const projectId = project?.meta?.projectId ? `${project.meta.projectId}-FNL` : 'EXP-8492-B-FNL';
    const homeownerName = project?.homeowner?.firstName || 'Kevin';
    const homeownerEmail = project?.homeowner?.email;
    const homeownerPhone = project?.homeowner?.phone;
    const occupancy = project?.onboarding?.occupancy;
    const occupancyLabel = occupancy === 'primary' ? 'Primary residence' : occupancy === 'secondary' ? 'Secondary / vacation' : occupancy === 'investment' ? 'Investment property' : null;
    const collectedAt = project?.meta?.createdAt ? new Date(project.meta.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
    const version = project?.meta?.version ?? 1;

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 pb-20">
            {/* Print Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium">
                        <ArrowLeft size={16} /> Back Home
                    </Link>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors">
                        <Download size={16} /> Save PDF for Lender
                    </button>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-12">
                {/* Document Container */}
                <div className="bg-white shadow-xl shadow-gray-200/50 border border-gray-200 rounded-2xl overflow-hidden print:shadow-none print:border-none">
                    {/* Header Area */}
                    <div className="bg-indigo-900 text-white p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <Shield size={200} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5">
                                    <CheckCircle size={14} /> Fully Verified
                                </div>
                                <span className="text-indigo-200 text-sm font-medium">Lender Package Ready</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Approved Project Plan</h1>
                            <p className="text-indigo-200 text-lg max-w-2xl">
                                This document serves as the official Golden Record. The scope of work has been finalized by the homeowner, and the pricing has been locked by a vetted, licensed contractor.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 md:p-12 space-y-12">
                        {/* Overview & Identification */}
                        <section className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 border-b border-gray-200 pb-2">Project Reference</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Project Name</p>
                                        <p className="font-bold text-gray-900 text-lg">{projectName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Project ID</p>
                                        <p className="font-mono font-medium text-gray-900">{projectId}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Approval Date</p>
                                        <p className="font-medium text-gray-900">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                    {collectedAt && (
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Data collected (homeowner)</p>
                                            <p className="font-medium text-gray-900">{collectedAt}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Document version</p>
                                        <p className="font-medium text-gray-900">v{version}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-4 border-b border-indigo-200 pb-2">Contractor Verification</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <User size={16} className="text-indigo-500 shrink-0" />
                                        <span className="font-bold text-gray-900">{formData.contractorName}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Building size={16} className="text-indigo-500 shrink-0" />
                                        <span className="text-gray-800">{formData.companyName}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <FileCheck size={16} className="text-indigo-500 shrink-0" />
                                        <span className="font-mono text-sm text-gray-600">License: {formData.licenseNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-indigo-200/50">
                                        <Award size={16} className="text-emerald-500 shrink-0" />
                                        <span className="text-emerald-800 text-sm font-semibold">ExpandEase Certified Partner</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Financial Terms */}
                        <section>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 border-b border-gray-200 pb-2">Binding Financial Terms</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col justify-center items-center text-center">
                                    <DollarSign size={24} className="text-emerald-500 mb-2" />
                                    <p className="text-sm text-gray-500 font-medium mb-1">Total Fixed Price (To Fund)</p>
                                    <p className="text-3xl font-bold font-mono text-gray-900">${Number(formData.bidAmount).toLocaleString()}</p>
                                    <p className="text-xs text-gray-400 mt-2">Includes all labor, materials, and allowances</p>
                                </div>

                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col justify-center items-center text-center">
                                    <Calendar size={24} className="text-blue-500 mb-2" />
                                    <p className="text-sm text-gray-500 font-medium mb-1">Estimated Timeline</p>
                                    <p className="text-3xl font-bold font-mono text-gray-900">{formData.estimatedWeeks} Weeks</p>
                                    <p className="text-xs text-gray-400 mt-2">From permit issuance to final inspection</p>
                                </div>
                            </div>
                        </section>

                        {/* Signatures */}
                        <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 border-b border-gray-200 pb-2">Digital Signatures Executed</h3>
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-bold text-gray-900">Homeowner (Borrower)</p>
                                        <p className="text-sm text-gray-500">{homeownerName}</p>
                                        {homeownerEmail ? <p className="text-xs text-gray-500">{homeownerEmail}</p> : null}
                                        {homeownerPhone ? <p className="text-xs text-gray-500">{homeownerPhone}</p> : null}
                                        {occupancyLabel ? <p className="text-xs text-gray-500 mt-1">{occupancyLabel}</p> : null}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">Digitally Signed (ExpandEase API)</p>
                                        <p className="text-xs text-gray-400 mt-1">Timestamp: 2024-03-01 14:32 MST</p>
                                    </div>
                                </div>
                                <div className="flex items-start justify-between border-t border-gray-200 pt-4">
                                    <div>
                                        <p className="font-bold text-gray-900">Contractor</p>
                                        <p className="text-sm text-gray-500">{formData.contractorName} ({formData.companyName})</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">Digitally Signed (ExpandEase API)</p>
                                        <p className="text-xs text-gray-400 mt-1">Timestamp: {new Date().toLocaleString('en-US', { timeZoneName: 'short' })}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Lender Notice */}
                <div className="mt-8 text-center px-4">
                    <p className="text-sm text-gray-500 mb-2">
                        <strong>Notice to Lender:</strong> This document represents a locked Scope of Work. Funds should be escrowed according to the ExpandEase Milestone schedule.
                    </p>
                    <p className="text-xs text-gray-400">
                        ExpandEase Document ID: {project?.meta?.projectId ?? Math.random().toString(36).substring(2, 12).toUpperCase()} — Single source of truth for contractor & lender
                    </p>
                </div>
            </main>
        </div>
    );
}
