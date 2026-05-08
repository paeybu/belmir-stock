import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { barcode, name, unit } = await req.json()
  if (!barcode || !name) return Response.json({ error: 'Missing fields' }, { status: 400 })

  try {
    const product = await prisma.product.create({
      data: { barcode, name, unit: unit || 'each' },
    })
    return Response.json({ id: product.id, name: product.name })
  } catch {
    return Response.json({ error: 'Barcode already exists' }, { status: 409 })
  }
}
