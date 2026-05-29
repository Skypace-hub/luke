"use client";

import { Loader2Icon } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

export default function Loader() {
	const { t } = useI18n();

	return (
		<div
			aria-label={t("common.loading")}
			className="flex min-h-svh items-center justify-center bg-background text-muted-foreground"
			role="status"
		>
			<Loader2Icon className="size-6 animate-spin" />
		</div>
	);
}
