'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import DeleteButton from './DeleteButton'
import LockButton from './LockButton'
import { isAccountLocked } from '@/lib/account-lock'
import EmptyState from '@/app/components/EmptyState'

interface User {
  id: string
  username: string
  fullName: string | null
  role: string
  locked: boolean
  lockedUntil: Date | null
  lockedReason: string | null
  createdAt: Date
  site: {
    id: string
    name: string
    client: {
      name: string
    }
  } | null
}

interface Props {
  users: User[]
  currentUserId: string
}

export default function UsersClient({ users, currentUserId }: Props) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search filter
      const searchLower = search.toLowerCase()
      const matchesSearch =
        !search ||
        u.username.toLowerCase().includes(searchLower) ||
        u.fullName?.toLowerCase().includes(searchLower) ||
        u.site?.name.toLowerCase().includes(searchLower) ||
        u.site?.client.name.toLowerCase().includes(searchLower)

      // Role filter
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'ผู้ดูแลระบบ'
      case 'TECHNICIAN':
        return 'ช่าง'
      case 'CLIENT':
        return 'ลูกค้า'
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800'
      case 'TECHNICIAN':
        return 'bg-blue-100 text-blue-800'
      case 'CLIENT':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      {/* Search & Filter */}
      <div className="mb-6 bg-app-card rounded-lg shadow-sm border border-app p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="ค้นหาตามชื่อผู้ใช้, ชื่อ-นามสกุล, สถานที่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-app rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-app-card text-app-body text-sm placeholder-app-muted"
            />
          </div>

          {/* Role Filter */}
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full border border-app rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-app-card text-app-body text-sm"
            >
              <option value="ALL">ทุกบทบาท</option>
              <option value="ADMIN">ผู้ดูแลระบบ</option>
              <option value="TECHNICIAN">ช่าง</option>
              <option value="CLIENT">ลูกค้า</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <EmptyState
            icon="👥"
            title={search || roleFilter !== 'ALL' ? "ไม่พบข้อมูลที่ค้นหา" : "ยังไม่มีผู้ใช้งาน"}
            description={search || roleFilter !== 'ALL' ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "เริ่มต้นโดยการเพิ่มผู้ใช้ใหม่"}
            actionLabel={!search && roleFilter === 'ALL' ? "+ เพิ่มผู้ใช้ใหม่" : undefined}
            actionHref={!search && roleFilter === 'ALL' ? "/users/new" : undefined}
          />
        ) : (
          filteredUsers.map((u) => {
            const locked = isAccountLocked(u)
            return (
              <div key={u.id} className={`bg-app-card rounded-lg border border-app p-4 shadow-sm ${locked ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-app-heading text-base mb-1">
                      {u.username}
                    </div>
                    {u.fullName && (
                      <div className="text-sm text-app-body mb-2">
                        {u.fullName}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(u.role)}`}>
                    {getRoleLabel(u.role)}
                  </span>
                </div>

                <div className="space-y-2 mb-3 pb-3 border-b border-app">
                  <div>
                    <div className="text-xs text-app-muted mb-1">สถานะ</div>
                    {locked ? (
                      <div className="flex flex-col gap-1">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 w-fit">
                          ล็อก
                        </span>
                        {u.lockedUntil && (
                          <span className="text-xs text-gray-500">
                            ถึง {new Date(u.lockedUntil).toLocaleString('th-TH')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 w-fit">
                        ปกติ
                      </span>
                    )}
                  </div>

                  {u.role === 'CLIENT' && u.site && (
                    <div>
                      <div className="text-xs text-app-muted mb-1">สถานที่</div>
                      <div className="text-sm text-app-heading font-medium">{u.site.name}</div>
                      <div className="text-xs text-app-muted">{u.site.client.name}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-app-muted mb-1">วันที่สร้าง</div>
                    <div className="text-sm text-app-body">
                      {new Date(u.createdAt).toLocaleDateString('th-TH')}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href={`/users/${u.id}/edit`}
                    className="w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    แก้ไข
                  </Link>
                  <div className="flex gap-2">
                    {u.id !== currentUserId && (
                      <div className="flex-1">
                        <LockButton
                          userId={u.id}
                          username={u.username}
                          isLocked={locked}
                        />
                      </div>
                    )}
                    {u.id !== currentUserId ? (
                      <div className="flex-1">
                        <DeleteButton userId={u.id} username={u.username} />
                      </div>
                    ) : (
                      <button
                        disabled
                        className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-md cursor-not-allowed opacity-50 text-sm font-medium"
                        title="ไม่สามารถลบบัญชีของตัวเองได้"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto border border-app rounded-lg shadow-sm bg-app-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-app-section uppercase font-medium border-b border-app">
            <tr>
              <th className="px-6 py-3 text-app-heading">ชื่อผู้ใช้</th>
              <th className="px-6 py-3 text-app-heading">ชื่อ-นามสกุล</th>
              <th className="px-6 py-3 text-app-heading">บทบาท</th>
              <th className="px-6 py-3 text-app-heading">สถานะ</th>
              <th className="px-6 py-3 text-app-heading">สถานที่ (สำหรับ CLIENT)</th>
              <th className="px-6 py-3 text-app-heading">วันที่สร้าง</th>
              <th className="px-6 py-3 text-app-heading">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12">
                  <EmptyState
                    icon="👥"
                    title={search || roleFilter !== 'ALL' ? "ไม่พบข้อมูลที่ค้นหา" : "ยังไม่มีผู้ใช้งาน"}
                    description={search || roleFilter !== 'ALL' ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "เริ่มต้นโดยการเพิ่มผู้ใช้ใหม่"}
                    actionLabel={!search && roleFilter === 'ALL' ? "+ เพิ่มผู้ใช้ใหม่" : undefined}
                    actionHref={!search && roleFilter === 'ALL' ? "/users/new" : undefined}
                  />
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const locked = isAccountLocked(u)
                return (
                  <tr key={u.id} className={`hover:bg-app-accent ${locked ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                    <td className="px-6 py-4 font-medium text-app-heading">{u.username}</td>
                    <td className="px-6 py-4 text-app-body">{u.fullName || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(u.role)}`}>
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {locked ? (
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            ล็อก
                          </span>
                          {u.lockedUntil && (
                            <span className="text-xs text-gray-500">
                              ถึง {new Date(u.lockedUntil).toLocaleString('th-TH')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          ปกติ
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {u.role === 'CLIENT' && u.site ? (
                        <div>
                          <div className="font-medium text-app-heading">{u.site.name}</div>
                          <div className="text-xs text-app-muted">{u.site.client.name}</div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-app-body text-xs">
                      {new Date(u.createdAt).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/users/${u.id}/edit`}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          แก้ไข
                        </Link>
                        {u.id !== currentUserId && (
                          <LockButton
                            userId={u.id}
                            username={u.username}
                            isLocked={locked}
                          />
                        )}
                        {u.id !== currentUserId ? (
                          <DeleteButton userId={u.id} username={u.username} />
                        ) : (
                          <button
                            disabled
                            className="inline-flex items-center px-3 py-1.5 bg-gray-400 text-white text-sm rounded-md cursor-not-allowed opacity-50"
                            title="ไม่สามารถลบบัญชีของตัวเองได้"
                          >
                            ลบ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredUsers.length > 0 && (
        <div className="mt-4 text-sm text-app-muted">
          แสดง {filteredUsers.length} จาก {users.length} รายการ
        </div>
      )}
    </>
  )
}
