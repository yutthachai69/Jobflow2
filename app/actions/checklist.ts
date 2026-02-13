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
    console.error('Error fetching checklist templates:', error)
    return { success: false, error: 'Failed to fetch templates' }
  }
}

export async function getChecklistTemplate(id: string) {
  try {
    const template = await prisma.checklistTemplate.findUnique({
      where: { id },
    })
    return { success: true, data: template }
  } catch (error) {
    console.error('Error fetching checklist template:', error)
    return { success: false, error: 'Failed to fetch template' }
  }
}

export async function createChecklistTemplate(formData: FormData) {
  try {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const itemsJson = formData.get('items') as string

    if (!title || !itemsJson) {
      return { success: false, error: 'Title and items are required' }
    }

    await prisma.checklistTemplate.create({
      data: {
        title,
        description,
        items: itemsJson,
      },
    })

    revalidatePath('/admin/checklists')
    return { success: true }
  } catch (error) {
    console.error('Error creating checklist template:', error)
    return { success: false, error: 'Failed to create template' }
  }
}

export async function updateChecklistTemplate(id: string, formData: FormData) {
  try {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const itemsJson = formData.get('items') as string

    if (!title || !itemsJson) {
      return { success: false, error: 'Title and items are required' }
    }

    await prisma.checklistTemplate.update({
      where: { id },
      data: {
        title,
        description,
        items: itemsJson,
      },
    })

    revalidatePath('/admin/checklists')
    revalidatePath(`/admin/checklists/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating checklist template:', error)
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
    console.error('Error deleting checklist template:', error)
    return { success: false, error: 'Failed to delete template' }
  }
}
