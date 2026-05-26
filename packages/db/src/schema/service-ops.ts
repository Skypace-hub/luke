import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	vector,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const tenantRoleEnum = pgEnum("tenant_role", [
	"super_admin",
	"tenant_admin",
	"operator",
	"observer",
]);

export const membershipStatusEnum = pgEnum("membership_status", [
	"active",
	"invited",
	"suspended",
]);

export const engineerStatusEnum = pgEnum("engineer_status", [
	"on_site",
	"in_transit",
	"idle",
	"timer_anomaly",
	"off_duty",
]);

export const jobTypeEnum = pgEnum("job_type", [
	"installation",
	"repair",
	"preventive_maintenance",
]);

export const jobPriorityEnum = pgEnum("job_priority", ["normal", "urgent"]);

export const jobStatusEnum = pgEnum("job_status", [
	"created",
	"assigned",
	"in_progress",
	"paused",
	"resumed",
	"completed",
	"timer_anomaly",
	"cancelled",
]);

export const contractTypeEnum = pgEnum("contract_type", [
	"full",
	"partial",
	"emergency_only",
]);

export const contractStatusEnum = pgEnum("contract_status", [
	"active",
	"expiring",
	"expired",
]);

export const coverageStatusEnum = pgEnum("coverage_status", [
	"in_contract",
	"out_of_contract",
	"billable_exception",
	"expired",
]);

export const nfcTagStatusEnum = pgEnum("nfc_tag_status", [
	"blank",
	"commissioned",
	"damaged",
	"unreadable",
	"replaced",
	"retired",
]);

export const nfcEventTypeEnum = pgEnum("nfc_event_type", [
	"commissioned",
	"scanned_for_info",
	"job_start",
	"job_end",
	"replacement_requested",
	"replaced",
	"rejected",
]);

export const clockEventTypeEnum = pgEnum("clock_event_type", [
	"clock_in",
	"clock_out",
]);

export const geofenceEventTypeEnum = pgEnum("geofence_event_type", [
	"activated",
	"entered",
	"exited",
	"timer_anomaly",
	"resolved",
]);

export const faultSeverityEnum = pgEnum("fault_severity", [
	"low",
	"medium",
	"high",
	"critical",
]);

export const faultStatusEnum = pgEnum("fault_status", [
	"received",
	"engineer_assigned",
	"in_progress",
	"resolved",
]);

export const faultSourceEnum = pgEnum("fault_source", [
	"hospital_web",
	"back_office",
]);

export const shortageStatusEnum = pgEnum("shortage_status", [
	"waiting_for_parts",
	"arrived",
	"reschedule_ready",
	"closed",
]);

export const expenseTypeEnum = pgEnum("expense_type", [
	"mileage",
	"meal",
	"parking",
	"other",
]);

export const manualStatusEnum = pgEnum("manual_status", [
	"uploaded",
	"indexed",
	"failed",
	"retired",
]);

export const attachmentOwnerTypeEnum = pgEnum("attachment_owner_type", [
	"fault_report",
	"job_expense",
	"service_manual",
	"job",
]);

export const systemParameterValueTypeEnum = pgEnum(
	"system_parameter_value_type",
	["number", "string", "secret", "boolean"]
);

export const notificationTypeEnum = pgEnum("notification_type", [
	"job_assigned",
	"job_resumed",
	"geofence_alert",
	"status_changed",
	"parts_arrived",
	"contract_expiry",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
	"queued",
	"sent",
	"read",
	"failed",
]);

export const reportPeriodEnum = pgEnum("report_period", [
	"day",
	"week",
	"month",
]);

export const tenants = pgTable("tenants", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	region: text("region").notNull(),
	releaseLabel: text("release_label").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const tenantMemberships = pgTable(
	"tenant_memberships",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: tenantRoleEnum("role").notNull(),
		status: membershipStatusEnum("status").default("active").notNull(),
		permissions: jsonb("permissions").$type<string[]>().default([]).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("tenant_memberships_tenant_user_uidx").on(
			table.tenantId,
			table.userId
		),
		index("tenant_memberships_tenant_idx").on(table.tenantId),
		index("tenant_memberships_user_idx").on(table.userId),
	]
);

