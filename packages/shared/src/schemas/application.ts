import { z } from "zod";

export const ApplicationStatus = z.enum([
  "APPLIED",
  "PHONE",
  "TECHNICAL",
  "ONSITE",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
]);
export type ApplicationStatus = z.infer<typeof ApplicationStatus>;

// Valid transitions: any state can move to REJECTED or WITHDRAWN.
// Forward flow: APPLIED → PHONE → TECHNICAL → ONSITE → OFFER → ACCEPTED.
export const STATUS_TRANSITIONS: Record<
  ApplicationStatus,
  ApplicationStatus[]
> = {
  APPLIED: ["PHONE", "TECHNICAL", "REJECTED", "WITHDRAWN"],
  PHONE: ["TECHNICAL", "REJECTED", "WITHDRAWN"],
  TECHNICAL: ["ONSITE", "OFFER", "REJECTED", "WITHDRAWN"],
  ONSITE: ["OFFER", "REJECTED", "WITHDRAWN"],
  OFFER: ["ACCEPTED", "REJECTED", "WITHDRAWN"],
  ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

export const CreateApplicationSchema = z.object({
  company: z.string().min(1).max(100),
  role: z.string().min(1).max(200),
  status: ApplicationStatus.default("APPLIED"),
  jdUrl: z.string().url().optional(),
  salaryRange: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
  appliedAt: z.string().datetime().optional(),
});

export const UpdateApplicationSchema = z.object({
  company: z.string().min(1).max(100).optional(),
  role: z.string().min(1).max(200).optional(),
  status: ApplicationStatus.optional(),
  jdUrl: z.string().url().nullable().optional(),
  jdText: z.string().nullable().optional(),
  salaryRange: z.string().max(100).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  appliedAt: z.string().datetime().optional(),
});

export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  company: z.string(),
  role: z.string(),
  status: ApplicationStatus,
  jdUrl: z.string().url().nullable(),
  salaryRange: z.string().nullable(),
  notes: z.string().nullable(),
  appliedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  interviewCount: z.number().int().nonnegative(),
  questionCount: z.number().int().nonnegative(),
});

export const ApplicationListSchema = z.object({
  data: z.array(ApplicationSchema),
  total: z.number().int().nonnegative(),
});

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;
export type Application = z.infer<typeof ApplicationSchema>;
export type ApplicationList = z.infer<typeof ApplicationListSchema>;
