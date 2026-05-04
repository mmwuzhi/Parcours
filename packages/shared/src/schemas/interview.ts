import { z } from "zod";

export const InterviewType = z.enum([
  "phone_screen",
  "technical",
  "behavioral",
  "system_design",
  "onsite",
]);
export type InterviewType = z.infer<typeof InterviewType>;

export const InterviewOutcome = z.enum(["passed", "failed", "pending"]);
export type InterviewOutcome = z.infer<typeof InterviewOutcome>;

export const CreateInterviewSchema = z.object({
  type: InterviewType,
  scheduledAt: z.string().datetime(),
  outcome: InterviewOutcome.default("pending"),
  notes: z.string().max(5000).optional(),
});

export const UpdateInterviewSchema = z.object({
  type: InterviewType.optional(),
  scheduledAt: z.string().datetime().optional(),
  outcome: InterviewOutcome.optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export const InterviewSchema = z.object({
  id: z.string().uuid(),
  applicationId: z.string().uuid(),
  type: InterviewType,
  scheduledAt: z.string().datetime(),
  outcome: InterviewOutcome,
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreateInterviewInput = z.infer<typeof CreateInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof UpdateInterviewSchema>;
export type Interview = z.infer<typeof InterviewSchema>;
