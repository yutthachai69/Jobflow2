import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverActions: {
    bodySizeLimit: '10mb', // เพิ่ม limit เป็น 10 MB สำหรับรูปภาพ Base64 (รองรับรูปประมาณ 7-8 MB)
  },
};

export default nextConfig;
