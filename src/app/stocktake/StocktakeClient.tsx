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

  const deltas = items.filter((i) => (counts[i.productId] ?? i.currentQty) !== i.currentQty).length

  if (done) {
    return (
      <div className="sheet border-t-2 border-in text-center py-16 px-6 max-w-lg mx-auto">
        <span className="stamp text-in mx-auto">Reconciled</span>
        <div className="h-display text-2xl mt-4">Stocktake complete</div>
        <p className="text-muted text-sm mt-2">Adjustments written to the ledger.</p>
        <button
          onClick={() => { setDone(false); router.push('/stocktake') }}
          className="btn-quiet mt-6"
        >
          Count another location
        </button>
      </div>
    )
  }

  return (
    <div>
      <header className="mb-6">
        <p className="kicker">Stock Control · Reconcile</p>
        <h1 className="h-display text-3xl md:text-[2.6rem] mt-1.5">Stocktake</h1>
      </header>

      <div className="mb-5 max-w-xs">
        <label className="field-label">Select location</label>
        <select value={selectedLocationId ?? ''} onChange={(e) => selectLocation(e.target.value)} className="field">
          <option value="">— pick a location —</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {selectedLocationId && items.length > 0 && (
        <>
          {deltas > 0 && (
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">
              <span className="text-signal-ink bg-signal px-1.5 py-0.5 rounded-[2px]">{deltas}</span> line
              {deltas === 1 ? '' : 's'} to adjust
            </p>
          )}

          <div className="sheet overflow-hidden mb-4">
            <div className="hidden sm:grid grid-cols-[2fr_5rem_8rem] gap-3 px-4 py-2.5 border-b border-line bg-ink/[0.03]">
              <ColHead>Product</ColHead>
              <ColHead className="text-right">System</ColHead>
              <ColHead className="text-right">Actual count</ColHead>
            </div>

            <ul className="divide-y divide-line">
              {items.map((item) => {
                const actual = counts[item.productId] ?? item.currentQty
                const diff = actual - item.currentQty
                return (
                  <li
                    key={item.productId}
                    className={`grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_5rem_8rem] gap-x-3 gap-y-2 items-center px-4 py-3 ${
                      diff !== 0 ? 'border-l-2 border-signal bg-signal/[0.05]' : 'border-l-2 border-transparent'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-ink truncate">{item.productName}</div>
                      <div className="font-mono text-[11px] text-muted">
                        <span className="sm:hidden">system {item.currentQty} · </span>{item.unit}
                      </div>
                    </div>

                    <div className="hidden sm:block text-right font-mono text-sm text-muted">{item.currentQty}</div>

                    <div className="flex items-center justify-end gap-2">
                      <input
                        type="number"
                        min="0"
                        value={actual}
                        onChange={(e) =>
                          setCounts((prev) => ({ ...prev, [item.productId]: Math.max(0, parseInt(e.target.value) || 0) }))
                        }
                        className="field w-20 text-right font-mono"
                      />
                      <span className={`w-8 text-right font-mono text-xs ${diff > 0 ? 'text-in' : diff < 0 ? 'text-out' : 'text-transparent'}`}>
                        {diff > 0 ? '+' : ''}{diff || '·'}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="mb-4 max-w-md">
            <label className="field-label">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Monthly stocktake"
              className="field"
            />
          </div>

          <button onClick={submit} disabled={isPending} className="btn-signal w-full sm:w-auto">
            {isPending ? 'Submitting…' : 'Submit stocktake'}
          </button>
        </>
      )}

      {selectedLocationId && items.length === 0 && (
        <div className="sheet text-center py-14 px-6">
          <p className="text-muted text-sm">No products to count here yet. Add products first.</p>
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
