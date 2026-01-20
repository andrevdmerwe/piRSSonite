import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entryId = parseInt(id)

    if (isNaN(entryId)) {
      return NextResponse.json(
        { error: 'Invalid entry ID' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate payload
    const updateData: { isRead?: boolean; isStarred?: boolean } = {}

    if (typeof body.isRead === 'boolean') {
      updateData.isRead = body.isRead
    }

    if (typeof body.isStarred === 'boolean') {
      updateData.isStarred = body.isStarred
    }

    // Validate at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    console.log(`[API] Updating entry ${entryId} with:`, updateData)

    // Update entry in transaction
    const updatedEntry = await prisma.entry.update({
      where: { id: entryId },
      data: updateData,
    })

    console.log(`[API] Entry ${entryId} updated. isRead=${updatedEntry.isRead}`)

    return NextResponse.json(updatedEntry)
  } catch (error: any) {
    // Handle not found error
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      )
    }

    console.error('Entry update error:', error)
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    )
  }
}
