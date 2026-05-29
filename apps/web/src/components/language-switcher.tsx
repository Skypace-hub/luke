"use client";

import { languageOptions } from "@luke/i18n";
import { Button } from "@luke/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@luke/ui/components/dropdown-menu";
import { cn } from "@luke/ui/lib/utils";
import { LanguagesIcon } from "lucide-react";

import { useI18n } from "@/components/i18n-provider";

type LanguageSwitcherTone = "default" | "on-dark";

export function LanguageSwitcher({
	compact = false,
	tone = "default",
}: {
	compact?: boolean;
	tone?: LanguageSwitcherTone;
}) {
	const { locale, setLocale, t } = useI18n();
	const activeLanguage =
		languageOptions.find((option) => option.locale === locale) ??
		languageOptions[0];
	const isOnDark = tone === "on-dark";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={t("common.language")}
						className={cn(
							"rounded-lg",
							compact ? "size-8 px-0" : "h-9 gap-2 px-3",
							isOnDark &&
								"border-white/15 bg-white/10 text-white shadow-[0_14px_40px_rgb(0_0_0_/_0.28)] backdrop-blur-md hover:border-white/25 hover:bg-white/15 hover:text-white aria-expanded:border-white/25 aria-expanded:bg-white/15 aria-expanded:text-white"
						)}
						size={compact ? "icon" : "sm"}
						type="button"
						variant="outline"
					/>
				}
			>
				<LanguagesIcon className="size-4" />
				{compact ? null : <span>{activeLanguage.shortLabel}</span>}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-44 bg-card">
				<DropdownMenuRadioGroup
					onValueChange={(value) => {
						const nextLocale = languageOptions.find(
							(option) => option.locale === value
						)?.locale;

						if (nextLocale) {
							setLocale(nextLocale);
						}
					}}
					value={locale}
				>
					{languageOptions.map((option) => (
						<DropdownMenuRadioItem
							closeOnClick
							key={option.locale}
							value={option.locale}
						>
							{option.nativeLabel}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
