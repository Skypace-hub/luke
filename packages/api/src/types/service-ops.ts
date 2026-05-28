export type JobStatus =
	| "Created"
	| "Assigned"
	| "In Progress"
	| "Paused"
	| "Resumed"
	| "Completed"
	| "Timer Anomaly"
	| "Cancelled";

export type JobType = "Installation" | "Repair" | "Preventive Maintenance";

export type Priority = "Normal" | "Urgent";

export type EngineerStatus =
	| "On-site"
	| "In transit"
	| "Idle"
	| "Timer anomaly"
	| "Off duty";

export type ContractStatus = "Active" | "Expiring" | "Expired";

export type FaultStatus =
	| "Received"
	| "Engineer Assigned"
	| "In Progress"
	| "Resolved";

export type Severity = "Low" | "Medium" | "High" | "Critical";

export interface TenantSummary {
	id: string;
	name: string;
	region: string;
	release: string;
}

export type TenantRole =
	| "operator"
	| "observer"
	| "super_admin"
	| "tenant_admin";

export type MembershipStatus = "active" | "invited" | "suspended";

export interface TenantAccessPolicy {
	canManageTenants: boolean;
	canManageTenantUsers: boolean;
	canRead: boolean;
	canWrite: boolean;
	role: TenantRole;
}

export interface TenantManagementRecord extends TenantSummary {
	createdAt: string;
	isActive: boolean;
	memberCount: number;
	recordId: string;
	role: TenantRole;
	status: MembershipStatus;
}

export interface TenantUserRecord {
	createdAt: string;
	email: string;
	id: string;
	membershipId: string;
	name: string;
	role: TenantRole;
	status: MembershipStatus;
}

export interface DashboardStat {
	id: string;
	label: string;
	meta: string;
	value: string;
}

export interface Hospital {
	address: null | string;
	assets: number;
	code: string;
	contractStatus: ContractStatus;
	district: string;
	id: string;
	lat: number;
	lng: number;
	name: string;
	openJobs: number;
	primaryContactEmail: null | string;
	primaryContactName: null | string;
	primaryContactPhone: null | string;
	regionProvince: null | string;
}

export interface Engineer {
	code: string;
	currentJob: string;
	email: null | string;
	grade: string;
	hourlyRate: number;
	id: string;
	lat: null | number;
	lng: null | number;
	locationRecordedAt: null | string;
	mealCap: number;
	mileageRate: number;
	name: string;
	phone: null | string;
	region: string;
	status: EngineerStatus;
	statusValue: string;
}

export interface Asset {
	contractCoverage: "In contract" | "Billable exception" | "Expired";
	contractCoverageValue:
		| "billable_exception"
		| "expired"
		| "in_contract"
		| "out_of_contract";
	designatedEngineer: string;
	designatedEngineerId: null | string;
	hospital: string;
	hospitalId: string;
	id: string;
	installationDate: string;
	location: string;
	model: string;
	nextPmDue: string;
	nfcUid: string;
	productModelId: string;
	recordId: string;
	serial: string;
	warrantyExpiry: string;
}

export interface Job {
	asset: string;
	assetId: string;
	audit: string;
	cost: number;
	description: string;
	engineer: string;
	engineerId: null | string;
	hospital: string;
	hospitalId: string;
	id: string;
	nfcUid: string;
	priority: Priority;
	priorityValue: string;
	recordId: string;
	scheduledFor: string;
	scheduledStartAt: null | string;
	status: JobStatus;
	statusValue: string;
	timerMinutes: number;
	type: JobType;
	typeValue: string;
}

export interface ProductModel {
	assetCount: number;
	category: string;
	code: string;
	defaultPmCycleMonths: number;
	engineerAccess: string;
	id: string;
	isEngineerReadOnly: boolean;
	manualFileName: string;
	manualFileUrl: null | string;
	manufacturer: string;
	modelName: string;
	partIds: string[];
	partsList: string[];
}

export interface Contract {
	accountManager: string;
	coveredModelIds: string[];
	coveredModels: string[];
	coveredPartIds: string[];
	coveredParts: string[];
	expiry: string;
	hospital: string;
	hospitalId: string;
	id: string;
	recordId: string;
	slaHours: number;
	startDate: string;
	status: ContractStatus;
	statusValue: string;
	type: "Full" | "Partial" | "Emergency only";
	typeValue: string;
}

export interface FaultReport {
	asset: string;
	assetId: null | string;
	description: string;
	hospital: string;
	hospitalId: string;
	id: string;
	recordId: string;
	severity: Severity;
	severityValue: string;
	status: FaultStatus;
	statusValue: string;
	submittedAt: string;
	submittedByContact: null | string;
	submittedByName: string;
}

export interface Part {
	description: null | string;
	id: string;
	minimum: number;
	name: string;
	productModelIds: string[];
	recordId: string;
	stock: number;
	supplier: string;
	unitCost: number;
}

export interface Shortage {
	engineer: string;
	id: string;
	job: string;
	jobId: string;
	part: string;
	partId: string;
	recordId: string;
	status: "Waiting for parts" | "Arrived" | "Reschedule ready";
}

export interface ManualAnswer {
	excerpt: string;
	id: string;
	page: number;
	title: string;
}

export interface ManualQuestionResult {
	answers: ManualAnswer[];
	queryId: string;
	summary: string;
}

export interface NfcDeviceInfo {
	asset: Asset;
	contractCoverageStatus: Asset["contractCoverage"];
	currentOpenJob: Job | null;
	lastServiceRecords: Job[];
	manualFileUrl: null | string;
	productModel: ProductModel | null;
}

export interface SystemParameter {
	id: string;
	label: string;
	value: string;
	valueRaw?: unknown;
	valueType: "boolean" | "number" | "secret" | "string";
}

export interface ReportMetric {
	id: string;
	label: string;
	trend: string;
	value: string;
}

export interface CostRecord {
	id: string;
	job: string;
	labour: string;
	meals: string;
	mileage: string;
	partsAbsorbed: string;
	partsBillable: string;
}

export interface LiveAlert {
	actionId?: string;
	id: string;
	message: string;
	title: string;
	type: "contract" | "geofence" | "pm" | "stock" | "status";
}

export interface ServiceOpsSnapshot {
	access: TenantAccessPolicy;
	assets: Asset[];
	contracts: Contract[];
	costRecords: CostRecord[];
	dashboardStats: DashboardStat[];
	engineers: Engineer[];
	faultReports: FaultReport[];
	hospitals: Hospital[];
	jobs: Job[];
	liveAlerts: LiveAlert[];
	manualAnswers: ManualAnswer[];
	parts: Part[];
	products: ProductModel[];
	reportMetrics: ReportMetric[];
	shortages: Shortage[];
	systemParameters: SystemParameter[];
	tenant: TenantSummary;
	tenants: TenantManagementRecord[];
	users: TenantUserRecord[];
}
