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

export async function createLocation(formData: FormData) {
  await requireAuth()
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null
  await prisma.location.create({ data: { name, description } })
  revalidatePath('/locations')
  redirect('/locations')
}

export async function updateLocation(id: string, formData: FormData) {
  await requireAuth()
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null
  await prisma.location.update({ where: { id }, data: { name, description } })
  revalidatePath('/locations')
  redirect('/locations')
}

export async function archiveLocation(id: string) {
  await requireAuth()
  await prisma.location.update({ where: { id }, data: { archived: true } })
  revalidatePath('/locations')
}
