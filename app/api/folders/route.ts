import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const folders = await prisma.folder.findMany({
      orderBy: {
        order: 'asc',
      },
    })
    return NextResponse.json(folders)
  } catch (error) {
    console.error('Folders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Check for duplicate name
    const existingFolder = await prisma.folder.findUnique({
      where: { name: trimmedName }
    })

    if (existingFolder) {
      return NextResponse.json(
        { error: 'Folder name already exists' },
        { status: 400 }
      )
    }

    // Get max order for new folder
    const maxOrderFolder = await prisma.folder.findFirst({
      orderBy: { order: 'desc' }
    })
    const newOrder = maxOrderFolder ? maxOrderFolder.order + 1 : 0

    // Create folder
    const folder = await prisma.folder.create({
      data: {
        name: trimmedName,
        order: newOrder,
      },
    })

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error('Folder creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}
