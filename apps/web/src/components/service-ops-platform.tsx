"use client";
"use no memo";

import {
	type AppLocale,
	type TranslationKey,
	translateServiceText,
} from "@luke/i18n";
import { Button as UiButton } from "@luke/ui/components/button";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle as UiCardTitle,
} from "@luke/ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@luke/ui/components/dropdown-menu";
import { Input as UiInput } from "@luke/ui/components/input";
import { Label as UiLabel } from "@luke/ui/components/label";
import { cn } from "@luke/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ActivityIcon,
	AlertTriangleIcon,
	ArrowLeftIcon,
	ArrowUpRightIcon,
	BellRingIcon,
	BoxIcon,
	CalendarDaysIcon,
	CheckCircle2Icon,
	ChevronDownIcon,
	ChevronsUpDownIcon,
	ClipboardCheckIcon,
	CommandIcon,
	EditIcon,
	ExternalLinkIcon,
	EyeIcon,
	FileQuestionIcon,
	FileTextIcon,
	LayoutGridIcon,
	LayoutListIcon,
	Loader2Icon,
	LogOutIcon,
	MapPinIcon,
	MapPinOffIcon,
	NfcIcon,
	PlusIcon,
	PowerOffIcon,
	ReceiptTextIcon,
	RefreshCwIcon,
	SearchIcon,
	ShieldCheckIcon,
	Trash2Icon,
	UploadIcon,
	UserXIcon,
	WrenchIcon,
	XIcon,
} from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type {
	ComponentProps,
	FormEvent,
	KeyboardEvent,
	ReactNode,
	RefObject,
} from "react";
import {
	Children,
	cloneElement,
	isValidElement,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
	buildAssetPayload,
	buildContractPayload,
	buildEngineerPayload,
	buildFaultPayload,
	buildHospitalPayload,
	buildJobPayload,
	buildPartPayload,
	buildProductPayload,
	buildTenantPayload,
	buildTenantUserPayload,
	type CrudEntity,
	type CrudState,
	destructiveActionLabels,
	entityLabels,
	type FieldConfig,
	type FieldOption,
	type FormDefaultValue,
	getCrudStateKey,
	getFieldConfigs,
	getFormDefaults,
	getRecordId,
} from "@/components/service-ops-crud";
import { DataTable } from "@/components/service-ops-table";
import { ThemeColorSwitcher } from "@/components/theme-color-switcher";
import { authClient } from "@/lib/auth-client";
import {
	getServiceOpsMutationError,
	type ServiceOpsAction,
} from "@/lib/business-errors";
import {
	defaultDialCode,
	internationalDialCodes,
	internationalDialCodesByPrefix,
} from "@/lib/international-dial-codes";
import {
	type Asset,
	type BackOfficeView,
	type Contract,
	type ContractStatus,
	type EngineerStatus,
	type FaultStatus,
	type Hospital,
	type Job,
	type JobStatus,
	navigationItems,
	type Part,
	type ProductModel,
	type ServiceOpsSnapshot,
	type SystemParameter,
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
	Resumed: "border-violet-200 bg-violet-50 text-violet-700",
	"Timer Anomaly": "border-rose-200 bg-rose-50 text-rose-700",
};

const engineerStatusStyles: Record<EngineerStatus, string> = {
	Idle: "bg-amber-500",
	"In transit": "bg-sky-500",
	"Off duty": "bg-zinc-400",
	"On-site": "bg-emerald-500",
	"Timer anomaly": "bg-rose-500",
};

const engineerStatusPillStyles: Record<EngineerStatus, string> = {
	Idle: "border-amber-200 bg-amber-50 text-amber-700",
	"In transit": "border-sky-200 bg-sky-50 text-sky-700",
	"Off duty": "border-zinc-200 bg-zinc-100 text-zinc-600",
	"On-site": "border-emerald-200 bg-emerald-50 text-emerald-700",
	"Timer anomaly": "border-rose-200 bg-rose-50 text-rose-700",
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

const primaryActionClass = "rounded-lg shadow-xs";

const panelClass =
	"rounded-xl border-0 bg-card text-card-foreground shadow-none ring-1 ring-foreground/10";

const mutedPanelClass = "rounded-lg border border-border/60 bg-muted/35";

const dashboardPanelClass =
	"rounded-xl border-0 bg-card text-card-foreground shadow-[0_12px_38px_-32px_rgb(0_0_0_/_0.45)] ring-1 ring-foreground/10";

const dashboardFocusPanelClass =
	"rounded-xl border-0 bg-card text-card-foreground shadow-[0_20px_54px_-36px_rgb(0_0_0_/_0.52)] ring-1 ring-foreground/10";

const dashboardStatCardClass =
	"rounded-xl border-0 bg-card py-5 text-card-foreground shadow-[0_10px_30px_-26px_rgb(0_0_0_/_0.45)] ring-1 ring-foreground/10 transition-shadow hover:shadow-[0_16px_38px_-28px_rgb(0_0_0_/_0.5)]";

const iconTileClass =
	"flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground";

const compactButtonClass = "rounded-lg";

const formFieldClass = "flex min-w-0 flex-col gap-2";

const formLabelClass = "font-medium text-foreground text-xs";

const formControlClass =
	"h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50";

const actionButtonClass = "rounded-lg";

const selectedTenantStorageKey = "luke-service-ops-selected-tenant";

const deleteConfirmationTimeoutMs = 4000;

const inlinePanelViewportPadding = 12;

const inlinePanelWidth = 320;

const inlinePanelOffset = 8;

const coordinateFormatter = new Intl.NumberFormat("en", {
	maximumFractionDigits: 4,
	minimumFractionDigits: 4,
});

const currencyValueFormatter = new Intl.NumberFormat("en-HK", {
	maximumFractionDigits: 2,
	minimumFractionDigits: 2,
});

const hongKongDollarFormatter = new Intl.NumberFormat("en-HK", {
	currency: "HKD",
	maximumFractionDigits: 2,
	minimumFractionDigits: 2,
	style: "currency",
});

const wordBoundaryRegex = /\b\w/g;

const whitespaceRegex = /\s+/;

const dashboardUrgentMetaRegex = /^(\d+) urgent, (\d+) anomaly$/;

const dashboardSeverityMetaRegex = /^(\d+) high or critical$/;

const timerAlertMessageRegex = /^(.+) left (.+) while (.+) timer is running\.$/;

const pmAlertMessageRegex = /^(.+) is on-site at (.+)\. (.+) PM is due soon\.$/;

const contractAlertMessageRegex = /^(.+) contract expires on (.+)\.$/;

const hongKongBounds = {
	maxLat: 22.56,
	maxLng: 114.35,
	minLat: 22.15,
	minLng: 113.82,
} as const;

const titleCase = (value: string) =>
	value
		.replaceAll("_", " ")
		.replace(wordBoundaryRegex, (letter) => letter.toUpperCase());

const formatProperName = (value: string) =>
	value
		.trim()
		.split(whitespaceRegex)
		.filter(Boolean)
		.map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
		.join(" ");

const getPastTenseActionKey = (value: ServiceOpsAction): TranslationKey => {
	if (value === "deactivate") {
		return "toast.service.action.deactivated";
	}

	if (value === "suspend") {
		return "toast.service.action.suspended";
	}

	if (value === "save") {
		return "toast.service.action.saved";
	}

	return "toast.service.action.deleted";
};

const coordinateStyle = (lat: number, lng: number) => {
	const left =
		((lng - hongKongBounds.minLng) /
			(hongKongBounds.maxLng - hongKongBounds.minLng)) *
		100;
	const top =
		((hongKongBounds.maxLat - lat) /
			(hongKongBounds.maxLat - hongKongBounds.minLat)) *
		100;

	return {
		left: `${Math.min(Math.max(left, 6), 88)}%`,
		top: `${Math.min(Math.max(top, 6), 88)}%`,
	};
};

const roleLabels = [
	"super_admin",
	"tenant_admin",
	"operator",
	"observer",
] as const;

const roleDisplayNames: Record<(typeof roleLabels)[number], string> = {
	operator: "Operator",
	observer: "Observer",
	super_admin: "Super administrator",
	tenant_admin: "Tenant administrator",
};

const roleDescriptions: Record<(typeof roleLabels)[number], string> = {
	operator: "Create and manage service operations.",
	observer: "View records without changing tenant data.",
	super_admin: "Full platform and tenant administration.",
	tenant_admin: "Manage tenant users, settings, and workflow data.",
};

const roleBadgeStyles: Record<(typeof roleLabels)[number], string> = {
	operator: "border-emerald-200 bg-emerald-50 text-emerald-700",
	observer: "border-zinc-200 bg-zinc-50 text-zinc-600",
	super_admin: "border-blue-200 bg-blue-50 text-blue-700",
	tenant_admin: "border-violet-200 bg-violet-50 text-violet-700",
};

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
	tenants: "Tenant Management",
	users: "User Management",
};

const navigationSections = [
	{ label: "General", items: ["dashboard", "jobs", "map"] },
	{
		label: "Operations",
		items: [
			"assets",
			"products",
			"hospitals",
			"engineers",
			"contracts",
			"parts",
			"faults",
			"reports",
		],
	},
	{ label: "Other", items: ["users", "tenants", "config"] },
] satisfies Array<{ items: BackOfficeView[]; label: string }>;

const dashboardCategoryItems = [
	{ id: "overview", label: "Overview" },
	{ id: "analytics", label: "Analytics" },
	{ id: "reports", label: "Reports" },
	{ id: "notifications", label: "Notifications" },
] as const;

type DashboardCategory = (typeof dashboardCategoryItems)[number]["id"];

const getBackOfficeTitle = (view: BackOfficeView) => backOfficeTitles[view];

const getNavigationItem = (view: BackOfficeView) =>
	navigationItems.find((item) => item.id === view);

const getHashBackOfficeView = (): BackOfficeView | null => {
	if (typeof window === "undefined") {
		return null;
	}

	const hashView = window.location.hash.replace("#", "");
	const navigationItem = navigationItems.find((item) => item.id === hashView);

	return navigationItem?.id ?? null;
};

function getNavigationSectionLabelKey(label: string): TranslationKey {
	if (label === "General") {
		return "service.navigation.general";
	}

	if (label === "Operations") {
		return "service.navigation.operations";
	}

	return "service.navigation.other";
}

export default function ServiceOpsPlatform({
	currentUser,
	initialData,
	initialHospitalId = "",
}: {
	currentUser: CurrentUser;
	initialData: ServiceOpsSnapshot;
	initialHospitalId?: string;
}) {
	const router = useRouter();
	const { locale, t } = useI18n();
	const [selectedTenantId, setSelectedTenantId] = useState(
		initialData.tenant.id
	);
	const snapshotQuery = useQuery(
		selectedTenantId === initialData.tenant.id
			? trpc.serviceOps.snapshot.queryOptions(
					{ tenantId: selectedTenantId },
					{ initialData, refetchInterval: 15_000, staleTime: 10_000 }
				)
			: trpc.serviceOps.snapshot.queryOptions(
					{ tenantId: selectedTenantId },
					{ refetchInterval: 15_000, staleTime: 10_000 }
				)
	);
	const loadedData = snapshotQuery.data;
	const [knownTenants, setKnownTenants] = useState(initialData.tenants);
	const currentData =
		loadedData?.tenant.id === selectedTenantId ? loadedData : null;
	const tenantOptions = loadedData?.tenants ?? knownTenants;
	const activeTenants = tenantOptions.filter(
		(tenantOption) => tenantOption.isActive
	);
	const selectedTenantOption = tenantOptions.find(
		(tenantOption) => tenantOption.id === selectedTenantId
	);
	const tenant =
		currentData?.tenant ?? selectedTenantOption ?? initialData.tenant;
	const jobs = currentData?.jobs ?? [];
	const isTenantLoading = !currentData && snapshotQuery.isFetching;
	const [activeView, setActiveView] = useState<BackOfficeView>(
		initialHospitalId ? "hospitals" : "dashboard"
	);
	const [selectedJobId, setSelectedJobId] = useState("");
	const [selectedProductId, setSelectedProductId] = useState("");
	const [selectedHospitalId, setSelectedHospitalId] =
		useState(initialHospitalId);
	const [crudState, setCrudState] = useState<CrudState | null>(null);

	const selectedJob = jobs.find((job) => job.id === selectedJobId);
	const isActiveViewAllowed =
		!currentData ||
		((activeView !== "tenants" || currentData.access.canManageTenants) &&
			(activeView !== "users" || currentData.access.canManageTenantUsers));
	const visibleActiveView = isActiveViewAllowed ? activeView : "dashboard";

	useEffect(() => {
		if (loadedData?.tenants) {
			setKnownTenants(loadedData.tenants);
		}
	}, [loadedData?.tenants]);

	useEffect(() => {
		const storedTenantId = window.localStorage.getItem(
			selectedTenantStorageKey
		);

		if (!storedTenantId || storedTenantId === selectedTenantId) {
			return;
		}

		const storedTenant = tenantOptions.find(
			(tenantOption) => tenantOption.id === storedTenantId
		);

		if (storedTenant?.isActive) {
			setSelectedTenantId(storedTenantId);
		}
	}, [selectedTenantId, tenantOptions]);

	useEffect(() => {
		if (!selectedJobId || jobs.some((job) => job.id === selectedJobId)) {
			return;
		}

		setSelectedJobId("");
	}, [jobs, selectedJobId]);

	useEffect(() => {
		const syncViewFromUrl = () => {
			const hashView = getHashBackOfficeView();

			setActiveView(
				hashView ?? (initialHospitalId ? "hospitals" : "dashboard")
			);
		};

		syncViewFromUrl();
		window.addEventListener("hashchange", syncViewFromUrl);
		window.addEventListener("popstate", syncViewFromUrl);

		return () => {
			window.removeEventListener("hashchange", syncViewFromUrl);
			window.removeEventListener("popstate", syncViewFromUrl);
		};
	}, [initialHospitalId]);

	useEffect(() => {
		if (!window.matchMedia("(max-width: 1279px)").matches) {
			return;
		}

		window.requestAnimationFrame(() => {
			document
				.getElementById(`back-office-nav-${visibleActiveView}`)
				?.scrollIntoView({ block: "nearest", inline: "center" });
		});
	}, [visibleActiveView]);

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
				toast.error(t("service.signOutError"));
			});
	};

	const selectBackOfficeView = (view: BackOfficeView) => {
		setActiveView(view);
		setSelectedHospitalId("");
		if (view !== "products") {
			setSelectedProductId("");
		}

		const currentPath = window.location.pathname;
		const nextPath = currentPath.startsWith("/hospitals/") ? "/" : currentPath;
		const nextUrl = `${nextPath}${window.location.search}#${view}`;

		if (window.location.href !== new URL(nextUrl, window.location.href).href) {
			window.history.pushState({ backOfficeView: view }, "", nextUrl);
		}

		if (window.matchMedia("(max-width: 1279px)").matches) {
			window.requestAnimationFrame(() => {
				document
					.getElementById("back-office-content")
					?.scrollTo({ behavior: "smooth", top: 0 });
			});
		}
	};

	const openProductDetail = (productId: string) => {
		setSelectedProductId(productId);
		selectBackOfficeView("products");
	};

	const switchTenant = (tenantId: string) => {
		if (tenantId === selectedTenantId) {
			return;
		}

		setCrudState(null);
		setSelectedHospitalId("");
		setSelectedJobId("");
		setSelectedTenantId(tenantId);
		window.localStorage.setItem(selectedTenantStorageKey, tenantId);
		selectBackOfficeView("dashboard");
	};
	const visibleNavigationSections = navigationSections
		.map((section) => ({
			label: t(getNavigationSectionLabelKey(section.label)),
			items: section.items.filter((itemId) => {
				if (!currentData) {
					return true;
				}

				if (itemId === "tenants") {
					return currentData.access.canManageTenants;
				}

				if (itemId === "users") {
					return currentData.access.canManageTenantUsers;
				}

				return true;
			}),
		}))
		.filter((section) => section.items.length > 0);

	const openHospitalDetail = (hospitalId: string) => {
		setSelectedHospitalId(hospitalId);
		setActiveView("hospitals");
		const hospitalDetailRoute: Route = `/hospitals/${hospitalId}` as Route;
		router.push(hospitalDetailRoute);

		if (window.matchMedia("(max-width: 1279px)").matches) {
			window.requestAnimationFrame(() => {
				document
					.getElementById("back-office-content")
					?.scrollTo({ behavior: "smooth", top: 0 });
			});
		}
	};

	const closeHospitalDetail = () => {
		setSelectedHospitalId("");
		setActiveView("hospitals");
		router.push("/#hospitals");
	};

	return (
		<main className="h-svh overflow-hidden bg-background text-foreground">
			<div className="h-full min-h-0">
				<div className="grid h-full min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] xl:grid-cols-[304px_minmax(0,1fr)] xl:grid-rows-1">
					<aside className="flex w-full min-w-0 flex-col overflow-hidden border-b bg-card text-card-foreground shadow-sm xl:h-full xl:border-r xl:border-b-0">
						<TenantSwitcher
							activeTenants={activeTenants}
							isLoading={isTenantLoading}
							onTenantChange={switchTenant}
							selectedTenant={tenant}
							selectedTenantId={selectedTenantId}
						/>
						<nav className="flex min-w-0 max-w-full gap-2 overflow-x-auto px-3 py-2 [scrollbar-width:none] xl:flex-1 xl:flex-col xl:gap-5 xl:overflow-y-auto xl:px-4 xl:py-3 [&::-webkit-scrollbar]:hidden">
							{visibleNavigationSections.map((section) => (
								<div
									className="flex min-w-max gap-2 xl:min-w-0 xl:flex-col"
									key={section.label}
								>
									<p className="hidden px-3 font-semibold text-muted-foreground text-sm xl:block">
										{section.label}
									</p>
									<div className="flex gap-1 xl:flex-col">
										{section.items.map((itemId) => {
											const item = getNavigationItem(itemId);

											if (!item) {
												return null;
											}

											const Icon = item.icon;
											const isActive = visibleActiveView === item.id;

											return (
												<button
													aria-current={isActive ? "page" : undefined}
													className={cn(
														"flex h-10 min-w-max cursor-pointer items-center gap-3 rounded-xl px-4 text-left font-medium text-base transition-[background-color,color,box-shadow] xl:w-full",
														isActive
															? "bg-muted text-foreground shadow-xs ring-1 ring-foreground/5"
															: "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
													)}
													data-back-office-nav-active={
														isActive ? "true" : undefined
													}
													id={`back-office-nav-${item.id}`}
													key={item.id}
													onClick={() => selectBackOfficeView(item.id)}
													type="button"
												>
													<Icon className="size-5 shrink-0" />
													<span className="truncate">
														{translateServiceText(locale, item.label)}
													</span>
												</button>
											);
										})}
									</div>
								</div>
							))}
						</nav>
						<div className="border-t px-3 py-3 xl:hidden">
							<UserProfile
								currentUser={currentUser}
								onSignOut={handleSignOut}
							/>
						</div>
						<div className="mt-auto hidden p-4 xl:block">
							<UserProfile
								currentUser={currentUser}
								onSignOut={handleSignOut}
							/>
						</div>
					</aside>
					<div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
						<header className="z-20 flex min-h-18 shrink-0 items-center justify-between gap-4 border-b bg-background/95 px-4 pt-5 pb-3 backdrop-blur lg:px-6">
							<div className="min-w-0">
								<p className="text-muted-foreground text-xs">
									{t("service.header.subtitle")}
								</p>
								<h1 className="truncate font-semibold text-lg leading-tight">
									{translateServiceText(
										locale,
										getBackOfficeTitle(visibleActiveView)
									)}
								</h1>
							</div>
							<div className="flex min-w-0 items-center gap-3">
								<div className="hidden min-w-0 items-center gap-2 text-muted-foreground text-xs md:flex">
									<span className="truncate">
										{translateServiceText(locale, tenant.release)}
									</span>
									<span className="size-1 rounded-full bg-border" />
									<span className="truncate">
										{translateServiceText(locale, tenant.region)}
									</span>
								</div>
								<LanguageSwitcher compact />
								<ThemeColorSwitcher />
							</div>
						</header>
						<section
							className="@container/main min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-4 md:py-6 lg:px-6"
							id="back-office-content"
						>
							{currentData ? (
								<BackOfficeViewPanel
									activeView={visibleActiveView}
									data={currentData}
									onCloseHospital={closeHospitalDetail}
									onCreate={(entity) =>
										setCrudState({ entity, mode: "create" })
									}
									onEdit={(entity, record) =>
										setCrudState({ entity, mode: "edit", record })
									}
									onOpenHospital={openHospitalDetail}
									onOpenJob={(jobId) => {
										setSelectedJobId(jobId);
										selectBackOfficeView("jobs");
									}}
									onOpenProduct={openProductDetail}
									selectedHospitalId={selectedHospitalId}
									selectedJob={selectedJob}
									selectedJobId={selectedJobId}
									selectedProductId={selectedProductId}
									setSelectedJobId={setSelectedJobId}
									setSelectedProductId={setSelectedProductId}
								/>
							) : (
								<TenantSnapshotLoading tenantName={tenant.name} />
							)}
						</section>
					</div>
				</div>
			</div>
			{currentData ? (
				<CrudDialog
					data={currentData}
					onClose={() => setCrudState(null)}
					state={crudState}
				/>
			) : null}
		</main>
	);
}

