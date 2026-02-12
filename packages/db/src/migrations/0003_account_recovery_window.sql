ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "recover_until" timestamp with time zone;
