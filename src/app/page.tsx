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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Stock Dashboard</h1>
        <Link href="/scan" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          Scan
        </Link>
      </div>

      <form className="flex gap-2 mb-4">
        <input
          name="q"
          defaultValue={q as string}
          placeholder="Search products..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="location"
          defaultValue={locationFilter as string}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All locations</option>
          {locations.map((l: Loc) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <button type="submit" className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-200">
          Filter
        </button>
      </form>

      {stock.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No stock entries found.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium text-right">Quantity</th>
                <th className="px-4 py-3 font-medium">Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stock.map((s: StockItem) => {
                const isLow = s.product.lowStockThreshold != null && s.quantity <= s.product.lowStockThreshold
                return (
                  <tr key={`${s.productId}-${s.locationId}`} className={isLow ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.product.name}</div>
                      <div className="text-xs text-gray-400">{s.product.barcode}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.location.name}</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                      {s.quantity}
                      {isLow && <span className="ml-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Low</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.product.unit}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
