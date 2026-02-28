'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

const COLORS = {
  PM: '#3b82f6',   // blue-500 – สีน้ำเงินสด
  CM: '#ef4444',   // red-500  – สีแดง
  INSTALL: '#f59e0b',   // amber-500 – สีเหลืองทอง
}

interface DailyPoint {
  date: string
  PM: number
  CM: number
  INSTALL: number
  รวม: number
}

interface MonthlyPoint {
  เดือน: string
  PM: number
  CM: number
  INSTALL: number
  รวม: number
}

interface ClientDashboardChartsProps {
  dailyData: DailyPoint[]
  monthlyData: MonthlyPoint[]
  siteName: string
  clientName: string
}

export default function ClientDashboardCharts({
  dailyData,
  monthlyData,
  siteName,
  clientName,
}: ClientDashboardChartsProps) {
  return (
    <div className="space-y-8">
      {/* กราฟสถิติรายวัน */}
      <div className="bg-app-card rounded-xl border border-app p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-app-heading mb-1">
          สถิติการดำเนินงานรายวัน
        </h3>
        <p className="text-sm text-app-muted mb-4">
          {siteName} • การล้างและซ่อมแอร์
        </p>
        <div className="h-64 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" opacity={0.5} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--app-text-muted)', fontSize: 12 }}
                stroke="var(--app-border)"
              />
              <YAxis
                tick={{ fill: 'var(--app-text-muted)', fontSize: 12 }}
                stroke="var(--app-border)"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--app-card)',
                  border: '1px solid var(--app-border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--app-text-heading)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (
                  <span style={{ color: 'var(--app-text-body)' }}>
                    {value === 'PM' ? 'บำรุงรักษา' : value === 'CM' ? 'ซ่อม' : value === 'INSTALL' ? 'ติดตั้ง' : value}
                  </span>
                )}
              />
              <Line type="monotone" dataKey="PM" stroke={COLORS.PM} strokeWidth={2} name="PM" dot={false} />
              <Line type="monotone" dataKey="CM" stroke={COLORS.CM} strokeWidth={2} name="CM" dot={false} />
              <Line type="monotone" dataKey="INSTALL" stroke={COLORS.INSTALL} strokeWidth={2} name="INSTALL" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* กราฟสถิติรายเดือน */}
      <div className="bg-app-card rounded-xl border border-app p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-app-heading mb-1">
          สถิติรายเดือน
        </h3>
        <p className="text-sm text-app-muted mb-4">
          {siteName} • {clientName}
        </p>
        <div className="h-64 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" opacity={0.5} />
              <XAxis
                dataKey="เดือน"
                tick={{ fill: 'var(--app-text-muted)', fontSize: 12 }}
                stroke="var(--app-border)"
              />
              <YAxis
                tick={{ fill: 'var(--app-text-muted)', fontSize: 12 }}
                stroke="var(--app-border)"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--app-card)',
                  border: '1px solid var(--app-border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--app-text-heading)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (
                  <span style={{ color: 'var(--app-text-body)' }}>
                    {value === 'PM' ? 'บำรุงรักษา' : value === 'CM' ? 'ซ่อม' : value === 'INSTALL' ? 'ติดตั้ง' : value}
                  </span>
                )}
              />
              <Bar dataKey="PM" fill={COLORS.PM} name="PM" radius={[4, 4, 0, 0]} />
              <Bar dataKey="CM" fill={COLORS.CM} name="CM" radius={[4, 4, 0, 0]} />
              <Bar dataKey="INSTALL" fill={COLORS.INSTALL} name="INSTALL" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
