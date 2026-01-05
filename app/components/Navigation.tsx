"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";

interface User {
  username: string;
  fullName?: string;
  role: "ADMIN" | "TECHNICIAN" | "CLIENT";
}

interface NavigationProps {
  user: User | null;
  unreadMessageCount?: number;
}

export default function Navigation({ user, unreadMessageCount = 0 }: NavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ไม่แสดง Navigation bar ในหน้า welcome
  if (pathname === '/welcome') {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(path);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                href={user ? "/" : "/welcome"} 
                className="flex items-center gap-3"
              >
                <div className="h-10 flex items-center justify-center">
                  <img 
                    src="/Gemini_Generated_Image_5oosqk5oosqk5oos.png" 
                    alt="AirService Logo" 
                    className="h-8 w-auto object-contain"
                  />
                </div>
                <span className="text-xl font-semibold text-gray-900">
                  AirService
                </span>
              </Link>
            </div>
            {user && (
              <>
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden ml-4 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
                {/* Desktop menu */}
                <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
                {user.role === "CLIENT" && (
                  <>
                    <Link
                      href="/"
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/") && pathname === "/"
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/assets"
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/assets")
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      ทะเบียนแอร์
                    </Link>
                    <Link
                      href="/work-orders"
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/work-orders")
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      ประวัติงาน
                    </Link>
                    <Link
                      href="/contact"
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/contact")
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      ติดต่อเรา
                    </Link>
                  </>
                )}
                {user.role === "ADMIN" && (
                  <>
                    <Link
                      href="/"
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/") && pathname === "/"
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/work-orders"
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/work-orders")
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      ใบสั่งงาน
                    </Link>
                    <Link
                      href="/assets"
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/assets")
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      ทะเบียนแอร์
                    </Link>
                    <Link
                      href="/locations"
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/locations")
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      สถานที่
                    </Link>
                    <Link
                      href="/users"
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/users")
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      ผู้ใช้งาน
                    </Link>
                    <Link
                      href="/security-incidents"
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/security-incidents")
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      Security
                    </Link>
                    <Link
                      href="/contact"
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/contact")
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      ติดต่อเรา
                    </Link>
                  </>
                )}
                {user.role === "TECHNICIAN" && (
                  <>
                    <Link
                      href="/"
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/") && pathname === "/"
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/technician/scan"
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/technician/scan")
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      สแกน QR Code
                    </Link>
                    <Link
                      href="/technician"
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/technician") && !isActive("/technician/scan")
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      หน้างาน
                    </Link>
                    <Link
                      href="/work-orders"
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive("/work-orders")
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      ประวัติงาน
                    </Link>
                  </>
                )}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user ? (
              <>
                {user.role === "ADMIN" && (
                  <Link
                    href="/messages"
                    className={`relative inline-flex items-center justify-center p-2 rounded-md transition-colors ${
                      isActive("/messages")
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    title="กล่องข้อความ"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadMessageCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] h-[18px]">
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                      </span>
                    )}
                  </Link>
                )}
                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {user.fullName || user.username}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.role === "ADMIN" && "Admin"}
                      {user.role === "TECHNICIAN" && "ช่าง"}
                      {user.role === "CLIENT" && "ลูกค้า"}
                    </div>
                  </div>
                </div>
                <form action={logout}>
                  <button
                    type="submit"
                    className="bg-gray-700 hover:bg-gray-800 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
                  >
                    <span className="hidden sm:inline">ออกจากระบบ</span>
                    <span className="sm:hidden">ออก</span>
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
              >
                <span className="hidden sm:inline">เข้าสู่ระบบ</span>
                <span className="sm:hidden">เข้าสู่ระบบ</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {user && mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user.role === "CLIENT" && (
              <>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/") && pathname === "/"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/assets"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/assets")
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  ทะเบียนแอร์
                </Link>
                <Link
                  href="/work-orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/work-orders")
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  ประวัติงาน
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/contact")
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  ติดต่อเรา
                </Link>
              </>
            )}
            {user.role === "ADMIN" && (
              <>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/") && pathname === "/"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/work-orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/work-orders")
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  ใบสั่งงาน
                </Link>
                <Link
                  href="/assets"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/assets")
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  ทะเบียนแอร์
                </Link>
                <Link
                  href="/locations"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/locations")
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  สถานที่
                </Link>
                <Link
                  href="/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/users")
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  ผู้ใช้งาน
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/security-incidents"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive("/security-incidents")
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Security
                  </Link>
                )}
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/contact")
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  ติดต่อเรา
                </Link>
                <Link
                  href="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium relative ${
                    isActive("/messages")
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  กล่องข้อความ
                  {unreadMessageCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            {user.role === "TECHNICIAN" && (
              <>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/") && pathname === "/"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/technician/scan"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/technician/scan")
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  สแกน QR Code
                </Link>
                <Link
                  href="/technician"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/technician") && !isActive("/technician/scan")
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  หน้างาน
                </Link>
                <Link
                  href="/work-orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/work-orders")
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  ประวัติงาน
                </Link>
              </>
            )}
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-3 mb-3">
                <div className="text-sm font-medium text-gray-900">
                  {user.fullName || user.username}
                </div>
                <div className="text-xs text-gray-500">
                  {user.role === "ADMIN" && "Admin"}
                  {user.role === "TECHNICIAN" && "ช่าง"}
                  {user.role === "CLIENT" && "ลูกค้า"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}