export const hospitals = pgTable(
	"hospitals",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		code: text("code").notNull(),
		name: text("name").notNull(),
		district: text("district").notNull(),
		address: text("address"),
		latitude: numeric("latitude", { precision: 10, scale: 7 }),
		longitude: numeric("longitude", { precision: 10, scale: 7 }),
		primaryContactName: text("primary_contact_name"),
		primaryContactEmail: text("primary_contact_email"),
		primaryContactPhone: text("primary_contact_phone"),
		isActive: boolean("is_active").default(true).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("hospitals_tenant_code_uidx").on(table.tenantId, table.code),
		index("hospitals_tenant_name_idx").on(table.tenantId, table.name),
	]
);

export const engineers = pgTable(
	"engineers",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
		code: text("code").notNull(),
		name: text("name").notNull(),
		email: text("email"),
		phone: text("phone"),
		grade: text("grade").notNull(),
		status: engineerStatusEnum("status").default("idle").notNull(),
		region: text("region").notNull(),
		hourlyRateHkd: numeric("hourly_rate_hkd", {
			precision: 10,
			scale: 2,
		}).notNull(),
		mileageRateHkdPerKm: numeric("mileage_rate_hkd_per_km", {
			precision: 10,
			scale: 2,
		}).notNull(),
		mealCapHkd: numeric("meal_cap_hkd", { precision: 10, scale: 2 }).notNull(),
		gpsTrackingEnabled: boolean("gps_tracking_enabled").default(true).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("engineers_tenant_code_uidx").on(table.tenantId, table.code),
		index("engineers_tenant_status_idx").on(table.tenantId, table.status),
		index("engineers_tenant_region_idx").on(table.tenantId, table.region),
	]
);

export const productModels = pgTable(
	"product_models",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		code: text("code").notNull(),
		modelName: text("model_name").notNull(),
		manufacturer: text("manufacturer").notNull(),
		category: text("category").notNull(),
		defaultPmCycleMonths: integer("default_pm_cycle_months").notNull(),
		isEngineerReadOnly: boolean("is_engineer_read_only")
			.default(true)
			.notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("product_models_tenant_code_uidx").on(
			table.tenantId,
			table.code
		),
		index("product_models_tenant_name_idx").on(table.tenantId, table.modelName),
	]
);

export const parts = pgTable(
	"parts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		partNumber: text("part_number").notNull(),
		name: text("name").notNull(),
		supplier: text("supplier").notNull(),
		unitCostHkd: numeric("unit_cost_hkd", {
			precision: 10,
			scale: 2,
		}).notNull(),
		isActive: boolean("is_active").default(true).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("parts_tenant_part_number_uidx").on(
			table.tenantId,
			table.partNumber
		),
		index("parts_tenant_name_idx").on(table.tenantId, table.name),
	]
);

export const productModelParts = pgTable(
	"product_model_parts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		productModelId: uuid("product_model_id")
			.notNull()
			.references(() => productModels.id, { onDelete: "cascade" }),
		partId: uuid("part_id")
			.notNull()
			.references(() => parts.id, { onDelete: "cascade" }),
		defaultQuantity: integer("default_quantity").default(1).notNull(),
		notes: text("notes"),
	},
	(table) => [
		uniqueIndex("product_model_parts_model_part_uidx").on(
			table.productModelId,
			table.partId
		),
		index("product_model_parts_tenant_idx").on(table.tenantId),
	]
);

export const contracts = pgTable(
	"contracts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		hospitalId: uuid("hospital_id")
			.notNull()
			.references(() => hospitals.id, { onDelete: "restrict" }),
		contractNumber: text("contract_number").notNull(),
		type: contractTypeEnum("type").notNull(),
		status: contractStatusEnum("status").default("active").notNull(),
		startDate: date("start_date").notNull(),
		endDate: date("end_date").notNull(),
		responseSlaHours: integer("response_sla_hours").notNull(),
		accountManagerName: text("account_manager_name").notNull(),
		primaryContactName: text("primary_contact_name"),
		primaryContactEmail: text("primary_contact_email"),
		warningDays: integer("warning_days").default(30).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("contracts_tenant_number_uidx").on(
			table.tenantId,
			table.contractNumber
		),
		index("contracts_tenant_status_end_idx").on(
			table.tenantId,
			table.status,
			table.endDate
		),
		index("contracts_hospital_idx").on(table.hospitalId),
	]
);

