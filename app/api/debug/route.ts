import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const unreadEntries = await prisma.entry.findMany({
            where: { isRead: false },
            select: {
                id: true,
                title: true,
                isRead: true,
                feedId: true,
                feed: {
                    select: {
                        title: true
                    }
                },
                published: true
            },
            orderBy: {
                published: 'desc'
            }
        })
        return NextResponse.json({
            count: unreadEntries.length,
            entries: unreadEntries
        })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
