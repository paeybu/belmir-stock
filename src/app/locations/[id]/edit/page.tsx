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
    <div className="max-w-lg mx-auto">
      <header className="mb-6">
        <Link href="/locations" className="kicker hover:text-ink transition-colors">← Locations</Link>
        <h1 className="h-display text-3xl mt-1.5">Edit location</h1>
      </header>
      <div className="sheet p-6">
        <form action={update} className="flex flex-col gap-4">
          <div>
            <label className="field-label">Name *</label>
            <input name="name" required defaultValue={location.name} className="field" />
          </div>
          <div>
            <label className="field-label">Description</label>
            <input name="description" defaultValue={location.description ?? ''} className="field" />
          </div>
          <div className="flex gap-3 mt-2">
            <Link href="/locations" className="btn-quiet flex-1">Cancel</Link>
            <button type="submit" className="btn-signal flex-1">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}
