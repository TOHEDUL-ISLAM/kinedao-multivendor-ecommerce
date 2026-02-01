CREATE TABLE "category_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"trending_score" integer DEFAULT 0,
	"popularity_score" integer DEFAULT 0,
	"sales_velocity" real DEFAULT 0,
	"mom_choice_weight" integer DEFAULT 0,
	"editor_pick_weight" integer DEFAULT 0,
	"homepage_weight" integer DEFAULT 0,
	"seasonal_tags" text[],
	"target_audience" text[],
	"embedding_vector" jsonb,
	"user_segment_affinity" jsonb,
	"last_calculated_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "category_metrics_category_id_unique" UNIQUE("category_id")
);
--> statement-breakpoint
CREATE TABLE "mega_menu_featured_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"position" text DEFAULT 'right-panel',
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "depth" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "path" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_popular" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "display_in_mega_menu" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "category_metrics" ADD CONSTRAINT "category_metrics_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mega_menu_featured_products" ADD CONSTRAINT "mega_menu_featured_products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mega_menu_featured_products" ADD CONSTRAINT "mega_menu_featured_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mega_menu_featured_category_idx" ON "mega_menu_featured_products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "mega_menu_featured_product_idx" ON "mega_menu_featured_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "mega_menu_featured_active_idx" ON "mega_menu_featured_products" USING btree ("is_active","category_id");--> statement-breakpoint
CREATE INDEX "categories_depth_idx" ON "categories" USING btree ("depth");--> statement-breakpoint
CREATE INDEX "categories_path_idx" ON "categories" USING btree ("path");--> statement-breakpoint
CREATE INDEX "categories_parent_sort_idx" ON "categories" USING btree ("parent_id","sort_order");