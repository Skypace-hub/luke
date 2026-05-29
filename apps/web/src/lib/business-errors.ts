import type { Translate } from "@luke/i18n";

export type ServiceOpsAction = "deactivate" | "delete" | "save" | "suspend";

interface BusinessToast {
	description: string;
	title: string;
}

const technicalErrorPatterns = [
	/failed query/i,
	/insert into/i,
	/update\s+.+\s+set/i,
	/delete from/i,
	/select\s+.+\s+from/i,
	/params:/i,
	/sql/i,
	/drizzle/i,
	/constraint/i,
	/violates/i,
	/duplicate key/i,
	/invalid input syntax/i,
] as const;

function hasTechnicalDetails(message?: string) {
	if (!message) {
		return false;
	}

	return technicalErrorPatterns.some((pattern) => pattern.test(message));
}

function getServiceOpsDescription(message: string | undefined, t: Translate) {
	const normalizedMessage = message?.toLowerCase() ?? "";

	if (normalizedMessage.includes("tenant access denied")) {
		return t("toast.service.permission");
	}

	if (
		normalizedMessage.includes("duplicate") ||
		normalizedMessage.includes("unique")
	) {
		return t("toast.service.duplicate");
	}

	if (
		normalizedMessage.includes("catalogue item") &&
		normalizedMessage.includes("installed assets")
	) {
		return t("toast.service.catalogueLinked");
	}

	if (
		normalizedMessage.includes("foreign key") ||
		normalizedMessage.includes("restrict")
	) {
		return t("toast.service.linked");
	}

	if (
		normalizedMessage.includes("latitude") ||
		normalizedMessage.includes("longitude") ||
		normalizedMessage.includes("range")
	) {
		return t("toast.service.location");
	}

	if (hasTechnicalDetails(message)) {
		return t("toast.service.technical");
	}

	return t("toast.service.default");
}

export function getServiceOpsMutationError({
	action,
	entityLabel,
	message,
	t,
}: {
	action: ServiceOpsAction;
	entityLabel: string;
	message?: string;
	t: Translate;
}): BusinessToast {
	return {
		description: getServiceOpsDescription(message, t),
		title: t("toast.service.unableAction", { action, entity: entityLabel }),
	};
}

export function getServiceOpsQueryError(
	message: string | undefined,
	t: Translate
): BusinessToast {
	if (message?.toLowerCase().includes("tenant access denied")) {
		return {
			description: t("toast.service.load.forbidden"),
			title: t("toast.service.load.title"),
		};
	}

	return {
		description: t("toast.service.load.description"),
		title: t("toast.service.load.title"),
	};
}

export function getAuthError({
	action,
	message,
	t,
}: {
	action: "sign-in" | "sign-up";
	message?: string;
	t: Translate;
}): BusinessToast {
	const normalizedMessage = message?.toLowerCase() ?? "";

	if (
		normalizedMessage.includes("invalid") ||
		normalizedMessage.includes("credential") ||
		normalizedMessage.includes("password")
	) {
		return {
			description:
				action === "sign-in"
					? t("auth.unable.signIn.invalid")
					: t("auth.unable.signUp.invalid"),
			title:
				action === "sign-in"
					? t("auth.unable.signIn.title")
					: t("auth.unable.signUp.title"),
		};
	}

	if (
		normalizedMessage.includes("already") ||
		normalizedMessage.includes("exists") ||
		normalizedMessage.includes("duplicate")
	) {
		return {
			description: t("auth.accountAlreadyExists.description"),
			title: t("auth.accountAlreadyExists.title"),
		};
	}

	return {
		description:
			action === "sign-in"
				? t("auth.unable.signIn.description")
				: t("auth.unable.signUp.description"),
		title:
			action === "sign-in"
				? t("auth.unable.signIn.title")
				: t("auth.unable.signUp.title"),
	};
}
