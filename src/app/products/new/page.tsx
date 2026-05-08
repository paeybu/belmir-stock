import { createProduct } from '@/lib/actions/products'
import Link from 'next/link'

export default function NewProductPage() {
  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/products" className="text-gray-500 hover:text-gray-700 text-sm">← Products</Link>
        <h1 className="text-2xl font-bold">New product</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={createProduct} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input name="name" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode *</label>
            <input name="barcode" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <input name="unit" defaultValue="each" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Low stock threshold</label>
            <input name="lowStockThreshold" type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 mt-2">
            <Link href="/products" className="flex-1 text-center border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">Cancel</Link>
            <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}
