"use client";

import { Button } from "@luke/ui/components/button";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@luke/ui/components/card";
import { cn } from "@luke/ui/lib/utils";
import {
	ArrowRightIcon,
	BellOffIcon,
	BookOpenIcon,
	CalendarDaysIcon,
	CheckSquareIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	Clock3Icon,
	FileTextIcon,
	FocusIcon,
	GlobeIcon,
	LayoutDashboardIcon,
	OrbitIcon,
	PlusIcon,
	QuoteIcon,
	SettingsIcon,
	TrendingUpIcon,
	UploadIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

type TaskRange = "today" | "tomorrow" | "week";
type ProjectFilter = "active" | "planning" | "completed";
type AccentDensity = "comfortable" | "compact";

interface Task {
	checked: boolean;
	range: TaskRange;
	tag: string;
	time: string;
	title: string;
}

interface Project {
	description: string;
	due: string;
	progress: number;
	status: "Active" | "Planning" | "Completed";
	title: string;
}

interface CalendarDay {
	date: number;
	day: string;
	muted?: boolean;
	selected?: boolean;
}

const summaryCards = [
	{
		description: "tasks scheduled",
		icon: Clock3Icon,
		title: "Today",
		value: "4",
	},
	{
		description: "progress",
		icon: TrendingUpIcon,
		title: "This Week",
		value: "68%",
	},
	{
		description: "2 hours remaining",
		icon: FocusIcon,
		title: "Focus",
		value: "Deep Work",
	},
] as const;

const initialTasks: Task[] = [
	{
		checked: false,
		range: "today",
		tag: "Work",
		time: "10:00 AM",
		title: "Finalize Q2 roadmap",
	},
	{
		checked: true,
		range: "today",
		tag: "Design",
		time: "11:30 AM",
		title: "Review design system updates",
	},
	{
		checked: false,
		range: "today",
		tag: "Admin",
		time: "2:00 PM",
		title: "Reply to important emails",
	},
	{
		checked: false,
		range: "week",
		tag: "Content",
		time: "4:30 PM",
		title: "Plan creator content for this week",
	},
	{
		checked: false,
		range: "tomorrow",
		tag: "Planning",
		time: "9:00 AM",
		title: "Prepare weekly team sync notes",
	},
];

const projects: Project[] = [
	{
		description: "Ship better, ship smarter.",
		due: "Due Jun 4",
		progress: 68,
		status: "Active",
		title: "Q2 Roadmap",
	},
	{
		description: "Clean, modern, and fast.",
		due: "Due Jun 16",
		progress: 42,
		status: "Planning",
		title: "Website Redesign",
	},
	{
		description: "Trim first-run steps.",
		due: "Due Jun 13",
		progress: 31,
		status: "Planning",
		title: "Onboarding",
	},
];

const recentNotes = [
	{ date: "Today", icon: FileTextIcon, title: "Design principles that scale" },
	{ date: "Yesterday", icon: FileTextIcon, title: "Content ideas - May" },
	{ date: "May 22", icon: FileTextIcon, title: "Lessons from the week" },
	{ date: "May 21", icon: BookOpenIcon, title: "Books I'm Reading" },
] as const;

const quickActions = [
	{ icon: FileTextIcon, label: "New Note" },
	{ icon: CheckSquareIcon, label: "New Task" },
	{ icon: OrbitIcon, label: "New Project" },
	{ icon: FocusIcon, label: "New Goal" },
	{ icon: UploadIcon, label: "Upload" },
] as const;

const calendarDays: CalendarDay[] = [
	{ day: "Mon", date: 18, muted: true },
	{ day: "Tue", date: 19, muted: true },
	{ day: "Wed", date: 20, muted: true },
	{ day: "Thu", date: 21, muted: true },
	{ day: "Fri", date: 22, muted: true },
	{ day: "Sat", date: 23, muted: true },
	{ day: "Sun", date: 24, muted: true },
	{ day: "Mon", date: 25 },
	{ day: "Tue", date: 26, selected: true },
	{ day: "Wed", date: 27 },
	{ day: "Thu", date: 28 },
	{ day: "Fri", date: 29 },
	{ day: "Sat", date: 30 },
	{ day: "Sun", date: 31 },
] as const;

const preferenceItems = [
	{ label: "Theme preset", value: "Default" },
	{ label: "Content width", value: "Centered" },
	{ label: "Navbar", value: "Sticky" },
] as const;

const rangeLabels: Record<TaskRange, string> = {
	today: "Today",
	tomorrow: "Tomorrow",
	week: "This Week",
};

const projectFilterLabels: Record<ProjectFilter, string> = {
	active: "Active",
	completed: "Completed",
	planning: "Planning",
};

export default function ProductivityDashboard() {
	const [tasks, setTasks] = useState(initialTasks);
	const [taskRange, setTaskRange] = useState<TaskRange>("today");
	const [projectFilter, setProjectFilter] = useState<ProjectFilter>("active");
	const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
	const [density, setDensity] = useState<AccentDensity>("comfortable");

	const visibleTasks = useMemo(() => {
		if (taskRange === "week") {
			return tasks;
		}

		return tasks.filter((task) => task.range === taskRange);
	}, [taskRange, tasks]);

	const visibleProjects = useMemo(() => {
		if (projectFilter === "active") {
			return projects.filter((project) => project.status !== "Completed");
		}

		const statusLabel = projectFilterLabels[projectFilter];

		return projects.filter((project) => project.status === statusLabel);
	}, [projectFilter]);

	const completedTaskCount = tasks.filter((task) => task.checked).length;

	const toggleTask = (title: string) => {
		setTasks((currentTasks) =>
			currentTasks.map((task) =>
				task.title === title ? { ...task, checked: !task.checked } : task
			)
		);
	};

	return (
		<main className="min-h-svh bg-background text-foreground">
			<div className="grid min-h-svh grid-cols-1 lg:grid-cols-[264px_minmax(0,1fr)]">
				<DashboardSidebar />
				<div className="min-w-0">
					<header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
						<div className="min-w-0">
							<p className="text-muted-foreground text-xs">Dashboard</p>
							<p className="truncate font-medium text-sm">Productivity</p>
						</div>
						<div className="flex items-center gap-3">
							<IconButton
								ariaLabel="Open dashboard preferences"
								isPressed={isPreferencesOpen}
								onClick={() => setIsPreferencesOpen((isOpen) => !isOpen)}
							>
								<SettingsIcon />
							</IconButton>
						</div>
					</header>

					<div
						className={cn(
							"mx-auto grid w-full max-w-screen-2xl gap-6 p-4 md:p-6 lg:grid-cols-12",
							density === "compact" && "gap-4 md:p-4"
						)}
					>
						<section className="flex min-w-0 flex-col gap-6 lg:col-span-9">
							<div className="flex flex-col gap-2">
								<h1 className="font-semibold text-3xl leading-none tracking-tight">
									Good morning, Harold.
								</h1>
								<p className="text-lg text-muted-foreground leading-none">
									Let&apos;s make today productive and meaningful.
								</p>
							</div>

							<SummaryCards />
							<TasksSection
								onRangeChange={setTaskRange}
								onToggleTask={toggleTask}
								range={taskRange}
								tasks={visibleTasks}
							/>
							<ProjectsSection
								filter={projectFilter}
								onFilterChange={setProjectFilter}
								projects={visibleProjects}
							/>
							<QuickActions />
							<QuoteCard />
						</section>

						<section className="flex min-w-0 flex-col gap-6 lg:col-span-3">
							{isPreferencesOpen ? (
								<PreferencesPanel
									density={density}
									onDensityChange={setDensity}
								/>
							) : null}
							<CalendarPanel />
							<FocusCard completedTaskCount={completedTaskCount} />
							<RecentNotesCard />
							<WeeklySummaryCard completedTaskCount={completedTaskCount} />
						</section>
					</div>
				</div>
			</div>
		</main>
	);
}

function DashboardSidebar() {
	const navItems = [
		{ active: true, icon: LayoutDashboardIcon, label: "Productivity" },
		{ active: false, icon: CalendarDaysIcon, label: "Calendar" },
		{ active: false, icon: CheckSquareIcon, label: "Tasks" },
		{ active: false, icon: FileTextIcon, label: "Notes" },
	] as const;

	return (
		<aside className="border-b bg-sidebar text-sidebar-foreground lg:min-h-svh lg:border-r lg:border-b-0">
			<div className="flex h-16 items-center gap-3 border-b px-4">
				<div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
					<OrbitIcon className="size-4" />
				</div>
				<div>
					<p className="font-semibold text-sm">Next Admin</p>
					<p className="text-muted-foreground text-xs">Workspace</p>
				</div>
			</div>
			<nav className="flex gap-2 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible">
				{navItems.map((item) => {
					const Icon = item.icon;

					return (
						<button
							aria-current={item.active ? "page" : undefined}
							className={cn(
								"flex h-9 min-w-max cursor-pointer items-center gap-3 rounded-md px-3 text-left text-sm transition-colors lg:w-full",
								item.active
									? "bg-sidebar-accent text-sidebar-accent-foreground shadow-xs"
									: "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
							)}
							key={item.label}
							type="button"
						>
							<Icon className="size-4" />
							{item.label}
						</button>
					);
				})}
			</nav>
		</aside>
	);
}

function IconButton({
	ariaLabel,
	children,
	isPressed,
	onClick,
}: {
	ariaLabel: string;
	children: React.ReactNode;
	isPressed?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			aria-label={ariaLabel}
			aria-pressed={isPressed}
			className="flex size-12 cursor-pointer items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
			onClick={onClick}
			type="button"
		>
			<span className="flex size-6 items-center justify-center [&_svg]:size-6">
				{children}
			</span>
		</button>
	);
}

function SummaryCards() {
	return (
		<div className="grid gap-4 md:grid-cols-3">
			{summaryCards.map((item) => {
				const Icon = item.icon;

				return (
					<Card className="rounded-lg shadow-xs" key={item.title}>
						<CardHeader>
							<CardTitle>
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<div className="grid size-7 place-items-center rounded-lg border bg-muted">
										<Icon className="size-4" />
									</div>
									{item.title}
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-2">
								<div className="font-semibold text-2xl leading-none tracking-tight">
									{item.value}
								</div>
								<div className="flex items-center justify-between">
									<p className="text-muted-foreground tabular-nums leading-none">
										{item.description}
									</p>
									<ArrowRightIcon className="size-4 text-muted-foreground" />
								</div>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

function TasksSection({
	onRangeChange,
	onToggleTask,
	range,
	tasks,
}: {
	onRangeChange: (range: TaskRange) => void;
	onToggleTask: (title: string) => void;
	range: TaskRange;
	tasks: Task[];
}) {
	return (
		<section className="flex flex-col gap-2">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="font-medium text-xl tracking-tight">Tasks</h2>
				<div className="flex items-center gap-2">
					<SelectLike
						ariaLabel="Task range"
						onChange={(value) => onRangeChange(value as TaskRange)}
						options={rangeLabels}
						value={range}
					/>
					<Button className="rounded-md">
						<PlusIcon data-icon="inline-start" />
						New Task
					</Button>
				</div>
			</div>

			<div className="overflow-hidden rounded-lg border bg-background shadow-xs">
				<div className="divide-y">
					{tasks.map((task) => (
						<div className="flex items-center gap-3 p-4" key={task.title}>
							<button
								aria-label={task.title}
								aria-pressed={task.checked}
								className={cn(
									"flex size-4 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors",
									task.checked
										? "border-primary bg-primary text-primary-foreground"
										: "border-input bg-background hover:bg-muted"
								)}
								onClick={() => onToggleTask(task.title)}
								type="button"
							>
								{task.checked ? (
									<CheckSquareIcon className="size-3" />
								) : (
									<span className="sr-only">Mark complete</span>
								)}
							</button>
							<div className="min-w-0 flex-1">
								<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
									<div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
										<span
											className={cn(
												"truncate text-sm",
												task.checked && "text-muted-foreground line-through"
											)}
										>
											{task.title}
										</span>
										<span className="inline-flex w-fit items-center rounded-full border px-3 py-1 font-normal text-xs">
											{task.tag}
										</span>
									</div>
									<div className="flex shrink-0 items-center gap-3 text-muted-foreground text-sm">
										<span>{task.time}</span>
										<CalendarDaysIcon className="size-4" />
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function ProjectsSection({
	filter,
	onFilterChange,
	projects: visibleProjects,
}: {
	filter: ProjectFilter;
	onFilterChange: (filter: ProjectFilter) => void;
	projects: Project[];
}) {
	return (
		<section className="flex flex-col gap-2">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="font-medium text-xl tracking-tight">Projects</h2>
				<div className="flex items-center gap-2">
					<SelectLike
						ariaLabel="Project filter"
						onChange={(value) => onFilterChange(value as ProjectFilter)}
						options={projectFilterLabels}
						value={filter}
					/>
					<Button className="rounded-md" variant="outline">
						<PlusIcon data-icon="inline-start" />
						New
					</Button>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				{visibleProjects.map((project) => {
					const ProjectIcon =
						project.title === "Website Redesign" ? GlobeIcon : OrbitIcon;

					return (
						<Card className="rounded-lg shadow-xs" key={project.title}>
							<CardHeader>
								<CardTitle>
									<div className="flex items-center gap-2">
										<ProjectIcon className="size-4 text-muted-foreground" />
										<span>{project.title}</span>
									</div>
								</CardTitle>
								<CardAction>
									<span className="inline-flex rounded-full border px-2 py-0.5 text-xs">
										{project.status}
									</span>
								</CardAction>
							</CardHeader>
							<CardContent>
								<div className="flex flex-col gap-3">
									<div className="text-sm leading-none">
										{project.description}
									</div>
									<div className="flex items-center gap-3">
										<ProgressBar value={project.progress} />
										<span className="shrink-0 text-sm">
											{project.progress}%
										</span>
									</div>
								</div>
							</CardContent>
							<CardFooter className="py-2.5">
								<span className="text-muted-foreground">{project.due}</span>
							</CardFooter>
						</Card>
					);
				})}
			</div>
		</section>
	);
}

function QuickActions() {
	return (
		<section className="flex flex-col gap-2">
			<h2 className="font-medium text-xl tracking-tight">Quick Actions</h2>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
				{quickActions.map((action) => {
					const Icon = action.icon;

					return (
						<Button
							className="justify-start rounded-md"
							key={action.label}
							variant="outline"
						>
							<Icon data-icon="inline-start" />
							{action.label}
						</Button>
					);
				})}
			</div>
		</section>
	);
}

function QuoteCard() {
	return (
		<section className="rounded-lg border bg-card p-6 shadow-xs">
			<div className="flex items-start gap-4">
				<div className="grid size-8 shrink-0 place-items-center text-muted-foreground">
					<QuoteIcon className="size-6" />
				</div>
				<div className="flex flex-col gap-1">
					<p className="text-xl leading-none tracking-tight">
						Small, consistent actions lead to big results.
					</p>
					<p className="text-muted-foreground">
						Keep showing up. You&apos;ve got this.
					</p>
				</div>
			</div>
		</section>
	);
}

function PreferencesPanel({
	density,
	onDensityChange,
}: {
	density: AccentDensity;
	onDensityChange: (density: AccentDensity) => void;
}) {
	return (
		<Card className="rounded-lg shadow-xs">
			<CardHeader>
				<CardTitle>Preferences</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{preferenceItems.map((item) => (
					<div
						className="flex items-center justify-between gap-3"
						key={item.label}
					>
						<span className="text-muted-foreground text-xs">{item.label}</span>
						<span className="font-medium text-xs">{item.value}</span>
					</div>
				))}
				<div className="grid grid-cols-2 rounded-md border p-1">
					{(["comfortable", "compact"] as const).map((item) => (
						<button
							className={cn(
								"h-8 rounded-sm text-xs capitalize transition-colors",
								density === item
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:bg-muted"
							)}
							key={item}
							onClick={() => onDensityChange(item)}
							type="button"
						>
							{item}
						</button>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function CalendarPanel() {
	return (
		<Card className="rounded-lg shadow-xs">
			<CardContent>
				<div className="flex items-center justify-between pb-4">
					<button
						aria-label="Previous month"
						className="grid size-8 cursor-pointer place-items-center rounded-md border hover:bg-muted"
						type="button"
					>
						<ChevronLeftIcon className="size-4" />
					</button>
					<div className="font-medium text-sm">May 2026</div>
					<button
						aria-label="Next month"
						className="grid size-8 cursor-pointer place-items-center rounded-md border hover:bg-muted"
						type="button"
					>
						<ChevronRightIcon className="size-4" />
					</button>
				</div>
				<div className="grid grid-cols-7 gap-1 text-center">
					{calendarDays.slice(0, 7).map((day) => (
						<div className="text-[11px] text-muted-foreground" key={day.day}>
							{day.day.slice(0, 2)}
						</div>
					))}
					{calendarDays.map((day) => (
						<button
							aria-label={`${day.day} ${day.date}`}
							className={cn(
								"grid aspect-square cursor-pointer place-items-center rounded-md text-xs transition-colors hover:bg-muted",
								day.muted && "text-muted-foreground/50",
								day.selected &&
									"bg-primary text-primary-foreground hover:bg-primary"
							)}
							key={`${day.day}-${day.date}`}
							type="button"
						>
							{day.date}
						</button>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function FocusCard({ completedTaskCount }: { completedTaskCount: number }) {
	return (
		<Card className="rounded-lg shadow-xs">
			<CardHeader>
				<CardTitle>Focus</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between gap-4">
						<div className="font-medium text-3xl tracking-tight">90:00</div>
						<Button className="min-w-24 rounded-md">Start</Button>
					</div>
					<div className="flex items-center gap-2 text-muted-foreground text-xs">
						<BellOffIcon className="size-3" />
						<span>{completedTaskCount} done - full focus</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function RecentNotesCard() {
	return (
		<Card className="rounded-lg shadow-xs">
			<CardHeader>
				<CardTitle>Recent Notes</CardTitle>
				<CardAction>
					<Button className="text-muted-foreground" size="sm" variant="ghost">
						View all
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{recentNotes.map((note) => {
					const Icon = note.icon;

					return (
						<div className="flex items-start gap-4" key={note.title}>
							<Icon className="size-5 text-muted-foreground" />
							<div className="min-w-0">
								<div className="truncate font-medium text-sm leading-none">
									{note.title}
								</div>
								<div className="text-muted-foreground text-xs">{note.date}</div>
							</div>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}

function WeeklySummaryCard({
	completedTaskCount,
}: {
	completedTaskCount: number;
}) {
	return (
		<Card className="rounded-lg shadow-xs">
			<CardHeader>
				<CardTitle>This Week</CardTitle>
				<CardAction>
					<Button className="text-muted-foreground" size="sm" variant="ghost">
						View all
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<p className="text-muted-foreground">
					You&apos;re doing great. Keep the momentum going.
				</p>
				<div className="flex flex-col gap-2">
					<div className="font-medium">
						{completedTaskCount} of 6 goals completed
					</div>
					<ProgressBar value={66} />
				</div>
			</CardContent>
		</Card>
	);
}

function SelectLike<TValue extends string>({
	ariaLabel,
	onChange,
	options,
	value,
}: {
	ariaLabel: string;
	onChange: (value: string) => void;
	options: Record<TValue, string>;
	value: TValue;
}) {
	const optionEntries = Object.entries(options) as [TValue, string][];

	return (
		<select
			aria-label={ariaLabel}
			className="h-8 rounded-md border border-input bg-background px-2.5 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
			onChange={(event) => onChange(event.target.value)}
			value={value}
		>
			{optionEntries.map(([optionValue, optionLabel]) => (
				<option key={optionValue} value={optionValue}>
					{optionLabel}
				</option>
			))}
		</select>
	);
}

function ProgressBar({ value }: { value: number }) {
	return (
		<div
			aria-label={`${value}% complete`}
			aria-valuemax={100}
			aria-valuemin={0}
			aria-valuenow={value}
			className="h-2 w-full overflow-hidden rounded-full bg-muted"
			role="progressbar"
		>
			<div
				className="h-full rounded-full bg-primary transition-all"
				style={{ width: `${value}%` }}
			/>
		</div>
	);
}
