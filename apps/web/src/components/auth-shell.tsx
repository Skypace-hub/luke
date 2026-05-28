import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@luke/ui/components/card";
import {
	ClipboardCheckIcon,
	CommandIcon,
	RadarIcon,
	ShieldCheckIcon,
} from "lucide-react";
import type { ReactNode } from "react";

const authFeatures = [
	{
		description:
			"Track live job state, engineer ownership, and field activity.",
		icon: RadarIcon,
		title: "Live dispatch",
	},
	{
		description: "Keep SLA, entitlement, and contract coverage visible.",
		icon: ShieldCheckIcon,
		title: "Contract coverage",
	},
	{
		description: "Monitor stock thresholds, shortages, and product parts.",
		icon: ClipboardCheckIcon,
		title: "Parts visibility",
	},
] as const;

export function AuthShell({ children }: { children: ReactNode }) {
	return (
		<main className="grid min-h-svh bg-background text-foreground lg:grid-cols-[minmax(420px,0.95fr)_minmax(0,1fr)]">
			<section className="hidden border-r bg-sidebar px-10 py-10 lg:flex lg:flex-col xl:px-16">
				<div className="flex items-center gap-3">
					<div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
						<CommandIcon className="size-4" />
					</div>
					<div>
						<p className="font-semibold text-base">Utiliti</p>
						<p className="text-muted-foreground text-xs">Service Operations</p>
					</div>
				</div>
				<div className="mt-28 flex max-w-lg flex-col gap-7">
					<div>
						<h1 className="font-medium text-3xl tracking-tight">
							Operational command for field service teams
						</h1>
						<p className="mt-3 text-muted-foreground text-sm leading-relaxed">
							Monitor jobs, assets, engineers, contracts, exceptions, and
							inventory from one tenant-aware workspace.
						</p>
					</div>
					<div className="grid max-w-md gap-3">
						{authFeatures.map((feature) => {
							const Icon = feature.icon;

							return (
								<div
									className="flex items-start gap-3 rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/10"
									key={feature.title}
								>
									<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
										<Icon className="size-4" />
									</span>
									<span className="min-w-0">
										<span className="block font-medium text-sm">
											{feature.title}
										</span>
										<span className="mt-1 block text-muted-foreground text-xs leading-relaxed">
											{feature.description}
										</span>
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</section>
			<section className="flex min-h-svh items-center justify-center bg-muted/20 px-4 py-8">
				{children}
			</section>
		</main>
	);
}

export function AuthCard({
	children,
	description,
	title,
}: {
	children: ReactNode;
	description: string;
	title: string;
}) {
	return (
		<Card className="w-full max-w-md border-0 bg-card shadow-[0_20px_60px_rgb(15_23_42_/_0.08)] ring-1 ring-foreground/5">
			<CardHeader className="px-8 pt-8">
				<CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
				<p className="text-muted-foreground text-sm">{description}</p>
			</CardHeader>
			<CardContent className="px-8 pb-8">{children}</CardContent>
		</Card>
	);
}
