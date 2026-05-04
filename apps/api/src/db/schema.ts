import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const applications = pgTable(
  "applications",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id").references(() => users.id),
    company: text("company").notNull(),
    role: text("role").notNull(),
    status: text("status").notNull().default("APPLIED"),
    salaryRange: text("salary_range"),
    jdUrl: text("jd_url"),
    jdText: text("jd_text"),
    notes: text("notes"),
    appliedAt: timestamp("applied_at").default(sql`now()`),
    createdAt: timestamp("created_at").default(sql`now()`),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("idx_applications_user_deleted").on(table.userId, table.deletedAt),
    index("idx_applications_user_status").on(table.userId, table.status),
  ],
);

export const interviews = pgTable("interviews", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id),
  type: text("type").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  outcome: text("outcome").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`),
  deletedAt: timestamp("deleted_at"),
});

export const questions = pgTable("questions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  content: text("content").notNull(),
  answer: text("answer"),
  tags: text("tags")
    .array()
    .notNull()
    .default(sql`'{}'`),
  difficulty: text("difficulty").notNull().default("medium"),
  sourceCompany: text("source_company"),
  reviewCount: integer("review_count").notNull().default(0),
  nextReviewAt: timestamp("next_review_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
  deletedAt: timestamp("deleted_at"),
});

export const applicationQuestions = pgTable(
  "application_questions",
  {
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id),
    linkedAt: timestamp("linked_at").default(sql`now()`),
  },
  (table) => [primaryKey({ columns: [table.applicationId, table.questionId] })],
);

export const watchlist = pgTable("watchlist", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  company: text("company").notNull(),
  role: text("role").notNull(),
  jdUrl: text("jd_url"),
  jdText: text("jd_text"),
  salaryRange: text("salary_range"),
  tags: text("tags")
    .array()
    .notNull()
    .default(sql`'{}'`),
  notes: text("notes"),
  fitAnalysis: jsonb("fit_analysis"),
  analyzedAt: timestamp("analyzed_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
  deletedAt: timestamp("deleted_at"),
});

export function isNotDeleted<T extends { deletedAt: unknown }>(table: T) {
  return sql`${table.deletedAt} IS NULL`;
}
