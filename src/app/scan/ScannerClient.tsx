'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Scanner, type IDetectedBarcode, type IScannerError } from '@yudiel/react-qr-scanner'
import { applyMovement, transferStock } from '@/lib/actions/movements'

type Location = { id: string; name: string }
type ProductResult = { id: string; name: string; unit: string; currentQty: number } | null

type Mode = 'in' | 'out' | 'transfer'

const LOCATION_KEY = 'belmir_last_location'

// Each mode is color-coded so it's unmistakable which one is active. The same
// color drives the active tab, the banner, the card border and the submit button.
// Class strings are written out in full (no interpolated color names) so Tailwind
// v4's static scanner picks them up.
const MODE_CONFIG: Record<Mode, {
  label: string
  verb: string
  description: string
  icon: string
  tab: string
  badge: string
  banner: string
  cardBorder: string
  button: string
}> = {
  in: {
    label: 'Stock In',
    verb: 'Stock in',
    description: 'Adding stock to a location',
    icon: '↓',
    tab: 'bg-emerald-600 text-white shadow',
    badge: 'bg-emerald-600',
    banner: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    cardBorder: 'border-emerald-300',
    button: 'bg-emerald-600 hover:bg-emerald-700',
  },
  out: {
    label: 'Take Out',
    verb: 'Take out',
    description: 'Removing stock from a location',
    icon: '↑',
    tab: 'bg-rose-600 text-white shadow',
    badge: 'bg-rose-600',
    banner: 'bg-rose-50 border-rose-200 text-rose-800',
    cardBorder: 'border-rose-300',
    button: 'bg-rose-600 hover:bg-rose-700',
  },
  transfer: {
    label: 'Transfer',
    verb: 'Transfer',
    description: 'Moving stock between locations',
    icon: '⇄',
    tab: 'bg-indigo-600 text-white shadow',
    badge: 'bg-indigo-600',
    banner: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    cardBorder: 'border-indigo-300',
    button: 'bg-indigo-600 hover:bg-indigo-700',
  },
}