export const contractModelCoverage = pgTable(
	"contract_model_coverage",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		contractId: uuid("contract_id")
			.notNull()
			.references(() => contracts.id, { onDelete: "cascade" }),
		productModelId: uuid("product_model_id")
			.notNull()
			.references(() => productModels.id, { onDelete: "cascade" }),
		coverageStatus: coverageStatusEnum("coverage_status").notNull(),
		notes: text("notes"),
	},
	(table) => [
		uniqueIndex("contract_model_coverage_contract_model_uidx").on(
			table.contractId,
			table.productModelId
		),
		index("contract_model_coverage_tenant_idx").on(table.tenantId),
	]
);

export const contractPartCoverage = pgTable(
	"contract_part_coverage",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		contractId: uuid("contract_id")
			.notNull()
			.references(() => contracts.id, { onDelete: "cascade" }),
		partId: uuid("part_id")
			.notNull()
			.references(() => parts.id, { onDelete: "cascade" }),
		coverageStatus: coverageStatusEnum("coverage_status").notNull(),
		notes: text("notes"),
	},
	(table) => [
		uniqueIndex("contract_part_coverage_contract_part_uidx").on(
			table.contractId,
			table.partId
		),
		index("contract_part_coverage_tenant_idx").on(table.tenantId),
	]
);

export const assets = pgTable(
	"assets",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		assetNumber: text("asset_number").notNull(),
		productModelId: uuid("product_model_id")
			.notNull()
			.references(() => productModels.id, { onDelete: "restrict" }),
		hospitalId: uuid("hospital_id")
			.notNull()
			.references(() => hospitals.id, { onDelete: "restrict" }),
		serialNumber: text("serial_number").notNull(),
		locationLabel: text("location_label").notNull(),
		installationDate: date("installation_date"),
		warrantyExpiryDate: date("warranty_expiry_date"),
		nextPmDueDate: date("next_pm_due_date"),
		designatedEngineerId: uuid("designated_engineer_id").references(
			() => engineers.id,
			{ onDelete: "set null" }
		),
		contractCoverageStatus: coverageStatusEnum("contract_coverage_status")
			.default("in_contract")
			.notNull(),
		nfcUid: text("nfc_uid").notNull(),
		nfcVersion: integer("nfc_version").default(1).notNull(),
		isActive: boolean("is_active").default(true).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("assets_tenant_asset_number_uidx").on(
			table.tenantId,
			table.assetNumber
		),
		uniqueIndex("assets_tenant_serial_uidx").on(
			table.tenantId,
			table.serialNumber
		),
		uniqueIndex("assets_tenant_nfc_uidx").on(table.tenantId, table.nfcUid),
		index("assets_tenant_hospital_idx").on(table.tenantId, table.hospitalId),
		index("assets_tenant_pm_due_idx").on(table.tenantId, table.nextPmDueDate),
	]
);

export const nfcTags = pgTable(
	"nfc_tags",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		assetId: uuid("asset_id")
			.notNull()
			.references(() => assets.id, { onDelete: "cascade" }),
		uid: text("uid").notNull(),
		version: integer("version").default(1).notNull(),
		ndefPayload: jsonb("ndef_payload")
			.$type<{ uid: string; v: number }>()
			.notNull(),
		status: nfcTagStatusEnum("status").default("commissioned").notNull(),
		commissionedByEngineerId: uuid("commissioned_by_engineer_id").references(
			() => engineers.id,
			{ onDelete: "set null" }
		),
		commissionedAt: timestamp("commissioned_at", { withTimezone: true }),
		replacedByTagId: uuid("replaced_by_tag_id"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("nfc_tags_tenant_uid_uidx").on(table.tenantId, table.uid),
		index("nfc_tags_asset_idx").on(table.assetId),
	]
);

