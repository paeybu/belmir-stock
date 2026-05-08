import { prisma } from '@/lib/prisma'
import ScannerClient from './ScannerClient'

export default async function ScanPage() {
  const locations = await prisma.location.findMany({
    where: { archived: false },
    orderBy: { name: 'asc' },
  })
  return <ScannerClient locations={locations} />
}
