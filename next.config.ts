import type { NextConfig } from 'next'
import packageJson from './package.json'

const isDev = process.env.NODE_ENV !== 'production'

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'profile.line-scdn.net' },
    ],
  },
  env: {
    // ดึง version จาก package.json มาใช้ (เปลี่ยนที่เดียว ใช้ได้ทุกที่)
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    // NEXT_PUBLIC_APP_NAME: 'Flomac Service',
    NEXT_PUBLIC_APP_NAME: 'LMT air service',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: isDev
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://static.line-scdn.net https://d.line-scdn.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.supabase.co https://*.public.blob.vercel-storage.com https://*.line-scdn.net https://profile.line-scdn.net; connect-src 'self' https://*.supabase.co https://*.public.blob.vercel-storage.com https://api.line.me https://*.line-scdn.net; frame-ancestors https://line.me https://*.line.me;"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.line-scdn.net https://d.line-scdn.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.supabase.co https://*.public.blob.vercel-storage.com https://*.line-scdn.net https://profile.line-scdn.net; connect-src 'self' https://*.supabase.co https://*.public.blob.vercel-storage.com https://api.line.me https://*.line-scdn.net; frame-ancestors https://line.me https://*.line.me; base-uri 'self'; form-action 'self'",
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
            value: 'geolocation=(), microphone=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig