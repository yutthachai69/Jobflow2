'use client'

import React, { useState, useMemo } from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine,
} from 'recharts'
import Link from 'next/link'

// ---- Types ----
interface JobItemRow {
    id: string
    status: string
    workOrder: { id: string; scheduledDate: string; status: string; jobType: string }
    asset: {
        id: string; qrCode: string; machineType: string | null; assetType: string
        room: { id: string; name: string; floor: { name: string; building: { name: string } } }
    }
}

interface Props { jobItems: JobItemRow[]; siteName: string; clientName: string }

// ---- Config ----
const MACHINE_CONFIG = [
    { key: 'AHU', label: 'AHU', icon: '🌀', gradient: 'from-blue-600 to-blue-800' },
    { key: 'FCU', label: 'FCU', icon: '💨', gradient: 'from-cyan-500 to-cyan-700' },
    { key: 'VRF', label: 'VRF', icon: '🔄', gradient: 'from-violet-600 to-violet-800' },
    { key: 'SPLIT_TYPE', label: 'Split Type', icon: '❄️', gradient: 'from-emerald-600 to-emerald-800' },
    { key: 'EXHAUST', label: 'Exhaust', icon: '💭', gradient: 'from-amber-600 to-amber-800' },
    { key: 'OTHER', label: 'อื่นๆ', icon: '⚙️', gradient: 'from-slate-600 to-slate-800' },
]

const BADGE_STYLE: Record<string, string> = {
    AHU: 'bg-blue-600/20 text-blue-300 border border-blue-500/30',
    FCU: 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30',
    VRF: 'bg-violet-600/20 text-violet-300 border border-violet-500/30',
    SPLIT_TYPE: 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30',
    EXHAUST: 'bg-amber-600/20 text-amber-300 border border-amber-500/30',
    OTHER: 'bg-slate-600/20 text-slate-300 border border-slate-500/30',
}

function isoDate(d: string) { return new Date(d).toISOString().split('T')[0] }
function fmtShort(d: string) {
    return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })
}

