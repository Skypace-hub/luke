import type {
	Asset,
	Contract,
	Engineer,
	FaultReport,
	Hospital,
	Job,
	Part,
	ProductModel,
	ServiceOpsSnapshot,
	TenantManagementRecord,
	TenantUserRecord,
} from "@/lib/service-ops-data";

export type CrudEntity =
	| "asset"
	| "contract"
	| "engineer"
	| "fault"
	| "hospital"
	| "job"
	| "part"
	| "product"
	| "tenant"
	| "tenantUser";

export type CrudState =
	| { entity: CrudEntity; mode: "create"; record?: never }
	| { entity: CrudEntity; mode: "edit"; record: unknown };

export type FormDefaultValue = boolean | number | string | string[];

export interface FieldOption {
	label: string;
	value: string;
}

export interface FieldConfig {
	label: string;
	max?: number;
	min?: number;
	multiple?: boolean;
	name: string;
	options?: FieldOption[];
	required?: boolean;
	type?:
		| "checkbox"
		| "date"
		| "datetime-local"
		| "number"
		| "select"
		| "textarea"
		| "text";
}

const coverageValues = [
	"in_contract",
	"out_of_contract",
	"billable_exception",
	"expired",
] as const;
const engineerStatusValues = [
	"on_site",
	"in_transit",
	"idle",
	"timer_anomaly",
	"off_duty",
] as const;
const jobTypeValues = [
	"installation",
	"repair",
	"preventive_maintenance",
] as const;
const jobStatusValues = [
	"created",
	"assigned",
	"in_progress",
	"paused",
	"resumed",
	"completed",
	"timer_anomaly",
	"cancelled",
] as const;
const priorityValues = ["normal", "urgent"] as const;
const contractTypeValues = ["full", "partial", "emergency_only"] as const;
const contractStatusValues = ["active", "expiring", "expired"] as const;
const faultSeverityValues = ["low", "medium", "high", "critical"] as const;
const faultStatusValues = [
	"received",
	"engineer_assigned",
	"in_progress",
	"resolved",
] as const;

type ContractStatusValue = (typeof contractStatusValues)[number];
type ContractTypeValue = (typeof contractTypeValues)[number];
type CoverageValue = (typeof coverageValues)[number];
type EngineerStatusValue = (typeof engineerStatusValues)[number];
type FaultSeverityValue = (typeof faultSeverityValues)[number];
type FaultStatusValue = (typeof faultStatusValues)[number];
type JobStatusValue = (typeof jobStatusValues)[number];
type JobTypeValue = (typeof jobTypeValues)[number];
type PriorityValue = (typeof priorityValues)[number];

interface AssetPayload {
	assetNumber: string;
	contractCoverageStatus: CoverageValue;
	designatedEngineerId: null | string;
	hospitalId: string;
	installationDate: null | string;
	locationLabel: string;
	nextPmDueDate: null | string;
	nfcUid: string;
	productModelId: string;
	serialNumber: string;
	warrantyExpiryDate: null | string;
}

interface ContractPayload {
	accountManagerName: string;
	contractNumber: string;
	coveredModelIds: string[];
	coveredPartIds: string[];
	endDate: string;
	hospitalId: string;
	responseSlaHours: number;
	startDate: string;
	status: ContractStatusValue;
	type: ContractTypeValue;
}

interface EngineerPayload {
	code: string;
	email: null | string;
	grade: string;
	hourlyRate: number;
	mealCap: number;
	mileageRate: number;
	name: string;
	phone: null | string;
	region: string;
	status: EngineerStatusValue;
}

interface FaultPayload {
	assetId: null | string;
	description: string;
	hospitalId: string;
	reportNumber: string;
	severity: FaultSeverityValue;
	status: FaultStatusValue;
	submittedByContact: null | string;
	submittedByName: string;
}

interface HospitalPayload {
	address: null | string;
	code: string;
	district: string;
	latitude: null | number;
	longitude: null | number;
	name: string;
	primaryContactEmail: null | string;
	primaryContactName: null | string;
	primaryContactPhone: null | string;
}

