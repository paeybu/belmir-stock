import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { archiveProduct, unarchiveProduct } from '@/lib/actions/products'

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
  })
  type Product = (typeof products)[number]

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Stock Control · Catalogue</p>
          <h1 className="h-display text-3xl md:text-[2.6rem] mt-1.5">Products</h1>
        </div>
        <Link href="/products/new" className="btn-signal shrink-0">
          <span aria-hidden>+</span> Add product
        </Link>
      </header>

      {products.length === 0 ? (
        <div className="sheet text-center py-14 px-6">
          <p className="text-muted text-sm">No products yet. Add one, or scan an unknown barcode to create it.</p>
        </div>
      ) : (
        <div className="sheet overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1.4fr_4rem_5rem_5rem_auto] gap-3 px-4 py-2.5 border-b border-line bg-ink/[0.03]">
            <ColHead>Name</ColHead>
            <ColHead>Barcode</ColHead>
            <ColHead>Unit</ColHead>
            <ColHead>Low at</ColHead>
            <ColHead>Status</ColHead>
            <ColHead className="text-right">Actions</ColHead>
          </div>

          <ul className="divide-y divide-line">
            {products.map((p: Product) => (
              <li
                key={p.id}
                className={`grid grid-cols-2 md:grid-cols-[2fr_1.4fr_4rem_5rem_5rem_auto] gap-x-3 gap-y-1.5 items-center px-4 py-3 ${
                  p.archived ? 'opacity-55' : ''
                }`}
              >
                <div className="font-medium text-ink truncate">{p.name}</div>

                <div className="hidden md:block font-mono text-xs text-muted truncate">{p.barcode}</div>
                <div className="hidden md:block font-mono text-xs text-muted">{p.unit}</div>
                <div className="hidden md:block font-mono text-xs text-muted">{p.lowStockThreshold ?? '—'}</div>

                {/* status: top-right on mobile, own column on desktop */}
                <div className="justify-self-end md:justify-self-start">
                  <span className={`stamp ${p.archived ? 'text-muted' : 'text-in'}`}>
                    {p.archived ? 'Archived' : 'Active'}
                  </span>
                </div>

                {/* mobile meta line */}
                <div className="md:hidden col-span-2 font-mono text-[11px] text-muted truncate">
                  {p.barcode} · {p.unit} · low@{p.lowStockThreshold ?? '—'}
                </div>

                <div className="col-span-2 md:col-span-1 flex items-center gap-4 md:justify-end font-mono text-[11px] uppercase tracking-wider">
                  <Link href={`/products/${p.id}/edit`} className="text-transfer hover:underline">Edit</Link>
                  <form action={p.archived ? unarchiveProduct.bind(null, p.id) : archiveProduct.bind(null, p.id)}>
                    <button type="submit" className="text-muted hover:text-out transition-colors">
                      {p.archived ? 'Restore' : 'Archive'}
                    </button>
                  </form>
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
