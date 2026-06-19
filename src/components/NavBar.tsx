'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'

type IconProps = { className?: string }

// Compact line icons drawn to read at thumb-tab size on the floor.
const icons: Record<string, (p: IconProps) => React.ReactElement> = {
  dashboard: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={p.className}>
      <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  scan: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={p.className}>
      <path d="M4 7V5a1 1 0 0 1 1-1h2M20 7V5a1 1 0 0 0-1-1h-2M4 17v2a1 1 0 0 0 1 1h2M20 17v2a1 1 0 0 1-1 1h-2" />
      <path d="M7 8v8M10 8v8M13 8v8M16.5 8v8" />
    </svg>
  ),
  products: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className={p.className}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5M12 13v8" />
    </svg>
  ),
  locations: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className={p.className}>
      <path d="M4 21V9l8-5 8 5v12" /><path d="M9 21v-6h6v6" /><path d="M4 9h16" />
    </svg>
  ),
  history: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={p.className}>
      <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />
    </svg>
  ),
  stocktake: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <rect x="5" y="4" width="14" height="17" rx="1.5" /><path d="M9 4V3h6v1" /><path d="m9 12 2 2 4-4" />
    </svg>
  ),
}

const links = [
  { href: '/', label: 'Stock', key: 'dashboard' },
  { href: '/scan', label: 'Scan', key: 'scan' },
  { href: '/products', label: 'Products', key: 'products' },
  { href: '/locations', label: 'Locations', key: 'locations' },
  { href: '/history', label: 'History', key: 'history' },
  { href: '/stocktake', label: 'Count', key: 'stocktake' },
]

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0">
      {/* punched-hole ring — the recurring "tag" signature */}
      <span className="grid h-7 w-7 place-items-center rounded-[3px] bg-signal">
        <span className="block h-2.5 w-2.5 rounded-full border-2 border-signal-ink/80" />
      </span>
      <span className="leading-none">
        <span className="block font-display font-extrabold uppercase tracking-tight text-signal text-[15px]">
          Belmir
        </span>
        {!compact && (
          <span className="block font-mono text-[9px] uppercase tracking-[0.22em] text-paper/55 mt-0.5">
            Stock Control
          </span>
        )}
      </span>
    </Link>
  )
}

export default function NavBar() {
  const pathname = usePathname()
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <>
      {/* ── Desktop: ink control bar ─────────────────────────────────────── */}
      <nav className="hidden md:block sticky top-0 z-50 bg-ink text-paper border-b border-black/40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-7">
          <Brand />
          <div className="flex items-stretch h-14">
            {links.map((l) => {
              const active = isActive(l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center px-3 -mb-px border-b-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em] transition-colors ${
                    active
                      ? 'border-signal text-signal'
                      : 'border-transparent text-paper/65 hover:text-paper'
                  }`}
                >
                  {l.label}
                </Link>
              )
            })}
          </div>
          <form action={logout} className="ml-auto">
            <button
              type="submit"
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-paper/55 hover:text-signal transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {/* ── Mobile: slim ink header ──────────────────────────────────────── */}
      <nav className="md:hidden sticky top-0 z-50 bg-ink text-paper border-b border-black/40">
        <div className="px-4 h-12 flex items-center justify-between">
          <Brand compact />
          <form action={logout}>
            <button
              type="submit"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/55 active:text-signal"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {/* ── Mobile: thumb-zone tab bar ───────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-ink border-t border-black/50 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-6">
          {links.map((l) => {
            const active = isActive(l.href)
            const isScan = l.key === 'scan'
            const Icon = icons[l.key]
            const color = active ? (isScan ? 'text-signal' : 'text-paper') : isScan ? 'text-signal' : 'text-paper/55'
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-1 py-2.5 ${color}`}
              >
                {active && <span className="absolute top-0 h-0.5 w-7 rounded-full bg-signal" />}
                <Icon className="h-5 w-5" />
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] leading-none">{l.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
