import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@luke/ui/components/card";
import { CommandIcon } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
	return (
		<main className="grid min-h-svh bg-background text-foreground lg:grid-cols-[minmax(360px,0.95fr)_minmax(0,1fr)]">
			<section className="hidden border-r bg-sidebar px-8 py-8 lg:flex lg:flex-col">
				<div className="flex items-center gap-3">
					<div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
						<CommandIcon className="size-4" />
					</div>
					<div>
						<p className="font-semibold text-base">Utiliti</p>
						<p className="text-muted-foreground text-xs">Service Operations</p>
					</div>
				</div>
				<div className="mt-28 flex flex-col gap-5">
					<div>
						<h1 className="font-medium text-3xl tracking-tight">
							Operational command for field service teams.
						</h1>
						<p className="mt-3 text-muted-foreground text-sm leading-relaxed">
							Monitor jobs, assets, engineers, contracts, exceptions, and
							inventory from one tenant-aware workspace.
						</p>
					</div>
					<div className="grid gap-3">
						{["Live dispatch", "Contract coverage", "Parts visibility"].map(
							(item) => (
								<div
									className="rounded-xl bg-card p-3 text-sm shadow-xs ring-1 ring-foreground/10"
									key={item}
								>
									{item}
								</div>
							)
						)}
					</div>
				</div>
			</section>
			<section className="flex min-h-svh items-center justify-center px-4 py-8">
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
		<Card className="w-full max-w-md shadow-none ring-1 ring-foreground/10">
			<CardHeader>
				<CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
				<p className="text-muted-foreground text-sm">{description}</p>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}
