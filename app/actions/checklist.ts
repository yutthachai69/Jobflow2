'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getChecklistTemplates() {
  try {
    const templates = await prisma.checklistTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return { success: true, data: templates }
  } catch (error) {
    console.error('Failed to fetch checklist templates', error)
    return { success: false, error: 'Failed to fetch templates' }
  }
}

export async function createChecklistTemplate(title: string, items: string[]) {
  try {
    const template = await prisma.checklistTemplate.create({
      data: {
        title,
        items: JSON.stringify(items),
      },
    })
    revalidatePath('/admin/checklists')
    return { success: true, data: template }
  } catch (error) {
    console.error('Failed to create checklist template', error)
    return { success: false, error: 'Failed to create template' }
  }
}

export async function updateChecklistTemplate(id: string, title: string, items: string[]) {
  try {
    const template = await prisma.checklistTemplate.update({
      where: { id },
      data: {
        title,
        items: JSON.stringify(items),
      },
    })
    revalidatePath('/admin/checklists')
    return { success: true, data: template }
  } catch (error) {
    console.error('Failed to update checklist template', error)
    return { success: false, error: 'Failed to update template' }
  }
}

export async function deleteChecklistTemplate(id: string) {
  try {
    await prisma.checklistTemplate.delete({
      where: { id },
    })
    revalidatePath('/admin/checklists')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete checklist template', error)
    return { success: false, error: 'Failed to delete template' }
  }
}
