/**
 * เปิดกล้องสำหรับ html5-qrcode แบบมี fallback
 * - ไม่เรียก getUserMedia แยกก่อนไลบรารี (บน Android Chrome มักทำให้เกิด NotAllowedError ซ้ำ/ผิดพลาด)
 * - ลอง constraint หลายแบบ แล้วค่อยสลับตาม deviceId จาก getCameras()
 */

import type { Html5Qrcode } from "html5-qrcode/esm/html5-qrcode"

export const HTML5_QR_SCAN_CONFIG = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
} as const

type QrSuccess = (decodedText: string, decodedResult: unknown) => void
type QrFailure = (errorMessage: string, error: unknown) => void

function pickBackCameraId(cameras: Array<{ id: string; label: string }>): string | null {
  if (!cameras.length) return null
  const back = cameras.find((c) => /back|rear|environment|wide|หลัง/i.test(c.label))
  if (back) return back.id
  return cameras[cameras.length - 1]?.id ?? cameras[0]?.id ?? null
}

/** ข้อความภาษาไทยจาก error จริงของเบราว์เซอร์ (ไม่ควรเดาว่าเป็นแค่ permission ทุกกรณี) */
export function describeCameraError(err: unknown): string {
  const e = err as DOMException & Error
  const name = e?.name ?? ""
  const msg = e instanceof Error ? e.message : String(err ?? "")

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return (
      "เบราว์เซอร์ยังไม่ยอมให้ใช้กล้อง — ลอง: (1) แตะ 🔒 หรือ ⋮ ข้างแถบ URL → การตั้งค่าเว็บไซต์ → กล้อง → อนุญาต " +
      "(2) ปิดแท็บนี้แล้วเปิดใหม่ (3) Chrome → ตั้งค่า → ความเป็นส่วนตัว → การตั้งค่าไซต์ → กล้อง ตรวจว่าไซต์นี้อนุญาต " +
      "หรือใช้ปุ่ม「เลือกรูป/แกลเลอรี่」ชั่วคราว"
    )
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "ไม่พบกล้องในอุปกรณ์นี้"
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "กล้องถูกแอปอื่นใช้อยู่ — ปิดแอปกล้อง/วิดีโอคอล แล้วลองใหม่"
  }
  if (name === "OverconstrainedError") {
    return "กล้องไม่รองรับโหมดที่ขอ — ลองเลือกรูปจากแกลเลอรี่ หรือลองใหม่อีกครั้ง"
  }
  if (name === "SecurityError") {
    return "เบราว์เซอร์บล็อกกล้อง — ต้องใช้ HTTPS (หรือ localhost) และไม่ใช้โหมดที่จำกัดกล้อง"
  }
  if (name === "AbortError") {
    return "การเปิดกล้องถูกยกเลิก — ลองกดเปิดกล้องอีกครั้ง"
  }
  if (msg && msg !== "[object Object]") {
    return `ไม่สามารถเปิดกล้องได้: ${msg}`
  }
  return "ไม่สามารถเปิดกล้องได้ — ลองเลือกรูปจากแกลเลอรี่ หรือรีเฟรชหน้าแล้วลองใหม่"
}

async function safeStopAndClear(qr: Html5Qrcode): Promise<void> {
  try {
    if (qr.isScanning) await qr.stop()
  } catch {
    /* ignore */
  }
  try {
    qr.clear()
  } catch {
    /* ignore */
  }
}

/**
 * สร้าง Html5Qrcode แล้ว start ด้วยลำดับ fallback จนกว่าจะสำเร็จ
 */
export async function startHtml5QrcodeWithFallbacks(
  elementId: string,
  onSuccess: QrSuccess,
  onFailure: QrFailure
): Promise<Html5Qrcode> {
  const { Html5Qrcode } = await import("html5-qrcode")

  const constraintAttempts: MediaTrackConstraints[] = [
    { facingMode: { ideal: "environment" } },
    { facingMode: "environment" },
    {},
  ]

  let lastError: unknown

  for (const constraints of constraintAttempts) {
    const qr = new Html5Qrcode(elementId, false)
    try {
      await qr.start(constraints, HTML5_QR_SCAN_CONFIG, onSuccess, onFailure)
      return qr
    } catch (e) {
      lastError = e
      await safeStopAndClear(qr)
    }
  }

  let cameras: Array<{ id: string; label: string }> = []
  try {
    cameras = await Html5Qrcode.getCameras()
  } catch (e) {
    lastError = e
  }

  if (cameras.length > 0) {
    const preferred = pickBackCameraId(cameras)
    const idsOrdered = [
      ...(preferred ? [preferred] : []),
      ...cameras.map((c) => c.id).filter((id) => id !== preferred),
    ]
    const uniqueIds = [...new Set(idsOrdered)]

    for (const cameraId of uniqueIds) {
      const qr = new Html5Qrcode(elementId, false)
      try {
        await qr.start(cameraId, HTML5_QR_SCAN_CONFIG, onSuccess, onFailure)
        return qr
      } catch (e) {
        lastError = e
        await safeStopAndClear(qr)
      }
    }
  }

  throw lastError ?? new Error("CAMERA_START_FAILED")
}
