'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import DeleteButton from './DeleteButton'
import LockButton from './LockButton'
import { isAccountLocked } from '@/lib/account-lock'

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
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="ค้นหาตามชื่อผู้ใช้, ชื่อ-นามสกุล, สถานที่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
            />
          </div>

          {/* Role Filter */}
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
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
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">ไม่พบข้อมูล</p>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const locked = isAccountLocked(u)
            return (
              <div key={u.id} className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${locked ? 'border-red-200 bg-red-50' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-base mb-1">
                      {u.username}
                    </div>
                    {u.fullName && (
                      <div className="text-sm text-gray-700 mb-2">
                        {u.fullName}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(u.role)}`}>
                    {getRoleLabel(u.role)}
                  </span>
                </div>

                <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">สถานะ</div>
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
                      <div className="text-xs text-gray-500 mb-1">สถานที่</div>
                      <div className="text-sm text-gray-900 font-medium">{u.site.name}</div>
                      <div className="text-xs text-gray-500">{u.site.client.name}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-gray-500 mb-1">วันที่สร้าง</div>
                    <div className="text-sm text-gray-600">
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
      <div className="hidden md:block overflow-x-auto border rounded-lg shadow-sm bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 uppercase font-medium border-b">
            <tr>
              <th className="px-6 py-3 text-gray-900">ชื่อผู้ใช้</th>
              <th className="px-6 py-3 text-gray-900">ชื่อ-นามสกุล</th>
              <th className="px-6 py-3 text-gray-900">บทบาท</th>
              <th className="px-6 py-3 text-gray-900">สถานะ</th>
              <th className="px-6 py-3 text-gray-900">สถานที่ (สำหรับ CLIENT)</th>
              <th className="px-6 py-3 text-gray-900">วันที่สร้าง</th>
              <th className="px-6 py-3 text-gray-900">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const locked = isAccountLocked(u)
                return (
                  <tr key={u.id} className={`hover:bg-gray-50 ${locked ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 font-medium text-gray-900">{u.username}</td>
                    <td className="px-6 py-4 text-gray-700">{u.fullName || '-'}</td>
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
                        <div className="font-medium text-gray-900">{u.site.name}</div>
                        <div className="text-xs text-gray-500">{u.site.client.name}</div>
                      </div>
                    ) : (
                      '-'
                    )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
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
        <div className="mt-4 text-sm text-gray-600">
          แสดง {filteredUsers.length} จาก {users.length} รายการ
        </div>
      )}
    </>
  )
}
