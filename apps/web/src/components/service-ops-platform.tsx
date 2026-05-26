"use client";
"use no memo";

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
	BellRingIcon,
	CheckCircle2Icon,
	ClipboardCheckIcon,
	CommandIcon,
	EditIcon,
	FileQuestionIcon,
	Loader2Icon,
	LogOutIcon,
	NfcIcon,
	PlusIcon,
	ReceiptTextIcon,
	ShieldCheckIcon,
	Trash2Icon,
	TrendingUpIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	buildAssetPayload,
	buildContractPayload,
	buildEngineerPayload,
	buildFaultPayload,
	buildHospitalPayload,
	buildJobPayload,
	buildPartPayload,
	buildProductPayload,
	type CrudEntity,
	type CrudState,
	entityLabels,
	type FieldConfig,
	getCrudStateKey,
	getFieldConfigs,
	getFormDefaults,
	getRecordId,
} from "@/components/service-ops-crud";
import { DataTable } from "@/components/service-ops-table";
import { authClient } from "@/lib/auth-client";
import {
	type BackOfficeView,
	type ContractStatus,
	type EngineerStatus,
	type FaultStatus,
	type Job,
	type JobStatus,
	navigationItems,
	type ServiceOpsSnapshot,
	serviceStateMachine,
} from "@/lib/service-ops-data";
import { trpc } from "@/utils/trpc";

interface CurrentUser {
	email: string;
	name: null | string | undefined;
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
	currentUser,
	initialData,
}: {
	currentUser: CurrentUser;
	initialData: ServiceOpsSnapshot;
}) {
	const router = useRouter();
	const snapshotQuery = useQuery(
		trpc.serviceOps.snapshot.queryOptions(
			{ tenantId: initialData.tenant.id },
			{ initialData, staleTime: 30_000 }
		)
	);
	const data = snapshotQuery.data ?? initialData;
	const { jobs, tenant } = data;
	const [activeView, setActiveView] = useState<BackOfficeView>("dashboard");
	const [firstJob] = jobs;
	const [selectedJobId, setSelectedJobId] = useState(firstJob?.id ?? "");
	const [crudState, setCrudState] = useState<CrudState | null>(null);

	const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? firstJob;

	useEffect(() => {
		if (!selectedJobId && firstJob) {
			setSelectedJobId(firstJob.id);
		}
	}, [firstJob, selectedJobId]);

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

	useEffect(() => {
		if (!window.matchMedia("(max-width: 1023px)").matches) {
			return;
		}

		window.requestAnimationFrame(() => {
			document
				.getElementById(`back-office-nav-${activeView}`)
				?.scrollIntoView({ block: "nearest", inline: "center" });
		});
	}, [activeView]);

	const handleSignOut = () => {
		authClient
			.signOut({
				fetchOptions: {
					onSuccess: () => {
						router.push("/login");
					},
				},
			})
			.catch(() => {
				toast.error("Unable to sign out.");
			});
	};

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
										data-back-office-nav-active={isActive ? "true" : undefined}
										id={`back-office-nav-${item.id}`}
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
							<UserProfile
								currentUser={currentUser}
								onSignOut={handleSignOut}
							/>
						</div>
					</aside>
					<div className="min-w-0">
						<header className="sticky top-0 z-20 flex min-h-14 flex-col gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur lg:px-6">
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
						</header>
						<section
							className="@container/main min-w-0 px-4 py-4 md:py-6 lg:px-6"
							id="back-office-content"
						>
							<BackOfficeViewPanel
								activeView={activeView}
								data={data}
								onCreate={(entity) => setCrudState({ entity, mode: "create" })}
								onEdit={(entity, record) =>
									setCrudState({ entity, mode: "edit", record })
								}
								selectedJob={selectedJob}
								setSelectedJobId={setSelectedJobId}
							/>
						</section>
					</div>
				</div>
			</div>
			<CrudDialog
				data={data}
				onClose={() => setCrudState(null)}
				state={crudState}
			/>
		</main>
	);
}

