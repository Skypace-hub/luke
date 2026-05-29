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

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
	const { locale, setLocale, t } = useI18n();
	const activeLanguage =
		languageOptions.find((option) => option.locale === locale) ??
		languageOptions[0];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={t("common.language")}
						className={cn("rounded-lg", compact ? "size-8 px-0" : "")}
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
