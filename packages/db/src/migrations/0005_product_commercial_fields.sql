ALTER TABLE "product_models" ADD COLUMN "warranty_months" integer DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_models" ADD COLUMN "list_price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_models" ADD COLUMN "description" text;
