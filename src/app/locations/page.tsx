import { prisma } from '@/lib/prisma'
import { archiveLocation } from '@/lib/actions/locations'
import Link from 'next/link'

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } })
  type Loc = (typeof locations)[number]
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Locations</h1>
        <Link href="/locations/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          Add location
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {locations.map((l: Loc) => (
              <tr key={l.id} className={l.archived ? 'opacity-50' : ''}>
                <td className="px-4 py-3 font-medium text-gray-900">{l.name}</td>
                <td className="px-4 py-3 text-gray-500">{l.description ?? '—'}</td>
                <td className="px-4 py-3">
                  {l.archived ? (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Archived</span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/locations/${l.id}/edit`} className="text-blue-600 hover:underline mr-3 text-xs">Edit</Link>
                  {!l.archived && (
                    <form action={archiveLocation.bind(null, l.id)} className="inline">
                      <button type="submit" className="text-gray-500 hover:text-gray-700 text-xs">Archive</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {locations.length === 0 && (
          <p className="text-gray-500 text-center py-12">No locations yet.</p>
        )}
      </div>
    </div>
  )
}