export default function ScannerClient({ locations }: { locations: Location[] }) {
  // Read inside the scan handler so it always uses the current location and won't
  // re-fire on a barcode we're already handling, regardless of render timing.
  const lastScannedRef = useRef<string | null>(null)
  const locationIdRef = useRef('')
  const [locationId, setLocationId] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(LOCATION_KEY) ?? locations[0]?.id ?? ''
    return locations[0]?.id ?? ''
  })
  const [toLocationId, setToLocationId] = useState(locations[1]?.id ?? locations[0]?.id ?? '')
  const [mode, setMode] = useState<Mode>('in')
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null)
  const [product, setProduct] = useState<ProductResult>(null)
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newProductUnit, setNewProductUnit] = useState('each')

  useEffect(() => {
    locationIdRef.current = locationId
    if (locationId) localStorage.setItem(LOCATION_KEY, locationId)
  }, [locationId])

  async function handleScan(detected: IDetectedBarcode[]) {
    const decodedText = detected[0]?.rawValue
    if (!decodedText || lastScannedRef.current === decodedText) return
    lastScannedRef.current = decodedText
    setStatus(null)
    setShowNewProduct(false)
    setQuantity(1)
    setNote('')
    setScannedBarcode(decodedText)

    const res = await fetch(`/api/products/by-barcode?barcode=${encodeURIComponent(decodedText)}&locationId=${locationIdRef.current}`)
    if (res.ok) {
      const data = await res.json()
      if (data.found) {
        setProduct(data.product)
        setShowNewProduct(false)
      } else {
        setProduct(null)
        setShowNewProduct(true)
        setNewProductName('')
      }
    }
  }

  function handleScanError(error: IScannerError) {
    const friendly: Partial<Record<IScannerError['kind'], string>> = {
      'permission-denied': 'Camera permission denied — allow camera access in your browser settings, then reload.',
      'no-camera': 'No camera found on this device.',
      'in-use': 'The camera is in use by another app. Close it and try again.',
      'insecure-context': 'Camera requires a secure (HTTPS) connection.',
      unsupported: 'This browser can’t access the camera for scanning.',
    }
    setStatus(`Error: ${friendly[error.kind] ?? error.message}`)
  }

  function reset() {
    lastScannedRef.current = null
    setScannedBarcode(null)
    setProduct(null)
    setQuantity(1)
    setNote('')
    setShowNewProduct(false)
    setStatus(null)
  }

  function submit() {
    if (!product || !locationId) return
    startTransition(async () => {
      try {
        if (mode === 'transfer') {
          await transferStock({
            productId: product.id,
            fromLocationId: locationId,
            toLocationId,
            quantity,
            note: note || undefined,
          })
          setStatus(`Transferred ${quantity} ${product.unit} of ${product.name}`)
        } else {
          await applyMovement({
            productId: product.id,
            locationId,
            change: mode === 'in' ? quantity : -quantity,
            reason: mode === 'in' ? 'received' : 'sale',
            note: note || undefined,
          })
          setStatus(`${mode === 'in' ? 'Stocked in' : 'Took out'} ${quantity} ${product.unit} of ${product.name}`)
        }
        reset()
      } catch (e: unknown) {
        setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    })
  }

  async function createAndSubmit() {
    if (!scannedBarcode || !newProductName || !locationId) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode: scannedBarcode, name: newProductName, unit: newProductUnit }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        await applyMovement({
          productId: data.id,
          locationId,
          change: quantity,
          reason: 'received',
          note: note || undefined,
        })
        setStatus(`Created and stocked in ${quantity} of ${newProductName}`)
        reset()
      } catch (e: unknown) {
        setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    })
  }

  const cfg = MODE_CONFIG[mode]

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Scanner</h1>

      {/* Controls */}
      <div className={`bg-white rounded-xl border-2 ${cfg.cardBorder} p-4 mb-4 flex flex-col gap-3 transition-colors`}>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['in', 'out', 'transfer'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                mode === m ? MODE_CONFIG[m].tab : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {MODE_CONFIG[m].label}
            </button>
          ))}
        </div>

        {/* Active mode banner — makes the current mode unmistakable */}
        <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${cfg.banner}`}>
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${cfg.badge}`}>
            {cfg.icon}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold uppercase tracking-wide leading-tight">{cfg.label}</div>
            <div className="text-xs opacity-80 leading-tight">{cfg.description}</div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {mode === 'transfer' ? 'From location' : 'Location'}
          </label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {mode === 'transfer' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To location</label>
            <select
              value={toLocationId}
              onChange={(e) => setToLocationId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {locations.filter((l) => l.id !== locationId).map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Status message */}
      {status && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${status.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {status}
        </div>
      )}

      {/* Scanner */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <Scanner
          onScan={handleScan}
          onError={handleScanError}
          paused={!!scannedBarcode}
          formats={['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']}
          constraints={{ facingMode: 'environment' }}
          allowMultiple
          scanDelay={400}
          components={{ finder: true, torch: true }}
          styles={{ container: { width: '100%' }, video: { width: '100%' } }}
        />
      </div>

      {/* Product found */}
      {product && scannedBarcode && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="mb-3">
            <div className="font-medium text-gray-900">{product.name}</div>
            <div className="text-xs text-gray-400">{scannedBarcode}</div>
            <div className="text-sm text-gray-600 mt-1">
              Current stock at selected location: <strong>{product.currentQty} {product.unit}</strong>
            </div>
          </div>

          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={isPending}
              className={`flex-1 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 ${cfg.button}`}
            >
              {isPending ? 'Saving…' : cfg.verb}
            </button>
          </div>
        </div>
      )}

      {/* Unknown barcode — new product form */}
      {showNewProduct && scannedBarcode && (
        <div className="bg-white rounded-xl border border-amber-200 p-4">
          <div className="text-sm font-medium text-amber-700 mb-3">Unknown barcode: {scannedBarcode}</div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Product name *</label>
              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
              <input
                type="text"
                value={newProductUnit}
                onChange={(e) => setNewProductUnit(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={reset} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={createAndSubmit}
                disabled={isPending || !newProductName}
                className="flex-1 bg-amber-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
              >
                {isPending ? 'Creating…' : 'Create & stock in'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