function TenantSwitcher({
	activeTenants,
	isLoading,
	onTenantChange,
	selectedTenant,
	selectedTenantId,
}: {
	activeTenants: ServiceOpsSnapshot["tenants"];
	isLoading: boolean;
	onTenantChange: (tenantId: string) => void;
	selectedTenant: ServiceOpsSnapshot["tenant"];
	selectedTenantId: string;
}) {
	const { locale, t } = useI18n();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button
						className="flex w-full cursor-pointer items-center gap-4 px-4 py-4 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted lg:px-6 lg:py-7"
						disabled={activeTenants.length === 0}
						type="button"
					/>
				}
			>
				<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-xs">
					<CommandIcon className="size-6" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate font-bold text-xl leading-tight">Utiliti</p>
					<p className="truncate font-medium text-muted-foreground text-sm">
						{translateServiceText(locale, selectedTenant.name)}
					</p>
				</div>
				<div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background text-foreground shadow-xs">
					{isLoading ? (
						<Loader2Icon className="size-5 animate-spin" />
					) : (
						<ChevronsUpDownIcon className="size-5" />
					)}
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-72 bg-card"
				sideOffset={8}
			>
				<DropdownMenuGroup>
					<DropdownMenuLabel>
						{t("service.action.switchWorkspace")}
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuRadioGroup
					onValueChange={onTenantChange}
					value={selectedTenantId}
				>
					{activeTenants.map((tenantOption) => (
						<DropdownMenuRadioItem
							className="items-start gap-3 py-2 pr-8"
							closeOnClick
							key={tenantOption.id}
							value={tenantOption.id}
						>
							<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
								<CommandIcon className="size-4" />
							</span>
							<span className="min-w-0">
								<span className="block truncate font-medium">
									{translateServiceText(locale, tenantOption.name)}
								</span>
								<span className="block truncate text-muted-foreground text-xs">
									{translateServiceText(locale, tenantOption.region)} ·{" "}
									{translateServiceText(locale, tenantOption.release)}
								</span>
							</span>
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function TenantSnapshotLoading({ tenantName }: { tenantName: string }) {
	const { t } = useI18n();

	return (
		<div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-8 text-center">
			<Loader2Icon className="size-6 animate-spin text-muted-foreground" />
			<div>
				<p className="font-medium">{t("service.empty.loadingWorkspace")}</p>
				<p className="text-muted-foreground text-sm">{tenantName}</p>
			</div>
		</div>
	);
}

function UserProfile({
	currentUser,
	onSignOut,
}: {
	currentUser: CurrentUser;
	onSignOut: () => void;
}) {
	const { locale, t } = useI18n();
	const rawDisplayName = currentUser.name?.trim() || t("service.signedInUser");
	const displayName = translateServiceText(locale, rawDisplayName);
	const initials = getInitials(rawDisplayName, currentUser.email);

	return (
		<div className="flex items-center gap-3 rounded-2xl bg-card p-2 transition-colors hover:bg-muted/70">
			<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted font-semibold text-base uppercase">
				{initials}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate font-bold text-base leading-tight">
					{displayName}
				</p>
				<p className="truncate font-medium text-muted-foreground text-sm">
					{currentUser.email}
				</p>
			</div>
			<Button
				aria-label={t("service.signOut")}
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
	onCloseHospital,
	onEdit,
	onOpenHospital,
	onOpenJob,
	onOpenProduct,
	selectedHospitalId,
	selectedJob,
	selectedJobId,
	selectedProductId,
	setSelectedJobId,
	setSelectedProductId,
}: {
	activeView: BackOfficeView;
	data: ServiceOpsSnapshot;
	onCreate: (entity: CrudEntity) => void;
	onCloseHospital: () => void;
	onEdit: (entity: CrudEntity, record: unknown) => void;
	onOpenHospital: (hospitalId: string) => void;
	onOpenJob: (jobId: string) => void;
	onOpenProduct: (productId: string) => void;
	selectedHospitalId: string;
	selectedJob?: Job;
	selectedJobId: string;
	selectedProductId: string;
	setSelectedJobId: (jobId: string) => void;
	setSelectedProductId: (productId: string) => void;
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
		tenants,
		users,
	} = data;
	const canWrite = data.access.canWrite;
	const canManageTenants = data.access.canManageTenants;
	const canManageTenantUsers = data.access.canManageTenantUsers;
	const actionFor = (action: ReactNode) => (canWrite ? action : null);
	const actionMutations = useServiceOpsActionMutations(data.tenant.id);

	if (activeView === "jobs") {
		return (
			<PageFrame
				action={actionFor(
					<Button
						className={primaryActionClass}
						onClick={() => onCreate("job")}
					>
						<PlusIcon className="size-4" />
						New job
					</Button>
				)}
				description="Dispatch work, inspect ownership, and audit the current state machine without leaving the service console."
				eyebrow="Job Management"
				title="Job dispatch and state control"
				width="full"
			>
				<div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.85fr)]">
					<div className="flex min-w-0 flex-col gap-4">
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
							onSelectedRowIdChange={setSelectedJobId}
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
									formatProperName(job.engineer),
									job.scheduledFor,
								],
								actions: (
									<RowActions
										canWrite={canWrite}
										entity="job"
										id={job.recordId}
										onEdit={() => onEdit("job", job)}
										tenantId={data.tenant.id}
									/>
								),
								id: job.id,
							}))}
							selectedRowId={selectedJobId}
							title={`${jobs.length} Jobs`}
						/>
					</div>
					<Card className={cn(panelClass, "min-w-0")}>
						{selectedJob ? (
							<>
								<CardHeader>
									<CardTitle>{selectedJob.id} audit trail</CardTitle>
								</CardHeader>
								<CardContent className="flex flex-col gap-4">
									<StateMachine currentStatus={selectedJob.status} />
									<div className={`${mutedPanelClass} p-3 text-sm`}>
										<LocalizedText as="p" className="font-medium">
											Latest event
										</LocalizedText>
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
									<JobActionPanel
										canWrite={canWrite}
										job={selectedJob}
										mutations={actionMutations}
										parts={parts}
										tenantId={data.tenant.id}
									/>
								</CardContent>
							</>
						) : (
							<JobAuditEmptyState />
						)}
					</Card>
				</div>
			</PageFrame>
		);
	}

	if (activeView === "assets") {
		return (
			<AssetsView
				assets={assets}
				canWrite={canWrite}
				engineers={engineers}
				jobs={jobs}
				mutations={actionMutations}
				onCreate={() => onCreate("asset")}
				onEdit={(asset) => onEdit("asset", asset)}
				onOpenJob={onOpenJob}
				onOpenProduct={onOpenProduct}
				products={products}
				tenantId={data.tenant.id}
			/>
		);
	}

	if (activeView === "products") {
		return (
			<ProductCatalogue
				assets={assets}
				canWrite={canWrite}
				jobs={jobs}
				mutations={actionMutations}
				onCreate={() => onCreate("product")}
				onCreateAsset={() => onCreate("asset")}
				onEdit={(product) => onEdit("product", product)}
				parts={parts}
				products={products}
				selectedProductId={selectedProductId}
				setSelectedProductId={setSelectedProductId}
				tenantId={data.tenant.id}
			/>
		);
	}

	if (activeView === "hospitals") {
		return (
			<HospitalsView
				assets={assets}
				canWrite={canWrite}
				contracts={contracts}
				faultReports={faultReports}
				hospitals={hospitals}
				jobs={jobs}
				onCloseHospital={onCloseHospital}
				onCreate={() => onCreate("hospital")}
				onEdit={(hospital) => onEdit("hospital", hospital)}
				onOpenHospital={onOpenHospital}
				onOpenJob={onOpenJob}
				selectedHospitalId={selectedHospitalId}
				tenantId={data.tenant.id}
			/>
		);
	}

	if (activeView === "engineers") {
		return (
			<EngineersView
				canWrite={canWrite}
				engineers={engineers}
				jobs={jobs}
				onCreate={() => onCreate("engineer")}
				onEdit={(engineer) => onEdit("engineer", engineer)}
				onOpenJob={onOpenJob}
				tenantId={data.tenant.id}
			/>
		);
	}

	if (activeView === "contracts") {
		return (
			<ContractsView
				canWrite={canWrite}
				contracts={contracts}
				isRefreshing={actionMutations.refreshContractStatuses.isPending}
				onCreate={() => onCreate("contract")}
				onEdit={(contract) => onEdit("contract", contract)}
				onRefreshStatuses={() =>
					actionMutations.refreshContractStatuses.mutate({
						tenantId: data.tenant.id,
					})
				}
				tenantId={data.tenant.id}
			/>
		);
	}

	if (activeView === "map") {
		return (
			<MapView
				canWrite={canWrite}
				engineers={engineers}
				hospitals={hospitals}
				liveAlerts={liveAlerts}
				mutations={actionMutations}
				systemParameters={systemParameters}
				tenantId={data.tenant.id}
			/>
		);
	}

	if (activeView === "faults") {
		return (
			<PageFrame
				action={actionFor(
					<Button
						className={primaryActionClass}
						onClick={() => onCreate("fault")}
					>
						<PlusIcon className="size-4" />
						Manual fault
					</Button>
				)}
				eyebrow="G. Fault Reporting"
				hideHeader
				title="Fault Reports"
				width="full"
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
					description={null}
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
							<div className="flex items-center justify-end gap-1">
								<Button
									aria-label="Convert fault to repair job"
									className={compactButtonClass}
									disabled={!(canWrite && fault.assetId)}
									onClick={() =>
										actionMutations.convertFaultToRepairJob.mutate({
											id: fault.recordId,
											tenantId: data.tenant.id,
										})
									}
									size="icon-sm"
									variant="ghost"
								>
									<WrenchIcon className="size-4" />
								</Button>
								<RowActions
									canWrite={canWrite}
									entity="fault"
									id={fault.recordId}
									onEdit={() => onEdit("fault", fault)}
									tenantId={data.tenant.id}
								/>
							</div>
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
				canWrite={canWrite}
				mutations={actionMutations}
				onCreate={() => onCreate("part")}
				onEdit={(part) => onEdit("part", part)}
				onOpenProduct={onOpenProduct}
				parts={parts}
				products={products}
				shortages={shortages}
				tenantId={data.tenant.id}
			/>
		);
	}

	if (activeView === "reports") {
		return (
			<ReportsView
				costRecords={costRecords}
				onGenerateReport={(period) =>
					actionMutations.generateOperationalReport.mutate({
						period,
						tenantId: data.tenant.id,
					})
				}
				reportMetrics={reportMetrics}
			/>
		);
	}

	if (activeView === "config") {
		return (
			<ConfigView
				canWrite={canWrite}
				mutations={actionMutations}
				systemParameters={systemParameters}
				tenantId={data.tenant.id}
			/>
		);
	}

	if (activeView === "tenants") {
		return (
			<TenantsView
				canManageTenants={canManageTenants}
				currentTenantId={data.tenant.id}
				onCreate={() => onCreate("tenant")}
				onEdit={(tenantRecord) => onEdit("tenant", tenantRecord)}
				tenants={tenants}
			/>
		);
	}

	if (activeView === "users") {
		return (
			<TenantUsersView
				canManageTenantUsers={canManageTenantUsers}
				tenantId={data.tenant.id}
				users={users}
			/>
		);
	}

	return (
		<DashboardView
			dashboardStats={dashboardStats}
			jobs={jobs}
			liveAlerts={liveAlerts}
		/>
	);
}

function HospitalsView({
	assets,
	canWrite,
	contracts,
	faultReports,
	hospitals,
	jobs,
	onCloseHospital,
	onCreate,
	onEdit,
	onOpenHospital,
	onOpenJob,
	selectedHospitalId,
	tenantId,
}: {
	assets: Asset[];
	canWrite: boolean;
	contracts: Contract[];
	faultReports: ServiceOpsSnapshot["faultReports"];
	hospitals: Hospital[];
	jobs: Job[];
	onCloseHospital: () => void;
	onCreate: () => void;
	onEdit: (hospital: Hospital) => void;
	onOpenHospital: (hospitalId: string) => void;
	onOpenJob: (jobId: string) => void;
	selectedHospitalId: string;
	tenantId: string;
}) {
	const selectedHospital =
		hospitals.find((hospital) => hospital.id === selectedHospitalId) ?? null;

	if (selectedHospitalId) {
		return (
			<HospitalDetailView
				assets={assets.filter(
					(asset) => asset.hospitalId === selectedHospitalId
				)}
				canWrite={canWrite}
				contracts={contracts.filter(
					(contract) => contract.hospitalId === selectedHospitalId
				)}
				faultReports={faultReports.filter(
					(fault) => fault.hospitalId === selectedHospitalId
				)}
				hospital={selectedHospital}
				hospitalId={selectedHospitalId}
				jobs={jobs.filter((job) => job.hospitalId === selectedHospitalId)}
				onBack={onCloseHospital}
				onEdit={selectedHospital ? () => onEdit(selectedHospital) : undefined}
				onOpenJob={onOpenJob}
				tenantId={tenantId}
			/>
		);
	}

	return (
		<PageFrame
			action={
				canWrite ? (
					<Button className={primaryActionClass} onClick={onCreate}>
						<PlusIcon className="size-4" />
						New hospital
					</Button>
				) : null
			}
			description="Hospital sites with contract state, asset coverage, location data, and current demand."
			eyebrow="Tenant sites"
			hideHeader
			title="Hospitals and contract status"
			width="full"
		>
			<DataTable
				columns={[
					"Hospital",
					"City",
					"Region / Province",
					"Contract",
					"Assets",
					"Open jobs",
					"Location",
				]}
				description="Hospital sites with contract state, asset count, and open field-service demand."
				filterLabels={["Contract", "City", "Region"]}
				rows={hospitals.map((hospital) => ({
					detailAriaLabel: `View ${hospital.name} details`,
					cells: [
						<button
							className="font-medium text-primary hover:underline"
							key={`${hospital.id}-name`}
							onClick={() => onOpenHospital(hospital.id)}
							type="button"
						>
							{hospital.name}
						</button>,
						hospital.district,
						hospital.regionProvince ?? "Not set",
						<StatusPill
							className={contractStatusStyles[hospital.contractStatus]}
							key={`${hospital.id}-status`}
						>
							{hospital.contractStatus}
						</StatusPill>,
						hospital.assets,
						hospital.openJobs,
						<HospitalLocationCell
							address={hospital.address}
							key={`${hospital.id}-location`}
							lat={hospital.lat}
							lng={hospital.lng}
						/>,
					],
					actions: (
						<div className="inline-flex items-center justify-end gap-1">
							<Button
								aria-label={`View ${hospital.name} details`}
								className={compactButtonClass}
								onClick={() => onOpenHospital(hospital.id)}
								size="icon-sm"
								type="button"
								variant="ghost"
							>
								<EyeIcon className="size-4" />
							</Button>
							<RowActions
								canWrite={canWrite}
								entity="hospital"
								id={hospital.id}
								onEdit={() => onEdit(hospital)}
								tenantId={tenantId}
							/>
						</div>
					),
					id: hospital.id,
					onClick: () => onOpenHospital(hospital.id),
				}))}
				title={`${hospitals.length} Hospitals`}
			/>
		</PageFrame>
	);
}

function HospitalDetailView({
	assets,
	canWrite,
	contracts,
	faultReports,
	hospital,
	hospitalId,
	jobs,
	onBack,
	onEdit,
	onOpenJob,
	tenantId,
}: {
	assets: Asset[];
	canWrite: boolean;
	contracts: Contract[];
	faultReports: ServiceOpsSnapshot["faultReports"];
	hospital: Hospital | null;
	hospitalId: string;
	jobs: Job[];
	onBack: () => void;
	onEdit?: () => void;
	onOpenJob: (jobId: string) => void;
	tenantId: string;
}) {
	const { t } = useI18n();

	if (!hospital) {
		return (
			<PageFrame
				description="The requested hospital record is not available in this tenant."
				eyebrow="Hospitals"
				hideHeader
				title="Hospital not found"
				width="full"
			>
				<div className="flex flex-col gap-6">
					<button
						className="inline-flex w-fit items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
						onClick={onBack}
						type="button"
					>
						<ArrowLeftIcon className="size-4" />
						{t("common.back")}
					</button>
					<EmptyInline message={`No hospital found for ${hospitalId}.`} />
				</div>
			</PageFrame>
		);
	}

	const activeJobs = jobs.filter((job) => job.status !== "Completed");
	const completedJobs = jobs.filter((job) => job.status === "Completed");
	const primaryContract = getPrimaryHospitalContract(contracts);
	const pmDueSoonAssets = getPmDueSoonAssets(assets);
	const addressSummary = getHospitalAddressSummary(hospital);

	return (
		<PageFrame
			description="Hospital profile, current work, installed devices, contact ownership, and contract coverage."
			eyebrow="Hospitals"
			hideHeader
			title={`${hospital.name} detail`}
			width="full"
		>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-3">
					<button
						className="inline-flex w-fit items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
						onClick={onBack}
						type="button"
					>
						<ArrowLeftIcon className="size-4" />
						Back
					</button>
					<div className="text-muted-foreground text-sm">
						<button
							className="font-medium transition-colors hover:text-foreground"
							onClick={onBack}
							type="button"
						>
							Hospitals
						</button>
						<span className="mx-2">/</span>
						<span className="font-medium text-foreground">{hospital.name}</span>
					</div>
				</div>
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="min-w-0">
						<h2 className="truncate font-semibold text-3xl tracking-tight">
							{hospital.name}
						</h2>
						<p className="mt-1 text-muted-foreground">{addressSummary}</p>
					</div>
					<div className="flex shrink-0 flex-wrap items-center gap-2">
						<StatusPill
							className={contractStatusStyles[hospital.contractStatus]}
						>
							{hospital.contractStatus} contract
						</StatusPill>
						{canWrite && onEdit ? (
							<RowActions
								canWrite={canWrite}
								entity="hospital"
								id={hospital.id}
								onEdit={onEdit}
								tenantId={tenantId}
							/>
						) : null}
					</div>
				</div>
				<div className="grid gap-4 md:grid-cols-3">
					<HospitalStatCard label="Installed Devices" value={assets.length} />
					<HospitalStatCard label="Active Jobs" value={activeJobs.length} />
					<HospitalStatCard
						label="Completed Jobs"
						value={completedJobs.length}
					/>
				</div>
				<div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
					<div className="flex min-w-0 flex-col gap-6">
						<HospitalActivityCard
							emptyMessage="No active jobs for this hospital."
							items={activeJobs}
							onOpenJob={onOpenJob}
							title="Active Jobs"
							type="job"
						/>
						<HospitalActivityCard
							emptyMessage="No installed devices for this hospital."
							items={assets}
							title="Installed Devices"
							type="asset"
						/>
					</div>
					<div className="flex min-w-0 flex-col gap-6">
						<HospitalContactCard hospital={hospital} />
						<HospitalContractCard contract={primaryContract} />
						<HospitalLocationCard hospital={hospital} />
						<HospitalPmDueCard assets={pmDueSoonAssets} />
						<HospitalFaultCard faultReports={faultReports} />
					</div>
				</div>
			</div>
		</PageFrame>
	);
}

function HospitalStatCard({ label, value }: { label: string; value: number }) {
	const { locale } = useI18n();

	return (
		<div className={`${panelClass} p-4`}>
			<p className="font-medium text-3xl leading-none tracking-tight">
				{value}
			</p>
			<p className="mt-3 text-muted-foreground text-sm">
				{translateServiceText(locale, label)}
			</p>
		</div>
	);
}

function HospitalActivityCard({
	emptyMessage,
	items,
	onOpenJob,
	title,
	type,
}: {
	emptyMessage: string;
	items: Asset[] | Job[];
	onOpenJob?: (jobId: string) => void;
	title: string;
	type: "asset" | "job";
}) {
	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{items.length > 0 ? (
					items.map((item) =>
						type === "job" ? (
							<HospitalJobRow
								job={item as Job}
								key={(item as Job).recordId}
								onOpenJob={onOpenJob}
							/>
						) : (
							<HospitalAssetRow
								asset={item as Asset}
								key={(item as Asset).id}
							/>
						)
					)
				) : (
					<EmptyInline message={emptyMessage} />
				)}
			</CardContent>
		</Card>
	);
}

function HospitalJobRow({
	job,
	onOpenJob,
}: {
	job: Job;
	onOpenJob?: (jobId: string) => void;
}) {
	return (
		<div className={`${mutedPanelClass} p-4`}>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<p className="truncate font-semibold text-base">{job.description}</p>
					<p className="mt-1 truncate text-muted-foreground text-sm">
						{job.typeValue} · {job.engineer}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-3">
					<StatusPill className={statusStyles[job.status]}>
						{job.status}
					</StatusPill>
					{onOpenJob ? (
						<button
							className="inline-flex items-center gap-1 font-medium text-primary text-sm hover:underline"
							onClick={() => onOpenJob(job.id)}
							type="button"
						>
							View
							<ArrowUpRightIcon className="size-3.5" />
						</button>
					) : null}
				</div>
			</div>
		</div>
	);
}

function HospitalAssetRow({ asset }: { asset: Asset }) {
	return (
		<div className={`${mutedPanelClass} p-4`}>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<p className="truncate font-semibold text-base">{asset.model}</p>
					<p className="mt-1 truncate text-muted-foreground text-sm">
						{asset.serial || "No serial"} · {asset.location}
					</p>
				</div>
				<StatusPill className={coverageStatusStyles[asset.contractCoverage]}>
					{asset.contractCoverage}
				</StatusPill>
			</div>
		</div>
	);
}

function HospitalContactCard({ hospital }: { hospital: Hospital }) {
	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Contact</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<HospitalDetailField
					label="Primary contact"
					value={hospital.primaryContactName ?? "Not set"}
				/>
				<HospitalDetailField
					label="Phone"
					value={hospital.primaryContactPhone ?? "Not set"}
				/>
				<HospitalDetailField
					label="Email"
					value={hospital.primaryContactEmail ?? "Not set"}
				/>
			</CardContent>
		</Card>
	);
}

function HospitalContractCard({ contract }: { contract: Contract | null }) {
	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Contract</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{contract ? (
					<>
						<HospitalDetailField label="Contract number" value={contract.id} />
						<HospitalDetailField label="Type" value={contract.typeValue} />
						<HospitalDetailField label="Valid until" value={contract.expiry} />
						<HospitalDetailField
							label="Response SLA"
							value={`${contract.slaHours}h`}
						/>
					</>
				) : (
					<EmptyInline message="No active contract configured." />
				)}
			</CardContent>
		</Card>
	);
}

function HospitalLocationCard({ hospital }: { hospital: Hospital }) {
	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Location</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<HospitalDetailField label="Hospital code" value={hospital.code} />
				<HospitalDetailField label="City" value={hospital.district} />
				<HospitalDetailField
					label="Region / Province"
					value={hospital.regionProvince ?? "Not set"}
				/>
				<HospitalDetailField
					label="Address"
					value={hospital.address ?? "Not set"}
				/>
				<HospitalLocationCell
					address={hospital.address}
					lat={hospital.lat}
					lng={hospital.lng}
				/>
			</CardContent>
		</Card>
	);
}

function HospitalPmDueCard({ assets }: { assets: Asset[] }) {
	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>PM Due Soon</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{assets.length > 0 ? (
					assets.map((asset) => (
						<div className={`${mutedPanelClass} p-3`} key={`${asset.id}-pm`}>
							<p className="truncate font-medium text-sm">{asset.model}</p>
							<p className="mt-1 text-muted-foreground text-xs">
								{asset.nextPmDue}
							</p>
						</div>
					))
				) : (
					<EmptyInline message="No PM due in the next 30 days." />
				)}
			</CardContent>
		</Card>
	);
}

function HospitalFaultCard({
	faultReports,
}: {
	faultReports: ServiceOpsSnapshot["faultReports"];
}) {
	const openFaults = faultReports.filter(
		(fault) => fault.status !== "Resolved"
	);

	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Open Faults</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{openFaults.length > 0 ? (
					openFaults.slice(0, 4).map((fault) => (
						<div className={`${mutedPanelClass} p-3`} key={fault.recordId}>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="truncate font-medium text-sm">
										{fault.description}
									</p>
									<p className="mt-1 truncate text-muted-foreground text-xs">
										{fault.asset} · {fault.severity}
									</p>
								</div>
								<StatusPill className={faultStatusStyles[fault.status]}>
									{fault.status}
								</StatusPill>
							</div>
						</div>
					))
				) : (
					<EmptyInline message="No open fault reports." />
				)}
			</CardContent>
		</Card>
	);
}

function HospitalDetailField({
	label,
	value,
}: {
	label: string;
	value: ReactNode;
}) {
	const { locale } = useI18n();

	return (
		<div>
			<p className="text-muted-foreground text-xs">
				{translateServiceText(locale, label)}
			</p>
			<p className="mt-1 break-words font-medium text-sm">
				{localizeServiceNode(value, locale)}
			</p>
		</div>
	);
}

function getPrimaryHospitalContract(contracts: Contract[]) {
	return (
		contracts.find((contract) => contract.status === "Active") ??
		contracts.find((contract) => contract.status === "Expiring") ??
		contracts.at(0) ??
		null
	);
}

const coverageStatusStyles: Record<Asset["contractCoverage"], string> = {
	"Billable exception": "border-amber-200 bg-amber-50 text-amber-700",
	Expired: "border-zinc-200 bg-zinc-50 text-zinc-600",
	"In contract": "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function AssetsView({
	assets,
	canWrite,
	engineers,
	jobs,
	mutations,
	onCreate,
	onEdit,
	onOpenJob,
	onOpenProduct,
	products,
	tenantId,
}: {
	assets: Asset[];
	canWrite: boolean;
	engineers: ServiceOpsSnapshot["engineers"];
	jobs: Job[];
	mutations: ActionMutations;
	onCreate: () => void;
	onEdit: (asset: Asset) => void;
	onOpenJob: (jobId: string) => void;
	onOpenProduct: (productId: string) => void;
	products: ProductModel[];
	tenantId: string;
}) {
	const [selectedAssetId, setSelectedAssetId] = useState("");
	const selectedAsset =
		assets.find((asset) => asset.recordId === selectedAssetId) ?? null;

	useEffect(() => {
		if (
			!selectedAssetId ||
			assets.some((asset) => asset.recordId === selectedAssetId)
		) {
			return;
		}

		setSelectedAssetId("");
	}, [assets, selectedAssetId]);

	if (selectedAsset) {
		return (
			<AssetDetailView
				asset={selectedAsset}
				canWrite={canWrite}
				jobs={jobs.filter((job) => job.assetId === selectedAsset.recordId)}
				onBack={() => setSelectedAssetId("")}
				onEdit={() => onEdit(selectedAsset)}
				onOpenJob={onOpenJob}
				onOpenProduct={onOpenProduct}
				product={
					products.find(
						(product) => product.id === selectedAsset.productModelId
					) ?? null
				}
				tenantId={tenantId}
			/>
		);
	}

	return (
		<PageFrame
			action={
				canWrite ? (
					<Button className={primaryActionClass} onClick={onCreate}>
						<PlusIcon className="size-4" />
						Register asset
					</Button>
				) : null
			}
			description="Installed equipment records with NFC tags, contract coverage, and preventive maintenance dates."
			eyebrow="B. Asset & Device Management"
			hideHeader
			title="Installed asset registry"
			width="full"
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
					detailAriaLabel: `View ${asset.id} details`,
					cells: [
						<button
							className="font-medium text-primary hover:underline"
							key={`${asset.id}-label`}
							onClick={() => setSelectedAssetId(asset.recordId)}
							type="button"
						>
							{asset.id}
						</button>,
						asset.model,
						asset.hospital,
						asset.location,
						asset.nfcUid,
						<StatusPill
							className={coverageStatusStyles[asset.contractCoverage]}
							key={`${asset.id}-coverage`}
						>
							{asset.contractCoverage}
						</StatusPill>,
						asset.nextPmDue,
					],
					actions: (
						<div className="inline-flex items-center justify-end gap-1">
							<Button
								aria-label={`View ${asset.id} details`}
								className={compactButtonClass}
								onClick={() => setSelectedAssetId(asset.recordId)}
								size="icon-sm"
								type="button"
								variant="ghost"
							>
								<EyeIcon className="size-4" />
							</Button>
							<AssetNfcInlineActions
								asset={asset}
								canWrite={canWrite}
								engineers={engineers}
								mutations={mutations}
								tenantId={tenantId}
							/>
							<RowActions
								canWrite={canWrite}
								entity="asset"
								id={asset.recordId}
								onEdit={() => onEdit(asset)}
								tenantId={tenantId}
							/>
						</div>
					),
					id: asset.id,
					onClick: () => setSelectedAssetId(asset.recordId),
				}))}
				title={`${assets.length} Assets`}
			/>
		</PageFrame>
	);
}

function AssetDetailView({
	asset,
	canWrite,
	jobs,
	onBack,
	onEdit,
	onOpenJob,
	onOpenProduct,
	product,
	tenantId,
}: {
	asset: Asset;
	canWrite: boolean;
	jobs: Job[];
	onBack: () => void;
	onEdit: () => void;
	onOpenJob: (jobId: string) => void;
	onOpenProduct: (productId: string) => void;
	product: ProductModel | null;
	tenantId: string;
}) {
	return (
		<PageFrame
			description="Installed device identity, service status, location, job history, and NFC audit context."
			eyebrow="B. Asset & Device Management"
			hideHeader
			title={`${asset.id} detail`}
			width="full"
		>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-4">
					<button
						className="inline-flex w-fit items-center gap-2 text-base text-muted-foreground transition-colors hover:text-foreground"
						onClick={onBack}
						type="button"
					>
						<ArrowLeftIcon className="size-5" />
						Back
					</button>
					<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
						<div className="min-w-0">
							<h2 className="truncate font-semibold text-3xl tracking-tight">
								{asset.model}
							</h2>
							<p className="mt-2 font-mono text-lg text-muted-foreground">
								{asset.serial}
							</p>
						</div>
						<div className="flex shrink-0 flex-wrap items-center gap-2">
							<StatusPill
								className={coverageStatusStyles[asset.contractCoverage]}
							>
								{asset.contractCoverage}
							</StatusPill>
							<RowActions
								canWrite={canWrite}
								entity="asset"
								id={asset.recordId}
								onEdit={onEdit}
								tenantId={tenantId}
							/>
						</div>
					</div>
				</div>
				<div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
					<div className="flex min-w-0 flex-col gap-6">
						<AssetDeviceIdentityCard
							asset={asset}
							onOpenProduct={onOpenProduct}
							product={product}
						/>
						<AssetLocationCard asset={asset} />
						<AssetJobHistoryCard jobs={jobs} onOpenJob={onOpenJob} />
						<AssetNfcAuditCard asset={asset} jobs={jobs} />
					</div>
					<AssetServiceStatusCard asset={asset} jobs={jobs} />
				</div>
			</div>
		</PageFrame>
	);
}

function AssetDeviceIdentityCard({
	asset,
	onOpenProduct,
	product,
}: {
	asset: Asset;
	onOpenProduct: (productId: string) => void;
	product: ProductModel | null;
}) {
	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Device Identity</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-6 sm:grid-cols-2">
				<PartDetailField
					label="Model"
					value={
						product ? (
							<button
								className="text-left text-primary hover:underline"
								onClick={() => onOpenProduct(product.id)}
								type="button"
							>
								{product.modelName}
							</button>
						) : (
							asset.model
						)
					}
				/>
				<PartDetailField
					label="Manufacturer"
					value={product?.manufacturer ?? "Not set"}
				/>
				<PartDetailField
					label="Category"
					value={product?.category ?? "Not set"}
				/>
				<PartDetailField label="Serial Number" value={asset.serial} />
				<PartDetailField label="Purchase Date" value={asset.installationDate} />
				<PartDetailField label="Warranty Expiry" value={asset.warrantyExpiry} />
			</CardContent>
		</Card>
	);
}

