"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const SignaturePad = dynamic(() => import("../SignaturePad"), { ssr: false });

interface CleanRoomFormData {
    // Description 1
    roomTemp: string;
    roomHumidity: string;
    patientRoomPressure: string;
    speedControlSupply: string;
    speedControlNpu: string;
    suctionPressure: string;
    dischargePressure: string;
    saturateSuctionTemp: string;

    // Power Supply
    volt11_12: string;
    volt12_13: string;
    volt13_l1: string;
    voltN: string;

    // Compressor Current
    compL1: string;
    compL2: string;
    compL3: string;

    // Motor Current (Air Side)
    motorAirL1: string;
    motorAirL2: string;
    motorAirL3: string;

    // Motor Current (FCDU)
    motorFcduL1: string;
    motorFcduL2: string;
    motorFcduL3: string;

    // Motor Current (Exhaust)
    motorExL1: string;

    // Description 2 (Sensor Status) - Using 'normal' or 'abnormal' strings
    sensorControlRoom: string;
    tempHumidSensor: string;
    diffPressureSensor: string;
    touchScreenControl: string;
    roomPressureGauge: string;
    sensorControlAicu: string;
    ntcDxTemp: string;
    diffPressureSwitch: string;
    twoWayValve: string;
    sensorControlCondensing: string;
    highTransducerSensor: string;
    lowTransducerSensor: string;
    highPressureSwitch: string;
    lowPressureSwitch: string;
    ntcSuctionTemp: string;
    sensorControlCabinet1: string; // Row 1
    sensorControlCabinet2: string; // Row 2
    controlMotorVsd: string;
    boardPlcControl: string;
    magneticOverload: string;
    airFilter: string;
    preFilter: string;
    carbonFilter: string;
    mediumFilter: string;
    hepaFilter: string;

    // Remarks
    remarksSensorControlRoom: string;
    remarksTempHumidSensor: string;
    remarksDiffPressureSensor: string;
    remarksTouchScreenControl: string;
    remarksRoomPressureGauge: string;
    remarksSensorControlAicu: string;
    remarksNtcDxTemp: string;
    remarksDiffPressureSwitch: string;
    remarksTwoWayValve: string;
    remarksSensorControlCondensing: string;
    remarksHighTransducerSensor: string;
    remarksLowTransducerSensor: string;
    remarksHighPressureSwitch: string;
    remarksLowPressureSwitch: string;
    remarksNtcSuctionTemp: string;
    remarksSensorControlCabinet1: string;
    remarksSensorControlCabinet2: string;
    remarksControlMotorVsd: string;
    remarksBoardPlcControl: string;
    remarksMagneticOverload: string;
    remarksAirFilter: string;
    remarksPreFilter: string;
    remarksCarbonFilter: string;
    remarksMediumFilter: string;
    remarksHepaFilter: string;

    remarksGeneral: string;

    customerSignature: string | null;
    serviceSignature: string | null;
}

interface CleanRoomFormProps {
    jobItemId: string;
    initialData?: string; // JSON string from DB
    onSaveAction: (jobItemId: string, checklistJson: string) => Promise<{ success: boolean; error?: string }>;
}

