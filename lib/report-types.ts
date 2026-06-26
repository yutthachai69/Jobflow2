export const REPORT_FORM_TYPES = [
  {
    value: 'AIRBORNE_INFECTION',
    label: '🏥 Clean Room & Airborne Infection Report',
  },
  {
    value: 'EXHAUST_FAN',
    label: '🌀 Exhaust Fan Type Report',
  },
] as const

export type ReportFormType = (typeof REPORT_FORM_TYPES)[number]['value']
