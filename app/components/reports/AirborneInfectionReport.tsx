"use client";

import React, { useEffect, useState } from "react";
import NextImage from "next/image";

interface AirborneFormData {
    [key: string]: any;
}

interface AirborneReportProps {
    jobItem: any;
}

export default function AirborneInfectionReport({ jobItem }: AirborneReportProps) {
    const [data, setData] = useState<AirborneFormData>({});

    useEffect(() => {
        if (jobItem?.checklist) {
            try {
                const parsed = JSON.parse(jobItem.checklist);
                setData(parsed.data ? parsed.data : parsed);
            } catch (e) {
                console.error("Failed to parse checklist data", e);
            }
        }
    }, [jobItem]);

    useEffect(() => {
        if (jobItem) {
            const assetName = jobItem.asset?.name || jobItem.asset?.qrCode || "Asset";
            const dateStr = jobItem.workOrder?.scheduledDate
                ? new Date(jobItem.workOrder.scheduledDate).toISOString().split('T')[0]
                : "UnknownDate";
            const safeTitle = `Airborne_Report_${assetName}_${dateStr}`.replace(/[^a-zA-Z0-9-_]/g, '_');
            document.title = safeTitle;
        }
    }, [jobItem]);

    const renderCheck = (fieldName: string, expectedStatus: string) => {
        return data[fieldName] === expectedStatus ? "✓" : "";
    };

    const handleExportPDF = async () => {
        const element = document.querySelector('.report-container') as HTMLElement;
        if (!element) return;

        try {
            const { toPng } = await import('html-to-image');
            const jsPDF = (await import('jspdf')).default;

            const assetName = jobItem?.asset?.name || jobItem?.asset?.qrCode || "Asset";
            const dateStr = jobItem?.workOrder?.scheduledDate
                ? new Date(jobItem.workOrder.scheduledDate).toISOString().split('T')[0]
                : "UnknownDate";
            const filename = `Airborne_Report_${assetName}_${dateStr}.pdf`.replace(/[^a-zA-Z0-9-_\.]/g, '_');

            const pWidth = element.scrollWidth;
            const pHeight = element.scrollHeight;

            const dataUrl = await toPng(element, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                width: pWidth,
                height: pHeight,
                style: { margin: '0', padding: '0', border: 'none', boxShadow: 'none', transform: 'none' }
            });

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfWidth = 210;
            const pdfHeight = 297;
            const margin = 5;

            const maxImgWidth = pdfWidth - (margin * 2);
            const maxImgHeight = pdfHeight - (margin * 2);

            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve) => { img.onload = resolve; });

            let imgWidth = maxImgWidth;
            let imgHeight = (img.height * maxImgWidth) / img.width;

            if (imgHeight > maxImgHeight) {
                imgHeight = maxImgHeight;
                imgWidth = (img.width * maxImgHeight) / img.height;
            }

            const xOffset = margin + (maxImgWidth - imgWidth) / 2;
            const yOffset = Math.max(margin, margin + (maxImgHeight - imgHeight) / 2);

            pdf.addImage(dataUrl, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
            pdf.save(filename);
        } catch (error) {
            console.error("Failed to generate PDF", error);
            alert("เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่");
        }
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
        @page { size: A4; margin: 10mm; }
        .report-body { font-family: 'Sarabun', sans-serif; font-size: 10px; margin: 0; padding: 0; background-color: #fff; color: #000; }
        .report-container { width: 190mm; margin: 0 auto; }
        .header-table { width: 100%; border: none; margin-bottom: 5px; }
        .logo-box { width: 50px; height: 50px; border: 1.5px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }
        .company-header { text-align: center; line-height: 1.4; }
        .report-title-box { background-color: #a4c2f4 !important; -webkit-print-color-adjust: exact; text-align: center; font-weight: bold; font-size: 12px; padding: 4px; border: 1px solid #000; margin-bottom: -1px; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { border: 1px solid #000; padding: 4px; background-color: #a4c2f4 !important; -webkit-print-color-adjust: exact; font-weight: bold; }
        .info-table td.data { background-color: #fff !important; font-weight: normal; }
        .main-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .main-table th { background-color: #a4c2f4 !important; -webkit-print-color-adjust: exact; border: 1px solid #000; padding: 4px; font-size: 10px; white-space: nowrap; }
        .main-table td { border: 1px solid #000; padding: 3px 4px; min-height: 18px; vertical-align: top; word-wrap: break-word; white-space: normal; }
        .bg-yellow { background-color: #fff2cc !important; -webkit-print-color-adjust: exact; }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
        .remarks-section { border: 1px solid #000; border-top: none; padding: 4px; min-height: 100px; page-break-inside: avoid; break-inside: avoid; }
        .footer-table { width: 100%; border-collapse: collapse; margin-top: -1px; page-break-inside: avoid; break-inside: avoid; }
        .footer-table td { border: 1px solid #000; padding: 4px; text-align: center; width: 33.33%; }
        @media print {
            .no-print, .export-actions-panel, .fixed.bottom-8 { display: none !important; }
            body { -webkit-print-color-adjust: exact; background-color: white !important; }
            header, nav, aside, .sidebar, .header-container, button, [role="button"] { display: none !important; }
            main, #__next, body, html { padding: 0 !important; margin: 0 !important; overflow: visible !important; height: auto !important; width: auto !important; }
            .report-body { padding: 0 !important; background: transparent !important; display: block !important; }
            .report-container { margin: 0 !important; box-shadow: none !important; border: none !important; transform: scale(0.97); transform-origin: top center; width: 100% !important; max-width: 100% !important; }
        }
      `}} />

            <div className="report-body bg-gray-100 min-h-screen py-8 flex justify-center">

                <div className="no-print export-actions-panel fixed bottom-8 right-8 z-50 bg-white p-4 rounded-xl shadow-2xl border border-gray-200 flex flex-col gap-3" aria-hidden="true">
                    <button onClick={handleExportPDF} className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 font-bold transition-colors flex items-center justify-center gap-2">
                        ⬇️ Download PDF
                    </button>
                    <button onClick={() => window.print()} className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 font-bold transition-colors">
                        🖨️ Print (A4 Format)
                    </button>
                    <button onClick={() => window.history.back()} className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg shadow-sm font-medium hover:bg-gray-200 transition-colors">
                        ← Back
                    </button>
                </div>

                <div className="w-full max-w-full overflow-x-auto pb-8">
                    <div className="report-container bg-white shadow-2xl border border-gray-300 min-w-[190mm]">
                        <div className="p-[10mm]" style={{ height: '100%' }}>
                            <table className="header-table">
                                <tbody>
                                    <tr>
                                        <td width="15%"><div className="logo-box">L.M.T.</div></td>
                                        <td className="company-header">
                                            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>L.M.T. Engineering Limited Partnership</div>
                                            <div style={{ fontSize: '11px' }}>ห้างหุ้นส่วนจำกัด แอล.เอ็ม.ที. เอ็นจิเนียริ่ง</div>
                                            <div style={{ fontSize: '8px' }}>
                                                98 ซอยกรุงเทพกรีฑา 51 แขวงทับช้าง เขตสะพานสูง กรุงเทพฯ 10250 เลขประจำตัวผู้เสียภาษี 0103564014496 <br />
                                                โทร: 088 807 1002, 098 519 4855 Email: lmtengineering@gmail.com
                                            </div>
                                        </td>
                                        <td width="15%"></td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="report-title-box">CLEAN ROOM AND AIRBORNE INFECTION CONTROL ROOM REPORT</div>

                            <table className="info-table">
                                <tbody>
                                    <tr>
                                        <td width="15%">CUSTOMER NAME</td>
                                        <td className="data" width="35%">{jobItem?.workOrder?.site?.client?.name || ""}</td>
                                        <td width="10%">DATE</td>
                                        <td className="data" width="40%">
                                            {jobItem?.workOrder?.scheduledDate ? new Date(jobItem.workOrder.scheduledDate).toLocaleDateString('th-TH') : ""}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>LOCATION</td>
                                        <td className="data">{jobItem?.workOrder?.site?.name || ""}</td>
                                        <td>ROOM TYPE</td>
                                        <td className="data">{jobItem?.asset?.room?.name || ""} (Asset: {jobItem?.asset?.name || jobItem?.asset?.qrCode || ""})</td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="main-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "20%" }}>DESCRIPTION</th>
                                        <th style={{ width: "9%" }}>BEFORE</th>
                                        <th style={{ width: "9%" }}>AFTER</th>
                                        <th style={{ width: "25%" }}>DESCRIPTION</th>
                                        <th style={{ width: "9%" }}>ปกติ</th>
                                        <th style={{ width: "9%" }}>ผิดปกติ</th>
                                        <th style={{ width: "14%" }}>หมายเหตุ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td className="bg-yellow">ROOM TEMPERATURE (°C)</td><td className="text-center bold">{data.roomTempStr}</td><td className="text-center bold">{data.roomTempAfter}</td><td>ชุดควบคุมเซนเซอร์ภายในห้อง</td><td className="text-center bold">{renderCheck("sensorControlRoom", "normal")}</td><td className="text-center bold">{renderCheck("sensorControlRoom", "abnormal")}</td><td className="text-center">{data.remarksSensorControlRoom}</td></tr>
                                    <tr><td className="bg-yellow">ROOM HUMIDITY (%RH)</td><td className="text-center bold">{data.roomHumidityStr}</td><td className="text-center bold">{data.roomHumidityAfter}</td><td>ROOM THERMOSTAT</td><td className="text-center bold">{renderCheck("roomThermostat", "normal")}</td><td className="text-center bold">{renderCheck("roomThermostat", "abnormal")}</td><td className="text-center">{data.remarksRoomThermostat}</td></tr>
                                    <tr><td className="bg-yellow">AIR CHANGE (ACH)</td><td className="text-center bold">{data.airChangeAch}</td><td className="text-center bold">{data.airChangeAchAfter}</td><td>ชุด COOLING COIL</td><td className="text-center bold">{renderCheck("coolingCoil", "normal")}</td><td className="text-center bold">{renderCheck("coolingCoil", "abnormal")}</td><td className="text-center">{data.remarksCoolingCoil}</td></tr>
                                    <tr><td className="bg-yellow">PM 2.5 (ug/m3)</td><td className="text-center bold">{data.pm25}</td><td className="text-center bold">{data.pm25After}</td><td>MOTOR ชุดจ่ายลมเย็น</td><td className="text-center bold">{renderCheck("motorCooling", "normal")}</td><td className="text-center bold">{renderCheck("motorCooling", "abnormal")}</td><td className="text-center">{data.remarksMotorCooling}</td></tr>
                                    <tr><td className="bg-yellow">co2 (PPM)</td><td className="text-center bold">{data.co2Ppm}</td><td className="text-center bold">{data.co2PpmAfter}</td><td>แผง คอยล์เย็น</td><td className="text-center bold">{renderCheck("coilYen", "normal")}</td><td className="text-center bold">{renderCheck("coilYen", "abnormal")}</td><td className="text-center">{data.remarksCoilYen}</td></tr>
                                    <tr><td className="bg-yellow">SOUND LEVEL (dB)</td><td className="text-center bold">{data.soundLevelDb}</td><td className="text-center bold">{data.soundLevelDbAfter}</td><td>ท่อน้ำทิ้ง</td><td className="text-center bold">{renderCheck("drainPipe", "normal")}</td><td className="text-center bold">{renderCheck("drainPipe", "abnormal")}</td><td className="text-center">{data.remarksDrainPipe}</td></tr>
                                    <tr><td className="bg-yellow">AIR FLOW  (CFM.)</td><td className="text-center bold">{data.airFlowCfm}</td><td className="text-center bold">{data.airFlowCfmAfter}</td><td>แผ่นกรองอากาศ</td><td className="text-center bold">{renderCheck("airFilter", "normal")}</td><td className="text-center bold">{renderCheck("airFilter", "abnormal")}</td><td className="text-center">{data.remarksAirFilter}</td></tr>
                                    <tr><td className="bg-yellow"></td><td className="text-center bold"></td><td className="text-center bold"></td><td>TWO WAY VALVE</td><td className="text-center bold">{renderCheck("twoWayValve", "normal")}</td><td className="text-center bold">{renderCheck("twoWayValve", "abnormal")}</td><td className="text-center">{data.remarksTwoWayValve}</td></tr>

                                    <tr><td colSpan={3} className="bg-yellow bold">COMPRESSOR CURRENT</td><td>ฉนวนหุ้มท่อน้ำเย็น</td><td className="text-center bold">{renderCheck("waterPipeInsulation", "normal")}</td><td className="text-center bold">{renderCheck("waterPipeInsulation", "abnormal")}</td><td className="text-center">{data.remarksWaterPipeInsulation}</td></tr>

                                    <tr><td className="bg-yellow">L 1</td><td className="text-center bold">{data.compL1}</td><td className="text-center bold">{data.compL1After}</td><td>ท่อส่งลมเย็น Chiller</td><td className="text-center bold">{renderCheck("chillerPipe", "normal")}</td><td className="text-center bold">{renderCheck("chillerPipe", "abnormal")}</td><td className="text-center">{data.remarksChillerPipe}</td></tr>
                                    <tr><td className="bg-yellow">L 2</td><td className="text-center bold">{data.compL2}</td><td className="text-center bold">{data.compL2After}</td><td>Board Control  คอยล์เย็น</td><td className="text-center bold">{renderCheck("boardControlCoilYen", "normal")}</td><td className="text-center bold">{renderCheck("boardControlCoilYen", "abnormal")}</td><td className="text-center">{data.remarksBoardControlCoilYen}</td></tr>
                                    <tr><td className="bg-yellow">L 3</td><td className="text-center bold">{data.compL3}</td><td className="text-center bold">{data.compL3After}</td><td>ชุดคอยล์ร้อน Condensing</td><td className="text-center bold">{renderCheck("condensingCoil", "normal")}</td><td className="text-center bold">{renderCheck("condensingCoil", "abnormal")}</td><td className="text-center">{data.remarksCondensingCoil}</td></tr>
                                    <tr><td className="bg-yellow"></td><td className="text-center bold"></td><td className="text-center bold"></td><td>แมกเนติก โอเวอร์โหลด</td><td className="text-center bold">{renderCheck("magneticOverload", "normal")}</td><td className="text-center bold">{renderCheck("magneticOverload", "abnormal")}</td><td className="text-center">{data.remarksMagneticOverload}</td></tr>

                                    <tr><td colSpan={3} className="bg-yellow bold">MOTOR CURRENT (AIR SIDE)</td><td>MOTOR CONDENSING</td><td className="text-center bold">{renderCheck("motorCondensing", "normal")}</td><td className="text-center bold">{renderCheck("motorCondensing", "abnormal")}</td><td className="text-center">{data.remarksMotorCondensing}</td></tr>

                                    <tr><td className="bg-yellow">L 1</td><td className="text-center bold">{data.motorAirL1}</td><td className="text-center bold">{data.motorAirL1After}</td><td>COMPRESSOR</td><td className="text-center bold">{renderCheck("compressorCheck", "normal")}</td><td className="text-center bold">{renderCheck("compressorCheck", "abnormal")}</td><td className="text-center">{data.remarksCompressorCheck}</td></tr>
                                    <tr><td className="bg-yellow">L 2</td><td className="text-center bold">{data.motorAirL2}</td><td className="text-center bold">{data.motorAirL2After}</td><td>DISCHARGE PRESSURE (PSIG)</td><td className="text-center bold">{renderCheck("dischargePressure", "normal")}</td><td className="text-center bold">{renderCheck("dischargePressure", "abnormal")}</td><td className="text-center">{data.remarksDischargePressure}</td></tr>
                                    <tr><td className="bg-yellow">L 3</td><td className="text-center bold">{data.motorAirL3}</td><td className="text-center bold">{data.motorAirL3After}</td><td>SUCTION PRESSURE (PSIG)</td><td className="text-center bold">{renderCheck("suctionPressure", "normal")}</td><td className="text-center bold">{renderCheck("suctionPressure", "abnormal")}</td><td className="text-center">{data.remarksSuctionPressure}</td></tr>

                                    <tr><td colSpan={3} className="bg-yellow bold"></td><td>SATURATE SUCTION TEMP. (C)</td><td className="text-center bold">{renderCheck("saturateSuctionTemp", "normal")}</td><td className="text-center bold">{renderCheck("saturateSuctionTemp", "abnormal")}</td><td className="text-center">{data.remarksSaturateSuctionTemp}</td></tr>
                                    <tr><td colSpan={3} className="bg-yellow bold"></td><td>ฉนวนหุ้มท่อสารทำความเย็น</td><td className="text-center bold">{renderCheck("refrigerantPipeInsulation", "normal")}</td><td className="text-center bold">{renderCheck("refrigerantPipeInsulation", "abnormal")}</td><td className="text-center">{data.remarksRefrigerantPipeInsulation}</td></tr>
                                    <tr><td colSpan={3} className="bg-yellow bold"></td><td>Board Control  คอยล์ร้อน</td><td className="text-center bold">{renderCheck("boardControlCoilRon", "normal")}</td><td className="text-center bold">{renderCheck("boardControlCoilRon", "abnormal")}</td><td className="text-center">{data.remarksBoardControlCoilRon}</td></tr>
                                </tbody>
                            </table>

                            <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                <div className="report-title-box" style={{ marginTop: 0 }}>REMARKS</div>
                                <div className="remarks-section whitespace-pre-wrap">
                                    {data.remarksGeneral || ""}
                                </div>

                                <table className="footer-table">
                                    <tbody>
                                        <tr>
                                            <td className="bg-yellow bold w-1/3">CUSTOMER SIGNATURE</td>
                                            <td className="bg-yellow bold w-1/3">WARD NURSE SIGNATURE</td>
                                            <td className="bg-yellow bold w-1/3">SERVICE SIGNATURE</td>
                                        </tr>
                                        <tr>
                                            <td height="80px" className="align-middle text-center p-2">
                                                {data.customerSignature ? (
                                                    <NextImage src={data.customerSignature} alt="Customer Sig" width={200} height={64} className="max-h-16 w-auto mx-auto object-contain" unoptimized />
                                                ) : null}
                                            </td>
                                            <td className="align-middle text-center p-2">
                                                {data.wardNurseSignature ? (
                                                    <NextImage src={data.wardNurseSignature} alt="Ward Nurse Sig" width={200} height={64} className="max-h-16 w-auto mx-auto object-contain" unoptimized />
                                                ) : null}
                                            </td>
                                            <td className="align-middle text-center p-2">
                                                {data.serviceSignature ? (
                                                    <NextImage src={data.serviceSignature} alt="Service Sig" width={200} height={64} className="max-h-16 w-auto mx-auto object-contain" unoptimized />
                                                ) : null}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>DATE: {jobItem?.workOrder?.scheduledDate ? new Date(jobItem.workOrder.scheduledDate).toLocaleDateString('th-TH') : "....../....../......"}</td>
                                            <td>DATE: {jobItem?.workOrder?.scheduledDate ? new Date(jobItem.workOrder.scheduledDate).toLocaleDateString('th-TH') : "....../....../......"}</td>
                                            <td>DATE: {jobItem?.workOrder?.scheduledDate ? new Date(jobItem.workOrder.scheduledDate).toLocaleDateString('th-TH') : "....../....../......"}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
