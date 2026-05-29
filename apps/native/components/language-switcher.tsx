import { languageOptions } from "@luke/i18n";
import { Pressable, Text, View } from "react-native";

import { useI18n } from "@/contexts/i18n-context";

export function LanguageSwitcher() {
	const { locale, setLocale, t } = useI18n();

	return (
		<View
			accessibilityLabel={t("common.language")}
			style={{ flexDirection: "row", gap: 6 }}
		>
			{languageOptions.map((option) => {
				const isActive = option.locale === locale;

				return (
					<Pressable
						accessibilityRole="button"
						accessibilityState={{ selected: isActive }}
						key={option.locale}
						onPress={() => setLocale(option.locale)}
						style={{
							borderRadius: 999,
							backgroundColor: isActive
								? "rgba(43,142,240,0.16)"
								: "transparent",
							paddingHorizontal: 8,
							paddingVertical: 5,
						}}
					>
						<Text
							style={{
								color: isActive ? "#2B8EF0" : "#8b92a8",
								fontSize: 12,
								fontWeight: "800",
							}}
						>
							{option.shortLabel}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
