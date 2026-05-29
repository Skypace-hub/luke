import { CheckIcon, CommandIcon } from "lucide-react";
import type { ReactNode } from "react";

import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

type AuthShellVariant = "sign-in" | "sign-up";

const authMarketingKeys = {
	"sign-in": {
		body: "auth.marketing.signIn.body",
		bullets: [
			"auth.marketing.signIn.bullet1",
			"auth.marketing.signIn.bullet2",
			"auth.marketing.signIn.bullet3",
		],
		eyebrow: "auth.marketing.signIn.eyebrow",
		heading: "auth.marketing.signIn.heading",
	},
	"sign-up": {
		body: "auth.marketing.signUp.body",
		bullets: [
			"auth.marketing.signUp.bullet1",
			"auth.marketing.signUp.bullet2",
			"auth.marketing.signUp.bullet3",
		],
		eyebrow: "auth.marketing.signUp.eyebrow",
		heading: "auth.marketing.signUp.heading",
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
	const { t } = useI18n();
	const content = authMarketingKeys[variant];

	return (
		<main className="min-h-svh bg-muted/40 p-3 text-foreground sm:p-6">
			<div className="relative mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-[1360px] overflow-hidden bg-primary text-primary-foreground shadow-sm ring-1 ring-border/60 sm:min-h-[calc(100svh-3rem)] lg:grid-cols-[minmax(380px,0.78fr)_minmax(0,1.12fr)]">
				<div className="absolute top-4 right-4 z-10">
					<LanguageSwitcher />
				</div>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_72%_42%,rgb(58_72_113_/_0.42)_0%,rgb(35_43_70_/_0.2)_33%,transparent_68%),linear-gradient(135deg,rgb(255_255_255_/_0.04),transparent_38%)]"
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(145_161_216_/_0.075)_1px,transparent_1px),linear-gradient(0deg,rgb(145_161_216_/_0.055)_1px,transparent_1px)] bg-[size:48px_48px] opacity-70 [mask-image:linear-gradient(90deg,transparent,black_18%,black_86%,transparent)]"
				/>
				<section className="relative flex min-h-[calc(100svh-1.5rem)] items-center justify-center px-6 py-10 sm:min-h-[calc(100svh-3rem)] sm:px-10 lg:min-h-0 lg:justify-end lg:px-10 xl:px-14">
					{children}
				</section>
				<section className="relative hidden items-center px-16 py-16 lg:flex xl:px-24">
					<div className="max-w-lg -translate-y-5">
						<div className="flex items-center gap-3">
							<span className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/12 ring-1 ring-primary-foreground/25">
								<CommandIcon className="size-4" />
							</span>
							<span className="font-semibold text-base">Utiliti</span>
						</div>

						<div className="mt-10">
							<p className="font-semibold text-primary-foreground text-xs uppercase">
								{t(content.eyebrow)}
							</p>
							<h2 className="mt-4 max-w-md font-bold text-[2.625rem] leading-[1.16]">
								{t(content.heading)}
							</h2>
							<p className="mt-4 max-w-md text-primary-foreground/75 text-sm leading-6">
								{t(content.body)}
							</p>
						</div>

						<div className="mt-9 -ml-8 grid gap-3.5">
							{content.bullets.map((bullet) => (
								<div
									className="grid grid-cols-[1rem_1fr] items-start gap-4"
									key={bullet}
								>
									<CheckIcon
										aria-hidden="true"
										className="mt-0.5 size-4 text-primary-foreground"
									/>
									<span className="text-primary-foreground/80 text-sm">
										{t(bullet)}
									</span>
								</div>
							))}
						</div>

						<p className="mt-12 max-w-sm text-primary-foreground/65 text-xs leading-relaxed">
							{t("auth.marketing.footer")}
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
		<div className="w-full max-w-[408px] rounded-[1.5rem] bg-[oklch(0.985_0.003_255)] px-7 py-8 text-card-foreground shadow-[0_36px_120px_rgb(0_0_0_/_0.3),0_1px_0_rgb(255_255_255_/_0.72)_inset] ring-1 ring-black/5 sm:px-10 sm:py-10">
			<div className="mx-auto flex w-full max-w-[304px] flex-col">
				<h1 className="font-semibold text-[1.75rem] leading-tight">{title}</h1>
				<div className="mt-3 text-muted-foreground text-xs leading-relaxed">
					{description}
				</div>
				<div className="mt-7">{children}</div>
			</div>
		</div>
	);
}