export default function CleaningDashboardClient({ jobItems, siteName, clientName }: Props) {
    const defaultTo = new Date()
    const defaultFrom = new Date()
    defaultFrom.setMonth(defaultFrom.getMonth() - 6)

    const [dateFrom, setDateFrom] = useState(isoDate(defaultFrom.toISOString()))
    const [dateTo, setDateTo] = useState(isoDate(defaultTo.toISOString()))

    const filtered = useMemo(() => {
        const from = new Date(dateFrom)
        const to = new Date(dateTo); to.setHours(23, 59, 59)
        return jobItems.filter(ji => { const d = new Date(ji.workOrder.scheduledDate); return d >= from && d <= to })
    }, [jobItems, dateFrom, dateTo])

    const done = filtered.filter(ji => ji.status === 'DONE')
    const totalAll = filtered.length
    const totalDone = done.length
    const pct = totalAll > 0 ? ((totalDone / totalAll) * 100).toFixed(1) : '0.0'
    const uniqueWOs = new Set(done.map(ji => ji.workOrder.id)).size

    const byMachine = useMemo(() => {
        const c: Record<string, number> = {}
        done.forEach(ji => { const mt = ji.asset.machineType || 'OTHER'; c[mt] = (c[mt] || 0) + 1 })
        return c
    }, [done])

    const chartData = useMemo(() => {
        const m: Record<string, number> = {}
        done.forEach(ji => { const d = isoDate(ji.workOrder.scheduledDate); m[d] = (m[d] || 0) + 1 })
        return Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }))
    }, [done])

    const avg = chartData.length > 0
        ? (chartData.reduce((s, r) => s + r.count, 0) / chartData.length).toFixed(1)
        : '0'

    type Row = { key: string; mt: string; loc: string; room: string; count: number }
    const tableRows = useMemo<Row[]>(() => {
        const m = new Map<string, Row>()
        done.forEach(ji => {
            const mt = ji.asset.machineType || 'OTHER'
            const bldg = ji.asset.room?.floor?.building?.name || '-'
            const fl = ji.asset.room?.floor?.name || '-'
            const rm = ji.asset.room?.name || '-'
            const key = `${mt}__${bldg}__${fl}__${rm}`
            const ex = m.get(key)
            if (ex) ex.count++
            else m.set(key, { key, mt, loc: `${bldg} – ${fl}`, room: rm, count: 1 })
        })
        return Array.from(m.values()).sort((a, b) => b.count - a.count)
    }, [done])

    const quickRanges = [
        { label: '1M', months: 1 }, { label: '3M', months: 3 },
        { label: '6M', months: 6 }, { label: '1Y', months: 12 },
    ]

    return (
        <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>

            {/* ── Header ── */}
            <div className="mb-8">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xl shadow-lg shadow-blue-500/30">❄️</div>
                            <div>
                                <h1 className="text-2xl font-bold text-app-heading leading-tight">Cleaning Air Conditioner Report</h1>
                                <p className="text-sm text-app-muted">{clientName} • {siteName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="flex flex-wrap gap-2 items-center">
                        {quickRanges.map(({ label, months }) => (
                            <button
                                key={months}
                                onClick={() => {
                                    const to = new Date(); const fr = new Date()
                                    fr.setMonth(fr.getMonth() - months)
                                    setDateFrom(isoDate(fr.toISOString())); setDateTo(isoDate(to.toISOString()))
                                }}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-app text-app-muted hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all duration-200"
                            >{label}</button>
                        ))}
                        <div className="flex gap-2 items-center bg-app-card border border-app rounded-xl px-3 py-1.5">
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                                className="text-xs bg-transparent text-app-body focus:outline-none" />
                            <span className="text-app-muted text-xs">→</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                                className="text-xs bg-transparent text-app-body focus:outline-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── KPI Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {[
                    {
                        label: 'จำนวนที่ล้าง', value: totalDone, unit: 'รายการ',
                        icon: '🧹', from: '#1d4ed8', to: '#1e40af', glow: 'shadow-blue-500/20',
                    },
                    {
                        label: '%วันวนล้างแอร์', value: `${pct}%`, unit: `${totalDone}/${totalAll} รายการ`,
                        icon: '📊', from: '#0891b2', to: '#0e7490', glow: 'shadow-cyan-500/20',
                    },
                    {
                        label: 'ใบงาน PM', value: uniqueWOs, unit: 'ครั้ง',
                        icon: '📋', from: '#7c3aed', to: '#6d28d9', glow: 'shadow-violet-500/20',
                    },
                    {
                        label: 'เฉลี่ยต่อวัน', value: avg, unit: 'เครื่อง/วัน',
                        icon: '📈', from: '#059669', to: '#047857', glow: 'shadow-emerald-500/20',
                    },
                ].map(k => (
                    <div
                        key={k.label}
                        className={`relative overflow-hidden rounded-2xl p-5 shadow-xl ${k.glow} border border-white/5`}
                        style={{ background: `linear-gradient(135deg, ${k.from}, ${k.to})` }}
                    >
                        {/* decorative circle */}
                        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20" style={{ background: k.from }} />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-2xl">{k.icon}</span>
                                <span className="text-white/60 text-xs">{k.unit}</span>
                            </div>
                            <p className="text-white font-bold text-3xl leading-none mb-1">{k.value}</p>
                            <p className="text-white/70 text-xs font-medium">{k.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Machine Type Cards ── */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
                {MACHINE_CONFIG.map(mc => (
                    <div
                        key={mc.key}
                        className="relative overflow-hidden rounded-xl p-3 border border-white/5 shadow-lg text-center"
                        style={{ background: 'var(--app-card)' }}
                    >
                        <div
                            className={`absolute inset-0 bg-gradient-to-br ${mc.gradient} opacity-[0.08] rounded-xl`}
                        />
                        <div className="relative z-10">
                            <div className="text-xl mb-1">{mc.icon}</div>
                            <div className="text-2xl font-bold text-app-heading">{byMachine[mc.key] || 0}</div>
                            <div className="text-[11px] text-app-muted mt-0.5 font-medium">{mc.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Chart ── */}
            <div
                className="rounded-2xl border border-app p-5 mb-8 shadow-xl"
                style={{ background: 'var(--app-card)' }}
            >
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-base font-semibold text-app-heading">จำนวนที่ล้างรายวัน</h2>
                        <p className="text-xs text-app-muted mt-0.5">ค่าเฉลี่ย {avg} เครื่อง/วัน</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-xs text-app-muted">จำนวนที่ล้าง</span>
                    </div>
                </div>
                {chartData.length === 0 ? (
                    <div className="h-52 flex flex-col items-center justify-center text-app-muted gap-2">
                        <span className="text-3xl opacity-30">📭</span>
                        <p className="text-sm">ไม่มีข้อมูลในช่วงนี้</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={230}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis
                                dataKey="date" tickFormatter={fmtShort} interval="preserveStartEnd"
                                tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{ background: 'var(--app-card)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
                                labelStyle={{ color: 'var(--app-heading)', fontWeight: 600, marginBottom: 4 }}
                                labelFormatter={d => fmtShort(String(d))}
                                formatter={(v) => [`${v} เครื่อง`, 'จำนวนที่ล้าง']}
                            />
                            <ReferenceLine y={parseFloat(avg)} stroke="#94a3b8" strokeDasharray="5 4"
                                label={{ value: `avg ${avg}`, fill: '#64748b', fontSize: 11, position: 'right' }} />
                            <Area
                                type="monotone" dataKey="count"
                                stroke="#3b82f6" strokeWidth={2.5}
                                fill="url(#blueGrad)"
                                dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                                activeDot={{ r: 5, fill: '#60a5fa', stroke: '#3b82f6', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Detail Table ── */}
            <div
                className="rounded-2xl border border-app shadow-xl overflow-hidden"
                style={{ background: 'var(--app-card)' }}
            >
                <div className="px-5 py-4 border-b border-app flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-app-heading">รายการล้างแอร์ตามตำแหน่ง</h2>
                        <p className="text-xs text-app-muted mt-0.5">{tableRows.length} กลุ่มตำแหน่ง</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm">
                        🗂️
                    </div>
                </div>

                {tableRows.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-3 text-app-muted">
                        <span className="text-4xl opacity-20">🗂️</span>
                        <p className="text-sm">ไม่มีข้อมูลที่ล้างแล้วในช่วงที่เลือก</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-[11px] font-medium text-app-muted uppercase tracking-wide"
                                    style={{ background: 'rgba(148,163,184,0.05)' }}>
                                    <th className="px-5 py-3 w-8">#</th>
                                    <th className="px-5 py-3">ประเภท</th>
                                    <th className="px-5 py-3">สถานที่</th>
                                    <th className="px-5 py-3">ห้อง</th>
                                    <th className="px-5 py-3 text-right">จำนวนที่ล้าง</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.map((row, i) => (
                                    <tr
                                        key={row.key}
                                        className="border-t border-app hover:bg-white/[0.02] transition-colors duration-150"
                                    >
                                        <td className="px-5 py-3.5 text-app-muted text-xs font-mono">{String(i + 1).padStart(2, '0')}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${BADGE_STYLE[row.mt] || BADGE_STYLE.OTHER}`}>
                                                {MACHINE_CONFIG.find(m => m.key === row.mt)?.icon || '⚙️'}
                                                {MACHINE_CONFIG.find(m => m.key === row.mt)?.label || row.mt}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-app-body text-sm">{row.loc}</td>
                                        <td className="px-5 py-3.5 text-app-muted text-sm">{row.room}</td>
                                        <td className="px-5 py-3.5 text-right">
                                            <span className="inline-flex items-center gap-1 font-bold text-app-heading">
                                                {row.count}
                                                <span className="text-xs font-normal text-app-muted">เครื่อง</span>
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex gap-4 text-sm">
                <Link href="/reports/maintenance" className="text-app-muted hover:text-app-body transition-colors">
                    → รายงานการบำรุงรักษา
                </Link>
                <Link href="/" className="text-app-muted hover:text-app-body transition-colors">
                    ← กลับ Dashboard
                </Link>
            </div>
        </div>
    )
}
