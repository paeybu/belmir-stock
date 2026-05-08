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
      <h1 className="text-2xl font-bold mb-6">Movement History</h1>

      <form className="flex flex-wrap gap-2 mb-4">
        <select name="product" defaultValue={productFilter as string} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All products</option>
          {products.map((p: Product) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select name="location" defaultValue={locationFilter as string} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All locations</option>
          {locations.map((l: Location) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select name="reason" defaultValue={reasonFilter as string} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All reasons</option>
          {['received', 'sale', 'transfer_in', 'transfer_out', 'damaged', 'return', 'adjustment'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button type="submit" className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-200">Filter</button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Change</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {movements.map((m: Movement) => (
              <tr key={m.id}>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {format(m.createdAt, 'dd MMM yyyy HH:mm')}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{m.product.name}</td>
                <td className="px-4 py-3 text-gray-600">{m.location.name}</td>
                <td className={`px-4 py-3 font-mono font-semibold ${m.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {m.change > 0 ? '+' : ''}{m.change}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{m.reason ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{m.user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {movements.length === 0 && (
          <p className="text-gray-500 text-center py-12">No movements found.</p>
        )}
      </div>
    </div>
  )
}
