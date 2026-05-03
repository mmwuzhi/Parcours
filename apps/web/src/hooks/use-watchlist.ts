import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { WatchlistItem } from '@/lib/types'

export function useWatchlist() {
  return useQuery<WatchlistItem[]>({
    queryKey: ['watchlist'],
    queryFn: () => apiFetch('/api/watchlist'),
  })
}

export function useCreateWatchlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      company: string
      role: string
      jdUrl?: string
      jdText?: string
      salaryRange?: string
      tags?: string[]
      notes?: string
    }) =>
      apiFetch<WatchlistItem>('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] })
    },
  })
}

export function useDeleteWatchlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/watchlist/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] })
    },
  })
}
