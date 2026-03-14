"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const SignaturePad = dynamic(() => import("../SignaturePad"), { ssr: false });

interface AirborneFormData {
  roomTempStr: string;
  roomTempAfter: string;
  roomHumidityStr: string;
  roomHumidityAfter: string;
  airChangeAch: string;
  airChangeAchAfter: string;
  pm25: string;
  pm25After: string;
  co2Ppm: string;
  co2PpmAfter: string;
  soundLevelDb: string;
  soundLevelDbAfter: string;
  airFlowCfm: string;
  airFlowCfmAfter: string;
  compL1: string;
  compL1After: string;
  compL2: string;
  compL2After: string;
  compL3: string;
  compL3After: string;
  motorAirL1: string;
  motorAirL1After: string;
  motorAirL2: string;
  motorAirL2After: string;
  motorAirL3: string;
  motorAirL3After: string;
  sensorControlRoom: string;
  roomThermostat: string;
  coolingCoil: string;
  motorCooling: string;
  coilYen: string;
  drainPipe: string;
  airFilter: string;
  twoWayValve: string;
  waterPipeInsulation: string;
  chillerPipe: string;
  boardControlCoilYen: string;
  condensingCoil: string;
  magneticOverload: string;
  motorCondensing: string;
  compressorCheck: string;
  dischargePressure: string;
  suctionPressure: string;
  saturateSuctionTemp: string;
  refrigerantPipeInsulation: string;
  boardControlCoilRon: string;
  remarksSensorControlRoom: string;
  remarksRoomThermostat: string;
  remarksCoolingCoil: string;
  remarksMotorCooling: string;
  remarksCoilYen: string;
  remarksDrainPipe: string;
  remarksAirFilter: string;
  remarksTwoWayValve: string;
  remarksWaterPipeInsulation: string;
  remarksChillerPipe: string;
  remarksBoardControlCoilYen: string;
  remarksCondensingCoil: string;
  remarksMagneticOverload: string;
  remarksMotorCondensing: string;
  remarksCompressorCheck: string;
  remarksDischargePressure: string;
  remarksSuctionPressure: string;
  remarksSaturateSuctionTemp: string;
  remarksRefrigerantPipeInsulation: string;
  remarksBoardControlCoilRon: string;
  remarksGeneral: string;
  customerSignature: string | null;
  wardNurseSignature: string | null;
  serviceSignature: string | null;
}

interface AirborneFormProps {
  jobItemId: string;
  initialData?: string;
  onSaveAction: (jobItemId: string, checklistJson: string) => Promise<{ success: boolean; error?: string }>;
}

const defaultFormData: AirborneFormData = {
  roomTempStr: "",
  roomTempAfter: "",
  roomHumidityStr: "",
  roomHumidityAfter: "",
  airChangeAch: "",
  airChangeAchAfter: "",
  pm25: "",
  pm25After: "",
  co2Ppm: "",
  co2PpmAfter: "",
  soundLevelDb: "",
  soundLevelDbAfter: "",
  airFlowCfm: "",
  airFlowCfmAfter: "",
  compL1: "",
  compL1After: "",
  compL2: "",
  compL2After: "",
  compL3: "",
  compL3After: "",
  motorAirL1: "",
  motorAirL1After: "",
  motorAirL2: "",
  motorAirL2After: "",
  motorAirL3: "",
  motorAirL3After: "",
  sensorControlRoom: "",
  roomThermostat: "",
  coolingCoil: "",
  motorCooling: "",
  coilYen: "",
  drainPipe: "",
  airFilter: "",
  twoWayValve: "",
  waterPipeInsulation: "",
  chillerPipe: "",
  boardControlCoilYen: "",
  condensingCoil: "",
  magneticOverload: "",
  motorCondensing: "",
  compressorCheck: "",
  dischargePressure: "",
  suctionPressure: "",
  saturateSuctionTemp: "",
  refrigerantPipeInsulation: "",
  boardControlCoilRon: "",
  remarksSensorControlRoom: "",
  remarksRoomThermostat: "",
  remarksCoolingCoil: "",
  remarksMotorCooling: "",
  remarksCoilYen: "",
  remarksDrainPipe: "",
  remarksAirFilter: "",
  remarksTwoWayValve: "",
  remarksWaterPipeInsulation: "",
  remarksChillerPipe: "",
  remarksBoardControlCoilYen: "",
  remarksCondensingCoil: "",
  remarksMagneticOverload: "",
  remarksMotorCondensing: "",
  remarksCompressorCheck: "",
  remarksDischargePressure: "",
  remarksSuctionPressure: "",
  remarksSaturateSuctionTemp: "",
  remarksRefrigerantPipeInsulation: "",
  remarksBoardControlCoilRon: "",
  remarksGeneral: "",
  customerSignature: null,
  wardNurseSignature: null,
  serviceSignature: null,
};

