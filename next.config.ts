import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

const nextConfig: NextConfig = {
  output: 'standalone', // <--- สำคัญมาก! ต้องเติมบรรทัดนี้ครับ เพื่อให้ Docker ทำงานได้
  images: {
    unoptimized: true, 
    remotePatterns: [],
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
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'",
          },
        ],
      },
    ]
  },
}

export default nextConfig