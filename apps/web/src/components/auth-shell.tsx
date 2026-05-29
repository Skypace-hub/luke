import { CheckIcon, CommandIcon } from "lucide-react";
import type { ReactNode } from "react";

type AuthShellVariant = "sign-in" | "sign-up";

const authMarketing = {
	"sign-in": {
		body: "Coordinate jobs, assets, engineers, contracts, exceptions, and inventory from one tenant-aware workspace.",
		bullets: [
			"Live dispatch and service status",
			"Asset history with contract coverage",
			"Parts visibility across operations",
		],
		eyebrow: "Service Operations",
		heading: "One workspace for your whole team",
	},
	"sign-up": {
		body: "Create a workspace for hospital service operations with the controls your team needs from day one.",
		bullets: [
			"Tenant-aware asset and job records",
			"Engineer ownership and workflow tracking",
			"Inventory signals for service parts",
		],
		eyebrow: "Utiliti Online Plan",
		heading: "Your Utiliti service plan",
	},
} as const satisfies Record<
	AuthShellVariant,
	{
		body: string;
		bullets: readonly string[];
		eyebrow: string;
		heading: string;
	}
>;

export function AuthShell({
	children,
	variant = "sign-in",
}: {
	children: ReactNode;
	variant?: AuthShellVariant;
}) {
	const content = authMarketing[variant];

	return (
		<main className="min-h-svh bg-muted/40 p-3 text-foreground sm:p-6">
			<div className="mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-[1440px] overflow-hidden bg-primary text-primary-foreground shadow-sm ring-1 ring-border/60 sm:min-h-[calc(100svh-3rem)] lg:grid-cols-[minmax(440px,0.95fr)_minmax(0,1fr)]">
				<section className="flex min-h-[calc(100svh-1.5rem)] items-center justify-center px-6 py-10 sm:min-h-[calc(100svh-3rem)] sm:px-10 lg:min-h-0 lg:justify-end lg:px-14 xl:px-20">
					{children}
				</section>
				<section className="hidden items-center px-12 py-16 lg:flex xl:px-24">
					<div className="max-w-lg">
						<div className="flex items-center gap-3">
							<span className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
								<CommandIcon className="size-4" />
							</span>
							<span className="font-semibold text-base">Utiliti</span>
						</div>

						<div className="mt-12">
							<p className="font-medium text-primary-foreground/75 text-sm">
								{content.eyebrow}
							</p>
							<h2 className="mt-4 max-w-md font-semibold text-4xl leading-[1.22]">
								{content.heading}
							</h2>
							<p className="mt-4 max-w-md text-primary-foreground/75 text-sm leading-6">
								{content.body}
							</p>
						</div>

						<div className="mt-10 grid gap-3.5">
							{content.bullets.map((bullet) => (
								<div className="flex items-start gap-3" key={bullet}>
									<CheckIcon
										aria-hidden="true"
										className="mt-0.5 size-4 shrink-0 text-primary-foreground"
									/>
									<span className="text-primary-foreground/80 text-sm">
										{bullet}
									</span>
								</div>
							))}
						</div>

						<p className="mt-12 max-w-sm text-primary-foreground/65 text-xs leading-relaxed">
							Built for focused service teams that need clear ownership,
							accurate records, and fast operational handoffs.
						</p>
					</div>
				</section>
			</div>
		</main>
	);
}

export function AuthCard({
	children,
	description,
	title,
}: {
	children: ReactNode;
	description: ReactNode;
	title: string;
}) {
	return (
		<div className="w-full max-w-[440px] rounded-[1.75rem] bg-card px-8 py-10 text-card-foreground shadow-[0_24px_80px_rgb(0_0_0_/_0.18)] ring-1 ring-border/70 sm:px-12 sm:py-14">
			<div className="mx-auto flex w-full max-w-[330px] flex-col">
				<h1 className="font-semibold text-3xl leading-tight">{title}</h1>
				<div className="mt-2 text-muted-foreground text-xs leading-relaxed">
					{description}
				</div>
				<div className="mt-8">{children}</div>
			</div>
		</div>
	);
}
