CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."attachment_owner_type" AS ENUM('fault_report', 'job_expense', 'service_manual', 'job');--> statement-breakpoint
CREATE TYPE "public"."clock_event_type" AS ENUM('clock_in', 'clock_out');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('active', 'expiring', 'expired');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('full', 'partial', 'emergency_only');--> statement-breakpoint
CREATE TYPE "public"."coverage_status" AS ENUM('in_contract', 'out_of_contract', 'billable_exception', 'expired');--> statement-breakpoint
CREATE TYPE "public"."engineer_status" AS ENUM('on_site', 'in_transit', 'idle', 'timer_anomaly', 'off_duty');--> statement-breakpoint
CREATE TYPE "public"."expense_type" AS ENUM('mileage', 'meal', 'parking', 'other');--> statement-breakpoint
CREATE TYPE "public"."fault_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."fault_source" AS ENUM('hospital_web', 'back_office');--> statement-breakpoint
CREATE TYPE "public"."fault_status" AS ENUM('received', 'engineer_assigned', 'in_progress', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."geofence_event_type" AS ENUM('activated', 'entered', 'exited', 'timer_anomaly', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."job_priority" AS ENUM('normal', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('created', 'assigned', 'in_progress', 'paused', 'resumed', 'completed', 'timer_anomaly', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('installation', 'repair', 'preventive_maintenance');--> statement-breakpoint
CREATE TYPE "public"."manual_status" AS ENUM('uploaded', 'indexed', 'failed', 'retired');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'invited', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."nfc_event_type" AS ENUM('commissioned', 'scanned_for_info', 'job_start', 'job_end', 'replacement_requested', 'replaced', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."nfc_tag_status" AS ENUM('blank', 'commissioned', 'damaged', 'unreadable', 'replaced', 'retired');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('queued', 'sent', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('job_assigned', 'job_resumed', 'geofence_alert', 'status_changed', 'parts_arrived', 'contract_expiry');--> statement-breakpoint
CREATE TYPE "public"."report_period" AS ENUM('day', 'week', 'month');--> statement-breakpoint
CREATE TYPE "public"."shortage_status" AS ENUM('waiting_for_parts', 'arrived', 'reschedule_ready', 'closed');--> statement-breakpoint
CREATE TYPE "public"."system_parameter_value_type" AS ENUM('number', 'string', 'secret', 'boolean');--> statement-breakpoint
CREATE TYPE "public"."tenant_role" AS ENUM('admin', 'coordinator', 'engineer', 'hospital_user');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"asset_number" text NOT NULL,
	"product_model_id" uuid NOT NULL,
	"hospital_id" uuid NOT NULL,
	"serial_number" text NOT NULL,
	"location_label" text NOT NULL,
	"installation_date" date,
	"warranty_expiry_date" date,
	"next_pm_due_date" date,
	"designated_engineer_id" uuid,
	"contract_coverage_status" "coverage_status" DEFAULT 'in_contract' NOT NULL,
	"nfc_uid" text NOT NULL,
	"nfc_version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_model_coverage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"contract_id" uuid NOT NULL,
	"product_model_id" uuid NOT NULL,
	"coverage_status" "coverage_status" NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "contract_part_coverage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"contract_id" uuid NOT NULL,
	"part_id" uuid NOT NULL,
	"coverage_status" "coverage_status" NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"hospital_id" uuid NOT NULL,
	"contract_number" text NOT NULL,
	"type" "contract_type" NOT NULL,
	"status" "contract_status" DEFAULT 'active' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"response_sla_hours" integer NOT NULL,
	"account_manager_name" text NOT NULL,
	"primary_contact_name" text,
	"primary_contact_email" text,
	"warning_days" integer DEFAULT 30 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engineer_clock_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"engineer_id" uuid NOT NULL,
	"event_type" "clock_event_type" NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"accuracy_meters" numeric(8, 2),
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engineer_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"engineer_id" uuid NOT NULL,
	"job_id" uuid,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"accuracy_meters" numeric(8, 2),
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engineers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"grade" text NOT NULL,
	"status" "engineer_status" DEFAULT 'idle' NOT NULL,
	"region" text NOT NULL,
	"hourly_rate_hkd" numeric(10, 2) NOT NULL,
	"mileage_rate_hkd_per_km" numeric(10, 2) NOT NULL,
	"meal_cap_hkd" numeric(10, 2) NOT NULL,
	"gps_tracking_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fault_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"report_number" text NOT NULL,
	"hospital_id" uuid NOT NULL,
	"asset_id" uuid,
	"converted_job_id" uuid,
	"source" "fault_source" NOT NULL,
	"severity" "fault_severity" NOT NULL,
	"status" "fault_status" DEFAULT 'received' NOT NULL,
	"submitted_by_name" text NOT NULL,
	"submitted_by_contact" text,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"owner_type" "attachment_owner_type" NOT NULL,
	"owner_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"storage_key" text NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size_bytes" integer,
	"uploaded_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geofence_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"engineer_id" uuid NOT NULL,
	"hospital_id" uuid NOT NULL,
	"event_type" "geofence_event_type" NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"distance_meters" numeric(8, 2),
	"radius_meters" integer DEFAULT 200 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hospitals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"district" text NOT NULL,
	"address" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"primary_contact_name" text,
	"primary_contact_email" text,
	"primary_contact_phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"labour_minutes" integer DEFAULT 0 NOT NULL,
	"labour_rate_hkd" numeric(10, 2) NOT NULL,
	"labour_cost_hkd" numeric(10, 2) NOT NULL,
	"mileage_cost_hkd" numeric(10, 2) DEFAULT '0',
	"meal_cost_hkd" numeric(10, 2) DEFAULT '0',
	"parts_absorbed_hkd" numeric(10, 2) DEFAULT '0',
	"parts_billable_hkd" numeric(10, 2) DEFAULT '0',
	"total_internal_cost_hkd" numeric(10, 2) NOT NULL,
	"total_billable_hkd" numeric(10, 2) NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"engineer_id" uuid NOT NULL,
	"type" "expense_type" NOT NULL,
	"quantity" numeric(10, 2),
	"amount_hkd" numeric(10, 2) NOT NULL,
	"receipt_attachment_id" uuid,
	"notes" text,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_parts_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"part_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_cost_hkd" numeric(10, 2) NOT NULL,
	"coverage_status" "coverage_status" NOT NULL,
	"is_billable" boolean DEFAULT false NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_state_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"from_status" "job_status",
	"to_status" "job_status" NOT NULL,
	"actor_user_id" text,
	"actor_engineer_id" uuid,
	"event_label" text NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_timers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"engineer_id" uuid NOT NULL,
	"start_nfc_event_id" uuid,
	"end_nfc_event_id" uuid,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_minutes" integer DEFAULT 0 NOT NULL,
	"is_anomaly" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"job_number" text NOT NULL,
	"type" "job_type" NOT NULL,
	"status" "job_status" DEFAULT 'created' NOT NULL,
	"priority" "job_priority" DEFAULT 'normal' NOT NULL,
	"asset_id" uuid NOT NULL,
	"hospital_id" uuid NOT NULL,
	"assigned_engineer_id" uuid,
	"description" text NOT NULL,
	"scheduled_start_at" timestamp with time zone,
	"scheduled_end_at" timestamp with time zone,
	"actual_started_at" timestamp with time zone,
	"actual_completed_at" timestamp with time zone,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_qa_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"engineer_id" uuid,
	"asset_id" uuid,
	"job_id" uuid,
	"manual_id" uuid,
	"question" text NOT NULL,
	"top_section_ids" jsonb DEFAULT '[]'::jsonb,
	"answer_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nfc_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"asset_id" uuid,
	"tag_id" uuid,
	"job_id" uuid,
	"engineer_id" uuid,
	"event_type" "nfc_event_type" NOT NULL,
	"read_uid" text NOT NULL,
	"expected_uid" text,
	"accepted" boolean NOT NULL,
	"rejection_reason" text,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nfc_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"asset_id" uuid NOT NULL,
	"uid" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"ndef_payload" jsonb NOT NULL,
	"status" "nfc_tag_status" DEFAULT 'commissioned' NOT NULL,
	"commissioned_by_engineer_id" uuid,
	"commissioned_at" timestamp with time zone,
	"replaced_by_tag_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunistic_pm_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"engineer_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"source_job_id" uuid,
	"pm_due_date" date NOT NULL,
	"days_until_due" integer NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "part_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"part_id" uuid NOT NULL,
	"location_name" text DEFAULT 'Main store' NOT NULL,
	"stock_on_hand" integer DEFAULT 0 NOT NULL,
	"minimum_stock" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"part_number" text NOT NULL,
	"name" text NOT NULL,
	"supplier" text NOT NULL,
	"unit_cost_hkd" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parts_shortages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"shortage_number" text NOT NULL,
	"job_id" uuid NOT NULL,
	"part_id" uuid NOT NULL,
	"engineer_id" uuid,
	"quantity_requested" integer DEFAULT 1 NOT NULL,
	"status" "shortage_status" DEFAULT 'waiting_for_parts' NOT NULL,
	"notes" text,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"arrived_at" timestamp with time zone,
	"confirmed_by_user_id" text
);
--> statement-breakpoint
CREATE TABLE "product_model_parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"product_model_id" uuid NOT NULL,
	"part_id" uuid NOT NULL,
	"default_quantity" integer DEFAULT 1 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "product_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"code" text NOT NULL,
	"model_name" text NOT NULL,
	"manufacturer" text NOT NULL,
	"category" text NOT NULL,
	"default_pm_cycle_months" integer NOT NULL,
	"is_engineer_read_only" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"recipient_user_id" text,
	"engineer_id" uuid,
	"job_id" uuid,
	"type" "notification_type" NOT NULL,
	"status" "notification_status" DEFAULT 'queued' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "report_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"period" "report_period" NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"metrics" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_manual_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"manual_id" uuid NOT NULL,
	"page_number" integer NOT NULL,
	"section_title" text NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "service_manuals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"product_model_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"storage_key" text NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" text DEFAULT 'application/pdf' NOT NULL,
	"page_count" integer,
	"version" text DEFAULT '1' NOT NULL,
	"status" "manual_status" DEFAULT 'uploaded' NOT NULL,
	"uploaded_by_user_id" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_parameters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"value_type" "system_parameter_value_type" NOT NULL,
	"description" text NOT NULL,
	"updated_by_user_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "tenant_role" NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"release_label" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "websocket_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"channel" text NOT NULL,
	"event_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_product_model_id_product_models_id_fk" FOREIGN KEY ("product_model_id") REFERENCES "public"."product_models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_designated_engineer_id_engineers_id_fk" FOREIGN KEY ("designated_engineer_id") REFERENCES "public"."engineers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_model_coverage" ADD CONSTRAINT "contract_model_coverage_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_model_coverage" ADD CONSTRAINT "contract_model_coverage_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_model_coverage" ADD CONSTRAINT "contract_model_coverage_product_model_id_product_models_id_fk" FOREIGN KEY ("product_model_id") REFERENCES "public"."product_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_part_coverage" ADD CONSTRAINT "contract_part_coverage_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_part_coverage" ADD CONSTRAINT "contract_part_coverage_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_part_coverage" ADD CONSTRAINT "contract_part_coverage_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engineer_clock_events" ADD CONSTRAINT "engineer_clock_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engineer_clock_events" ADD CONSTRAINT "engineer_clock_events_engineer_id_engineers_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."engineers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engineer_locations" ADD CONSTRAINT "engineer_locations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engineer_locations" ADD CONSTRAINT "engineer_locations_engineer_id_engineers_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."engineers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engineer_locations" ADD CONSTRAINT "engineer_locations_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engineers" ADD CONSTRAINT "engineers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engineers" ADD CONSTRAINT "engineers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fault_reports" ADD CONSTRAINT "fault_reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fault_reports" ADD CONSTRAINT "fault_reports_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fault_reports" ADD CONSTRAINT "fault_reports_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fault_reports" ADD CONSTRAINT "fault_reports_converted_job_id_jobs_id_fk" FOREIGN KEY ("converted_job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_uploaded_by_user_id_user_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_engineer_id_engineers_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."engineers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospitals" ADD CONSTRAINT "hospitals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_costs" ADD CONSTRAINT "job_costs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_costs" ADD CONSTRAINT "job_costs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_expenses" ADD CONSTRAINT "job_expenses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_expenses" ADD CONSTRAINT "job_expenses_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_expenses" ADD CONSTRAINT "job_expenses_engineer_id_engineers_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."engineers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_parts_usage" ADD CONSTRAINT "job_parts_usage_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_parts_usage" ADD CONSTRAINT "job_parts_usage_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_parts_usage" ADD CONSTRAINT "job_parts_usage_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_state_events" ADD CONSTRAINT "job_state_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_state_events" ADD CONSTRAINT "job_state_events_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_state_events" ADD CONSTRAINT "job_state_events_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_state_events" ADD CONSTRAINT "job_state_events_actor_engineer_id_engineers_id_fk" FOREIGN KEY ("actor_engineer_id") REFERENCES "public"."engineers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_timers" ADD CONSTRAINT "job_timers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_timers" ADD CONSTRAINT "job_timers_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_timers" ADD CONSTRAINT "job_timers_engineer_id_engineers_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."engineers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_timers" ADD CONSTRAINT "job_timers_start_nfc_event_id_nfc_events_id_fk" FOREIGN KEY ("start_nfc_event_id") REFERENCES "public"."nfc_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_timers" ADD CONSTRAINT "job_timers_end_nfc_event_id_nfc_events_id_fk" FOREIGN KEY ("end_nfc_event_id") REFERENCES "public"."nfc_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assigned_engineer_id_engineers_id_fk" FOREIGN KEY ("assigned_engineer_id") REFERENCES "public"."engineers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_qa_queries" ADD CONSTRAINT "manual_qa_queries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_qa_queries" ADD CONSTRAINT "manual_qa_queries_engineer_id_engineers_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."engineers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_qa_queries" ADD CONSTRAINT "manual_qa_queries_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_qa_queries" ADD CONSTRAINT "manual_qa_queries_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_qa_queries" ADD CONSTRAINT "manual_qa_queries_manual_id_service_manuals_id_fk" FOREIGN KEY ("manual_id") REFERENCES "public"."service_manuals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nfc_events" ADD CONSTRAINT "nfc_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nfc_events" ADD CONSTRAINT "nfc_events_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nfc_events" ADD CONSTRAINT "nfc_events_tag_id_nfc_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."nfc_tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nfc_events" ADD CONSTRAINT "nfc_events_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nfc_events" ADD CONSTRAINT "nfc_events_engineer_id_engineers_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."engineers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nfc_tags" ADD CONSTRAINT "nfc_tags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nfc_tags" ADD CONSTRAINT "nfc_tags_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nfc_tags" ADD CONSTRAINT "nfc_tags_commissioned_by_engineer_id_engineers_id_fk" FOREIGN KEY ("commissioned_by_engineer_id") REFERENCES "public"."engineers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunistic_pm_alerts" ADD CONSTRAINT "opportunistic_pm_alerts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunistic_pm_alerts" ADD CONSTRAINT "opportunistic_pm_alerts_engineer_id_engineers_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."engineers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunistic_pm_alerts" ADD CONSTRAINT "opportunistic_pm_alerts_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunistic_pm_alerts" ADD CONSTRAINT "opportunistic_pm_alerts_source_job_id_jobs_id_fk" FOREIGN KEY ("source_job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_inventory" ADD CONSTRAINT "part_inventory_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_inventory" ADD CONSTRAINT "part_inventory_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_shortages" ADD CONSTRAINT "parts_shortages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_shortages" ADD CONSTRAINT "parts_shortages_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_shortages" ADD CONSTRAINT "parts_shortages_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_shortages" ADD CONSTRAINT "parts_shortages_engineer_id_engineers_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."engineers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_shortages" ADD CONSTRAINT "parts_shortages_confirmed_by_user_id_user_id_fk" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_model_parts" ADD CONSTRAINT "product_model_parts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_model_parts" ADD CONSTRAINT "product_model_parts_product_model_id_product_models_id_fk" FOREIGN KEY ("product_model_id") REFERENCES "public"."product_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_model_parts" ADD CONSTRAINT "product_model_parts_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_models" ADD CONSTRAINT "product_models_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_notifications" ADD CONSTRAINT "push_notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_notifications" ADD CONSTRAINT "push_notifications_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_notifications" ADD CONSTRAINT "push_notifications_engineer_id_engineers_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."engineers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_notifications" ADD CONSTRAINT "push_notifications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_manual_sections" ADD CONSTRAINT "service_manual_sections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_manual_sections" ADD CONSTRAINT "service_manual_sections_manual_id_service_manuals_id_fk" FOREIGN KEY ("manual_id") REFERENCES "public"."service_manuals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_manuals" ADD CONSTRAINT "service_manuals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_manuals" ADD CONSTRAINT "service_manuals_product_model_id_product_models_id_fk" FOREIGN KEY ("product_model_id") REFERENCES "public"."product_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_manuals" ADD CONSTRAINT "service_manuals_uploaded_by_user_id_user_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_parameters" ADD CONSTRAINT "system_parameters_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_parameters" ADD CONSTRAINT "system_parameters_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "websocket_events" ADD CONSTRAINT "websocket_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_tenant_asset_number_uidx" ON "assets" USING btree ("tenant_id","asset_number");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_tenant_serial_uidx" ON "assets" USING btree ("tenant_id","serial_number");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_tenant_nfc_uidx" ON "assets" USING btree ("tenant_id","nfc_uid");--> statement-breakpoint
CREATE INDEX "assets_tenant_hospital_idx" ON "assets" USING btree ("tenant_id","hospital_id");--> statement-breakpoint
CREATE INDEX "assets_tenant_pm_due_idx" ON "assets" USING btree ("tenant_id","next_pm_due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "contract_model_coverage_contract_model_uidx" ON "contract_model_coverage" USING btree ("contract_id","product_model_id");--> statement-breakpoint
CREATE INDEX "contract_model_coverage_tenant_idx" ON "contract_model_coverage" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contract_part_coverage_contract_part_uidx" ON "contract_part_coverage" USING btree ("contract_id","part_id");--> statement-breakpoint
CREATE INDEX "contract_part_coverage_tenant_idx" ON "contract_part_coverage" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contracts_tenant_number_uidx" ON "contracts" USING btree ("tenant_id","contract_number");--> statement-breakpoint
CREATE INDEX "contracts_tenant_status_end_idx" ON "contracts" USING btree ("tenant_id","status","end_date");--> statement-breakpoint
CREATE INDEX "contracts_hospital_idx" ON "contracts" USING btree ("hospital_id");--> statement-breakpoint
CREATE INDEX "engineer_clock_events_engineer_recorded_idx" ON "engineer_clock_events" USING btree ("engineer_id","recorded_at");--> statement-breakpoint
CREATE INDEX "engineer_locations_tenant_recorded_idx" ON "engineer_locations" USING btree ("tenant_id","recorded_at");--> statement-breakpoint
CREATE INDEX "engineer_locations_engineer_recorded_idx" ON "engineer_locations" USING btree ("engineer_id","recorded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "engineers_tenant_code_uidx" ON "engineers" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "engineers_tenant_status_idx" ON "engineers" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "engineers_tenant_region_idx" ON "engineers" USING btree ("tenant_id","region");--> statement-breakpoint
CREATE UNIQUE INDEX "fault_reports_tenant_number_uidx" ON "fault_reports" USING btree ("tenant_id","report_number");--> statement-breakpoint
CREATE INDEX "fault_reports_tenant_status_idx" ON "fault_reports" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "fault_reports_hospital_created_idx" ON "fault_reports" USING btree ("hospital_id","created_at");--> statement-breakpoint
CREATE INDEX "file_attachments_owner_idx" ON "file_attachments" USING btree ("owner_type","owner_id");--> statement-breakpoint
CREATE INDEX "file_attachments_tenant_idx" ON "file_attachments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "geofence_events_job_created_idx" ON "geofence_events" USING btree ("job_id","created_at");--> statement-breakpoint
CREATE INDEX "geofence_events_tenant_type_idx" ON "geofence_events" USING btree ("tenant_id","event_type");--> statement-breakpoint
CREATE UNIQUE INDEX "hospitals_tenant_code_uidx" ON "hospitals" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "hospitals_tenant_name_idx" ON "hospitals" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "job_costs_job_uidx" ON "job_costs" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_costs_tenant_calculated_idx" ON "job_costs" USING btree ("tenant_id","calculated_at");--> statement-breakpoint
CREATE INDEX "job_expenses_job_idx" ON "job_expenses" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_expenses_engineer_logged_idx" ON "job_expenses" USING btree ("engineer_id","logged_at");--> statement-breakpoint
CREATE INDEX "job_parts_usage_job_idx" ON "job_parts_usage" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_parts_usage_tenant_billable_idx" ON "job_parts_usage" USING btree ("tenant_id","is_billable");--> statement-breakpoint
CREATE INDEX "job_state_events_job_created_idx" ON "job_state_events" USING btree ("job_id","created_at");--> statement-breakpoint
CREATE INDEX "job_state_events_tenant_created_idx" ON "job_state_events" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "job_timers_job_idx" ON "job_timers" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_timers_engineer_started_idx" ON "job_timers" USING btree ("engineer_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_tenant_number_uidx" ON "jobs" USING btree ("tenant_id","job_number");--> statement-breakpoint
CREATE INDEX "jobs_tenant_status_idx" ON "jobs" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "jobs_tenant_schedule_idx" ON "jobs" USING btree ("tenant_id","scheduled_start_at");--> statement-breakpoint
CREATE INDEX "jobs_engineer_status_idx" ON "jobs" USING btree ("assigned_engineer_id","status");--> statement-breakpoint
CREATE INDEX "jobs_asset_idx" ON "jobs" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "manual_qa_queries_tenant_created_idx" ON "manual_qa_queries" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "manual_qa_queries_job_idx" ON "manual_qa_queries" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "nfc_events_tenant_created_idx" ON "nfc_events" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "nfc_events_job_idx" ON "nfc_events" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "nfc_events_asset_idx" ON "nfc_events" USING btree ("asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nfc_tags_tenant_uid_uidx" ON "nfc_tags" USING btree ("tenant_id","uid");--> statement-breakpoint
CREATE INDEX "nfc_tags_asset_idx" ON "nfc_tags" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "opportunistic_pm_alerts_tenant_created_idx" ON "opportunistic_pm_alerts" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "opportunistic_pm_alerts_unique_uidx" ON "opportunistic_pm_alerts" USING btree ("engineer_id","asset_id","pm_due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "part_inventory_part_location_uidx" ON "part_inventory" USING btree ("part_id","location_name");--> statement-breakpoint
CREATE INDEX "part_inventory_tenant_idx" ON "part_inventory" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "parts_tenant_part_number_uidx" ON "parts" USING btree ("tenant_id","part_number");--> statement-breakpoint
CREATE INDEX "parts_tenant_name_idx" ON "parts" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "parts_shortages_tenant_number_uidx" ON "parts_shortages" USING btree ("tenant_id","shortage_number");--> statement-breakpoint
CREATE INDEX "parts_shortages_tenant_status_idx" ON "parts_shortages" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "parts_shortages_job_idx" ON "parts_shortages" USING btree ("job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_model_parts_model_part_uidx" ON "product_model_parts" USING btree ("product_model_id","part_id");--> statement-breakpoint
CREATE INDEX "product_model_parts_tenant_idx" ON "product_model_parts" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_models_tenant_code_uidx" ON "product_models" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "product_models_tenant_name_idx" ON "product_models" USING btree ("tenant_id","model_name");--> statement-breakpoint
CREATE INDEX "push_notifications_tenant_status_idx" ON "push_notifications" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "push_notifications_recipient_created_idx" ON "push_notifications" USING btree ("recipient_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "report_snapshots_tenant_period_uidx" ON "report_snapshots" USING btree ("tenant_id","period","period_start","period_end");--> statement-breakpoint
CREATE INDEX "service_manual_sections_manual_page_idx" ON "service_manual_sections" USING btree ("manual_id","page_number");--> statement-breakpoint
CREATE INDEX "service_manual_sections_embedding_idx" ON "service_manual_sections" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "service_manuals_tenant_model_idx" ON "service_manuals" USING btree ("tenant_id","product_model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_manuals_model_version_uidx" ON "service_manuals" USING btree ("product_model_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "system_parameters_tenant_key_uidx" ON "system_parameters" USING btree ("tenant_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_memberships_tenant_user_role_uidx" ON "tenant_memberships" USING btree ("tenant_id","user_id","role");--> statement-breakpoint
CREATE INDEX "tenant_memberships_user_idx" ON "tenant_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "websocket_events_tenant_created_idx" ON "websocket_events" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "websocket_events_channel_idx" ON "websocket_events" USING btree ("channel");