export default function AirborneInfectionForm({ jobItemId, initialData, onSaveAction }: AirborneFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<AirborneFormData>(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData);
        const data = parsed.data ? parsed.data : parsed;
        return { ...defaultFormData, ...data };
      } catch (e) {
        console.error("Failed to parse initial checklist data", e);
      }
    }
    return { ...defaultFormData };
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
        router.refresh();
      } else {
        setSaveMessage({ type: "error", text: result.error || "เกิดข้อผิดพลาดในการบันทึก" });
      }
    } catch (error: unknown) {
      setSaveMessage({ type: "error", text: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls =
    "w-full rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";
  const cellCls = "align-top px-2 py-2 border-b border-gray-200 dark:border-gray-600";

  // แถวตาราง: ซ้าย (DESCRIPTION | BEFORE | AFTER) ขวา (DESCRIPTION | ปกติ | ผิดปกติ | หมายเหตุ)
  // isSectionHeader = true: แถวหัวข้ออย่างเดียว (colspan 3 ซ้าย, ไม่มีช่อง BEFORE/AFTER) ให้ตรงกับฟอร์มจริง/PDF
  type Row = {
    leftDesc: string;
    beforeKey: keyof AirborneFormData | null;
    afterKey: keyof AirborneFormData | null;
    rightDesc: string;
    checkKey: keyof AirborneFormData | null;
    remarkKey: keyof AirborneFormData | null;
    valueKey?: keyof AirborneFormData;
    isSectionHeader?: boolean;
  };

  const rows: Row[] = [
    { leftDesc: "ROOM TEMPERATURE (°C)", beforeKey: "roomTempStr", afterKey: "roomTempAfter", rightDesc: "ชุดควบคุมเซนเซอร์ภายในห้อง", checkKey: "sensorControlRoom", remarkKey: "remarksSensorControlRoom" },
    { leftDesc: "ROOM HUMIDITY (%RH)", beforeKey: "roomHumidityStr", afterKey: "roomHumidityAfter", rightDesc: "ROOM THERMOSTAT", checkKey: "roomThermostat", remarkKey: "remarksRoomThermostat" },
    { leftDesc: "AIR CHANGE (ACH)", beforeKey: "airChangeAch", afterKey: "airChangeAchAfter", rightDesc: "ท่อ COOLING COIL", checkKey: "coolingCoil", remarkKey: "remarksCoolingCoil" },
    { leftDesc: "PM 2.5 (µg/m³)", beforeKey: "pm25", afterKey: "pm25After", rightDesc: "MOTOR ชุดจ่ายลมเย็น", checkKey: "motorCooling", remarkKey: "remarksMotorCooling" },
    { leftDesc: "CO₂ (PPM)", beforeKey: "co2Ppm", afterKey: "co2PpmAfter", rightDesc: "แผง คอยล์เย็น", checkKey: "coilYen", remarkKey: "remarksCoilYen" },
    { leftDesc: "SOUND LEVEL (dB)", beforeKey: "soundLevelDb", afterKey: "soundLevelDbAfter", rightDesc: "ท่อนํ้าทิ้ง", checkKey: "drainPipe", remarkKey: "remarksDrainPipe" },
    { leftDesc: "AIR FLOW (CFM.)", beforeKey: "airFlowCfm", afterKey: "airFlowCfmAfter", rightDesc: "แผ่นกรองอากาศ", checkKey: "airFilter", remarkKey: "remarksAirFilter" },
    { leftDesc: "", beforeKey: null, afterKey: null, rightDesc: "TWO WAY VALVE", checkKey: "twoWayValve", remarkKey: "remarksTwoWayValve" },
    // COMPRESSOR CURRENT: แถวหัวข้ออย่างเดียว (ไม่มีช่องกรอก/เช็คทางขวา)
    { isSectionHeader: true, leftDesc: "COMPRESSOR CURRENT", beforeKey: null, afterKey: null, rightDesc: "", checkKey: null, remarkKey: null },
    { leftDesc: "", beforeKey: null, afterKey: null, rightDesc: "ฉนวนหุ้มท่อน้ำเย็น", checkKey: "waterPipeInsulation", remarkKey: "remarksWaterPipeInsulation" },
    { leftDesc: "L 1", beforeKey: "compL1", afterKey: "compL1After", rightDesc: "ท่อส่งลมเย็น Chiller", checkKey: "chillerPipe", remarkKey: "remarksChillerPipe" },
    { leftDesc: "L 2", beforeKey: "compL2", afterKey: "compL2After", rightDesc: "Board Control คอยล์เย็น", checkKey: "boardControlCoilYen", remarkKey: "remarksBoardControlCoilYen" },
    { leftDesc: "L 3", beforeKey: "compL3", afterKey: "compL3After", rightDesc: "ชุดคอยล์ร้อน Condensing", checkKey: "condensingCoil", remarkKey: "remarksCondensingCoil" },
    { leftDesc: "", beforeKey: null, afterKey: null, rightDesc: "แมกเนติก โอเวอร์โหลด", checkKey: "magneticOverload", remarkKey: "remarksMagneticOverload" },
    // MOTOR CURRENT (AIR SIDE): แถวหัวข้ออย่างเดียว (ไม่มีช่องกรอก/เช็คทางขวา)
    { isSectionHeader: true, leftDesc: "MOTOR CURRENT (AIR SIDE)", beforeKey: null, afterKey: null, rightDesc: "", checkKey: null, remarkKey: null },
    { leftDesc: "", beforeKey: null, afterKey: null, rightDesc: "MOTOR CONDENSING", checkKey: "motorCondensing", remarkKey: "remarksMotorCondensing" },
    { leftDesc: "L 1", beforeKey: "motorAirL1", afterKey: "motorAirL1After", rightDesc: "COMPRESSOR", checkKey: "compressorCheck", remarkKey: "remarksCompressorCheck" },
    { leftDesc: "L 2", beforeKey: "motorAirL2", afterKey: "motorAirL2After", rightDesc: "DISCHARGE PRESSURE (PSIG)", checkKey: "dischargePressure", remarkKey: "remarksDischargePressure" },
    { leftDesc: "L 3", beforeKey: "motorAirL3", afterKey: "motorAirL3After", rightDesc: "SUCTION PRESSURE (PSIG)", checkKey: "suctionPressure", remarkKey: "remarksSuctionPressure" },
    { leftDesc: "", beforeKey: null, afterKey: null, rightDesc: "SATURATE SUCTION TEMP. (°C)", checkKey: "saturateSuctionTemp", remarkKey: "remarksSaturateSuctionTemp" },
    { leftDesc: "", beforeKey: null, afterKey: null, rightDesc: "ฉนวนหุ้มท่อสารทำความเย็น", checkKey: "refrigerantPipeInsulation", remarkKey: "remarksRefrigerantPipeInsulation" },
    { leftDesc: "", beforeKey: null, afterKey: null, rightDesc: "Board Control คอยล์ร้อน", checkKey: "boardControlCoilRon", remarkKey: "remarksBoardControlCoilRon" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-600 pb-4 mb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">CLEAN ROOM AND AIRBORNE INFECTION CONTROL ROOM REPORT</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ถ้ามีเครื่องหมาย (✔) แสดงว่าเครื่องปรับอากาศมีอุปกรณ์ แต่ถ้ามีเครื่องหมาย (-) แสดงว่าเครื่องปรับอากาศไม่มีอุปกรณ์</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm border border-gray-300 dark:border-gray-600">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className={cellCls + " text-left font-semibold w-[16%]"} scope="col">DESCRIPTION</th>
              <th className={cellCls + " text-center font-semibold w-[10%]"} scope="col">BEFORE</th>
              <th className={cellCls + " text-center font-semibold w-[10%]"} scope="col">AFTER</th>
              <th className={cellCls + " text-left font-semibold w-[15%] border-l-2 border-gray-400"} scope="col">DESCRIPTION</th>
              <th className={cellCls + " text-center font-semibold w-[9%] min-w-[3rem]"} scope="col">ปกติ</th>
              <th className={cellCls + " text-center font-semibold w-[9%] min-w-[3.5rem]"} scope="col">ผิดปกติ</th>
              <th className={cellCls + " text-left font-semibold w-[27%]"} scope="col">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            {rows.map((row, idx) => {
              const rightOnlyRow = !row.isSectionHeader && row.leftDesc === "" && row.beforeKey === null && row.afterKey === null;
              return (
              <tr key={idx} className="border-b border-gray-200 dark:border-gray-600">
                {row.isSectionHeader ? (
                  <td colSpan={7} className={cellCls + " font-semibold bg-amber-50 dark:bg-amber-900/20"}>{row.leftDesc}</td>
                ) : rightOnlyRow ? (
                  <>
                    <td colSpan={3} className={cellCls + " bg-gray-50/50 dark:bg-gray-800/50 w-[36%]"} aria-hidden />
                    <td className={cellCls + " border-l-2 border-gray-300 dark:border-gray-500 font-medium"}>{row.rightDesc}</td>
                    <td className={cellCls + " text-center"}>
                      {row.checkKey ? (
                        <input
                          type="radio"
                          name={row.checkKey}
                          value="normal"
                          checked={(formData[row.checkKey] as string) === "normal"}
                          onChange={() => handleRadioChange(row.checkKey!, "normal")}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                      ) : "—"}
                    </td>
                    <td className={cellCls + " text-center"}>
                      {row.checkKey ? (
                        <input
                          type="radio"
                          name={row.checkKey}
                          value="abnormal"
                          checked={(formData[row.checkKey] as string) === "abnormal"}
                          onChange={() => handleRadioChange(row.checkKey!, "abnormal")}
                          className="w-4 h-4 text-red-600 focus:ring-red-500"
                        />
                      ) : "—"}
                    </td>
                    <td className={cellCls}>
                      {row.remarkKey ? (
                        <textarea
                          name={row.remarkKey}
                          value={formData[row.remarkKey] as string}
                          onChange={handleChange}
                          placeholder="หมายเหตุ"
                          rows={2}
                          className={inputCls + " min-h-[3rem] resize-y"}
                        />
                      ) : "—"}
                    </td>
                  </>
                ) : (
                  <>
                    <td className={cellCls + " font-medium"}>{row.leftDesc}</td>
                    <td className={cellCls}>
                      {row.beforeKey ? (
                        <input
                          type="text"
                          name={row.beforeKey}
                          value={formData[row.beforeKey] as string}
                          onChange={handleChange}
                          className={inputCls}
                        />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className={cellCls}>
                      {row.afterKey ? (
                        <input
                          type="text"
                          name={row.afterKey}
                          value={formData[row.afterKey] as string}
                          onChange={handleChange}
                          className={inputCls}
                        />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className={cellCls + " border-l-2 border-gray-300 dark:border-gray-500 font-medium"}>{row.rightDesc}</td>
                    <td className={cellCls + " text-center"}>
                      {row.valueKey ? "—" : row.checkKey ? (
                        <input
                          type="radio"
                          name={row.checkKey}
                          value="normal"
                          checked={(formData[row.checkKey] as string) === "normal"}
                          onChange={() => handleRadioChange(row.checkKey!, "normal")}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={cellCls + " text-center"}>
                      {row.valueKey ? "—" : row.checkKey ? (
                        <input
                          type="radio"
                          name={row.checkKey}
                          value="abnormal"
                          checked={(formData[row.checkKey] as string) === "abnormal"}
                          onChange={() => handleRadioChange(row.checkKey!, "abnormal")}
                          className="w-4 h-4 text-red-600 focus:ring-red-500"
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={cellCls}>
                      {row.valueKey ? (
                        <input
                          type="text"
                          name={row.valueKey}
                          value={formData[row.valueKey] as string}
                          onChange={handleChange}
                          placeholder="ค่า"
                          className={inputCls}
                        />
                      ) : row.remarkKey ? (
                        <textarea
                          name={row.remarkKey}
                          value={formData[row.remarkKey] as string}
                          onChange={handleChange}
                          placeholder="หมายเหตุ"
                          rows={2}
                          className={inputCls + " min-h-[3rem] resize-y"}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                  </>
                )}
              </tr>
            );})}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
        <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">REMARKS</label>
        <textarea
          name="remarksGeneral"
          rows={3}
          value={formData.remarksGeneral}
          onChange={handleChange}
          placeholder="หมายเหตุเพิ่มเติม..."
          className={inputCls + " min-h-[80px]"}
        />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
        <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">ลงลายมือชื่อ (Signatures)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SignaturePad
            label="CUSTOMER SIGNATURE"
            initialDataUrl={formData.customerSignature}
            onSave={(data) => setFormData((prev) => ({ ...prev, customerSignature: data }))}
          />
          <SignaturePad
            label="WARD NURSE SIGNATURE"
            initialDataUrl={formData.wardNurseSignature}
            onSave={(data) => setFormData((prev) => ({ ...prev, wardNurseSignature: data }))}
          />
          <SignaturePad
            label="SERVICE SIGNATURE"
            initialDataUrl={formData.serviceSignature}
            onSave={(data) => setFormData((prev) => ({ ...prev, serviceSignature: data }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {saveMessage.text && (
          <div
            className={`p-3 rounded-lg text-sm ${saveMessage.type === "success" ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200" : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200"}`}
          >
            {saveMessage.text}
          </div>
        )}
        {saveMessage.type !== "success" && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm shadow-sm"
            >
              {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล (Save Data & Signatures)"}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
