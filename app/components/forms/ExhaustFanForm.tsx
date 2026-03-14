"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const SignaturePad = dynamic(() => import("../SignaturePad"), { ssr: false });

export interface ExhaustFanFormData {
  soundLevelDb: string;
  soundLevelDbAfter: string;
  airFlowCfm: string;
  airFlowCfmAfter: string;
  motorL1: string;
  motorL1After: string;
  motorL2: string;
  motorL2After: string;
  motorL3: string;
  motorL3After: string;
  motorClean: string;
  remarksMotorClean: string;
  fanMotor: string;
  remarksFanMotor: string;
  maskClean: string;
  remarksMaskClean: string;
  capCapacitor: string;
  remarksCapCapacitor: string;
  remarksGeneral: string;
  customerSignature: string | null;
  wardNurseSignature: string | null;
  serviceSignature: string | null;
  [key: string]: string | null | undefined;
}

interface ExhaustFanFormProps {
  jobItemId: string;
  initialData?: string;
  onSaveAction: (jobItemId: string, checklistJson: string) => Promise<{ success: boolean; error?: string }>;
}

const defaultFormData: ExhaustFanFormData = {
  soundLevelDb: "",
  soundLevelDbAfter: "",
  airFlowCfm: "",
  airFlowCfmAfter: "",
  motorL1: "",
  motorL1After: "",
  motorL2: "",
  motorL2After: "",
  motorL3: "",
  motorL3After: "",
  motorClean: "",
  remarksMotorClean: "",
  fanMotor: "",
  remarksFanMotor: "",
  maskClean: "",
  remarksMaskClean: "",
  capCapacitor: "",
  remarksCapCapacitor: "",
  remarksGeneral: "",
  customerSignature: null,
  wardNurseSignature: null,
  serviceSignature: null,
};

