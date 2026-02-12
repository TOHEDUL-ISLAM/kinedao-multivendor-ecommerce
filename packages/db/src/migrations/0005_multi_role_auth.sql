ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "roles" text[] DEFAULT ARRAY['customer']::text[] NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(20) NOT NULL,
	"invited_by" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_invitations_email_idx" ON "admin_invitations" USING btree ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_invitations_status_idx" ON "admin_invitations" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_invitations_expires_at_idx" ON "admin_invitations" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_invitations_invited_by_idx" ON "admin_invitations" USING btree ("invited_by");