function UserProfile({
	currentUser,
	onSignOut,
}: {
	currentUser: CurrentUser;
	onSignOut: () => void;
}) {
	const displayName = currentUser.name?.trim() || "Signed-in user";
	const initials = getInitials(displayName, currentUser.email);

	return (
		<div className="flex items-center gap-3 rounded-lg border bg-card/80 p-2 shadow-xs">
			<div className="flex size-8 items-center justify-center rounded-md bg-muted font-semibold text-xs uppercase">
				{initials}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium text-sm">{displayName}</p>
				<p className="truncate text-muted-foreground text-xs">
					{currentUser.email}
				</p>
			</div>
			<Button
				aria-label="Sign out"
				className={compactButtonClass}
				onClick={onSignOut}
				size="icon-sm"
				variant="ghost"
			>
				<LogOutIcon className="size-4" />
			</Button>
		</div>
	);
}

function getInitials(name: string, email: string) {
	const nameInitials = name
		.split(" ")
		.map((part) => part.at(0))
		.filter(Boolean)
		.join("")
		.slice(0, 2);

	return (nameInitials || email.at(0) || "U").toUpperCase();
}

function BackOfficeViewPanel({
	activeView,
	data,
	onCreate,
	onEdit,
	selectedJob,
	setSelectedJobId,
}: {
	activeView: BackOfficeView;
	data: ServiceOpsSnapshot;
	onCreate: (entity: CrudEntity) => void;
	onEdit: (entity: CrudEntity, record: unknown) => void;
	selectedJob?: Job;
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
						{selectedJob ? (
							<>
								<CardHeader>
									<CardTitle>{selectedJob.id} audit trail</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<StateMachine currentStatus={selectedJob.status} />
									<div className={`${mutedPanelClass} p-3 text-sm`}>
										<p className="font-medium">Latest event</p>
										<p className="mt-1 text-muted-foreground">
											{selectedJob.audit}
										</p>
									</div>
									<div className="grid grid-cols-2 gap-3 text-sm">
										<Metric
											label="Timer"
											value={`${selectedJob.timerMinutes} min`}
										/>
										<Metric label="Cost" value={`HK$${selectedJob.cost}`} />
									</div>
								</CardContent>
							</>
						) : (
							<CardContent className="pt-4">
								<EmptyInline message="Select or create a job to view the audit trail." />
							</CardContent>
						)}
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
						<p className="font-medium">Tenant location layer</p>
						<p className="mt-1 text-muted-foreground">
							Hospital pins and live engineer GPS dots are shown from the
							current tenant records.
						</p>
					</div>
					{hospitals.length === 0 && engineers.length === 0 ? (
						<div className="absolute inset-x-4 top-1/2 -translate-y-1/2">
							<EmptyInline message="Create hospitals or engineers to populate the map." />
						</div>
					) : null}
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
	useEffect(() => {
		if (!state) {
			return;
		}

		const handleDialogKeyDown = (event: globalThis.KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		window.addEventListener("keydown", handleDialogKeyDown);

		return () => {
			window.removeEventListener("keydown", handleDialogKeyDown);
		};
	}, [onClose, state]);

	if (!state) {
		return null;
	}

	const title =
		state.mode === "create"
			? `New ${entityLabels[state.entity]}`
			: `Edit ${entityLabels[state.entity]}`;
	const descriptionId = "crud-dialog-description";
	const titleId = "crud-dialog-title";

	return (
		<div
			aria-describedby={descriptionId}
			aria-labelledby={titleId}
			aria-modal="true"
			className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 px-4 py-8 backdrop-blur-sm"
			role="dialog"
		>
			<div className="w-full max-w-2xl rounded-lg border bg-card shadow-lg">
				<div className="flex items-start justify-between gap-4 border-b px-5 py-4">
					<div>
						<p className="font-semibold text-lg" id={titleId}>
							{title}
						</p>
						<p
							className="mt-1 text-muted-foreground text-sm"
							id={descriptionId}
						>
							Changes are saved to the current tenant only.
						</p>
					</div>
					<Button
						aria-label="Close dialog"
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
					{isSaving ? "Saving" : "Save"}
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
