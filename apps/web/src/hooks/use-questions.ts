import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { Question } from '@/lib/types'

export function useQuestions() {
  return useQuery<Question[]>({
    queryKey: ['questions'],
    queryFn: () => apiFetch('/api/questions'),
  })
}

export function useCreateQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      content: string
      answer?: string
      tags?: string[]
      difficulty?: 'easy' | 'medium' | 'hard'
      sourceCompany?: string
    }) =>
      apiFetch<Question>('/api/questions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] })
    },
  })
}
