/**
 * สร้าง HTML สำหรับฟอร์ม CLEAN ROOM AND AIRBORNE INFECTION CONTROL ROOM REPORT
 * ใช้ต่อท้ายใบรายงานใน PDF (ส่งออกจากหน้ารายละเอียดใบสั่งงาน)
 */

interface AirborneData {
  roomTempStr?: string
  roomHumidityStr?: string
  airChangeAch?: string
  pm25?: string
  co2Ppm?: string
  soundLevelDb?: string
  airFlowCfm?: string
  sensorControlRoom?: string
  remarksSensorControlRoom?: string
  roomThermostat?: string
  remarksRoomThermostat?: string
  coolingCoil?: string
  remarksCoolingCoil?: string
  motorCooling?: string
  remarksMotorCooling?: string
  coilYen?: string
  remarksCoilYen?: string
  drainPipe?: string
  remarksDrainPipe?: string
  airFilter?: string
  remarksAirFilter?: string
  twoWayValve?: string
  remarksTwoWayValve?: string
  waterPipeInsulation?: string
  remarksWaterPipeInsulation?: string
  compL1?: string
  compL2?: string
  compL3?: string
  chillerPipe?: string
  remarksChillerPipe?: string
  boardControlCoilYen?: string
  remarksBoardControlCoilYen?: string
  condensingCoil?: string
  remarksCondensingCoil?: string
  magneticOverload?: string
  remarksMagneticOverload?: string
  motorAirL1?: string
  motorAirL2?: string
  motorAirL3?: string
  motorCondensing?: string
  remarksMotorCondensing?: string
  compressorCheck?: string
  remarksCompressorCheck?: string
  dischargePressure?: string
  remarksDischargePressure?: string
  suctionPressure?: string
  remarksSuctionPressure?: string
  saturateSuctionTemp?: string
  remarksSaturateSuctionTemp?: string
  refrigerantPipeInsulation?: string
  remarksRefrigerantPipeInsulation?: string
  boardControlCoilRon?: string
  remarksBoardControlCoilRon?: string
  remarksGeneral?: string
  customerSignature?: string
  wardNurseSignature?: string
  serviceSignature?: string
  [key: string]: string | undefined
}

