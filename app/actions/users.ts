'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from 'bcryptjs'
import { sanitizeString, validateUsername, validatePassword } from "@/lib/validation"
import { requireAdmin } from "@/lib/auth-helpers"
import { handleServerActionError } from "@/lib/error-handler"
import { getCurrentUser } from "@/lib/auth"

export async function createUser(formData: FormData) {
  try {
    await requireAdmin()

    const username = sanitizeString(formData.get('username') as string)
    const password = formData.get('password') as string
    const fullName = sanitizeString(formData.get('fullName') as string)
    const lineUserId = sanitizeString(formData.get('lineUserId') as string)
    const role = formData.get('role') as 'ADMIN' | 'TECHNICIAN' | 'CLIENT'
    const siteId = sanitizeString(formData.get('siteId') as string)

    // Validation
    const usernameValidation = validateUsername(username || '')
    if (!usernameValidation.valid) {
      throw new Error(usernameValidation.error || 'Invalid username')
    }

    const passwordValidation = validatePassword(password || '')
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error || 'Invalid password')
    }

    if (!role || !['ADMIN', 'TECHNICIAN', 'CLIENT'].includes(role)) {
      throw new Error('Invalid role')
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username! },
    })

    if (existingUser) {
      throw new Error('Username already exists')
    }

    // สำหรับ CLIENT role ต้องมี siteId
    if (role === 'CLIENT' && !siteId) {
      throw new Error('Site ID is required for CLIENT role')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    await prisma.user.create({
      data: {
        username: username!,
        password: hashedPassword,
        fullName: fullName || null,
        role,
        siteId: role === 'CLIENT' ? siteId : null,
        lineUserId: lineUserId || null,
      },
    })

    revalidatePath('/users')
    redirect('/users')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
}

export async function updateUser(formData: FormData) {
  try {
    await requireAdmin()

    const userId = sanitizeString(formData.get('userId') as string)
    const username = sanitizeString(formData.get('username') as string)
    const password = formData.get('password') as string
    const fullName = sanitizeString(formData.get('fullName') as string)
    const lineUserId = sanitizeString(formData.get('lineUserId') as string)
    const role = formData.get('role') as 'ADMIN' | 'TECHNICIAN' | 'CLIENT'
    const siteId = sanitizeString(formData.get('siteId') as string)

    if (!userId) {
      throw new Error('User ID is required')
    }

    // Validation
    const usernameValidation = validateUsername(username || '')
    if (!usernameValidation.valid) {
      throw new Error(usernameValidation.error || 'Invalid username')
    }

    // Password is optional when updating (only validate if provided)
    if (password && password.length > 0) {
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.error || 'Invalid password')
      }
    }

    if (!role || !['ADMIN', 'TECHNICIAN', 'CLIENT'].includes(role)) {
      throw new Error('Invalid role')
    }

    // Check if username already exists (excluding current user)
    const existingUser = await prisma.user.findUnique({
      where: { username: username! },
    })

    if (existingUser && existingUser.id !== userId) {
      throw new Error('Username already exists')
    }

    // สำหรับ CLIENT role ต้องมี siteId
    if (role === 'CLIENT' && !siteId) {
      throw new Error('Site ID is required for CLIENT role')
    }

    // Update user
    const updateData: any = {
      username: username!,
      fullName: fullName || null,
      role,
      siteId: role === 'CLIENT' ? siteId : null,
      lineUserId: lineUserId || null,
    }

    // Only update password if provided
    if (password && password.length > 0) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    revalidatePath('/users')
    redirect('/users')
  } catch (error) {
    await handleServerActionError(error, await getCurrentUser().catch(() => null))
    throw error
  }
}
