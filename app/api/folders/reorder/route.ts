import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { folderIds } = body

        if (!Array.isArray(folderIds)) {
            return NextResponse.json(
                { error: 'folderIds must be an array' },
                { status: 400 }
            )
        }

        // specific order updates using transaction
        await prisma.$transaction(
            folderIds.map((id: number, index: number) =>
                prisma.folder.update({
                    where: { id },
                    data: { order: index },
                })
            )
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Folder reorder error:', error)
        return NextResponse.json(
            { error: 'Failed to reorder folders' },
            { status: 500 }
        )
    }
}
