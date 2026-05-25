"use client";

import { Button } from "@luke/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@luke/ui/components/card";
import { Input } from "@luke/ui/components/input";
import { Label } from "@luke/ui/components/label";
import { cn } from "@luke/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ActivityIcon,
	AlertTriangleIcon,
	ArrowRightIcon,
	BellRingIcon,
	CalendarIcon,
	CheckCircle2Icon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
	ClipboardCheckIcon,
	ClockIcon,
	CommandIcon,
	CreditCardIcon,
	DownloadIcon,
	EditIcon,
	FileQuestionIcon,
	HospitalIcon,
	Loader2Icon,
	LocateFixedIcon,
	MessageSquareTextIcon,
	NfcIcon,
	PauseCircleIcon,
	PlayCircleIcon,
	PlusIcon,
	ReceiptTextIcon,
	SearchIcon,
	ShieldCheckIcon,
	SlidersHorizontalIcon,
	SmartphoneIcon,
	Trash2Icon,
	TrendingUpIcon,
	UploadIcon,
	UsersIcon,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	type Asset,
	type BackOfficeView,
	type Contract,
	type ContractStatus,
	type Engineer,
	type EngineerStatus,
	type FaultReport,
	type FaultStatus,
	type Hospital,
	type Job,
	type JobStatus,
	type ManualAnswer,
	navigationItems,
	type Part,
	type ProductModel,
	type ServiceOpsSnapshot,
	serviceStateMachine,
} from "@/lib/service-ops-data";
import { trpc } from "@/utils/trpc";

type AppMode = "back-office" | "engineer" | "hospital";

type JobAction = "start" | "pause" | "resume" | "complete";

type CrudEntity =
	| "asset"
	| "contract"
	| "engineer"
	| "fault"
	| "hospital"
	| "job"
	| "part"
	| "product";

type CrudState =
	| { entity: CrudEntity; mode: "create"; record?: never }
	| { entity: CrudEntity; mode: "edit"; record: unknown };

interface FieldOption {
	label: string;
	value: string;
}