export const jobs = pgTable(
	"jobs",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		jobNumber: text("job_number").notNull(),
		type: jobTypeEnum("type").notNull(),
		status: jobStatusEnum("status").default("created").notNull(),
		priority: jobPriorityEnum("priority").default("normal").notNull(),
		assetId: uuid("asset_id")
			.notNull()
			.references(() => assets.id, { onDelete: "restrict" }),
		hospitalId: uuid("hospital_id")
			.notNull()
			.references(() => hospitals.id, { onDelete: "restrict" }),
		assignedEngineerId: uuid("assigned_engineer_id").references(
			() => engineers.id,
			{ onDelete: "set null" }
		),
		description: text("description").notNull(),
		scheduledStartAt: timestamp("scheduled_start_at", { withTimezone: true }),
		scheduledEndAt: timestamp("scheduled_end_at", { withTimezone: true }),
		actualStartedAt: timestamp("actual_started_at", { withTimezone: true }),
		actualCompletedAt: timestamp("actual_completed_at", { withTimezone: true }),
		createdByUserId: text("created_by_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("jobs_tenant_number_uidx").on(table.tenantId, table.jobNumber),
		index("jobs_tenant_status_idx").on(table.tenantId, table.status),
		index("jobs_tenant_schedule_idx").on(
			table.tenantId,
			table.scheduledStartAt
		),
		index("jobs_engineer_status_idx").on(
			table.assignedEngineerId,
			table.status
		),
		index("jobs_asset_idx").on(table.assetId),
	]
);

export const jobStateEvents = pgTable(
	"job_state_events",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		jobId: uuid("job_id")
			.notNull()
			.references(() => jobs.id, { onDelete: "cascade" }),
		fromStatus: jobStatusEnum("from_status"),
		toStatus: jobStatusEnum("to_status").notNull(),
		actorUserId: text("actor_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		actorEngineerId: uuid("actor_engineer_id").references(() => engineers.id, {
			onDelete: "set null",
		}),
		eventLabel: text("event_label").notNull(),
		notes: text("notes"),
		metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("job_state_events_job_created_idx").on(table.jobId, table.createdAt),
		index("job_state_events_tenant_created_idx").on(
			table.tenantId,
			table.createdAt
		),
	]
);

export const nfcEvents = pgTable(
	"nfc_events",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		assetId: uuid("asset_id").references(() => assets.id, {
			onDelete: "set null",
		}),
		tagId: uuid("tag_id").references(() => nfcTags.id, {
			onDelete: "set null",
		}),
		jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
		engineerId: uuid("engineer_id").references(() => engineers.id, {
			onDelete: "set null",
		}),
		eventType: nfcEventTypeEnum("event_type").notNull(),
		readUid: text("read_uid").notNull(),
		expectedUid: text("expected_uid"),
		accepted: boolean("accepted").notNull(),
		rejectionReason: text("rejection_reason"),
		payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("nfc_events_tenant_created_idx").on(table.tenantId, table.createdAt),
		index("nfc_events_job_idx").on(table.jobId),
		index("nfc_events_asset_idx").on(table.assetId),
	]
);

export const jobTimers = pgTable(
	"job_timers",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		jobId: uuid("job_id")
			.notNull()
			.references(() => jobs.id, { onDelete: "cascade" }),
		engineerId: uuid("engineer_id")
			.notNull()
			.references(() => engineers.id, { onDelete: "restrict" }),
		startNfcEventId: uuid("start_nfc_event_id").references(() => nfcEvents.id, {
			onDelete: "set null",
		}),
		endNfcEventId: uuid("end_nfc_event_id").references(() => nfcEvents.id, {
			onDelete: "set null",
		}),
		startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
		endedAt: timestamp("ended_at", { withTimezone: true }),
		durationMinutes: integer("duration_minutes").default(0).notNull(),
		isAnomaly: boolean("is_anomaly").default(false).notNull(),
	},
	(table) => [
		index("job_timers_job_idx").on(table.jobId),
		index("job_timers_engineer_started_idx").on(
			table.engineerId,
			table.startedAt
		),
	]
);

