import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOpml } from '@/lib/utils/opmlUtils'

/**
 * GET handler to export all feeds and folders as OPML 2.0 XML
 * Returns downloadable OPML file
 */
export async function GET() {
  try {
    // Fetch all folders with their feeds
    const folders = await prisma.folder.findMany({
      include: { feeds: true },
      orderBy: { order: 'asc' },
    })

    // Fetch all feeds without folder
    const rootFeeds = await prisma.feed.findMany({
      where: { folderId: null },
      orderBy: { order: 'asc' },
    })

    // Generate OPML XML
    const opmlXml = generateOpml(folders, rootFeeds)

    // Generate filename with current date
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const filename = `pirssonite-feeds-${year}-${month}-${day}.opml`

    // Return OPML as downloadable file
    return new NextResponse(opmlXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('OPML export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate OPML' },
      { status: 500 }
    )
  }
}
