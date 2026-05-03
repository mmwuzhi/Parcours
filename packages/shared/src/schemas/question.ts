import { z } from 'zod'

export const QuestionDifficulty = z.enum(['easy', 'medium', 'hard'])
export type QuestionDifficulty = z.infer<typeof QuestionDifficulty>

export const CreateQuestionSchema = z.object({
  content:       z.string().min(1).max(2000),
  answer:        z.string().max(10000).optional(),
  tags:          z.array(z.string().max(50)).max(20).default([]),
  difficulty:    QuestionDifficulty.default('medium'),
  sourceCompany: z.string().max(100).optional(),
})

export const UpdateQuestionSchema = z.object({
  content:       z.string().min(1).max(2000).optional(),
  answer:        z.string().max(10000).nullable().optional(),
  tags:          z.array(z.string().max(50)).max(20).optional(),
  difficulty:    QuestionDifficulty.optional(),
  sourceCompany: z.string().max(100).nullable().optional(),
})

export const LinkQuestionSchema = z.object({
  applicationId: z.string().uuid(),
})

export const QuestionSchema = z.object({
  id:            z.string().uuid(),
  userId:        z.string().uuid(),
  content:       z.string(),
  answer:        z.string().nullable(),
  tags:          z.array(z.string()),
  difficulty:    QuestionDifficulty,
  sourceCompany: z.string().nullable(),
  reviewCount:   z.number().int().nonnegative(),
  nextReviewAt:  z.string().datetime().nullable(),
  createdAt:     z.string().datetime(),
  updatedAt:     z.string().datetime(),
})

export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>
export type LinkQuestionInput = z.infer<typeof LinkQuestionSchema>
export type Question = z.infer<typeof QuestionSchema>
