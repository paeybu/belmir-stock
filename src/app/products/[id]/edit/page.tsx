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
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/products" className="text-gray-500 hover:text-gray-700 text-sm">← Products</Link>
        <h1 className="text-2xl font-bold">Edit product</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={update} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input name="name" required defaultValue={product.name} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode *</label>
            <input name="barcode" required defaultValue={product.barcode} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <input name="unit" defaultValue={product.unit} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Low stock threshold</label>
            <input name="lowStockThreshold" type="number" min="0" defaultValue={product.lowStockThreshold ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" rows={2} defaultValue={product.notes ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 mt-2">
            <Link href="/products" className="flex-1 text-center border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">Cancel</Link>
            <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}
