import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { EngineerAppProvider } from "@/components/engineer-app/engineer-app-context";
import { colors } from "@/components/engineer-app/engineer-ui";
import { useI18n } from "@/contexts/i18n-context";

export default function TabLayout() {
	const { t } = useI18n();

	return (
		<EngineerAppProvider>
			<Tabs
				screenOptions={{
					headerShown: false,
					tabBarActiveTintColor: colors.blueLight,
					tabBarInactiveTintColor: colors.text3,
					tabBarLabelStyle: {
						fontSize: 10,
						fontWeight: "800",
						textTransform: "uppercase",
					},
					tabBarStyle: {
						backgroundColor: colors.surface,
						borderTopColor: colors.border,
						height: 72,
						paddingBottom: 10,
						paddingTop: 8,
					},
				}}
			>
				<Tabs.Screen
					name="index"
					options={{
						title: t("native.jobs"),
						tabBarIcon: ({ color, size }) => (
							<Ionicons color={color} name="clipboard" size={size} />
						),
					}}
				/>
				<Tabs.Screen
					name="calendar"
					options={{
						title: t("native.calendar"),
						tabBarIcon: ({ color, size }) => (
							<Ionicons color={color} name="calendar" size={size} />
						),
					}}
				/>
				<Tabs.Screen
					name="check-device"
					options={{
						title: t("native.checkDevice"),
						tabBarIcon: ({ color, focused }) => (
							<Ionicons
								color={focused ? colors.white : color}
								name="scan-circle"
								size={focused ? 34 : 30}
								style={{
									backgroundColor: focused ? colors.blue : colors.surface3,
									borderRadius: 18,
								}}
							/>
						),
					}}
				/>
				<Tabs.Screen
					name="add-device"
					options={{
						title: t("native.addDevice"),
						tabBarIcon: ({ color, size }) => (
							<Ionicons color={color} name="add-circle" size={size} />
						),
					}}
				/>
				<Tabs.Screen
					name="profile"
					options={{
						title: t("native.profile"),
						tabBarIcon: ({ color, size }) => (
							<Ionicons color={color} name="person-circle" size={size} />
						),
					}}
				/>
			</Tabs>
		</EngineerAppProvider>
	);
}