interface FieldConfig {
	label: string;
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

interface TableRow {
	actions?: ReactNode;
	cells: ReactNode[];
	id: string;
}

interface DataTableProps {
	columns: string[];
	description?: string;
	filterLabels?: string[];
	rows: TableRow[];
	title?: string;
}

const statusStyles: Record<JobStatus, string> = {
	Assigned: "border-sky-200 bg-sky-50 text-sky-700",
	Cancelled: "border-zinc-200 bg-zinc-50 text-zinc-600",
	Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
	Created: "border-zinc-200 bg-zinc-50 text-zinc-700",
	"In Progress": "border-blue-200 bg-blue-50 text-blue-700",
	Paused: "border-amber-200 bg-amber-50 text-amber-700",
	"Timer Anomaly": "border-rose-200 bg-rose-50 text-rose-700",
};

const engineerStatusStyles: Record<EngineerStatus, string> = {
	Idle: "bg-amber-500",
	"In transit": "bg-sky-500",
	"Off duty": "bg-zinc-400",
	"On-site": "bg-emerald-500",
	"Timer anomaly": "bg-rose-500",
};

const contractStatusStyles: Record<ContractStatus, string> = {
	Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
	Expired: "border-zinc-200 bg-zinc-50 text-zinc-600",
	Expiring: "border-amber-200 bg-amber-50 text-amber-700",
};

const faultStatusStyles: Record<FaultStatus, string> = {
	"Engineer Assigned": "border-sky-200 bg-sky-50 text-sky-700",
	"In Progress": "border-blue-200 bg-blue-50 text-blue-700",
	Received: "border-amber-200 bg-amber-50 text-amber-700",
	Resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const workflowCards = [
	{
		id: "job",
		title: "Job state machine",
		icon: ClipboardCheckIcon,
		detail:
			"Created -> Assigned -> In Progress -> Completed, with paused and anomaly branches.",
	},
	{
		id: "nfc",
		title: "NFC validation",
		icon: NfcIcon,
		detail:
			"Tag uid must match the assigned asset before timer and geofence can start.",
	},
	{
		id: "cost",
		title: "Server-computed cost",
		icon: ReceiptTextIcon,
		detail:
			"Labour, mileage, meal cap and parts billing flags are never accepted from clients.",
	},
	{
		id: "manual",
		title: "Manual Q&A beta",
		icon: FileQuestionIcon,
		detail:
			"Engineers receive top manual sections with page numbers after scanning a device.",
	},
];

const primaryActionClass = "rounded-md shadow-xs";

const panelClass = "rounded-lg border bg-card text-card-foreground shadow-xs";

const mutedPanelClass = "rounded-lg border bg-muted/35";

const iconTileClass =
	"flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground";

const compactButtonClass = "rounded-md";

const hospitalMapPositions = [
	{ left: "18%", top: "2rem" },
	{ right: "20%", top: "34%" },
	{ bottom: "22%", right: "34%" },
	{ bottom: "14%", left: "24%" },
] as const;

const engineerMapPositions = [
	{ left: "32%", top: "22%" },
	{ right: "28%", top: "48%" },
	{ bottom: "30%", left: "42%" },
] as const;

const roleLabels = [
	"admin",
	"coordinator",
	"engineer",
	"hospital_user",
] as const;

const entityLabels: Record<CrudEntity, string> = {
	asset: "asset",
	contract: "contract",
	engineer: "engineer",
	fault: "fault report",
	hospital: "hospital",
	job: "job",
	part: "part",
	product: "product",
};

const engineerStatusOptions: FieldOption[] = [
	{ label: "On-site", value: "on_site" },
	{ label: "In transit", value: "in_transit" },
	{ label: "Idle", value: "idle" },
	{ label: "Timer anomaly", value: "timer_anomaly" },
	{ label: "Off duty", value: "off_duty" },
];

const coverageOptions: FieldOption[] = [
	{ label: "In contract", value: "in_contract" },
	{ label: "Out of contract", value: "out_of_contract" },
	{ label: "Billable exception", value: "billable_exception" },
	{ label: "Expired", value: "expired" },
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

type CoverageValue = (typeof coverageValues)[number];
type EngineerStatusValue = (typeof engineerStatusValues)[number];
type JobTypeValue = (typeof jobTypeValues)[number];
type JobStatusValue = (typeof jobStatusValues)[number];
type PriorityValue = (typeof priorityValues)[number];
type ContractTypeValue = (typeof contractTypeValues)[number];
type ContractStatusValue = (typeof contractStatusValues)[number];
type FaultSeverityValue = (typeof faultSeverityValues)[number];
type FaultStatusValue = (typeof faultStatusValues)[number];

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

interface ProductPayload {
	category: string;
	code: string;
	defaultPmCycleMonths: number;
	isEngineerReadOnly: boolean;
	manufacturer: string;
	modelName: string;
}

interface PartPayload {
	minimumStock: number;
	name: string;
	partNumber: string;
	stockOnHand: number;
	supplier: string;
	unitCost: number;
}

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

interface ContractPayload {
	accountManagerName: string;
	contractNumber: string;
	coveredModelIds: string[];
	endDate: string;
	hospitalId: string;
	responseSlaHours: number;
	startDate: string;
	status: ContractStatusValue;
	type: ContractTypeValue;
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

const alertIconByType = {
	contract: ShieldCheckIcon,
	geofence: AlertTriangleIcon,
	pm: BellRingIcon,
	status: ActivityIcon,
	stock: ReceiptTextIcon,
} as const;

const backOfficeTitles: Record<BackOfficeView, string> = {
	assets: "Installed Assets",
	config: "System Config",
	contracts: "Contracts",
	dashboard: "Dashboard",
	engineers: "Engineers",
	faults: "Faults",
	hospitals: "Hospitals",
	jobs: "Jobs",
	map: "Map",
	parts: "Parts & Stock",
	products: "Product Catalogue",
	reports: "Reports",
};

const getBackOfficeTitle = (view: BackOfficeView) => backOfficeTitles[view];

const getHashBackOfficeView = (): BackOfficeView | null => {
	if (typeof window === "undefined") {
		return null;
	}

	const hashView = window.location.hash.replace("#", "");
	const navigationItem = navigationItems.find((item) => item.id === hashView);

	return navigationItem?.id ?? null;
};

export default function ServiceOpsPlatform({
	initialData,
}: {
	initialData: ServiceOpsSnapshot;
}) {
	const snapshotQuery = useQuery(
		trpc.serviceOps.snapshot.queryOptions(
			{ tenantId: initialData.tenant.id },
			{ initialData, staleTime: 30_000 }
		)
	);
	const data = snapshotQuery.data ?? initialData;
	const { assets, engineers, jobs, manualAnswers, tenant } = data;
	const [mode, setMode] = useState<AppMode>("back-office");
	const [activeView, setActiveView] = useState<BackOfficeView>("dashboard");
	const [firstJob] = jobs;
	const [firstAsset] = assets;
	const [selectedJobId, setSelectedJobId] = useState(firstJob?.id ?? "");
	const [jobRuntimeStatus, setJobRuntimeStatus] =
		useState<JobStatus>("Assigned");
	const [faultStatus, setFaultStatus] = useState<FaultStatus>("Received");
	const [manualQuery, setManualQuery] = useState(
		"How do I replace the sling bar assembly?"
	);
	const [crudState, setCrudState] = useState<CrudState | null>(null);

	const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? firstJob;
	const selectedAsset = selectedJob
		? (assets.find((asset) => asset.id === selectedJob.asset) ?? firstAsset)
		: firstAsset;
	const selectedEngineer = engineers.find(
		(engineer) => engineer.name === selectedJob?.engineer
	);

	useEffect(() => {
		if (!selectedJobId && firstJob) {
			setSelectedJobId(firstJob.id);
		}
	}, [firstJob, selectedJobId]);

	const filteredManualAnswers = useMemo(() => {
		const normalizedQuery = manualQuery.toLowerCase();

		if (!normalizedQuery.trim()) {
			return manualAnswers;
		}

		return manualAnswers.filter((answer) => {
			const [firstTerm] = normalizedQuery.split(" ");

			return `${answer.title} ${answer.excerpt}`
				.toLowerCase()
				.includes(firstTerm ?? "");
		});
	}, [manualAnswers, manualQuery]);

	useEffect(() => {
		const syncViewFromUrl = () => {
			const hashView = getHashBackOfficeView();

			setActiveView(hashView ?? "dashboard");
		};

		syncViewFromUrl();
		window.addEventListener("hashchange", syncViewFromUrl);
		window.addEventListener("popstate", syncViewFromUrl);

		return () => {
			window.removeEventListener("hashchange", syncViewFromUrl);
			window.removeEventListener("popstate", syncViewFromUrl);
		};
	}, []);

	const applyJobAction = (action: JobAction) => {
		const nextStatusByAction: Record<JobAction, JobStatus> = {
			complete: "Completed",
			pause: "Paused",
			resume: "In Progress",
			start: "In Progress",
		};

		setJobRuntimeStatus(nextStatusByAction[action]);
	};

	const engineerModeContent =
		selectedJob && selectedAsset ? (
			<EngineerWorkspace
				jobRuntimeStatus={jobRuntimeStatus}
				manualAnswers={filteredManualAnswers}
				manualQuery={manualQuery}
				onJobAction={applyJobAction}
				selectedAsset={selectedAsset}
				selectedEngineer={selectedEngineer?.name ?? "Engineer"}
				selectedJob={selectedJob}
				setManualQuery={setManualQuery}
			/>
		) : (
			<EmptyWorkspace
				eyebrow="Engineer workflow"
				title="No assigned jobs yet"
			/>
		);

	const selectBackOfficeView = (view: BackOfficeView) => {
		setActiveView(view);

		const nextUrl = `${window.location.pathname}${window.location.search}#${view}`;

		if (window.location.href !== new URL(nextUrl, window.location.href).href) {
			window.history.pushState({ backOfficeView: view }, "", nextUrl);
		}

		if (window.matchMedia("(max-width: 1023px)").matches) {
			window.requestAnimationFrame(() => {
				document
					.getElementById("back-office-content")
					?.scrollIntoView({ behavior: "smooth", block: "start" });
			});
		}
	};

	return (
		<main className="min-h-svh bg-background text-foreground">
			<div className="min-h-svh">
				{mode === "back-office" ? (
					<div className="grid min-h-svh grid-cols-1 lg:grid-cols-[272px_minmax(0,1fr)]">
						<aside className="flex w-full min-w-0 flex-col overflow-hidden border-b bg-sidebar text-sidebar-foreground lg:min-h-svh lg:border-r lg:border-b-0">
							<div className="flex h-14 items-center gap-3 border-b px-4">
								<div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
									<CommandIcon className="size-4" />
								</div>
								<div className="min-w-0">
									<p className="truncate font-semibold text-sm">Utiliti</p>
									<p className="truncate text-muted-foreground text-xs">
										{tenant.name}
									</p>
								</div>
							</div>
							<nav className="flex min-w-0 max-w-full gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:overflow-visible lg:py-4">
								{navigationItems.map((item) => {
									const Icon = item.icon;
									const isActive = activeView === item.id;

									return (
										<button
											aria-current={isActive ? "page" : undefined}
											className={cn(
												"flex h-9 min-w-max cursor-pointer items-center gap-3 rounded-md px-3 text-left text-sm transition-colors lg:w-full",
												isActive
													? "bg-sidebar-accent text-sidebar-accent-foreground shadow-xs"
													: "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
											)}
											key={item.id}
											onClick={() => selectBackOfficeView(item.id)}
											type="button"
										>
											<Icon className="size-4" />
											{item.label}
										</button>
									);
								})}
							</nav>
							<div className="mt-auto hidden border-t p-3 lg:block">
								<div className="flex items-center gap-3 rounded-lg border bg-card/80 p-2 shadow-xs">
									<div className="flex size-8 items-center justify-center rounded-md bg-muted font-semibold text-xs">
										AU
									</div>
									<div className="min-w-0">
										<p className="truncate font-medium text-sm">Admin User</p>
										<p className="text-muted-foreground text-xs">admin</p>
									</div>
								</div>
							</div>
						</aside>
						<div className="min-w-0">
							<header className="sticky top-0 z-20 flex min-h-14 flex-col gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur lg:flex-row lg:items-center lg:justify-between lg:px-6">
								<div className="min-w-0">
									<p className="text-muted-foreground text-xs">
										Service Operations
									</p>
									<h1 className="truncate font-semibold text-lg">
										{getBackOfficeTitle(activeView)}
									</h1>
									<p className="mt-0.5 text-muted-foreground text-xs">
										{tenant.release} · {tenant.region} service operations
									</p>
								</div>
								<SurfaceSwitcher mode={mode} setMode={setMode} />
							</header>
							<section
								className="@container/main min-w-0 px-4 py-4 md:py-6 lg:px-6"
								id="back-office-content"
							>
								<BackOfficeViewPanel
									activeView={activeView}
									data={data}
									onCreate={(entity) =>
										setCrudState({ entity, mode: "create" })
									}
									onEdit={(entity, record) =>
										setCrudState({ entity, mode: "edit", record })
									}
									selectedJob={selectedJob}
									selectedJobId={selectedJobId}
									setSelectedJobId={setSelectedJobId}
								/>
							</section>
						</div>
					</div>
				) : (
					<>
						<header className="border-b bg-background">
							<div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
								<div className="flex items-center gap-3">
									<div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
										<ActivityIcon className="size-5" />
									</div>
									<div className="min-w-0">
										<p className="text-muted-foreground text-xs">
											{tenant.release}
										</p>
										<h1 className="truncate font-semibold text-xl">
											{tenant.name} Service Operations
										</h1>
									</div>
								</div>
								<SurfaceSwitcher mode={mode} setMode={setMode} />
							</div>
						</header>
						{mode === "engineer" ? engineerModeContent : null}

						{mode === "hospital" ? (
							<HospitalFaultPortal
								faultStatus={faultStatus}
								setFaultStatus={setFaultStatus}
							/>
						) : null}
					</>
				)}
			</div>
			<CrudDialog
				data={data}
				onClose={() => setCrudState(null)}
				state={crudState}
			/>
		</main>
	);
}

function SurfaceSwitcher({
	mode,
	setMode,
}: {
	mode: AppMode;
	setMode: (mode: AppMode) => void;
}) {
	return (
		<div className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1">
			<ModeButton
				active={mode === "back-office"}
				onClick={() => setMode("back-office")}
			>
				<UsersIcon className="size-4" />
				Back Office
			</ModeButton>
			<ModeButton
				active={mode === "engineer"}
				onClick={() => setMode("engineer")}
			>
				<SmartphoneIcon className="size-4" />
				Engineer App
			</ModeButton>
			<ModeButton
				active={mode === "hospital"}
				onClick={() => setMode("hospital")}
			>
				<HospitalIcon className="size-4" />
				Hospital Web
			</ModeButton>
		</div>
	);
}

function ModeButton({
	active,
	children,
	onClick,
}: {
	active: boolean;
	children: ReactNode;
	onClick: () => void;
}) {
	return (
		<button
			className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors ${
				active
					? "bg-background text-foreground shadow-xs"
					: "text-muted-foreground hover:bg-background/70 hover:text-foreground"
			}`}
			onClick={onClick}
			type="button"
		>
			{children}
		</button>
	);
}

function BackOfficeViewPanel({
	activeView,
	data,
	onCreate,
	onEdit,
	selectedJob,
	selectedJobId,
	setSelectedJobId,
}: {
	activeView: BackOfficeView;
	data: ServiceOpsSnapshot;
	onCreate: (entity: CrudEntity) => void;
	onEdit: (entity: CrudEntity, record: unknown) => void;
	selectedJob?: Job;
	selectedJobId: string;
	setSelectedJobId: (jobId: string) => void;
}) {
	const {
		assets,
		contracts,
		costRecords,
		dashboardStats,
		engineers,
		faultReports,
		hospitals,
		jobs,
		liveAlerts,
		parts,
		products,
		reportMetrics,
		shortages,
		systemParameters,
	} = data;

	if (activeView === "jobs") {
		return (
			<PageFrame
				action={
					<Button
						className={primaryActionClass}
						onClick={() => onCreate("job")}
					>
						<PlusIcon className="size-4" />
						New job
					</Button>
				}
				eyebrow="A. Job Management"
				title="Job dispatch and state control"
			>
				<div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
					<div className="space-y-4">
						<DataTable
							columns={[
								"Job",
								"Type",
								"Status",
								"Priority",
								"Engineer",
								"Schedule",
							]}
							description="Recent service jobs with dispatch state, priority, engineer ownership, and schedule activity."
							filterLabels={["Status", "Job type", "Engineer"]}
							rows={jobs.map((job) => ({
								cells: [
									<button
										className="font-medium text-primary hover:underline"
										key={`${job.id}-button`}
										onClick={() => setSelectedJobId(job.id)}
										type="button"
									>
										{job.id}
									</button>,
									job.type,
									<StatusPill
										className={statusStyles[job.status]}
										key={`${job.id}-status`}
									>
										{job.status}
									</StatusPill>,
									job.priority,
									job.engineer,
									job.scheduledFor,
								],
								actions: (
									<RowActions
										entity="job"
										id={job.recordId}
										onEdit={() => onEdit("job", job)}
										tenantId={data.tenant.id}
									/>
								),
								id: job.id,
							}))}
							title={`${jobs.length} Jobs`}
						/>
					</div>
					<Card className={panelClass}>
						<CardHeader>
							<CardTitle>
								{selectedJob?.id ?? selectedJobId} audit trail
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<StateMachine currentStatus={selectedJob?.status ?? "Created"} />
							<div className={`${mutedPanelClass} p-3 text-sm`}>
								<p className="font-medium">Latest event</p>
								<p className="mt-1 text-muted-foreground">
									{selectedJob?.audit ?? "No audit events yet."}
								</p>
							</div>
							<div className="grid grid-cols-2 gap-3 text-sm">
								<Metric
									label="Timer"
									value={`${selectedJob?.timerMinutes ?? 0} min`}
								/>
								<Metric label="Cost" value={`HK$${selectedJob?.cost ?? 0}`} />
							</div>
						</CardContent>
					</Card>
				</div>
			</PageFrame>
		);
	}

	if (activeView === "assets") {
		return (
			<PageFrame
				action={
					<Button
						className={primaryActionClass}
						onClick={() => onCreate("asset")}
					>
						<PlusIcon className="size-4" />
						Register asset
					</Button>
				}
				eyebrow="B. Asset & Device Management"
				title="Installed asset registry"
			>
				<DataTable
					columns={[
						"Asset",
						"Model",
						"Hospital",
						"Location",
						"NFC UID",
						"Coverage",
						"Next PM",
					]}
					description="Installed equipment records with NFC tags, contract coverage, and preventive maintenance dates."
					filterLabels={["Coverage", "Hospital"]}
					rows={assets.map((asset) => ({
						cells: [
							<span className="font-medium" key={`${asset.id}-label`}>
								{asset.id}
							</span>,
							asset.model,
							asset.hospital,
							asset.location,
							asset.nfcUid,
							asset.contractCoverage,
							asset.nextPmDue,
						],
						actions: (
							<RowActions
								entity="asset"
								id={asset.recordId}
								onEdit={() => onEdit("asset", asset)}
								tenantId={data.tenant.id}
							/>
						),
						id: asset.id,
					}))}
					title={`${assets.length} Assets`}
				/>
			</PageFrame>
		);
	}

	if (activeView === "products") {
		return (
			<PageFrame
				action={
					<Button
						className={primaryActionClass}
						onClick={() => onCreate("product")}
					>
						<PlusIcon className="size-4" />
						New product
					</Button>
				}
				eyebrow="B-05 Product Catalogue"
				title="Product models and service manuals"
			>
				<DataTable
					columns={[
						"Model",
						"Default PM cycle",
						"Parts list",
						"Manual",
						"Engineer access",
					]}
					description="Product models, PM cycles, parts lists, and engineer-facing manual access."
					filterLabels={["PM cycle", "Manual"]}
					rows={products.map((product) => ({
						cells: [
							product.modelName,
							`${product.defaultPmCycleMonths} months`,
							product.partsList.join(", ") || "No parts linked",
							product.manualFileName,
							product.engineerAccess,
						],
						actions: (
							<RowActions
								entity="product"
								id={product.id}
								onEdit={() => onEdit("product", product)}
								tenantId={data.tenant.id}
							/>
						),
						id: product.id,
					}))}
					title={`${products.length} Products`}
				/>
			</PageFrame>
		);
	}

	if (activeView === "hospitals") {
		return (
			<PageFrame
				action={
					<Button
						className={primaryActionClass}
						onClick={() => onCreate("hospital")}
					>
						<PlusIcon className="size-4" />
						New hospital
					</Button>
				}
				eyebrow="Tenant sites"
				title="Hospitals and contract status"
			>
				<DataTable
					columns={[
						"Hospital",
						"District",
						"Contract",
						"Assets",
						"Open jobs",
						"Location",
					]}
					description="Hospital sites with contract state, asset count, and open field-service demand."
					filterLabels={["Contract", "District"]}
					rows={hospitals.map((hospital) => ({
						cells: [
							hospital.name,
							hospital.district,
							<StatusPill
								className={contractStatusStyles[hospital.contractStatus]}
								key={`${hospital.id}-status`}
							>
								{hospital.contractStatus}
							</StatusPill>,
							hospital.assets,
							hospital.openJobs,
							`${hospital.lat}, ${hospital.lng}`,
						],
						actions: (
							<RowActions
								entity="hospital"
								id={hospital.id}
								onEdit={() => onEdit("hospital", hospital)}
								tenantId={data.tenant.id}
							/>
						),
						id: hospital.id,
					}))}
					title={`${hospitals.length} Hospitals`}
				/>
			</PageFrame>
		);
	}

	if (activeView === "engineers") {
		return (
			<PageFrame
				action={
					<Button
						className={primaryActionClass}
						onClick={() => onCreate("engineer")}
					>
						<PlusIcon className="size-4" />
						New engineer
					</Button>
				}
				eyebrow="F-01 Engineer Management"
				title="Engineer profiles and rates"
			>
				<DataTable
					columns={[
						"Engineer",
						"Grade",
						"Status",
						"Region",
						"Hourly",
						"Mileage",
						"Meal cap",
					]}
					description="Engineer profiles with live status, service region, and billing rate configuration."
					filterLabels={["Status", "Region"]}
					rows={engineers.map((engineer) => ({
						cells: [
							engineer.name,
							engineer.grade,
							<div
								className="flex items-center gap-2"
								key={`${engineer.id}-status`}
							>
								<span
									className={`size-2 rounded-full ${engineerStatusStyles[engineer.status]}`}
								/>
								{engineer.status}
							</div>,
							engineer.region,
							`HK$${engineer.hourlyRate}`,
							`HK$${engineer.mileageRate}/km`,
							`HK$${engineer.mealCap}`,
						],
						actions: (
							<RowActions
								entity="engineer"
								id={engineer.id}
								onEdit={() => onEdit("engineer", engineer)}
								tenantId={data.tenant.id}
							/>
						),
						id: engineer.id,
					}))}
					title={`${engineers.length} Engineers`}
				/>
			</PageFrame>
		);
	}

	if (activeView === "contracts") {
		return (
			<ContractsView
				contracts={contracts}
				onCreate={() => onCreate("contract")}
				onEdit={(contract) => onEdit("contract", contract)}
				tenantId={data.tenant.id}
			/>
		);
	}

	if (activeView === "map") {
		return (
			<MapView
				engineers={engineers}
				hospitals={hospitals}
				liveAlerts={liveAlerts}
			/>
		);
	}

	if (activeView === "faults") {
		return (
			<PageFrame
				action={
					<Button
						className={primaryActionClass}
						onClick={() => onCreate("fault")}
					>
						<PlusIcon className="size-4" />
						Manual fault
					</Button>
				}
				eyebrow="G. Fault Reporting"
				title="Fault intake and status tracking"
			>
				<DataTable
					columns={[
						"Report",
						"Hospital",
						"Asset",
						"Severity",
						"Status",
						"Description",
					]}
					description="Fault reports submitted from hospital web forms and converted into repair workflow."
					filterLabels={["Severity", "Status"]}
					rows={faultReports.map((fault) => ({
						cells: [
							<span className="font-medium" key={`${fault.id}-label`}>
								{fault.id}
							</span>,
							fault.hospital,
							fault.asset,
							fault.severity,
							<StatusPill
								className={faultStatusStyles[fault.status]}
								key={`${fault.id}-status`}
							>
								{fault.status}
							</StatusPill>,
							fault.description,
						],
						actions: (
							<RowActions
								entity="fault"
								id={fault.recordId}
								onEdit={() => onEdit("fault", fault)}
								tenantId={data.tenant.id}
							/>
						),
						id: fault.id,
					}))}
					title={`${faultReports.length} Fault Reports`}
				/>
			</PageFrame>
		);
	}

	if (activeView === "parts") {
		return (
			<PartsView
				onCreate={() => onCreate("part")}
				onEdit={(part) => onEdit("part", part)}
				parts={parts}
				shortages={shortages}
				tenantId={data.tenant.id}
			/>
		);
	}

	if (activeView === "reports") {
		return (
			<ReportsView costRecords={costRecords} reportMetrics={reportMetrics} />
		);
	}

	if (activeView === "config") {
		return <ConfigView systemParameters={systemParameters} />;
	}

	return (
		<DashboardView
			dashboardStats={dashboardStats}
			jobs={jobs}
			liveAlerts={liveAlerts}
		/>
	);
}

function ContractsView({
	contracts,
	onCreate,
	onEdit,
	tenantId,
}: {
	contracts: ServiceOpsSnapshot["contracts"];
	onCreate: () => void;
	onEdit: (contract: ServiceOpsSnapshot["contracts"][number]) => void;
	tenantId: string;
}) {
	return (
		<PageFrame
			action={
				<Button className={primaryActionClass} onClick={onCreate}>
					<PlusIcon className="size-4" />
					New contract
				</Button>
			}
			eyebrow="C. Contract Management"
			title="Coverage and expiry controls"
		>
			<div className="grid gap-4 lg:grid-cols-3">
				{contracts.length > 0 ? (
					contracts.map((contract) => (
						<Card className={panelClass} key={contract.id}>
							<CardHeader>
								<div className="flex items-start justify-between gap-3">
									<CardTitle>{contract.hospital}</CardTitle>
									<div className="flex items-center gap-2">
										<StatusPill
											className={contractStatusStyles[contract.status]}
										>
											{contract.status}
										</StatusPill>
										<RowActions
											entity="contract"
											id={contract.recordId}
											onEdit={() => onEdit(contract)}
											tenantId={tenantId}
										/>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-3 text-sm">
								<Metric label="Contract" value={contract.id} />
								<Metric label="Type" value={contract.type} />
								<Metric label="SLA" value={`${contract.slaHours}h response`} />
								<Metric label="Expiry" value={contract.expiry} />
								<div>
									<p className="text-muted-foreground text-xs">
										Covered models
									</p>
									<p className="mt-1">{contract.coveredModels.join(", ")}</p>
								</div>
							</CardContent>
						</Card>
					))
				) : (
					<div className="lg:col-span-3">
						<EmptyInline message="No contracts yet." />
					</div>
				)}
			</div>
		</PageFrame>
	);
}

function MapView({
	engineers,
	hospitals,
	liveAlerts,
}: {
	engineers: ServiceOpsSnapshot["engineers"];
	hospitals: ServiceOpsSnapshot["hospitals"];
	liveAlerts: ServiceOpsSnapshot["liveAlerts"];
}) {
	const hasLiveAlerts = liveAlerts.length > 0;

	return (
		<PageFrame
			eyebrow="F. Location Operations"
			title="Live map and geofence alerts"
		>
			<div className="grid gap-4 xl:grid-cols-[1fr_360px]">
				<div className="relative min-h-[560px] overflow-hidden rounded-lg border bg-muted/40">
					<div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,.22)_1px,transparent_1px),linear-gradient(rgba(148,163,184,.22)_1px,transparent_1px)] bg-[size:44px_44px]" />
					<div className="absolute inset-0 bg-gradient-to-br from-background/70 via-transparent to-primary/10" />
					{hospitals.slice(0, 4).map((hospital, index) => (
						<div
							className="absolute"
							key={hospital.id}
							style={hospitalMapPositions[index] ?? hospitalMapPositions[0]}
						>
							<MapPin label={hospital.name} status={hospital.contractStatus} />
						</div>
					))}
					{engineers.slice(0, 3).map((engineer, index) => (
						<div
							className="absolute"
							key={engineer.id}
							style={engineerMapPositions[index] ?? engineerMapPositions[0]}
						>
							<EngineerDot engineer={engineer.name} status={engineer.status} />
						</div>
					))}
					<div className="absolute right-4 bottom-4 rounded-lg border bg-card/95 p-3 text-xs shadow-xs backdrop-blur">
						<p className="font-medium">Google Maps layer placeholder</p>
						<p className="mt-1 text-muted-foreground">
							Hospital pins and live engineer GPS dots share the same location
							stack.
						</p>
					</div>
				</div>
				<div className="space-y-3">
					{hasLiveAlerts ? (
						liveAlerts.map((alert) => {
							const Icon = alertIconByType[alert.type];

							return (
								<Card className={panelClass} key={alert.id}>
									<CardContent className="flex gap-3 pt-4">
										<span className={iconTileClass}>
											<Icon className="size-4" />
										</span>
										<div>
											<p className="font-medium text-sm">{alert.title}</p>
											<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
												{alert.message}
											</p>
										</div>
									</CardContent>
								</Card>
							);
						})
					) : (
						<EmptyInline message="No live alerts on the map." />
					)}
				</div>
			</div>
		</PageFrame>
	);
}

function PartsView({
	onCreate,
	onEdit,
	parts,
	shortages,
	tenantId,
}: {
	onCreate: () => void;
	onEdit: (part: ServiceOpsSnapshot["parts"][number]) => void;
	parts: ServiceOpsSnapshot["parts"];
	shortages: ServiceOpsSnapshot["shortages"];
	tenantId: string;
}) {
	return (
		<PageFrame
			action={
				<Button className={primaryActionClass} onClick={onCreate}>
					<PlusIcon className="size-4" />
					New part
				</Button>
			}
			eyebrow="H. Parts & Inventory"
			title="Inventory and shortage queue"
		>
			<div className="grid gap-4 xl:grid-cols-[1fr_380px]">
				<DataTable
					columns={[
						"Part",
						"Name",
						"Supplier",
						"Stock",
						"Minimum",
						"Unit cost",
					]}
					description="Parts stock levels, minimum thresholds, supplier records, and unit cost controls."
					filterLabels={["Stock status", "Supplier"]}
					rows={parts.map((part) => ({
						cells: [
							<span className="font-medium" key={`${part.id}-label`}>
								{part.id}
							</span>,
							part.name,
							part.supplier,
							<span
								className={part.stock < part.minimum ? "text-rose-600" : ""}
								key={`${part.id}-stock`}
							>
								{part.stock}
							</span>,
							part.minimum,
							`HK$${part.unitCost}`,
						],
						actions: (
							<RowActions
								entity="part"
								id={part.recordId}
								onEdit={() => onEdit(part)}
								tenantId={tenantId}
							/>
						),
						id: part.id,
					}))}
					title={`${parts.length} Parts`}
				/>
				<Card className={panelClass}>
					<CardHeader>
						<CardTitle>Shortage queue</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{shortages.length > 0 ? (
							shortages.map((shortage) => (
								<div
									className={`${mutedPanelClass} p-3 text-sm`}
									key={shortage.id}
								>
									<div className="flex items-center justify-between gap-3">
										<p className="font-medium">{shortage.job}</p>
										<StatusPill className="border-amber-200 bg-amber-50 text-amber-700">
											{shortage.status}
										</StatusPill>
									</div>
									<p className="mt-1 text-muted-foreground">
										{shortage.part} requested by {shortage.engineer}
									</p>
								</div>
							))
						) : (
							<EmptyInline message="No shortage requests yet." />
						)}
					</CardContent>
				</Card>
			</div>
		</PageFrame>
	);
}

function ReportsView({
	costRecords,
	reportMetrics,
}: {
	costRecords: ServiceOpsSnapshot["costRecords"];
	reportMetrics: ServiceOpsSnapshot["reportMetrics"];
}) {
	return (
		<PageFrame
			eyebrow="I. Reports"
			title="Operational report and job-level cost view"
		>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{reportMetrics.length > 0 ? (
					reportMetrics.map((metric) => (
						<Card className={panelClass} key={metric.id}>
							<CardContent className="pt-4">
								<p className="text-muted-foreground text-xs">{metric.label}</p>
								<p className="mt-2 font-semibold text-2xl">{metric.value}</p>
								<p className="mt-1 text-primary text-xs">{metric.trend}</p>
							</CardContent>
						</Card>
					))
				) : (
					<div className="md:col-span-2 xl:col-span-4">
						<EmptyInline message="No report metrics yet." />
					</div>
				)}
			</div>
			<div className="mt-4">
				<DataTable
					columns={[
						"Job",
						"Labour",
						"Mileage",
						"Meals",
						"Parts absorbed",
						"Parts billable",
					]}
					description="Job-level cost lines across labour, travel, meal receipts, and parts billing."
					filterLabels={["Cost type", "Billing"]}
					rows={costRecords.map((record) => ({
						cells: [
							record.job,
							record.labour,
							record.mileage,
							record.meals,
							record.partsAbsorbed,
							record.partsBillable,
						],
						id: record.id,
					}))}
					title={`${costRecords.length} Cost Records`}
				/>
			</div>
		</PageFrame>
	);
}

function ConfigView({
	systemParameters,
}: {
	systemParameters: ServiceOpsSnapshot["systemParameters"];
}) {
	return (
		<PageFrame
			eyebrow="J. System Configuration"
			title="Parameters, roles and notifications"
		>
			<div className="grid gap-4 lg:grid-cols-[1fr_380px]">
				<Card className={panelClass}>
					<CardHeader>
						<CardTitle>System parameters</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-3 md:grid-cols-2">
						{systemParameters.length > 0 ? (
							systemParameters.map((parameter) => (
								<Metric
									key={parameter.id}
									label={parameter.label}
									value={parameter.value}
								/>
							))
						) : (
							<div className="md:col-span-2">
								<EmptyInline message="No system parameters yet." />
							</div>
						)}
					</CardContent>
				</Card>
				<Card className={panelClass}>
					<CardHeader>
						<CardTitle>User roles</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						{roleLabels.map((role) => (
							<div
								className="flex items-center justify-between border-b pb-2 last:border-b-0"
								key={role}
							>
								<span>{role}</span>
								<ShieldCheckIcon className="size-4 text-primary" />
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		</PageFrame>
	);
}

function DashboardView({
	dashboardStats,
	jobs,
	liveAlerts,
}: {
	dashboardStats: ServiceOpsSnapshot["dashboardStats"];
	jobs: Job[];
	liveAlerts: ServiceOpsSnapshot["liveAlerts"];
}) {
	const hasLiveAlerts = liveAlerts.length > 0;

	return (
		<PageFrame eyebrow="Operational Command" title="Today at a glance">
			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
				{dashboardStats.map((stat) => (
					<DashboardStatCard key={stat.id} stat={stat} />
				))}
			</div>
			<div className="mt-3 grid gap-3 xl:grid-cols-[1fr_360px]">
				<Card className={panelClass}>
					<CardHeader className="border-b pb-3">
						<CardTitle>Live exception queue</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-2 pt-0">
						{hasLiveAlerts ? (
							liveAlerts.map((alert) => {
								const Icon = alertIconByType[alert.type];

								return (
									<div
										className="flex gap-3 border-b py-3 last:border-b-0"
										key={alert.id}
									>
										<span className={iconTileClass}>
											<Icon className="size-4" />
										</span>
										<div>
											<p className="font-medium text-sm">{alert.title}</p>
											<p className="mt-0.5 text-muted-foreground text-xs">
												{alert.message}
											</p>
										</div>
									</div>
								);
							})
						) : (
							<EmptyInline message="No live exceptions." />
						)}
					</CardContent>
				</Card>
				<Card className={panelClass}>
					<CardHeader className="border-b pb-3">
						<CardTitle>Release scope coverage</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-3 pt-0">
						{workflowCards.map((card) => {
							const Icon = card.icon;

							return (
								<div className="flex gap-3" key={card.id}>
									<span className={iconTileClass}>
										<Icon className="size-4" />
									</span>
									<div>
										<p className="font-medium text-sm">{card.title}</p>
										<p className="text-muted-foreground text-xs leading-relaxed">
											{card.detail}
										</p>
									</div>
								</div>
							);
						})}
					</CardContent>
				</Card>
			</div>
			<div className="mt-3">
				<DataTable
					columns={[
						"Job",
						"Hospital",
						"Asset",
						"Engineer",
						"Status",
						"Schedule",
					]}
					description="Recent field-service work with hospital, assigned engineer, live status, and schedule."
					filterLabels={["Status", "Engineer"]}
					rows={jobs.slice(0, 5).map((job) => ({
						cells: [
							<span className="font-medium text-primary" key={`${job.id}-id`}>
								{job.id}
							</span>,
							job.hospital,
							job.asset,
							job.engineer,
							<StatusPill
								className={statusStyles[job.status]}
								key={`${job.id}-status`}
							>
								{job.status}
							</StatusPill>,
							job.scheduledFor,
						],
						id: `${job.id}-dashboard`,
					}))}
					title="Today jobs"
				/>
			</div>
		</PageFrame>
	);
}

function EngineerWorkspace({
	jobRuntimeStatus,
	manualAnswers,
	manualQuery,
	onJobAction,
	selectedAsset,
	selectedEngineer,
	selectedJob,
	setManualQuery,
}: {
	jobRuntimeStatus: JobStatus;
	manualAnswers: ManualAnswer[];
	manualQuery: string;
	onJobAction: (action: JobAction) => void;
	selectedAsset: ServiceOpsSnapshot["assets"][number];
	selectedEngineer: string;
	selectedJob?: Job;
	setManualQuery: (query: string) => void;
}) {
	return (
		<section className="mx-auto grid w-full max-w-[1320px] flex-1 gap-4 p-4 lg:grid-cols-[390px_1fr] lg:p-6">
			<div className="rounded-2xl border bg-foreground p-2 shadow-lg">
				<div className="overflow-hidden rounded-xl bg-card">
					<div className="bg-primary px-4 py-5 text-primary-foreground">
						<p className="text-primary-foreground/70 text-xs">Engineer App</p>
						<h2 className="mt-1 font-semibold text-xl">{selectedEngineer}</h2>
						<p className="text-primary-foreground/80 text-sm">
							Clocked in · GPS active · Weak WiFi queue ready
						</p>
					</div>
					<div className="space-y-4 p-4">
						<Card className={panelClass}>
							<CardContent className="space-y-3 pt-4">
								<div className="flex items-center justify-between">
									<p className="font-semibold">
										{selectedJob?.id} · {selectedJob?.type}
									</p>
									<StatusPill className={statusStyles[jobRuntimeStatus]}>
										{jobRuntimeStatus}
									</StatusPill>
								</div>
								<p className="text-muted-foreground text-sm">
									{selectedJob?.hospital}
								</p>
								<div className={`${mutedPanelClass} p-3 text-sm`}>
									<p className="font-medium">{selectedAsset.model}</p>
									<p className="text-muted-foreground">
										{selectedAsset.location}
									</p>
									<p className="mt-2 text-primary text-xs">
										NFC UID: {selectedAsset.nfcUid}
									</p>
								</div>
								<div className="grid grid-cols-2 gap-2">
									<Button
										className={primaryActionClass}
										onClick={() => onJobAction("start")}
									>
										<PlayCircleIcon className="size-4" />
										NFC start
									</Button>
									<Button
										className={compactButtonClass}
										onClick={() => onJobAction("pause")}
										variant="outline"
									>
										<PauseCircleIcon className="size-4" />
										Parts pause
									</Button>
									<Button
										className={compactButtonClass}
										onClick={() => onJobAction("resume")}
										variant="outline"
									>
										<ClockIcon className="size-4" />
										Resume
									</Button>
									<Button
										className={compactButtonClass}
										onClick={() => onJobAction("complete")}
										variant="outline"
									>
										<CheckCircle2Icon className="size-4" />
										NFC end
									</Button>
								</div>
							</CardContent>
						</Card>

						<Card className={panelClass}>
							<CardHeader>
								<CardTitle>Log expenses and parts</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<Metric label="Mileage" value="15 km · HK$72" />
								<Metric label="Meal receipt" value="Required photo" />
								<Metric label="Parts billing" value="Auto contract check" />
							</CardContent>
						</Card>
					</div>
				</div>
			</div>

			<div className="space-y-4">
				<PageHeader
					eyebrow="Engineer workflow"
					title="NFC, geofence, manual Q&A and offline sync"
				/>
				<div className="grid gap-4 xl:grid-cols-3">
					<FeatureTile
						icon={<NfcIcon className="size-5" />}
						text="Start requires matching asset uid. End validates the hospital geofence before submission."
						title="NFC scan to start/end"
					/>
					<FeatureTile
						icon={<LocateFixedIcon className="size-5" />}
						text="Tracking activates during work hours and is retained for 30 days."
						title="GPS clock-in/out"
					/>
					<FeatureTile
						icon={<BellRingIcon className="size-5" />}
						text="Assignments, resumed jobs, geofence alerts and status changes reach the engineer app."
						title="Push notifications"
					/>
				</div>
				<div className={panelClass}>
					<div className="flex flex-col gap-4 px-5 pt-5 pb-4">
						<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
							<div>
								<p className="font-semibold text-lg">
									Natural language service manual Q&A
								</p>
								<p className="mt-1 text-muted-foreground text-sm">
									Search the scanned device manual and return page-backed
									answers.
								</p>
							</div>
							<Button className={primaryActionClass} size="sm">
								<SearchIcon className="size-4" />
								Search
							</Button>
						</div>
						<div className="relative">
							<SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								className="h-8 rounded-md bg-background pl-9 text-sm"
								onChange={(event) => setManualQuery(event.target.value)}
								placeholder="Ask the scanned device manual..."
								value={manualQuery}
							/>
						</div>
					</div>
					<div className="mx-5 mb-5 overflow-hidden rounded-lg border">
						{manualAnswers.length > 0 ? (
							manualAnswers.map((answer) => (
								<div
									className="border-b p-4 last:border-b-0 hover:bg-muted/25"
									key={answer.id}
								>
									<div className="flex items-center justify-between gap-3">
										<p className="font-medium text-sm">{answer.title}</p>
										<StatusPill className="border-blue-200 bg-blue-50 text-blue-700">
											Page {answer.page}
										</StatusPill>
									</div>
									<p className="mt-2 text-muted-foreground text-sm">
										{answer.excerpt}
									</p>
								</div>
							))
						) : (
							<EmptyInline message="No matching manual answers." />
						)}
					</div>
				</div>
			</div>
		</section>
	);
}

function HospitalFaultPortal({
	faultStatus,
	setFaultStatus,
}: {
	faultStatus: FaultStatus;
	setFaultStatus: (status: FaultStatus) => void;
}) {
	return (
		<section className="mx-auto grid w-full max-w-6xl flex-1 gap-6 p-4 lg:grid-cols-[0.9fr_1.1fr] lg:p-6">
			<div>
				<PageHeader
					eyebrow="Hospital mobile web"
					title="Report a fault without installing an app"
				/>
				<p className="mt-3 max-w-xl text-muted-foreground text-sm leading-relaxed">
					Hospital staff open a Utiliti link, scan an NFC sticker on Android or
					search by asset, add fault details and photos, then track status from
					received to resolved.
				</p>
				<div className="mt-5 grid gap-3 sm:grid-cols-2">
					<FeatureTile
						icon={<NfcIcon className="size-5" />}
						text="Device data is pre-filled from the commissioned asset record."
						title="NFC or manual lookup"
					/>
					<FeatureTile
						icon={<UploadIcon className="size-5" />}
						text="Staff attach fault photos before the report reaches Back Office."
						title="Photo evidence"
					/>
					<FeatureTile
						icon={<MessageSquareTextIcon className="size-5" />}
						text="Hospitals can check status without calling service coordinators."
						title="Status tracking"
					/>
					<FeatureTile
						icon={<ArrowRightIcon className="size-5" />}
						text="Coordinators can generate a repair job from the same screen."
						title="Repair job handoff"
					/>
				</div>
			</div>

			<Card className={panelClass}>
				<CardHeader>
					<CardTitle>Fault report form</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className={`${mutedPanelClass} p-3`}>
						<div className="flex items-center gap-2 text-primary text-sm">
							<NfcIcon className="size-4" />
							NFC scan matched asset AST-10031
						</div>
						<p className="mt-2 font-medium">Sara Flex Standing Aid</p>
						<p className="text-muted-foreground text-sm">
							Prince of Wales Hospital · Ward 10B / Bay 3
						</p>
					</div>
					<div className="grid gap-3 md:grid-cols-2">
						<Field label="Severity" value="High" />
						<Field label="Contact" value="Ward 10B nurse station" />
					</div>
					<div>
						<Label htmlFor="fault-description">Fault description</Label>
						<textarea
							className="mt-2 min-h-28 w-full rounded-md border bg-background p-3 text-sm outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring/50"
							defaultValue="Standing aid battery does not hold charge and shows warning after short use."
							id="fault-description"
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button className={compactButtonClass} variant="outline">
							<UploadIcon className="size-4" />
							Add photos
						</Button>
						<Button
							className={primaryActionClass}
							onClick={() => setFaultStatus("Engineer Assigned")}
						>
							Submit report
						</Button>
					</div>
					<div className={`${mutedPanelClass} p-3`}>
						<p className="font-medium text-sm">Current status</p>
						<div className="mt-3 grid gap-2 sm:grid-cols-4">
							{(
								[
									"Received",
									"Engineer Assigned",
									"In Progress",
									"Resolved",
								] as const
							).map((status) => (
								<button
									className={cn(
										"rounded-md border px-2 py-2 text-xs transition-colors",
										faultStatus === status
											? faultStatusStyles[status]
											: "bg-background text-muted-foreground hover:bg-muted"
									)}
									key={status}
									onClick={() => setFaultStatus(status)}
									type="button"
								>
									{status}
								</button>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</section>
	);
}

function EmptyWorkspace({
	eyebrow,
	title,
}: {
	eyebrow: string;
	title: string;
}) {
	return (
		<section className="mx-auto w-full max-w-4xl p-4 lg:p-6">
			<PageFrame eyebrow={eyebrow} title={title}>
				<Card className={panelClass}>
					<CardContent className="pt-4">
						<p className="text-muted-foreground text-sm">
							Create records from Back Office to start using this workflow.
						</p>
					</CardContent>
				</Card>
			</PageFrame>
		</section>
	);
}

function EmptyInline({ message }: { message: string }) {
	return (
		<div
			className={`${mutedPanelClass} p-4 text-center text-muted-foreground text-sm`}
		>
			{message}
		</div>
	);
}

function CrudDialog({
	data,
	onClose,
	state,
}: {
	data: ServiceOpsSnapshot;
	onClose: () => void;
	state: CrudState | null;
}) {
	if (!state) {
		return null;
	}

	const title =
		state.mode === "create"
			? `New ${entityLabels[state.entity]}`
			: `Edit ${entityLabels[state.entity]}`;

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
			<div className="w-full max-w-2xl rounded-lg border bg-card shadow-lg">
				<div className="flex items-start justify-between gap-4 border-b px-5 py-4">
					<div>
						<p className="font-semibold text-lg">{title}</p>
						<p className="mt-1 text-muted-foreground text-sm">
							Changes are saved to the current tenant only.
						</p>
					</div>
					<Button
						className={compactButtonClass}
						onClick={onClose}
						size="sm"
						variant="ghost"
					>
						Close
					</Button>
				</div>
				<CrudForm
					data={data}
					key={getCrudStateKey(state)}
					onClose={onClose}
					state={state}
				/>
			</div>
		</div>
	);
}

function CrudForm({
	data,
	onClose,
	state,
}: {
	data: ServiceOpsSnapshot;
	onClose: () => void;
	state: CrudState;
}) {
	const tenantId = data.tenant.id;
	const mutations = useEntityMutations(tenantId, onClose);
	const fields = getFieldConfigs(state.entity, data);
	const defaults = getFormDefaults(state.entity, state.record);
	const isSaving = isEntityMutationPending(mutations);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		submitCrudForm({
			formData,
			mutations,
			state,
			tenantId,
		});
	};

	return (
		<form
			className="flex max-h-[calc(100vh-10rem)] flex-col"
			onSubmit={handleSubmit}
		>
			<div className="grid gap-4 overflow-y-auto p-5 md:grid-cols-2">
				{fields.map((field) => (
					<FormField
						defaultValue={defaults[field.name]}
						field={field}
						key={field.name}
					/>
				))}
			</div>
			<div className="flex justify-end gap-2 border-t p-5">
				<Button
					className={compactButtonClass}
					disabled={isSaving}
					onClick={onClose}
					type="button"
					variant="outline"
				>
					Cancel
				</Button>
				<Button
					className={primaryActionClass}
					disabled={isSaving}
					type="submit"
				>
					{isSaving ? <Loader2Icon className="size-4 animate-spin" /> : null}
					Save
				</Button>
			</div>
		</form>
	);
}

function isEntityMutationPending(mutations: EntityMutations) {
	return Object.values(mutations).some((mutation) => mutation.isPending);
}

type EntityMutations = ReturnType<typeof useEntityMutations>;

function FormField({
	defaultValue,
	field,
}: {
	defaultValue?: boolean | number | string | string[];
	field: FieldConfig;
}) {
	if (field.type === "checkbox") {
		return (
			<label className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
				<input
					defaultChecked={Boolean(defaultValue)}
					name={field.name}
					type="checkbox"
				/>
				<span>{field.label}</span>
			</label>
		);
	}

	if (field.type === "select") {
		const defaultValues = Array.isArray(defaultValue)
			? defaultValue.map(String)
			: undefined;

		return (
			<div className="flex flex-col gap-2">
				<Label htmlFor={field.name}>{field.label}</Label>
				<select
					className={cn(
						"w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/50",
						field.multiple ? "min-h-28 py-2" : "h-8"
					)}
					defaultValue={defaultValues ?? String(defaultValue ?? "")}
					id={field.name}
					multiple={field.multiple}
					name={field.name}
					required={field.required}
				>
					{field.multiple ? null : <option value="">Select...</option>}
					{field.options?.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>
		);
	}

	if (field.type === "textarea") {
		return (
			<div className="flex flex-col gap-2 md:col-span-2">
				<Label htmlFor={field.name}>{field.label}</Label>
				<textarea
					className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
					defaultValue={
						Array.isArray(defaultValue) || typeof defaultValue === "boolean"
							? ""
							: (defaultValue ?? "")
					}
					id={field.name}
					name={field.name}
					required={field.required}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor={field.name}>{field.label}</Label>
			<Input
				className="rounded-md"
				defaultValue={
					Array.isArray(defaultValue) || typeof defaultValue === "boolean"
						? undefined
						: (defaultValue ?? "")
				}
				id={field.name}
				name={field.name}
				required={field.required}
				step={field.type === "number" ? "any" : undefined}
				type={field.type ?? "text"}
			/>
		</div>
	);
}

function optionFromRecord(
	record: { id: string; name?: string },
	fallback?: string
) {
	return {
		label: record.name ?? fallback ?? record.id,
		value: record.id,
	};
}

function getFieldConfigs(
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
			{ label: "Latitude", name: "latitude", type: "number" },
			{ label: "Longitude", name: "longitude", type: "number" },
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

function getRecordId(entity: CrudEntity, record: unknown) {
	const typedRecord = record as Record<string, unknown>;
	const id =
		entity === "product" || entity === "hospital" || entity === "engineer"
			? typedRecord.id
			: typedRecord.recordId;

	return String(id ?? "");
}

function getCrudStateKey(state: CrudState) {
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

function getFormDefaults(entity: CrudEntity, record: unknown) {
	if (!record) {
		return getCreateDefaults(entity);
	}

	const defaults = getEditDefaults(entity, record);

	return defaults ?? getCreateDefaults(entity);
}

function getEditDefaults(entity: CrudEntity, record: unknown) {
	const defaultsByEntity: Record<
		CrudEntity,
		(
			record: unknown
		) => Record<string, boolean | number | string | string[]> | null
	> = {
		asset: getAssetDefaults,
		contract: getContractDefaults,
		engineer: getEngineerDefaults,
		fault: getFaultDefaults,
		hospital: getHospitalDefaults,
		job: getJobDefaults,
		part: getPartDefaults,
		product: getProductDefaults,
	};

	return defaultsByEntity[entity](record);
}

function getAssetDefaults(
	record: unknown
): Record<string, boolean | number | string | string[]> | null {
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
): Record<string, boolean | number | string | string[]> | null {
	if (isContractRecord(record)) {
		return {
			accountManagerName: record.accountManager,
			contractNumber: record.id,
			coveredModelIds: record.coveredModelIds,
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
): Record<string, boolean | number | string | string[]> | null {
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
): Record<string, boolean | number | string | string[]> | null {
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
): Record<string, boolean | number | string | string[]> | null {
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
): Record<string, boolean | number | string | string[]> | null {
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
): Record<string, boolean | number | string | string[]> | null {
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
): Record<string, boolean | number | string | string[]> | null {
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

function getCreateDefaults(entity: CrudEntity) {
	const suffix = Date.now().toString().slice(-5);
	const today = new Date().toISOString().slice(0, 10);
	const defaults: Record<string, boolean | number | string | string[]> = {
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

	return defaults;
}

function buildAssetPayload(formData: FormData): AssetPayload {
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

function buildContractPayload(formData: FormData): ContractPayload {
	return {
		accountManagerName: valueFromForm(formData, "accountManagerName"),
		contractNumber: valueFromForm(formData, "contractNumber"),
		coveredModelIds: valuesFromForm(formData, "coveredModelIds"),
		endDate: valueFromForm(formData, "endDate"),
		hospitalId: valueFromForm(formData, "hospitalId"),
		responseSlaHours: numberFromForm(formData, "responseSlaHours"),
		startDate: valueFromForm(formData, "startDate"),
		status: enumFromForm(formData, "status", contractStatusValues),
		type: enumFromForm(formData, "type", contractTypeValues),
	};
}

function buildEngineerPayload(formData: FormData): EngineerPayload {
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

function buildFaultPayload(formData: FormData): FaultPayload {
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

function buildHospitalPayload(formData: FormData): HospitalPayload {
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

function buildJobPayload(formData: FormData): JobPayload {
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

function buildPartPayload(formData: FormData): PartPayload {
	return {
		minimumStock: numberFromForm(formData, "minimumStock"),
		name: valueFromForm(formData, "name"),
		partNumber: valueFromForm(formData, "partNumber"),
		stockOnHand: numberFromForm(formData, "stockOnHand"),
		supplier: valueFromForm(formData, "supplier"),
		unitCost: numberFromForm(formData, "unitCost"),
	};
}

function buildProductPayload(formData: FormData): ProductPayload {
	return {
		category: valueFromForm(formData, "category"),
		code: valueFromForm(formData, "code"),
		defaultPmCycleMonths: numberFromForm(formData, "defaultPmCycleMonths"),
		isEngineerReadOnly: boolFromForm(formData, "isEngineerReadOnly"),
		manufacturer: valueFromForm(formData, "manufacturer"),
		modelName: valueFromForm(formData, "modelName"),
	};
}

function useEntityMutations(tenantId: string, onDone: () => void) {
	const assetCreateSuccess = useMutationSuccess(
		tenantId,
		"Asset created.",
		onDone
	);
	const assetUpdateSuccess = useMutationSuccess(
		tenantId,
		"Asset updated.",
		onDone
	);
	const contractCreateSuccess = useMutationSuccess(
		tenantId,
		"Contract created.",
		onDone
	);
	const contractUpdateSuccess = useMutationSuccess(
		tenantId,
		"Contract updated.",
		onDone
	);
	const engineerCreateSuccess = useMutationSuccess(
		tenantId,
		"Engineer created.",
		onDone
	);
	const engineerUpdateSuccess = useMutationSuccess(
		tenantId,
		"Engineer updated.",
		onDone
	);
	const faultCreateSuccess = useMutationSuccess(
		tenantId,
		"Fault report created.",
		onDone
	);
	const faultUpdateSuccess = useMutationSuccess(
		tenantId,
		"Fault report updated.",
		onDone
	);
	const hospitalCreateSuccess = useMutationSuccess(
		tenantId,
		"Hospital created.",
		onDone
	);
	const hospitalUpdateSuccess = useMutationSuccess(
		tenantId,
		"Hospital updated.",
		onDone
	);
	const jobCreateSuccess = useMutationSuccess(tenantId, "Job created.", onDone);
	const jobUpdateSuccess = useMutationSuccess(tenantId, "Job updated.", onDone);
	const partCreateSuccess = useMutationSuccess(
		tenantId,
		"Part created.",
		onDone
	);
	const partUpdateSuccess = useMutationSuccess(
		tenantId,
		"Part updated.",
		onDone
	);
	const productCreateSuccess = useMutationSuccess(
		tenantId,
		"Product created.",
		onDone
	);
	const productUpdateSuccess = useMutationSuccess(
		tenantId,
		"Product updated.",
		onDone
	);

	return {
		createAsset: useMutation(
			trpc.serviceOps.createAsset.mutationOptions(assetCreateSuccess)
		),
		createContract: useMutation(
			trpc.serviceOps.createContract.mutationOptions(contractCreateSuccess)
		),
		createEngineer: useMutation(
			trpc.serviceOps.createEngineer.mutationOptions(engineerCreateSuccess)
		),
		createFault: useMutation(
			trpc.serviceOps.createFault.mutationOptions(faultCreateSuccess)
		),
		createHospital: useMutation(
			trpc.serviceOps.createHospital.mutationOptions(hospitalCreateSuccess)
		),
		createJob: useMutation(
			trpc.serviceOps.createJob.mutationOptions(jobCreateSuccess)
		),
		createPart: useMutation(
			trpc.serviceOps.createPart.mutationOptions(partCreateSuccess)
		),
		createProduct: useMutation(
			trpc.serviceOps.createProduct.mutationOptions(productCreateSuccess)
		),
		updateAsset: useMutation(
			trpc.serviceOps.updateAsset.mutationOptions(assetUpdateSuccess)
		),
		updateContract: useMutation(
			trpc.serviceOps.updateContract.mutationOptions(contractUpdateSuccess)
		),
		updateEngineer: useMutation(
			trpc.serviceOps.updateEngineer.mutationOptions(engineerUpdateSuccess)
		),
		updateFault: useMutation(
			trpc.serviceOps.updateFault.mutationOptions(faultUpdateSuccess)
		),
		updateHospital: useMutation(
			trpc.serviceOps.updateHospital.mutationOptions(hospitalUpdateSuccess)
		),
		updateJob: useMutation(
			trpc.serviceOps.updateJob.mutationOptions(jobUpdateSuccess)
		),
		updatePart: useMutation(
			trpc.serviceOps.updatePart.mutationOptions(partUpdateSuccess)
		),
		updateProduct: useMutation(
			trpc.serviceOps.updateProduct.mutationOptions(productUpdateSuccess)
		),
	};
}

function submitCrudForm({
	formData,
	mutations,
	state,
	tenantId,
}: {
	formData: FormData;
	mutations: EntityMutations;
	state: CrudState;
	tenantId: string;
}) {
	const submitters = {
		asset: submitAssetForm,
		contract: submitContractForm,
		engineer: submitEngineerForm,
		fault: submitFaultForm,
		hospital: submitHospitalForm,
		job: submitJobForm,
		part: submitPartForm,
		product: submitProductForm,
	} as const;

	submitters[state.entity]({ formData, mutations, state, tenantId });
}

interface SubmitFormArgs {
	formData: FormData;
	mutations: EntityMutations;
	state: CrudState;
	tenantId: string;
}

function getUpdateId(state: CrudState) {
	return state.mode === "edit" ? getRecordId(state.entity, state.record) : "";
}

function submitAssetForm({
	formData,
	mutations,
	state,
	tenantId,
}: SubmitFormArgs) {
	const data = buildAssetPayload(formData);
	if (state.mode === "create") {
		mutations.createAsset.mutate({ data, tenantId });
		return;
	}
	mutations.updateAsset.mutate({ data, id: getUpdateId(state), tenantId });
}

function submitContractForm({
	formData,
	mutations,
	state,
	tenantId,
}: SubmitFormArgs) {
	const data = buildContractPayload(formData);
	if (state.mode === "create") {
		mutations.createContract.mutate({ data, tenantId });
		return;
	}
	mutations.updateContract.mutate({ data, id: getUpdateId(state), tenantId });
}

function submitEngineerForm({
	formData,
	mutations,
	state,
	tenantId,
}: SubmitFormArgs) {
	const data = buildEngineerPayload(formData);
	if (state.mode === "create") {
		mutations.createEngineer.mutate({ data, tenantId });
		return;
	}
	mutations.updateEngineer.mutate({ data, id: getUpdateId(state), tenantId });
}

function submitFaultForm({
	formData,
	mutations,
	state,
	tenantId,
}: SubmitFormArgs) {
	const data = buildFaultPayload(formData);
	if (state.mode === "create") {
		mutations.createFault.mutate({ data, tenantId });
		return;
	}
	mutations.updateFault.mutate({ data, id: getUpdateId(state), tenantId });
}

function submitHospitalForm({
	formData,
	mutations,
	state,
	tenantId,
}: SubmitFormArgs) {
	const data = buildHospitalPayload(formData);
	if (state.mode === "create") {
		mutations.createHospital.mutate({ data, tenantId });
		return;
	}
	mutations.updateHospital.mutate({ data, id: getUpdateId(state), tenantId });
}

function submitJobForm({
	formData,
	mutations,
	state,
	tenantId,
}: SubmitFormArgs) {
	const data = buildJobPayload(formData);
	if (state.mode === "create") {
		mutations.createJob.mutate({ data, tenantId });
		return;
	}
	mutations.updateJob.mutate({ data, id: getUpdateId(state), tenantId });
}

function submitPartForm({
	formData,
	mutations,
	state,
	tenantId,
}: SubmitFormArgs) {
	const data = buildPartPayload(formData);
	if (state.mode === "create") {
		mutations.createPart.mutate({ data, tenantId });
		return;
	}
	mutations.updatePart.mutate({ data, id: getUpdateId(state), tenantId });
}

function submitProductForm({
	formData,
	mutations,
	state,
	tenantId,
}: SubmitFormArgs) {
	const data = buildProductPayload(formData);
	if (state.mode === "create") {
		mutations.createProduct.mutate({ data, tenantId });
		return;
	}
	mutations.updateProduct.mutate({ data, id: getUpdateId(state), tenantId });
}

function RowActions({
	entity,
	id,
	onEdit,
	tenantId,
}: {
	entity: CrudEntity;
	id: string;
	onEdit: () => void;
	tenantId: string;
}) {
	const deleteMutation = useDeleteMutation(entity, tenantId);
	const isDeleting = deleteMutation.isPending;
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	let deleteButtonContent: ReactNode = <Trash2Icon className="size-4" />;

	if (isDeleting) {
		deleteButtonContent = <Loader2Icon className="size-4 animate-spin" />;
	} else if (isConfirmingDelete) {
		deleteButtonContent = "Confirm";
	}

	const handleDelete = () => {
		if (!isConfirmingDelete) {
			setIsConfirmingDelete(true);
			return;
		}

		deleteMutation.mutate({ id, tenantId });
	};

	return (
		<div className="inline-flex items-center justify-end gap-1">
			<Button
				aria-label={`Edit ${entityLabels[entity]}`}
				className={compactButtonClass}
				onClick={onEdit}
				size="icon-sm"
				variant="ghost"
			>
				<EditIcon className="size-4" />
			</Button>
			<Button
				aria-label={`Delete ${entityLabels[entity]}`}
				className={cn(
					compactButtonClass,
					isConfirmingDelete ? "w-auto px-2" : ""
				)}
				disabled={isDeleting}
				onClick={handleDelete}
				onMouseLeave={() => setIsConfirmingDelete(false)}
				size={isConfirmingDelete ? "sm" : "icon-sm"}
				variant="ghost"
			>
				{deleteButtonContent}
			</Button>
		</div>
	);
}

function useMutationSuccess(
	tenantId: string,
	label: string,
	onDone?: () => void
) {
	const queryClient = useQueryClient();

	return {
		onError(error: { message?: string }) {
			toast.error(error.message ?? "Request failed.");
		},
		onSuccess() {
			toast.success(label);
			onDone?.();
			queryClient
				.invalidateQueries(trpc.serviceOps.snapshot.queryFilter({ tenantId }))
				.catch(() => {
					toast.error("Unable to refresh tenant data.");
				});
		},
	};
}

function useDeleteMutation(entity: CrudEntity, tenantId: string) {
	const successOptions = useMutationSuccess(
		tenantId,
		`${entityLabels[entity]} deleted.`
	);
	const mutations = {
		asset: useMutation(
			trpc.serviceOps.deleteAsset.mutationOptions(successOptions)
		),
		contract: useMutation(
			trpc.serviceOps.deleteContract.mutationOptions(successOptions)
		),
		engineer: useMutation(
			trpc.serviceOps.deleteEngineer.mutationOptions(successOptions)
		),
		fault: useMutation(
			trpc.serviceOps.deleteFault.mutationOptions(successOptions)
		),
		hospital: useMutation(
			trpc.serviceOps.deleteHospital.mutationOptions(successOptions)
		),
		job: useMutation(trpc.serviceOps.deleteJob.mutationOptions(successOptions)),
		part: useMutation(
			trpc.serviceOps.deletePart.mutationOptions(successOptions)
		),
		product: useMutation(
			trpc.serviceOps.deleteProduct.mutationOptions(successOptions)
		),
	};

	return mutations[entity];
}

function PageFrame({
	action,
	children,
	eyebrow,
	title,
}: {
	action?: ReactNode;
	children: ReactNode;
	eyebrow: string;
	title: string;
}) {
	return (
		<div className="mx-auto flex max-w-[1320px] flex-col gap-4 md:gap-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<PageHeader eyebrow={eyebrow} title={title} />
				{action}
			</div>
			{children}
		</div>
	);
}

function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
	return (
		<div>
			<p className="font-medium text-muted-foreground text-xs">{eyebrow}</p>
			<h2 className="mt-1 font-semibold text-2xl">{title}</h2>
		</div>
	);
}

function DataTable({
	columns,
	description,
	filterLabels = ["Status", "Date"],
	rows,
	title,
}: DataTableProps) {
	return (
		<div className={`${panelClass} overflow-hidden`}>
			<div className="flex flex-col gap-4 px-5 pt-5 pb-4">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<p className="font-semibold text-lg">
							{title ?? `${rows.length} Records`}
						</p>
						<p className="mt-1 text-muted-foreground text-sm">
							{description ??
								"Recent service records with status, ownership, and schedule activity."}
						</p>
					</div>
					<Button className={compactButtonClass} size="sm" variant="outline">
						<DownloadIcon className="size-4" />
						Export
					</Button>
				</div>
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<div className="relative sm:w-[340px]">
							<SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								className="h-8 rounded-md bg-background pl-9 text-sm"
								placeholder="Search records..."
								readOnly
							/>
						</div>
						{filterLabels.map((label) => (
							<TableToolbarButton key={label} label={label} />
						))}
					</div>
					<div className="flex flex-wrap gap-2">
						<TableToolbarButton icon={<CreditCardIcon />} label="Billing" />
						<TableToolbarButton icon={<SlidersHorizontalIcon />} label="Sort" />
					</div>
				</div>
			</div>
			<div className="mx-5 overflow-hidden rounded-lg border">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[820px] border-collapse text-sm">
						<thead className="bg-muted/20">
							<tr className="border-b">
								<th className="h-11 w-14 px-4 text-left align-middle">
									<RowCheckbox label="Select all rows" />
								</th>
								{columns.map((column) => (
									<th
										className="h-11 px-4 text-left align-middle font-medium"
										key={column}
									>
										{column}
									</th>
								))}
								<th className="h-11 w-16 px-4 text-right align-middle font-medium">
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{rows.length > 0 ? (
								rows.map((row) => (
									<tr
										className="border-b transition-colors last:border-b-0 hover:bg-muted/25"
										key={row.id}
									>
										<td className="px-4 py-3 align-middle">
											<RowCheckbox label={`Select ${row.id}`} />
										</td>
										{row.cells.map((cell, cellIndex) => (
											<td
												className="px-4 py-3 align-middle"
												key={`${row.id}-${columns[cellIndex] ?? "cell"}`}
											>
												{cell}
											</td>
										))}
										<td className="px-4 py-3 text-right align-middle">
											{row.actions}
										</td>
									</tr>
								))
							) : (
								<tr>
									<td
										className="h-24 px-4 text-center text-muted-foreground"
										colSpan={columns.length + 2}
									>
										No records yet.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
			<div className="flex flex-col gap-3 px-5 py-4 text-muted-foreground text-sm lg:flex-row lg:items-center lg:justify-between">
				<p>0 of {rows.length} row(s) selected.</p>
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2">
						<span className="font-medium text-foreground">Rows per page</span>
						<button
							className="inline-flex h-8 min-w-16 items-center justify-between rounded-md border bg-background px-3 font-medium text-foreground transition-colors hover:bg-muted"
							type="button"
						>
							10
							<ChevronDownIcon className="size-4 text-muted-foreground" />
						</button>
					</div>
					<span className="font-medium text-foreground">Page 1 of 1</span>
					<div className="flex gap-2">
						<PaginationButton label="First page">
							<ChevronsLeftIcon className="size-4" />
						</PaginationButton>
						<PaginationButton label="Previous page">
							<ChevronLeftIcon className="size-4" />
						</PaginationButton>
						<PaginationButton label="Next page">
							<ChevronRightIcon className="size-4" />
						</PaginationButton>
						<PaginationButton label="Last page">
							<ChevronsRightIcon className="size-4" />
						</PaginationButton>
					</div>
				</div>
			</div>
		</div>
	);
}

function TableToolbarButton({
	icon,
	label,
}: {
	icon?: ReactNode;
	label: string;
}) {
	return (
		<Button
			className="h-8 rounded-md bg-background text-sm"
			size="sm"
			variant="outline"
		>
			{icon ?? <CalendarIcon className="size-4" />}
			{label}
		</Button>
	);
}

function RowCheckbox({ label }: { label: string }) {
	return (
		<input
			aria-label={label}
			className="size-4 rounded border bg-background accent-primary"
			readOnly
			type="checkbox"
		/>
	);
}

function PaginationButton({
	children,
	label,
}: {
	children: ReactNode;
	label: string;
}) {
	return (
		<button
			aria-label={label}
			className="inline-flex size-8 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			type="button"
		>
			{children}
		</button>
	);
}

function StatusPill({
	children,
	className,
}: {
	children: ReactNode;
	className: string;
}) {
	return (
		<span
			className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium text-xs ${className}`}
		>
			{children}
		</span>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className={`${mutedPanelClass} p-3`}>
			<p className="text-muted-foreground text-xs">{label}</p>
			<p className="mt-1 font-medium text-sm">{value}</p>
		</div>
	);
}

function DashboardStatCard({
	stat,
}: {
	stat: ServiceOpsSnapshot["dashboardStats"][number];
}) {
	return (
		<Card className={`${panelClass} bg-gradient-to-t from-primary/5 to-card`}>
			<CardContent>
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-muted-foreground text-xs">{stat.label}</p>
						<p className="mt-2 font-semibold text-2xl">{stat.value}</p>
					</div>
					<span className={iconTileClass}>
						<TrendingUpIcon className="size-4" />
					</span>
				</div>
				<p className="mt-3 border-t pt-3 text-muted-foreground text-xs">
					{stat.meta}
				</p>
			</CardContent>
		</Card>
	);
}

function Field({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<Label>{label}</Label>
			<Input className="mt-2 rounded-md" defaultValue={value} />
		</div>
	);
}

function StateMachine({ currentStatus }: { currentStatus: JobStatus }) {
	const activeIndex = serviceStateMachine.indexOf(
		currentStatus as (typeof serviceStateMachine)[number]
	);

	return (
		<div className="space-y-2">
			{serviceStateMachine.map((state, index) => {
				const complete = activeIndex >= index && activeIndex !== -1;

				return (
					<div className="flex items-center gap-2 text-sm" key={state}>
						<span
							className={`flex size-5 items-center justify-center rounded-full border ${
								complete
									? "border-primary bg-primary text-primary-foreground"
									: "bg-background text-muted-foreground"
							}`}
						>
							{complete ? <CheckCircle2Icon className="size-3" /> : index + 1}
						</span>
						<span
							className={complete ? "font-medium" : "text-muted-foreground"}
						>
							{state}
						</span>
					</div>
				);
			})}
		</div>
	);
}

function FeatureTile({
	icon,
	text,
	title,
}: {
	icon: ReactNode;
	text: string;
	title: string;
}) {
	return (
		<div className={`${panelClass} p-4`}>
			<div className={iconTileClass}>{icon}</div>
			<p className="mt-3 font-medium text-sm">{title}</p>
			<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
				{text}
			</p>
		</div>
	);
}

function MapPin({ label, status }: { label: string; status: ContractStatus }) {
	const colorByStatus: Record<ContractStatus, string> = {
		Active: "bg-emerald-500",
		Expired: "bg-zinc-500",
		Expiring: "bg-amber-500",
	};

	return (
		<div className="flex items-center gap-2 rounded-md border bg-card px-2 py-1 text-xs shadow-xs">
			<span className={`size-3 rounded-full ${colorByStatus[status]}`} />
			{label}
		</div>
	);
}

function EngineerDot({
	engineer,
	status,
}: {
	engineer: string;
	status: EngineerStatus;
}) {
	return (
		<div className="flex items-center gap-2 rounded-md bg-foreground px-2 py-1 text-background text-xs shadow-xs">
			<span className={`size-3 rounded-full ${engineerStatusStyles[status]}`} />
			{engineer}
		</div>
	);
}
