import { createProduct } from '@/lib/actions/products'
import Link from 'next/link'

export default function NewProductPage() {
  return (
    <div className="max-w-lg mx-auto">
      <header className="mb-6">
        <Link href="/products" className="kicker hover:text-ink transition-colors">← Products</Link>
        <h1 className="h-display text-3xl mt-1.5">New product</h1>
      </header>
      <div className="sheet p-6">
        <form action={createProduct} className="flex flex-col gap-4">
          <div>
            <label className="field-label">Name *</label>
            <input name="name" required className="field" />
          </div>
          <div>
            <label className="field-label">Barcode *</label>
            <input name="barcode" required className="field font-mono" />
          </div>
          <div>
            <label className="field-label">Unit</label>
            <input name="unit" defaultValue="each" className="field" />
          </div>
          <div>
            <label className="field-label">Low stock threshold</label>
            <input name="lowStockThreshold" type="number" min="0" className="field" />
          </div>
          <div>
            <label className="field-label">Notes</label>
            <textarea name="notes" rows={2} className="field" />
          </div>
          <div className="flex gap-3 mt-2">
            <Link href="/products" className="btn-quiet flex-1">Cancel</Link>
            <button type="submit" className="btn-signal flex-1">Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}