function esc(s: string | undefined): string {
  if (s == null || s === '') return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function check(data: AirborneData, field: string, expected: string): string {
  return data[field] === expected ? '✓' : ''
}

export function buildAirborneReportHtml(
  jobItem: {
    checklist: string | null
    asset: { qrCode: string; name?: string | null; room?: { name: string } | null }
  },
  workOrder: {
    site: { name: string; client: { name: string } }
    scheduledDate: Date | string
  },
  options?: { pmWashLabel?: string | null }
): string {
  const pmWashLabel = options?.pmWashLabel ?? null
  let data: AirborneData = {}
  if (jobItem.checklist) {
    try {
      const parsed = JSON.parse(jobItem.checklist) as { data?: AirborneData } | AirborneData
      const resolved = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'data' in parsed
        ? (parsed.data ?? {})
        : (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {})
      data = (typeof resolved === 'object' && resolved !== null ? resolved : {}) as AirborneData
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

  const sigImg = (src: string | undefined) =>
    src && (src.startsWith('data:') || src.startsWith('http'))
      ? `<img src="${esc(src)}" alt="" style="max-height:64px;width:auto;display:block;margin:0 auto;" />`
      : ''

  return `
<div class="airborne-report" style="page-break-before: always;">
  <table class="airborne-header-table">
    <tbody>
      <tr>
        <td width="15%"><div class="airborne-logo-box">L.M.T.</div></td>
        <td class="airborne-company-header">
          <div style="font-size:13px;font-weight:bold;">L.M.T. Engineering Limited Partnership</div>
          <div style="font-size:11px;">ห้างหุ้นส่วนจำกัด แอล.เอ็ม.ที. เอ็นจิเนียริ่ง</div>
          <div style="font-size:8px;">98 ซอยกรุงเทพกรีฑา 51 แขวงทับช้าง เขตสะพานสูง กรุงเทพฯ 10250 เลขประจำตัวผู้เสียภาษี 0103564014496<br/>โทร: 088 807 1002, 098 519 4855 Email: lmtengineering@gmail.com</div>
        </td>
        <td width="15%"></td>
      </tr>
    </tbody>
  </table>
  <div class="airborne-title-box">CLEAN ROOM AND AIRBORNE INFECTION CONTROL ROOM REPORT</div>
  <table class="airborne-info-table">
    <tbody>
      <tr>
        <td width="15%">CUSTOMER NAME</td>
        <td class="airborne-data" width="35%">${esc(clientName)}</td>
        <td width="10%">DATE</td>
        <td class="airborne-data" width="40%">${esc(dateStr)}</td>
      </tr>
      <tr>
        <td>LOCATION</td>
        <td class="airborne-data">${esc(locationName)}</td>
        <td>ROOM TYPE</td>
        <td class="airborne-data">${esc(roomName)} (Asset: ${esc(assetLabel)})</td>
      </tr>
      ${pmWashLabel
        ? `<tr>
        <td>ประเภทการล้าง</td>
        <td class="airborne-data" colspan="3">${esc(pmWashLabel)}</td>
      </tr>`
        : ''}
    </tbody>
  </table>
  <table class="airborne-main-table">
    <thead>
      <tr>
        <th style="width:20%">DESCRIPTION</th>
        <th style="width:9%">BEFORE</th>
        <th style="width:9%">AFTER</th>
        <th style="width:25%">DESCRIPTION</th>
        <th style="width:9%">ปกติ</th>
        <th style="width:9%">ผิดปกติ</th>
        <th style="width:14%">หมายเหตุ</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="airborne-bg-yellow">ROOM TEMPERATURE (°C)</td><td class="text-center bold">${esc(data.roomTempStr)}</td><td class="text-center bold">${esc(data.roomTempAfter)}</td><td>ชุดควบคุมเซนเซอร์ภายในห้อง</td><td class="text-center bold">${check(data,'sensorControlRoom','normal')}</td><td class="text-center bold">${check(data,'sensorControlRoom','abnormal')}</td><td class="text-center">${esc(data.remarksSensorControlRoom)}</td></tr>
      <tr><td class="airborne-bg-yellow">ROOM HUMIDITY (%RH)</td><td class="text-center bold">${esc(data.roomHumidityStr)}</td><td class="text-center bold">${esc(data.roomHumidityAfter)}</td><td>ROOM THERMOSTAT</td><td class="text-center bold">${check(data,'roomThermostat','normal')}</td><td class="text-center bold">${check(data,'roomThermostat','abnormal')}</td><td class="text-center">${esc(data.remarksRoomThermostat)}</td></tr>
      <tr><td class="airborne-bg-yellow">AIR CHANGE (ACH)</td><td class="text-center bold">${esc(data.airChangeAch)}</td><td class="text-center bold">${esc(data.airChangeAchAfter)}</td><td>ชุด COOLING COIL</td><td class="text-center bold">${check(data,'coolingCoil','normal')}</td><td class="text-center bold">${check(data,'coolingCoil','abnormal')}</td><td class="text-center">${esc(data.remarksCoolingCoil)}</td></tr>
      <tr><td class="airborne-bg-yellow">PM 2.5 (ug/m3)</td><td class="text-center bold">${esc(data.pm25)}</td><td class="text-center bold">${esc(data.pm25After)}</td><td>MOTOR ชุดจ่ายลมเย็น</td><td class="text-center bold">${check(data,'motorCooling','normal')}</td><td class="text-center bold">${check(data,'motorCooling','abnormal')}</td><td class="text-center">${esc(data.remarksMotorCooling)}</td></tr>
      <tr><td class="airborne-bg-yellow">co2 (PPM)</td><td class="text-center bold">${esc(data.co2Ppm)}</td><td class="text-center bold">${esc(data.co2PpmAfter)}</td><td>แผง คอยล์เย็น</td><td class="text-center bold">${check(data,'coilYen','normal')}</td><td class="text-center bold">${check(data,'coilYen','abnormal')}</td><td class="text-center">${esc(data.remarksCoilYen)}</td></tr>
      <tr><td class="airborne-bg-yellow">SOUND LEVEL (dB)</td><td class="text-center bold">${esc(data.soundLevelDb)}</td><td class="text-center bold">${esc(data.soundLevelDbAfter)}</td><td>ท่อน้ำทิ้ง</td><td class="text-center bold">${check(data,'drainPipe','normal')}</td><td class="text-center bold">${check(data,'drainPipe','abnormal')}</td><td class="text-center">${esc(data.remarksDrainPipe)}</td></tr>
      <tr><td class="airborne-bg-yellow">AIR FLOW (CFM.)</td><td class="text-center bold">${esc(data.airFlowCfm)}</td><td class="text-center bold">${esc(data.airFlowCfmAfter)}</td><td>แผ่นกรองอากาศ</td><td class="text-center bold">${check(data,'airFilter','normal')}</td><td class="text-center bold">${check(data,'airFilter','abnormal')}</td><td class="text-center">${esc(data.remarksAirFilter)}</td></tr>
      <tr><td class="airborne-bg-yellow"></td><td class="text-center bold"></td><td class="text-center bold"></td><td>TWO WAY VALVE</td><td class="text-center bold">${check(data,'twoWayValve','normal')}</td><td class="text-center bold">${check(data,'twoWayValve','abnormal')}</td><td class="text-center">${esc(data.remarksTwoWayValve)}</td></tr>
      <tr><td colspan="3" class="airborne-bg-yellow bold">COMPRESSOR CURRENT</td><td>ฉนวนหุ้มท่อน้ำเย็น</td><td class="text-center bold">${check(data,'waterPipeInsulation','normal')}</td><td class="text-center bold">${check(data,'waterPipeInsulation','abnormal')}</td><td class="text-center">${esc(data.remarksWaterPipeInsulation)}</td></tr>
      <tr><td class="airborne-bg-yellow">L 1</td><td class="text-center bold">${esc(data.compL1)}</td><td class="text-center bold">${esc(data.compL1After)}</td><td>ท่อส่งลมเย็น Chiller</td><td class="text-center bold">${check(data,'chillerPipe','normal')}</td><td class="text-center bold">${check(data,'chillerPipe','abnormal')}</td><td class="text-center">${esc(data.remarksChillerPipe)}</td></tr>
      <tr><td class="airborne-bg-yellow">L 2</td><td class="text-center bold">${esc(data.compL2)}</td><td class="text-center bold">${esc(data.compL2After)}</td><td>Board Control คอยล์เย็น</td><td class="text-center bold">${check(data,'boardControlCoilYen','normal')}</td><td class="text-center bold">${check(data,'boardControlCoilYen','abnormal')}</td><td class="text-center">${esc(data.remarksBoardControlCoilYen)}</td></tr>
      <tr><td class="airborne-bg-yellow">L 3</td><td class="text-center bold">${esc(data.compL3)}</td><td class="text-center bold">${esc(data.compL3After)}</td><td>ชุดคอยล์ร้อน Condensing</td><td class="text-center bold">${check(data,'condensingCoil','normal')}</td><td class="text-center bold">${check(data,'condensingCoil','abnormal')}</td><td class="text-center">${esc(data.remarksCondensingCoil)}</td></tr>
      <tr><td class="airborne-bg-yellow"></td><td class="text-center bold"></td><td class="text-center bold"></td><td>แมกเนติก โอเวอร์โหลด</td><td class="text-center bold">${check(data,'magneticOverload','normal')}</td><td class="text-center bold">${check(data,'magneticOverload','abnormal')}</td><td class="text-center">${esc(data.remarksMagneticOverload)}</td></tr>
      <tr><td colspan="3" class="airborne-bg-yellow bold">MOTOR CURRENT (AIR SIDE)</td><td>MOTOR CONDENSING</td><td class="text-center bold">${check(data,'motorCondensing','normal')}</td><td class="text-center bold">${check(data,'motorCondensing','abnormal')}</td><td class="text-center">${esc(data.remarksMotorCondensing)}</td></tr>
      <tr><td class="airborne-bg-yellow">L 1</td><td class="text-center bold">${esc(data.motorAirL1)}</td><td class="text-center bold">${esc(data.motorAirL1After)}</td><td>COMPRESSOR</td><td class="text-center bold">${check(data,'compressorCheck','normal')}</td><td class="text-center bold">${check(data,'compressorCheck','abnormal')}</td><td class="text-center">${esc(data.remarksCompressorCheck)}</td></tr>
      <tr><td class="airborne-bg-yellow">L 2</td><td class="text-center bold">${esc(data.motorAirL2)}</td><td class="text-center bold">${esc(data.motorAirL2After)}</td><td>DISCHARGE PRESSURE (PSIG)</td><td class="text-center bold">${check(data,'dischargePressure','normal')}</td><td class="text-center bold">${check(data,'dischargePressure','abnormal')}</td><td class="text-center">${esc(data.remarksDischargePressure)}</td></tr>
      <tr><td class="airborne-bg-yellow">L 3</td><td class="text-center bold">${esc(data.motorAirL3)}</td><td class="text-center bold">${esc(data.motorAirL3After)}</td><td>SUCTION PRESSURE (PSIG)</td><td class="text-center bold">${check(data,'suctionPressure','normal')}</td><td class="text-center bold">${check(data,'suctionPressure','abnormal')}</td><td class="text-center">${esc(data.remarksSuctionPressure)}</td></tr>
      <tr><td colspan="3" class="airborne-bg-yellow bold"></td><td>SATURATE SUCTION TEMP. (C)</td><td class="text-center bold">${check(data,'saturateSuctionTemp','normal')}</td><td class="text-center bold">${check(data,'saturateSuctionTemp','abnormal')}</td><td class="text-center">${esc(data.remarksSaturateSuctionTemp)}</td></tr>
      <tr><td colspan="3" class="airborne-bg-yellow bold"></td><td>ฉนวนหุ้มท่อสารทำความเย็น</td><td class="text-center bold">${check(data,'refrigerantPipeInsulation','normal')}</td><td class="text-center bold">${check(data,'refrigerantPipeInsulation','abnormal')}</td><td class="text-center">${esc(data.remarksRefrigerantPipeInsulation)}</td></tr>
      <tr><td colspan="3" class="airborne-bg-yellow bold"></td><td>Board Control คอยล์ร้อน</td><td class="text-center bold">${check(data,'boardControlCoilRon','normal')}</td><td class="text-center bold">${check(data,'boardControlCoilRon','abnormal')}</td><td class="text-center">${esc(data.remarksBoardControlCoilRon)}</td></tr>
    </tbody>
  </table>
  <div style="page-break-inside:avoid;">
    <div class="airborne-title-box" style="margin-top:0;">REMARKS</div>
    <div class="airborne-remarks">${esc(data.remarksGeneral)}</div>
    <table class="airborne-footer-table">
      <tbody>
        <tr>
          <td class="airborne-bg-yellow bold" style="width:33.33%">CUSTOMER SIGNATURE</td>
          <td class="airborne-bg-yellow bold" style="width:33.33%">WARD NURSE SIGNATURE</td>
          <td class="airborne-bg-yellow bold" style="width:33.33%">SERVICE SIGNATURE</td>
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
  </div>
</div>
`
}

export const AIRBORNE_REPORT_CSS = `
.airborne-report { font-family: 'Sarabun', sans-serif; font-size: 10px; color: #000; margin: 0; padding: 10px 0; }
.airborne-header-table { width: 100%; border: none; margin-bottom: 5px; }
.airborne-logo-box { width: 50px; height: 50px; border: 1.5px solid #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }
.airborne-company-header { text-align: center; line-height: 1.4; }
.airborne-title-box { background-color: #a4c2f4 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; text-align: center; font-weight: bold; font-size: 12px; padding: 4px; border: 1px solid #000; margin-bottom: -1px; }
.airborne-info-table { width: 100%; border-collapse: collapse; }
.airborne-info-table td { border: 1px solid #000; padding: 4px; background-color: #a4c2f4 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; }
.airborne-info-table td.airborne-data { background-color: #fff !important; font-weight: normal; }
.airborne-main-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.airborne-main-table th { background-color: #a4c2f4 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; border: 1px solid #000; padding: 4px; font-size: 10px; white-space: normal; word-break: keep-all; }
.airborne-main-table td { border: 1px solid #000; padding: 3px 4px; min-height: 18px; vertical-align: top; word-wrap: break-word; white-space: normal; }
.airborne-bg-yellow { background-color: #fff2cc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.airborne-remarks { border: 1px solid #000; border-top: none; padding: 4px; min-height: 60px; white-space: pre-wrap; }
.airborne-footer-table { width: 100%; border-collapse: collapse; margin-top: -1px; }
.airborne-footer-table td { border: 1px solid #000; padding: 4px; text-align: center; }
`