export const engineerClockEvents = pgTable(
	"engineer_clock_events",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		engineerId: uuid("engineer_id")
			.notNull()
			.references(() => engineers.id, { onDelete: "cascade" }),
		eventType: clockEventTypeEnum("event_type").notNull(),
		latitude: numeric("latitude", { precision: 10, scale: 7 }),
		longitude: numeric("longitude", { precision: 10, scale: 7 }),
		accuracyMeters: numeric("accuracy_meters", { precision: 8, scale: 2 }),
		recordedAt: timestamp("recorded_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("engineer_clock_events_engineer_recorded_idx").on(
			table.engineerId,
			table.recordedAt
		),
	]
);

export const engineerLocations = pgTable(
	"engineer_locations",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		engineerId: uuid("engineer_id")
			.notNull()
			.references(() => engineers.id, { onDelete: "cascade" }),
		jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
		latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
		longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
		accuracyMeters: numeric("accuracy_meters", { precision: 8, scale: 2 }),
		recordedAt: timestamp("recorded_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("engineer_locations_tenant_recorded_idx").on(
			table.tenantId,
			table.recordedAt
		),
		index("engineer_locations_engineer_recorded_idx").on(
			table.engineerId,
			table.recordedAt
		),
	]
);

export const geofenceEvents = pgTable(
	"geofence_events",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		jobId: uuid("job_id")
			.notNull()
			.references(() => jobs.id, { onDelete: "cascade" }),
		engineerId: uuid("engineer_id")
			.notNull()
			.references(() => engineers.id, { onDelete: "restrict" }),
		hospitalId: uuid("hospital_id")
			.notNull()
			.references(() => hospitals.id, { onDelete: "restrict" }),
		eventType: geofenceEventTypeEnum("event_type").notNull(),
		latitude: numeric("latitude", { precision: 10, scale: 7 }),
		longitude: numeric("longitude", { precision: 10, scale: 7 }),
		distanceMeters: numeric("distance_meters", { precision: 8, scale: 2 }),
		radiusMeters: integer("radius_meters").default(200).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("geofence_events_job_created_idx").on(table.jobId, table.createdAt),
		index("geofence_events_tenant_type_idx").on(
			table.tenantId,
			table.eventType
		),
	]
);

export const opportunisticPmAlerts = pgTable(
	"opportunistic_pm_alerts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		engineerId: uuid("engineer_id")
			.notNull()
			.references(() => engineers.id, { onDelete: "cascade" }),
		assetId: uuid("asset_id")
			.notNull()
			.references(() => assets.id, { onDelete: "cascade" }),
		sourceJobId: uuid("source_job_id").references(() => jobs.id, {
			onDelete: "set null",
		}),
		pmDueDate: date("pm_due_date").notNull(),
		daysUntilDue: integer("days_until_due").notNull(),
		status: text("status").default("open").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("opportunistic_pm_alerts_tenant_created_idx").on(
			table.tenantId,
			table.createdAt
		),
		uniqueIndex("opportunistic_pm_alerts_unique_uidx").on(
			table.engineerId,
			table.assetId,
			table.pmDueDate
		),
	]
);

export const faultReports = pgTable(
	"fault_reports",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		reportNumber: text("report_number").notNull(),
		hospitalId: uuid("hospital_id")
			.notNull()
			.references(() => hospitals.id, { onDelete: "restrict" }),
		assetId: uuid("asset_id").references(() => assets.id, {
			onDelete: "set null",
		}),
		convertedJobId: uuid("converted_job_id").references(() => jobs.id, {
			onDelete: "set null",
		}),
		source: faultSourceEnum("source").notNull(),
		severity: faultSeverityEnum("severity").notNull(),
		status: faultStatusEnum("status").default("received").notNull(),
		submittedByName: text("submitted_by_name").notNull(),
		submittedByContact: text("submitted_by_contact"),
		description: text("description").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("fault_reports_tenant_number_uidx").on(
			table.tenantId,
			table.reportNumber
		),
		index("fault_reports_tenant_status_idx").on(table.tenantId, table.status),
		index("fault_reports_hospital_created_idx").on(
			table.hospitalId,
			table.createdAt
		),
	]
);

export const partInventory = pgTable(
	"part_inventory",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		partId: uuid("part_id")
			.notNull()
			.references(() => parts.id, { onDelete: "cascade" }),
		locationName: text("location_name").default("Main store").notNull(),
		stockOnHand: integer("stock_on_hand").default(0).notNull(),
		minimumStock: integer("minimum_stock").default(0).notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("part_inventory_part_location_uidx").on(
			table.partId,
			table.locationName
		),
		index("part_inventory_tenant_idx").on(table.tenantId),
	]
);

