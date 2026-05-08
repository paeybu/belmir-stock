'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/scan', label: 'Scan' },
  { href: '/products', label: 'Products' },
  { href: '/locations', label: 'Locations' },
  { href: '/history', label: 'History' },
  { href: '/stocktake', label: 'Stocktake' },
]

export default function NavBar() {
  const pathname = usePathname()
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
        <span className="font-bold text-blue-600 mr-3 py-3 shrink-0">Belmir</span>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
              pathname === l.href
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {l.label}
          </Link>
        ))}
        <form action={logout} className="ml-auto">
          <button type="submit" className="px-3 py-3 text-sm text-gray-500 hover:text-gray-900 whitespace-nowrap">
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}
