/**
 * Security test: TECHNICIAN access control
 * Verifies the authorization logic for work order and job item pages.
 */

// Pure logic extracted from page.tsx for unit testing

interface JobItem {
  technicianId: string | null
}

interface WorkOrder {
  jobItems: JobItem[]
  siteId: string
}

/** Mirrors app/work-orders/[id]/page.tsx TECHNICIAN guard */
function technicianCanViewWorkOrder(workOrder: WorkOrder, userId: string): boolean {
  return workOrder.jobItems.some((item) => item.technicianId === userId)
}

/** Mirrors app/technician/job-item/[id]/page.tsx guard */
function technicianCanViewJobItem(technicianId: string | null, userId: string): boolean {
  return technicianId === userId
}

describe('Access Control: TECHNICIAN on work order detail', () => {
  const MY_ID = 'tech-001'
  const OTHER_ID = 'tech-002'

  it('allows access when at least one jobItem is assigned to the technician', () => {
    const workOrder: WorkOrder = {
      siteId: 'site-1',
      jobItems: [
        { technicianId: MY_ID },
        { technicianId: OTHER_ID },
      ],
    }
    expect(technicianCanViewWorkOrder(workOrder, MY_ID)).toBe(true)
  })

  it('denies access when no jobItems are assigned to the technician', () => {
    const workOrder: WorkOrder = {
      siteId: 'site-1',
      jobItems: [{ technicianId: OTHER_ID }],
    }
    expect(technicianCanViewWorkOrder(workOrder, MY_ID)).toBe(false)
  })

  it('denies access when all jobItems are unassigned', () => {
    const workOrder: WorkOrder = {
      siteId: 'site-1',
      jobItems: [{ technicianId: null }, { technicianId: null }],
    }
    expect(technicianCanViewWorkOrder(workOrder, MY_ID)).toBe(false)
  })

  it('denies access when workOrder has no jobItems', () => {
    const workOrder: WorkOrder = { siteId: 'site-1', jobItems: [] }
    expect(technicianCanViewWorkOrder(workOrder, MY_ID)).toBe(false)
  })
})

describe('Access Control: TECHNICIAN on job item detail', () => {
  const MY_ID = 'tech-001'
  const OTHER_ID = 'tech-002'

  it('allows access when jobItem is assigned to the technician', () => {
    expect(technicianCanViewJobItem(MY_ID, MY_ID)).toBe(true)
  })

  it('denies access when jobItem is assigned to another technician', () => {
    expect(technicianCanViewJobItem(OTHER_ID, MY_ID)).toBe(false)
  })

  it('denies access when jobItem is unassigned (null)', () => {
    // Previously: null === null was falsy check — old code allowed this (bug)
    // New behaviour: null !== MY_ID → denied
    expect(technicianCanViewJobItem(null, MY_ID)).toBe(false)
  })
})
