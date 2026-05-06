export type ApplicationStatus =
  | "APPLIED"
  | "PHONE"
  | "TECHNICAL"
  | "ONSITE"
  | "OFFER"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export interface Application {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  jdUrl: string | null;
  jdText: string | null;
  salaryRange: string | null;
  notes: string | null;
  appliedAt: string | null;
  createdAt: string | null;
}

export type InterviewType =
  | "phone_screen"
  | "technical"
  | "behavioral"
  | "system_design"
  | "onsite";
export type InterviewOutcome = "passed" | "failed" | "pending";

export interface Interview {
  id: string;
  applicationId: string;
  type: InterviewType;
  scheduledAt: string;
  outcome: InterviewOutcome;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationList {
  data: Application[];
  total: number;
}

export interface Dashboard {
  totalApplied: number;
  activeCount: number;
  offerCount: number;
  byStatus: Partial<Record<ApplicationStatus, number>>;
  responseRate: number;
  avgDaysToOffer: number | null;
  upcomingInterviews: UpcomingInterview[];
}

export interface UpcomingInterview {
  id: string;
  applicationId: string;
  company: string;
  role: string;
  type: string;
  scheduledAt: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  company: string;
  role: string;
  jdUrl: string | null;
  jdText: string | null;
  salaryRange: string | null;
  tags: string[];
  notes: string | null;
  fitAnalysis: FitAnalysis | null;
  analyzedAt: string | null;
  createdAt: string | null;
}

export interface FitAnalysis {
  provider: string;
  model: string;
  skillsMatch: {
    matched: string[];
    partial: string[];
    missing: string[];
  };
  salaryFit: "good" | "ok" | "low" | "unknown";
  overallScore: number;
  recommendation: string;
  concerns: string[];
  highlights: string[];
}

export interface Question {
  id: string;
  userId: string;
  content: string;
  answer: string | null;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
  sourceCompany: string | null;
  reviewCount: number;
  nextReviewAt: string | null;
  createdAt: string | null;
}

export interface LinkedQuestion {
  id: string;
  content: string;
  answer: string | null;
  tags: string[];
  difficulty: string;
  sourceCompany: string | null;
  linkedAt: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}
