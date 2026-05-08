'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { stocktakeAdjust } from '@/lib/actions/movements'

type Location = { id: string; name: string }
type Item = { productId: string; productName: string; unit: string; currentQty: number }

export default function StocktakeClient({
  locations,
  selectedLocationId,
  items,
}: {
  locations: Location[]
  selectedLocationId?: string
  items: Item[]
}) {
  const router = useRouter()
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((i) => [i.productId, i.currentQty]))
  )
  const [note, setNote] = useState('')
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function selectLocation(id: string) {
    router.push(`/stocktake?locationId=${id}`)
  }

  function submit() {
    if (!selectedLocationId) return
    startTransition(async () => {
      for (const item of items) {
        const actual = counts[item.productId] ?? item.currentQty
        if (actual !== item.currentQty) {
          await stocktakeAdjust({
            productId: item.productId,
            locationId: selectedLocationId,
            actualQuantity: actual,
            note: note || undefined,
          })
        }
      }
      setDone(true)
    })
  }

  if (done) {
    return (
      <div className="text-center py-16">
        <div className="text-3xl mb-3">&#10003;</div>
        <div className="text-lg font-medium mb-4">Stocktake complete</div>
        <button onClick={() => { setDone(false); router.push('/stocktake') }} className="text-blue-600 hover:underline text-sm">
          Do another location
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Stocktake</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select location</label>
        <select
          value={selectedLocationId ?? ''}
          onChange={(e) => selectLocation(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— pick a location —</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {selectedLocationId && items.length > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium text-right">System qty</th>
                  <th className="px-4 py-3 font-medium text-right">Actual count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => {
                  const actual = counts[item.productId] ?? item.currentQty
                  const diff = actual - item.currentQty
                  return (
                    <tr key={item.productId} className={diff !== 0 ? 'bg-amber-50' : ''}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.productName}</div>
                        <div className="text-xs text-gray-400">{item.unit}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 font-mono">{item.currentQty}</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={actual}
                          onChange={(e) => setCounts((prev) => ({ ...prev, [item.productId]: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {diff !== 0 && (
                          <span className={`ml-2 text-xs ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Monthly stocktake"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={submit}
            disabled={isPending}
            className="w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Submitting…' : 'Submit stocktake'}
          </button>
        </>
      )}

      {selectedLocationId && items.length === 0 && (
        <p className="text-gray-500 text-center py-12">No products to count. Add products first.</p>
      )}
    </div>
  )
}
