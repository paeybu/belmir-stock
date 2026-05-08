import { prisma } from '@/lib/prisma'
import { updateLocation } from '@/lib/actions/locations'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const location = await prisma.location.findUnique({ where: { id } })
  if (!location) notFound()

  const update = updateLocation.bind(null, id)

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/locations" className="text-gray-500 hover:text-gray-700 text-sm">← Locations</Link>
        <h1 className="text-2xl font-bold">Edit location</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={update} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input name="name" required defaultValue={location.name} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input name="description" defaultValue={location.description ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 mt-2">
            <Link href="/locations" className="flex-1 text-center border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">Cancel</Link>
            <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}
