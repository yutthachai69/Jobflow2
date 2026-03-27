'use client';

import { useState, useEffect } from 'react';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import { getSitesWithPMStatus, generatePMContract, deletePMContract } from '@/app/actions/pm';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import ConfirmModal from '@/app/components/ConfirmModal';

export default function PMPlanningPage() {
    const [sites, setSites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [isProcessing, setIsProcessing] = useState(false);

    const [modal, setModal] = useState<{
        isOpen: boolean;
        type: 'generate' | 'delete';
        siteId: string;
        contractId: string;
        siteName: string;
    }>({ isOpen: false, type: 'generate', siteId: '', contractId: '', siteName: '' });

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getSitesWithPMStatus(year);
            setSites(data);
        } catch (error) {
            toast.error("โหลดข้อมูลล้มเหลว");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [year]);

    const openGenerateModal = (siteId: string, siteName: string) => {
        setModal({ isOpen: true, type: 'generate', siteId, contractId: '', siteName });
    };

    const openDeleteModal = (contractId: string, siteName: string) => {
        setModal({ isOpen: true, type: 'delete', siteId: '', contractId, siteName });
    };

    const handleConfirm = async () => {
        setIsProcessing(true);
        if (modal.type === 'generate') {
            try {
                const res = await generatePMContract(modal.siteId, year);
                if (res.success) {
                    toast.success("สร้างแผนงาน PM สำเร็จแล้ว 🎉");
                    loadData();
                }
            } catch (error: any) {
                toast.error(error.message || "เกิดข้อผิดพลาด");
            }
        } else {
            try {
                const res = await deletePMContract(modal.contractId);
                if (res.success) {
                    toast.success("ลบแผนงาน PM แล้ว");
                    loadData();
                }
            } catch (error: any) {
                toast.error("ลบไม่สำเร็จ: " + error.message);
            }
        }
        setIsProcessing(false);
    };

    return (
        <div className="p-4 md:p-8">
            <Breadcrumbs
                items={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'วางแผน PM ประจำปี', href: undefined },
                ]}
            />

            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-app-heading">วางแผนบำรุงรักษา (PM Planning)</h1>
                    <p className="text-app-muted">จัดสรรโควต้า PM ให้แอร์แต่ละเครื่องล่วงหน้าทั้งปี</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <Link
                        href="/admin/pm-import"
                        className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
                    >
                        📤 อัปโหลดแผน PM (Excel)
                    </Link>
                    <Link
                        href="/admin/pm-planning/dispatch"
                        className="bg-white text-primary border border-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
                    >
                        📦 ออกใบงาน PM ประจำเดือน
                    </Link>

                    <div className="flex items-center gap-2 bg-app-card p-2 rounded-xl border border-app shadow-sm">
                        <span className="text-sm font-medium px-2">ปี:</span>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="bg-app-section border-none focus:ring-0 text-sm font-bold rounded-lg px-3 py-1.5"
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Banner */}
            <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-xl font-bold">เริ่มหน้างาน PM ของเดือนนี้</h2>
                    <p className="text-blue-100 text-sm mt-1 opacity-90">ระบบจะตรวจสอบว่าเดือนนี้มีเครื่องไหนถึงกำหนด PM แล้วรวบรวมเป็นใบสั่งงานให้ช่างทันที</p>
                </div>
                <Link
                    href="/admin/pm-planning/dispatch"
                    className="bg-white text-blue-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all shadow-md whitespace-nowrap"
                >
                    ตรวจสอบรอบ PM เดือนนี้ →
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {sites.map(site => {
                        const contract = site.pmContracts?.[0];
                        return (
                            <div key={site.id} className="bg-app-card rounded-2xl border border-app shadow-sm hover:shadow-md transition-all overflow-hidden">
                                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                                            🏥
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-app-heading">{site.name}</h3>
                                            <div className="flex items-center gap-3 text-sm text-app-muted mt-1">
                                                <span>🏢 {site._count?.buildings ?? 0} อาคาร</span>
                                                <span>❄️ {site.acCount ?? 0} เครื่องปรับอากาศ</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        {contract ? (
                                            <>
                                                <div className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                    <span className="text-sm font-bold tracking-tight">วางแผนแล้ว ({year})</span>
                                                </div>
                                                <button
                                                    onClick={() => openDeleteModal(contract.id, site.name)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                    title="ลบแผนงาน"
                                                >
                                                    🗑️
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => openGenerateModal(site.id, site.name)}
                                                disabled={site.acCount === 0}
                                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2
                                                    ${site.acCount === 0
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'btn-app-primary hover:shadow-lg'
                                                    }
                                                `}
                                            >
                                                ✨ สร้างแผน PM รายปี
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {contract && (
                                    <div className="bg-app-section px-6 py-4 flex flex-wrap gap-8 border-t border-app">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-app-muted tracking-wider">โควต้า PM ทั้งหมด</span>
                                            <span className="text-lg font-black text-app-heading">{(site.acCount ?? 0) * 6} <span className="text-xs font-normal">รายการ</span></span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modern Confirm Modal */}
            <ConfirmModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={handleConfirm}
                title={modal.type === 'generate' ? 'สร้างแผน PM รายปี' : 'ลบแผนงาน PM'}
                description={
                    modal.type === 'generate'
                        ? `ต้องการสร้างแผน PM ปี ${year} สำหรับ "${modal.siteName}" ใช่หรือไม่? ระบบจะสร้างตาราง PM รายปีให้แอร์ทั้งหมดโดยอัตโนมัติ`
                        : `ต้องการลบแผนงาน PM ปี ${year} ของ "${modal.siteName}" ใช่หรือไม่? ข้อมูลตารางที่ยังไม่ออกใบงานจะถูกลบทั้งหมด`
                }
                icon={modal.type === 'generate' ? '📅' : '🗑️'}
                variant={modal.type === 'generate' ? 'primary' : 'danger'}
                confirmText={modal.type === 'generate' ? 'สร้างแผนงาน' : 'ยืนยันการลบ'}
                cancelText="ยกเลิก"
            />
        </div>
    );
}
