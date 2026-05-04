import { z } from "zod";
import { ApplicationStatus } from "./application";

export const UpcomingInterviewSchema = z.object({
  id: z.string().uuid(),
  applicationId: z.string().uuid(),
  company: z.string(),
  role: z.string(),
  type: z.string(),
  scheduledAt: z.string().datetime(),
});

export const DashboardSchema = z.object({
  totalApplied: z.number().int().nonnegative(),
  activeCount: z.number().int().nonnegative(),
  offerCount: z.number().int().nonnegative(),
  byStatus: z.record(ApplicationStatus, z.number().int().nonnegative()),
  responseRate: z.number().min(0).max(100),
  avgDaysToOffer: z.number().nonnegative().nullable(),
  upcomingInterviews: z.array(UpcomingInterviewSchema),
});

export type UpcomingInterview = z.infer<typeof UpcomingInterviewSchema>;
export type Dashboard = z.infer<typeof DashboardSchema>;
