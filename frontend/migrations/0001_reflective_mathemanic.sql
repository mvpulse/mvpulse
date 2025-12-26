CREATE TABLE "projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"color" varchar(20) DEFAULT '#6366f1',
	"icon" varchar(50),
	"owner_address" varchar(66) NOT NULL,
	"status" integer DEFAULT 0 NOT NULL,
	"cached_total_polls" integer DEFAULT 0 NOT NULL,
	"cached_total_questionnaires" integer DEFAULT 0 NOT NULL,
	"cached_total_votes" integer DEFAULT 0 NOT NULL,
	"cached_total_completions" integer DEFAULT 0 NOT NULL,
	"analytics_last_updated" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_collaborators" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"wallet_address" varchar(66) NOT NULL,
	"role" integer NOT NULL,
	"invited_by" varchar(66) NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "project_polls" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"poll_id" integer NOT NULL,
	"added_by" varchar(66) NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"cached_title" varchar(500),
	"cached_total_votes" integer DEFAULT 0,
	"cached_status" integer DEFAULT 0,
	"last_synced" timestamp
);
--> statement-breakpoint
CREATE TABLE "project_questionnaires" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"questionnaire_id" varchar(36) NOT NULL,
	"added_by" varchar(66) NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar(36) NOT NULL,
	"insight_type" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"data_snapshot" jsonb NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"requested_by" varchar(66) NOT NULL
);
