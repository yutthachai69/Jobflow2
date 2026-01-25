
import { SignJWT, jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'my-super-secret-key-change-it-now'
)

// 1. ฟังก์ชันสร้าง Token (ใช้ตอน Login)
export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' }) // ใช้อัลกอริทึม HS256
    .setIssuedAt()
    .setExpirationTime('1d') // หมดอายุใน 1 วัน
    .sign(SECRET_KEY)
}

// 2. ฟังก์ชันตรวจสอบ Token (ใช้ใน Middleware / หน้าเว็บ)
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload as any // คืนค่าข้อมูล User (id, role, username)
  } catch (error) {
    return null // ถ้า Token ปลอมหรือหมดอายุ จะคืนค่า null
  }
}