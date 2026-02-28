"use client";

import React, { useEffect, useState } from "react";
import NextImage from "next/image";

interface CleanRoomFormData {
    [key: string]: any; // Allows flexible property access
}

interface CleanRoomReportProps {
    jobItem: any; // We'll pass the full JobItem
}

export default function CleanRoomReport({ jobItem }: CleanRoomReportProps) {
    const [data, setData] = useState<CleanRoomFormData>({});

    useEffect(() => {
        if (jobItem?.checklist) {
            try {
                setData(JSON.parse(jobItem.checklist));
            } catch (e) {
                console.error("Failed to parse checklist data", e);
            }
        }
    }, [jobItem]);

    // Set document title for clean PDF export filenames (avoiding Thai char corruption)
    useEffect(() => {
        if (jobItem) {
            const assetName = jobItem.asset?.name || jobItem.asset?.qrCode || "Asset";
            const dateStr = jobItem.workOrder?.scheduledDate
                ? new Date(jobItem.workOrder.scheduledDate).toISOString().split('T')[0]
                : "UnknownDate";
            const safeTitle = `CleanRoom_Report_${assetName}_${dateStr}`.replace(/[^a-zA-Z0-9-_]/g, '_');
            document.title = safeTitle;
        }
    }, [jobItem]);

    // Helper to render checkmark if status matches
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
            const filename = `CleanRoom_Report_${assetName}_${dateStr}.pdf`.replace(/[^a-zA-Z0-9-_\.]/g, '_');

            // Calculate the actual full size of the report container
            const pWidth = element.scrollWidth;
            const pHeight = element.scrollHeight;

            // Add white background explicitly for export
            const dataUrl = await toPng(element, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                width: pWidth,
                height: pHeight,
                style: {
                    margin: '0',
                    padding: '0',
                    border: 'none',
                    boxShadow: 'none',
                    transform: 'none'
                }
            });

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // A4 dimensions and margins (mm)
            const pdfWidth = 210;
            const pdfHeight = 297;
            const margin = 5; // Use a small 5mm margin on all sides for aesthetics

            const maxImgWidth = pdfWidth - (margin * 2);
            const maxImgHeight = pdfHeight - (margin * 2);

            // Create an image object to get original dimensions
            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve) => { img.onload = resolve; });

            // Calculate scale to fit within BOTH max width and max height
            let imgWidth = maxImgWidth;
            let imgHeight = (img.height * maxImgWidth) / img.width;

            // If it's still too tall for one page, scale it down further to fit height
            if (imgHeight > maxImgHeight) {
                imgHeight = maxImgHeight;
                imgWidth = (img.width * maxImgHeight) / img.height;
            }

            // Center the image if it was scaled down by height or width
            const xOffset = margin + (maxImgWidth - imgWidth) / 2;
            const yOffset = Math.max(margin, margin + (maxImgHeight - imgHeight) / 2); // Ensure at least 5mm top margin

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
        @page {
            size: A4;
            margin: 10mm;
        }
        .report-body {
            font-family: 'Sarabun', sans-serif;
            font-size: 10px;
            margin: 0;
            padding: 0;
            background-color: #fff;
            color: #000;
        }
        .report-container {
            width: 190mm;
            margin: 0 auto;
        }
        .header-table {
            width: 100%;
            border: none;
            margin-bottom: 5px;
        }
        .logo-box {
            width: 50px;
            height: 50px;
            border: 1.5px solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
        }
        .company-header {
            text-align: center;
            line-height: 1.4;
        }
        .report-title-box {
            background-color: #a4c2f4 !important;
            -webkit-print-color-adjust: exact;
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            padding: 4px;
            border: 1px solid #000;
            margin-bottom: -1px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            border: 1px solid #000;
            padding: 4px;
            background-color: #a4c2f4 !important;
            -webkit-print-color-adjust: exact;
            font-weight: bold;
        }
        .info-table td.data {
            background-color: #fff !important;
            font-weight: normal;
        }
        .main-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .main-table th {
            background-color: #a4c2f4 !important;
            -webkit-print-color-adjust: exact;
            border: 1px solid #000;
            padding: 4px;
            font-size: 10px;
        }
        .main-table td {
            border: 1px solid #000;
            padding: 3px 4px;
            height: 18px;
        }
        .bg-yellow { 
            background-color: #fff2cc !important; 
            -webkit-print-color-adjust: exact;
        }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
        .remarks-section {
            border: 1px solid #000;
            border-top: none;
            padding: 4px;
            min-height: 100px;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .footer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: -1px;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .footer-table td {
            border: 1px solid #000;
            padding: 4px;
            text-align: center;
            width: 50%;
        }
        @media print {
            .no-print { display: none !important; }
            body { 
                -webkit-print-color-adjust: exact; 
                background-color: white !important; 
            }
            /* Hide global layout elements that might be wrapping this page */
            header, nav, aside, .sidebar, .header-container, button, [role="button"] { display: none !important; }
            main, #__next, body, html { 
                padding: 0 !important; 
                margin: 0 !important; 
                overflow: visible !important; 
                height: auto !important; 
                width: auto !important;
            }
            .report-body { 
                padding: 0 !important; 
                background: transparent !important; 
                display: block !important;
            }
            .report-container { 
                margin: 0 !important; 
                box-shadow: none !important; 
                border: none !important;
                /* Force scale down slightly to ensure it fits perfectly on one A4 page in browser print dialog */
                transform: scale(0.97);
                transform-origin: top center;
                width: 100% !important;
                max-width: 100% !important;
            }
        }
      `}} />

            <div className="report-body bg-gray-100 min-h-screen py-8 flex justify-center">

                {/* Print Controls (Hidden on Print) */}
                <div className="no-print fixed bottom-8 right-8 z-50 bg-white p-4 rounded-xl shadow-2xl border border-gray-200 flex flex-col gap-3">
                    <button
                        onClick={handleExportPDF}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        ⬇️ Download PDF
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 font-bold transition-colors"
                    >
                        🖨️ Print (A4 Format)
                    </button>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg shadow-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        ← Back
                    </button>
                </div>

                {/* The A4 Document Area */}
                <div className="report-container bg-white shadow-2xl border border-gray-300">
                    {/* Inner padding for web view, removed during export via style override above */}
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
                                    <th style={{ width: "25%" }}>DESCRIPTION</th>
                                    <th style={{ width: "12%" }}>STANDARD</th>
                                    <th style={{ width: "8%" }}>STATUS</th>
                                    <th style={{ width: "30%" }}>DESCRIPTION</th>
                                    <th style={{ width: "5%" }}>ปกติ</th>
                                    <th style={{ width: "5%" }}>ผิดปกติ</th>
                                    <th style={{ width: "15%" }}>หมายเหตุ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td className="bg-yellow">ROOM TEMPERATURE (°C)</td><td className="bg-yellow text-center">20 ±2°C</td><td className="text-center bold">{data.roomTemp}</td><td>ชุดควบคุมเซนเซอร์ภายในห้อง</td><td className="text-center bold">{renderCheck("sensorControlRoom", "normal")}</td><td className="text-center bold">{renderCheck("sensorControlRoom", "abnormal")}</td><td className="text-center">{data.remarksSensorControlRoom}</td></tr>
                                <tr><td className="bg-yellow">ROOM HUMIDITY (%RH)</td><td className="bg-yellow text-center">50±10%RH</td><td className="text-center bold">{data.roomHumidity}</td><td>Temp Humid Sensor</td><td className="text-center bold">{renderCheck("tempHumidSensor", "normal")}</td><td className="text-center bold">{renderCheck("tempHumidSensor", "abnormal")}</td><td className="text-center">{data.remarksTempHumidSensor}</td></tr>
                                <tr><td className="bg-yellow">PATIENT ROOM PRESSURE (Pa)</td><td className="bg-yellow text-center">10±5 Pa</td><td className="text-center bold">{data.patientRoomPressure}</td><td>Diff Pressure Sensor</td><td className="text-center bold">{renderCheck("diffPressureSensor", "normal")}</td><td className="text-center bold">{renderCheck("diffPressureSensor", "abnormal")}</td><td className="text-center">{data.remarksDiffPressureSensor}</td></tr>
                                <tr><td className="bg-yellow">SPEED CONTROL SUPPLY (AIR SIDE)</td><td className="bg-yellow text-center"></td><td className="text-center bold">{data.speedControlSupply}</td><td>Touch Screen Control</td><td className="text-center bold">{renderCheck("touchScreenControl", "normal")}</td><td className="text-center bold">{renderCheck("touchScreenControl", "abnormal")}</td><td className="text-center">{data.remarksTouchScreenControl}</td></tr>
                                <tr><td className="bg-yellow">SPEED CONTROL (NPU)</td><td className="bg-yellow text-center">≥ 10%</td><td className="text-center bold">{data.speedControlNpu}</td><td>Room Pressure Gauge</td><td className="text-center bold">{renderCheck("roomPressureGauge", "normal")}</td><td className="text-center bold">{renderCheck("roomPressureGauge", "abnormal")}</td><td className="text-center">{data.remarksRoomPressureGauge}</td></tr>
                                <tr><td className="bg-yellow">SUCTION PRESSURE (PSIG)</td><td className="bg-yellow text-center">40-85 PSIG.</td><td className="text-center bold">{data.suctionPressure}</td><td>ชุดควบคุมเซนเซอร์ภายในเครื่อง AICU</td><td className="text-center bold">{renderCheck("sensorControlAicu", "normal")}</td><td className="text-center bold">{renderCheck("sensorControlAicu", "abnormal")}</td><td className="text-center">{data.remarksSensorControlAicu}</td></tr>
                                <tr><td className="bg-yellow">DISCHARGE PRESSURE (PSIG)</td><td className="bg-yellow text-center">200-350 PSIG.</td><td className="text-center bold">{data.dischargePressure}</td><td>NTC DX Temp.</td><td className="text-center bold">{renderCheck("ntcDxTemp", "normal")}</td><td className="text-center bold">{renderCheck("ntcDxTemp", "abnormal")}</td><td className="text-center">{data.remarksNtcDxTemp}</td></tr>
                                <tr><td className="bg-yellow">SATURATE SUCTION TEMP. (C)</td><td className="bg-yellow text-center">4-18 °C</td><td className="text-center bold">{data.saturateSuctionTemp}</td><td>Diff Pressure Switch</td><td className="text-center bold">{renderCheck("diffPressureSwitch", "normal")}</td><td className="text-center bold">{renderCheck("diffPressureSwitch", "abnormal")}</td><td className="text-center">{data.remarksDiffPressureSwitch}</td></tr>

                                <tr><td colSpan={3} className="bg-yellow bold">POWER SUPPLY/VOLTAGE</td><td>Two Way Valve. MRV.CC.</td><td className="text-center bold">{renderCheck("twoWayValve", "normal")}</td><td className="text-center bold">{renderCheck("twoWayValve", "abnormal")}</td><td className="text-center">{data.remarksTwoWayValve}</td></tr>

                                <tr><td className="bg-yellow">11-12</td><td className="bg-yellow text-center">≥ 380 V.</td><td className="text-center bold">{data.volt11_12}</td><td>ชุดควบคุมเซนเซอร์ภายใน Condensing</td><td className="text-center bold">{renderCheck("sensorControlCondensing", "normal")}</td><td className="text-center bold">{renderCheck("sensorControlCondensing", "abnormal")}</td><td className="text-center">{data.remarksSensorControlCondensing}</td></tr>
                                <tr><td className="bg-yellow">12-13</td><td className="bg-yellow text-center">≥ 380 V.</td><td className="text-center bold">{data.volt12_13}</td><td>High Tranducer Sensor.</td><td className="text-center bold">{renderCheck("highTransducerSensor", "normal")}</td><td className="text-center bold">{renderCheck("highTransducerSensor", "abnormal")}</td><td className="text-center">{data.remarksHighTransducerSensor}</td></tr>
                                <tr><td className="bg-yellow">13-L1</td><td className="bg-yellow text-center">≥ 380 V.</td><td className="text-center bold">{data.volt13_l1}</td><td>Low Tranducer Sensor</td><td className="text-center bold">{renderCheck("lowTransducerSensor", "normal")}</td><td className="text-center bold">{renderCheck("lowTransducerSensor", "abnormal")}</td><td className="text-center">{data.remarksLowTransducerSensor}</td></tr>
                                <tr><td className="bg-yellow">-N</td><td className="bg-yellow text-center">≥ 220 V.</td><td className="text-center bold">{data.voltN}</td><td>High Pressure Switch</td><td className="text-center bold">{renderCheck("highPressureSwitch", "normal")}</td><td className="text-center bold">{renderCheck("highPressureSwitch", "abnormal")}</td><td className="text-center">{data.remarksHighPressureSwitch}</td></tr>

                                <tr><td colSpan={3} className="bg-yellow bold">COMPRESSOR CURRENT</td><td>Low Pressure Switch.</td><td className="text-center bold">{renderCheck("lowPressureSwitch", "normal")}</td><td className="text-center bold">{renderCheck("lowPressureSwitch", "abnormal")}</td><td className="text-center">{data.remarksLowPressureSwitch}</td></tr>

                                <tr><td className="bg-yellow">L1</td><td className="bg-yellow text-center">≤ 9A</td><td className="text-center bold">{data.compL1}</td><td>NTC Suction Temp.</td><td className="text-center bold">{renderCheck("ntcSuctionTemp", "normal")}</td><td className="text-center bold">{renderCheck("ntcSuctionTemp", "abnormal")}</td><td className="text-center">{data.remarksNtcSuctionTemp}</td></tr>
                                <tr><td className="bg-yellow">L2</td><td className="bg-yellow text-center">≤ 9A</td><td className="text-center bold">{data.compL2}</td><td>ชุดควบคุมเซนเซอร์ภายในตู้คอนโทรล</td><td className="text-center bold">{renderCheck("sensorControlCabinet1", "normal")}</td><td className="text-center bold">{renderCheck("sensorControlCabinet1", "abnormal")}</td><td className="text-center">{data.remarksSensorControlCabinet1}</td></tr>
                                <tr><td className="bg-yellow">L3</td><td className="bg-yellow text-center">≤ 9A</td><td className="text-center bold">{data.compL3}</td><td>Control Motor VSD</td><td className="text-center bold">{renderCheck("controlMotorVsd", "normal")}</td><td className="text-center bold">{renderCheck("controlMotorVsd", "abnormal")}</td><td className="text-center">{data.remarksControlMotorVsd}</td></tr>

                                <tr><td colSpan={3} className="bg-yellow bold">MOTOR CURRENT (AIR SIDE)</td><td>Board PLC Control</td><td className="text-center bold">{renderCheck("boardPlcControl", "normal")}</td><td className="text-center bold">{renderCheck("boardPlcControl", "abnormal")}</td><td className="text-center">{data.remarksBoardPlcControl}</td></tr>
                                <tr><td className="bg-yellow">L1</td><td className="bg-yellow text-center">≤ 17 A.</td><td className="text-center bold">{data.motorAirL1}</td><td>แมกเนติก โอเวอร์โหลด</td><td className="text-center bold">{renderCheck("magneticOverload", "normal")}</td><td className="text-center bold">{renderCheck("magneticOverload", "abnormal")}</td><td className="text-center">{data.remarksMagneticOverload}</td></tr>
                                <tr><td className="bg-yellow">L2</td><td className="bg-yellow text-center">≤ 17 A.</td><td className="text-center bold">{data.motorAirL2}</td><td>แผ่นกรองอากาศ</td><td className="text-center bold">{renderCheck("airFilter", "normal")}</td><td className="text-center bold">{renderCheck("airFilter", "abnormal")}</td><td className="text-center">{data.remarksAirFilter}</td></tr>
                                <tr><td className="bg-yellow">L3</td><td className="bg-yellow text-center">≤ 17 A.</td><td className="text-center bold">{data.motorAirL3}</td><td>Pre Filter</td><td className="text-center bold">{renderCheck("preFilter", "normal")}</td><td className="text-center bold">{renderCheck("preFilter", "abnormal")}</td><td className="text-center">{data.remarksPreFilter}</td></tr>

                                <tr><td colSpan={3} className="bg-yellow bold">MOTOR CURRENT (FCDU)</td><td>Carbon Filter</td><td className="text-center bold">{renderCheck("carbonFilter", "normal")}</td><td className="text-center bold">{renderCheck("carbonFilter", "abnormal")}</td><td className="text-center">{data.remarksCarbonFilter}</td></tr>
                                <tr><td className="bg-yellow">L1</td><td className="bg-yellow text-center">≤ 4A</td><td className="text-center bold">{data.motorFcduL1}</td><td>Meduim Filter</td><td className="text-center bold">{renderCheck("mediumFilter", "normal")}</td><td className="text-center bold">{renderCheck("mediumFilter", "abnormal")}</td><td className="text-center">{data.remarksMediumFilter}</td></tr>
                                <tr><td className="bg-yellow">L2</td><td className="bg-yellow text-center">≤ 4A</td><td className="text-center bold">{data.motorFcduL2}</td><td>Hepa Filter</td><td className="text-center bold">{renderCheck("hepaFilter", "normal")}</td><td className="text-center bold">{renderCheck("hepaFilter", "abnormal")}</td><td className="text-center">{data.remarksHepaFilter}</td></tr>
                                <tr><td className="bg-yellow">L3</td><td className="bg-yellow text-center">≤ 4A</td><td className="text-center bold">{data.motorFcduL3}</td><td></td><td></td><td></td><td></td></tr>

                                <tr><td colSpan={3} className="bg-yellow bold">MOTOR CURRENT (Exhaust)</td><td></td><td></td><td></td><td></td></tr>
                                <tr><td className="bg-yellow">L1</td><td className="bg-yellow text-center">≤ 3A</td><td className="text-center bold">{data.motorExL1}</td><td></td><td></td><td></td><td></td></tr>
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
                                        <td className="bg-yellow bold w-1/2">CUSTOMER SIGNATURE</td>
                                        <td className="bg-yellow bold w-1/2">SERVICE SIGNATURE</td>
                                    </tr>
                                    <tr>
                                        <td height="80px" className="align-middle text-center p-2">
                                            {data.customerSignature ? (
                                                <NextImage src={data.customerSignature} alt="Customer Sig" width={200} height={64} className="max-h-16 w-auto mx-auto object-contain" unoptimized />
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
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
