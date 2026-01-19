import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const folderId = parseInt(id)

    if (isNaN(folderId)) {
      return NextResponse.json(
        { error: 'Invalid folder ID' },
        { status: 400 }
      )
    }

    // Check if folder exists
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    })

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      )
    }

    // Move all feeds in this folder to root
    await prisma.feed.updateMany({
      where: { folderId },
      data: { folderId: null }
    })

    // Delete folder
    await prisma.folder.delete({
      where: { id: folderId }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Folder deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const folderId = parseInt(id)

    if (isNaN(folderId)) {
      return NextResponse.json(
        { error: 'Invalid folder ID' },
        { status: 400 }
      )
    }

    // Check if folder exists
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    })

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name } = body

    // Validate name
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      )
    }

    // Trim whitespace
    const trimmedName = name.trim()

    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: 'Folder name cannot be empty' },
        { status: 400 }
      )
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: 'Folder name must be 100 characters or less' },
        { status: 400 }
      )
    }

    // Check for duplicate name (excluding current folder)
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: trimmedName,
        id: { not: folderId }
      }
    })

    if (existingFolder) {
      return NextResponse.json(
        { error: 'Folder name already exists' },
        { status: 400 }
      )
    }

    // Update folder
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: { name: trimmedName }
    })

    return NextResponse.json(updatedFolder)
  } catch (error) {
    console.error('Folder update error:', error)
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 }
    )
  }
}
