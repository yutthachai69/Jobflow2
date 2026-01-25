// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   // Note: bodySizeLimit is configured via environment variable or middleware
//   // For Next.js 16, use experimental.serverActions.bodySizeLimit if needed
  
//   // ปิด request logging (Next.js 16 ไม่มี logging option โดยตรง)
//   // สามารถปิดได้โดยตั้ง environment variable: NEXT_PRIVATE_STANDALONE=true
//   // หรือใช้ custom logging configuration
// };

// export default nextConfig;
import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

const nextConfig: NextConfig = {
  images: {
    unoptimized: isDev, // ใช้ unoptimized ใน development mode เพื่อแก้ปัญหา
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
              : "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'",
          },
        ],
      },
    ]
  },
}

export default nextConfig

