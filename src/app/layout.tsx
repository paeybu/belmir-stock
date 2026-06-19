import type { Metadata } from 'next'
import './globals.css'
import { auth } from '@/lib/auth'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'Belmir Stock',
  description: 'Inventory management',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50">
        {session && <NavBar />}
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
