CREATE TABLE "application_questions" (
	"application_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"linked_at" timestamp DEFAULT now(),
	CONSTRAINT "application_questions_application_id_question_id_pk" PRIMARY KEY("application_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'APPLIED' NOT NULL,
	"salary_range" text,
	"jd_url" text,
	"jd_text" text,
	"notes" text,
	"applied_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid,
	"type" text NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"outcome" text DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"content" text NOT NULL,
	"answer" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"source_company" text,
	"review_count" integer DEFAULT 0 NOT NULL,
	"next_review_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "watchlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"jd_url" text,
	"jd_text" text,
	"salary_range" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"notes" text,
	"fit_analysis" jsonb,
	"analyzed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "application_questions" ADD CONSTRAINT "application_questions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_questions" ADD CONSTRAINT "application_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_applications_user_deleted" ON "applications" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_applications_user_status" ON "applications" USING btree ("user_id","status");
