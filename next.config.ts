import type { NextConfig } from 'next'
import packageJson from './package.json'

const isDev = process.env.NODE_ENV !== 'production'

const nextConfig: NextConfig = {
  output: 'standalone', // <--- สำคัญมาก! ต้องเติมบรรทัดนี้ครับ เพื่อให้ Docker ทำงานได้
  images: {
    unoptimized: true,
    remotePatterns: [],
  },
  env: {
    // ดึง version จาก package.json มาใช้ (เปลี่ยนที่เดียว ใช้ได้ทุกที่)
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    // NEXT_PUBLIC_APP_NAME: 'Flomac Service',
    NEXT_PUBLIC_APP_NAME: 'L.M.T.',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: isDev
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'"
              : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig