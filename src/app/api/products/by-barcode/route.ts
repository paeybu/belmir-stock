import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const barcode = req.nextUrl.searchParams.get('barcode')
  const locationId = req.nextUrl.searchParams.get('locationId')
  if (!barcode) return Response.json({ error: 'Missing barcode' }, { status: 400 })

  const product = await prisma.product.findUnique({
    where: { barcode, archived: false },
  })

  if (!product) return Response.json({ found: false })

  const stock = locationId
    ? await prisma.stock.findUnique({
        where: { productId_locationId: { productId: product.id, locationId } },
      })
    : null

  return Response.json({
    found: true,
    product: {
      id: product.id,
      name: product.name,
      unit: product.unit,
      currentQty: stock?.quantity ?? 0,
    },
  })
}