export default function CleanRoomForm({ jobItemId, initialData, onSaveAction }: CleanRoomFormProps) {
    const [formData, setFormData] = useState<CleanRoomFormData>(() => {
        if (initialData) {
            try {
                return JSON.parse(initialData);
            } catch (e) {
                console.error("Failed to parse initial checklist data", e);
            }
        }
        return {
            roomTemp: "", roomHumidity: "", patientRoomPressure: "", speedControlSupply: "", speedControlNpu: "",
            suctionPressure: "", dischargePressure: "", saturateSuctionTemp: "",
            volt11_12: "", volt12_13: "", volt13_l1: "", voltN: "",
            compL1: "", compL2: "", compL3: "",
            motorAirL1: "", motorAirL2: "", motorAirL3: "",
            motorFcduL1: "", motorFcduL2: "", motorFcduL3: "", motorExL1: "",

            sensorControlRoom: "", tempHumidSensor: "", diffPressureSensor: "", touchScreenControl: "", roomPressureGauge: "",
            sensorControlAicu: "", ntcDxTemp: "", diffPressureSwitch: "", twoWayValve: "", sensorControlCondensing: "",
            highTransducerSensor: "", lowTransducerSensor: "", highPressureSwitch: "", lowPressureSwitch: "", ntcSuctionTemp: "",
            sensorControlCabinet1: "", sensorControlCabinet2: "", controlMotorVsd: "", boardPlcControl: "", magneticOverload: "",
            airFilter: "", preFilter: "", carbonFilter: "", mediumFilter: "", hepaFilter: "",

            remarksSensorControlRoom: "", remarksTempHumidSensor: "", remarksDiffPressureSensor: "", remarksTouchScreenControl: "", remarksRoomPressureGauge: "",
            remarksSensorControlAicu: "", remarksNtcDxTemp: "", remarksDiffPressureSwitch: "", remarksTwoWayValve: "", remarksSensorControlCondensing: "",
            remarksHighTransducerSensor: "", remarksLowTransducerSensor: "", remarksHighPressureSwitch: "", remarksLowPressureSwitch: "", remarksNtcSuctionTemp: "",
            remarksSensorControlCabinet1: "", remarksSensorControlCabinet2: "", remarksControlMotorVsd: "", remarksBoardPlcControl: "", remarksMagneticOverload: "",
            remarksAirFilter: "", remarksPreFilter: "", remarksCarbonFilter: "", remarksMediumFilter: "", remarksHepaFilter: "",

            remarksGeneral: "",
            customerSignature: null,
            serviceSignature: null,
        };
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRadioChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage({ type: "", text: "" });

        try {
            const jsonString = JSON.stringify(formData);
            const result = await onSaveAction(jobItemId, jsonString);

            if (result.success) {
                setSaveMessage({ type: "success", text: "บันทึกข้อมูลและลายเซ็นสำเร็จเรียบร้อย" });
            } else {
                setSaveMessage({ type: "error", text: result.error || "เกิดข้อผิดพลาดในการบันทึก" });
            }
        } catch (error: any) {
            setSaveMessage({ type: "error", text: error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
        } finally {
            setIsSaving(false);
        }
    };

    const renderStatusRow = (label: string, name: string, remarkName: string) => (
        <div className="flex flex-col md:flex-row gap-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-4 rounded-xl items-start md:items-center">
            <div className="md:w-1/3 flex-shrink-0 font-medium text-sm text-gray-700 dark:text-gray-300">{label}</div>

            <div className="flex space-x-4 flex-shrink-0">
                <label className="flex items-center space-x-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
                    <input
                        type="radio"
                        name={name}
                        value="normal"
                        checked={(formData as any)[name] === "normal"}
                        onChange={() => handleRadioChange(name, "normal")}
                        className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm font-medium">ปกติ</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:border-red-300 transition-colors">
                    <input
                        type="radio"
                        name={name}
                        value="abnormal"
                        checked={(formData as any)[name] === "abnormal"}
                        onChange={() => handleRadioChange(name, "abnormal")}
                        className="text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-red-600">ผิดปกติ</span>
                </label>
            </div>

            <div className="w-full md:flex-1 mt-2 md:mt-0">
                <input
                    type="text"
                    name={remarkName}
                    value={(formData as any)[remarkName]}
                    onChange={handleChange}
                    placeholder="หมายเหตุ (ถ้ามี)..."
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors"
                />
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">

            {/* Title */}
            <div className="border-b pb-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">ข้อมูลฟอร์ม CLEAN ROOM REPORT</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">กรอกผลการตรวจวัดค่าต่างๆ และลงลายมือชื่อ</p>
            </div>

            <div className="space-y-12">

                {/* Section 1: Measurements */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 p-3 rounded-xl shadow-sm border border-blue-200">
                        1. ผลการวัดค่าระบบ (Measurements)
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ROOM TEMPERATURE (°C)</label>
                            <input type="text" name="roomTemp" value={formData.roomTemp} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ROOM HUMIDITY (%RH)</label>
                            <input type="text" name="roomHumidity" value={formData.roomHumidity} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PATIENT ROOM PRESSURE (Pa)</label>
                            <input type="text" name="patientRoomPressure" value={formData.patientRoomPressure} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SPEED CONTROL SUPPLY</label>
                            <input type="text" name="speedControlSupply" value={formData.speedControlSupply} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SPEED CONTROL (NPU)</label>
                            <input type="text" name="speedControlNpu" value={formData.speedControlNpu} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SUCTION PRESSURE (PSIG)</label>
                            <input type="text" name="suctionPressure" value={formData.suctionPressure} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">DISCHARGE PRESSURE (PSIG)</label>
                            <input type="text" name="dischargePressure" value={formData.dischargePressure} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SATURATE SUCTION TEMP (°C)</label>
                            <input type="text" name="saturateSuctionTemp" value={formData.saturateSuctionTemp} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors" />
                        </div>
                    </div>

                    <h4 className="text-md font-semibold mt-6 mb-2 text-gray-800 dark:text-white">POWER SUPPLY/VOLTAGE</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">11-12 (≥ 380V)</label>
                            <input type="text" name="volt11_12" value={formData.volt11_12} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors mt-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">12-13 (≥ 380V)</label>
                            <input type="text" name="volt12_13" value={formData.volt12_13} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors mt-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">13-L1 (≥ 380V)</label>
                            <input type="text" name="volt13_l1" value={formData.volt13_l1} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors mt-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">-N (≥ 220V)</label>
                            <input type="text" name="voltN" value={formData.voltN} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors mt-1" />
                        </div>
                    </div>

                    <h4 className="text-md font-semibold mt-6 mb-2 text-gray-800 dark:text-white">COMPRESSOR CURRENT</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">L1 (≤ 9A)</label>
                            <input type="text" name="compL1" value={formData.compL1} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors mt-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">L2 (≤ 9A)</label>
                            <input type="text" name="compL2" value={formData.compL2} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors mt-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">L3 (≤ 9A)</label>
                            <input type="text" name="compL3" value={formData.compL3} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors mt-1" />
                        </div>
                    </div>

                    <h4 className="text-md font-semibold mt-6 mb-2 text-gray-800 dark:text-white">MOTOR CURRENT (AIR SIDE)</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">L1 (≤ 17A)</label>
                            <input type="text" name="motorAirL1" value={formData.motorAirL1} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors mt-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">L2 (≤ 17A)</label>
                            <input type="text" name="motorAirL2" value={formData.motorAirL2} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors mt-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">L3 (≤ 17A)</label>
                            <input type="text" name="motorAirL3" value={formData.motorAirL3} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors mt-1" />
                        </div>
                    </div>

                    <h4 className="text-md font-semibold mt-6 mb-2 text-gray-800 dark:text-white">MOTOR CURRENT (FCDU)</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">L1 (≤ 5A)</label>
                            <input type="text" name="motorFcduL1" value={formData.motorFcduL1} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors mt-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">L2 (≤ 5A)</label>
                            <input type="text" name="motorFcduL2" value={formData.motorFcduL2} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors mt-1" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">L3 (≤ 5A)</label>
                            <input type="text" name="motorFcduL3" value={formData.motorFcduL3} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors mt-1" />
                        </div>
                    </div>

                    <h4 className="text-md font-semibold mt-6 mb-2 text-gray-800 dark:text-white">MOTOR CURRENT (Exhaust)</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">L1</label>
                            <input type="text" name="motorExL1" value={formData.motorExL1} onChange={handleChange} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 bg-gray-50 hover:bg-white transition-colors mt-1" />
                        </div>
                    </div>
                </div>

                {/* Section 2: Component Status (Right Column content moved below) */}
                <div className="space-y-6 border-t pt-8">
                    <h3 className="text-lg font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 p-3 rounded-xl shadow-sm border border-blue-200">
                        2. การตรวจสอบอุปกรณ์ (Status Check)
                    </h3>

                    <div className="space-y-1">
                        {renderStatusRow("ชุดควบคุมเซนเซอร์ภายในห้อง", "sensorControlRoom", "remarksSensorControlRoom")}
                        {renderStatusRow("Temp Humid Sensor", "tempHumidSensor", "remarksTempHumidSensor")}
                        {renderStatusRow("Diff Pressure Sensor", "diffPressureSensor", "remarksDiffPressureSensor")}
                        {renderStatusRow("Touch Screen Control", "touchScreenControl", "remarksTouchScreenControl")}
                        {renderStatusRow("Room Pressure Gauge", "roomPressureGauge", "remarksRoomPressureGauge")}
                        {renderStatusRow("ชุดควบคุมเซนเซอร์ภายในเครื่อง AICU", "sensorControlAicu", "remarksSensorControlAicu")}
                        {renderStatusRow("NTC DX Temp.", "ntcDxTemp", "remarksNtcDxTemp")}
                        {renderStatusRow("Diff Pressure Switch", "diffPressureSwitch", "remarksDiffPressureSwitch")}
                        {renderStatusRow("Two Way Valve. MRV.CC.", "twoWayValve", "remarksTwoWayValve")}
                        {renderStatusRow("ชุดควบคุมเซนเซอร์ภายใน Condensing", "sensorControlCondensing", "remarksSensorControlCondensing")}
                        {renderStatusRow("High Tranducer Sensor", "highTransducerSensor", "remarksHighTransducerSensor")}
                        {renderStatusRow("Low Tranducer Sensor", "lowTransducerSensor", "remarksLowTransducerSensor")}
                        {renderStatusRow("High Pressure Switch", "highPressureSwitch", "remarksHighPressureSwitch")}
                        {renderStatusRow("Low Pressure Switch", "lowPressureSwitch", "remarksLowPressureSwitch")}
                        {renderStatusRow("NTC Suction Temp.", "ntcSuctionTemp", "remarksNtcSuctionTemp")}
                        {renderStatusRow("ชุดควบคุมเซนเซอร์ภายในตู้คอนโทรล (1)", "sensorControlCabinet1", "remarksSensorControlCabinet1")}
                        {renderStatusRow("ชุดควบคุมเซนเซอร์ภายในตู้คอนโทรล (2)", "sensorControlCabinet2", "remarksSensorControlCabinet2")}
                        {renderStatusRow("Control Motor VSD", "controlMotorVsd", "remarksControlMotorVsd")}
                        {renderStatusRow("Board PLC Control", "boardPlcControl", "remarksBoardPlcControl")}
                        {renderStatusRow("แมกเนติก โอเวอร์โหลด", "magneticOverload", "remarksMagneticOverload")}
                        {renderStatusRow("แผ่นกรองอากาศ", "airFilter", "remarksAirFilter")}
                        {renderStatusRow("Pre Filter", "preFilter", "remarksPreFilter")}
                        {renderStatusRow("Carbon Filter", "carbonFilter", "remarksCarbonFilter")}
                        {renderStatusRow("Meduim Filter", "mediumFilter", "remarksMediumFilter")}
                        {renderStatusRow("Hepa Filter", "hepaFilter", "remarksHepaFilter")}
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            REMARKS (หมายเหตุเพิ่มเติม)
                        </label>
                        <textarea
                            name="remarksGeneral"
                            rows={4}
                            value={formData.remarksGeneral}
                            onChange={handleChange}
                            placeholder="ระบุหมายเหตุ หรือข้อเสนอแนะเพิ่มเติมที่นี่..."
                            className="block w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3 px-4 bg-gray-50 hover:bg-white transition-colors"
                        ></textarea>
                    </div>
                </div>
            </div>

            {/* Signature Section */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-center mb-8 text-gray-800 dark:text-white">ลงลายมือชื่อ (Signatures)</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SignaturePad
                        label="CUSTOMER SIGNATURE (ลายเซ็นลูกค้า)"
                        initialDataUrl={formData.customerSignature}
                        onSave={(data) => setFormData(prev => ({ ...prev, customerSignature: data }))}
                    />
                    <SignaturePad
                        label="SERVICE SIGNATURE (ลายเซ็นช่างผู้ปฏิบัติงาน)"
                        initialDataUrl={formData.serviceSignature}
                        onSave={(data) => setFormData(prev => ({ ...prev, serviceSignature: data }))}
                    />
                </div>
            </div>

            {/* Messages & Actions */}
            <div className="mt-8">
                {saveMessage.text && (
                    <div className={`p-4 mb-6 rounded-md ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        {saveMessage.text}
                    </div>
                )}

                <div className="flex justify-end space-x-4">
                    {saveMessage.type !== 'success' && (
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`px-6 py-3 rounded-md shadow-sm text-white font-medium ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล (Save Data & Signatures)'}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}
