import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { Dashboard } from '@/lib/types'

export function useDashboard() {
  return useQuery<Dashboard>({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch('/api/dashboard'),
    staleTime: 60_000,
  })
}
