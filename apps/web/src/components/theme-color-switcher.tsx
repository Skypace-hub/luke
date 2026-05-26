"use client";

import { Button } from "@luke/ui/components/button";
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
import { cn } from "@luke/ui/lib/utils";
import {
	type LucideIcon,
	MonitorIcon,
	MoonIcon,
	PaletteIcon,
	SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const colorThemeStorageKey = "luke-color-theme";

const appearanceOptions = [
	{ icon: SunIcon, label: "Light", value: "light" },
	{ icon: MoonIcon, label: "Dark", value: "dark" },
	{ icon: MonitorIcon, label: "System", value: "system" },
] as const satisfies Array<{
	icon: LucideIcon;
	label: string;
	value: string;
}>;

const colorThemeIds = ["neutral", "teal", "blue", "rose"] as const;

type ColorTheme = (typeof colorThemeIds)[number];

const colorThemeOptions = [
	{ label: "Neutral", swatch: "oklch(0.205 0 0)", value: "neutral" },
	{ label: "Teal", swatch: "oklch(0.48 0.12 180)", value: "teal" },
	{ label: "Blue", swatch: "oklch(0.48 0.16 255)", value: "blue" },
	{ label: "Rose", swatch: "oklch(0.52 0.17 15)", value: "rose" },
] as const satisfies Array<{
	label: string;
	swatch: string;
	value: ColorTheme;
}>;

const isColorTheme = (value: string): value is ColorTheme =>
	colorThemeIds.includes(value as ColorTheme);

const applyColorTheme = (theme: ColorTheme) => {
	document.documentElement.dataset.colorTheme = theme;
};

export function ThemeColorSwitcher({ className }: { className?: string }) {
	const { setTheme, theme } = useTheme();
	const [colorTheme, setColorThemeState] = useState<ColorTheme>("neutral");

	useEffect(() => {
		const storedColorTheme = window.localStorage.getItem(colorThemeStorageKey);
		const nextColorTheme =
			storedColorTheme && isColorTheme(storedColorTheme)
				? storedColorTheme
				: "neutral";

		setColorThemeState(nextColorTheme);
		applyColorTheme(nextColorTheme);
	}, []);

	const setColorTheme = (nextColorTheme: string) => {
		if (!isColorTheme(nextColorTheme)) {
			return;
		}

		setColorThemeState(nextColorTheme);
		applyColorTheme(nextColorTheme);
		window.localStorage.setItem(colorThemeStorageKey, nextColorTheme);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label="Change theme"
						className={cn("rounded-lg", className)}
						size="icon-lg"
						variant="outline"
					/>
				}
			>
				<PaletteIcon />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56" sideOffset={8}>
				<DropdownMenuGroup>
					<DropdownMenuLabel>Appearance</DropdownMenuLabel>
					<DropdownMenuRadioGroup
						onValueChange={setTheme}
						value={theme ?? "system"}
					>
						{appearanceOptions.map((option) => {
							const Icon = option.icon;

							return (
								<DropdownMenuRadioItem
									className="gap-2 py-2 pr-8"
									closeOnClick
									key={option.value}
									value={option.value}
								>
									<Icon />
									<span>{option.label}</span>
								</DropdownMenuRadioItem>
							);
						})}
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuLabel>Color theme</DropdownMenuLabel>
					<DropdownMenuRadioGroup
						onValueChange={setColorTheme}
						value={colorTheme}
					>
						{colorThemeOptions.map((option) => (
							<DropdownMenuRadioItem
								className="gap-2 py-2 pr-8"
								closeOnClick
								key={option.value}
								value={option.value}
							>
								<span
									aria-hidden="true"
									className="size-3 rounded-full ring-1 ring-foreground/15"
									style={{ backgroundColor: option.swatch }}
								/>
								<span>{option.label}</span>
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