interface JobPayload {
	assetId: string;
	assignedEngineerId: null | string;
	description: string;
	hospitalId: string;
	jobNumber: string;
	priority: PriorityValue;
	scheduledStartAt: null | string;
	status: JobStatusValue;
	type: JobTypeValue;
}

interface PartPayload {
	minimumStock: number;
	name: string;
	partNumber: string;
	stockOnHand: number;
	supplier: string;
	unitCost: number;
}

interface ProductPayload {
	category: string;
	code: string;
	defaultPmCycleMonths: number;
	isEngineerReadOnly: boolean;
	manufacturer: string;
	modelName: string;
}

export interface TenantPayload {
	id: null | string;
	isActive: boolean;
	name: string;
	region: string;
	releaseLabel: string;
}

export interface TenantUserPayload {
	email: string;
	name: string;
	password: null | string;
	role: "operator" | "observer" | "tenant_admin";
	status: "active" | "invited" | "suspended";
}

export const entityLabels: Record<CrudEntity, string> = {
	asset: "asset",
	contract: "contract",
	engineer: "engineer",
	fault: "fault report",
	hospital: "hospital",
	job: "job",
	part: "part",
	product: "product",
	tenant: "tenant",
	tenantUser: "user",
};

const coverageOptions: FieldOption[] = [
	{ label: "In contract", value: "in_contract" },
	{ label: "Out of contract", value: "out_of_contract" },
	{ label: "Billable exception", value: "billable_exception" },
	{ label: "Expired", value: "expired" },
];

const engineerStatusOptions: FieldOption[] = [
	{ label: "On-site", value: "on_site" },
	{ label: "In transit", value: "in_transit" },
	{ label: "Idle", value: "idle" },
	{ label: "Timer anomaly", value: "timer_anomaly" },
	{ label: "Off duty", value: "off_duty" },
];

const jobTypeOptions: FieldOption[] = [
	{ label: "Installation", value: "installation" },
	{ label: "Repair", value: "repair" },
	{ label: "Preventive maintenance", value: "preventive_maintenance" },
];

const jobStatusOptions: FieldOption[] = [
	{ label: "Created", value: "created" },
	{ label: "Assigned", value: "assigned" },
	{ label: "In progress", value: "in_progress" },
	{ label: "Paused", value: "paused" },
	{ label: "Resumed", value: "resumed" },
	{ label: "Completed", value: "completed" },
	{ label: "Timer anomaly", value: "timer_anomaly" },
	{ label: "Cancelled", value: "cancelled" },
];

const priorityOptions: FieldOption[] = [
	{ label: "Normal", value: "normal" },
	{ label: "Urgent", value: "urgent" },
];

const contractTypeOptions: FieldOption[] = [
	{ label: "Full", value: "full" },
	{ label: "Partial", value: "partial" },
	{ label: "Emergency only", value: "emergency_only" },
];

const contractStatusOptions: FieldOption[] = [
	{ label: "Active", value: "active" },
	{ label: "Expiring", value: "expiring" },
	{ label: "Expired", value: "expired" },
];

const faultSeverityOptions: FieldOption[] = [
	{ label: "Low", value: "low" },
	{ label: "Medium", value: "medium" },
	{ label: "High", value: "high" },
	{ label: "Critical", value: "critical" },
];

const faultStatusOptions: FieldOption[] = [
	{ label: "Received", value: "received" },
	{ label: "Engineer assigned", value: "engineer_assigned" },
	{ label: "In progress", value: "in_progress" },
	{ label: "Resolved", value: "resolved" },
];

const tenantUserRoleOptions: FieldOption[] = [
	{ label: "Tenant administrator", value: "tenant_admin" },
	{ label: "Operator", value: "operator" },
	{ label: "Observer", value: "observer" },
];

const membershipStatusOptions: FieldOption[] = [
	{ label: "Active", value: "active" },
	{ label: "Invited", value: "invited" },
	{ label: "Suspended", value: "suspended" },
];

function optionFromRecord(
	record: { id: string; name?: string },
	fallback?: string
) {
	return {
		label: record.name ?? fallback ?? record.id,
		value: record.id,
	};
}

