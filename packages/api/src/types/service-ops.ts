export type JobStatus =
	| "Created"
	| "Assigned"
	| "In Progress"
	| "Paused"
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

export interface DashboardStat {
	id: string;
	label: string;
	meta: string;
	value: string;
}

export interface Hospital {
	assets: number;
	contractStatus: ContractStatus;
	district: string;
	id: string;
	lat: number;
	lng: number;
	name: string;
	openJobs: number;
}

export interface Engineer {
	currentJob: string;
	grade: string;
	hourlyRate: number;
	id: string;
	mealCap: number;
	mileageRate: number;
	name: string;
	region: string;
	status: EngineerStatus;
}

export interface Asset {
	contractCoverage: "In contract" | "Billable exception" | "Expired";
	designatedEngineer: string;
	hospital: string;
	id: string;
	location: string;
	model: string;
	nextPmDue: string;
	nfcUid: string;
	serial: string;
	warrantyExpiry: string;
}

export interface Job {
	asset: string;
	audit: string;
	cost: number;
	engineer: string;
	hospital: string;
	id: string;
	priority: Priority;
	scheduledFor: string;
	status: JobStatus;
	timerMinutes: number;
	type: JobType;
}

export interface ProductModel {
	defaultPmCycleMonths: number;
	engineerAccess: string;
	id: string;
	manualFileName: string;
	modelName: string;
	partsList: string[];
}

export interface Contract {
	accountManager: string;
	coveredModels: string[];
	expiry: string;
	hospital: string;
	id: string;
	slaHours: number;
	status: ContractStatus;
	type: "Full" | "Partial" | "Emergency only";
}

export interface FaultReport {
	asset: string;
	description: string;
	hospital: string;
	id: string;
	severity: Severity;
	status: FaultStatus;
	submittedAt: string;
}

export interface Part {
	id: string;
	minimum: number;
	name: string;
	stock: number;
	supplier: string;
	unitCost: number;
}

export interface Shortage {
	engineer: string;
	id: string;
	job: string;
	part: string;
	status: "Waiting for parts" | "Arrived" | "Reschedule ready";
}

export interface ManualAnswer {
	excerpt: string;
	id: string;
	page: number;
	title: string;
}

export interface SystemParameter {
	id: string;
	label: string;
	value: string;
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
	id: string;
	message: string;
	title: string;
	type: "contract" | "geofence" | "pm" | "stock" | "status";
}

export interface ServiceOpsSnapshot {
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
}