export default function ExhaustFanForm({ jobItemId, initialData, onSaveAction }: ExhaustFanFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ExhaustFanFormData>(() => {
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

  type Row = {
    leftDesc: string;
    beforeKey: keyof ExhaustFanFormData | null;
    afterKey: keyof ExhaustFanFormData | null;
    rightDesc: string;
    checkKey: keyof ExhaustFanFormData | null;
    remarkKey: keyof ExhaustFanFormData | null;
    isSectionHeader?: boolean;
  };

  const rows: Row[] = [
    { leftDesc: "SOUND LEVEL (dB).", beforeKey: "soundLevelDb", afterKey: "soundLevelDbAfter", rightDesc: "ความสะอาดตัว MOTOR", checkKey: "motorClean", remarkKey: "remarksMotorClean" },
    { leftDesc: "AIR FLOW (CFM.)", beforeKey: "airFlowCfm", afterKey: "airFlowCfmAfter", rightDesc: "ใบพัด MOTOR", checkKey: "fanMotor", remarkKey: "remarksFanMotor" },
    { leftDesc: "", beforeKey: null, afterKey: null, rightDesc: "ความสะอาดหน้ากาก MOTOR", checkKey: "maskClean", remarkKey: "remarksMaskClean" },
    { isSectionHeader: true, leftDesc: "MOTOR CURRENT", beforeKey: null, afterKey: null, rightDesc: "", checkKey: null, remarkKey: null },
    { leftDesc: "", beforeKey: null, afterKey: null, rightDesc: "CAP คาปาซิเตอร์ส", checkKey: "capCapacitor", remarkKey: "remarksCapCapacitor" },
    { leftDesc: "L 1", beforeKey: "motorL1", afterKey: "motorL1After", rightDesc: "", checkKey: null, remarkKey: null },
    { leftDesc: "L 2", beforeKey: "motorL2", afterKey: "motorL2After", rightDesc: "", checkKey: null, remarkKey: null },
    { leftDesc: "L 3", beforeKey: "motorL3", afterKey: "motorL3After", rightDesc: "", checkKey: null, remarkKey: null },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-600 pb-4 mb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">EXHAUST FAN TYPE REPORT</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ถ้ามีเครื่องหมาย (✔) แสดงว่ามีอุปกรณ์ แต่ถ้ามีเครื่องหมาย (-) แสดงว่าไม่มีอุปกรณ์</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm border border-gray-300 dark:border-gray-600">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className={cellCls + " text-left font-semibold w-[16%]"} scope="col">DESCRIPTION</th>
              <th className={cellCls + " text-center font-semibold w-[10%]"} scope="col">BEFORE</th>
              <th className={cellCls + " text-center font-semibold w-[10%]"} scope="col">AFTER</th>
              <th className={cellCls + " text-left font-semibold w-[15%] border-l-2 border-gray-400"} scope="col">DESCRIPTION</th>
              <th className={cellCls + " text-center font-semibold w-[9%]"} scope="col">ปกติ</th>
              <th className={cellCls + " text-center font-semibold w-[9%]"} scope="col">ผิดปกติ</th>
              <th className={cellCls + " text-left font-semibold w-[27%]"} scope="col">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            {rows.map((row, idx) => {
              const rightOnlyRow = !row.isSectionHeader && row.leftDesc === "" && row.beforeKey === null && row.afterKey === null;
              const rightEmptyRow = !row.isSectionHeader && row.rightDesc === "" && !row.checkKey && !row.remarkKey;
              return (
                <tr key={idx} className="border-b border-gray-200 dark:border-gray-600">
                  {row.isSectionHeader ? (
                    <td colSpan={7} className={cellCls + " font-semibold bg-amber-50 dark:bg-amber-900/20"}>{row.leftDesc}</td>
                  ) : rightOnlyRow ? (
                    <>
                      <td colSpan={3} className={cellCls + " bg-gray-50/50 dark:bg-gray-800/50"} aria-hidden />
                      <td className={cellCls + " border-l-2 border-gray-300 dark:border-gray-500 font-medium"}>{row.rightDesc}</td>
                      <td className={cellCls + " text-center"}>
                        {row.checkKey && (
                          <input type="radio" name={String(row.checkKey)} value="normal" checked={(formData[row.checkKey] as string) === "normal"} onChange={() => handleRadioChange(String(row.checkKey), "normal")} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                        )}
                      </td>
                      <td className={cellCls + " text-center"}>
                        {row.checkKey && (
                          <input type="radio" name={String(row.checkKey)} value="abnormal" checked={(formData[row.checkKey] as string) === "abnormal"} onChange={() => handleRadioChange(String(row.checkKey), "abnormal")} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                        )}
                      </td>
                      <td className={cellCls}>
                        {row.remarkKey && (
                          <textarea name={String(row.remarkKey)} value={formData[row.remarkKey] as string} onChange={handleChange} placeholder="หมายเหตุ" rows={2} className={inputCls + " min-h-[3rem] resize-y"} />
                        )}
                      </td>
                    </>
                  ) : rightEmptyRow ? (
                    <>
                      <td className={cellCls + " font-medium"}>{row.leftDesc}</td>
                      <td className={cellCls}>
                        {row.beforeKey ? <input type="text" name={String(row.beforeKey)} value={formData[row.beforeKey] as string} onChange={handleChange} className={inputCls} /> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className={cellCls}>
                        {row.afterKey ? <input type="text" name={String(row.afterKey)} value={formData[row.afterKey] as string} onChange={handleChange} className={inputCls} /> : <span className="text-gray-400">—</span>}
                      </td>
                      <td colSpan={4} className={cellCls + " border-l-2 border-gray-300 dark:border-gray-500 bg-gray-50/50"} />
                    </>
                  ) : (
                    <>
                      <td className={cellCls + " font-medium"}>{row.leftDesc || "—"}</td>
                      <td className={cellCls}>
                        {row.beforeKey ? <input type="text" name={String(row.beforeKey)} value={formData[row.beforeKey] as string} onChange={handleChange} className={inputCls} /> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className={cellCls}>
                        {row.afterKey ? <input type="text" name={String(row.afterKey)} value={formData[row.afterKey] as string} onChange={handleChange} className={inputCls} /> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className={cellCls + " border-l-2 border-gray-300 dark:border-gray-500 font-medium"}>{row.rightDesc || "—"}</td>
                      <td className={cellCls + " text-center"}>
                        {row.checkKey && (
                          <input type="radio" name={String(row.checkKey)} value="normal" checked={(formData[row.checkKey] as string) === "normal"} onChange={() => handleRadioChange(String(row.checkKey), "normal")} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                        )}
                      </td>
                      <td className={cellCls + " text-center"}>
                        {row.checkKey && (
                          <input type="radio" name={String(row.checkKey)} value="abnormal" checked={(formData[row.checkKey] as string) === "abnormal"} onChange={() => handleRadioChange(String(row.checkKey), "abnormal")} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                        )}
                      </td>
                      <td className={cellCls}>
                        {row.remarkKey && <textarea name={String(row.remarkKey)} value={formData[row.remarkKey] as string} onChange={handleChange} placeholder="หมายเหตุ" rows={2} className={inputCls + " min-h-[3rem] resize-y"} />}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
        <label className="block text-sm font-semibold text-gray-800 dark:text-white mb-2">REMARKS</label>
        <textarea name="remarksGeneral" rows={3} value={formData.remarksGeneral} onChange={handleChange} placeholder="หมายเหตุเพิ่มเติม..." className={inputCls + " min-h-[80px]"} />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
        <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">ลงลายมือชื่อ (Signatures)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SignaturePad label="CUSTOMER SIGNATURE" initialDataUrl={formData.customerSignature} onSave={(data) => setFormData((p) => ({ ...p, customerSignature: data }))} />
          <SignaturePad label="WARD NURSE SIGNATURE" initialDataUrl={formData.wardNurseSignature} onSave={(data) => setFormData((p) => ({ ...p, wardNurseSignature: data }))} />
          <SignaturePad label="SERVICE SIGNATURE" initialDataUrl={formData.serviceSignature} onSave={(data) => setFormData((p) => ({ ...p, serviceSignature: data }))} />
        </div>
      </div>

      {saveMessage.text && (
        <div className={`rounded-lg px-4 py-3 text-sm ${saveMessage.type === "success" ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200" : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"}`}>
          {saveMessage.text}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button type="submit" disabled={isSaving} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </button>
      </div>
    </form>
  );
}
