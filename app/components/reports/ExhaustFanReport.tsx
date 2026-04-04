"use client";

import React, { useEffect, useMemo } from "react";
import { getPmWashTypeLabelThai } from "@/lib/pm-wash-label";

interface ExhaustFanReportProps {
  jobItem: any;
}

interface ExhaustData {
  soundLevelDb?: string;
  soundLevelDbAfter?: string;
  airFlowCfm?: string;
  airFlowCfmAfter?: string;
  motorL1?: string;
  motorL1After?: string;
  motorL2?: string;
  motorL2After?: string;
  motorL3?: string;
  motorL3After?: string;
  motorClean?: string;
  remarksMotorClean?: string;
  fanMotor?: string;
  remarksFanMotor?: string;
  maskClean?: string;
  remarksMaskClean?: string;
  capCapacitor?: string;
  remarksCapCapacitor?: string;
  remarksGeneral?: string;
  customerSignature?: string | null;
  wardNurseSignature?: string | null;
  serviceSignature?: string | null;
}

export default function ExhaustFanReport({ jobItem }: ExhaustFanReportProps) {
  const customerName = jobItem?.workOrder?.site?.client?.name || "";
  const location = jobItem?.workOrder?.site?.name || "";
  const roomType = jobItem?.asset?.room?.name || "";
  const dateStr = jobItem?.workOrder?.scheduledDate
    ? new Date(jobItem.workOrder.scheduledDate).toLocaleDateString("th-TH")
    : "";

  const pmWashLabel = useMemo(
    () => getPmWashTypeLabelThai(jobItem?.workOrder?.jobType ?? "", jobItem ?? {}),
    [jobItem]
  );

  const data = useMemo((): ExhaustData => {
    if (!jobItem?.checklist) return {};
    try {
      const parsed = JSON.parse(jobItem.checklist) as { formType?: string; data?: ExhaustData } | ExhaustData;
      if (parsed && typeof parsed === "object" && "data" in parsed && parsed.data) return parsed.data;
      return (parsed as ExhaustData) ?? {};
    } catch {
      return {};
    }
  }, [jobItem?.checklist]);

  const check = (value: string | undefined, expected: string) =>
    value === expected ? "✓" : "";
  const sigImg = (src: string | undefined | null) =>
    src && (src.startsWith("data:") || src.startsWith("http"))
      ? { __html: `<img src="${String(src).replace(/"/g, "&quot;")}" alt="" style="max-height:64px;width:auto;display:block;margin:0 auto;" />` }
      : null;

  useEffect(() => {
    if (jobItem) {
      const assetName = jobItem.asset?.name || jobItem.asset?.qrCode || "Asset";
      const safeTitle = `Exhaust_Fan_Report_${assetName}`.replace(/[^a-zA-Z0-9-_]/g, "_");
      document.title = safeTitle;
    }
  }, [jobItem]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
      @page { size: A4; margin: 10mm; }
      body { margin: 0; padding: 0; }
      .report-body { font-family: 'Tahoma', sans-serif; font-size: 9px; line-height: 1.2; margin: 0; padding: 15px; background-color: #ffffff; }
      .container { width: 100%; max-width: 190mm; margin: auto; }
      .logo-box { border: 2px solid black; width: 60px; height: 55px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-bottom: 5px; }
      .header-info { text-align: center; margin-top: -60px; margin-bottom: 20px; }
      .company-name { font-size: 13px; font-weight: bold; margin: 0; }
      .address-text { font-size: 7.5px; margin: 2px 0; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid black; padding: 4px; vertical-align: middle; }
      .bg-blue { background-color: #b4c7e7; text-align: center; font-weight: bold; }
      .bg-blue-left { background-color: #b4c7e7; font-weight: bold; }
      .bg-cream { background-color: #fff9e6; }
      .title-row { background-color: #b4c7e7; text-align: center; font-weight: bold; font-size: 11px; height: 25px; }
      .fan-type { border: 1px solid black; border-top: none; padding: 5px; font-weight: bold; background-color: #b4c7e7; }
      .remarks-header { background-color: #b4c7e7; text-align: center; font-weight: bold; border: 1px solid black; padding: 4px; }
      .remarks-line { border: 1px solid black; border-top: none; height: 18px; }
      .sig-table td { height: 55px; vertical-align: top; font-weight: bold; }
      .sig-date { height: 20px !important; vertical-align: middle !important; }
      .no-print-toolbar { position: fixed; right: 20px; bottom: 20px; z-index: 50; display: flex; flex-direction: column; gap: 8px; }
      .no-print-toolbar button { padding: 8px 12px; border-radius: 6px; border: none; cursor: pointer; font-size: 12px; }
      .btn-print { background-color: #2563eb; color: #fff; }
      .btn-back { background-color: #e5e7eb; color: #111827; }
      @media print {
        .no-print-toolbar { display: none !important; }
        body { -webkit-print-color-adjust: exact; background-color: #ffffff !important; }
      }
    `,
        }}
      />

      <div className="report-body">
        <div className="no-print-toolbar">
          <button className="btn-print" onClick={() => window.print()}>
            🖨️ พิมพ์ฟอร์ม (A4)
          </button>
          <button className="btn-back" onClick={() => window.history.back()}>
            ← กลับ
          </button>
        </div>

        <div className="container">
          <div className="logo-box">L.M.T</div>
          <div className="header-info">
            <p className="company-name">L.M.T. Enigneering Limited Partnership</p>
            <p style={{ fontWeight: "bold", margin: "1px" }}>ห้างหุ้นส่วนจำกัด แอล.เอ็ม.ที. เอ็นจิเนียริ่ง</p>
            <p className="address-text">
              98 ซอยกรุงเทพกรีฑา 51 แขวงทับช้าง เขตสะพานสูง กรุงเทพฯ 10250 เลขประจำตัวผู้เสียภาษี 0103564014496
            </p>
            <p className="address-text">โทร : 088 307 1002, 098 519 4855 Email : lmt3engineering@gmail.com</p>
          </div>

          <table>
            <tbody>
              <tr className="title-row">
                <td colSpan={4}>CLEAN ROOM AND AIRBORNE INFECTION CONTROL ROOM REPORT</td>
              </tr>
              <tr>
                <td className="bg-blue-left" style={{ width: "18%" }}>
                  CUSTOMER NAME
                </td>
                <td style={{ width: "35%" }}>{customerName}</td>
                <td className="bg-blue-left" style={{ width: "10%" }}>
                  DATE
                </td>
                <td style={{ width: "37%" }}>{dateStr}</td>
              </tr>
              <tr>
                <td className="bg-blue-left">LOCATION</td>
                <td>{location}</td>
                <td className="bg-blue-left">ROOM TYPE</td>
                <td>{roomType}</td>
              </tr>
              {pmWashLabel && (
                <tr>
                  <td className="bg-blue-left">ประเภทการล้าง</td>
                  <td colSpan={3}>{pmWashLabel}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="fan-type">EXHAUST FAN TYPE</div>

          <table>
            <tbody>
              <tr className="bg-blue">
                <td style={{ width: "22%" }}>DESCRIPTION</td>
                <td style={{ width: "10%" }}>BEFORE</td>
                <td style={{ width: "10%" }}>AFTER</td>
                <td style={{ width: "28%" }}>DESCRIPTION</td>
                <td style={{ width: "6%" }}>ปกติ</td>
                <td style={{ width: "6%" }}>ผิดปกติ</td>
                <td>หมายเหตุ</td>
              </tr>
              <tr>
                <td>SOUND LEVEL (dB).</td>
                <td className="bg-cream">{data.soundLevelDb ?? ""}</td>
                <td className="bg-cream">{data.soundLevelDbAfter ?? ""}</td>
                <td>ความสะอาดตัว MOTOR</td>
                <td className="bg-cream">{check(data.motorClean, "normal")}</td>
                <td className="bg-cream">{check(data.motorClean, "abnormal")}</td>
                <td className="bg-cream">{data.remarksMotorClean ?? ""}</td>
              </tr>
              <tr>
                <td>AIR FLOW (CFM.)</td>
                <td className="bg-cream">{data.airFlowCfm ?? ""}</td>
                <td className="bg-cream">{data.airFlowCfmAfter ?? ""}</td>
                <td>ใบพัด MOTOR</td>
                <td className="bg-cream">{check(data.fanMotor, "normal")}</td>
                <td className="bg-cream">{check(data.fanMotor, "abnormal")}</td>
                <td className="bg-cream">{data.remarksFanMotor ?? ""}</td>
              </tr>
              <tr>
                <td></td>
                <td className="bg-cream"></td>
                <td className="bg-cream"></td>
                <td>ความสะอาดหน้ากาก MOTOR</td>
                <td className="bg-cream">{check(data.maskClean, "normal")}</td>
                <td className="bg-cream">{check(data.maskClean, "abnormal")}</td>
                <td className="bg-cream">{data.remarksMaskClean ?? ""}</td>
              </tr>
              <tr>
                <td className="bg-blue-left">MOTOR CURRENT</td>
                <td className="bg-cream"></td>
                <td className="bg-cream"></td>
                <td>CAP คาปาซิเตอร์ส</td>
                <td className="bg-cream">{check(data.capCapacitor, "normal")}</td>
                <td className="bg-cream">{check(data.capCapacitor, "abnormal")}</td>
                <td className="bg-cream">{data.remarksCapCapacitor ?? ""}</td>
              </tr>
              <tr>
                <td>L 1</td>
                <td className="bg-cream">{data.motorL1 ?? ""}</td>
                <td className="bg-cream">{data.motorL1After ?? ""}</td>
                <td></td>
                <td className="bg-cream"></td>
                <td className="bg-cream"></td>
                <td className="bg-cream"></td>
              </tr>
              <tr>
                <td>L 2</td>
                <td className="bg-cream">{data.motorL2 ?? ""}</td>
                <td className="bg-cream">{data.motorL2After ?? ""}</td>
                <td></td>
                <td className="bg-cream"></td>
                <td className="bg-cream"></td>
                <td className="bg-cream"></td>
              </tr>
              <tr>
                <td>L 3</td>
                <td className="bg-cream">{data.motorL3 ?? ""}</td>
                <td className="bg-cream">{data.motorL3After ?? ""}</td>
                <td></td>
                <td className="bg-cream"></td>
                <td className="bg-cream"></td>
                <td className="bg-cream"></td>
              </tr>
              <tr>
                <td></td>
                <td className="bg-cream"></td>
                <td className="bg-cream"></td>
                <td></td>
                <td className="bg-cream"></td>
                <td className="bg-cream"></td>
                <td className="bg-cream"></td>
              </tr>
            </tbody>
          </table>

          <div className="remarks-header">REMARKS</div>
          <div className="remarks-line" style={{ whiteSpace: "pre-wrap", padding: "6px 8px", minHeight: "40px" }}>
            {data.remarksGeneral || ""}
          </div>

          <table>
            <tbody>
              <tr className="bg-blue" style={{ textAlign: "left" }}>
                <td style={{ width: "33.33%" }}>CUSTOMER SIGNATURE</td>
                <td style={{ width: "33.33%" }}>WARD NURSE SIGNATURE</td>
                <td style={{ width: "33.33%" }}>SERVICE SIGNATURE</td>
              </tr>
              <tr className="sig-table">
                <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                  {sigImg(data.customerSignature) ? <span dangerouslySetInnerHTML={sigImg(data.customerSignature)!} /> : null}
                </td>
                <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                  {sigImg(data.wardNurseSignature) ? <span dangerouslySetInnerHTML={sigImg(data.wardNurseSignature)!} /> : null}
                </td>
                <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                  {sigImg(data.serviceSignature) ? <span dangerouslySetInnerHTML={sigImg(data.serviceSignature)!} /> : null}
                </td>
              </tr>
              <tr className="sig-date">
                <td>DATE</td>
                <td>DATE</td>
                <td>DATE</td>
              </tr>
            </tbody>
          </table>

          <p style={{ fontSize: "8.5px", marginTop: "10px" }}>
            หมายเหตุ ถ้ามีเครื่องหมาย ( ✓ ) แสดงว่าเครื่องปรับอากาศมีอุปกรณ์ แต่ถ้ามีเครื่องหมาย ( - ) แสดงว่าเครื่องปรับอากาศไม่มีอุปกรณ์
          </p>
        </div>
      </div>
    </>
  );
}

