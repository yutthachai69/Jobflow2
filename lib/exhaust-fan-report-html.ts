/**
 * สร้าง HTML สำหรับฟอร์ม EXHAUST FAN TYPE REPORT
 * ใช้ใน JobItemReportDownloadButton เมื่อ formType === 'EXHAUST_FAN'
 */

interface ExhaustFanData {
  soundLevelDb?: string
  soundLevelDbAfter?: string
  airFlowCfm?: string
  airFlowCfmAfter?: string
  motorL1?: string
  motorL1After?: string
  motorL2?: string
  motorL2After?: string
  motorL3?: string
  motorL3After?: string
  motorClean?: string
  remarksMotorClean?: string
  fanMotor?: string
  remarksFanMotor?: string
  maskClean?: string
  remarksMaskClean?: string
  capCapacitor?: string
  remarksCapCapacitor?: string
  remarksGeneral?: string
  customerSignature?: string | null
  wardNurseSignature?: string | null
  serviceSignature?: string | null
  [key: string]: string | null | undefined
}

function esc(s: string | undefined | null): string {
  if (s == null || s === '') return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function check(data: ExhaustFanData, field: string, expected: string): string {
  return data[field] === expected ? '✓' : ''
}

export function buildExhaustFanReportHtml(
  jobItem: {
    checklist: string | null
    asset: { qrCode: string; name?: string | null; room?: { name: string } | null }
  },
  workOrder: {
    site: { name: string; client: { name: string } }
    scheduledDate: Date | string
  }
): string {
  let data: ExhaustFanData = {}
  if (jobItem.checklist) {
    try {
      const parsed = JSON.parse(jobItem.checklist) as { formType?: string; data?: ExhaustFanData } | ExhaustFanData
      const resolved = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'data' in parsed
        ? (parsed.data ?? {})
        : (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {})
      data = (typeof resolved === 'object' && resolved !== null ? resolved : {}) as ExhaustFanData
    } catch {
      // ignore
    }
  }

  const clientName = workOrder.site?.client?.name ?? ''
  const locationName = workOrder.site?.name ?? ''
  const dateStr = workOrder.scheduledDate
    ? new Date(workOrder.scheduledDate).toLocaleDateString('th-TH')
    : ''
  const roomName = jobItem.asset?.room?.name ?? ''
  const assetLabel = jobItem.asset?.name ?? jobItem.asset?.qrCode ?? ''

  const sigImg = (src: string | undefined | null) =>
    src && (src.startsWith('data:') || src.startsWith('http'))
      ? `<img src="${esc(src)}" alt="" style="max-height:64px;width:auto;display:block;margin:0 auto;" />`
      : ''

  return `
<div class="exhaust-report" style="page-break-before: always;">
  <table class="exhaust-header-table">
    <tbody>
      <tr>
        <td width="15%"><div class="exhaust-logo-box">L.M.T.</div></td>
        <td class="exhaust-company-header">
          <div style="font-size:13px;font-weight:bold;">L.M.T. Engineering Limited Partnership</div>
          <div style="font-size:11px;">ห้างหุ้นส่วนจำกัด แอล.เอ็ม.ที. เอ็นจิเนียริ่ง</div>
          <div style="font-size:8px;">98 ซอยกรุงเทพกรีฑา 51 แขวงทับช้าง เขตสะพานสูง กรุงเทพฯ 10250 เลขประจำตัวผู้เสียภาษี 0103564014496<br/>โทร: 088 807 1002, 098 519 4855 Email: lmtengineering@gmail.com</div>
        </td>
        <td width="15%"></td>
      </tr>
    </tbody>
  </table>
  <table class="exhaust-info-table">
    <tbody>
      <tr>
        <td class="exhaust-title-row" colspan="4">EXHAUST FAN TYPE REPORT</td>
      </tr>
      <tr>
        <td class="exhaust-bg-blue" style="width:18%">CUSTOMER NAME</td>
        <td class="exhaust-data" style="width:35%">${esc(clientName)}</td>
        <td class="exhaust-bg-blue" style="width:10%">DATE</td>
        <td class="exhaust-data" style="width:37%">${esc(dateStr)}</td>
      </tr>
      <tr>
        <td class="exhaust-bg-blue">LOCATION</td>
        <td class="exhaust-data">${esc(locationName)}</td>
        <td class="exhaust-bg-blue">ROOM TYPE</td>
        <td class="exhaust-data">${esc(roomName)} (Asset: ${esc(assetLabel)})</td>
      </tr>
    </tbody>
  </table>
  <div class="exhaust-fan-type">EXHAUST FAN TYPE</div>
  <table class="exhaust-main-table">
    <thead>
      <tr>
        <th style="width:22%">DESCRIPTION</th>
        <th style="width:10%">BEFORE</th>
        <th style="width:10%">AFTER</th>
        <th style="width:28%">DESCRIPTION</th>
        <th style="width:6%">ปกติ</th>
        <th style="width:6%">ผิดปกติ</th>
        <th>หมายเหตุ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>SOUND LEVEL (dB).</td>
        <td class="exhaust-cream text-center">${esc(data.soundLevelDb)}</td>
        <td class="exhaust-cream text-center">${esc(data.soundLevelDbAfter)}</td>
        <td>ความสะอาดตัว MOTOR</td>
        <td class="exhaust-cream text-center">${check(data,'motorClean','normal')}</td>
        <td class="exhaust-cream text-center">${check(data,'motorClean','abnormal')}</td>
        <td class="exhaust-cream">${esc(data.remarksMotorClean)}</td>
      </tr>
      <tr>
        <td>AIR FLOW (CFM.)</td>
        <td class="exhaust-cream text-center">${esc(data.airFlowCfm)}</td>
        <td class="exhaust-cream text-center">${esc(data.airFlowCfmAfter)}</td>
        <td>ใบพัด MOTOR</td>
        <td class="exhaust-cream text-center">${check(data,'fanMotor','normal')}</td>
        <td class="exhaust-cream text-center">${check(data,'fanMotor','abnormal')}</td>
        <td class="exhaust-cream">${esc(data.remarksFanMotor)}</td>
      </tr>
      <tr>
        <td></td>
        <td class="exhaust-cream"></td>
        <td class="exhaust-cream"></td>
        <td>ความสะอาดหน้ากาก MOTOR</td>
        <td class="exhaust-cream text-center">${check(data,'maskClean','normal')}</td>
        <td class="exhaust-cream text-center">${check(data,'maskClean','abnormal')}</td>
        <td class="exhaust-cream">${esc(data.remarksMaskClean)}</td>
      </tr>
      <tr>
        <td class="exhaust-bg-yellow">MOTOR CURRENT</td>
        <td class="exhaust-cream"></td>
        <td class="exhaust-cream"></td>
        <td>CAP คาปาซิเตอร์ส</td>
        <td class="exhaust-cream text-center">${check(data,'capCapacitor','normal')}</td>
        <td class="exhaust-cream text-center">${check(data,'capCapacitor','abnormal')}</td>
        <td class="exhaust-cream">${esc(data.remarksCapCapacitor)}</td>
      </tr>
      <tr>
        <td class="exhaust-bg-yellow">L 1</td>
        <td class="exhaust-cream text-center">${esc(data.motorL1)}</td>
        <td class="exhaust-cream text-center">${esc(data.motorL1After)}</td>
        <td></td>
        <td class="exhaust-cream"></td>
        <td class="exhaust-cream"></td>
        <td class="exhaust-cream"></td>
      </tr>
      <tr>
        <td class="exhaust-bg-yellow">L 2</td>
        <td class="exhaust-cream text-center">${esc(data.motorL2)}</td>
        <td class="exhaust-cream text-center">${esc(data.motorL2After)}</td>
        <td></td>
        <td class="exhaust-cream"></td>
        <td class="exhaust-cream"></td>
        <td class="exhaust-cream"></td>
      </tr>
      <tr>
        <td class="exhaust-bg-yellow">L 3</td>
        <td class="exhaust-cream text-center">${esc(data.motorL3)}</td>
        <td class="exhaust-cream text-center">${esc(data.motorL3After)}</td>
        <td></td>
        <td class="exhaust-cream"></td>
        <td class="exhaust-cream"></td>
        <td class="exhaust-cream"></td>
      </tr>
    </tbody>
  </table>
  <div class="exhaust-remarks-header">REMARKS</div>
  <div class="exhaust-remarks-body">${esc(data.remarksGeneral)}</div>
  <table class="exhaust-sig-table">
    <tbody>
      <tr>
        <td class="exhaust-bg-blue" style="width:33.33%">CUSTOMER SIGNATURE</td>
        <td class="exhaust-bg-blue" style="width:33.33%">WARD NURSE SIGNATURE</td>
        <td class="exhaust-bg-blue" style="width:33.33%">SERVICE SIGNATURE</td>
      </tr>
      <tr>
        <td height="80" class="text-center p-2" style="vertical-align:middle">${sigImg(data.customerSignature)}</td>
        <td class="text-center p-2" style="vertical-align:middle">${sigImg(data.wardNurseSignature)}</td>
        <td class="text-center p-2" style="vertical-align:middle">${sigImg(data.serviceSignature)}</td>
      </tr>
      <tr>
        <td>DATE: ${esc(dateStr) || '....../....../......'}</td>
        <td>DATE: ${esc(dateStr) || '....../....../......'}</td>
        <td>DATE: ${esc(dateStr) || '....../....../......'}</td>
      </tr>
    </tbody>
  </table>
  <p style="font-size:8.5px;margin-top:10px;">หมายเหตุ ถ้ามีเครื่องหมาย ( ✓ ) แสดงว่ามีอุปกรณ์ แต่ถ้ามีเครื่องหมาย ( - ) แสดงว่าไม่มีอุปกรณ์</p>
</div>
`
}

export const EXHAUST_REPORT_CSS = `
.exhaust-report { font-family: 'Sarabun', sans-serif; font-size: 10px; color: #000; margin: 0; padding: 10px 0; }
.exhaust-header-table { width: 100%; border: none; margin-bottom: 5px; }
.exhaust-logo-box { width: 50px; height: 50px; border: 1.5px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }
.exhaust-company-header { text-align: center; line-height: 1.4; }
.exhaust-info-table { width: 100%; border-collapse: collapse; }
.exhaust-info-table td { border: 1px solid #000; padding: 4px; }
.exhaust-title-row { background-color: #b4c7e7 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; text-align: center; font-weight: bold; font-size: 11px; padding: 6px; }
.exhaust-bg-blue { background-color: #b4c7e7 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; }
.exhaust-data { background-color: #fff !important; font-weight: normal; }
.exhaust-fan-type { border: 1px solid #000; border-top: none; padding: 5px; font-weight: bold; background-color: #b4c7e7 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.exhaust-main-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: -1px; }
.exhaust-main-table th { background-color: #b4c7e7 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; border: 1px solid #000; padding: 4px; font-size: 10px; }
.exhaust-main-table td { border: 1px solid #000; padding: 3px 4px; min-height: 18px; vertical-align: top; }
.exhaust-bg-yellow { background-color: #fff9e6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.exhaust-cream { background-color: #fff9e6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.exhaust-remarks-header { background-color: #b4c7e7 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; text-align: center; font-weight: bold; border: 1px solid #000; padding: 4px; margin-top: -1px; }
.exhaust-remarks-body { border: 1px solid #000; border-top: none; padding: 4px; min-height: 40px; white-space: pre-wrap; }
.exhaust-sig-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
.exhaust-sig-table td { border: 1px solid #000; padding: 4px; text-align: center; }
.text-center { text-align: center; }
.p-2 { padding: 8px; }
`
