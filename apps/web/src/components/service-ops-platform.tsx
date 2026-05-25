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
import { useQuery } from "@tanstack/react-query";
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
	FileQuestionIcon,
	HospitalIcon,
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
	TrendingUpIcon,
	UploadIcon,
	UsersIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
	type BackOfficeView,
	type ContractStatus,
	type EngineerStatus,
	type FaultStatus,
	type Job,
	type JobStatus,
	type ManualAnswer,
	navigationItems,
	type ServiceOpsSnapshot,
	serviceStateMachine,
} from "@/lib/service-ops-data";
import { trpc } from "@/utils/trpc";

type AppMode = "back-office" | "engineer" | "hospital";

type JobAction = "start" | "pause" | "resume" | "complete";

interface TableRow {
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
	selectedJob,
	selectedJobId,
	setSelectedJobId,
}: {
	activeView: BackOfficeView;
	data: ServiceOpsSnapshot;
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
					<Button className={primaryActionClass}>
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
					<Button className={primaryActionClass}>
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
					<Button className={primaryActionClass}>
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
					<Button className={primaryActionClass}>
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
					<Button className={primaryActionClass}>
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
						id: engineer.id,
					}))}
					title={`${engineers.length} Engineers`}
				/>
			</PageFrame>
		);
	}

	if (activeView === "contracts") {
		return <ContractsView contracts={contracts} />;
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
					<Button className={primaryActionClass}>
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
						id: fault.id,
					}))}
					title={`${faultReports.length} Fault Reports`}
				/>
			</PageFrame>
		);
	}

	if (activeView === "parts") {
		return <PartsView parts={parts} shortages={shortages} />;
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
}: {
	contracts: ServiceOpsSnapshot["contracts"];
}) {
	return (
		<PageFrame
			action={
				<Button className={primaryActionClass}>
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
									<StatusPill className={contractStatusStyles[contract.status]}>
										{contract.status}
									</StatusPill>
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
	parts,
	shortages,
}: {
	parts: ServiceOpsSnapshot["parts"];
	shortages: ServiceOpsSnapshot["shortages"];
}) {
	return (
		<PageFrame
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
									</tr>
								))
							) : (
								<tr>
									<td
										className="h-24 px-4 text-center text-muted-foreground"
										colSpan={columns.length + 1}
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
