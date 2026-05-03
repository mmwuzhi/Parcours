import { z } from 'zod'

export const FitAnalysisSchema = z.object({
  provider:       z.string(),
  model:          z.string(),
  skillsMatch: z.object({
    matched: z.array(z.string()),
    partial: z.array(z.string()),
    missing: z.array(z.string()),
  }),
  salaryFit:      z.enum(['good', 'ok', 'low', 'unknown']),
  overallScore:   z.number().int().min(0).max(100),
  recommendation: z.string(),
  concerns:       z.array(z.string()),
  highlights:     z.array(z.string()),
})

export const CreateWatchlistSchema = z.object({
  company:     z.string().min(1).max(100),
  role:        z.string().min(1).max(200),
  jdUrl:       z.string().url().optional(),
  jdText:      z.string().max(50000).optional(),
  salaryRange: z.string().max(100).optional(),
  tags:        z.array(z.string().max(50)).max(20).default([]),
  notes:       z.string().max(5000).optional(),
})

export const UpdateWatchlistSchema = z.object({
  company:     z.string().min(1).max(100).optional(),
  role:        z.string().min(1).max(200).optional(),
  jdUrl:       z.string().url().nullable().optional(),
  jdText:      z.string().max(50000).nullable().optional(),
  salaryRange: z.string().max(100).nullable().optional(),
  tags:        z.array(z.string().max(50)).max(20).optional(),
  notes:       z.string().max(5000).nullable().optional(),
})

export const WatchlistSchema = z.object({
  id:          z.string().uuid(),
  userId:      z.string().uuid(),
  company:     z.string(),
  role:        z.string(),
  jdUrl:       z.string().url().nullable(),
  jdText:      z.string().nullable(),
  salaryRange: z.string().nullable(),
  tags:        z.array(z.string()),
  notes:       z.string().nullable(),
  fitScore:    z.number().int().min(0).max(100).nullable(),
  fitAnalysis: FitAnalysisSchema.nullable(),
  analyzedAt:  z.string().datetime().nullable(),
  createdAt:   z.string().datetime(),
  updatedAt:   z.string().datetime(),
})

export type FitAnalysis = z.infer<typeof FitAnalysisSchema>
export type CreateWatchlistInput = z.infer<typeof CreateWatchlistSchema>
export type UpdateWatchlistInput = z.infer<typeof UpdateWatchlistSchema>
export type WatchlistItem = z.infer<typeof WatchlistSchema>
