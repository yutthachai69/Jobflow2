
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
    try {
        // 1. Check if admin exists
        const existingAdmin = await prisma.user.findUnique({
            where: { username: 'admin' }
        })

        if (existingAdmin) {
            return NextResponse.json({
                success: true,
                message: 'Admin user already exists. You can login with "admin" and your password.',
                user: {
                    id: existingAdmin.id,
                    username: existingAdmin.username,
                    role: existingAdmin.role
                }
            })
        }

        // 2. Create Admin if not exists
        const hashedPassword = await bcrypt.hash('admin123', 10)

        const newAdmin = await prisma.user.create({
            data: {
                username: 'admin',
                password: hashedPassword,
                fullName: 'ผู้ดูแลระบบ (Emergency Setup)',
                role: 'ADMIN',
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Admin user created successfully! Please login with: admin / admin123',
            user: {
                id: newAdmin.id,
                username: newAdmin.username,
                role: newAdmin.role
            }
        })

    } catch (error: any) {
        console.error('Setup Admin Error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Unknown error occurred'
        }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}
