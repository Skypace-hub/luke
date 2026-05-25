import {
	AlertTriangleIcon,
	BoxesIcon,
	ClipboardListIcon,
	FileTextIcon,
	HospitalIcon,
	MapPinnedIcon,
	PackageCheckIcon,
	RadioTowerIcon,
	SettingsIcon,
	ShieldCheckIcon,
	SirenIcon,
	StethoscopeIcon,
	UsersIcon,
	WrenchIcon,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

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

export interface NavigationItem {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	id: BackOfficeView;
	label: string;
}

export type BackOfficeView =
	| "dashboard"
	| "jobs"
	| "assets"
	| "products"
	| "hospitals"
	| "engineers"
	| "contracts"
	| "map"
	| "faults"
	| "parts"
	| "reports"
	| "config";

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

export const tenant = {
	id: "arjo-hk",
	name: "ARJO HONG KONG",
	region: "Hong Kong",
	release: "Early Release v1",
} as const;

export const navigationItems: NavigationItem[] = [
	{ id: "dashboard", label: "Dashboard", icon: ClipboardListIcon },
	{ id: "jobs", label: "Jobs", icon: WrenchIcon },
	{ id: "map", label: "Map", icon: MapPinnedIcon },
	{ id: "assets", label: "Installed Assets", icon: StethoscopeIcon },
	{ id: "products", label: "Product Catalogue", icon: PackageCheckIcon },
	{ id: "hospitals", label: "Hospitals", icon: HospitalIcon },
	{ id: "engineers", label: "Engineers", icon: UsersIcon },
	{ id: "contracts", label: "Contracts", icon: ShieldCheckIcon },
	{ id: "parts", label: "Parts & Stock", icon: BoxesIcon },
	{ id: "faults", label: "Faults", icon: SirenIcon },
	{ id: "reports", label: "Reports", icon: FileTextIcon },
	{ id: "config", label: "System Config", icon: SettingsIcon },
];

export const hospitals: Hospital[] = [
	{
		id: "qmh",
		name: "Queen Mary Hospital",
		district: "Pok Fu Lam",
		contractStatus: "Active",
		openJobs: 4,
		assets: 38,
		lat: 22.2707,
		lng: 114.1317,
	},
	{
		id: "pwh",
		name: "Prince of Wales Hospital",
		district: "Sha Tin",
		contractStatus: "Expiring",
		openJobs: 3,
		assets: 31,
		lat: 22.3798,
		lng: 114.2014,
	},
	{
		id: "uch",
		name: "United Christian Hospital",
		district: "Kwun Tong",
		contractStatus: "Active",
		openJobs: 2,
		assets: 24,
		lat: 22.3186,
		lng: 114.2263,
	},
	{
		id: "pmh",
		name: "Princess Margaret Hospital",
		district: "Lai Chi Kok",
		contractStatus: "Expired",
		openJobs: 1,
		assets: 19,
		lat: 22.3401,
		lng: 114.1354,
	},
];

export const engineers: Engineer[] = [
	{
		id: "eng-001",
		name: "Kelvin Wong",
		grade: "Senior Engineer",
		status: "On-site",
		currentJob: "J-1048",
		region: "Hong Kong Island",
		hourlyRate: 620,
		mileageRate: 4.8,
		mealCap: 95,
	},
	{
		id: "eng-002",
		name: "Mandy Chan",
		grade: "Field Engineer",
		status: "In transit",
		currentJob: "J-1049",
		region: "New Territories East",
		hourlyRate: 520,
		mileageRate: 4.8,
		mealCap: 85,
	},
	{
		id: "eng-003",
		name: "Arun Patel",
		grade: "Field Engineer",
		status: "Idle",
		currentJob: "Available",
		region: "Kowloon",
		hourlyRate: 500,
		mileageRate: 4.8,
		mealCap: 85,
	},
	{
		id: "eng-004",
		name: "Ivy Lee",
		grade: "Lead Engineer",
		status: "Timer anomaly",
		currentJob: "J-1041",
		region: "New Territories West",
		hourlyRate: 680,
		mileageRate: 5.2,
		mealCap: 110,
	},
];

export const assets: Asset[] = [
	{
		id: "AST-10024",
		model: "Maxi Move Floor Lift",
		serial: "MM-HK-23091",
		hospital: "Queen Mary Hospital",
		location: "Block K / 7F / Room 12",
		designatedEngineer: "Kelvin Wong",
		warrantyExpiry: "2027-09-30",
		nextPmDue: "2026-05-27",
		contractCoverage: "In contract",
		nfcUid: "nfc:arjo:10024",
	},
	{
		id: "AST-10031",
		model: "Sara Flex Standing Aid",
		serial: "SF-HK-22930",
		hospital: "Prince of Wales Hospital",
		location: "Ward 10B / Bay 3",
		designatedEngineer: "Mandy Chan",
		warrantyExpiry: "2026-07-18",
		nextPmDue: "2026-05-26",
		contractCoverage: "In contract",
		nfcUid: "nfc:arjo:10031",
	},
	{
		id: "AST-10047",
		model: "Citadel Patient Therapy System",
		serial: "CT-HK-24112",
		hospital: "United Christian Hospital",
		location: "ICU / Bed 5",
		designatedEngineer: "Arun Patel",
		warrantyExpiry: "2028-01-14",
		nextPmDue: "2026-06-05",
		contractCoverage: "Billable exception",
		nfcUid: "nfc:arjo:10047",
	},
	{
		id: "AST-10052",
		model: "Alenti Hygiene Chair",
		serial: "AH-HK-22501",
		hospital: "Princess Margaret Hospital",
		location: "Geriatrics / Utility Room",
		designatedEngineer: "Ivy Lee",
		warrantyExpiry: "2025-12-01",
		nextPmDue: "2026-05-25",
		contractCoverage: "Expired",
		nfcUid: "nfc:arjo:10052",
	},
];

export const jobs: Job[] = [
	{
		id: "J-1048",
		type: "Repair",
		status: "In Progress",
		priority: "Urgent",
		asset: "AST-10024",
		hospital: "Queen Mary Hospital",
		engineer: "Kelvin Wong",
		scheduledFor: "Today 10:30",
		timerMinutes: 87,
		cost: 899,
		audit: "NFC start accepted, geofence locked, GPS confirmed",
	},
	{
		id: "J-1049",
		type: "Preventive Maintenance",
		status: "Assigned",
		priority: "Normal",
		asset: "AST-10031",
		hospital: "Prince of Wales Hospital",
		engineer: "Mandy Chan",
		scheduledFor: "Today 14:00",
		timerMinutes: 0,
		cost: 0,
		audit: "Auto-filled from designated engineer",
	},
	{
		id: "J-1041",
		type: "Installation",
		status: "Timer Anomaly",
		priority: "Urgent",
		asset: "AST-10052",
		hospital: "Princess Margaret Hospital",
		engineer: "Ivy Lee",
		scheduledFor: "Today 09:15",
		timerMinutes: 156,
		cost: 1768,
		audit: "Engineer outside 200m geofence for 5 minutes",
	},
	{
		id: "J-1038",
		type: "Repair",
		status: "Paused",
		priority: "Normal",
		asset: "AST-10047",
		hospital: "United Christian Hospital",
		engineer: "Arun Patel",
		scheduledFor: "Tomorrow 11:00",
		timerMinutes: 42,
		cost: 350,
		audit: "Paused for sling bar assembly shortage",
	},
	{
		id: "J-1032",
		type: "Preventive Maintenance",
		status: "Completed",
		priority: "Normal",
		asset: "AST-10024",
		hospital: "Queen Mary Hospital",
		engineer: "Kelvin Wong",
		scheduledFor: "Yesterday 15:30",
		timerMinutes: 64,
		cost: 661,
		audit: "Next PM date written to asset record",
	},
];

export const contracts: Contract[] = [
	{
		id: "CTR-HK-2026-01",
		hospital: "Queen Mary Hospital",
		type: "Full",
		slaHours: 4,
		status: "Active",
		expiry: "2027-03-31",
		accountManager: "Nicole Tang",
		coveredModels: ["Maxi Move Floor Lift", "Sara Flex Standing Aid"],
	},
	{
		id: "CTR-HK-2025-18",
		hospital: "Prince of Wales Hospital",
		type: "Partial",
		slaHours: 8,
		status: "Expiring",
		expiry: "2026-06-18",
		accountManager: "Nicole Tang",
		coveredModels: ["Sara Flex Standing Aid"],
	},
	{
		id: "CTR-HK-2024-09",
		hospital: "Princess Margaret Hospital",
		type: "Emergency only",
		slaHours: 24,
		status: "Expired",
		expiry: "2026-04-30",
		accountManager: "Samuel Hui",
		coveredModels: ["Alenti Hygiene Chair"],
	},
];

export const faultReports: FaultReport[] = [
	{
		id: "F-2208",
		hospital: "Queen Mary Hospital",
		asset: "AST-10024",
		severity: "Critical",
		status: "Engineer Assigned",
		submittedAt: "09:42",
		description: "Lift arm stops midway during transfer.",
	},
	{
		id: "F-2207",
		hospital: "Prince of Wales Hospital",
		asset: "AST-10031",
		severity: "High",
		status: "Received",
		submittedAt: "08:16",
		description: "Standing aid battery does not hold charge.",
	},
	{
		id: "F-2199",
		hospital: "United Christian Hospital",
		asset: "AST-10047",
		severity: "Medium",
		status: "In Progress",
		submittedAt: "Yesterday",
		description: "Mattress pressure alarm intermittently active.",
	},
];

export const parts: Part[] = [
	{
		id: "P-4410",
		name: "Sling bar assembly",
		supplier: "Arjo HK",
		stock: 0,
		minimum: 2,
		unitCost: 1580,
	},
	{
		id: "P-3208",
		name: "Battery module 24V",
		supplier: "Arjo HK",
		stock: 3,
		minimum: 4,
		unitCost: 940,
	},
	{
		id: "P-2104",
		name: "Castor wheel kit",
		supplier: "MedSupply Asia",
		stock: 11,
		minimum: 6,
		unitCost: 180,
	},
];

export const shortages: Shortage[] = [
	{
		id: "S-801",
		job: "J-1038",
		part: "Sling bar assembly",
		engineer: "Arun Patel",
		status: "Waiting for parts",
	},
	{
		id: "S-798",
		job: "J-1049",
		part: "Battery module 24V",
		engineer: "Mandy Chan",
		status: "Reschedule ready",
	},
];

export const manualAnswers: ManualAnswer[] = [
	{
		id: "manual-01",
		title: "Sling bar removal and replacement",
		page: 42,
		excerpt:
			"Lock the lift arm, remove the retaining clip, support the sling bar, then replace the pivot bolt before load testing.",
	},
	{
		id: "manual-02",
		title: "Safe working load label verification",
		page: 9,
		excerpt:
			"The safe working load must match the model label and the site configuration before returning the lift to service.",
	},
	{
		id: "manual-03",
		title: "Battery fault isolation",
		page: 67,
		excerpt:
			"Check charger output, inspect battery terminals, and run the battery health diagnostic from the service menu.",
	},
];

export const systemParameters = [
	{ id: "mileage", label: "Mileage rate", value: "HK$4.80 / km" },
	{ id: "meal", label: "Meal cap", value: "HK$95 / day" },
	{ id: "pm", label: "PM advance window", value: "2 days" },
	{ id: "geofence", label: "Geofence radius", value: "200 m" },
	{ id: "countdown", label: "Alert countdown", value: "5 min" },
	{ id: "contract", label: "Contract warning", value: "30 days" },
	{ id: "retention", label: "GPS retention", value: "30 days" },
];

export const reportMetrics = [
	{
		id: "jobs",
		label: "Jobs completed",
		value: "128",
		trend: "+18% vs last month",
	},
	{
		id: "resolution",
		label: "Avg resolution",
		value: "5.4h",
		trend: "-1.1h vs last month",
	},
	{
		id: "firstFix",
		label: "First-fix rate",
		value: "82%",
		trend: "+6% vs last month",
	},
	{
		id: "cost",
		label: "Billable parts",
		value: "HK$18.2k",
		trend: "32% out of contract",
	},
];

export const serviceStateMachine = [
	"Created",
	"Assigned",
	"In Progress",
	"Paused",
	"Completed",
] as const;

export const liveAlerts = [
	{
		id: "alert-anomaly",
		title: "Timer anomaly",
		message:
			"Ivy Lee left Princess Margaret Hospital while J-1041 timer is running.",
		icon: AlertTriangleIcon,
		tone: "danger",
	},
	{
		id: "alert-pm",
		title: "PM opportunity",
		message:
			"Kelvin Wong is on-site at Queen Mary Hospital. AST-10024 PM is due in 2 days.",
		icon: RadioTowerIcon,
		tone: "info",
	},
	{
		id: "alert-contract",
		title: "Contract expiry",
		message: "Prince of Wales Hospital contract expires on 2026-06-18.",
		icon: ShieldCheckIcon,
		tone: "warning",
	},
];
