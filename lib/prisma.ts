import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

// Keep one client per process. Next.js bundles instrumentation.ts (the refresh
// scheduler) separately from the route handlers, so without this production
// would open two clients against the same SQLite file.
globalForPrisma.prisma = prisma
