import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { feedIds } = body

        if (!Array.isArray(feedIds)) {
            return NextResponse.json(
                { error: 'feedIds must be an array' },
                { status: 400 }
            )
        }

        // specific order updates using transaction
        await prisma.$transaction(
            feedIds.map((id: number, index: number) =>
                prisma.feed.update({
                    where: { id },
                    data: { order: index },
                })
            )
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Feed reorder error:', error)
        return NextResponse.json(
            { error: 'Failed to reorder feeds' },
            { status: 500 }
        )
    }
}
