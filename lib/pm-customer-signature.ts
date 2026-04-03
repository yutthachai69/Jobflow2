/**
 * PM รายงาน (Airborne / Exhaust): ประเภทฟอร์ม, ลายเซ็นลูกค้าใน checklist, merge ลายเซ็น
 */

export type PmReportFormType =
  | "AIRBORNE_INFECTION"
  | "EXHAUST_FAN"
  | "GENERAL"
  | "OTHER";

type AssetLike = {
  qrCode?: string | null;
  assetType?: string | null;
};

export function inferPmReportFormType(
  checklist: string | null,
  asset: AssetLike
): PmReportFormType {
  let formType = "AIRBORNE_INFECTION";
  if (checklist) {
    try {
      const parsed = JSON.parse(checklist) as { formType?: string };
      if (parsed?.formType) {
        const t = parsed.formType;
        formType = t === "CLEAN_ROOM" ? "AIRBORNE_INFECTION" : t;
      }
    } catch {
      /* ignore */
    }
  }
  if (
    formType === "AIRBORNE_INFECTION" &&
    (asset.assetType === "EXHAUST" || (asset.qrCode || "").startsWith("EX-"))
  ) {
    formType = "EXHAUST_FAN";
  }
  if (formType === "GENERAL") return "GENERAL";
  if (formType === "EXHAUST_FAN") return "EXHAUST_FAN";
  if (formType === "AIRBORNE_INFECTION") return "AIRBORNE_INFECTION";
  return "OTHER";
}

export function pmFormRequiresCustomerSignature(
  formType: PmReportFormType
): boolean {
  return formType === "EXHAUST_FAN" || formType === "AIRBORNE_INFECTION";
}

/** PM: ใช้ inference จาก checklist + asset เหมือนเดิม
 *  CM: บังคับลายเซ็นเฉพาะเมื่อมีแบบฟอร์มใน checklist (เปิดใบ CM พร้อมเลือกฟอร์ม) — ไม่กระทบใบ CM เก่าที่ไม่มี checklist */
export function jobItemRequiresCustomerSignatureInChecklist(
  jobType: "PM" | "CM" | "INSTALL",
  checklist: string | null,
  asset: AssetLike
): boolean {
  if (jobType !== "PM" && jobType !== "CM") return false;
  if (jobType === "CM") {
    if (!checklist) return false;
    try {
      const parsed = JSON.parse(checklist) as { formType?: unknown };
      if (typeof parsed?.formType !== "string" || !parsed.formType.trim()) {
        return false;
      }
    } catch {
      return false;
    }
  }
  const ft = inferPmReportFormType(checklist, asset);
  return pmFormRequiresCustomerSignature(ft);
}

export function hasPmChecklistCustomerSignature(
  checklist: string | null
): boolean {
  if (!checklist) return false;
  try {
    const parsed = JSON.parse(checklist) as {
      data?: { customerSignature?: string | null };
      customerSignature?: string | null;
    };
    const data = parsed.data ?? parsed;
    const sig = data?.customerSignature;
    return typeof sig === "string" && sig.trim().length > 20;
  } catch {
    return false;
  }
}

export function mergeCustomerSignatureIntoPmChecklist(
  checklist: string | null,
  formType: "EXHAUST_FAN" | "AIRBORNE_INFECTION",
  signatureDataUrl: string
): string {
  let parsed: { formType?: string; data?: Record<string, unknown> } = {};
  if (checklist) {
    try {
      parsed = JSON.parse(checklist) as typeof parsed;
    } catch {
      parsed = {};
    }
  }
  const prevData =
    parsed.data && typeof parsed.data === "object" && !Array.isArray(parsed.data)
      ? (parsed.data as Record<string, unknown>)
      : {};
  parsed.formType = formType;
  parsed.data = { ...prevData, customerSignature: signatureDataUrl };
  return JSON.stringify(parsed);
}
