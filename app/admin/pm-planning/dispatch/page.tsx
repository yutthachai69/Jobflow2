'use client';

import { useState, useEffect } from 'react';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import { getDuePMSchedules, createWorkOrderFromPM } from '@/app/actions/pm';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function PMDispatchBoard() {
    const router = useRouter();
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year] = useState(new Date().getFullYear());
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getDuePMSchedules(month, year);
            setSchedules(data);
            setSelectedIds(data.map(s => s.id)); // Select all by default
        } catch (error) {
            toast.error("โหลดข้อมูลล้มเหลว");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [month]);

    const handleSelectAll = () => {
        if (selectedIds.length === schedules.length) setSelectedIds([]);
        else setSelectedIds(schedules.map(s => s.id));
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
        else setSelectedIds([...selectedIds, id]);
    };

    const handleCreateWorkOrder = async () => {
        if (selectedIds.length === 0) {
            toast.error("กรุณาเลือกรายการแอร์");
            return;
        }

        // Group by site because 1 work order = 1 site
        const sites = Array.from(new Set(schedules.filter(s => selectedIds.includes(s.id)).map(s => s.asset.room.floor.building.siteId)));
        
        if (!confirm(`คุณกำลังจะสร้างใบสั่งงาน PM สำหรับ ${sites.length} สถานที่ (รวม ${selectedIds.length} รายการ)\nต้องการดำเนินการต่อหรือไม่?`)) return;

        setIsProcessing(true);
        try {
            for (const siteId of sites) {
                const siteSchedules = selectedIds.filter(id => {
                    const s = schedules.find(x => x.id === id);
                    return s?.asset.room.floor.building.siteId === siteId;
                });
                await createWorkOrderFromPM(siteId, siteSchedules);
            }
            toast.success("สร้างใบสั่งงานสำเร็จแล้ว");
            router.push('/work-orders');
        } catch (error: any) {
            toast.error(error.message || "เกิดข้อผิดพลาด");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <Breadcrumbs
                items={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'วางแผน PM', href: '/admin/pm-planning' },
                    { label: 'ออกใบงาน PM ประจำเดือน', href: undefined },
                ]}
            />

            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-app-heading">ออกใบงาน PM ประจำเดือน</h1>
                    <p className="text-app-muted">เลือกแอร์ที่ถึงกำหนดล้างในเดือนนี้เพื่อออกใบสั่งงานให้ช่าง</p>
                </div>

                <div className="flex items-center gap-4">
                    <select 
                        value={month} 
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="bg-app-card border border-app rounded-xl px-4 py-2 font-bold text-app-heading focus:ring-2 focus:ring-primary outline-none"
                    >
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>เดือน {m}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleCreateWorkOrder}
                        disabled={selectedIds.length === 0 || isProcessing}
                        className="btn-app-primary px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'กำลังประมวลผล...' : `📦 ออกใบงาน (${selectedIds.length} รายการ)`}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : schedules.length === 0 ? (
                <div className="text-center py-20 bg-app-card rounded-2xl border border-dashed border-app">
                    <div className="text-4xl mb-4 text-app-muted opacity-30">📭</div>
                    <p className="text-app-muted">ไม่มีรายการแอร์ที่ถึงกำหนดล้างในเดือนนี้ (หรือออกใบงานไปครบแล้ว)</p>
                </div>
            ) : (
                <div className="bg-app-card rounded-2xl border border-app shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-app-section border-b border-app">
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-app-muted">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.length === schedules.length}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                    />
                                </th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-app-muted">QR Code / เครื่อง</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-app-muted flex items-center gap-1">
                                    <span>ประเภท</span>
                                </th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-app-muted">สถานที่ (Site)</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-app-muted">ตำแหน่ง (Room)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app">
                            {schedules.map(schedule => (
                                <tr key={schedule.id} className="hover:bg-app-section transition-colors group">
                                    <td className="p-4">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(schedule.id)}
                                            onChange={() => toggleSelect(schedule.id)}
                                            className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-app-heading">{schedule.asset.qrCode}</div>
                                        <div className="text-[10px] text-app-muted">{schedule.asset.model || '-'}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter
                                            ${schedule.pmType === 'MAJOR' 
                                                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                                : 'bg-orange-100 text-orange-700 border border-orange-200'}
                                        `}>
                                            {schedule.pmType === 'MAJOR' ? 'ใหญ่ (Major)' : 'ย่อย (Minor)'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm font-medium text-app-heading">{schedule.asset.room.floor.building.site.name}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-[11px] text-app-body">
                                            {schedule.asset.room.floor.building.name} → {schedule.asset.room.name}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