export function getFieldConfigs(
	entity: CrudEntity,
	data: ServiceOpsSnapshot
): FieldConfig[] {
	const hospitalOptions = data.hospitals.map((hospital) =>
		optionFromRecord(hospital)
	);
	const engineerOptions = data.engineers.map((engineer) =>
		optionFromRecord(engineer)
	);
	const productOptions = data.products.map((product) => ({
		label: product.modelName,
		value: product.id,
	}));
	const partOptions = data.parts.map((part) => ({
		label: `${part.id} · ${part.name}`,
		value: part.recordId,
	}));
	const assetOptions = data.assets.map((asset) => ({
		label: `${asset.id} · ${asset.model}`,
		value: asset.recordId,
	}));

	const configs: Record<CrudEntity, FieldConfig[]> = {
		asset: [
			{ label: "Asset number", name: "assetNumber", required: true },
			{ label: "Serial number", name: "serialNumber", required: true },
			{
				label: "Model",
				name: "productModelId",
				options: productOptions,
				required: true,
				type: "select",
			},
			{
				label: "Hospital",
				name: "hospitalId",
				options: hospitalOptions,
				required: true,
				type: "select",
			},
			{ label: "Location", name: "locationLabel", required: true },
			{ label: "NFC UID", name: "nfcUid", required: true },
			{
				label: "Coverage",
				name: "contractCoverageStatus",
				options: coverageOptions,
				required: true,
				type: "select",
			},
			{
				label: "Designated engineer",
				name: "designatedEngineerId",
				options: engineerOptions,
				type: "select",
			},
			{ label: "Installation date", name: "installationDate", type: "date" },
			{ label: "Warranty expiry", name: "warrantyExpiryDate", type: "date" },
			{ label: "Next PM due", name: "nextPmDueDate", type: "date" },
		],
		contract: [
			{ label: "Contract number", name: "contractNumber", required: true },
			{
				label: "Hospital",
				name: "hospitalId",
				options: hospitalOptions,
				required: true,
				type: "select",
			},
			{
				label: "Type",
				name: "type",
				options: contractTypeOptions,
				required: true,
				type: "select",
			},
			{
				label: "Status",
				name: "status",
				options: contractStatusOptions,
				required: true,
				type: "select",
			},
			{ label: "Start date", name: "startDate", required: true, type: "date" },
			{ label: "End date", name: "endDate", required: true, type: "date" },
			{
				label: "Response SLA hours",
				name: "responseSlaHours",
				required: true,
				type: "number",
			},
			{ label: "Account manager", name: "accountManagerName", required: true },
			{
				label: "Covered models",
				multiple: true,
				name: "coveredModelIds",
				options: productOptions,
				type: "select",
			},
			{
				label: "Covered parts",
				multiple: true,
				name: "coveredPartIds",
				options: partOptions,
				type: "select",
			},
		],
		engineer: [
			{ label: "Code", name: "code", required: true },
			{ label: "Name", name: "name", required: true },
			{ label: "Email", name: "email" },
			{ label: "Phone", name: "phone" },
			{ label: "Grade", name: "grade", required: true },
			{ label: "Region", name: "region", required: true },
			{
				label: "Status",
				name: "status",
				options: engineerStatusOptions,
				required: true,
				type: "select",
			},
			{
				label: "Hourly rate",
				name: "hourlyRate",
				required: true,
				type: "number",
			},
			{
				label: "Mileage rate",
				name: "mileageRate",
				required: true,
				type: "number",
			},
			{ label: "Meal cap", name: "mealCap", required: true, type: "number" },
		],
		fault: [
			{ label: "Report number", name: "reportNumber", required: true },
			{
				label: "Hospital",
				name: "hospitalId",
				options: hospitalOptions,
				required: true,
				type: "select",
			},
			{
				label: "Asset",
				name: "assetId",
				options: assetOptions,
				type: "select",
			},
			{
				label: "Severity",
				name: "severity",
				options: faultSeverityOptions,
				required: true,
				type: "select",
			},
			{
				label: "Status",
				name: "status",
				options: faultStatusOptions,
				required: true,
				type: "select",
			},
			{ label: "Submitted by", name: "submittedByName", required: true },
			{ label: "Contact", name: "submittedByContact" },
			{
				label: "Description",
				name: "description",
				required: true,
				type: "textarea",
			},
		],
		hospital: [
			{ label: "Code", name: "code", required: true },
			{ label: "Name", name: "name", required: true },
			{ label: "District", name: "district", required: true },
			{ label: "Address", name: "address" },
			{
				label: "Latitude",
				max: 90,
				min: -90,
				name: "latitude",
				type: "number",
			},
			{
				label: "Longitude",
				max: 180,
				min: -180,
				name: "longitude",
				type: "number",
			},
			{ label: "Contact name", name: "primaryContactName" },
			{ label: "Contact email", name: "primaryContactEmail" },
			{ label: "Contact phone", name: "primaryContactPhone" },
		],
		job: [
			{ label: "Job number", name: "jobNumber", required: true },
			{
				label: "Type",
				name: "type",
				options: jobTypeOptions,
				required: true,
				type: "select",
			},
			{
				label: "Status",
				name: "status",
				options: jobStatusOptions,
				required: true,
				type: "select",
			},
			{
				label: "Priority",
				name: "priority",
				options: priorityOptions,
				required: true,
				type: "select",
			},
			{
				label: "Asset",
				name: "assetId",
				options: assetOptions,
				required: true,
				type: "select",
			},
			{
				label: "Hospital",
				name: "hospitalId",
				options: hospitalOptions,
				required: true,
				type: "select",
			},
			{
				label: "Engineer",
				name: "assignedEngineerId",
				options: engineerOptions,
				type: "select",
			},
			{
				label: "Scheduled start",
				name: "scheduledStartAt",
				type: "datetime-local",
			},
			{
				label: "Description",
				name: "description",
				required: true,
				type: "textarea",
			},
		],
		part: [
			{ label: "Part number", name: "partNumber", required: true },
			{ label: "Name", name: "name", required: true },
			{ label: "Supplier", name: "supplier", required: true },
			{
				label: "Stock on hand",
				name: "stockOnHand",
				required: true,
				type: "number",
			},
			{
				label: "Minimum stock",
				name: "minimumStock",
				required: true,
				type: "number",
			},
			{ label: "Unit cost", name: "unitCost", required: true, type: "number" },
		],
		product: [
			{ label: "Code", name: "code", required: true },
			{ label: "Model name", name: "modelName", required: true },
			{ label: "Manufacturer", name: "manufacturer", required: true },
			{ label: "Category", name: "category", required: true },
			{
				label: "Default PM cycle months",
				name: "defaultPmCycleMonths",
				required: true,
				type: "number",
			},
			{
				label: "Engineer read only",
				name: "isEngineerReadOnly",
				type: "checkbox",
			},
		],
		tenant: [
			{
				label: "Tenant ID",
				name: "id",
			},
			{ label: "Tenant name", name: "name", required: true },
			{ label: "Region", name: "region", required: true },
			{ label: "Release label", name: "releaseLabel", required: true },
			{ label: "Active", name: "isActive", type: "checkbox" },
		],
		tenantUser: [
			{ label: "Name", name: "name", required: true },
			{ label: "Email", name: "email", required: true },
			{
				label: "Role",
				name: "role",
				options: tenantUserRoleOptions,
				required: true,
				type: "select",
			},
			{
				label: "Status",
				name: "status",
				options: membershipStatusOptions,
				required: true,
				type: "select",
			},
			{
				label: "Password",
				name: "password",
				type: "text",
			},
		],
	};

	return configs[entity];
}

