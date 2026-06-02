import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import { useThemeColor } from "heroui-native";
import { useCallback } from "react";
import { Text } from "react-native";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/contexts/i18n-context";

function DrawerLayout() {
	const { t } = useI18n();
	const themeColorForeground = useThemeColor("foreground");
	const themeColorBackground = useThemeColor("background");

	const renderHeaderActions = useCallback(
		() => (
			<>
				<LanguageSwitcher />
				<ThemeToggle />
			</>
		),
		[]
	);

	return (
		<Drawer
			screenOptions={{
				headerTintColor: themeColorForeground,
				headerStyle: { backgroundColor: themeColorBackground },
				headerTitleStyle: {
					fontWeight: "600",
					color: themeColorForeground,
				},
				headerRight: renderHeaderActions,
				drawerStyle: { backgroundColor: themeColorBackground },
			}}
		>
			<Drawer.Screen
				name="index"
				options={{
					headerTitle: t("native.home"),
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							{t("native.home")}
						</Text>
					),
					drawerIcon: ({ size, color, focused }) => (
						<Ionicons
							color={focused ? color : themeColorForeground}
							name="home-outline"
							size={size}
						/>
					),
				}}
			/>
			<Drawer.Screen
				name="(tabs)"
				options={{
					headerShown: false,
					headerTitle: t("native.engineerApp"),
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							{t("native.engineerApp")}
						</Text>
					),
					drawerIcon: ({ size, color, focused }) => (
						<MaterialIcons
							color={focused ? color : themeColorForeground}
							name="engineering"
							size={size}
						/>
					),
				}}
			/>
		</Drawer>
	);
}

export default DrawerLayout;
