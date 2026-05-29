import {
	defaultLocale,
	localeCookieName,
	localeToHtmlLang,
	normalizeLocale,
	translate,
} from "@luke/i18n";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";

import "../index.css";
import Providers from "@/components/providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: translate(defaultLocale, "app.name"),
	description: translate(defaultLocale, "app.description"),
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const cookieStore = await cookies();
	const requestHeaders = await headers();
	const initialLocale =
		normalizeLocale(cookieStore.get(localeCookieName)?.value) ??
		normalizeLocale(requestHeaders.get("accept-language")) ??
		defaultLocale;

	return (
		<html lang={localeToHtmlLang(initialLocale)} suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Providers initialLocale={initialLocale}>
					<div>{children}</div>
				</Providers>
			</body>
		</html>
	);
}
