import { NavSidebar } from '@/components/nav-sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <NavSidebar />
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>{children}</main>
    </div>
  )
}
