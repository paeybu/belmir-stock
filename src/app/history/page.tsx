import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export default async function HistoryPage(props: {
  searchParams: Promise<{ product?: string; location?: string; reason?: string }>
}) {
  const { product: productFilter, location: locationFilter, reason: reasonFilter } = (await props.searchParams) ?? {}

  const products = await prisma.product.findMany({ orderBy: { name: 'asc' } })
  const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } })

  const movements = await prisma.movement.findMany({
    where: {
      ...(productFilter ? { productId: productFilter as string } : {}),
      ...(locationFilter ? { locationId: locationFilter as string } : {}),
      ...(reasonFilter ? { reason: reasonFilter as string } : {}),
    },
    include: { product: true, location: true, user: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  type Product = (typeof products)[number]
  type Location = (typeof locations)[number]
  type Movement = (typeof movements)[number]

  return (
    <div>
      <header className="mb-6">
        <p className="kicker">Stock Control · Ledger</p>
        <h1 className="h-display text-3xl md:text-[2.6rem] mt-1.5">Movement history</h1>
      </header>

      <form className="flex flex-wrap gap-2 mb-4">
        <select name="product" defaultValue={productFilter as string} className="field w-auto">
          <option value="">All products</option>
          {products.map((p: Product) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select name="location" defaultValue={locationFilter as string} className="field w-auto">
          <option value="">All locations</option>
          {locations.map((l: Location) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select name="reason" defaultValue={reasonFilter as string} className="field w-auto">
          <option value="">All reasons</option>
          {['received', 'sale', 'transfer_in', 'transfer_out', 'damaged', 'return', 'adjustment'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button type="submit" className="btn-quiet">Filter</button>
      </form>

      {movements.length === 0 ? (
        <div className="sheet text-center py-14 px-6">
          <p className="text-muted text-sm">No movements logged for this filter.</p>
        </div>
      ) : (
        <div className="sheet overflow-hidden">
          <div className="hidden md:grid grid-cols-[8.5rem_2fr_1.2fr_4.5rem_1.1fr_1.4fr] gap-3 px-4 py-2.5 border-b border-line bg-ink/[0.03]">
            <ColHead>When</ColHead>
            <ColHead>Product</ColHead>
            <ColHead>Location</ColHead>
            <ColHead className="text-right">Change</ColHead>
            <ColHead>Reason</ColHead>
            <ColHead>User</ColHead>
          </div>

          <ul className="divide-y divide-line">
            {movements.map((m: Movement) => {
              const up = m.change > 0
              return (
                <li
                  key={m.id}
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[8.5rem_2fr_1.2fr_4.5rem_1.1fr_1.4fr] gap-x-3 gap-y-1 items-center px-4 py-3"
                >
                  <div className="hidden md:block font-mono text-xs text-muted whitespace-nowrap">
                    {format(m.createdAt, 'dd MMM HH:mm')}
                  </div>

                  <div className="font-medium text-ink truncate">{m.product.name}</div>

                  <div className="hidden md:block text-sm text-muted truncate">{m.location.name}</div>

                  <div className={`text-right font-mono font-semibold ${up ? 'text-in' : 'text-out'}`}>
                    {up ? '+' : ''}{m.change}
                  </div>

                  <div className="hidden md:block font-mono text-[11px] text-muted truncate">{m.reason ?? '—'}</div>
                  <div className="hidden md:block font-mono text-[11px] text-muted truncate">{m.user.email}</div>

                  {/* mobile meta line */}
                  <div className="md:hidden col-span-2 font-mono text-[10px] uppercase tracking-wider text-muted truncate">
                    {format(m.createdAt, 'dd MMM HH:mm')} · {m.location.name} · {m.reason ?? '—'}
                  </div>
                </li>
              )
            })}
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
