'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { applyMovement, transferStock } from '@/lib/actions/movements'

type Location = { id: string; name: string }
type ProductResult = { id: string; name: string; unit: string; currentQty: number } | null

type Mode = 'in' | 'out' | 'transfer'

const LOCATION_KEY = 'belmir_last_location'

export default function ScannerClient({ locations }: { locations: Location[] }) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
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
    if (locationId) localStorage.setItem(LOCATION_KEY, locationId)
  }, [locationId])

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 180 },
        supportedScanTypes: [],
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      },
      false
    )

    scanner.render(
      async (decodedText) => {
        if (scannedBarcode === decodedText) return
        setScannedBarcode(decodedText)
        setStatus(null)
        setShowNewProduct(false)
        setQuantity(1)
        setNote('')

        const res = await fetch(`/api/products/by-barcode?barcode=${encodeURIComponent(decodedText)}&locationId=${locationId}`)
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
      },
      () => {}
    )

    scannerRef.current = scanner
    return () => { scanner.clear().catch(() => {}) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function reset() {
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

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Scanner</h1>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-col gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['in', 'out', 'transfer'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === m ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {m === 'in' ? 'Stock In' : m === 'out' ? 'Take Out' : 'Transfer'}
            </button>
          ))}
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
        <div id="qr-reader" className="w-full" />
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
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Saving…' : mode === 'in' ? 'Stock in' : mode === 'out' ? 'Take out' : 'Transfer'}
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
