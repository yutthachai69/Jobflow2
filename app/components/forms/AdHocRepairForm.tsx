'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

const SignaturePad = dynamic(() => import('@/app/components/SignaturePad'), {
  loading: () => <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">กำลังโหลด...</div>,
  ssr: false,
});

interface AdHocRepairFormProps {
  jobItemId: string;
  workOrderData: {
    locationDescription?: string;
    problemDescription?: string;
    repairType?: string;
  };
  initialData?: string;
  onSaveAction: (jobItemId: string, data: string) => Promise<void>;
}

export default function AdHocRepairForm({
  jobItemId,
  workOrderData,
  initialData,
  onSaveAction,
}: AdHocRepairFormProps) {
  const [techNote, setTechNote] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse initial data if exists
  React.useEffect(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData);
        if (parsed.techNote) setTechNote(parsed.techNote);
        if (parsed.signature) setSignature(parsed.signature);
      } catch (e) {
        console.error('Failed to parse initial data', e);
      }
    }
  }, [initialData]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const data = JSON.stringify({
        techNote,
        signature,
        formType: 'AD_HOC',
      });
      await onSaveAction(jobItemId, data);
      toast.success('บันทึกข้อมูลเรียบร้อยแล้ว');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Work Order Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4">รายละเอียดการซ่อมนอกแผน</h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600">สถานที่</label>
            <p className="text-gray-900 font-semibold">{workOrderData.locationDescription || '-'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">ประเภทการซ่อม</label>
            <p className="text-gray-900 font-semibold">
              {workOrderData.repairType === 'WASH_AC' && 'ล้างแอร์'}
              {workOrderData.repairType === 'REPAIR_AC' && 'ซ่อมแอร์'}
              {workOrderData.repairType === 'WASH_FAN' && 'ล้างพัดลม'}
              {workOrderData.repairType === 'REPAIR_FAN' && 'ซ่อมพัดลม'}
              {workOrderData.repairType === 'OTHER' && 'อื่นๆ'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">รายละเอียดปัญหา</label>
            <p className="text-gray-900 whitespace-pre-wrap">{workOrderData.problemDescription || '-'}</p>
          </div>
        </div>
      </div>

      {/* Tech Note */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          หมายเหตุของช่าง
        </label>
        <textarea
          value={techNote}
          onChange={(e) => setTechNote(e.target.value)}
          placeholder="บรรยายการซ่อม วัสดุที่ใช้ ปัญหาที่พบ..."
          rows={5}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Signature */}
      <SignaturePad
        label="ลายเซ็นช่าง"
        onSave={setSignature}
        initialDataUrl={signature}
      />

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-all"
      >
        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
      </button>
    </div>
  );
}