export const partsShortages = pgTable(
	"parts_shortages",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		shortageNumber: text("shortage_number").notNull(),
		jobId: uuid("job_id")
			.notNull()
			.references(() => jobs.id, { onDelete: "cascade" }),
		partId: uuid("part_id")
			.notNull()
			.references(() => parts.id, { onDelete: "restrict" }),
		engineerId: uuid("engineer_id").references(() => engineers.id, {
			onDelete: "set null",
		}),
		quantityRequested: integer("quantity_requested").default(1).notNull(),
		status: shortageStatusEnum("status").default("waiting_for_parts").notNull(),
		notes: text("notes"),
		reportedAt: timestamp("reported_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		arrivedAt: timestamp("arrived_at", { withTimezone: true }),
		confirmedByUserId: text("confirmed_by_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
	},
	(table) => [
		uniqueIndex("parts_shortages_tenant_number_uidx").on(
			table.tenantId,
			table.shortageNumber
		),
		index("parts_shortages_tenant_status_idx").on(table.tenantId, table.status),
		index("parts_shortages_job_idx").on(table.jobId),
	]
);

export const jobPartsUsage = pgTable(
	"job_parts_usage",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		jobId: uuid("job_id")
			.notNull()
			.references(() => jobs.id, { onDelete: "cascade" }),
		partId: uuid("part_id")
			.notNull()
			.references(() => parts.id, { onDelete: "restrict" }),
		quantity: integer("quantity").default(1).notNull(),
		unitCostHkd: numeric("unit_cost_hkd", {
			precision: 10,
			scale: 2,
		}).notNull(),
		coverageStatus: coverageStatusEnum("coverage_status").notNull(),
		isBillable: boolean("is_billable").default(false).notNull(),
		usedAt: timestamp("used_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("job_parts_usage_job_idx").on(table.jobId),
		index("job_parts_usage_tenant_billable_idx").on(
			table.tenantId,
			table.isBillable
		),
	]
);

export const jobExpenses = pgTable(
	"job_expenses",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		jobId: uuid("job_id")
			.notNull()
			.references(() => jobs.id, { onDelete: "cascade" }),
		engineerId: uuid("engineer_id")
			.notNull()
			.references(() => engineers.id, { onDelete: "restrict" }),
		type: expenseTypeEnum("type").notNull(),
		quantity: numeric("quantity", { precision: 10, scale: 2 }),
		amountHkd: numeric("amount_hkd", { precision: 10, scale: 2 }).notNull(),
		receiptAttachmentId: uuid("receipt_attachment_id"),
		notes: text("notes"),
		loggedAt: timestamp("logged_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("job_expenses_job_idx").on(table.jobId),
		index("job_expenses_engineer_logged_idx").on(
			table.engineerId,
			table.loggedAt
		),
	]
);

export const jobCosts = pgTable(
	"job_costs",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		jobId: uuid("job_id")
			.notNull()
			.references(() => jobs.id, { onDelete: "cascade" }),
		labourMinutes: integer("labour_minutes").default(0).notNull(),
		labourRateHkd: numeric("labour_rate_hkd", {
			precision: 10,
			scale: 2,
		}).notNull(),
		labourCostHkd: numeric("labour_cost_hkd", {
			precision: 10,
			scale: 2,
		}).notNull(),
		mileageCostHkd: numeric("mileage_cost_hkd", {
			precision: 10,
			scale: 2,
		}).default("0"),
		mealCostHkd: numeric("meal_cost_hkd", { precision: 10, scale: 2 }).default(
			"0"
		),
		partsAbsorbedHkd: numeric("parts_absorbed_hkd", {
			precision: 10,
			scale: 2,
		}).default("0"),
		partsBillableHkd: numeric("parts_billable_hkd", {
			precision: 10,
			scale: 2,
		}).default("0"),
		totalInternalCostHkd: numeric("total_internal_cost_hkd", {
			precision: 10,
			scale: 2,
		}).notNull(),
		totalBillableHkd: numeric("total_billable_hkd", {
			precision: 10,
			scale: 2,
		}).notNull(),
		calculatedAt: timestamp("calculated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("job_costs_job_uidx").on(table.jobId),
		index("job_costs_tenant_calculated_idx").on(
			table.tenantId,
			table.calculatedAt
		),
	]
);

export const serviceManuals = pgTable(
	"service_manuals",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		productModelId: uuid("product_model_id")
			.notNull()
			.references(() => productModels.id, { onDelete: "cascade" }),
		fileName: text("file_name").notNull(),
		storageKey: text("storage_key").notNull(),
		fileUrl: text("file_url").notNull(),
		mimeType: text("mime_type").default("application/pdf").notNull(),
		pageCount: integer("page_count"),
		version: text("version").default("1").notNull(),
		status: manualStatusEnum("status").default("uploaded").notNull(),
		uploadedByUserId: text("uploaded_by_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		uploadedAt: timestamp("uploaded_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("service_manuals_tenant_model_idx").on(
			table.tenantId,
			table.productModelId
		),
		uniqueIndex("service_manuals_model_version_uidx").on(
			table.productModelId,
			table.version
		),
	]
);

export const serviceManualSections = pgTable(
	"service_manual_sections",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		manualId: uuid("manual_id")
			.notNull()
			.references(() => serviceManuals.id, { onDelete: "cascade" }),
		pageNumber: integer("page_number").notNull(),
		sectionTitle: text("section_title").notNull(),
		content: text("content").notNull(),
		embedding: vector("embedding", { dimensions: 1536 }),
		metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
	},
	(table) => [
		index("service_manual_sections_manual_page_idx").on(
			table.manualId,
			table.pageNumber
		),
		index("service_manual_sections_embedding_idx").using(
			"hnsw",
			table.embedding.op("vector_cosine_ops")
		),
	]
);

