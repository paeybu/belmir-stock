'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Scanner, type IDetectedBarcode, type IScannerError } from '@yudiel/react-qr-scanner'
import { applyMovement, transferStock } from '@/lib/actions/movements'

type Location = { id: string; name: string }
type ProductResult = { id: string; name: string; unit: string; currentQty: number } | null

type Mode = 'in' | 'out' | 'transfer'

const LOCATION_KEY = 'belmir_last_location'

// Each mode is colour-coded so it's unmistakable which one is active. The same
// colour drives the active segment, the banner, the panel edge and the submit
// button. Class strings are written out in full (no interpolated colour names)
// so Tailwind v4's static scanner picks them up.
const MODE_CONFIG: Record<Mode, {
  label: string
  verb: string
  description: string
  icon: string
  seg: string
  text: string
  border: string
  soft: string
  badge: string
  btn: string
}> = {
  in: {
    label: 'Stock In',
    verb: 'Stock in',
    description: 'Adding stock to a location',
    icon: '↓',
    seg: 'bg-in text-card',
    text: 'text-in',
    border: 'border-in',
    soft: 'bg-in/10 border-in/30 text-in',
    badge: 'bg-in',
    btn: 'bg-in text-card hover:brightness-110',
  },
  out: {
    label: 'Take Out',
    verb: 'Take out',
    description: 'Removing stock from a location',
    icon: '↑',
    seg: 'bg-out text-card',
    text: 'text-out',
    border: 'border-out',
    soft: 'bg-out/10 border-out/30 text-out',
    badge: 'bg-out',
    btn: 'bg-out text-card hover:brightness-110',
  },
  transfer: {
    label: 'Transfer',
    verb: 'Transfer',
    description: 'Moving stock between locations',
    icon: '⇄',
    seg: 'bg-transfer text-card',
    text: 'text-transfer',
    border: 'border-transfer',
    soft: 'bg-transfer/10 border-transfer/30 text-transfer',
    badge: 'bg-transfer',
    btn: 'bg-transfer text-card hover:brightness-110',
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
  const isError = status?.startsWith('Error')

  return (
    <div className="max-w-lg mx-auto">
      <header className="mb-5">
        <p className="kicker">Stock Control · Station</p>
        <h1 className="h-display text-3xl mt-1.5">Scan station</h1>
      </header>

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div className={`sheet border-t-2 ${cfg.border} p-4 mb-4 flex flex-col gap-3 transition-colors`}>
        {/* Mode segments */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-[3px] bg-ink/[0.05]">
          {(['in', 'out', 'transfer'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`py-2 rounded-[2px] font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
                mode === m ? MODE_CONFIG[m].seg : 'text-muted hover:text-ink'
              }`}
            >
              {MODE_CONFIG[m].label}
            </button>
          ))}
        </div>

        {/* Active mode banner — makes the current direction unmistakable */}
        <div className={`flex items-center gap-3 rounded-[3px] border px-3 py-2.5 ${cfg.soft}`}>
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] text-lg font-bold text-card ${cfg.badge}`}>
            {cfg.icon}
          </span>
          <div className="min-w-0">
            <div className="font-display font-bold uppercase tracking-wide leading-tight text-sm">{cfg.label}</div>
            <div className="text-xs opacity-80 leading-tight">{cfg.description}</div>
          </div>
        </div>

        <div>
          <label className="field-label">{mode === 'transfer' ? 'From location' : 'Location'}</label>
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="field">
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {mode === 'transfer' && (
          <div>
            <label className="field-label">To location</label>
            <select value={toLocationId} onChange={(e) => setToLocationId(e.target.value)} className="field">
              {locations.filter((l) => l.id !== locationId).map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Status message ────────────────────────────────────────────── */}
      {status && (
        <div
          className={`mb-4 flex items-center gap-2.5 p-3 rounded-[3px] border text-sm ${
            isError ? 'bg-out/10 border-out/30 text-out' : 'bg-in/10 border-in/30 text-in'
          }`}
        >
          <span className="stamp shrink-0">{isError ? 'Error' : 'Done'}</span>
          <span className="min-w-0">{isError ? status.replace(/^Error:\s*/, '') : status}</span>
        </div>
      )}

      {/* ── Camera viewport ───────────────────────────────────────────── */}
      <div className="viewport-frame overflow-hidden mb-4">
        <div className="absolute z-10 top-2.5 left-10 flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${scannedBarcode ? 'bg-muted' : 'bg-signal animate-pulse'}`} />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/80">
            {scannedBarcode ? 'Hold' : 'Live'}
          </span>
        </div>
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

      {/* ── Product found ─────────────────────────────────────────────── */}
      {product && scannedBarcode && (
        <div className={`sheet border-t-2 ${cfg.border} p-4`}>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-ink truncate">{product.name}</div>
              <div className="font-mono text-[11px] text-muted truncate">{scannedBarcode}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted">On hand</div>
              <div className="font-mono text-lg font-semibold text-ink">
                {product.currentQty}
                <span className="text-muted text-xs font-normal ml-1">{product.unit}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-4">
            <div>
              <label className="field-label">Quantity</label>
              <QtyStepper value={quantity} onChange={setQuantity} accent={cfg.text} autoFocus />
            </div>
            <div>
              <label className="field-label">Note (optional)</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="field" />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={reset} className="btn-quiet flex-1">Cancel</button>
            <button
              onClick={submit}
              disabled={isPending}
              className={`flex-1 rounded-[3px] py-2.5 text-sm font-semibold disabled:opacity-50 transition ${cfg.btn}`}
            >
              {isPending ? 'Saving…' : `${cfg.verb} ${quantity}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Unknown barcode — new product form ────────────────────────── */}
      {showNewProduct && scannedBarcode && (
        <div className="sheet border-t-2 border-signal p-4">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="stamp text-signal">Unknown</span>
            <span className="font-mono text-[11px] text-muted truncate">{scannedBarcode}</span>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="field-label">Product name *</label>
              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                autoFocus
                className="field"
              />
            </div>
            <div>
              <label className="field-label">Unit</label>
              <input type="text" value={newProductUnit} onChange={(e) => setNewProductUnit(e.target.value)} className="field" />
            </div>
            <div>
              <label className="field-label">Quantity</label>
              <QtyStepper value={quantity} onChange={setQuantity} accent="text-signal" />
            </div>
            <div className="flex gap-2">
              <button onClick={reset} className="btn-quiet flex-1">Cancel</button>
              <button
                onClick={createAndSubmit}
                disabled={isPending || !newProductName}
                className="btn-signal flex-1"
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

// Big-target quantity stepper: tap ± for small changes, tap the field to type a
// shipment count (default 1, never below 1).
function QtyStepper({
  value,
  onChange,
  accent,
  autoFocus = false,
}: {
  value: number
  onChange: (n: number) => void
  accent: string
  autoFocus?: boolean
}) {
  return (
    <div className="flex items-stretch h-12">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-12 grid place-items-center border border-line rounded-l-[3px] bg-card text-xl font-mono text-ink hover:bg-ink/5 active:bg-ink/10"
      >
        −
      </button>
      <input
        type="number"
        min="1"
        value={value}
        onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
        autoFocus={autoFocus}
        className={`flex-1 w-full border-y border-line bg-card text-center font-mono text-lg font-semibold ${accent} focus:outline-none focus:border-signal`}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
        className="w-12 grid place-items-center border border-line rounded-r-[3px] bg-card text-xl font-mono text-ink hover:bg-ink/5 active:bg-ink/10"
      >
        +
      </button>
    </div>
  )
}
