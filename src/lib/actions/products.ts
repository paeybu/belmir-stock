'use server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function createProduct(formData: FormData) {
  await requireAuth()
  const barcode = formData.get('barcode') as string
  const name = formData.get('name') as string
  const unit = (formData.get('unit') as string) || 'each'
  const lowStockThreshold = formData.get('lowStockThreshold')
    ? parseInt(formData.get('lowStockThreshold') as string)
    : null
  const notes = (formData.get('notes') as string) || null

  await prisma.product.create({
    data: { barcode, name, unit, lowStockThreshold, notes },
  })
  revalidatePath('/products')
  redirect('/products')
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAuth()
  const barcode = formData.get('barcode') as string
  const name = formData.get('name') as string
  const unit = (formData.get('unit') as string) || 'each'
  const lowStockThreshold = formData.get('lowStockThreshold')
    ? parseInt(formData.get('lowStockThreshold') as string)
    : null
  const notes = (formData.get('notes') as string) || null

  await prisma.product.update({
    where: { id },
    data: { barcode, name, unit, lowStockThreshold, notes },
  })
  revalidatePath('/products')
  redirect('/products')
}

export async function archiveProduct(id: string) {
  await requireAuth()
  await prisma.product.update({ where: { id }, data: { archived: true } })
  revalidatePath('/products')
}

export async function unarchiveProduct(id: string) {
  await requireAuth()
  await prisma.product.update({ where: { id }, data: { archived: false } })
  revalidatePath('/products')
}