export const manualQaQueries = pgTable(
	"manual_qa_queries",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		engineerId: uuid("engineer_id").references(() => engineers.id, {
			onDelete: "set null",
		}),
		assetId: uuid("asset_id").references(() => assets.id, {
			onDelete: "set null",
		}),
		jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
		manualId: uuid("manual_id").references(() => serviceManuals.id, {
			onDelete: "set null",
		}),
		question: text("question").notNull(),
		topSectionIds: jsonb("top_section_ids").$type<string[]>().default([]),
		answerSummary: text("answer_summary"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("manual_qa_queries_tenant_created_idx").on(
			table.tenantId,
			table.createdAt
		),
		index("manual_qa_queries_job_idx").on(table.jobId),
	]
);

export const fileAttachments = pgTable(
	"file_attachments",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		ownerType: attachmentOwnerTypeEnum("owner_type").notNull(),
		ownerId: uuid("owner_id").notNull(),
		fileName: text("file_name").notNull(),
		storageKey: text("storage_key").notNull(),
		fileUrl: text("file_url").notNull(),
		mimeType: text("mime_type").notNull(),
		fileSizeBytes: integer("file_size_bytes"),
		uploadedByUserId: text("uploaded_by_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("file_attachments_owner_idx").on(table.ownerType, table.ownerId),
		index("file_attachments_tenant_idx").on(table.tenantId),
	]
);

export const systemParameters = pgTable(
	"system_parameters",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		key: text("key").notNull(),
		value: jsonb("value").$type<unknown>().notNull(),
		valueType: systemParameterValueTypeEnum("value_type").notNull(),
		description: text("description").notNull(),
		updatedByUserId: text("updated_by_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("system_parameters_tenant_key_uidx").on(
			table.tenantId,
			table.key
		),
	]
);

export const pushNotifications = pgTable(
	"push_notifications",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		recipientUserId: text("recipient_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		engineerId: uuid("engineer_id").references(() => engineers.id, {
			onDelete: "set null",
		}),
		jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
		type: notificationTypeEnum("type").notNull(),
		status: notificationStatusEnum("status").default("queued").notNull(),
		title: text("title").notNull(),
		body: text("body").notNull(),
		payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		sentAt: timestamp("sent_at", { withTimezone: true }),
		readAt: timestamp("read_at", { withTimezone: true }),
	},
	(table) => [
		index("push_notifications_tenant_status_idx").on(
			table.tenantId,
			table.status
		),
		index("push_notifications_recipient_created_idx").on(
			table.recipientUserId,
			table.createdAt
		),
	]
);

