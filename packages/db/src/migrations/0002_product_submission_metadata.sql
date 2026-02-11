ALTER TABLE "products" ADD COLUMN "pending_reason" varchar(32) DEFAULT 'new_submission';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "last_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "last_reviewed_by" text;
