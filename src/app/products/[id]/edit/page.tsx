import { prisma } from '@/lib/prisma'
import { updateProduct } from '@/lib/actions/products'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) notFound()

  const update = updateProduct.bind(null, id)

  return (
    <div className="max-w-lg mx-auto">
      <header className="mb-6">
        <Link href="/products" className="kicker hover:text-ink transition-colors">← Products</Link>
        <h1 className="h-display text-3xl mt-1.5">Edit product</h1>
      </header>
      <div className="sheet p-6">
        <form action={update} className="flex flex-col gap-4">
          <div>
            <label className="field-label">Name *</label>
            <input name="name" required defaultValue={product.name} className="field" />
          </div>
          <div>
            <label className="field-label">Barcode *</label>
            <input name="barcode" required defaultValue={product.barcode} className="field font-mono" />
          </div>
          <div>
            <label className="field-label">Unit</label>
            <input name="unit" defaultValue={product.unit} className="field" />
          </div>
          <div>
            <label className="field-label">Low stock threshold</label>
            <input name="lowStockThreshold" type="number" min="0" defaultValue={product.lowStockThreshold ?? ''} className="field" />
          </div>
          <div>
            <label className="field-label">Notes</label>
            <textarea name="notes" rows={2} defaultValue={product.notes ?? ''} className="field" />
          </div>
          <div className="flex gap-3 mt-2">
            <Link href="/products" className="btn-quiet flex-1">Cancel</Link>
            <button type="submit" className="btn-signal flex-1">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}