export const websocketEvents = pgTable(
	"websocket_events",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		channel: text("channel").notNull(),
		eventType: text("event_type").notNull(),
		entityType: text("entity_type").notNull(),
		entityId: text("entity_id").notNull(),
		payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("websocket_events_tenant_created_idx").on(
			table.tenantId,
			table.createdAt
		),
		index("websocket_events_channel_idx").on(table.channel),
	]
);

export const reportSnapshots = pgTable(
	"report_snapshots",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenants.id, { onDelete: "cascade" }),
		period: reportPeriodEnum("period").notNull(),
		periodStart: date("period_start").notNull(),
		periodEnd: date("period_end").notNull(),
		metrics: jsonb("metrics").$type<Record<string, unknown>>().notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("report_snapshots_tenant_period_uidx").on(
			table.tenantId,
			table.period,
			table.periodStart,
			table.periodEnd
		),
	]
);

export const tenantsRelations = relations(tenants, ({ many }) => ({
	assets: many(assets),
	contracts: many(contracts),
	engineers: many(engineers),
	faultReports: many(faultReports),
	hospitals: many(hospitals),
	jobs: many(jobs),
	memberships: many(tenantMemberships),
	productModels: many(productModels),
}));

export const hospitalsRelations = relations(hospitals, ({ many, one }) => ({
	assets: many(assets),
	contracts: many(contracts),
	faultReports: many(faultReports),
	jobs: many(jobs),
	tenant: one(tenants, {
		fields: [hospitals.tenantId],
		references: [tenants.id],
	}),
}));

export const engineersRelations = relations(engineers, ({ many, one }) => ({
	clockEvents: many(engineerClockEvents),
	jobs: many(jobs),
	locations: many(engineerLocations),
	tenant: one(tenants, {
		fields: [engineers.tenantId],
		references: [tenants.id],
	}),
	user: one(user, {
		fields: [engineers.userId],
		references: [user.id],
	}),
}));

export const assetsRelations = relations(assets, ({ many, one }) => ({
	designatedEngineer: one(engineers, {
		fields: [assets.designatedEngineerId],
		references: [engineers.id],
	}),
	hospital: one(hospitals, {
		fields: [assets.hospitalId],
		references: [hospitals.id],
	}),
	jobs: many(jobs),
	nfcTags: many(nfcTags),
	productModel: one(productModels, {
		fields: [assets.productModelId],
		references: [productModels.id],
	}),
	tenant: one(tenants, {
		fields: [assets.tenantId],
		references: [tenants.id],
	}),
}));

export const jobsRelations = relations(jobs, ({ many, one }) => ({
	asset: one(assets, {
		fields: [jobs.assetId],
		references: [assets.id],
	}),
	assignedEngineer: one(engineers, {
		fields: [jobs.assignedEngineerId],
		references: [engineers.id],
	}),
	cost: one(jobCosts),
	expenses: many(jobExpenses),
	hospital: one(hospitals, {
		fields: [jobs.hospitalId],
		references: [hospitals.id],
	}),
	nfcEvents: many(nfcEvents),
	partsUsage: many(jobPartsUsage),
	shortages: many(partsShortages),
	stateEvents: many(jobStateEvents),
	timers: many(jobTimers),
}));

export const productModelsRelations = relations(
	productModels,
	({ many, one }) => ({
		assets: many(assets),
		manuals: many(serviceManuals),
		parts: many(productModelParts),
		tenant: one(tenants, {
			fields: [productModels.tenantId],
			references: [tenants.id],
		}),
	})
);

export const contractsRelations = relations(contracts, ({ many, one }) => ({
	hospital: one(hospitals, {
		fields: [contracts.hospitalId],
		references: [hospitals.id],
	}),
	modelCoverage: many(contractModelCoverage),
	partCoverage: many(contractPartCoverage),
	tenant: one(tenants, {
		fields: [contracts.tenantId],
		references: [tenants.id],
	}),
}));
