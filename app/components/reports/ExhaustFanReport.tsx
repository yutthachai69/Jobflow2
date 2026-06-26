"use client";

import React, { useEffect, useMemo } from "react";
import { getPmWashTypeLabelThai } from "@/lib/pm-wash-label";
import ReportPdfDownloadButton from "./ReportPdfDownloadButton";

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
        .exhaust-report-body { font-family: 'Tahoma', sans-serif; font-size: 9px; line-height: 1.2; margin: 0; padding: 0; background-color: #f3f4f6; }
        .exhaust-report-container { width: 190mm; max-width: 190mm; background: #fff; padding: 10mm; box-sizing: border-box; }
        .exhaust-header-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .exhaust-logo-box { border: 2px solid black; width: 60px; height: 55px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }
        .exhaust-company-name { font-size: 13px; font-weight: bold; margin: 0; text-align: center; }
        .exhaust-address-text { font-size: 7.5px; margin: 2px 0; text-align: center; }
        .exhaust-main-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .exhaust-main-table th, .exhaust-main-table td { border: 1px solid black; padding: 4px; vertical-align: middle; word-wrap: break-word; overflow-wrap: break-word; white-space: normal; }
        .bg-blue { background-color: #b4c7e7 !important; -webkit-print-color-adjust: exact; text-align: center; font-weight: bold; }
        .bg-blue-left { background-color: #b4c7e7 !important; -webkit-print-color-adjust: exact; font-weight: bold; }
        .bg-cream { background-color: #fff9e6 !important; -webkit-print-color-adjust: exact; }
        .title-row { background-color: #b4c7e7 !important; -webkit-print-color-adjust: exact; text-align: center; font-weight: bold; font-size: 11px; }
        .fan-type-bar { border: 1px solid black; border-top: none; border-bottom: none; padding: 5px; font-weight: bold; background-color: #b4c7e7 !important; -webkit-print-color-adjust: exact; }
        .remarks-header { background-color: #b4c7e7 !important; -webkit-print-color-adjust: exact; text-align: center; font-weight: bold; border: 1px solid black; border-top: none; padding: 4px; }
        .remarks-body { border: 1px solid black; border-top: none; border-bottom: none; min-height: 40px; padding: 6px 8px; white-space: pre-wrap; }
        .sig-table { width: 100%; border-collapse: collapse; }
        .sig-table td { border: 1px solid black; vertical-align: top; font-weight: bold; padding: 4px; width: 33.33%; }
        .sig-cell { height: 55px; vertical-align: middle !important; text-align: center; }
        .sig-date-cell { height: 20px; vertical-align: middle !important; }
        .no-print-toolbar { position: fixed; right: 16px; bottom: 20px; z-index: 50; display: flex; flex-direction: column; gap: 8px; }
        .no-print-toolbar button { padding: 10px 14px; border-radius: 8px; border: none; cursor: pointer; font-size: 12px; font-weight: 600; }
        .btn-print { background-color: #2563eb; color: #fff; }
        .btn-back { background-color: #e5e7eb; color: #111827; }
        @media print {
          .no-print-toolbar { display: none !important; }
          body { -webkit-print-color-adjust: exact; background-color: #ffffff !important; }
          header, nav, aside, .sidebar, button, [role="button"] { display: none !important; }
          main, #__next, body, html { padding: 0 !important; margin: 0 !important; overflow: visible !important; }
          .exhaust-report-body { background: transparent !important; padding: 0 !important; min-height: auto !important; display: block !important; }
          .exhaust-report-container { width: 100% !important; max-width: 100% !important; box-shadow: none !important; margin: 0 !important; }
        }
      `,
        }}
      />

      <div className="exhaust-report-body min-h-screen py-6 flex justify-center">
        <div className="no-print-toolbar">
          <ReportPdfDownloadButton jobItemId={jobItem?.id} />
          <button className="btn-print" onClick={() => window.print()}>🖨️ พิมพ์ฟอร์ม (A4)</button>
          <button className="btn-back" onClick={() => window.history.back()}>← กลับ</button>
        </div>

        {/* overflow-x: auto wrapper สำหรับมือถือ */}
        <div style={{ width: "100%", overflowX: "auto", padding: "0 8px 80px" }}>
          <div className="exhaust-report-container shadow-xl border border-gray-300 mx-auto">

            {/* Header — table layout แทน negative margin hack */}
            <table className="exhaust-header-table">
              <tbody>
                <tr>
                  <td style={{ width: "15%", verticalAlign: "top" }}>
                    <div className="exhaust-logo-box">L.M.T.</div>
                  </td>
                  <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                    <p className="exhaust-company-name">L.M.T. Enigneering Limited Partnership</p>
                    <p style={{ fontWeight: "bold", margin: "1px", fontSize: "11px", textAlign: "center" }}>
                      ห้างหุ้นส่วนจำกัด แอล.เอ็ม.ที. เอ็นจิเนียริ่ง
                    </p>
                    <p className="exhaust-address-text">
                      98 ซอยกรุงเทพกรีฑา 51 แขวงทับช้าง เขตสะพานสูง กรุงเทพฯ 10250 เลขประจำตัวผู้เสียภาษี 0103564014496
                    </p>
                    <p className="exhaust-address-text">โทร : 088 307 1002, 098 519 4855 Email : lmt3engineering@gmail.com</p>
                  </td>
                  <td style={{ width: "15%" }}></td>
                </tr>
              </tbody>
            </table>

            {/* Info table */}
            <table className="exhaust-main-table">
              <tbody>
                <tr className="title-row">
                  <td colSpan={4} style={{ padding: "5px" }}>CLEAN ROOM AND AIRBORNE INFECTION CONTROL ROOM REPORT</td>
                </tr>
                <tr>
                  <td className="bg-blue-left" style={{ width: "18%" }}>CUSTOMER NAME</td>
                  <td style={{ width: "35%" }}>{customerName}</td>
                  <td className="bg-blue-left" style={{ width: "10%" }}>DATE</td>
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

            <div className="fan-type-bar">EXHAUST FAN TYPE</div>

            <table className="exhaust-main-table">
              <tbody>
                <tr className="bg-blue">
                  <td style={{ width: "20%" }}>DESCRIPTION</td>
                  <td style={{ width: "9%" }}>BEFORE</td>
                  <td style={{ width: "9%" }}>AFTER</td>
                  <td style={{ width: "26%" }}>DESCRIPTION</td>
                  <td style={{ width: "7%" }}>ปกติ</td>
                  <td style={{ width: "7%" }}>ผิดปกติ</td>
                  <td style={{ width: "22%" }}>หมายเหตุ</td>
                </tr>
                <tr>
                  <td>SOUND LEVEL (dB).</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{data.soundLevelDb ?? ""}</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{data.soundLevelDbAfter ?? ""}</td>
                  <td>ความสะอาดตัว MOTOR</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{check(data.motorClean, "normal")}</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{check(data.motorClean, "abnormal")}</td>
                  <td className="bg-cream">{data.remarksMotorClean ?? ""}</td>
                </tr>
                <tr>
                  <td>AIR FLOW (CFM.)</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{data.airFlowCfm ?? ""}</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{data.airFlowCfmAfter ?? ""}</td>
                  <td>ใบพัด MOTOR</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{check(data.fanMotor, "normal")}</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{check(data.fanMotor, "abnormal")}</td>
                  <td className="bg-cream">{data.remarksFanMotor ?? ""}</td>
                </tr>
                <tr>
                  <td></td>
                  <td className="bg-cream"></td>
                  <td className="bg-cream"></td>
                  <td>ความสะอาดหน้ากาก MOTOR</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{check(data.maskClean, "normal")}</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{check(data.maskClean, "abnormal")}</td>
                  <td className="bg-cream">{data.remarksMaskClean ?? ""}</td>
                </tr>
                <tr>
                  <td className="bg-blue-left">MOTOR CURRENT</td>
                  <td className="bg-cream"></td>
                  <td className="bg-cream"></td>
                  <td>CAP คาปาซิเตอร์ส</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{check(data.capCapacitor, "normal")}</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{check(data.capCapacitor, "abnormal")}</td>
                  <td className="bg-cream">{data.remarksCapCapacitor ?? ""}</td>
                </tr>
                <tr>
                  <td>L 1</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{data.motorL1 ?? ""}</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{data.motorL1After ?? ""}</td>
                  <td></td><td className="bg-cream"></td><td className="bg-cream"></td><td className="bg-cream"></td>
                </tr>
                <tr>
                  <td>L 2</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{data.motorL2 ?? ""}</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{data.motorL2After ?? ""}</td>
                  <td></td><td className="bg-cream"></td><td className="bg-cream"></td><td className="bg-cream"></td>
                </tr>
                <tr>
                  <td>L 3</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{data.motorL3 ?? ""}</td>
                  <td className="bg-cream" style={{ textAlign: "center" }}>{data.motorL3After ?? ""}</td>
                  <td></td><td className="bg-cream"></td><td className="bg-cream"></td><td className="bg-cream"></td>
                </tr>
                <tr>
                  <td></td>
                  <td className="bg-cream"></td><td className="bg-cream"></td>
                  <td></td><td className="bg-cream"></td><td className="bg-cream"></td><td className="bg-cream"></td>
                </tr>
              </tbody>
            </table>

            <div className="remarks-header">REMARKS</div>
            <div className="remarks-body">{data.remarksGeneral || ""}</div>

            <table className="sig-table">
              <tbody>
                <tr className="bg-blue" style={{ textAlign: "left" }}>
                  <td>CUSTOMER SIGNATURE</td>
                  <td>WARD NURSE SIGNATURE</td>
                  <td>SERVICE SIGNATURE</td>
                </tr>
                <tr>
                  <td className="sig-cell">
                    {sigImg(data.customerSignature) ? <span dangerouslySetInnerHTML={sigImg(data.customerSignature)!} /> : null}
                  </td>
                  <td className="sig-cell">
                    {sigImg(data.wardNurseSignature) ? <span dangerouslySetInnerHTML={sigImg(data.wardNurseSignature)!} /> : null}
                  </td>
                  <td className="sig-cell">
                    {sigImg(data.serviceSignature) ? <span dangerouslySetInnerHTML={sigImg(data.serviceSignature)!} /> : null}
                  </td>
                </tr>
                <tr>
                  <td className="sig-date-cell">DATE</td>
                  <td className="sig-date-cell">DATE</td>
                  <td className="sig-date-cell">DATE</td>
                </tr>
              </tbody>
            </table>

            <p style={{ fontSize: "8.5px", marginTop: "10px" }}>
              หมายเหตุ ถ้ามีเครื่องหมาย ( ✓ ) แสดงว่าเครื่องปรับอากาศมีอุปกรณ์ แต่ถ้ามีเครื่องหมาย ( - ) แสดงว่าเครื่องปรับอากาศไม่มีอุปกรณ์
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