function valueFromForm(formData: FormData, name: string) {
	return String(formData.get(name) ?? "").trim();
}

function nullableValueFromForm(formData: FormData, name: string) {
	const value = valueFromForm(formData, name);

	return value || null;
}

function numberFromForm(formData: FormData, name: string) {
	const value = valueFromForm(formData, name);

	return value ? Number(value) : 0;
}

function optionalNumberFromForm(formData: FormData, name: string) {
	const value = valueFromForm(formData, name);

	return value ? Number(value) : null;
}

function boolFromForm(formData: FormData, name: string) {
	return formData.get(name) === "on";
}

function datetimeLocalValue(value: null | string | undefined) {
	if (!value) {
		return "";
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "";
	}

	const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;

	return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function valuesFromForm(formData: FormData, name: string) {
	return formData
		.getAll(name)
		.map((value) => String(value).trim())
		.filter(Boolean);
}

function enumFromForm<T extends readonly string[]>(
	formData: FormData,
	name: string,
	values: T
): T[number] {
	const value = valueFromForm(formData, name);

	if (values.includes(value)) {
		return value;
	}

	return values[0];
}

export function getRecordId(entity: CrudEntity, record: unknown) {
	const typedRecord = record as Record<string, unknown>;
	const id =
		entity === "product" ||
		entity === "hospital" ||
		entity === "engineer" ||
		entity === "tenant"
			? typedRecord.id
			: typedRecord.recordId;

	return String(id ?? "");
}

export function getCrudStateKey(state: CrudState) {
	if (state.mode === "create") {
		return `${state.entity}-create`;
	}

	return `${state.entity}-${getRecordId(state.entity, state.record)}`;
}

function isHospitalRecord(record: unknown): record is Hospital {
	return typeof record === "object" && record !== null && "district" in record;
}

function isEngineerRecord(record: unknown): record is Engineer {
	return typeof record === "object" && record !== null && "grade" in record;
}

function isProductRecord(record: unknown): record is ProductModel {
	return typeof record === "object" && record !== null && "modelName" in record;
}

function isPartRecord(record: unknown): record is Part {
	return typeof record === "object" && record !== null && "minimum" in record;
}

function isAssetRecord(record: unknown): record is Asset {
	return typeof record === "object" && record !== null && "nfcUid" in record;
}

function isJobRecord(record: unknown): record is Job {
	return typeof record === "object" && record !== null && "typeValue" in record;
}

function isContractRecord(record: unknown): record is Contract {
	return (
		typeof record === "object" && record !== null && "coveredModelIds" in record
	);
}

function isFaultRecord(record: unknown): record is FaultReport {
	return (
		typeof record === "object" && record !== null && "severityValue" in record
	);
}

function isTenantRecord(record: unknown): record is TenantManagementRecord {
	return typeof record === "object" && record !== null && "release" in record;
}

function isTenantUserRecord(record: unknown): record is TenantUserRecord {
	return (
		typeof record === "object" && record !== null && "membershipId" in record
	);
}

export function getFormDefaults(entity: CrudEntity, record: unknown) {
	if (!record) {
		return getCreateDefaults(entity);
	}

	const defaults = getEditDefaults(entity, record);

	return defaults ?? getCreateDefaults(entity);
}

function getEditDefaults(entity: CrudEntity, record: unknown) {
	const defaultsByEntity: Record<
		CrudEntity,
		(record: unknown) => Record<string, FormDefaultValue> | null
	> = {
		asset: getAssetDefaults,
		contract: getContractDefaults,
		engineer: getEngineerDefaults,
		fault: getFaultDefaults,
		hospital: getHospitalDefaults,
		job: getJobDefaults,
		part: getPartDefaults,
		product: getProductDefaults,
		tenant: getTenantDefaults,
		tenantUser: getTenantUserDefaults,
	};

	return defaultsByEntity[entity](record);
}

function getAssetDefaults(
	record: unknown
): Record<string, FormDefaultValue> | null {
	if (isAssetRecord(record)) {
		return {
			assetNumber: record.id,
			contractCoverageStatus: record.contractCoverageValue,
			designatedEngineerId: record.designatedEngineerId ?? "",
			hospitalId: record.hospitalId,
			installationDate:
				record.installationDate === "Not set" ? "" : record.installationDate,
			locationLabel: record.location,
			nextPmDueDate: record.nextPmDue === "Not set" ? "" : record.nextPmDue,
			nfcUid: record.nfcUid,
			productModelId: record.productModelId,
			serialNumber: record.serial,
			warrantyExpiryDate:
				record.warrantyExpiry === "Not set" ? "" : record.warrantyExpiry,
		};
	}

	return null;
}

function getContractDefaults(
	record: unknown
): Record<string, FormDefaultValue> | null {
	if (isContractRecord(record)) {
		return {
			accountManagerName: record.accountManager,
			contractNumber: record.id,
			coveredModelIds: record.coveredModelIds,
			coveredPartIds: record.coveredPartIds,
			endDate: record.expiry,
			hospitalId: record.hospitalId,
			responseSlaHours: record.slaHours,
			startDate: record.startDate,
			status: record.statusValue,
			type: record.typeValue,
		};
	}

	return null;
}

function getEngineerDefaults(
	record: unknown
): Record<string, FormDefaultValue> | null {
	if (isEngineerRecord(record)) {
		return {
			code: record.code,
			email: record.email ?? "",
			grade: record.grade,
			hourlyRate: record.hourlyRate,
			mealCap: record.mealCap,
			mileageRate: record.mileageRate,
			name: record.name,
			phone: record.phone ?? "",
			region: record.region,
			status: record.statusValue,
		};
	}

	return null;
}

function getFaultDefaults(
	record: unknown
): Record<string, FormDefaultValue> | null {
	if (isFaultRecord(record)) {
		return {
			assetId: record.assetId ?? "",
			description: record.description,
			hospitalId: record.hospitalId,
			reportNumber: record.id,
			severity: record.severityValue,
			status: record.statusValue,
			submittedByContact: record.submittedByContact ?? "",
			submittedByName: record.submittedByName,
		};
	}

	return null;
}

function getHospitalDefaults(
	record: unknown
): Record<string, FormDefaultValue> | null {
	if (isHospitalRecord(record)) {
		return {
			address: record.address ?? "",
			code: record.code,
			district: record.district,
			latitude: record.lat,
			longitude: record.lng,
			name: record.name,
			primaryContactEmail: record.primaryContactEmail ?? "",
			primaryContactName: record.primaryContactName ?? "",
			primaryContactPhone: record.primaryContactPhone ?? "",
		};
	}

	return null;
}

function getJobDefaults(
	record: unknown
): Record<string, FormDefaultValue> | null {
	if (isJobRecord(record)) {
		return {
			assetId: record.assetId,
			assignedEngineerId: record.engineerId ?? "",
			description: record.description,
			hospitalId: record.hospitalId,
			jobNumber: record.id,
			priority: record.priorityValue,
			scheduledStartAt: datetimeLocalValue(record.scheduledStartAt),
			status: record.statusValue,
			type: record.typeValue,
		};
	}

	return null;
}

function getPartDefaults(
	record: unknown
): Record<string, FormDefaultValue> | null {
	if (isPartRecord(record)) {
		return {
			minimumStock: record.minimum,
			name: record.name,
			partNumber: record.id,
			stockOnHand: record.stock,
			supplier: record.supplier,
			unitCost: record.unitCost,
		};
	}

	return null;
}

function getProductDefaults(
	record: unknown
): Record<string, FormDefaultValue> | null {
	if (isProductRecord(record)) {
		return {
			category: record.category,
			code: record.code,
			defaultPmCycleMonths: record.defaultPmCycleMonths,
			isEngineerReadOnly: record.isEngineerReadOnly,
			manufacturer: record.manufacturer,
			modelName: record.modelName,
		};
	}

	return null;
}

function getTenantDefaults(
	record: unknown
): Record<string, FormDefaultValue> | null {
	if (isTenantRecord(record)) {
		return {
			id: record.id,
			isActive: record.isActive,
			name: record.name,
			region: record.region,
			releaseLabel: record.release,
		};
	}

	return null;
}

function getTenantUserDefaults(
	record: unknown
): Record<string, FormDefaultValue> | null {
	if (isTenantUserRecord(record)) {
		return {
			email: record.email,
			name: record.name,
			password: "",
			role: record.role,
			status: record.status,
		};
	}

	return null;
}

function getCreateDefaults(entity: CrudEntity) {
	const suffix = Date.now().toString().slice(-5);
	const today = new Date().toISOString().slice(0, 10);
	const defaults: Record<string, FormDefaultValue> = {
		status: "",
	};

	if (entity === "engineer") {
		defaults.code = `ENG-${suffix}`;
		defaults.status = "idle";
		defaults.hourlyRate = 0;
		defaults.mileageRate = 0;
		defaults.mealCap = 0;
	}

	if (entity === "product") {
		defaults.code = `MODEL-${suffix}`;
		defaults.defaultPmCycleMonths = 6;
		defaults.isEngineerReadOnly = true;
	}

	if (entity === "part") {
		defaults.partNumber = `P-${suffix}`;
		defaults.minimumStock = 0;
		defaults.stockOnHand = 0;
		defaults.unitCost = 0;
	}

	if (entity === "asset") {
		defaults.assetNumber = `AST-${suffix}`;
		defaults.contractCoverageStatus = "in_contract";
		defaults.installationDate = today;
		defaults.nfcUid = `nfc-${suffix}`;
	}

	if (entity === "job") {
		defaults.jobNumber = `JOB-${suffix}`;
		defaults.type = "repair";
		defaults.status = "created";
		defaults.priority = "normal";
	}

	if (entity === "contract") {
		defaults.contractNumber = `CTR-${suffix}`;
		defaults.coveredModelIds = [];
		defaults.coveredPartIds = [];
		defaults.endDate = today;
		defaults.startDate = today;
		defaults.type = "full";
		defaults.status = "active";
		defaults.responseSlaHours = 4;
	}

	if (entity === "fault") {
		defaults.reportNumber = `FLT-${suffix}`;
		defaults.severity = "medium";
		defaults.status = "received";
	}

	if (entity === "hospital") {
		defaults.code = `HSP-${suffix}`;
	}

	if (entity === "tenant") {
		defaults.id = "";
		defaults.isActive = true;
		defaults.region = "Hong Kong";
		defaults.releaseLabel = "Early Release v1";
	}

	if (entity === "tenantUser") {
		defaults.role = "observer";
		defaults.status = "active";
	}

	return defaults;
}

export function buildAssetPayload(formData: FormData): AssetPayload {
	return {
		assetNumber: valueFromForm(formData, "assetNumber"),
		contractCoverageStatus: enumFromForm(
			formData,
			"contractCoverageStatus",
			coverageValues
		),
		designatedEngineerId: nullableValueFromForm(
			formData,
			"designatedEngineerId"
		),
		hospitalId: valueFromForm(formData, "hospitalId"),
		installationDate: nullableValueFromForm(formData, "installationDate"),
		locationLabel: valueFromForm(formData, "locationLabel"),
		nextPmDueDate: nullableValueFromForm(formData, "nextPmDueDate"),
		nfcUid: valueFromForm(formData, "nfcUid"),
		productModelId: valueFromForm(formData, "productModelId"),
		serialNumber: valueFromForm(formData, "serialNumber"),
		warrantyExpiryDate: nullableValueFromForm(formData, "warrantyExpiryDate"),
	};
}

export function buildContractPayload(formData: FormData): ContractPayload {
	return {
		accountManagerName: valueFromForm(formData, "accountManagerName"),
		contractNumber: valueFromForm(formData, "contractNumber"),
		coveredModelIds: valuesFromForm(formData, "coveredModelIds"),
		coveredPartIds: valuesFromForm(formData, "coveredPartIds"),
		endDate: valueFromForm(formData, "endDate"),
		hospitalId: valueFromForm(formData, "hospitalId"),
		responseSlaHours: numberFromForm(formData, "responseSlaHours"),
		startDate: valueFromForm(formData, "startDate"),
		status: enumFromForm(formData, "status", contractStatusValues),
		type: enumFromForm(formData, "type", contractTypeValues),
	};
}

export function buildEngineerPayload(formData: FormData): EngineerPayload {
	return {
		code: valueFromForm(formData, "code"),
		email: nullableValueFromForm(formData, "email"),
		grade: valueFromForm(formData, "grade"),
		hourlyRate: numberFromForm(formData, "hourlyRate"),
		mealCap: numberFromForm(formData, "mealCap"),
		mileageRate: numberFromForm(formData, "mileageRate"),
		name: valueFromForm(formData, "name"),
		phone: nullableValueFromForm(formData, "phone"),
		region: valueFromForm(formData, "region"),
		status: enumFromForm(formData, "status", engineerStatusValues),
	};
}

export function buildFaultPayload(formData: FormData): FaultPayload {
	return {
		assetId: nullableValueFromForm(formData, "assetId"),
		description: valueFromForm(formData, "description"),
		hospitalId: valueFromForm(formData, "hospitalId"),
		reportNumber: valueFromForm(formData, "reportNumber"),
		severity: enumFromForm(formData, "severity", faultSeverityValues),
		status: enumFromForm(formData, "status", faultStatusValues),
		submittedByContact: nullableValueFromForm(formData, "submittedByContact"),
		submittedByName: valueFromForm(formData, "submittedByName"),
	};
}

export function buildHospitalPayload(formData: FormData): HospitalPayload {
	return {
		address: nullableValueFromForm(formData, "address"),
		code: valueFromForm(formData, "code"),
		district: valueFromForm(formData, "district"),
		latitude: optionalNumberFromForm(formData, "latitude"),
		longitude: optionalNumberFromForm(formData, "longitude"),
		name: valueFromForm(formData, "name"),
		primaryContactEmail: nullableValueFromForm(formData, "primaryContactEmail"),
		primaryContactName: nullableValueFromForm(formData, "primaryContactName"),
		primaryContactPhone: nullableValueFromForm(formData, "primaryContactPhone"),
	};
}

export function buildJobPayload(formData: FormData): JobPayload {
	return {
		assetId: valueFromForm(formData, "assetId"),
		assignedEngineerId: nullableValueFromForm(formData, "assignedEngineerId"),
		description: valueFromForm(formData, "description"),
		hospitalId: valueFromForm(formData, "hospitalId"),
		jobNumber: valueFromForm(formData, "jobNumber"),
		priority: enumFromForm(formData, "priority", priorityValues),
		scheduledStartAt: nullableValueFromForm(formData, "scheduledStartAt"),
		status: enumFromForm(formData, "status", jobStatusValues),
		type: enumFromForm(formData, "type", jobTypeValues),
	};
}

export function buildPartPayload(formData: FormData): PartPayload {
	return {
		minimumStock: numberFromForm(formData, "minimumStock"),
		name: valueFromForm(formData, "name"),
		partNumber: valueFromForm(formData, "partNumber"),
		stockOnHand: numberFromForm(formData, "stockOnHand"),
		supplier: valueFromForm(formData, "supplier"),
		unitCost: numberFromForm(formData, "unitCost"),
	};
}

export function buildProductPayload(formData: FormData): ProductPayload {
	return {
		category: valueFromForm(formData, "category"),
		code: valueFromForm(formData, "code"),
		defaultPmCycleMonths: numberFromForm(formData, "defaultPmCycleMonths"),
		isEngineerReadOnly: boolFromForm(formData, "isEngineerReadOnly"),
		manufacturer: valueFromForm(formData, "manufacturer"),
		modelName: valueFromForm(formData, "modelName"),
	};
}

export function buildTenantPayload(formData: FormData): TenantPayload {
	return {
		id: nullableValueFromForm(formData, "id"),
		isActive: boolFromForm(formData, "isActive"),
		name: valueFromForm(formData, "name"),
		region: valueFromForm(formData, "region"),
		releaseLabel: valueFromForm(formData, "releaseLabel"),
	};
}

export function buildTenantUserPayload(formData: FormData): TenantUserPayload {
	return {
		email: valueFromForm(formData, "email"),
		name: valueFromForm(formData, "name"),
		password: nullableValueFromForm(formData, "password"),
		role: enumFromForm(formData, "role", [
			"tenant_admin",
			"operator",
			"observer",
		] as const),
		status: enumFromForm(formData, "status", [
			"active",
			"invited",
			"suspended",
		] as const),
	};
}
