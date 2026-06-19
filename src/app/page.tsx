import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function DashboardPage(props: PageProps<'/'>) {
  const { location: locationFilter, q } = (await props.searchParams) ?? {}

  const locations = await prisma.location.findMany({
    where: { archived: false },
    orderBy: { name: 'asc' },
  })

  const stock = await prisma.stock.findMany({
    where: {
      ...(locationFilter ? { locationId: locationFilter as string } : {}),
      product: {
        archived: false,
        ...(q ? { name: { contains: q as string, mode: 'insensitive' } } : {}),
      },
    },
    include: { product: true, location: true },
    orderBy: [{ location: { name: 'asc' } }, { product: { name: 'asc' } }],
  })

  type Loc = (typeof locations)[number]
  type StockItem = (typeof stock)[number]

  const isLow = (s: StockItem) =>
    s.product.lowStockThreshold != null && s.quantity <= s.product.lowStockThreshold
  const lowCount = stock.filter(isLow).length

  return (
    <div>
      {/* ── Document head ─────────────────────────────────────────────── */}
      <header className="mb-6">
        <p className="kicker">Stock Control · Manifest</p>
        <div className="mt-1.5 flex items-end justify-between gap-4">
          <h1 className="h-display text-3xl md:text-[2.6rem]">Stock on hand</h1>
          <Link href="/scan" className="btn-signal hidden sm:inline-flex">
            <span aria-hidden>+</span> Scan
          </Link>
        </div>

        {/* Ledger summary strip — counts in mono, not gradient cards */}
        <dl className="mt-4 sheet grid grid-cols-3 divide-x divide-line">
          <SummaryCell label="Line items" value={stock.length} />
          <SummaryCell label="Locations" value={locations.length} />
          <SummaryCell label="Low stock" value={lowCount} alert={lowCount > 0} />
        </dl>
      </header>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <form className="flex flex-wrap gap-2 mb-4">
        <input
          name="q"
          defaultValue={q as string}
          placeholder="Search products…"
          className="field flex-1 min-w-[8rem]"
        />
        <select name="location" defaultValue={locationFilter as string} className="field w-auto">
          <option value="">All locations</option>
          {locations.map((l: Loc) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <button type="submit" className="btn-quiet">Filter</button>
      </form>

      {/* ── Count-sheet ───────────────────────────────────────────────── */}
      {stock.length === 0 ? (
        <Empty>No stock recorded yet. Scan an item in to start the manifest.</Empty>
      ) : (
        <div className="sheet overflow-hidden">
          {/* desktop column header */}
          <div className="hidden md:grid grid-cols-[2.2fr_1.3fr_auto_4rem] gap-3 px-4 py-2.5 border-b border-line bg-ink/[0.03]">
            <ColHead>Product</ColHead>
            <ColHead>Location</ColHead>
            <ColHead className="text-right">Qty</ColHead>
            <ColHead>Unit</ColHead>
          </div>

          <ul className="divide-y divide-line">
            {stock.map((s: StockItem) => {
              const low = isLow(s)
              return (
                <li
                  key={`${s.productId}-${s.locationId}`}
                  className={`grid grid-cols-[1fr_auto] md:grid-cols-[2.2fr_1.3fr_auto_4rem] gap-x-3 gap-y-1 items-center px-4 py-3 ${
                    low ? 'border-l-2 border-out bg-out/[0.04]' : 'border-l-2 border-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-ink truncate">{s.product.name}</div>
                    <div className="font-mono text-[11px] text-muted truncate">{s.product.barcode}</div>
                  </div>

                  {/* location: chip on mobile (under name col), plain on desktop */}
                  <div className="hidden md:block text-sm text-muted truncate">{s.location.name}</div>

                  <div className="flex items-center justify-end gap-2">
                    {low && <span className="stamp text-out hidden md:inline-flex">Low</span>}
                    <span className={`font-mono text-lg font-semibold ${low ? 'text-out' : 'text-ink'}`}>
                      {s.quantity}
                    </span>
                  </div>

                  <div className="hidden md:block font-mono text-xs text-muted">{s.product.unit}</div>

                  {/* mobile-only meta line */}
                  <div className="md:hidden col-span-2 flex items-center gap-2 -mt-0.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      {s.location.name} · {s.product.unit}
                    </span>
                    {low && <span className="stamp text-out">Low</span>}
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

function SummaryCell({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="px-4 py-3">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className={`font-mono text-2xl font-semibold mt-0.5 ${alert ? 'text-out' : 'text-ink'}`}>
        {value}
      </dd>
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="sheet text-center py-14 px-6">
      <p className="text-muted text-sm">{children}</p>
    </div>
  )
}
