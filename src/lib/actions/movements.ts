'use server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tx = any

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function applyMovement(data: {
  productId: string
  locationId: string
  change: number
  reason: string
  note?: string
}) {
  const userId = await requireAuth()

  await prisma.$transaction(async (tx: Tx) => {
    await tx.movement.create({
      data: {
        productId: data.productId,
        locationId: data.locationId,
        change: data.change,
        userId,
        reason: data.reason,
        note: data.note ?? null,
      },
    })

    const existing = await tx.stock.findUnique({
      where: { productId_locationId: { productId: data.productId, locationId: data.locationId } },
    })

    const newQty = (existing?.quantity ?? 0) + data.change
    if (newQty < 0) throw new Error('Insufficient stock')

    await tx.stock.upsert({
      where: { productId_locationId: { productId: data.productId, locationId: data.locationId } },
      create: { productId: data.productId, locationId: data.locationId, quantity: newQty },
      update: { quantity: newQty },
    })
  })

  revalidatePath('/')
  revalidatePath('/history')
}

export async function transferStock(data: {
  productId: string
  fromLocationId: string
  toLocationId: string
  quantity: number
  note?: string
}) {
  const userId = await requireAuth()
  const groupId = crypto.randomUUID()

  await prisma.$transaction(async (tx: Tx) => {
    const fromStock = await tx.stock.findUnique({
      where: { productId_locationId: { productId: data.productId, locationId: data.fromLocationId } },
    })
    if ((fromStock?.quantity ?? 0) < data.quantity) throw new Error('Insufficient stock')

    await tx.movement.createMany({
      data: [
        {
          productId: data.productId,
          locationId: data.fromLocationId,
          change: -data.quantity,
          userId,
          reason: 'transfer_out',
          transferGroupId: groupId,
          note: data.note ?? null,
        },
        {
          productId: data.productId,
          locationId: data.toLocationId,
          change: data.quantity,
          userId,
          reason: 'transfer_in',
          transferGroupId: groupId,
          note: data.note ?? null,
        },
      ],
    })

    await tx.stock.update({
      where: { productId_locationId: { productId: data.productId, locationId: data.fromLocationId } },
      data: { quantity: { decrement: data.quantity } },
    })

    await tx.stock.upsert({
      where: { productId_locationId: { productId: data.productId, locationId: data.toLocationId } },
      create: { productId: data.productId, locationId: data.toLocationId, quantity: data.quantity },
      update: { quantity: { increment: data.quantity } },
    })
  })

  revalidatePath('/')
  revalidatePath('/history')
}

export async function stocktakeAdjust(data: {
  productId: string
  locationId: string
  actualQuantity: number
  note?: string
}) {
  const userId = await requireAuth()

  await prisma.$transaction(async (tx: Tx) => {
    const existing = await tx.stock.findUnique({
      where: { productId_locationId: { productId: data.productId, locationId: data.locationId } },
    })
    const currentQty = existing?.quantity ?? 0
    const delta = data.actualQuantity - currentQty
    if (delta === 0) return

    await tx.movement.create({
      data: {
        productId: data.productId,
        locationId: data.locationId,
        change: delta,
        userId,
        reason: 'adjustment',
        note: data.note ?? null,
      },
    })

    await tx.stock.upsert({
      where: { productId_locationId: { productId: data.productId, locationId: data.locationId } },
      create: { productId: data.productId, locationId: data.locationId, quantity: data.actualQuantity },
      update: { quantity: data.actualQuantity },
    })
  })

  revalidatePath('/')
  revalidatePath('/stocktake')
  revalidatePath('/history')
}