function AssetServiceStatusCard({
	asset,
	jobs,
}: {
	asset: Asset;
	jobs: Job[];
}) {
	const activeJob = jobs.find(
		(job) => job.status !== "Completed" && job.status !== "Cancelled"
	);

	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Service Status</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-5">
				<div>
					<LocalizedText as="p" className="text-muted-foreground text-sm">
						NFC Tag
					</LocalizedText>
					<div className="mt-3 flex items-center gap-2">
						<span className="size-2 rounded-full bg-emerald-500" />
						<LocalizedText
							as="p"
							className="font-semibold text-base text-emerald-700"
						>
							Commissioned
						</LocalizedText>
					</div>
					<p className="mt-2 break-all font-mono text-muted-foreground text-sm">
						{asset.nfcUid}
					</p>
				</div>
				<div className="border-t pt-5">
					<LocalizedText as="p" className="text-muted-foreground text-sm">
						Preventive Maintenance
					</LocalizedText>
					<LocalizedText as="p" className="mt-2 font-medium text-base">
						{asset.nextPmDue === "Not scheduled"
							? "No PM schedule set"
							: asset.nextPmDue}
					</LocalizedText>
				</div>
				{activeJob ? (
					<div className="border-t pt-5">
						<LocalizedText as="p" className="text-muted-foreground text-sm">
							Current Job
						</LocalizedText>
						<p className="mt-2 font-semibold">{activeJob.id}</p>
						<p className="mt-1 text-muted-foreground text-sm">
							{activeJob.description}
						</p>
					</div>
				) : null}
				<div className="border-t pt-5">
					<LocalizedText as="p" className="text-muted-foreground text-sm">
						Designated Engineer
					</LocalizedText>
					<p className="mt-2 font-medium text-base">
						{asset.designatedEngineer}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

function AssetLocationCard({ asset }: { asset: Asset }) {
	const locationParts = parseAssetLocation(asset.location);

	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Location</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-6 sm:grid-cols-2">
				<PartDetailField label="Hospital" value={asset.hospital} />
				<PartDetailField label="Floor" value={locationParts.floor} />
				<PartDetailField label="Room" value={locationParts.room} />
				<PartDetailField
					label="Installation Date"
					value={asset.installationDate}
				/>
				<PartDetailField
					className="sm:col-span-2"
					label="Notes"
					value={locationParts.notes}
				/>
			</CardContent>
		</Card>
	);
}

function AssetJobHistoryCard({
	jobs,
	onOpenJob,
}: {
	jobs: Job[];
	onOpenJob: (jobId: string) => void;
}) {
	const recentJobs = [...jobs]
		.sort((first, second) => second.id.localeCompare(first.id))
		.slice(0, 4);

	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Job History</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{recentJobs.length > 0 ? (
					recentJobs.map((job) => (
						<div className={`${mutedPanelClass} p-4`} key={job.recordId}>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="min-w-0">
									<p className="truncate font-semibold text-base">
										{job.id} · {job.type}
									</p>
									<p className="mt-1 truncate text-muted-foreground text-sm">
										{job.description}
									</p>
								</div>
								<div className="flex shrink-0 items-center gap-3">
									<StatusPill className={statusStyles[job.status]}>
										{job.status}
									</StatusPill>
									<button
										className="inline-flex items-center gap-1 font-medium text-primary text-sm hover:underline"
										onClick={() => onOpenJob(job.id)}
										type="button"
									>
										View
										<ArrowUpRightIcon className="size-3.5" />
									</button>
								</div>
							</div>
						</div>
					))
				) : (
					<EmptyInline message="No jobs for this asset" />
				)}
			</CardContent>
		</Card>
	);
}

