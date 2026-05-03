'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutGrid, BarChart2, Bookmark, BookOpen, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

const NAV = [
  { href: '/applications', label: 'Applications', icon: LayoutGrid },
  { href: '/dashboard',    label: 'Dashboard',    icon: BarChart2  },
  { href: '/watchlist',    label: 'Watchlist',    icon: Bookmark   },
  { href: '/questions',    label: 'Questions',    icon: BookOpen   },
]

export function NavSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore errors — cookies will be cleared server-side
    }
    router.push('/login')
    router.refresh()
    toast.success('Logged out')
  }

  return (
    <aside
      style={{
        width: 220,
        minHeight: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--primary)',
          }}
        >
          parcours
        </span>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                background: active ? 'var(--primary-subtle)' : 'transparent',
                textDecoration: 'none',
                marginBottom: 2,
                transition: 'background 0.1s, color 0.1s',
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 14,
            color: 'var(--text-muted)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <LogOut size={16} strokeWidth={1.8} />
          Log out
        </button>
      </div>
    </aside>
  )
}
