/** หัวข้อแจ้งเตือนลายเซ็นลูกค้า (PM / CM ที่มีแบบฟอร์มรายงาน) */
export const PM_CLIENT_SIGN_REQUEST_TITLE = "กรุณาเซ็นรับรองงาน PM" // เก่าใน DB
export const CLIENT_SIGN_REQUEST_TITLE = "กรุณาเซ็นรับรองงาน"
export const PM_TECH_SIGN_COMPLETE_TITLE = "ลูกค้าเซ็นรายงาน PM แล้ว"
export const TECH_SIGN_COMPLETE_TITLE = "ลูกค้าเซ็นรายงานแล้ว"

export function isClientSignRequestNotificationTitle(title: string): boolean {
  return (
    title === PM_CLIENT_SIGN_REQUEST_TITLE || title === CLIENT_SIGN_REQUEST_TITLE
  );
}

export function isTechSignCompleteNotificationTitle(title: string): boolean {
  return (
    title === PM_TECH_SIGN_COMPLETE_TITLE || title === TECH_SIGN_COMPLETE_TITLE
  );
}
