export type {
	Asset,
	Contract,
	ContractStatus,
	CostRecord,
	DashboardStat,
	Engineer,
	EngineerStatus,
	FaultReport,
	FaultStatus,
	Hospital,
	Job,
	JobStatus,
	JobType,
	LiveAlert,
	ManualAnswer,
	Part,
	Priority,
	ProductModel,
	ReportMetric,
	ServiceOpsSnapshot,
	Severity,
	Shortage,
	SystemParameter,
	TenantSummary,
} from "@luke/api/types/service-ops";

import {
	BoxesIcon,
	ClipboardListIcon,
	FileTextIcon,
	HospitalIcon,
	MapPinnedIcon,
	PackageCheckIcon,
	SettingsIcon,
	ShieldCheckIcon,
	SirenIcon,
	StethoscopeIcon,
	UsersIcon,
	WrenchIcon,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

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

export interface NavigationItem {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	id: BackOfficeView;
	label: string;
}

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

export const serviceStateMachine = [
	"Created",
	"Assigned",
	"In Progress",
	"Paused",
	"Completed",
] as const;
