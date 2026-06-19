import { createLocation } from '@/lib/actions/locations'
import Link from 'next/link'

export default function NewLocationPage() {
  return (
    <div className="max-w-lg mx-auto">
      <header className="mb-6">
        <Link href="/locations" className="kicker hover:text-ink transition-colors">← Locations</Link>
        <h1 className="h-display text-3xl mt-1.5">New location</h1>
      </header>
      <div className="sheet p-6">
        <form action={createLocation} className="flex flex-col gap-4">
          <div>
            <label className="field-label">Name *</label>
            <input name="name" required className="field" />
          </div>
          <div>
            <label className="field-label">Description</label>
            <input name="description" className="field" />
          </div>
          <div className="flex gap-3 mt-2">
            <Link href="/locations" className="btn-quiet flex-1">Cancel</Link>
            <button type="submit" className="btn-signal flex-1">Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}
