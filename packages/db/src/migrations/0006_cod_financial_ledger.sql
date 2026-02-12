ALTER TABLE "vendors"
	ADD COLUMN IF NOT EXISTS "commission_rate" real DEFAULT 12 NOT NULL;
--> statement-breakpoint
ALTER TABLE "vendors"
	ADD COLUMN IF NOT EXISTS "payout_details" jsonb;
--> statement-breakpoint
ALTER TABLE "vendors"
	ADD COLUMN IF NOT EXISTS "balance_pending_paisa" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "vendors"
	ADD COLUMN IF NOT EXISTS "balance_available_paisa" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "vendors"
	ADD COLUMN IF NOT EXISTS "pathao_store_id" varchar(120);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vendors_pathao_store_idx" ON "vendors" USING btree ("pathao_store_id");
--> statement-breakpoint
ALTER TABLE "vendor_payouts"
	ADD COLUMN IF NOT EXISTS "payout_fee_paisa" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint

ALTER TABLE "orders"
	ADD COLUMN IF NOT EXISTS "courier_name" varchar(40);
--> statement-breakpoint
ALTER TABLE "orders"
	ADD COLUMN IF NOT EXISTS "courier_order_ref" varchar(120);
--> statement-breakpoint
ALTER TABLE "orders"
	ADD COLUMN IF NOT EXISTS "commission_rate_snapshot" integer;
--> statement-breakpoint
ALTER TABLE "orders"
	ADD COLUMN IF NOT EXISTS "commission_amount_paisa" integer;
--> statement-breakpoint
ALTER TABLE "orders"
	ADD COLUMN IF NOT EXISTS "vendor_net_paisa" integer;
--> statement-breakpoint
ALTER TABLE "orders"
	ADD COLUMN IF NOT EXISTS "actual_courier_cost_paisa" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders"
	ADD COLUMN IF NOT EXISTS "return_fee_paisa" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders"
	ADD COLUMN IF NOT EXISTS "settlement_notes" text;
--> statement-breakpoint
ALTER TABLE "orders"
	ADD COLUMN IF NOT EXISTS "paid_to_admin_at" timestamp;
--> statement-breakpoint
ALTER TABLE "orders"
	ADD COLUMN IF NOT EXISTS "completed_at" timestamp;
--> statement-breakpoint
ALTER TABLE "orders"
	ADD COLUMN IF NOT EXISTS "returned_at" timestamp;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"order_id" uuid,
	"payout_id" uuid,
	"type" varchar(40) NOT NULL,
	"amount_paisa" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"description" text,
	"reference_id" text,
	"reference_type" varchar(30),
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payout_id_vendor_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."vendor_payouts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_vendor_status_created_idx" ON "transactions" USING btree ("vendor_id","status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_order_idx" ON "transactions" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_payout_idx" ON "transactions" USING btree ("payout_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_type_idx" ON "transactions" USING btree ("type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_reference_idx" ON "transactions" USING btree ("reference_type","reference_id");
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.apply_vendor_balance_delta(
	p_vendor_id uuid,
	p_status text,
	p_amount integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
	IF p_status = 'pending' THEN
		UPDATE vendors
		SET balance_pending_paisa = balance_pending_paisa + p_amount
		WHERE id = p_vendor_id;
	ELSIF p_status = 'cleared' THEN
		UPDATE vendors
		SET balance_available_paisa = balance_available_paisa + p_amount
		WHERE id = p_vendor_id;
	END IF;
END;
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.sync_vendor_balances_from_transactions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF TG_OP = 'INSERT' THEN
		PERFORM public.apply_vendor_balance_delta(NEW.vendor_id, NEW.status, NEW.amount_paisa);
		RETURN NEW;
	ELSIF TG_OP = 'UPDATE' THEN
		PERFORM public.apply_vendor_balance_delta(OLD.vendor_id, OLD.status, -OLD.amount_paisa);
		PERFORM public.apply_vendor_balance_delta(NEW.vendor_id, NEW.status, NEW.amount_paisa);
		RETURN NEW;
	ELSIF TG_OP = 'DELETE' THEN
		PERFORM public.apply_vendor_balance_delta(OLD.vendor_id, OLD.status, -OLD.amount_paisa);
		RETURN OLD;
	END IF;

	RETURN NULL;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS "transactions_balance_sync_trigger" ON "transactions";
--> statement-breakpoint
CREATE TRIGGER "transactions_balance_sync_trigger"
AFTER INSERT OR UPDATE OR DELETE ON "transactions"
FOR EACH ROW
EXECUTE FUNCTION public.sync_vendor_balances_from_transactions();
