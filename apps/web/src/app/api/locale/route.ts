import { localeCookieName, normalizeLocale } from "@luke/i18n";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const body = (await req.json().catch(() => null)) as {
		locale?: unknown;
	} | null;
	const locale =
		typeof body?.locale === "string" ? normalizeLocale(body.locale) : null;

	if (!locale) {
		return NextResponse.json({ error: "Unsupported locale." }, { status: 400 });
	}

	const response = NextResponse.json({ locale });
	response.cookies.set(localeCookieName, locale, {
		maxAge: 31_536_000,
		path: "/",
		sameSite: "lax",
	});

	return response;
}
