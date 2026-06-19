import { prisma } from '@/lib/prisma'
import { archiveLocation } from '@/lib/actions/locations'
import Link from 'next/link'

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } })
  type Loc = (typeof locations)[number]

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Stock Control · Sites</p>
          <h1 className="h-display text-3xl md:text-[2.6rem] mt-1.5">Locations</h1>
        </div>
        <Link href="/locations/new" className="btn-signal shrink-0">
          <span aria-hidden>+</span> Add location
        </Link>
      </header>

      {locations.length === 0 ? (
        <div className="sheet text-center py-14 px-6">
          <p className="text-muted text-sm">No locations yet. Add a shelf, room, or van to track stock against.</p>
        </div>
      ) : (
        <div className="sheet overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.4fr_2fr_5rem_auto] gap-3 px-4 py-2.5 border-b border-line bg-ink/[0.03]">
            <ColHead>Name</ColHead>
            <ColHead>Description</ColHead>
            <ColHead>Status</ColHead>
            <ColHead className="text-right">Actions</ColHead>
          </div>

          <ul className="divide-y divide-line">
            {locations.map((l: Loc) => (
              <li
                key={l.id}
                className={`grid grid-cols-2 md:grid-cols-[1.4fr_2fr_5rem_auto] gap-x-3 gap-y-1.5 items-center px-4 py-3 ${
                  l.archived ? 'opacity-55' : ''
                }`}
              >
                <div className="font-medium text-ink truncate">{l.name}</div>

                <div className="hidden md:block text-sm text-muted truncate">{l.description ?? '—'}</div>

                <div className="justify-self-end md:justify-self-start">
                  <span className={`stamp ${l.archived ? 'text-muted' : 'text-in'}`}>
                    {l.archived ? 'Archived' : 'Active'}
                  </span>
                </div>

                {l.description && (
                  <div className="md:hidden col-span-2 text-[13px] text-muted truncate">{l.description}</div>
                )}

                <div className="col-span-2 md:col-span-1 flex items-center gap-4 md:justify-end font-mono text-[11px] uppercase tracking-wider">
                  <Link href={`/locations/${l.id}/edit`} className="text-transfer hover:underline">Edit</Link>
                  {!l.archived && (
                    <form action={archiveLocation.bind(null, l.id)}>
                      <button type="submit" className="text-muted hover:text-out transition-colors">Archive</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ColHead({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.14em] text-muted ${className}`}>
      {children}
    </span>
  )
}