function AssetNfcAuditCard({ asset, jobs }: { asset: Asset; jobs: Job[] }) {
	const latestJob = [...jobs].sort((first, second) =>
		second.id.localeCompare(first.id)
	)[0];

	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>NFC Audit Log</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex min-w-0 items-center gap-3">
						<span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700 text-sm">
							Read
						</span>
						<div className="min-w-0">
							<p className="truncate font-medium">
								{latestJob?.engineer ?? asset.designatedEngineer}
							</p>
							<p className="mt-1 truncate text-muted-foreground text-xs">
								{asset.nfcUid}
							</p>
						</div>
					</div>
					<p className="text-muted-foreground text-sm">
						{latestJob?.id ?? "Latest record"}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

function parseAssetLocation(location: string) {
	const parts = location
		.split("/")
		.map((part) => part.trim())
		.filter(Boolean);

	return {
		floor: parts[1] ?? "Not set",
		notes: parts[0] ?? location,
		room: parts[2] ?? parts.at(-1) ?? "Not set",
	};
}

const pmDueWindowMs = 30 * 24 * 60 * 60 * 1000;

function getPmDueSoonAssets(assets: Asset[]) {
	const today = new Date();
	const windowEnd = new Date(today.getTime() + pmDueWindowMs);

	return assets
		.filter((asset) => {
			const dueDate = new Date(asset.nextPmDue);

			return (
				!Number.isNaN(dueDate.getTime()) &&
				dueDate >= today &&
				dueDate <= windowEnd
			);
		})
		.sort((first, second) => first.nextPmDue.localeCompare(second.nextPmDue))
		.slice(0, 4);
}

function getHospitalAddressSummary(hospital: Hospital) {
	const parts = [
		hospital.district,
		hospital.regionProvince,
		hospital.address,
	].filter((part): part is string => Boolean(part?.trim()));

	return parts.length > 0 ? parts.join(" · ") : hospital.code;
}

function ContractsView({
	canWrite,
	contracts,
	isRefreshing,
	onCreate,
	onEdit,
	onRefreshStatuses,
	tenantId,
}: {
	canWrite: boolean;
	contracts: ServiceOpsSnapshot["contracts"];
	isRefreshing: boolean;
	onCreate: () => void;
	onEdit: (contract: ServiceOpsSnapshot["contracts"][number]) => void;
	onRefreshStatuses: () => void;
	tenantId: string;
}) {
	return (
		<PageFrame
			action={
				canWrite ? (
					<div className="flex gap-2">
						<Button
							className={actionButtonClass}
							disabled={isRefreshing}
							onClick={onRefreshStatuses}
							variant="outline"
						>
							{isRefreshing ? (
								<Loader2Icon className="size-4 animate-spin" />
							) : null}
							Refresh status
						</Button>
						<Button className={primaryActionClass} onClick={onCreate}>
							<PlusIcon className="size-4" />
							New contract
						</Button>
					</div>
				) : null
			}
			description="Track coverage terms, expiry risk, SLA targets, and model entitlement per hospital."
			eyebrow="C. Contract Management"
			hideHeader
			title="Coverage and expiry controls"
			width="full"
		>
			<DataTable
				columns={[
					"Hospital",
					"Contract",
					"Type",
					"Status",
					"SLA",
					"Start",
					"Expiry",
					"Covered models",
					"Covered parts",
				]}
				description="Contract coverage terms, expiry risk, SLA targets, and model entitlement per hospital."
				filterLabels={["Status", "Type", "Hospital"]}
				rows={contracts.map((contract) => ({
					cells: [
						<span className="font-medium" key={`${contract.id}-hospital`}>
							{contract.hospital}
						</span>,
						contract.id,
						contract.type,
						<StatusPill
							className={contractStatusStyles[contract.status]}
							key={`${contract.id}-status`}
						>
							{contract.status}
						</StatusPill>,
						`${contract.slaHours}h response`,
						contract.startDate,
						contract.expiry,
						contract.coveredModels.join(", ") || "No models configured",
						contract.coveredParts.join(", ") || "No parts configured",
					],
					actions: (
						<RowActions
							canWrite={canWrite}
							entity="contract"
							id={contract.recordId}
							onEdit={() => onEdit(contract)}
							tenantId={tenantId}
						/>
					),
					id: contract.id,
				}))}
				title={`${contracts.length} Contracts`}
			/>
		</PageFrame>
	);
}

function MapView({
	canWrite,
	engineers,
	hospitals,
	liveAlerts,
	mutations,
	systemParameters,
	tenantId,
}: {
	canWrite: boolean;
	engineers: ServiceOpsSnapshot["engineers"];
	hospitals: ServiceOpsSnapshot["hospitals"];
	liveAlerts: ServiceOpsSnapshot["liveAlerts"];
	mutations: ActionMutations;
	systemParameters: ServiceOpsSnapshot["systemParameters"];
	tenantId: string;
}) {
	const hasLiveAlerts = liveAlerts.length > 0;
	const mapsKey = systemParameters.find(
		(parameter) => parameter.id === "google_maps_api_key"
	);
	const hasGoogleMapsKey = Boolean(String(mapsKey?.valueRaw ?? "").trim());
	const positionedHospitals = hospitals.filter(
		(hospital) => hospital.lat !== 0 || hospital.lng !== 0
	);
	const positionedEngineers = engineers.filter(
		(engineer) => engineer.lat !== null && engineer.lng !== null
	);

	return (
		<PageFrame
			description="Monitor hospital pins, engineer positions, and geofence or SLA alerts in one operational map."
			eyebrow="F. Location Operations"
			title="Live map and geofence alerts"
			width="full"
		>
			<div className="grid gap-4 xl:grid-cols-[1fr_360px]">
				<div className="relative min-h-[560px] overflow-hidden rounded-xl border border-border/60 bg-muted/30">
					<div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,.22)_1px,transparent_1px),linear-gradient(rgba(148,163,184,.22)_1px,transparent_1px)] bg-[size:44px_44px]" />
					<div className="absolute inset-0 bg-gradient-to-br from-background/75 via-transparent to-muted/30" />
					{positionedHospitals.slice(0, 8).map((hospital) => (
						<div
							className="absolute"
							key={hospital.id}
							style={coordinateStyle(hospital.lat, hospital.lng)}
						>
							<MapPin label={hospital.name} status={hospital.contractStatus} />
						</div>
					))}
					{positionedEngineers.slice(0, 8).map((engineer) => (
						<div
							className="absolute"
							key={engineer.id}
							style={coordinateStyle(engineer.lat ?? 0, engineer.lng ?? 0)}
						>
							<EngineerDot engineer={engineer.name} status={engineer.status} />
						</div>
					))}
					<div className="absolute right-4 bottom-4 rounded-lg bg-card/95 p-3 text-xs shadow-xs ring-1 ring-foreground/10 backdrop-blur">
						<p className="font-medium">
							{hasGoogleMapsKey ? "Google Maps configured" : "Map key missing"}
						</p>
						<p className="mt-1 text-muted-foreground">
							Coordinates are plotted from tenant hospital records and latest
							engineer GPS pings.
						</p>
					</div>
					{hospitals.length === 0 && engineers.length === 0 ? (
						<div className="absolute inset-x-4 top-1/2 -translate-y-1/2">
							<EmptyInline message="Create hospitals or engineers to populate the map." />
						</div>
					) : null}
				</div>
				<div className="flex flex-col gap-3">
					{hasLiveAlerts ? (
						liveAlerts.map((alert) => {
							const Icon = alertIconByType[alert.type];

							return (
								<Card className={panelClass} key={alert.id}>
									<CardContent className="flex gap-3 pt-4">
										<span className={iconTileClass}>
											<Icon className="size-4" />
										</span>
										<div className="flex-1">
											<p className="font-medium text-sm">{alert.title}</p>
											<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
												{alert.message}
											</p>
											{alert.type === "pm" && alert.actionId ? (
												<Button
													className="mt-3 rounded-lg"
													disabled={
														!(
															canWrite &&
															!mutations.approvePmOpportunity.isPending
														)
													}
													onClick={() =>
														mutations.approvePmOpportunity.mutate({
															data: {},
															id: alert.actionId ?? "",
															tenantId,
														})
													}
													size="sm"
													type="button"
													variant="outline"
												>
													<CheckCircle2Icon className="size-4" />
													Allocate now
												</Button>
											) : null}
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

function EngineersView({
	canWrite,
	engineers,
	jobs,
	onCreate,
	onEdit,
	onOpenJob,
	tenantId,
}: {
	canWrite: boolean;
	engineers: ServiceOpsSnapshot["engineers"];
	jobs: ServiceOpsSnapshot["jobs"];
	onCreate: () => void;
	onEdit: (engineer: ServiceOpsSnapshot["engineers"][number]) => void;
	onOpenJob: (jobId: string) => void;
	tenantId: string;
}) {
	const [selectedEngineerId, setSelectedEngineerId] = useState("");
	const selectedEngineer =
		engineers.find((engineer) => engineer.id === selectedEngineerId) ?? null;

	useEffect(() => {
		if (
			!selectedEngineerId ||
			engineers.some((engineer) => engineer.id === selectedEngineerId)
		) {
			return;
		}

		setSelectedEngineerId("");
	}, [engineers, selectedEngineerId]);

	if (selectedEngineer) {
		return (
			<EngineerDetailView
				canWrite={canWrite}
				engineer={selectedEngineer}
				jobs={jobs.filter((job) => job.engineerId === selectedEngineer.id)}
				onBack={() => setSelectedEngineerId("")}
				onEdit={() => onEdit(selectedEngineer)}
				onOpenJob={onOpenJob}
				tenantId={tenantId}
			/>
		);
	}

	return (
		<PageFrame
			action={
				canWrite ? (
					<Button className={primaryActionClass} onClick={onCreate}>
						<PlusIcon className="size-4" />
						New engineer
					</Button>
				) : null
			}
			description="Engineer profiles with live status, service region, and billing rate configuration."
			eyebrow="F-01 Engineer Management"
			hideHeader
			title="Engineer profiles and rates"
			width="full"
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
					detailAriaLabel: `View ${engineer.name} details`,
					cells: [
						<button
							className="font-medium text-primary hover:underline"
							key={`${engineer.id}-name`}
							onClick={() => setSelectedEngineerId(engineer.id)}
							type="button"
						>
							{engineer.name}
						</button>,
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
						<div className="inline-flex items-center justify-end gap-1">
							<Button
								aria-label={`View ${engineer.name} details`}
								className={compactButtonClass}
								onClick={() => setSelectedEngineerId(engineer.id)}
								size="icon-sm"
								type="button"
								variant="ghost"
							>
								<EyeIcon className="size-4" />
							</Button>
							<RowActions
								canWrite={canWrite}
								entity="engineer"
								id={engineer.id}
								onEdit={() => onEdit(engineer)}
								tenantId={tenantId}
							/>
						</div>
					),
					id: engineer.id,
					onClick: () => setSelectedEngineerId(engineer.id),
				}))}
				title={`${engineers.length} Engineers`}
			/>
		</PageFrame>
	);
}

function EngineerDetailView({
	canWrite,
	engineer,
	jobs,
	onBack,
	onEdit,
	onOpenJob,
	tenantId,
}: {
	canWrite: boolean;
	engineer: ServiceOpsSnapshot["engineers"][number];
	jobs: ServiceOpsSnapshot["jobs"];
	onBack: () => void;
	onEdit: () => void;
	onOpenJob: (jobId: string) => void;
	tenantId: string;
}) {
	const stats = getEngineerJobStats(jobs);
	const breakdown = getEngineerJobBreakdown(jobs);
	const recentJobs = [...jobs]
		.sort((first, second) => second.id.localeCompare(first.id))
		.slice(0, 4);
	const hasLocation = engineer.lat !== null && engineer.lng !== null;
	const engineerName = formatProperName(engineer.name);
	const engineerRegion = formatProperName(engineer.region);

	return (
		<PageFrame
			description="Engineer job history, contact profile, and current location signal."
			eyebrow="F-01 Engineer Management"
			hideHeader
			title={`${engineerName} detail`}
			width="full"
		>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-3">
					<button
						className="inline-flex w-fit items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
						onClick={onBack}
						type="button"
					>
						<ArrowLeftIcon className="size-4" />
						Back
					</button>
					<div className="text-muted-foreground text-sm">
						<button
							className="font-medium transition-colors hover:text-foreground"
							onClick={onBack}
							type="button"
						>
							Engineers
						</button>
						<span className="mx-2">/</span>
						<span className="font-medium text-foreground">{engineerName}</span>
					</div>
				</div>
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="min-w-0">
						<h2 className="truncate font-semibold text-3xl tracking-tight">
							{engineerName}
						</h2>
						<p className="mt-1 text-muted-foreground">{engineer.grade}</p>
					</div>
					<div className="flex shrink-0 flex-wrap items-center gap-3">
						<StatusPill className={engineerStatusPillStyles[engineer.status]}>
							{engineer.status}
						</StatusPill>
						<RowActions
							canWrite={canWrite}
							entity="engineer"
							id={engineer.id}
							onEdit={onEdit}
							tenantId={tenantId}
						/>
					</div>
				</div>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<EngineerStatCard
						className={getMetricValueClass(stats.total)}
						label="Total Jobs"
						value={stats.total}
					/>
					<EngineerStatCard
						className={getMetricValueClass(stats.completed, "text-emerald-700")}
						label="Completed"
						value={stats.completed}
					/>
					<EngineerStatCard
						className={getMetricValueClass(stats.cancelled, "text-destructive")}
						label="Cancelled"
						value={stats.cancelled}
					/>
					<EngineerStatCard
						className={getMetricValueClass(stats.averageMinutes)}
						label="Avg Duration"
						value={formatDuration(stats.averageMinutes)}
					/>
				</div>
				<div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
					<Card className={panelClass}>
						<CardHeader>
							<CardTitle>Recent Jobs</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							{recentJobs.length > 0 ? (
								recentJobs.map((job) => (
									<div className={`${mutedPanelClass} p-4`} key={job.recordId}>
										<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
											<div className="min-w-0">
												<p className="truncate font-semibold text-base">
													{job.description}
												</p>
												<p className="mt-1 truncate text-muted-foreground text-sm">
													{job.typeValue} · {job.hospital} · {job.asset}
												</p>
											</div>
											<div className="flex shrink-0 items-center gap-3">
												<StatusPill className={statusStyles[job.status]}>
													{job.status}
												</StatusPill>
												<button
													className="inline-flex items-center gap-1 font-medium text-primary text-sm hover:underline"
													onClick={() => onOpenJob(job.id)}
													type="button"
												>
													View
													<ArrowUpRightIcon className="size-3.5" />
												</button>
											</div>
										</div>
									</div>
								))
							) : (
								<EmptyInline message="No jobs assigned to this engineer yet." />
							)}
						</CardContent>
					</Card>
					<div className="flex flex-col gap-6">
						<Card className={panelClass}>
							<CardHeader>
								<CardTitle>Contact</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<ContactInfoRow
									label="Email"
									value={engineer.email ?? "Not set"}
								/>
								<ContactInfoRow
									label="Phone"
									value={engineer.phone ?? "Not set"}
								/>
								<ContactInfoRow label="Region" value={engineerRegion} />
							</CardContent>
						</Card>
						<Card className={panelClass}>
							<CardHeader>
								<CardTitle>GPS Location</CardTitle>
							</CardHeader>
							<CardContent>
								{hasLocation ? (
									<div className="flex flex-col gap-3">
										<HospitalLocationCell
											address={engineer.locationRecordedAt}
											lat={engineer.lat ?? 0}
											lng={engineer.lng ?? 0}
										/>
										<p className="text-muted-foreground text-xs">
											Updated {engineer.locationRecordedAt ?? "recently"}
										</p>
									</div>
								) : (
									<div className="flex items-center gap-3 text-muted-foreground">
										<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/40">
											<MapPinOffIcon className="size-4" />
										</span>
										<p className="text-sm">Location not available</p>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
				<Card className={cn(panelClass, "max-w-[820px]")}>
					<CardHeader>
						<CardTitle>Job Breakdown</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-3">
							{breakdown.map((item) => (
								<div
									className={cn(
										"rounded-lg px-4 py-5 text-center",
										item.className
									)}
									key={item.label}
								>
									<p className="font-semibold text-2xl">{item.count}</p>
									<p className="mt-2 text-muted-foreground text-sm">
										{item.label}
									</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</PageFrame>
	);
}

function EngineerStatCard({
	className,
	label,
	value,
}: {
	className?: string;
	label: string;
	value: ReactNode;
}) {
	return (
		<Card className={panelClass}>
			<CardContent className="flex min-h-28 flex-col items-center justify-center gap-3 p-4 text-center">
				<p className={cn("font-bold text-4xl leading-none", className)}>
					{value}
				</p>
				<p className="text-muted-foreground text-sm">{label}</p>
			</CardContent>
		</Card>
	);
}

function ContactInfoRow({ label, value }: { label: string; value: ReactNode }) {
	const { locale } = useI18n();

	return (
		<div>
			<p className="text-muted-foreground text-xs">
				{translateServiceText(locale, label)}
			</p>
			<p className="mt-1 break-words font-medium text-foreground text-sm">
				{localizeServiceNode(value, locale)}
			</p>
		</div>
	);
}

function getMetricValueClass(value: number, activeClassName?: string) {
	return value > 0 ? activeClassName : "text-foreground";
}

function getEngineerJobStats(jobs: Job[]) {
	const total = jobs.length;
	const completedJobs = jobs.filter((job) => job.status === "Completed");
	const cancelled = jobs.filter((job) => job.status === "Cancelled").length;
	const totalCompletedMinutes = completedJobs.reduce(
		(sum, job) => sum + job.timerMinutes,
		0
	);
	const averageMinutes =
		completedJobs.length > 0
			? Math.round(totalCompletedMinutes / completedJobs.length)
			: 0;

	return {
		averageMinutes,
		cancelled,
		completed: completedJobs.length,
		total,
	};
}

function getEngineerJobBreakdown(jobs: Job[]) {
	return [
		{
			className: "bg-violet-50 text-violet-700",
			count: jobs.filter((job) => job.type === "Installation").length,
			label: "Installation",
		},
		{
			className: "bg-amber-50 text-amber-700",
			count: jobs.filter((job) => job.type === "Repair").length,
			label: "Repair",
		},
		{
			className: "bg-sky-50 text-sky-700",
			count: jobs.filter((job) => job.type === "Preventive Maintenance").length,
			label: "Maintenance",
		},
	];
}

function formatDuration(totalMinutes: number) {
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (hours === 0) {
		return `${minutes}m`;
	}

	if (minutes === 0) {
		return `${hours}h`;
	}

	return `${hours}h ${minutes}m`;
}

function PartsView({
	canWrite,
	onCreate,
	onEdit,
	onOpenProduct,
	mutations,
	parts,
	products,
	shortages,
	tenantId,
}: {
	canWrite: boolean;
	mutations: ActionMutations;
	onCreate: () => void;
	onEdit: (part: ServiceOpsSnapshot["parts"][number]) => void;
	onOpenProduct: (productId: string) => void;
	parts: ServiceOpsSnapshot["parts"];
	products: ServiceOpsSnapshot["products"];
	shortages: ServiceOpsSnapshot["shortages"];
	tenantId: string;
}) {
	const [selectedPartId, setSelectedPartId] = useState("");
	const selectedPart =
		parts.find((part) => part.recordId === selectedPartId) ?? null;

	useEffect(() => {
		if (
			!selectedPartId ||
			parts.some((part) => part.recordId === selectedPartId)
		) {
			return;
		}

		setSelectedPartId("");
	}, [parts, selectedPartId]);

	if (selectedPart) {
		return (
			<PartDetailView
				canWrite={canWrite}
				mutations={mutations}
				onBack={() => setSelectedPartId("")}
				onEdit={() => onEdit(selectedPart)}
				onOpenProduct={onOpenProduct}
				part={selectedPart}
				products={products.filter((product) =>
					product.partIds.includes(selectedPart.recordId)
				)}
				shortages={shortages.filter(
					(shortage) => shortage.partId === selectedPart.recordId
				)}
				tenantId={tenantId}
			/>
		);
	}

	return (
		<PageFrame
			action={
				canWrite ? (
					<Button className={primaryActionClass} onClick={onCreate}>
						<PlusIcon className="size-4" />
						New part
					</Button>
				) : null
			}
			description="Parts stock levels, minimum thresholds, supplier records, and shortage handoffs."
			eyebrow="H. Parts & Inventory"
			hideHeader
			title="Inventory and shortage queue"
			width="full"
		>
			<DataTable
				columnAlignments={{
					Stock: "right",
					"Unit cost (HKD)": "right",
				}}
				columns={[
					"Part",
					"Name",
					"Supplier",
					"Stock",
					"Stock status",
					"Unit cost (HKD)",
				]}
				description="Parts stock levels, minimum thresholds, supplier records, and unit cost controls."
				filterLabels={["Stock status", "Supplier"]}
				hideTitleCount
				rows={parts.map((part) => {
					const stockStatus = getPartStockStatus(part);

					return {
						detailAriaLabel: `View ${part.name} details`,
						cells: [
							<button
								className="font-medium text-primary hover:underline"
								key={`${part.id}-label`}
								onClick={() => setSelectedPartId(part.recordId)}
								type="button"
							>
								{part.id}
							</button>,
							part.name,
							part.supplier,
							<PartStockSummary key={`${part.id}-stock`} part={part} />,
							<StatusPill
								className={stockStatus.className}
								key={`${part.id}-stock-status`}
							>
								{stockStatus.label}
							</StatusPill>,
							<PartUnitCost
								key={`${part.id}-unit-cost`}
								value={part.unitCost}
							/>,
						],
						actions: (
							<div className="inline-flex items-center justify-end gap-4">
								<Button
									aria-label={`View ${part.name} details`}
									className={compactButtonClass}
									onClick={() => setSelectedPartId(part.recordId)}
									size="icon-sm"
									type="button"
									variant="ghost"
								>
									<EyeIcon className="size-4" />
								</Button>
								<RowActions
									canWrite={canWrite}
									entity="part"
									id={part.recordId}
									onEdit={() => onEdit(part)}
									tenantId={tenantId}
								/>
							</div>
						),
						columnValues: {
							"Stock status": stockStatus.label,
							"Unit cost (HKD)": currencyValueFormatter.format(part.unitCost),
						},
						id: part.id,
						onClick: () => setSelectedPartId(part.recordId),
					};
				})}
				title={`${parts.length} Parts`}
			/>
		</PageFrame>
	);
}

function getPartStockStatus(part: Part) {
	const isLow = part.stock < part.minimum;

	if (isLow) {
		return {
			className: "border-rose-300 bg-rose-50 text-rose-700",
			isLow,
			label: "Low stock",
		};
	}

	return {
		className: "border-emerald-200 bg-emerald-50 text-emerald-700",
		isLow,
		label: "In stock",
	};
}

function PartStockSummary({ part }: { part: Part }) {
	const isLowStock = part.stock < part.minimum;
	const fillPercentage =
		part.minimum > 0 ? Math.min((part.stock / part.minimum) * 100, 100) : 100;
	const progressColorClass = isLowStock ? "bg-rose-500" : "bg-emerald-500";

	return (
		<div className="ml-auto flex w-24 flex-col items-end gap-1.5">
			<div className="flex items-baseline gap-1.5 text-right tabular-nums">
				<span
					className={cn(
						"font-semibold text-sm",
						isLowStock ? "text-rose-600" : "text-foreground"
					)}
				>
					{part.stock}
				</span>
				<span className="text-muted-foreground text-xs">
					min {part.minimum}
				</span>
			</div>
			<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
				<div
					className={cn("h-full rounded-full", progressColorClass)}
					style={{ width: `${fillPercentage}%` }}
				/>
			</div>
		</div>
	);
}

function PartUnitCost({ value }: { value: number }) {
	return (
		<span className="block text-right font-medium tabular-nums">
			{currencyValueFormatter.format(value)}
		</span>
	);
}

function PartDetailView({
	canWrite,
	mutations,
	onBack,
	onEdit,
	onOpenProduct,
	part,
	products,
	shortages,
	tenantId,
}: {
	canWrite: boolean;
	mutations: ActionMutations;
	onBack: () => void;
	onEdit: () => void;
	onOpenProduct: (productId: string) => void;
	part: Part;
	products: ProductModel[];
	shortages: ServiceOpsSnapshot["shortages"];
	tenantId: string;
}) {
	const stockStatus = getPartStockStatus(part);

	return (
		<PageFrame
			description="Part detail, product usage, stock adjustment, and shortage records."
			eyebrow="H. Parts & Inventory"
			hideHeader
			title={`${part.name} detail`}
			width="full"
		>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-4">
					<div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
						<button
							aria-label="Back to Parts & Stock"
							className="inline-flex size-7 items-center justify-center rounded-md transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
							onClick={onBack}
							type="button"
						>
							<ArrowLeftIcon className="size-4" />
						</button>
						<button
							className="font-medium transition-colors hover:text-foreground"
							onClick={onBack}
							type="button"
						>
							Parts & Stock
						</button>
						<span aria-hidden="true">/</span>
						<span className="font-medium text-foreground">{part.id}</span>
					</div>
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div className="min-w-0">
							<div className="flex min-w-0 flex-wrap items-center gap-3">
								<h2 className="truncate font-semibold text-3xl tracking-tight">
									{part.id}
								</h2>
								<StatusPill className={stockStatus.className}>
									{stockStatus.label}
								</StatusPill>
							</div>
							{part.name === part.id ? null : (
								<p className="mt-1 text-muted-foreground">{part.name}</p>
							)}
						</div>
						<div className="flex shrink-0 flex-wrap items-center gap-2">
							<RowActions
								canWrite={canWrite}
								entity="part"
								id={part.recordId}
								onEdit={onEdit}
								tenantId={tenantId}
							/>
						</div>
					</div>
				</div>
				<div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
					<div className="flex min-w-0 flex-col gap-6">
						<PartDetailsCard part={part} />
						<PartStockAdjustmentCard
							canWrite={canWrite}
							mutations={mutations}
							part={part}
							tenantId={tenantId}
						/>
						<PartUsageHistoryCard shortages={shortages} />
					</div>
					<PartProductsCard onOpenProduct={onOpenProduct} products={products} />
				</div>
			</div>
		</PageFrame>
	);
}

function PartDetailsCard({ part }: { part: Part }) {
	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Part Details</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-5 sm:grid-cols-2">
				<PartDetailField
					label="Unit cost"
					value={hongKongDollarFormatter.format(part.unitCost)}
				/>
				<PartDetailField label="Supplier" value={part.supplier || "Not set"} />
				<PartDetailField label="Stock quantity" value={`${part.stock} units`} />
				<PartDetailField
					label="Reorder threshold"
					value={`${part.minimum} units`}
				/>
				<PartDetailField
					className="sm:col-span-2"
					label="Description"
					value={part.description ?? part.name}
				/>
			</CardContent>
		</Card>
	);
}

function PartDetailField({
	className,
	label,
	value,
}: {
	className?: string;
	label: string;
	value: ReactNode;
}) {
	const { locale } = useI18n();

	return (
		<div className={className}>
			<p className="text-muted-foreground text-sm">
				{translateServiceText(locale, label)}
			</p>
			<p className="mt-1 break-words font-medium text-base">
				{localizeServiceNode(value, locale)}
			</p>
		</div>
	);
}

function PartProductsCard({
	onOpenProduct,
	products,
}: {
	onOpenProduct: (productId: string) => void;
	products: ProductModel[];
}) {
	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Used In Products</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{products.length > 0 ? (
					products.map((product) => (
						<button
							className="rounded-lg border border-border/60 bg-muted/25 p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
							key={product.id}
							onClick={() => onOpenProduct(product.id)}
							type="button"
						>
							<p className="font-semibold text-base">{product.modelName}</p>
							<p className="mt-1 text-muted-foreground text-xs">
								{product.code}
							</p>
							<p className="mt-2 font-medium text-muted-foreground text-sm">
								{product.category}
							</p>
						</button>
					))
				) : (
					<EmptyInline message="No products use this part yet." />
				)}
			</CardContent>
		</Card>
	);
}

function PartStockAdjustmentCard({
	canWrite,
	mutations,
	part,
	tenantId,
}: {
	canWrite: boolean;
	mutations: ActionMutations;
	part: Part;
	tenantId: string;
}) {
	const [deltaValue, setDeltaValue] = useState("");
	const [reason, setReason] = useState("");
	const normalizedDeltaValue = deltaValue.trim();
	const delta = Number(normalizedDeltaValue);
	const hasDeltaValue = normalizedDeltaValue.length > 0;
	const isValidDelta = hasDeltaValue && Number.isInteger(delta);
	const nextStock = isValidDelta ? part.stock + delta : part.stock;
	const canSubmit =
		canWrite &&
		isValidDelta &&
		delta !== 0 &&
		nextStock >= 0 &&
		!mutations.updatePartStock.isPending;

	const updateStock = () => {
		if (!canSubmit) {
			return;
		}

		mutations.updatePartStock.mutate({
			data: buildPartStockAdjustmentPayload(part, nextStock),
			id: part.recordId,
			tenantId,
		});
		setDeltaValue("");
		setReason("");
	};

	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Stock Adjustment</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-end">
					<div className={formFieldClass}>
						<Label
							className={formLabelClass}
							htmlFor={`${part.recordId}-delta`}
						>
							Delta (+ for arrival, - for reduction)
						</Label>
						<Input
							className={formControlClass}
							disabled={!canWrite}
							id={`${part.recordId}-delta`}
							onChange={(event) => setDeltaValue(event.target.value)}
							placeholder="0"
							type="number"
							value={deltaValue}
						/>
					</div>
					<div className={formFieldClass}>
						<Label
							className={formLabelClass}
							htmlFor={`${part.recordId}-reason`}
						>
							Reason (optional)
						</Label>
						<Input
							className={formControlClass}
							disabled={!canWrite}
							id={`${part.recordId}-reason`}
							onChange={(event) => setReason(event.target.value)}
							placeholder="e.g. Stock delivery from supplier"
							value={reason}
						/>
					</div>
					<Button
						className={cn(primaryActionClass, "h-10")}
						disabled={!canSubmit}
						onClick={updateStock}
						type="button"
					>
						{mutations.updatePartStock.isPending ? (
							<Loader2Icon className="size-4 animate-spin" />
						) : null}
						Update Stock
					</Button>
				</div>
				<p className="text-muted-foreground text-sm">
					Current: {part.stock} {"->"} New: {nextStock}
					{reason.trim() ? ` · ${reason.trim()}` : ""}
				</p>
			</CardContent>
		</Card>
	);
}

function PartUsageHistoryCard({
	shortages,
}: {
	shortages: ServiceOpsSnapshot["shortages"];
}) {
	const totalUsageRecords = shortages.length;

	return (
		<Card className={panelClass}>
			<CardHeader className="flex-row items-start justify-between gap-3">
				<CardTitle>Usage History</CardTitle>
				<p className="text-muted-foreground text-sm">
					{totalUsageRecords} recent record
					{totalUsageRecords === 1 ? "" : "s"}
				</p>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{shortages.length > 0 ? (
					shortages.map((shortage) => (
						<div className={`${mutedPanelClass} p-3 text-sm`} key={shortage.id}>
							<div className="flex items-center justify-between gap-3">
								<p className="font-medium">{shortage.job}</p>
								<StatusPill className="border-amber-200 bg-amber-50 text-amber-700">
									{shortage.status}
								</StatusPill>
							</div>
							<p className="mt-1 text-muted-foreground">
								Requested by {shortage.engineer}
							</p>
						</div>
					))
				) : (
					<div className="flex min-h-28 flex-col items-center justify-center gap-3 py-6 text-center">
						<span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
							<FileTextIcon className="size-5" />
						</span>
						<p className="text-muted-foreground text-sm">
							No usage records found.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function buildPartStockAdjustmentPayload(part: Part, stockOnHand: number) {
	return {
		description: part.description,
		minimumStock: part.minimum,
		name: part.name,
		partNumber: part.id,
		productModelIds: part.productModelIds,
		stockOnHand,
		supplier: part.supplier,
		unitCost: part.unitCost,
	};
}

function ReportsView({
	costRecords,
	onGenerateReport,
	reportMetrics,
}: {
	costRecords: ServiceOpsSnapshot["costRecords"];
	onGenerateReport: (period: "day" | "month" | "week") => void;
	reportMetrics: ServiceOpsSnapshot["reportMetrics"];
}) {
	return (
		<PageFrame
			action={
				<div className="flex gap-2">
					<Button
						className={actionButtonClass}
						onClick={() => onGenerateReport("day")}
						type="button"
						variant="outline"
					>
						Day
					</Button>
					<Button
						className={actionButtonClass}
						onClick={() => onGenerateReport("week")}
						type="button"
						variant="outline"
					>
						Week
					</Button>
					<Button
						className={actionButtonClass}
						onClick={() => onGenerateReport("month")}
						type="button"
						variant="outline"
					>
						Month
					</Button>
				</div>
			}
			eyebrow="I. Reports"
			hideHeader
			title="Reports"
			width="full"
		>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{reportMetrics.length > 0 ? (
					reportMetrics.map((metric) => (
						<Card className={panelClass} key={metric.id}>
							<CardContent className="pt-0">
								<p className="text-muted-foreground text-xs">{metric.label}</p>
								<p className="mt-2 font-medium text-3xl tracking-tight">
									{metric.value}
								</p>
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
			<div>
				<DataTable
					columns={[
						"Job",
						"Labour",
						"Mileage",
						"Meals",
						"Parts absorbed",
						"Parts billable",
					]}
					description={null}
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
	canWrite,
	mutations,
	systemParameters,
	tenantId,
}: {
	canWrite: boolean;
	mutations: ActionMutations;
	systemParameters: ServiceOpsSnapshot["systemParameters"];
	tenantId: string;
}) {
	const { locale, t } = useI18n();
	const initialValues = useMemo(
		() => getSystemParameterValues(systemParameters),
		[systemParameters]
	);
	const [draftValues, setDraftValues] = useState(initialValues);
	const previousInitialValuesRef = useRef(initialValues);
	const changedParameters = systemParameters.filter(
		(parameter) => draftValues[parameter.id] !== initialValues[parameter.id]
	);
	const hasChanges = changedParameters.length > 0;
	const isSaving = mutations.updateSystemParameter.isPending;

	useEffect(() => {
		setDraftValues((currentValues) => {
			const previousInitialValues = previousInitialValuesRef.current;
			const hasLocalChanges = hasSystemParameterChanges(
				currentValues,
				previousInitialValues
			);

			previousInitialValuesRef.current = initialValues;

			return hasLocalChanges ? currentValues : initialValues;
		});
	}, [initialValues]);

	const updateDraftValue = (key: string, value: string) => {
		setDraftValues((currentValues) => ({ ...currentValues, [key]: value }));
	};

	const resetDraftValues = () => {
		setDraftValues(initialValues);
	};

	const saveChanges = async () => {
		if (!hasChanges) {
			return;
		}

		try {
			await Promise.all(
				changedParameters.map((parameter) =>
					mutations.updateSystemParameter.mutateAsync({
						data: {
							key: parameter.id,
							value: parseSystemParameterValue(
								draftValues[parameter.id] ?? "",
								parameter.valueType
							),
							valueType: parameter.valueType,
						},
						tenantId,
					})
				)
			);
			toast.success(t("service.toast.systemSaved"));
		} catch {
			toast.error(t("service.toast.systemSaveFailed"));
		}
	};

	const saveActions = canWrite ? (
		<div className="flex shrink-0 items-center gap-2">
			<Button
				className={compactButtonClass}
				disabled={!hasChanges || isSaving}
				onClick={resetDraftValues}
				type="button"
				variant="outline"
			>
				{t("common.cancel")}
			</Button>
			<Button
				className={primaryActionClass}
				disabled={!hasChanges || isSaving}
				onClick={saveChanges}
				type="button"
			>
				{isSaving ? <Loader2Icon className="size-4 animate-spin" /> : null}
				{t("common.saveChanges")}
			</Button>
		</div>
	) : null;

	return (
		<div className="flex w-full min-w-0 flex-col gap-4 md:gap-6">
			{saveActions ? (
				<div className="flex justify-end">{saveActions}</div>
			) : null}
			<div className="grid gap-4 lg:grid-cols-[1fr_380px]">
				<Card className={panelClass}>
					<CardHeader>
						<CardTitle>
							{translateServiceText(locale, "System parameters")}
						</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-x-4 gap-y-5 md:grid-cols-2">
						{systemParameters.length > 0 ? (
							systemParameters.map((parameter) => (
								<SystemParameterEditor
									canWrite={canWrite}
									key={parameter.id}
									onChange={updateDraftValue}
									parameter={parameter}
									value={draftValues[parameter.id] ?? ""}
								/>
							))
						) : (
							<div className="md:col-span-2">
								<EmptyInline message={t("service.empty.noSystemParameters")} />
							</div>
						)}
					</CardContent>
				</Card>
				<Card className={panelClass}>
					<CardHeader>
						<CardTitle>{translateServiceText(locale, "User roles")}</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-3 text-sm">
						{roleLabels.map((role) => (
							<div
								className="flex items-start justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0"
								key={role}
							>
								<div className="min-w-0">
									<p className="font-medium text-foreground">
										{translateServiceText(locale, roleDisplayNames[role])}
									</p>
									<p className="mt-1 text-muted-foreground text-xs">
										{translateServiceText(locale, roleDescriptions[role])}
									</p>
								</div>
								<span
									className={cn(
										"shrink-0 rounded-full border px-2 py-0.5 font-medium text-xs",
										roleBadgeStyles[role]
									)}
								>
									{role === "super_admin"
										? t("common.system")
										: t("common.tenant")}
								</span>
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function SystemParameterEditor({
	canWrite,
	onChange,
	parameter,
	value,
}: {
	canWrite: boolean;
	onChange: (key: string, value: string) => void;
	parameter: SystemParameter;
	value: string;
}) {
	const suffix = getSystemParameterSuffix(parameter.id);

	return (
		<div className="flex min-w-0 flex-col gap-1.5">
			<Label className={formLabelClass} htmlFor={`parameter-${parameter.id}`}>
				{parameter.label}
			</Label>
			{canWrite ? (
				<div className="relative">
					<Input
						aria-label={`Edit ${parameter.label}`}
						className={cn(formControlClass, suffix ? "pr-20" : "")}
						id={`parameter-${parameter.id}`}
						onChange={(event) => onChange(parameter.id, event.target.value)}
						placeholder={
							parameter.valueType === "secret" ? "Not configured" : undefined
						}
						type={parameter.valueType === "number" ? "number" : "text"}
						value={value}
					/>
					{suffix ? (
						<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground text-xs">
							{suffix}
						</span>
					) : null}
				</div>
			) : (
				<div className="flex h-9 items-center rounded-lg border border-input bg-muted/25 px-3 text-sm">
					<span className="truncate">
						{parameter.value || "Not configured"}
					</span>
				</div>
			)}
		</div>
	);
}

function getSystemParameterValues(
	parameters: ServiceOpsSnapshot["systemParameters"]
) {
	return Object.fromEntries(
		parameters.map((parameter) => [
			parameter.id,
			String(parameter.valueRaw ?? ""),
		])
	);
}

function hasSystemParameterChanges(
	currentValues: Record<string, string>,
	initialValues: Record<string, string>
) {
	const keys = new Set([
		...Object.keys(currentValues),
		...Object.keys(initialValues),
	]);

	for (const key of keys) {
		if (currentValues[key] !== initialValues[key]) {
			return true;
		}
	}

	return false;
}

function parseSystemParameterValue(
	value: string,
	valueType: SystemParameter["valueType"]
) {
	if (valueType === "number") {
		return Number(value);
	}

	if (valueType === "boolean") {
		return value === "true";
	}

	return value;
}

function getSystemParameterSuffix(key: string) {
	if (key.includes("mileage_rate")) {
		return "HKD / km";
	}

	if (key.includes("meal_cap")) {
		return "HKD / day";
	}

	if (key.includes("radius")) {
		return "m";
	}

	if (key.includes("minutes")) {
		return "min";
	}

	if (key.includes("days")) {
		return "days";
	}

	return "";
}

function TenantsView({
	canManageTenants,
	currentTenantId,
	onCreate,
	onEdit,
	tenants,
}: {
	canManageTenants: boolean;
	currentTenantId: string;
	onCreate: () => void;
	onEdit: (tenantRecord: ServiceOpsSnapshot["tenants"][number]) => void;
	tenants: ServiceOpsSnapshot["tenants"];
}) {
	return (
		<PageFrame
			action={
				canManageTenants ? (
					<Button className={primaryActionClass} onClick={onCreate}>
						<PlusIcon className="size-4" />
						New tenant
					</Button>
				) : null
			}
			description="Manage SaaS workspaces that isolate data, users, configuration, and service operations."
			eyebrow="Tenant Administration"
			title="Tenant management"
			width="full"
		>
			<DataTable
				columns={[
					"Tenant",
					"Region",
					"Release",
					"Role",
					"Status",
					"Members",
					"Created",
				]}
				description="SaaS tenants accessible to the current signed-in user."
				filterLabels={["Status", "Region"]}
				rows={tenants.map((tenantRecord) => ({
					cells: [
						<div className="min-w-0" key={`${tenantRecord.id}-name`}>
							<p className="font-medium">{tenantRecord.name}</p>
							<p className="text-muted-foreground text-xs">{tenantRecord.id}</p>
						</div>,
						tenantRecord.region,
						tenantRecord.release,
						tenantRecord.role,
						<StatusPill
							className={
								tenantRecord.isActive
									? "border-emerald-200 bg-emerald-50 text-emerald-700"
									: "border-zinc-200 bg-zinc-50 text-zinc-600"
							}
							key={`${tenantRecord.id}-status`}
						>
							{tenantRecord.isActive ? "Active" : "Inactive"}
						</StatusPill>,
						tenantRecord.memberCount,
						tenantRecord.createdAt,
					],
					actions: (
						<RowActions
							canWrite={canManageTenants}
							deleteDisabled={
								tenantRecord.id === currentTenantId ||
								tenantRecord.id === "platform"
							}
							entity="tenant"
							id={tenantRecord.id}
							onEdit={() => onEdit(tenantRecord)}
							tenantId={tenantRecord.id}
						/>
					),
					id: tenantRecord.id,
					searchText: `${tenantRecord.name} ${tenantRecord.id} ${tenantRecord.region} ${tenantRecord.release}`,
				}))}
				title={`${tenants.length} Tenants`}
			/>
		</PageFrame>
	);
}

function TenantUsersView({
	canManageTenantUsers,
	tenantId,
	users,
}: {
	canManageTenantUsers: boolean;
	tenantId: string;
	users: ServiceOpsSnapshot["users"];
}) {
	const [userDialogState, setUserDialogState] = useState<CrudState | null>(
		null
	);
	const openCreateDialog = () => {
		setUserDialogState({ entity: "tenantUser", mode: "create" });
	};
	const openEditDialog = (tenantUser: ServiceOpsSnapshot["users"][number]) => {
		setUserDialogState({
			entity: "tenantUser",
			mode: "edit",
			record: tenantUser,
		});
	};
	const userSnapshot = {
		access: {
			canManageTenantUsers,
			canManageTenants: false,
			canRead: true,
			canWrite: canManageTenantUsers,
			role: "tenant_admin" as const,
		},
		assets: [],
		contracts: [],
		costRecords: [],
		dashboardStats: [],
		engineers: [],
		faultReports: [],
		hospitals: [],
		jobs: [],
		liveAlerts: [],
		manualAnswers: [],
		parts: [],
		products: [],
		reportMetrics: [],
		shortages: [],
		systemParameters: [],
		tenant: { id: tenantId, name: "", region: "", release: "" },
		tenants: [],
		users,
	} satisfies ServiceOpsSnapshot;

	return (
		<>
			<PageFrame
				action={
					canManageTenantUsers ? (
						<Button className={primaryActionClass} onClick={openCreateDialog}>
							<PlusIcon className="size-4" />
							New user
						</Button>
					) : null
				}
				description="Manage users and tenant-scoped roles for this workspace."
				eyebrow="User Administration"
				title="Users and permissions"
				width="full"
			>
				<DataTable
					columns={["User", "Email", "Role", "Status", "Created"]}
					description="Tenant administrators can manage users within their own tenant. Operators can edit tenant data. Observers are read-only."
					filterLabels={["Role", "Status"]}
					rows={users.map((tenantUser) => ({
						cells: [
							<span className="font-medium" key={`${tenantUser.id}-name`}>
								{tenantUser.name}
							</span>,
							tenantUser.email,
							roleDisplayNames[tenantUser.role],
							<StatusPill
								className={
									tenantUser.status === "active"
										? "border-emerald-200 bg-emerald-50 text-emerald-700"
										: "border-zinc-200 bg-zinc-50 text-zinc-600"
								}
								key={`${tenantUser.id}-status`}
							>
								{tenantUser.status}
							</StatusPill>,
							tenantUser.createdAt,
						],
						actions: (
							<RowActions
								canWrite={canManageTenantUsers}
								deleteDisabled={tenantUser.role === "super_admin"}
								entity="tenantUser"
								id={tenantUser.id}
								onEdit={() => openEditDialog(tenantUser)}
								tenantId={tenantId}
							/>
						),
						id: tenantUser.id,
						searchText: `${tenantUser.name} ${tenantUser.email} ${tenantUser.role} ${tenantUser.status}`,
					}))}
					title={`${users.length} Users`}
				/>
			</PageFrame>
			<CrudDialog
				data={userSnapshot}
				onClose={() => setUserDialogState(null)}
				state={userDialogState}
			/>
		</>
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
	const activeJobs = jobs.filter(
		(job) => job.status !== "Completed" && job.status !== "Cancelled"
	);
	const urgentJobs = activeJobs.filter((job) => job.priority === "Urgent");
	const timelineJobs = jobs.slice(0, 4);
	const completionGoal = Math.max(jobs.length, 1);
	const completedJobs = jobs.filter((job) => job.status === "Completed").length;
	const [activeCategory, setActiveCategory] =
		useState<DashboardCategory>("overview");
	const handleCategoryChange = (category: DashboardCategory) => {
		setActiveCategory(category);

		const dashboardUrl = `${window.location.pathname}${window.location.search}#dashboard`;

		if (window.location.hash !== "#dashboard") {
			window.history.replaceState(
				{ backOfficeView: "dashboard", dashboardCategory: category },
				"",
				dashboardUrl
			);
		}
	};

	return (
		<PageFrame eyebrow="Service Command" hideHeader title="Operations Overview">
			<DashboardCategoryTabs
				activeCategory={activeCategory}
				onCategoryChange={handleCategoryChange}
			/>

			<div className="grid gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-4">
				{dashboardStats.map((stat) => (
					<DashboardStatCard key={stat.id} stat={stat} />
				))}
			</div>

			{activeCategory === "overview" ? (
				<DashboardOverviewPanel
					activeJobsCount={activeJobs.length}
					completedJobs={completedJobs}
					completionGoal={completionGoal}
					jobs={jobs}
					timelineJobs={timelineJobs}
					urgentJobsCount={urgentJobs.length}
				/>
			) : null}
			{activeCategory === "analytics" ? (
				<DashboardAnalyticsPanel
					activeJobsCount={activeJobs.length}
					completedJobs={completedJobs}
					completionGoal={completionGoal}
					jobs={jobs}
					urgentJobsCount={urgentJobs.length}
				/>
			) : null}
			{activeCategory === "reports" ? (
				<DashboardReportsPanel jobs={jobs} />
			) : null}
			{activeCategory === "notifications" ? (
				<DashboardNotificationsPanel
					hasLiveAlerts={hasLiveAlerts}
					liveAlerts={liveAlerts}
					timelineJobs={timelineJobs}
				/>
			) : null}
		</PageFrame>
	);
}

function DashboardCategoryTabs({
	activeCategory,
	onCategoryChange,
}: {
	activeCategory: DashboardCategory;
	onCategoryChange: (category: DashboardCategory) => void;
}) {
	const { locale, t } = useI18n();

	return (
		<div className="max-w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
			<div
				aria-label={t("service.dashboard.category")}
				className="inline-flex rounded-xl bg-muted p-1"
				role="tablist"
			>
				{dashboardCategoryItems.map((item) => {
					const isActive = activeCategory === item.id;

					return (
						<button
							aria-selected={isActive}
							className={cn(
								"h-10 shrink-0 cursor-pointer rounded-lg px-4 font-semibold text-sm transition-colors",
								isActive
									? "bg-background text-foreground shadow-xs ring-1 ring-foreground/10"
									: "text-muted-foreground hover:text-foreground"
							)}
							key={item.id}
							onClick={() => onCategoryChange(item.id)}
							role="tab"
							type="button"
						>
							{translateServiceText(locale, item.label)}
						</button>
					);
				})}
			</div>
		</div>
	);
}

function DashboardOverviewPanel({
	activeJobsCount,
	completedJobs,
	completionGoal,
	jobs,
	timelineJobs,
	urgentJobsCount,
}: {
	activeJobsCount: number;
	completedJobs: number;
	completionGoal: number;
	jobs: Job[];
	timelineJobs: Job[];
	urgentJobsCount: number;
}) {
	return (
		<>
			<DashboardActivityCard
				activeJobsCount={activeJobsCount}
				completedJobs={completedJobs}
				completionGoal={completionGoal}
				jobs={jobs}
				urgentJobsCount={urgentJobsCount}
			/>
			<div className="grid gap-5 xl:grid-cols-12">
				<DashboardScheduleCard
					className="xl:col-span-8"
					timelineJobs={timelineJobs}
				/>
				<DashboardResolutionCard
					className="xl:col-span-4"
					completedJobs={completedJobs}
					completionGoal={completionGoal}
				/>
			</div>
		</>
	);
}

function DashboardAnalyticsPanel({
	activeJobsCount,
	completedJobs,
	completionGoal,
	jobs,
	urgentJobsCount,
}: {
	activeJobsCount: number;
	completedJobs: number;
	completionGoal: number;
	jobs: Job[];
	urgentJobsCount: number;
}) {
	return (
		<div className="grid gap-4 xl:grid-cols-[1fr_360px]">
			<DashboardActivityCard
				activeJobsCount={activeJobsCount}
				completedJobs={completedJobs}
				completionGoal={completionGoal}
				jobs={jobs}
				urgentJobsCount={urgentJobsCount}
			/>
			<div className="flex flex-col gap-4">
				<DashboardResolutionCard
					completedJobs={completedJobs}
					completionGoal={completionGoal}
				/>
				<Card className={panelClass}>
					<CardHeader>
						<CardTitle>Workload Mix</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						<Metric label="Active jobs" value={activeJobsCount} />
						<Metric label="Urgent jobs" value={urgentJobsCount} />
						<Metric label="Closed jobs" value={completedJobs} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function DashboardReportsPanel({ jobs }: { jobs: Job[] }) {
	return (
		<div className="grid gap-4 xl:grid-cols-[1fr_360px]">
			<DataTable
				columns={["Job", "Hospital", "Asset", "Engineer", "Status", "Schedule"]}
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
			<DashboardScopeCard />
		</div>
	);
}

function DashboardNotificationsPanel({
	hasLiveAlerts,
	liveAlerts,
	timelineJobs,
}: {
	hasLiveAlerts: boolean;
	liveAlerts: ServiceOpsSnapshot["liveAlerts"];
	timelineJobs: Job[];
}) {
	return (
		<div className="grid gap-4 xl:grid-cols-[1fr_420px]">
			<DashboardAlertQueueCard
				hasLiveAlerts={hasLiveAlerts}
				liveAlerts={liveAlerts}
			/>
			<DashboardScheduleCard timelineJobs={timelineJobs} />
		</div>
	);
}

function DashboardActivityCard({
	activeJobsCount,
	completedJobs,
	completionGoal,
	jobs,
	urgentJobsCount,
}: {
	activeJobsCount: number;
	completedJobs: number;
	completionGoal: number;
	jobs: Job[];
	urgentJobsCount: number;
}) {
	const { locale, t } = useI18n();

	return (
		<Card className={dashboardFocusPanelClass}>
			<CardHeader className="px-5">
				<CardTitle>Service Activity Flow</CardTitle>
				<CardAction>
					<Button className={compactButtonClass} size="sm" variant="outline">
						<CalendarDaysIcon data-icon="inline-start" />
						{t("common.today")}
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className="px-5">
				<div className="grid gap-5 lg:grid-cols-12">
					<div className="flex min-h-72 items-end gap-4 rounded-lg bg-muted/20 px-4 pt-5 pb-3 lg:col-span-8">
						{buildJobActivityBars(jobs).map((bar) => (
							<div
								className="flex h-full flex-1 flex-col justify-end gap-3"
								key={bar.id}
							>
								<div
									className={cn(
										"rounded-t-lg ring-1 ring-black/5",
										bar.count > 0
											? "bg-[linear-gradient(180deg,var(--color-chart-4),var(--color-chart-2))] shadow-[0_10px_24px_-18px_rgb(0_0_0_/_0.6)]"
											: "bg-muted-foreground/18"
									)}
									style={{ height: `${bar.height}%` }}
									title={`${translateServiceText(locale, bar.label)}: ${bar.count} ${translateServiceText(locale, "jobs")}`}
								/>
								<span className="text-center text-muted-foreground text-xs">
									{translateServiceText(locale, bar.label)}
								</span>
							</div>
						))}
					</div>
					<div className="flex flex-col justify-center gap-5 lg:col-span-4 lg:py-3">
						<div className="flex flex-col gap-3">
							<div className="font-semibold text-3xl tabular-nums leading-none">
								{activeJobsCount}{" "}
								<span className="font-normal text-lg text-muted-foreground">
									{t("service.dashboard.open")}
								</span>
							</div>
							<p className="text-muted-foreground text-sm">
								{t("service.dashboard.activeJobsCopy")}
							</p>
						</div>
						<div className="flex flex-col gap-4 rounded-lg border border-border/60 bg-background/70 p-4">
							<div className="text-[11px] text-muted-foreground uppercase tracking-widest">
								{t("service.dashboard.urgentWorkload")}
							</div>
							<div className="font-medium text-2xl tabular-nums leading-none">
								{urgentJobsCount}{" "}
								<span className="font-normal text-muted-foreground text-sm">
									{t("service.dashboard.urgentJobs")}
								</span>
							</div>
							<SegmentedProgress
								active={urgentJobsCount}
								total={completionGoal}
							/>
							<div className="flex items-center justify-between text-xs">
								<span className="font-medium tabular-nums">
									{t("service.dashboard.completed", { count: completedJobs })}
								</span>
								<span className="text-muted-foreground tabular-nums">
									{t("service.dashboard.total", { count: completionGoal })}
								</span>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function DashboardScheduleCard({
	className,
	timelineJobs,
}: {
	className?: string;
	timelineJobs: Job[];
}) {
	const { locale, t } = useI18n();

	return (
		<Card className={cn(dashboardPanelClass, className)}>
			<CardHeader className="px-5">
				<CardTitle>Upcoming Service Windows</CardTitle>
				<CardAction>
					<Button className={compactButtonClass} size="sm" variant="outline">
						<CalendarDaysIcon data-icon="inline-start" />
						{t("service.dashboard.viewSchedule")}
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className="px-5">
				<div className="flex flex-col gap-3">
					<div className="grid grid-cols-4 gap-2 text-muted-foreground text-xs tabular-nums">
						{timelineJobs.map((job) => (
							<div className="flex flex-col items-center gap-1" key={job.id}>
								<span>
									{translateServiceText(
										locale,
										job.scheduledFor.split(",").at(0) ?? t("common.today")
									)}
								</span>
								<span className="h-2 w-px bg-border" />
							</div>
						))}
					</div>
					<div className="relative min-h-20 overflow-hidden rounded-lg bg-muted/25">
						<div className="absolute inset-x-4 top-1/2 h-px bg-border" />
						{timelineJobs.map((job, index) => (
							<div
								className={cn(
									"absolute top-4 bottom-4 flex min-w-40 items-center rounded-lg px-2 text-xs shadow-sm",
									index === 0
										? "bg-primary text-primary-foreground"
										: "border border-border/70 bg-card"
								)}
								key={job.id}
								style={{
									left: `${Math.min(8 + index * 22, 70)}%`,
									width: index === 0 ? "32%" : "24%",
								}}
							>
								<div className="min-w-0">
									<div className="truncate font-medium">{job.id}</div>
									<div
										className={cn(
											"truncate text-[10px]",
											index === 0
												? "text-primary-foreground/75"
												: "text-muted-foreground"
										)}
									>
										{job.hospital}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function DashboardResolutionCard({
	className,
	completedJobs,
	completionGoal,
}: {
	className?: string;
	completedJobs: number;
	completionGoal: number;
}) {
	const { t } = useI18n();
	const completionPercent = Math.round((completedJobs / completionGoal) * 100);

	return (
		<Card className={cn(dashboardPanelClass, className)}>
			<CardHeader className="px-5">
				<CardTitle>Resolution Goal</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4 px-5">
				<div className="flex items-end justify-between gap-3">
					<div className="font-medium text-2xl tabular-nums leading-none">
						{completedJobs}{" "}
						<span className="font-normal text-base text-muted-foreground">
							{t("service.dashboard.closed")}
						</span>
					</div>
					<div className="text-muted-foreground text-sm tabular-nums">
						{t("service.dashboard.target", { count: completionGoal })}
					</div>
				</div>
				<SegmentedProgress active={completedJobs} total={completionGoal} />
				<p className="text-muted-foreground text-sm">
					{t("service.dashboard.currentCompleted", {
						percent: completionPercent,
					})}
				</p>
			</CardContent>
		</Card>
	);
}

function DashboardAlertQueueCard({
	hasLiveAlerts,
	liveAlerts,
}: {
	hasLiveAlerts: boolean;
	liveAlerts: ServiceOpsSnapshot["liveAlerts"];
}) {
	const { locale } = useI18n();

	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Live exception queue</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-1">
				{hasLiveAlerts ? (
					liveAlerts.map((alert) => {
						const Icon = alertIconByType[alert.type];

						return (
							<div
								className="flex gap-3 border-border/50 border-b py-3 last:border-b-0"
								key={alert.id}
							>
								<span className={iconTileClass}>
									<Icon className="size-4" />
								</span>
								<div>
									<p className="font-medium text-sm">
										{translateServiceText(locale, alert.title)}
									</p>
									<p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
										{translateLiveAlertMessage(alert.message, locale)}
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
	);
}

function DashboardScopeCard() {
	const { locale } = useI18n();

	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Release scope coverage</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{workflowCards.map((card) => {
					const Icon = card.icon;

					return (
						<div className="flex gap-3" key={card.id}>
							<span className={iconTileClass}>
								<Icon className="size-4" />
							</span>
							<div>
								<p className="font-medium text-sm">
									{translateServiceText(locale, card.title)}
								</p>
								<p className="text-muted-foreground text-xs leading-relaxed">
									{translateServiceText(locale, card.detail)}
								</p>
							</div>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}

function EmptyInline({ message }: { message: string }) {
	const { locale } = useI18n();

	return (
		<div
			className={`${mutedPanelClass} p-4 text-center text-muted-foreground text-sm`}
		>
			{translateServiceText(locale, message)}
		</div>
	);
}

function JobAuditEmptyState() {
	return (
		<CardContent className="flex min-h-[420px] items-center justify-center p-8">
			<div className="flex max-w-xs flex-col items-center text-center">
				<div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
					<ClipboardCheckIcon className="size-7" />
				</div>
				<p className="mt-4 font-medium text-foreground text-sm">
					Select or create a job to view the audit trail.
				</p>
			</div>
		</CardContent>
	);
}

function JobActionPanel({
	canWrite,
	job,
	mutations,
	parts,
	tenantId,
}: {
	canWrite: boolean;
	job: Job;
	mutations: ActionMutations;
	parts: Part[];
	tenantId: string;
}) {
	const { locale } = useI18n();

	if (!canWrite) {
		return null;
	}

	return (
		<div className="flex flex-col gap-4 rounded-lg border border-border/60 p-3">
			<div>
				<LocalizedText as="p" className="font-medium text-sm">
					Operational actions
				</LocalizedText>
				<LocalizedText as="p" className="text-muted-foreground text-xs">
					NFC, shortage, cost, and close-out commands are recorded as service
					events.
				</LocalizedText>
			</div>
			<div className="grid gap-2 sm:grid-cols-2">
				<Button
					className={actionButtonClass}
					disabled={mutations.startJobWithNfc.isPending}
					onClick={() =>
						mutations.startJobWithNfc.mutate({
							data: { nfcUid: job.nfcUid },
							id: job.recordId,
							tenantId,
						})
					}
					type="button"
					variant="outline"
				>
					Start by NFC
				</Button>
				<Button
					className={actionButtonClass}
					disabled={mutations.endJobWithNfc.isPending}
					onClick={() =>
						mutations.endJobWithNfc.mutate({
							data: { nfcUid: job.nfcUid },
							id: job.recordId,
							tenantId,
						})
					}
					type="button"
					variant="outline"
				>
					End by NFC
				</Button>
				<Button
					className={actionButtonClass}
					disabled={mutations.reportTimerAnomaly.isPending}
					onClick={() =>
						mutations.reportTimerAnomaly.mutate({
							data: {
								nfcUid: job.nfcUid,
								notes: translateServiceText(
									locale,
									"Back Office marked timer anomaly"
								),
							},
							id: job.recordId,
							tenantId,
						})
					}
					type="button"
					variant="outline"
				>
					Timer anomaly
				</Button>
				<Button
					className={actionButtonClass}
					disabled={mutations.recalculateJobCost.isPending}
					onClick={() =>
						mutations.recalculateJobCost.mutate({
							id: job.recordId,
							tenantId,
						})
					}
					type="button"
					variant="outline"
				>
					Recalculate cost
				</Button>
			</div>
			<JobPartUsageForm
				job={job}
				mutations={mutations}
				parts={parts}
				tenantId={tenantId}
			/>
			<JobExpenseForm job={job} mutations={mutations} tenantId={tenantId} />
			<JobShortageForm
				job={job}
				mutations={mutations}
				parts={parts}
				tenantId={tenantId}
			/>
		</div>
	);
}

function JobPartUsageForm({
	job,
	mutations,
	parts,
	tenantId,
}: {
	job: Job;
	mutations: ActionMutations;
	parts: Part[];
	tenantId: string;
}) {
	const [partId, setPartId] = useState(parts[0]?.recordId ?? "");
	const [quantity, setQuantity] = useState(1);
	const { locale } = useI18n();

	useEffect(() => {
		setPartId(parts[0]?.recordId ?? "");
	}, [parts]);

	return (
		<div className="grid gap-2 sm:grid-cols-[1fr_88px_auto]">
			<select
				aria-label={translateServiceText(locale, "Part used")}
				className={formControlClass}
				onChange={(event) => setPartId(event.target.value)}
				value={partId}
			>
				{parts.map((part) => (
					<option key={part.recordId} value={part.recordId}>
						{part.id} · {part.name}
					</option>
				))}
			</select>
			<Input
				aria-label="Part quantity"
				className={formControlClass}
				min={1}
				onChange={(event) => setQuantity(Number(event.target.value))}
				type="number"
				value={quantity}
			/>
			<Button
				className={actionButtonClass}
				disabled={!partId || mutations.addJobPartUsage.isPending}
				onClick={() =>
					mutations.addJobPartUsage.mutate({
						data: { partId, quantity },
						id: job.recordId,
						tenantId,
					})
				}
				type="button"
				variant="outline"
			>
				Add part
			</Button>
		</div>
	);
}

function JobExpenseForm({
	job,
	mutations,
	tenantId,
}: {
	job: Job;
	mutations: ActionMutations;
	tenantId: string;
}) {
	const [type, setType] = useState<"meal" | "mileage" | "other" | "parking">(
		"mileage"
	);
	const { locale } = useI18n();
	const [quantity, setQuantity] = useState(0);
	const [amount, setAmount] = useState(0);

	return (
		<div className="grid gap-2 sm:grid-cols-[130px_1fr_1fr_auto]">
			<select
				aria-label={translateServiceText(locale, "Expense type")}
				className={formControlClass}
				onChange={(event) =>
					setType(
						event.target.value as "meal" | "mileage" | "other" | "parking"
					)
				}
				value={type}
			>
				<option value="mileage">
					{translateServiceText(locale, "Mileage")}
				</option>
				<option value="meal">{translateServiceText(locale, "Meal")}</option>
				<option value="parking">
					{translateServiceText(locale, "Parking")}
				</option>
				<option value="other">{translateServiceText(locale, "Other")}</option>
			</select>
			<Input
				aria-label="Expense quantity"
				className={formControlClass}
				onChange={(event) => setQuantity(Number(event.target.value))}
				placeholder="km"
				type="number"
				value={quantity}
			/>
			<Input
				aria-label="Expense amount"
				className={formControlClass}
				onChange={(event) => setAmount(Number(event.target.value))}
				placeholder="HKD"
				type="number"
				value={amount}
			/>
			<Button
				className={actionButtonClass}
				disabled={mutations.logJobExpense.isPending}
				onClick={() =>
					mutations.logJobExpense.mutate({
						data: { amount, quantity, type },
						id: job.recordId,
						tenantId,
					})
				}
				type="button"
				variant="outline"
			>
				Log expense
			</Button>
		</div>
	);
}

function JobShortageForm({
	job,
	mutations,
	parts,
	tenantId,
}: {
	job: Job;
	mutations: ActionMutations;
	parts: Part[];
	tenantId: string;
}) {
	const [partId, setPartId] = useState(parts[0]?.recordId ?? "");
	const [quantityRequested, setQuantityRequested] = useState(1);
	const { locale } = useI18n();

	useEffect(() => {
		setPartId(parts[0]?.recordId ?? "");
	}, [parts]);

	return (
		<div className="grid gap-2 sm:grid-cols-[1fr_88px_auto]">
			<select
				aria-label={translateServiceText(locale, "Shortage part")}
				className={formControlClass}
				onChange={(event) => setPartId(event.target.value)}
				value={partId}
			>
				{parts.map((part) => (
					<option key={part.recordId} value={part.recordId}>
						{part.id} · {part.name}
					</option>
				))}
			</select>
			<Input
				aria-label="Shortage quantity"
				className={formControlClass}
				min={1}
				onChange={(event) => setQuantityRequested(Number(event.target.value))}
				type="number"
				value={quantityRequested}
			/>
			<Button
				className={actionButtonClass}
				disabled={!partId || mutations.reportPartsShortage.isPending}
				onClick={() =>
					mutations.reportPartsShortage.mutate({
						data: { partId, quantityRequested },
						id: job.recordId,
						tenantId,
					})
				}
				type="button"
				variant="outline"
			>
				Report shortage
			</Button>
		</div>
	);
}

function AssetNfcInlineActions({
	asset,
	canWrite,
	engineers,
	mutations,
	tenantId,
}: {
	asset: ServiceOpsSnapshot["assets"][number];
	canWrite: boolean;
	engineers: ServiceOpsSnapshot["engineers"];
	mutations: ActionMutations;
	tenantId: string;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [nfcUid, setNfcUid] = useState(asset.nfcUid);
	const [engineerId, setEngineerId] = useState("");
	const { locale } = useI18n();
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const panelPosition = useInlinePanelPosition({
		isOpen,
		panelRef,
		triggerRef,
	});
	useInlinePanelDismiss({
		isOpen,
		onDismiss: () => setIsOpen(false),
		panelRef,
		triggerRef,
	});

	useEffect(() => {
		setNfcUid(asset.nfcUid);
	}, [asset.nfcUid]);

	if (!canWrite) {
		return null;
	}

	const data = {
		engineerId: engineerId || null,
		nfcUid,
	};

	return (
		<div className="relative">
			<Button
				aria-label="Manage NFC tag"
				className={compactButtonClass}
				onClick={() => setIsOpen((current) => !current)}
				ref={triggerRef}
				size="icon-sm"
				type="button"
				variant="ghost"
			>
				<NfcIcon className="size-4" />
			</Button>
			{isOpen ? (
				<div
					className="fixed z-50 flex max-h-[calc(100vh-1.5rem)] w-80 max-w-[calc(100vw-1.5rem)] flex-col gap-3 overflow-y-auto rounded-xl border bg-card p-3 text-left shadow-lg"
					ref={panelRef}
					style={panelPosition}
				>
					<div className="flex flex-col gap-1">
						<Label
							className={formLabelClass}
							htmlFor={`${asset.recordId}-nfc-uid`}
						>
							NFC UID
						</Label>
						<Input
							className={formControlClass}
							id={`${asset.recordId}-nfc-uid`}
							name={`${asset.recordId}-nfc-uid`}
							onChange={(event) => setNfcUid(event.target.value)}
							value={nfcUid}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<Label
							className={formLabelClass}
							htmlFor={`${asset.recordId}-nfc-engineer`}
						>
							Engineer
						</Label>
						<select
							className={formControlClass}
							id={`${asset.recordId}-nfc-engineer`}
							name={`${asset.recordId}-nfc-engineer`}
							onChange={(event) => setEngineerId(event.target.value)}
							value={engineerId}
						>
							<option value="">
								{translateServiceText(locale, "Back Office")}
							</option>
							{engineers.map((engineer) => (
								<option key={engineer.id} value={engineer.id}>
									{engineer.name}
								</option>
							))}
						</select>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							className={actionButtonClass}
							disabled={!nfcUid || mutations.commissionAssetNfcTag.isPending}
							onClick={() => {
								mutations.commissionAssetNfcTag.mutate({
									data,
									id: asset.recordId,
									tenantId,
								});
								setIsOpen(false);
							}}
							size="sm"
							type="button"
							variant="outline"
						>
							<NfcIcon className="size-4" />
							Commission
						</Button>
						<Button
							className={actionButtonClass}
							disabled={!nfcUid || mutations.replaceAssetNfcTag.isPending}
							onClick={() => {
								mutations.replaceAssetNfcTag.mutate({
									data,
									id: asset.recordId,
									tenantId,
								});
								setIsOpen(false);
							}}
							size="sm"
							type="button"
							variant="outline"
						>
							<RefreshCwIcon className="size-4" />
							Replace
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}

function ProductInlineActions({
	canWrite,
	mutations,
	parts,
	product,
	tenantId,
}: {
	canWrite: boolean;
	mutations: ActionMutations;
	parts: Part[];
	product: ProductModel;
	tenantId: string;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const panelPosition = useInlinePanelPosition({
		isOpen,
		panelRef,
		triggerRef,
	});
	useInlinePanelDismiss({
		isOpen,
		onDismiss: () => setIsOpen(false),
		panelRef,
		triggerRef,
	});

	if (!canWrite) {
		return null;
	}

	return (
		<div className="relative">
			<Button
				aria-label="Configure product"
				className={compactButtonClass}
				onClick={() => setIsOpen((current) => !current)}
				ref={triggerRef}
				size="icon-sm"
				type="button"
				variant="ghost"
			>
				<FileQuestionIcon className="size-4" />
			</Button>
			{isOpen ? (
				<div
					className="fixed z-50 flex max-h-[calc(100vh-1.5rem)] w-80 max-w-[calc(100vw-1.5rem)] flex-col gap-3 overflow-y-auto rounded-xl border bg-card p-3 text-left shadow-lg"
					ref={panelRef}
					style={panelPosition}
				>
					<ProductPartsForm
						mutations={mutations}
						onDone={() => setIsOpen(false)}
						parts={parts}
						product={product}
						tenantId={tenantId}
					/>
					<ProductManualForm
						mutations={mutations}
						onDone={() => setIsOpen(false)}
						product={product}
						tenantId={tenantId}
					/>
				</div>
			) : null}
		</div>
	);
}

type ProductCatalogueMode = "grid" | "list";

function ProductCatalogue({
	assets,
	canWrite,
	jobs,
	mutations,
	onCreate,
	onCreateAsset,
	onEdit,
	parts,
	products,
	selectedProductId,
	setSelectedProductId,
	tenantId,
}: {
	assets: Asset[];
	canWrite: boolean;
	jobs: Job[];
	mutations: ActionMutations;
	onCreate: () => void;
	onCreateAsset: () => void;
	onEdit: (product: ProductModel) => void;
	parts: Part[];
	products: ProductModel[];
	selectedProductId: string;
	setSelectedProductId: (productId: string) => void;
	tenantId: string;
}) {
	const [mode, setMode] = useState<ProductCatalogueMode>("list");
	const groupedProducts = useMemo(
		() => getProductCatalogueGroups(products),
		[products]
	);
	const selectedProduct =
		products.find((product) => product.id === selectedProductId) ?? null;

	useEffect(() => {
		if (
			!selectedProductId ||
			products.some((product) => product.id === selectedProductId)
		) {
			return;
		}

		setSelectedProductId("");
	}, [products, selectedProductId, setSelectedProductId]);

	if (selectedProduct) {
		return (
			<ProductDetailView
				assets={assets.filter(
					(asset) => asset.productModelId === selectedProduct.id
				)}
				canWrite={canWrite}
				jobs={jobs.filter((job) =>
					assets.some(
						(asset) =>
							asset.productModelId === selectedProduct.id &&
							asset.recordId === job.assetId
					)
				)}
				mutations={mutations}
				onBack={() => setSelectedProductId("")}
				onCreateAsset={onCreateAsset}
				onEdit={() => onEdit(selectedProduct)}
				parts={parts.filter((part) =>
					selectedProduct.partIds.includes(part.recordId)
				)}
				product={selectedProduct}
				tenantId={tenantId}
			/>
		);
	}

	return (
		<PageFrame
			action={
				<div className="flex flex-wrap items-center gap-2">
					<div className="inline-flex h-8 overflow-hidden rounded-lg border bg-background shadow-xs">
						<CatalogueModeButton
							active={mode === "list"}
							icon={<LayoutListIcon className="size-4" />}
							label="List"
							onClick={() => setMode("list")}
						/>
						<CatalogueModeButton
							active={mode === "grid"}
							icon={<LayoutGridIcon className="size-4" />}
							label="Grid"
							onClick={() => setMode("grid")}
						/>
					</div>
					{canWrite ? (
						<Button className={primaryActionClass} onClick={onCreate}>
							<PlusIcon className="size-4" />
							Add product
						</Button>
					) : null}
				</div>
			}
			description="Equipment models, PM intervals, manufacturer records, and service documentation."
			eyebrow="B-05 Product Catalogue"
			hideHeader
			title="Product catalogue"
			width="full"
		>
			{groupedProducts.length > 0 ? (
				<div className="flex flex-col gap-6">
					{groupedProducts.map((group) => (
						<ProductCatalogueGroup
							canWrite={canWrite}
							group={group}
							key={group.category}
							mode={mode}
							mutations={mutations}
							onEdit={onEdit}
							onOpenProduct={setSelectedProductId}
							parts={parts}
							tenantId={tenantId}
						/>
					))}
				</div>
			) : (
				<EmptyInline message="Add product models to build the catalogue." />
			)}
		</PageFrame>
	);
}

function CatalogueModeButton({
	active,
	icon,
	label,
	onClick,
}: {
	active: boolean;
	icon: ReactNode;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			aria-pressed={active}
			className={cn(
				"inline-flex items-center gap-1.5 px-2.5 font-medium text-sm transition-colors",
				active
					? "bg-primary text-primary-foreground"
					: "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
			)}
			onClick={onClick}
			type="button"
		>
			{icon}
			{label}
		</button>
	);
}

interface ProductCatalogueGroupModel {
	category: string;
	products: ProductModel[];
}

function ProductCatalogueGroup({
	canWrite,
	group,
	mode,
	mutations,
	onEdit,
	onOpenProduct,
	parts,
	tenantId,
}: {
	canWrite: boolean;
	group: ProductCatalogueGroupModel;
	mode: ProductCatalogueMode;
	mutations: ActionMutations;
	onEdit: (product: ProductModel) => void;
	onOpenProduct: (productId: string) => void;
	parts: Part[];
	tenantId: string;
}) {
	return (
		<section className="min-w-0">
			<div className="mb-3 flex items-center gap-3">
				<span className={iconTileClass}>
					<BoxIcon className="size-4" />
				</span>
				<div className="flex shrink-0 items-baseline gap-3">
					<h3 className="font-medium text-lg">{group.category}</h3>
					<p className="text-muted-foreground text-sm">
						{group.products.length}{" "}
						{group.products.length === 1 ? "model" : "models"}
					</p>
				</div>
				<div className="h-px min-w-8 flex-1 bg-border" />
			</div>
			{mode === "list" ? (
				<ProductCatalogueTable
					canWrite={canWrite}
					mutations={mutations}
					onEdit={onEdit}
					onOpenProduct={onOpenProduct}
					parts={parts}
					products={group.products}
					tenantId={tenantId}
				/>
			) : (
				<ProductCatalogueGrid
					canWrite={canWrite}
					mutations={mutations}
					onEdit={onEdit}
					onOpenProduct={onOpenProduct}
					parts={parts}
					products={group.products}
					tenantId={tenantId}
				/>
			)}
		</section>
	);
}

function ProductCatalogueTable({
	canWrite,
	mutations,
	onEdit,
	onOpenProduct,
	parts,
	products,
	tenantId,
}: {
	canWrite: boolean;
	mutations: ActionMutations;
	onEdit: (product: ProductModel) => void;
	onOpenProduct: (productId: string) => void;
	parts: Part[];
	products: ProductModel[];
	tenantId: string;
}) {
	const { locale } = useI18n();

	return (
		<div className={`${panelClass} overflow-hidden`}>
			<div className="overflow-x-auto">
				<div className="grid min-w-[1040px] grid-cols-[1.15fr_1fr_1fr_.9fr_1.1fr_1fr_132px] border-b bg-muted/30 px-4 py-3 font-medium text-muted-foreground text-sm">
					<p>{translateServiceText(locale, "Model name")}</p>
					<p>{translateServiceText(locale, "Model number")}</p>
					<p>{translateServiceText(locale, "Manufacturer")}</p>
					<p>{translateServiceText(locale, "PM interval")}</p>
					<p>{translateServiceText(locale, "Standard parts")}</p>
					<p>{translateServiceText(locale, "Manual")}</p>
					<p className="text-right">
						{translateServiceText(locale, "Actions")}
					</p>
				</div>
				<div>
					{products.map((product) => (
						<div
							className="relative grid min-w-[1040px] grid-cols-[1.15fr_1fr_1fr_.9fr_1.1fr_1fr_132px] items-center border-b px-4 py-4 text-sm transition-colors last:border-b-0 hover:bg-muted/40"
							key={product.id}
						>
							<button
								aria-label={`View ${product.modelName} details`}
								className="absolute inset-0 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
								onClick={() => onOpenProduct(product.id)}
								type="button"
							/>
							<button
								className="relative w-fit font-medium text-primary hover:underline"
								onClick={() => onOpenProduct(product.id)}
								type="button"
							>
								{product.modelName}
							</button>
							<p className="font-mono text-muted-foreground">{product.code}</p>
							<p className="text-muted-foreground">{product.manufacturer}</p>
							<p className="text-muted-foreground">
								{formatPmInterval(product.defaultPmCycleMonths)}
							</p>
							<p className="truncate text-muted-foreground">
								{formatPartsSummary(product)}
							</p>
							<div className="relative">
								<ProductManualLink product={product} />
							</div>
							<div className="relative">
								<ProductCatalogueActions
									canWrite={canWrite}
									mutations={mutations}
									onEdit={() => onEdit(product)}
									onOpen={() => onOpenProduct(product.id)}
									parts={parts}
									product={product}
									tenantId={tenantId}
								/>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function ProductCatalogueGrid({
	canWrite,
	mutations,
	onEdit,
	onOpenProduct,
	parts,
	products,
	tenantId,
}: {
	canWrite: boolean;
	mutations: ActionMutations;
	onEdit: (product: ProductModel) => void;
	onOpenProduct: (productId: string) => void;
	parts: Part[];
	products: ProductModel[];
	tenantId: string;
}) {
	return (
		<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{products.map((product) => (
				<div
					className={cn(
						panelClass,
						"relative p-4 text-sm transition-colors hover:bg-muted/25"
					)}
					key={product.id}
				>
					<button
						aria-label={`View ${product.modelName} details`}
						className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
						onClick={() => onOpenProduct(product.id)}
						type="button"
					/>
					<div className="flex items-start justify-between gap-4">
						<div className="min-w-0">
							<button
								className="relative block truncate font-medium text-base text-primary hover:underline"
								onClick={() => onOpenProduct(product.id)}
								type="button"
							>
								{product.modelName}
							</button>
							<p className="mt-1 font-mono text-muted-foreground">
								{product.code}
							</p>
						</div>
						<span className="rounded-full bg-muted px-2 py-1 text-muted-foreground text-xs">
							{formatPmInterval(product.defaultPmCycleMonths)}
						</span>
					</div>
					<div className="mt-5 grid gap-3">
						<Metric label="Manufacturer" value={product.manufacturer} />
						<Metric
							label="Standard parts"
							value={formatPartsSummary(product)}
						/>
						<Metric label="Manual" value={product.manualFileName} />
					</div>
					<div className="relative mt-5 flex justify-end">
						<ProductCatalogueActions
							canWrite={canWrite}
							mutations={mutations}
							onEdit={() => onEdit(product)}
							onOpen={() => onOpenProduct(product.id)}
							parts={parts}
							product={product}
							tenantId={tenantId}
						/>
					</div>
				</div>
			))}
		</div>
	);
}

function ProductCatalogueActions({
	canWrite,
	mutations,
	onEdit,
	onOpen,
	parts,
	product,
	tenantId,
}: {
	canWrite: boolean;
	mutations: ActionMutations;
	onEdit: () => void;
	onOpen: () => void;
	parts: Part[];
	product: ProductModel;
	tenantId: string;
}) {
	return (
		<div className="flex items-center justify-end gap-1">
			<Button
				className="rounded-lg text-primary"
				onClick={onOpen}
				size="sm"
				variant="ghost"
			>
				View
				<ArrowUpRightIcon className="size-4" />
			</Button>
			<ProductInlineActions
				canWrite={canWrite}
				mutations={mutations}
				parts={parts}
				product={product}
				tenantId={tenantId}
			/>
			{product.assetCount > 0 ? (
				<span className="rounded-md bg-muted px-2 py-1 text-muted-foreground text-xs">
					{product.assetCount} assets
				</span>
			) : null}
			{canWrite ? (
				<RowActions
					canWrite={canWrite}
					deleteDisabled={product.assetCount > 0}
					deleteDisabledReason={
						product.assetCount > 0
							? "Reassign or remove installed assets before deleting this catalogue item."
							: undefined
					}
					entity="product"
					id={product.id}
					onEdit={onEdit}
					tenantId={tenantId}
				/>
			) : null}
		</div>
	);
}

function ProductManualLink({ product }: { product: ProductModel }) {
	if (!product.manualFileUrl) {
		return <p className="text-muted-foreground">{product.manualFileName}</p>;
	}

	return (
		<a
			className="inline-flex min-w-0 items-center gap-1 font-medium text-primary text-sm hover:underline"
			href={product.manualFileUrl}
			rel="noopener"
			target="_blank"
		>
			<span className="truncate">{product.manualFileName}</span>
			<ExternalLinkIcon className="size-3.5 shrink-0" />
		</a>
	);
}

function ProductDetailView({
	assets,
	canWrite,
	jobs,
	mutations,
	onBack,
	onCreateAsset,
	onEdit,
	parts,
	product,
	tenantId,
}: {
	assets: Asset[];
	canWrite: boolean;
	jobs: Job[];
	mutations: ActionMutations;
	onBack: () => void;
	onCreateAsset: () => void;
	onEdit: () => void;
	parts: Part[];
	product: ProductModel;
	tenantId: string;
}) {
	const { t } = useI18n();
	const repairJobCount = jobs.filter((job) => job.type === "Repair").length;

	return (
		<PageFrame
			description="Product model detail, manual access, installed assets, and linked standard parts."
			eyebrow="B-05 Product Catalogue"
			hideHeader
			title={`${product.modelName} detail`}
			width="full"
		>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-4">
					<button
						className="inline-flex w-fit items-center gap-2 text-base text-muted-foreground transition-colors hover:text-foreground"
						onClick={onBack}
						type="button"
					>
						<ArrowLeftIcon className="size-5" />
						Back
					</button>
					<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
						<div className="min-w-0">
							<h2 className="truncate font-semibold text-4xl tracking-tight">
								{product.modelName}
							</h2>
							<div className="mt-4 flex flex-wrap items-center gap-2 text-lg text-muted-foreground">
								<span className="font-mono">{product.code}</span>
								<span aria-hidden="true">·</span>
								<span>{product.manufacturer}</span>
								<span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-base text-primary">
									{product.category}
								</span>
							</div>
						</div>
						<div className="flex shrink-0 flex-wrap items-center gap-2">
							<RowActions
								canWrite={canWrite}
								deleteDisabled={product.assetCount > 0}
								deleteDisabledReason={
									product.assetCount > 0
										? t("service.empty.productDeleteDisabled")
										: undefined
								}
								entity="product"
								id={product.id}
								onEdit={onEdit}
								tenantId={tenantId}
							/>
						</div>
					</div>
				</div>
				<div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(360px,0.95fr)]">
					<div className="flex min-w-0 flex-col gap-6">
						<ProductInformationCard
							product={product}
							repairJobCount={repairJobCount}
						/>
						<ProductManualCard
							canWrite={canWrite}
							mutations={mutations}
							product={product}
							tenantId={tenantId}
						/>
						<ProductDetailPartsCard parts={parts} />
					</div>
					<div className="flex min-w-0 flex-col gap-6">
						<ProductOverviewCard
							installedUnits={assets.length}
							partsLinked={parts.length}
							repairJobs={repairJobCount}
						/>
						<ProductInstalledAtCard
							assets={assets}
							canWrite={canWrite}
							onCreateAsset={onCreateAsset}
						/>
					</div>
				</div>
			</div>
		</PageFrame>
	);
}

function ProductInformationCard({
	product,
	repairJobCount,
}: {
	product: ProductModel;
	repairJobCount: number;
}) {
	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Product Information</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-6 sm:grid-cols-2">
				<PartDetailField label="Warranty" value="12 months" />
				<PartDetailField
					label="PM Interval"
					value={formatPmInterval(product.defaultPmCycleMonths)}
				/>
				<PartDetailField label="List Price" value="-" />
				<PartDetailField label="Repair Jobs" value={repairJobCount} />
			</CardContent>
		</Card>
	);
}

function ProductManualCard({
	canWrite,
	mutations,
	product,
	tenantId,
}: {
	canWrite: boolean;
	mutations: ActionMutations;
	product: ProductModel;
	tenantId: string;
}) {
	return (
		<Card className={panelClass}>
			<CardHeader className="flex-row items-center justify-between gap-4">
				<CardTitle>Product Manual</CardTitle>
				{canWrite ? (
					<ProductManualReplaceButton
						mutations={mutations}
						product={product}
						tenantId={tenantId}
					/>
				) : null}
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap items-center gap-3">
					{product.manualFileUrl ? (
						<a
							className="inline-flex h-9 items-center gap-2 rounded-lg text-primary text-sm transition-colors hover:text-primary/80"
							href={product.manualFileUrl}
							rel="noopener"
							target="_blank"
						>
							<FileTextIcon className="size-4" />
							View Manual
						</a>
					) : (
						<span className="inline-flex h-9 items-center gap-2 text-muted-foreground text-sm">
							<FileTextIcon className="size-4" />
							{product.manualFileName}
						</span>
					)}
					<Button
						className={compactButtonClass}
						disabled={!product.manualFileUrl}
						type="button"
						variant="outline"
					>
						<SearchIcon className="size-4" />
						Search Manual
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function ProductManualReplaceButton({
	mutations,
	product,
	tenantId,
}: {
	mutations: ActionMutations;
	product: ProductModel;
	tenantId: string;
}) {
	const { t } = useI18n();
	const [file, setFile] = useState<File | null>(null);
	const [isUploadingManual, setIsUploadingManual] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const isSavingManual =
		isUploadingManual || mutations.uploadServiceManual.isPending;

	const saveManual = async () => {
		if (!file) {
			setIsOpen(true);
			return;
		}

		setIsUploadingManual(true);
		try {
			const uploadedManual = await uploadServiceManualFile(file, tenantId);
			mutations.uploadServiceManual.mutate({
				data: uploadedManual,
				id: product.id,
				tenantId,
			});
			setFile(null);
			setIsOpen(false);
		} catch (error) {
			toast.error(
				getManualUploadErrorMessage(error, t("service.upload.failed"))
			);
		}
		setIsUploadingManual(false);
	};

	if (isOpen) {
		return (
			<div className="flex max-w-full flex-wrap items-center justify-end gap-2">
				<ManualPdfPicker
					accept="application/pdf,.pdf"
					aria-label="Replacement service manual PDF"
					onChange={setFile}
				/>
				<Button
					className={actionButtonClass}
					disabled={!file || isSavingManual}
					onClick={saveManual}
					size="sm"
					type="button"
					variant="outline"
				>
					{isSavingManual ? (
						<Loader2Icon className="size-4 animate-spin" />
					) : (
						<UploadIcon className="size-4" />
					)}
					{t("common.save")}
				</Button>
			</div>
		);
	}

	return (
		<Button
			className={compactButtonClass}
			onClick={() => setIsOpen(true)}
			size="sm"
			type="button"
			variant="ghost"
		>
			<UploadIcon className="size-4" />
			{t("service.action.replace")}
		</Button>
	);
}

function ProductDetailPartsCard({ parts }: { parts: Part[] }) {
	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Parts ({parts.length})</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{parts.length > 0 ? (
					parts.map((part) => (
						<div
							className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/25 px-3 py-2 text-sm"
							key={part.recordId}
						>
							<div className="min-w-0">
								<p className="truncate font-medium">{part.name}</p>
								<p className="truncate text-muted-foreground text-xs">
									{part.id}
								</p>
							</div>
							<span className="shrink-0 text-muted-foreground">
								{part.stock} on hand
							</span>
						</div>
					))
				) : (
					<p className="text-muted-foreground text-sm">
						No parts linked to this model
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function ProductOverviewCard({
	installedUnits,
	partsLinked,
	repairJobs,
}: {
	installedUnits: number;
	partsLinked: number;
	repairJobs: number;
}) {
	return (
		<Card className={panelClass}>
			<CardHeader>
				<CardTitle>Overview</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<ProductOverviewMetric label="Installed units" value={installedUnits} />
				<ProductOverviewMetric label="Repair jobs" value={repairJobs} />
				<ProductOverviewMetric label="Parts linked" value={partsLinked} />
			</CardContent>
		</Card>
	);
}

function ProductOverviewMetric({
	label,
	value,
}: {
	label: string;
	value: number;
}) {
	const { locale } = useI18n();

	return (
		<div className="flex items-center justify-between gap-4 text-base">
			<span className="text-muted-foreground">
				{translateServiceText(locale, label)}
			</span>
			<span className="font-semibold tabular-nums">{value}</span>
		</div>
	);
}

function ProductInstalledAtCard({
	assets,
	canWrite,
	onCreateAsset,
}: {
	assets: Asset[];
	canWrite: boolean;
	onCreateAsset: () => void;
}) {
	return (
		<Card className={panelClass}>
			<CardHeader className="flex-row items-center justify-between gap-4">
				<CardTitle>Installed At</CardTitle>
				{canWrite ? (
					<Button
						className="rounded-lg text-primary"
						onClick={onCreateAsset}
						size="sm"
						type="button"
						variant="ghost"
					>
						<PlusIcon className="size-4" />
						Install at Hospital
					</Button>
				) : null}
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{assets.length > 0 ? (
					assets.map((asset) => (
						<div
							className="rounded-lg border border-border/60 bg-muted/20 p-3"
							key={asset.recordId}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="truncate font-semibold text-sm">
										{asset.hospital}
									</p>
									<p className="mt-3 font-mono text-muted-foreground text-sm">
										{asset.id}
									</p>
								</div>
								<StatusPill
									className={coverageStatusStyles[asset.contractCoverage]}
								>
									{asset.contractCoverage}
								</StatusPill>
							</div>
						</div>
					))
				) : (
					<p className="text-muted-foreground text-sm">
						No installed units for this model.
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function formatPartsSummary(product: ProductModel) {
	if (product.partsList.length === 0) {
		return "No parts linked";
	}

	if (product.partsList.length === 1) {
		return product.partsList[0];
	}

	return `${product.partsList.length} parts`;
}

function getProductCatalogueGroups(
	products: ProductModel[]
): ProductCatalogueGroupModel[] {
	const groups = new Map<string, ProductModel[]>();

	for (const product of products) {
		const category = product.category.trim() || "Uncategorised";
		const productsInCategory = groups.get(category);

		if (productsInCategory) {
			productsInCategory.push(product);
		} else {
			groups.set(category, [product]);
		}
	}

	return Array.from(groups.entries())
		.map(([category, groupProducts]) => ({
			category,
			products: groupProducts.toSorted((firstProduct, secondProduct) =>
				firstProduct.modelName.localeCompare(secondProduct.modelName)
			),
		}))
		.toSorted((firstGroup, secondGroup) =>
			firstGroup.category.localeCompare(secondGroup.category)
		);
}

function formatPmInterval(months: number) {
	return `Every ${months} ${months === 1 ? "month" : "months"}`;
}

function ProductPartsForm({
	mutations,
	onDone,
	parts,
	product,
	tenantId,
}: {
	mutations: ActionMutations;
	onDone: () => void;
	parts: Part[];
	product: ProductModel;
	tenantId: string;
}) {
	const [selectedPartIds, setSelectedPartIds] = useState(product.partIds);
	const { locale } = useI18n();

	const togglePart = (partId: string) => {
		setSelectedPartIds((currentIds) =>
			currentIds.includes(partId)
				? currentIds.filter((currentId) => currentId !== partId)
				: [...currentIds, partId]
		);
	};

	return (
		<div className="flex flex-col gap-2">
			<p className="font-medium text-sm">
				{translateServiceText(locale, "Standard parts")}
			</p>
			<div className="grid max-h-36 gap-1 overflow-y-auto">
				{parts.map((part) => (
					<label
						className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-muted"
						key={part.recordId}
					>
						<input
							checked={selectedPartIds.includes(part.recordId)}
							onChange={() => togglePart(part.recordId)}
							type="checkbox"
						/>
						<span>{part.name}</span>
					</label>
				))}
			</div>
			<Button
				className={actionButtonClass}
				disabled={mutations.updateProductParts.isPending}
				onClick={() => {
					mutations.updateProductParts.mutate({
						data: { partIds: selectedPartIds },
						id: product.id,
						tenantId,
					});
					onDone();
				}}
				size="sm"
				type="button"
			>
				Save parts
			</Button>
		</div>
	);
}

function ProductManualForm({
	mutations,
	onDone,
	product,
	tenantId,
}: {
	mutations: ActionMutations;
	onDone: () => void;
	product: ProductModel;
	tenantId: string;
}) {
	const { locale, t } = useI18n();
	const [file, setFile] = useState<File | null>(null);
	const [isUploadingManual, setIsUploadingManual] = useState(false);
	const isSavingManual =
		isUploadingManual || mutations.uploadServiceManual.isPending;

	return (
		<div className="flex flex-col gap-2">
			<LocalizedText as="p" className="font-medium text-sm">
				Service manual
			</LocalizedText>
			{product.manualFileName === "Not uploaded" ? null : (
				<p className="text-muted-foreground text-xs">
					{translateServiceText(locale, "Current file")}:{" "}
					{product.manualFileName}
				</p>
			)}
			<ManualPdfPicker
				accept="application/pdf,.pdf"
				aria-label="Service manual PDF"
				onChange={setFile}
			/>
			<Button
				className={actionButtonClass}
				disabled={!file || isSavingManual}
				onClick={async () => {
					if (!file) {
						return;
					}

					setIsUploadingManual(true);
					try {
						const uploadedManual = await uploadServiceManualFile(
							file,
							tenantId
						);
						mutations.uploadServiceManual.mutate({
							data: uploadedManual,
							id: product.id,
							tenantId,
						});
						onDone();
					} catch (error) {
						toast.error(
							getManualUploadErrorMessage(error, t("service.upload.failed"))
						);
					}
					setIsUploadingManual(false);
				}}
				size="sm"
				type="button"
			>
				{isSavingManual ? (
					<Loader2Icon className="size-4 animate-spin" />
				) : null}
				Save manual
			</Button>
		</div>
	);
}

function useInlinePanelPosition({
	isOpen,
	panelRef,
	triggerRef,
}: {
	isOpen: boolean;
	panelRef: RefObject<HTMLDivElement | null>;
	triggerRef: RefObject<HTMLButtonElement | null>;
}) {
	const [panelPosition, setPanelPosition] = useState({ left: 0, top: 0 });

	useLayoutEffect(() => {
		if (!(isOpen && triggerRef.current)) {
			return;
		}

		const updatePanelPosition = () => {
			const triggerRect = triggerRef.current?.getBoundingClientRect();

			if (!triggerRect) {
				return;
			}

			const panelHeight =
				panelRef.current?.offsetHeight ??
				Math.min(window.innerHeight - 24, 360);
			const panelWidth = panelRef.current?.offsetWidth ?? inlinePanelWidth;
			const maxLeft =
				window.innerWidth - panelWidth - inlinePanelViewportPadding;
			const maxTop =
				window.innerHeight - panelHeight - inlinePanelViewportPadding;
			const preferredLeft = triggerRect.right - panelWidth;
			const preferredTop = triggerRect.bottom + inlinePanelOffset;

			setPanelPosition({
				left: Math.max(
					inlinePanelViewportPadding,
					Math.min(preferredLeft, maxLeft)
				),
				top: Math.max(
					inlinePanelViewportPadding,
					Math.min(preferredTop, maxTop)
				),
			});
		};

		updatePanelPosition();
		window.addEventListener("resize", updatePanelPosition);
		window.addEventListener("scroll", updatePanelPosition, true);

		return () => {
			window.removeEventListener("resize", updatePanelPosition);
			window.removeEventListener("scroll", updatePanelPosition, true);
		};
	}, [isOpen, panelRef, triggerRef]);

	return panelPosition;
}

function useInlinePanelDismiss({
	isOpen,
	onDismiss,
	panelRef,
	triggerRef,
}: {
	isOpen: boolean;
	onDismiss: () => void;
	panelRef: RefObject<HTMLDivElement | null>;
	triggerRef: RefObject<HTMLButtonElement | null>;
}) {
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;

			if (!(target instanceof Node)) {
				return;
			}

			if (
				panelRef.current?.contains(target) ||
				triggerRef.current?.contains(target)
			) {
				return;
			}

			onDismiss();
		};
		const handleKeyDown = (event: globalThis.KeyboardEvent) => {
			if (event.key === "Escape") {
				onDismiss();
			}
		};

		window.addEventListener("pointerdown", handlePointerDown);
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("pointerdown", handlePointerDown);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onDismiss, panelRef, triggerRef]);
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
			if (event.defaultPrevented) {
				return;
			}

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

	const title = getCrudDialogTitle(state);
	const description =
		state.entity === "tenant"
			? "Creates or updates an isolated SaaS workspace."
			: "Saved to the current tenant only.";
	const descriptionId = "crud-dialog-description";
	const titleId = "crud-dialog-title";

	return (
		<div
			aria-describedby={descriptionId}
			aria-labelledby={titleId}
			aria-modal="true"
			className="fixed inset-0 z-50 flex justify-end bg-foreground/12 backdrop-blur-[2px]"
			role="dialog"
		>
			<div className="flex h-full w-full max-w-[560px] flex-col border-l bg-card shadow-2xl">
				<div className="flex min-h-16 items-center justify-between gap-4 border-b px-5">
					<div className="min-w-0">
						<p
							className="truncate font-semibold text-base leading-none"
							id={titleId}
						>
							{title}
						</p>
						<p
							className="mt-1 truncate text-muted-foreground text-xs"
							id={descriptionId}
						>
							{description}
						</p>
					</div>
					<Button
						aria-label="Close dialog"
						className={compactButtonClass}
						onClick={onClose}
						size="icon-sm"
						variant="ghost"
					>
						<XIcon className="size-4" />
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
	const { locale, t } = useI18n();
	const tenantId = data.tenant.id;
	const mutations = useEntityMutations(tenantId, onClose);
	const fields = getFieldConfigs(state.entity, data, locale);
	const defaults = useMemo(
		() => getFormDefaults(state.entity, state.record),
		[state.entity, state.record]
	);
	const [isUploadingManual, setIsUploadingManual] = useState(false);
	const isSaving = isEntityMutationPending(mutations);
	const isSubmitting = isSaving || isUploadingManual;
	const submitLabel = getCrudSubmitLabel(
		state,
		isSubmitting,
		isUploadingManual,
		t
	);
	const [contractDateRange, setContractDateRange] = useState(() => ({
		endDate: getInputDefaultValue(defaults.endDate),
		startDate: getInputDefaultValue(defaults.startDate),
	}));

	const updateContractStartDate = (startDate: string) => {
		setContractDateRange((currentRange) => ({
			endDate:
				currentRange.endDate && currentRange.endDate < startDate
					? startDate
					: currentRange.endDate,
			startDate,
		}));
	};

	const updateContractEndDate = (endDate: string) => {
		setContractDateRange((currentRange) => ({
			...currentRange,
			endDate,
		}));
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		if (state.entity === "product") {
			setIsUploadingManual(true);
			try {
				await attachUploadedServiceManual(formData, tenantId);
			} catch (error) {
				toast.error(
					getManualUploadErrorMessage(error, t("service.upload.failed"))
				);
				setIsUploadingManual(false);
				return;
			}
			setIsUploadingManual(false);
		}

		submitCrudForm({
			formData,
			mutations,
			state,
			tenantId,
		});
	};

	return (
		<form
			className="flex min-h-0 flex-1 flex-col bg-muted/20"
			onSubmit={handleSubmit}
		>
			<div className="grid flex-1 auto-rows-min gap-y-6 overflow-y-auto px-6 pt-6 pb-24 sm:pb-6 md:grid-cols-2 md:gap-x-5">
				{fields.map((field) => {
					const contractDateField = getContractDateFieldState(
						field,
						state.entity,
						contractDateRange,
						updateContractStartDate,
						updateContractEndDate
					);

					return (
						<FormField
							defaultValue={defaults[field.name]}
							field={contractDateField.field}
							key={field.name}
							onValueChange={contractDateField.onValueChange}
							value={contractDateField.value}
						/>
					);
				})}
			</div>
			<div className="flex flex-col items-stretch gap-3 border-t bg-card px-6 py-4 shadow-[0_-1px_0_rgb(0_0_0_/_0.02)] sm:flex-row sm:items-center sm:justify-between">
				<p className="hidden text-muted-foreground text-xs sm:block">
					{t("form.fieldsRequired")}
				</p>
				<div className="flex shrink-0 justify-end gap-2">
					<Button
						className={compactButtonClass}
						disabled={isSubmitting}
						onClick={onClose}
						type="button"
						variant="outline"
					>
						{t("common.cancel")}
					</Button>
					<Button
						className={primaryActionClass}
						disabled={isSubmitting}
						type="submit"
					>
						{isSubmitting ? (
							<Loader2Icon className="size-4 animate-spin" />
						) : null}
						{submitLabel}
					</Button>
				</div>
			</div>
		</form>
	);
}

function getCrudDialogTitle(state: CrudState) {
	if (state.entity === "asset" && state.mode === "create") {
		return "Register New Asset";
	}

	if (state.entity === "hospital" && state.mode === "create") {
		return "Add New Hospital";
	}

	if (state.entity === "part" && state.mode === "create") {
		return "Add New Part";
	}

	return state.mode === "create"
		? `New ${entityLabels[state.entity]}`
		: `Edit ${entityLabels[state.entity]}`;
}

function getCrudSubmitLabel(
	state: CrudState,
	isSaving: boolean,
	isUploadingManual: boolean,
	t: ReturnType<typeof useI18n>["t"]
) {
	if (isUploadingManual) {
		return t("common.uploading");
	}

	if (isSaving) {
		return t("common.saving");
	}

	if (state.entity === "part" && state.mode === "create") {
		return t("service.action.newPart");
	}

	if (state.entity === "asset" && state.mode === "create") {
		return t("service.action.registerAsset");
	}

	if (state.entity === "hospital" && state.mode === "create") {
		return t("service.action.newHospital");
	}

	return t("common.save");
}

function isEntityMutationPending(mutations: EntityMutations) {
	return Object.values(mutations).some((mutation) => mutation.isPending);
}

type EntityMutations = ReturnType<typeof useEntityMutations>;

type ActionMutations = ReturnType<typeof useServiceOpsActionMutations>;

interface UploadedServiceManualMetadata {
	fileName: string;
	fileUrl: string;
	pageCount: null | number;
	storageKey: string;
	version: string;
}

const noopFileChange = () => undefined;

interface ContractDateRange {
	endDate: string;
	startDate: string;
}

function getContractDateFieldState(
	field: FieldConfig,
	entity: CrudEntity,
	contractDateRange: ContractDateRange,
	onStartDateChange: (value: string) => void,
	onEndDateChange: (value: string) => void
) {
	if (entity !== "contract") {
		return { field };
	}

	if (field.name === "startDate") {
		return {
			field: {
				...field,
				max: contractDateRange.endDate || field.max,
			},
			onValueChange: onStartDateChange,
			value: contractDateRange.startDate,
		};
	}

	if (field.name === "endDate") {
		return {
			field: {
				...field,
				min: contractDateRange.startDate || field.min,
			},
			onValueChange: onEndDateChange,
			value: contractDateRange.endDate,
		};
	}

	return { field };
}

function ManualPdfPicker({
	accept = "application/pdf,.pdf",
	"aria-label": ariaLabel,
	id,
	name,
	onChange,
	required,
}: {
	"aria-label": string;
	accept?: string;
	id?: string;
	name?: string;
	onChange: (file: File | null) => void;
	required?: boolean;
}) {
	const [selectedFileName, setSelectedFileName] = useState("");
	const inputId = id ?? `manual-pdf-${name ?? "upload"}`;

	return (
		<div className="min-w-0">
			<Input
				accept={accept}
				aria-hidden="true"
				aria-label={ariaLabel}
				className="sr-only"
				id={inputId}
				name={name}
				onChange={(event) => {
					const nextFile = event.target.files?.[0] ?? null;
					setSelectedFileName(nextFile?.name ?? "");
					onChange(nextFile);
				}}
				required={required}
				type="file"
			/>
			<label
				className="flex min-h-20 cursor-pointer items-center gap-3 rounded-lg border border-input border-dashed bg-background px-4 py-3 shadow-xs transition-[border-color,box-shadow,background-color] hover:border-foreground/25 hover:bg-muted/30 has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/20"
				htmlFor={inputId}
			>
				<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
					<UploadIcon className="size-4" />
				</span>
				<span className="min-w-0 flex-1">
					<span className="block truncate font-medium text-sm">
						{selectedFileName || "Select PDF manual"}
					</span>
					<span className="mt-1 block truncate text-muted-foreground text-xs">
						Click to upload a PDF file
					</span>
				</span>
				<span className="hidden shrink-0 rounded-md border border-border/70 bg-card px-2.5 py-1 font-medium text-xs sm:inline-flex">
					Browse
				</span>
			</label>
		</div>
	);
}

function getManualFileFromFormData(formData: FormData) {
	const file = formData.get("manualFile");

	if (!(file instanceof File) || file.size === 0) {
		return null;
	}

	return file;
}

async function uploadServiceManualFile(
	file: File,
	tenantId: string
): Promise<UploadedServiceManualMetadata> {
	const uploadFormData = new FormData();
	uploadFormData.append("file", file);
	uploadFormData.append("tenantId", tenantId);

	const response = await fetch("/api/service-manual-upload", {
		body: uploadFormData,
		method: "POST",
	});

	const responseBody = await response.json();

	if (!response.ok) {
		throw new Error(
			typeof responseBody.error === "string"
				? responseBody.error
				: "Manual upload failed."
		);
	}

	return responseBody as UploadedServiceManualMetadata;
}

async function attachUploadedServiceManual(
	formData: FormData,
	tenantId: string
) {
	const file = getManualFileFromFormData(formData);

	if (!file) {
		return;
	}

	const uploadedManual = await uploadServiceManualFile(file, tenantId);
	formData.set("manualFileName", uploadedManual.fileName);
	formData.set("manualFileUrl", uploadedManual.fileUrl);
	formData.set("manualStorageKey", uploadedManual.storageKey);
	formData.set("manualVersion", uploadedManual.version);

	if (uploadedManual.pageCount) {
		formData.set("manualPageCount", String(uploadedManual.pageCount));
	}
}

function getManualUploadErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}

function useServiceOpsActionMutations(tenantId: string) {
	const { t } = useI18n();
	const actionResult = useMutationResult(
		tenantId,
		t("service.toast.operationCompleted"),
		"operation",
		"save"
	);
	const stockUpdateResult = useMutationResult(
		tenantId,
		t("service.toast.stockUpdated"),
		"part",
		"save"
	);

	return {
		addJobPartUsage: useMutation(
			trpc.serviceOps.addJobPartUsage.mutationOptions(actionResult)
		),
		approvePmOpportunity: useMutation(
			trpc.serviceOps.approvePmOpportunity.mutationOptions(actionResult)
		),
		commissionAssetNfcTag: useMutation(
			trpc.serviceOps.commissionAssetNfcTag.mutationOptions(actionResult)
		),
		confirmPartsArrived: useMutation(
			trpc.serviceOps.confirmPartsArrived.mutationOptions(actionResult)
		),
		convertFaultToRepairJob: useMutation(
			trpc.serviceOps.convertFaultToRepairJob.mutationOptions(actionResult)
		),
		endJobWithNfc: useMutation(
			trpc.serviceOps.endJobWithNfc.mutationOptions(actionResult)
		),
		generateOperationalReport: useMutation(
			trpc.serviceOps.generateOperationalReport.mutationOptions(actionResult)
		),
		logJobExpense: useMutation(
			trpc.serviceOps.logJobExpense.mutationOptions(actionResult)
		),
		recalculateJobCost: useMutation(
			trpc.serviceOps.recalculateJobCost.mutationOptions(actionResult)
		),
		refreshContractStatuses: useMutation(
			trpc.serviceOps.refreshContractStatuses.mutationOptions(actionResult)
		),
		reportPartsShortage: useMutation(
			trpc.serviceOps.reportPartsShortage.mutationOptions(actionResult)
		),
		reportTimerAnomaly: useMutation(
			trpc.serviceOps.reportTimerAnomaly.mutationOptions(actionResult)
		),
		resumeShortageJob: useMutation(
			trpc.serviceOps.resumeShortageJob.mutationOptions(actionResult)
		),
		replaceAssetNfcTag: useMutation(
			trpc.serviceOps.replaceAssetNfcTag.mutationOptions(actionResult)
		),
		startJobWithNfc: useMutation(
			trpc.serviceOps.startJobWithNfc.mutationOptions(actionResult)
		),
		updateProductParts: useMutation(
			trpc.serviceOps.updateProductParts.mutationOptions(actionResult)
		),
		updatePartStock: useMutation(
			trpc.serviceOps.updatePart.mutationOptions(stockUpdateResult)
		),
		updateSystemParameter: useMutation(
			trpc.serviceOps.updateSystemParameter.mutationOptions(actionResult)
		),
		uploadServiceManual: useMutation(
			trpc.serviceOps.uploadServiceManual.mutationOptions(actionResult)
		),
	};
}

function FormField({
	defaultValue,
	field,
	onValueChange,
	value,
}: {
	defaultValue?: FormDefaultValue;
	field: FieldConfig;
	onValueChange?: (value: string) => void;
	value?: string;
}) {
	const fieldClassName = cn(
		formFieldClass,
		field.span === "full" ? "md:col-span-2" : ""
	);

	if (field.type === "hidden") {
		return (
			<input
				defaultValue={getInputDefaultValue(defaultValue)}
				name={field.name}
				type="hidden"
			/>
		);
	}

	if (field.type === "section") {
		return (
			<div className={cn("pt-2 md:col-span-2", fieldClassName)}>
				<h3 className="font-semibold text-base text-foreground">
					{field.label}
				</h3>
			</div>
		);
	}

	if (field.type === "checkbox") {
		return (
			<div
				className={cn(
					fieldClassName,
					"min-h-10 cursor-pointer justify-end gap-2 pt-6 md:pt-6"
				)}
			>
				<label className="flex items-center gap-2">
					<input
						className="size-4 shrink-0 accent-primary"
						defaultChecked={Boolean(defaultValue)}
						name={field.name}
						type="checkbox"
					/>
					<span className="font-medium text-sm leading-none">
						{field.label}
					</span>
				</label>
			</div>
		);
	}

	if (field.type === "checkbox-list") {
		const selectedValues = new Set(getCheckboxListDefaultValues(defaultValue));
		const options = field.options ?? [];

		return (
			<fieldset className={fieldClassName}>
				<legend className={formLabelClass}>
					<FormLabelText field={field} />
				</legend>
				<div className="flex flex-wrap gap-x-5 gap-y-2 rounded-lg border border-input bg-background px-3 py-2 shadow-xs">
					{options.length > 0 ? (
						options.map((option) => (
							<CheckboxListOption
								checked={selectedValues.has(option.value)}
								key={option.value}
								name={field.name}
								option={option}
							/>
						))
					) : (
						<p className="py-1 text-muted-foreground text-sm">
							No options available.
						</p>
					)}
				</div>
				<FieldDescription description={field.description} />
			</fieldset>
		);
	}

	if (field.type === "part-picker") {
		return (
			<ProductPartPickerField
				defaultValue={defaultValue}
				field={field}
				fieldClassName={fieldClassName}
			/>
		);
	}

	if (field.type === "select") {
		if (field.multiple) {
			return (
				<MultiSelectFormField
					defaultValue={defaultValue}
					field={field}
					fieldClassName={fieldClassName}
				/>
			);
		}

		const selectDefaultValue = getSelectDefaultValue(
			defaultValue,
			field.multiple
		);

		return (
			<div className={fieldClassName}>
				<Label className={formLabelClass} htmlFor={field.name}>
					<FormLabelText field={field} />
				</Label>
				<div className="relative">
					<select
						className={cn(formControlClass, "appearance-none pr-9")}
						defaultValue={selectDefaultValue}
						id={field.name}
						name={field.name}
						required={field.required}
					>
						<option value="">{field.placeholder ?? "Select..."}</option>
						{field.options?.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
				</div>
				<FieldDescription description={field.description} />
			</div>
		);
	}

	if (field.type === "phone") {
		return (
			<InternationalPhoneField
				defaultValue={getInputDefaultValue(defaultValue)}
				field={field}
				fieldClassName={fieldClassName}
			/>
		);
	}

	if (field.type === "textarea") {
		return (
			<div className={fieldClassName}>
				<Label className={formLabelClass} htmlFor={field.name}>
					<FormLabelText field={field} />
				</Label>
				<textarea
					className={cn(formControlClass, "min-h-28 resize-y py-2")}
					defaultValue={getInputDefaultValue(defaultValue)}
					id={field.name}
					name={field.name}
					placeholder={field.placeholder}
					required={field.required}
				/>
				<FieldDescription description={field.description} />
			</div>
		);
	}

	if (field.type === "file") {
		return (
			<div className={fieldClassName}>
				<Label className={formLabelClass} htmlFor={field.name}>
					<FormLabelText field={field} />
				</Label>
				<ManualPdfPicker
					accept={field.accept}
					aria-label={field.label}
					id={field.name}
					name={field.name}
					onChange={noopFileChange}
					required={field.required}
				/>
				<FieldDescription description={field.description} />
			</div>
		);
	}

	return (
		<TextFormField
			defaultValue={defaultValue}
			field={field}
			fieldClassName={fieldClassName}
			onValueChange={onValueChange}
			value={value}
		/>
	);
}

function TextFormField({
	defaultValue,
	field,
	fieldClassName,
	onValueChange,
	value,
}: {
	defaultValue?: FormDefaultValue;
	field: FieldConfig;
	fieldClassName: string;
	onValueChange?: (value: string) => void;
	value?: string;
}) {
	const hasSuffix = Boolean(field.suffix);
	const isControlled = value !== undefined;

	return (
		<div className={fieldClassName}>
			<Label className={formLabelClass} htmlFor={field.name}>
				<FormLabelText field={field} />
			</Label>
			<div className="relative">
				<Input
					className={cn(formControlClass, hasSuffix ? "pr-16" : "")}
					defaultValue={
						isControlled ? undefined : getInputDefaultValue(defaultValue)
					}
					id={field.name}
					max={field.max}
					min={field.min}
					name={field.name}
					onChange={(event) => onValueChange?.(event.target.value)}
					placeholder={field.placeholder}
					required={field.required}
					step={field.type === "number" ? "any" : undefined}
					type={field.type ?? "text"}
					value={value}
				/>
				{field.suffix ? (
					<span className="pointer-events-none absolute inset-y-0 right-2.5 inline-flex items-center text-muted-foreground text-sm">
						{field.suffix}
					</span>
				) : null}
			</div>
			<FieldDescription description={field.description} />
		</div>
	);
}

function MultiSelectFormField({
	defaultValue,
	field,
	fieldClassName,
}: {
	defaultValue?: FormDefaultValue;
	field: FieldConfig;
	fieldClassName: string;
}) {
	const options = field.options ?? [];
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedValues, setSelectedValues] = useState(() =>
		getCheckboxListDefaultValues(defaultValue)
	);
	const fieldRef = useRef<HTMLDivElement | null>(null);
	const selectedOptions = getSelectedOptions(options, selectedValues);
	const selectedValueSet = new Set(selectedValues);
	const normalizedQuery = searchQuery.trim().toLowerCase();
	const filteredOptions =
		normalizedQuery.length > 0
			? options.filter((option) =>
					`${option.label} ${option.description ?? ""} ${option.meta ?? ""}`
						.toLowerCase()
						.includes(normalizedQuery)
				)
			: options;

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;

			if (!(target instanceof Node)) {
				return;
			}

			if (fieldRef.current?.contains(target)) {
				return;
			}

			setIsOpen(false);
		};
		const handleKeyDown = (event: globalThis.KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				event.stopPropagation();
				setIsOpen(false);
			}
		};

		window.addEventListener("pointerdown", handlePointerDown);
		window.addEventListener("keydown", handleKeyDown, { capture: true });

		return () => {
			window.removeEventListener("pointerdown", handlePointerDown);
			window.removeEventListener("keydown", handleKeyDown, { capture: true });
		};
	}, [isOpen]);

	const toggleValue = (value: string) => {
		setSelectedValues((currentValues) =>
			currentValues.includes(value)
				? currentValues.filter((currentValue) => currentValue !== value)
				: [...currentValues, value]
		);
	};

	const removeValue = (value: string) => {
		setSelectedValues((currentValues) =>
			currentValues.filter((currentValue) => currentValue !== value)
		);
	};
	const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setIsOpen(true);
		}
	};

	return (
		<div className={fieldClassName} ref={fieldRef}>
			<Label className={formLabelClass} htmlFor={`${field.name}-toggle`}>
				<FormLabelText field={field} />
			</Label>
			{selectedValues.map((selectedValue) => (
				<input
					key={selectedValue}
					name={field.name}
					type="hidden"
					value={selectedValue}
				/>
			))}
			<div className="relative">
				<div className="flex min-h-10 items-center gap-2 rounded-lg border border-input bg-background px-2.5 py-2 shadow-xs transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
					<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
						{selectedOptions.length > 0 ? (
							selectedOptions.map((option) => (
								<span
									className="inline-flex max-w-full items-center gap-1 rounded-md border border-border/70 bg-muted/55 px-2 py-1 font-medium text-xs"
									key={option.value}
								>
									<span className="truncate">{option.label}</span>
									<button
										aria-label={`Remove ${option.label}`}
										className="rounded-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
										onClick={() => removeValue(option.value)}
										type="button"
									>
										<XIcon className="size-3" />
									</button>
								</span>
							))
						) : (
							<span className="px-0.5 text-muted-foreground text-sm">
								{field.placeholder ?? "Select options..."}
							</span>
						)}
					</div>
					<button
						aria-expanded={isOpen}
						aria-haspopup="listbox"
						aria-label={`Toggle ${field.label}`}
						className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
						id={`${field.name}-toggle`}
						onClick={() => setIsOpen((currentValue) => !currentValue)}
						onKeyDown={handleTriggerKeyDown}
						type="button"
					>
						<ChevronDownIcon className="size-4" />
					</button>
				</div>
				{isOpen ? (
					<div className="absolute top-[calc(100%+0.35rem)] left-0 z-50 w-full rounded-lg border bg-popover p-2 text-popover-foreground shadow-lg">
						<Input
							aria-label={`Search ${field.label}`}
							className="h-8 rounded-md text-sm"
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder={`Search ${field.label.toLowerCase()}...`}
							value={searchQuery}
						/>
						<div
							aria-multiselectable="true"
							className="mt-2 max-h-56 overflow-y-auto"
							role="listbox"
						>
							{filteredOptions.length > 0 ? (
								filteredOptions.map((option) => {
									const isSelected = selectedValueSet.has(option.value);

									return (
										<button
											aria-selected={isSelected}
											className={cn(
												"flex min-h-9 w-full items-center justify-between gap-3 rounded-md px-2.5 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
												isSelected ? "bg-muted font-medium" : ""
											)}
											key={option.value}
											onClick={() => toggleValue(option.value)}
											role="option"
											type="button"
										>
											<span className="min-w-0">
												<span className="block truncate">{option.label}</span>
												{option.description ? (
													<span className="mt-0.5 block truncate text-muted-foreground text-xs">
														{option.description}
													</span>
												) : null}
											</span>
											<span
												className={cn(
													"flex size-4 shrink-0 items-center justify-center rounded border border-input",
													isSelected
														? "border-primary bg-primary text-primary-foreground"
														: "bg-background"
												)}
											>
												{isSelected ? (
													<CheckCircle2Icon className="size-3" />
												) : null}
											</span>
										</button>
									);
								})
							) : (
								<p className="px-2.5 py-3 text-muted-foreground text-sm">
									No matching options.
								</p>
							)}
						</div>
					</div>
				) : null}
			</div>
			<FieldDescription description={field.description} />
		</div>
	);
}

function CheckboxListOption({
	checked,
	name,
	option,
}: {
	checked: boolean;
	name: string;
	option: FieldOption;
}) {
	const detail =
		option.description && option.description !== option.label
			? option.description
			: undefined;

	return (
		<label className="group inline-flex min-h-7 cursor-pointer items-center gap-2 text-sm">
			<input
				className="size-4 shrink-0 rounded border border-input bg-background accent-primary"
				defaultChecked={checked}
				name={name}
				type="checkbox"
				value={option.value}
			/>
			<span className="flex min-w-0 items-baseline gap-1.5">
				<span className="font-medium text-foreground leading-none">
					{option.label}
				</span>
				{detail ? (
					<span className="text-muted-foreground text-xs leading-none">
						{detail}
					</span>
				) : null}
			</span>
		</label>
	);
}

function InternationalPhoneField({
	defaultValue,
	field,
	fieldClassName,
}: {
	defaultValue: string;
	field: FieldConfig;
	fieldClassName: string;
}) {
	const parsedPhone = parseInternationalPhone(defaultValue);
	const [isDialCodeOpen, setIsDialCodeOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [selectedDialCode, setSelectedDialCode] = useState(
		parsedPhone.dialCode
	);
	const [selectedIso, setSelectedIso] = useState(parsedPhone.iso);
	const fieldRef = useRef<HTMLDivElement | null>(null);
	const localNumberId = `${field.name}-local`;
	const selectedCountry =
		internationalDialCodes.find(
			(option) =>
				option.dialCode === selectedDialCode && option.iso === selectedIso
		) ??
		internationalDialCodes.find(
			(option) => option.dialCode === selectedDialCode
		) ??
		internationalDialCodes[0];
	const normalizedSearchValue = searchValue.trim().toLowerCase();
	const filteredDialCodes = normalizedSearchValue
		? internationalDialCodes.filter((option) => {
				const searchableText =
					`${option.iso} ${option.dialCode} ${option.country}`.toLowerCase();

				return searchableText.includes(normalizedSearchValue);
			})
		: internationalDialCodes;

	useEffect(() => {
		if (!isDialCodeOpen) {
			return;
		}

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;

			if (!(target instanceof Node)) {
				return;
			}

			if (fieldRef.current?.contains(target)) {
				return;
			}

			setIsDialCodeOpen(false);
		};

		window.addEventListener("pointerdown", handlePointerDown);

		return () => {
			window.removeEventListener("pointerdown", handlePointerDown);
		};
	}, [isDialCodeOpen]);

	return (
		<div className={fieldClassName} ref={fieldRef}>
			<Label className={formLabelClass} htmlFor={localNumberId}>
				<FormLabelText field={field} />
			</Label>
			<div className="grid grid-cols-[96px_minmax(0,1fr)] rounded-lg border border-input bg-background shadow-xs transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
				<div className="relative rounded-l-lg border-border border-r bg-muted/25">
					<button
						aria-expanded={isDialCodeOpen}
						aria-label={`${field.label} country code`}
						className="flex h-9 w-full items-center justify-between gap-1 px-2.5 font-medium text-foreground text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
						onClick={() => setIsDialCodeOpen((current) => !current)}
						type="button"
					>
						<span className="min-w-0 truncate">
							{selectedCountry.iso} {selectedCountry.dialCode}
						</span>
						<ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
					</button>
					{isDialCodeOpen ? (
						<div className="absolute top-[calc(100%+0.25rem)] left-0 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-lg border bg-popover p-2 text-popover-foreground shadow-lg">
							<Input
								aria-label="Search country or region"
								className="h-8 rounded-md text-sm"
								onChange={(event) => setSearchValue(event.target.value)}
								placeholder="Search country, ISO, or code"
								value={searchValue}
							/>
							<div className="mt-2 max-h-64 overflow-y-auto">
								{filteredDialCodes.length > 0 ? (
									filteredDialCodes.map((option) => (
										<button
											className={cn(
												"flex min-h-9 w-full items-center justify-between gap-3 rounded-md px-2.5 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
												selectedCountry.iso === option.iso &&
													selectedCountry.dialCode === option.dialCode
													? "bg-muted font-medium"
													: ""
											)}
											key={`${option.iso}-${option.dialCode}`}
											onClick={() => {
												setSelectedDialCode(option.dialCode);
												setSelectedIso(option.iso);
												setIsDialCodeOpen(false);
												setSearchValue("");
											}}
											type="button"
										>
											<span className="min-w-0 truncate">{option.country}</span>
											<span className="shrink-0 text-muted-foreground">
												{option.iso} {option.dialCode}
											</span>
										</button>
									))
								) : (
									<p className="px-2.5 py-3 text-muted-foreground text-sm">
										No matching country code.
									</p>
								)}
							</div>
						</div>
					) : null}
					<input
						name={`${field.name}DialCode`}
						type="hidden"
						value={selectedDialCode}
					/>
				</div>
				<Input
					className="h-9 rounded-none border-0 bg-transparent px-3 text-sm shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
					defaultValue={parsedPhone.localNumber}
					id={localNumberId}
					name={`${field.name}LocalNumber`}
					placeholder={field.placeholder ?? "Phone number"}
					required={field.required}
					type="tel"
				/>
			</div>
			<FieldDescription description={field.description} />
		</div>
	);
}

function parseInternationalPhone(value: string) {
	const trimmedValue = value.trim();
	const matchingCode = internationalDialCodesByPrefix.find((option) =>
		trimmedValue.startsWith(option.dialCode)
	);
	const dialCode = matchingCode?.dialCode ?? defaultDialCode;
	const iso = matchingCode?.iso ?? "CN";
	const localNumber = matchingCode
		? trimmedValue.slice(matchingCode.dialCode.length).trim()
		: trimmedValue;

	return { dialCode, iso, localNumber };
}

function ProductPartPickerField({
	defaultValue,
	field,
	fieldClassName,
}: {
	defaultValue?: FormDefaultValue;
	field: FieldConfig;
	fieldClassName: string;
}) {
	const { locale, t } = useI18n();
	const options = field.options ?? [];
	const [selectedValues, setSelectedValues] = useState(() =>
		getCheckboxListDefaultValues(defaultValue)
	);
	const [isOpen, setIsOpen] = useState(false);
	const selectedOptions = getSelectedOptions(options, selectedValues);

	return (
		<div className={fieldClassName}>
			<Label className={formLabelClass} htmlFor={`${field.name}-picker`}>
				<FormLabelText field={field} />
			</Label>
			{selectedValues.map((value) => (
				<input key={value} name={field.name} type="hidden" value={value} />
			))}
			<div className="flex min-h-10 items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 shadow-xs transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
				<SearchIcon className="size-4 shrink-0 text-muted-foreground" />
				<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
					{selectedOptions.length > 0 ? (
						selectedOptions.map((option) => (
							<span
								className="inline-flex max-w-full items-center gap-1 rounded-md border border-border/70 bg-muted/50 px-2 py-1 font-medium text-xs"
								key={option.value}
							>
								<span className="truncate">{option.label}</span>
							</span>
						))
					) : (
						<span className="text-muted-foreground text-sm">
							{t("form.selectStandardParts")}
						</span>
					)}
				</div>
				<button
					aria-haspopup="dialog"
					className="inline-flex min-h-7 shrink-0 items-center gap-1 rounded-md px-2 font-medium text-muted-foreground text-xs hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
					id={`${field.name}-picker`}
					onClick={() => setIsOpen(true)}
					type="button"
				>
					<span>{translateServiceText(locale, "Select")}</span>
					<ChevronDownIcon className="size-4 shrink-0" />
				</button>
			</div>
			<FieldDescription description={field.description} />
			{isOpen ? (
				<ProductPartPickerDialog
					field={field}
					onApplyParts={setSelectedValues}
					onClose={() => setIsOpen(false)}
					options={options}
					selectedValues={selectedValues}
				/>
			) : null}
		</div>
	);
}

function ProductPartPickerDialog({
	field,
	onApplyParts,
	onClose,
	options,
	selectedValues,
}: {
	field: FieldConfig;
	onApplyParts: (partIds: string[]) => void;
	onClose: () => void;
	options: FieldOption[];
	selectedValues: string[];
}) {
	const { locale } = useI18n();
	const [searchQuery, setSearchQuery] = useState("");
	const [draftSelectedValues, setDraftSelectedValues] =
		useState(selectedValues);
	const selectedValueSet = new Set(draftSelectedValues);
	const selectedCount = draftSelectedValues.length;
	const partsSelectedLabel =
		locale === "en"
			? `${selectedCount} part${selectedCount === 1 ? "" : "s"} selected`
			: translateServiceText(locale, "parts selected").replace(
					"{count}",
					String(selectedCount)
				);
	const normalizedQuery = searchQuery.trim().toLowerCase();
	const filteredOptions =
		normalizedQuery.length > 0
			? options.filter((option) =>
					`${option.label} ${option.description ?? ""}`
						.toLowerCase()
						.includes(normalizedQuery)
				)
			: options;

	useEffect(() => {
		const handleKeyDown = (event: globalThis.KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				event.stopPropagation();
				onClose();
			}
		};

		window.addEventListener("keydown", handleKeyDown, { capture: true });

		return () => {
			window.removeEventListener("keydown", handleKeyDown, { capture: true });
		};
	}, [onClose]);

	const toggleDraftPart = (partId: string) => {
		setDraftSelectedValues((currentValues) =>
			currentValues.includes(partId)
				? currentValues.filter((currentValue) => currentValue !== partId)
				: [...currentValues, partId]
		);
	};

	return (
		<div
			aria-modal="true"
			className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/45 px-4 py-6"
			role="dialog"
		>
			<div className="flex max-h-[calc(100vh-3rem)] w-full max-w-[440px] flex-col rounded-xl bg-card p-5 shadow-2xl">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h3 className="font-semibold text-lg">
							{translateServiceText(locale, "Add Part to Product")}
						</h3>
						<div className="mt-4 border-border border-b">
							<p className="w-fit border-primary border-b-2 px-3 pb-2 font-medium text-primary text-sm">
								{translateServiceText(locale, "Search Existing")}
							</p>
						</div>
					</div>
					<Button
						aria-label={`Close ${field.label} picker`}
						className={compactButtonClass}
						onClick={onClose}
						size="icon-sm"
						type="button"
						variant="ghost"
					>
						<XIcon className="size-4" />
					</Button>
				</div>
				<Input
					aria-label={`Search ${field.label}`}
					className={cn(formControlClass, "mt-4 h-10")}
					onChange={(event) => setSearchQuery(event.target.value)}
					placeholder="Search parts by name or number..."
					value={searchQuery}
				/>
				<div className="mt-2 flex items-center justify-between gap-3 text-xs">
					<span className="text-muted-foreground">{partsSelectedLabel}</span>
					{selectedCount > 0 ? (
						<button
							className="font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
							onClick={() => setDraftSelectedValues([])}
							type="button"
						>
							{translateServiceText(locale, "Clear selected")}
						</button>
					) : null}
				</div>
				<div className="mt-3 max-h-64 overflow-y-auto rounded-lg border bg-background">
					{filteredOptions.length > 0 ? (
						filteredOptions.map((option) => {
							const isSelected = selectedValueSet.has(option.value);

							return (
								<label
									className={cn(
										"flex w-full cursor-pointer items-center gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted/60",
										isSelected ? "bg-primary/10" : ""
									)}
									key={option.value}
								>
									<input
										aria-label={`Select ${option.label}`}
										checked={isSelected}
										className="size-4 shrink-0 accent-primary"
										onChange={() => toggleDraftPart(option.value)}
										type="checkbox"
									/>
									<span className="min-w-0 flex-1">
										<span className="block truncate font-medium text-sm">
											{option.label}
										</span>
										{option.description ? (
											<span className="mt-1 block truncate font-mono text-muted-foreground text-xs">
												{option.description}
											</span>
										) : null}
									</span>
									<span className="shrink-0 text-muted-foreground text-sm">
										{option.meta}
									</span>
								</label>
							);
						})
					) : (
						<div className="px-4 py-8">
							<EmptyInline message="No matching parts." />
						</div>
					)}
				</div>
				<div className="mt-5 flex justify-between border-t pt-4">
					<Button
						className={compactButtonClass}
						onClick={onClose}
						type="button"
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						className={primaryActionClass}
						onClick={() => {
							onApplyParts(draftSelectedValues);
							onClose();
						}}
						type="button"
					>
						Done{selectedCount > 0 ? ` (${selectedCount})` : ""}
					</Button>
				</div>
			</div>
		</div>
	);
}

function getSelectedOptions(options: FieldOption[], values: string[]) {
	const optionByValue = new Map(
		options.map((option) => [option.value, option] as const)
	);

	return values.flatMap((value) => {
		const option = optionByValue.get(value);

		return option ? [option] : [];
	});
}

function FormLabelText({ field }: { field: FieldConfig }) {
	return (
		<>
			{field.label}
			{field.required ? <span aria-hidden="true"> *</span> : null}
		</>
	);
}

function FieldDescription({ description }: { description?: string }) {
	if (!description) {
		return null;
	}

	return <p className="mt-1 text-muted-foreground text-xs">{description}</p>;
}

function getInputDefaultValue(defaultValue: FormDefaultValue | undefined) {
	if (Array.isArray(defaultValue) || typeof defaultValue === "boolean") {
		return "";
	}

	return String(defaultValue ?? "");
}

function getSelectDefaultValue(
	defaultValue: FormDefaultValue | undefined,
	multiple?: boolean
) {
	if (multiple) {
		return Array.isArray(defaultValue) ? defaultValue.map(String) : [];
	}

	return getInputDefaultValue(defaultValue);
}

function getCheckboxListDefaultValues(
	defaultValue: FormDefaultValue | undefined
) {
	return Array.isArray(defaultValue) ? defaultValue.map(String) : [];
}

function useEntityMutations(tenantId: string, onDone: () => void) {
	const { t } = useI18n();
	const assetCreateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.assetCreated"),
		"asset",
		onDone
	);
	const assetUpdateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.assetUpdated"),
		"asset",
		onDone
	);
	const contractCreateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.contractCreated"),
		"contract",
		onDone
	);
	const contractUpdateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.contractUpdated"),
		"contract",
		onDone
	);
	const engineerCreateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.engineerCreated"),
		"engineer",
		onDone
	);
	const engineerUpdateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.engineerUpdated"),
		"engineer",
		onDone
	);
	const faultCreateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.faultCreated"),
		"fault report",
		onDone
	);
	const faultUpdateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.faultUpdated"),
		"fault report",
		onDone
	);
	const hospitalCreateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.hospitalCreated"),
		"hospital",
		onDone
	);
	const hospitalUpdateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.hospitalUpdated"),
		"hospital",
		onDone
	);
	const jobCreateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.jobCreated"),
		"job",
		onDone
	);
	const jobUpdateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.jobUpdated"),
		"job",
		onDone
	);
	const partCreateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.partCreated"),
		"part",
		onDone
	);
	const partUpdateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.partUpdated"),
		"part",
		onDone
	);
	const productCreateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.productCreated"),
		"product",
		onDone
	);
	const productUpdateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.productUpdated"),
		"product",
		onDone
	);
	const tenantCreateSuccess = useTenantMutationSuccess(
		t("service.toast.tenantCreated"),
		"tenant",
		onDone
	);
	const tenantUpdateSuccess = useTenantMutationSuccess(
		t("service.toast.tenantUpdated"),
		"tenant",
		onDone
	);
	const tenantUserCreateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.userCreated"),
		"user",
		onDone
	);
	const tenantUserUpdateSuccess = useMutationSuccess(
		tenantId,
		t("service.toast.userUpdated"),
		"user",
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
		createTenant: useMutation(
			trpc.serviceOps.createTenant.mutationOptions(tenantCreateSuccess)
		),
		createTenantUser: useMutation(
			trpc.serviceOps.createTenantUser.mutationOptions(tenantUserCreateSuccess)
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
		updateTenant: useMutation(
			trpc.serviceOps.updateTenant.mutationOptions(tenantUpdateSuccess)
		),
		updateTenantUser: useMutation(
			trpc.serviceOps.updateTenantUser.mutationOptions(tenantUserUpdateSuccess)
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
		tenant: submitTenantForm,
		tenantUser: submitTenantUserForm,
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

function submitTenantForm({
	formData,
	mutations,
	state,
	tenantId,
}: SubmitFormArgs) {
	const data = buildTenantPayload(formData);
	if (state.mode === "create") {
		mutations.createTenant.mutate({ data });
		return;
	}
	mutations.updateTenant.mutate({ data, id: getUpdateId(state), tenantId });
}

function submitTenantUserForm({
	formData,
	mutations,
	state,
	tenantId,
}: SubmitFormArgs) {
	const data = buildTenantUserPayload(formData);
	if (state.mode === "create") {
		mutations.createTenantUser.mutate({ data, tenantId });
		return;
	}
	mutations.updateTenantUser.mutate({
		data,
		id: getUpdateId(state),
		tenantId,
	});
}

function RowActions({
	canWrite,
	deleteDisabled,
	deleteDisabledReason,
	entity,
	id,
	onEdit,
	tenantId,
}: {
	canWrite: boolean;
	deleteDisabled?: boolean;
	deleteDisabledReason?: string;
	entity: CrudEntity;
	id: string;
	onEdit: () => void;
	tenantId: string;
}) {
	const { locale, t } = useI18n();
	const deleteMutation = useDeleteMutation(entity, tenantId);
	const isDeleting = deleteMutation.isPending;
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const destructiveActionLabel = destructiveActionLabels[entity];
	const entityLabel = translateServiceText(locale, entityLabels[entity]);
	let deleteButtonContent: ReactNode = <Trash2Icon className="size-4" />;

	if (entity === "tenantUser") {
		deleteButtonContent = <UserXIcon className="size-4" />;
	} else if (entity === "tenant") {
		deleteButtonContent = <PowerOffIcon className="size-4" />;
	}

	useEffect(() => {
		if (!isConfirmingDelete) {
			return;
		}

		const resetConfirmation = window.setTimeout(() => {
			setIsConfirmingDelete(false);
		}, deleteConfirmationTimeoutMs);

		return () => {
			window.clearTimeout(resetConfirmation);
		};
	}, [isConfirmingDelete]);

	if (isDeleting) {
		deleteButtonContent = <Loader2Icon className="size-4 animate-spin" />;
	} else if (isConfirmingDelete) {
		deleteButtonContent = t("common.confirm");
	}

	const handleDelete = () => {
		if (!isConfirmingDelete) {
			setIsConfirmingDelete(true);
			return;
		}

		deleteMutation.mutate({ id, tenantId });
	};

	if (!canWrite) {
		return null;
	}

	return (
		<div className="inline-flex items-center justify-end gap-4">
			<Button
				aria-label={`${t("common.edit")} ${entityLabel}`}
				className={compactButtonClass}
				onClick={onEdit}
				size="icon-sm"
				variant="ghost"
			>
				<EditIcon className="size-4" />
			</Button>
			<Button
				aria-label={
					isConfirmingDelete
						? `${t("common.confirm")} ${translateServiceText(
								locale,
								destructiveActionLabel
							)} ${entityLabel}`
						: `${translateServiceText(
								locale,
								titleCase(destructiveActionLabel)
							)} ${entityLabel}`
				}
				className={cn(
					compactButtonClass,
					isConfirmingDelete
						? "w-auto px-2"
						: "text-muted-foreground hover:text-destructive"
				)}
				disabled={deleteDisabled || isDeleting}
				onBlur={() => setIsConfirmingDelete(false)}
				onClick={handleDelete}
				size={isConfirmingDelete ? "sm" : "icon-sm"}
				title={deleteDisabled ? deleteDisabledReason : undefined}
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
	errorLabel = "record",
	onDone?: () => void
) {
	return useMutationResult(tenantId, label, errorLabel, "save", onDone);
}

function useMutationResult(
	tenantId: string,
	label: string,
	errorLabel: string,
	errorAction: ServiceOpsAction,
	onDone?: () => void
) {
	const queryClient = useQueryClient();
	const { t } = useI18n();

	return {
		onError(error: { message?: string }) {
			const businessError = getServiceOpsMutationError({
				action: errorAction,
				entityLabel: errorLabel,
				message: error.message,
				t,
			});

			toast.error(businessError.title, {
				description: businessError.description,
			});
		},
		onSuccess() {
			toast.success(label);
			onDone?.();
			queryClient
				.invalidateQueries(trpc.serviceOps.snapshot.queryFilter({ tenantId }))
				.catch(() => {
					toast.error(t("service.toast.refreshFailed"));
				});
		},
	};
}

function useTenantMutationSuccess(
	label: string,
	errorLabel = "tenant",
	onDone?: () => void
) {
	return useTenantMutationResult(label, errorLabel, "save", onDone);
}

function useTenantMutationResult(
	label: string,
	errorLabel: string,
	errorAction: ServiceOpsAction,
	onDone?: () => void
) {
	const queryClient = useQueryClient();
	const { t } = useI18n();

	return {
		onError(error: { message?: string }) {
			const businessError = getServiceOpsMutationError({
				action: errorAction,
				entityLabel: errorLabel,
				message: error.message,
				t,
			});

			toast.error(businessError.title, {
				description: businessError.description,
			});
		},
		onSuccess() {
			toast.success(label);
			onDone?.();
			queryClient
				.invalidateQueries(trpc.serviceOps.snapshot.queryFilter())
				.catch(() => {
					toast.error(t("service.toast.refreshFailed"));
				});
		},
	};
}

function useDeleteMutation(entity: CrudEntity, tenantId: string) {
	const { locale, t } = useI18n();
	const actionLabel = destructiveActionLabels[entity];
	const entityLabel = translateServiceText(locale, entityLabels[entity]);
	const successLabel = t("toast.service.actionCompleted", {
		action: t(getPastTenseActionKey(actionLabel)),
		entity: entityLabel,
	});
	const entityDeleteSuccess = useMutationResult(
		tenantId,
		successLabel,
		entityLabel,
		actionLabel
	);
	const tenantDeleteSuccess = useTenantMutationResult(
		successLabel,
		entityLabel,
		actionLabel
	);
	const successOptions =
		entity === "tenant" ? tenantDeleteSuccess : entityDeleteSuccess;
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
		tenant: useMutation(
			trpc.serviceOps.deleteTenant.mutationOptions(successOptions)
		),
		tenantUser: useMutation(
			trpc.serviceOps.deleteTenantUser.mutationOptions(successOptions)
		),
	};

	return mutations[entity];
}

function PageFrame({
	action,
	children,
	description,
	eyebrow,
	hideHeader = false,
	title,
	width = "contained",
}: {
	action?: ReactNode;
	children: ReactNode;
	description?: string;
	eyebrow: string;
	hideHeader?: boolean;
	title: string;
	width?: "contained" | "full";
}) {
	let frameHeader: ReactNode = null;

	if (hideHeader) {
		frameHeader = action ? (
			<div className="flex justify-end">{action}</div>
		) : null;
	} else {
		frameHeader = (
			<div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<PageHeader description={description} eyebrow={eyebrow} title={title} />
				{action ? <div className="flex shrink-0">{action}</div> : null}
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex w-full min-w-0 flex-col gap-4 md:gap-6",
				width === "contained" ? "mx-auto max-w-[1320px]" : ""
			)}
		>
			{frameHeader}
			{children}
		</div>
	);
}

function PageHeader({
	description,
	eyebrow,
	title,
}: {
	description?: string;
	eyebrow: string;
	title: string;
}) {
	const { locale } = useI18n();

	return (
		<div className="max-w-3xl">
			<p className="font-medium text-muted-foreground text-xs">
				{translateServiceText(locale, eyebrow)}
			</p>
			<h2 className="mt-1 font-medium text-3xl tracking-tight">
				{translateServiceText(locale, title)}
			</h2>
			{description ? (
				<p className="mt-1 text-muted-foreground text-sm leading-relaxed">
					{translateServiceText(locale, description)}
				</p>
			) : null}
		</div>
	);
}

function Button({
	children,
	title,
	...props
}: ComponentProps<typeof UiButton>) {
	const { locale } = useI18n();

	return (
		<UiButton
			title={
				typeof title === "string" ? translateServiceText(locale, title) : title
			}
			{...props}
		>
			{localizeServiceNode(children, locale)}
		</UiButton>
	);
}

function CardTitle({ children, ...props }: ComponentProps<typeof UiCardTitle>) {
	const { locale } = useI18n();

	return (
		<UiCardTitle {...props}>
			{localizeServiceNode(children, locale)}
		</UiCardTitle>
	);
}

function Input({
	"aria-label": ariaLabel,
	placeholder,
	title,
	...props
}: ComponentProps<typeof UiInput>) {
	const { locale } = useI18n();

	return (
		<UiInput
			aria-label={
				typeof ariaLabel === "string"
					? translateServiceText(locale, ariaLabel)
					: ariaLabel
			}
			placeholder={
				typeof placeholder === "string"
					? translateServiceText(locale, placeholder)
					: placeholder
			}
			title={
				typeof title === "string" ? translateServiceText(locale, title) : title
			}
			{...props}
		/>
	);
}

function Label({ children, ...props }: ComponentProps<typeof UiLabel>) {
	const { locale } = useI18n();

	return <UiLabel {...props}>{localizeServiceNode(children, locale)}</UiLabel>;
}

function StatusPill({
	children,
	className,
}: {
	children: ReactNode;
	className: string;
}) {
	const { locale } = useI18n();

	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium text-xs ${className}`}
		>
			{localizeServiceNode(children, locale)}
		</span>
	);
}

function LocalizedText({
	as = "span",
	children,
	className,
}: {
	as?: "p" | "span";
	children: ReactNode;
	className?: string;
}) {
	const { locale } = useI18n();
	const Component = as;

	return (
		<Component className={className}>
			{localizeServiceNode(children, locale)}
		</Component>
	);
}

function HospitalLocationCell({
	address,
	lat,
	lng,
}: {
	address: null | string;
	lat: number;
	lng: number;
}) {
	const hasCoordinates = lat !== 0 || lng !== 0;

	if (!hasCoordinates) {
		return (
			<div className="inline-flex min-w-[140px] items-center gap-2 rounded-md border border-border border-dashed bg-muted/20 px-2 py-1.5 text-muted-foreground">
				<span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-background">
					<MapPinOffIcon className="size-3.5" />
				</span>
				<div className="min-w-0">
					<p className="font-medium text-foreground text-xs">Not pinned</p>
					<p className="text-[11px] leading-tight">Add coordinates</p>
				</div>
			</div>
		);
	}

	const latitudeLabel = formatCoordinate(lat, "lat");
	const longitudeLabel = formatCoordinate(lng, "lng");
	const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
		`${lat},${lng}`
	)}`;

	return (
		<a
			aria-label={`Open ${latitudeLabel}, ${longitudeLabel} in Google Maps`}
			className="group relative inline-flex min-w-[150px] max-w-[180px] items-center gap-2 rounded-md border border-sky-200 bg-sky-50/70 px-2 py-1.5 text-left transition-colors hover:border-sky-300 hover:bg-sky-100/70 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-200"
			href={mapUrl}
			rel="noopener"
			target="_blank"
			title={address ?? `${latitudeLabel}, ${longitudeLabel}`}
		>
			<span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-white text-sky-700 shadow-xs ring-1 ring-sky-200">
				<MapPinIcon className="size-3.5" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate font-medium text-[11px] text-sky-950 tabular-nums leading-tight">
					{latitudeLabel}, {longitudeLabel}
				</span>
			</span>
			<ExternalLinkIcon className="pointer-events-none absolute top-1.5 right-1.5 size-3 text-sky-700 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
		</a>
	);
}

function formatCoordinate(value: number, axis: "lat" | "lng") {
	if (axis === "lat") {
		return `${coordinateFormatter.format(Math.abs(value))} ${
			value >= 0 ? "N" : "S"
		}`;
	}

	return `${coordinateFormatter.format(Math.abs(value))} ${
		value >= 0 ? "E" : "W"
	}`;
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
	const { locale } = useI18n();

	return (
		<div className={`${mutedPanelClass} p-3`}>
			<p className="text-muted-foreground text-xs">
				{translateServiceText(locale, label)}
			</p>
			<p className="mt-1 font-medium text-sm">
				{localizeServiceNode(value, locale)}
			</p>
		</div>
	);
}

function DashboardStatCard({
	stat,
}: {
	stat: ServiceOpsSnapshot["dashboardStats"][number];
}) {
	const { locale, t } = useI18n();
	const isPrimary = stat.id === "open-jobs";

	return (
		<Card
			className={cn(
				dashboardStatCardClass,
				isPrimary
					? "bg-muted/15 shadow-[0_16px_42px_-30px_rgb(0_0_0_/_0.55)]"
					: ""
			)}
		>
			<CardHeader className="px-5">
				<CardTitle className="text-muted-foreground text-sm">
					{stat.label}
				</CardTitle>
				<CardAction>
					<ArrowUpRightIcon className="size-4 text-muted-foreground" />
				</CardAction>
			</CardHeader>
			<CardContent className="flex flex-col gap-3 px-5">
				<div className="flex items-center justify-between gap-3">
					<p className="font-semibold text-3xl leading-none tracking-normal">
						{stat.value}
					</p>
					<span className="shrink-0" title={t("service.dashboard.liveData")}>
						<span
							aria-hidden="true"
							className="block size-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgb(16_185_129_/_0.14)]"
						/>
						<span className="sr-only">{t("service.dashboard.liveData")}</span>
					</span>
				</div>
				<p className="text-foreground/80 text-sm leading-relaxed">
					{getDashboardStatMetaLabel(stat.meta, locale)}
				</p>
			</CardContent>
		</Card>
	);
}

function getDashboardStatMetaLabel(value: string, locale: AppLocale) {
	const urgentMatch = dashboardUrgentMetaRegex.exec(value);

	if (urgentMatch?.[1] && urgentMatch[2]) {
		return `${urgentMatch[1]} ${translateServiceText(locale, "urgent")}, ${urgentMatch[2]} ${translateServiceText(locale, "anomaly")}`;
	}

	const severityMatch = dashboardSeverityMetaRegex.exec(value);

	if (severityMatch?.[1]) {
		return `${severityMatch[1]} ${translateServiceText(locale, "high or critical")}`;
	}

	return translateServiceText(locale, value);
}

function translateLiveAlertMessage(value: string, locale: AppLocale) {
	const timerMatch = timerAlertMessageRegex.exec(value);

	if (timerMatch?.[1] && timerMatch[2] && timerMatch[3]) {
		return translateServiceText(
			locale,
			"{engineer} left {hospital} while {job} timer is running."
		)
			.replace("{engineer}", timerMatch[1])
			.replace("{hospital}", timerMatch[2])
			.replace("{job}", timerMatch[3]);
	}

	const pmMatch = pmAlertMessageRegex.exec(value);

	if (pmMatch?.[1] && pmMatch[2] && pmMatch[3]) {
		return translateServiceText(
			locale,
			"{engineer} is on-site at {hospital}. {asset} PM is due soon."
		)
			.replace("{engineer}", pmMatch[1])
			.replace("{hospital}", pmMatch[2])
			.replace("{asset}", pmMatch[3]);
	}

	const contractMatch = contractAlertMessageRegex.exec(value);

	if (contractMatch?.[1] && contractMatch[2]) {
		return translateServiceText(
			locale,
			"{hospital} contract expires on {date}."
		)
			.replace("{hospital}", contractMatch[1])
			.replace("{date}", contractMatch[2]);
	}

	return translateServiceText(locale, value);
}

function localizeServiceNode(node: ReactNode, locale: AppLocale): ReactNode {
	if (typeof node === "string") {
		return translateServiceText(locale, node);
	}

	if (typeof node === "number") {
		return node;
	}

	if (Array.isArray(node)) {
		return node.map((child) => localizeServiceNode(child, locale));
	}

	if (isValidElement<{ children?: ReactNode }>(node)) {
		const children = node.props.children;

		if (children === undefined) {
			return node;
		}

		return cloneElement(node, {
			children: Children.map(children, (child) =>
				localizeServiceNode(child, locale)
			),
		});
	}

	return node;
}

function buildJobActivityBars(jobs: Job[]) {
	const activityLabels = ["Created", "Assigned", "On-site", "Closed"] as const;
	const counts = {
		Assigned: jobs.filter((job) => job.status === "Assigned").length,
		Closed: jobs.filter((job) => job.status === "Completed").length,
		Created: jobs.filter((job) => job.status === "Created").length,
		"On-site": jobs.filter(
			(job) =>
				job.status === "In Progress" ||
				job.status === "Paused" ||
				job.status === "Timer Anomaly"
		).length,
	};
	const maxCount = Math.max(...Object.values(counts), 1);

	return activityLabels.map((label) => ({
		count: counts[label],
		height: Math.max(18, Math.round((counts[label] / maxCount) * 100)),
		id: label,
		label,
	}));
}

function SegmentedProgress({
	active,
	total,
}: {
	active: number;
	total: number;
}) {
	const progressPercent = Math.round((active / Math.max(total, 1)) * 100);

	return (
		<div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
			<div
				className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-chart-4),var(--color-chart-2))] transition-[width]"
				style={{ width: `${Math.min(progressPercent, 100)}%` }}
			/>
		</div>
	);
}

function StateMachine({ currentStatus }: { currentStatus: JobStatus }) {
	const activeIndex = serviceStateMachine.indexOf(
		currentStatus as (typeof serviceStateMachine)[number]
	);

	return (
		<div className="flex flex-col gap-2">
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
		<div className="flex items-center gap-2 rounded-lg bg-card px-2 py-1 text-xs shadow-xs ring-1 ring-foreground/10">
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
		<div className="flex items-center gap-2 rounded-lg bg-foreground px-2 py-1 text-background text-xs shadow-xs">
			<span className={`size-3 rounded-full ${engineerStatusStyles[status]}`} />
			{engineer}
		</div>
	);
}
