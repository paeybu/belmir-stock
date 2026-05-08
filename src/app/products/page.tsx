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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/products/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          Add product
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Barcode</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Low stock at</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p: Product) => (
              <tr key={p.id} className={p.archived ? 'opacity-50' : ''}>
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 font-mono text-gray-500 text-xs">{p.barcode}</td>
                <td className="px-4 py-3 text-gray-600">{p.unit}</td>
                <td className="px-4 py-3 text-gray-600">{p.lowStockThreshold ?? '—'}</td>
                <td className="px-4 py-3">
                  {p.archived ? (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Archived</span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/products/${p.id}/edit`} className="text-blue-600 hover:underline mr-3 text-xs">Edit</Link>
                  <form action={p.archived ? unarchiveProduct.bind(null, p.id) : archiveProduct.bind(null, p.id)} className="inline">
                    <button type="submit" className="text-gray-500 hover:text-gray-700 text-xs">
                      {p.archived ? 'Restore' : 'Archive'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="text-gray-500 text-center py-12">No products yet.</p>
        )}
      </div>
    </div>
  )
}
