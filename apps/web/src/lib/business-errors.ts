type ServiceOpsAction = "delete" | "save";

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

function getServiceOpsDescription(message?: string) {
	const normalizedMessage = message?.toLowerCase() ?? "";

	if (normalizedMessage.includes("tenant access denied")) {
		return "You do not have permission to change records in this tenant.";
	}

	if (
		normalizedMessage.includes("duplicate") ||
		normalizedMessage.includes("unique")
	) {
		return "A record with the same code, number, or identifier already exists.";
	}

	if (
		normalizedMessage.includes("foreign key") ||
		normalizedMessage.includes("restrict")
	) {
		return "This record is still linked to other operational data. Remove those links before trying again.";
	}

	if (
		normalizedMessage.includes("latitude") ||
		normalizedMessage.includes("longitude") ||
		normalizedMessage.includes("range")
	) {
		return "Check the location values. Latitude must be between -90 and 90, and longitude must be between -180 and 180.";
	}

	if (hasTechnicalDetails(message)) {
		return "The request could not be completed. Check the form values and try again.";
	}

	return "Check the form values and try again.";
}

export function getServiceOpsMutationError({
	action,
	entityLabel,
	message,
}: {
	action: ServiceOpsAction;
	entityLabel: string;
	message?: string;
}): BusinessToast {
	const actionLabel = action === "delete" ? "delete" : "save";

	return {
		description: getServiceOpsDescription(message),
		title: `Unable to ${actionLabel} ${entityLabel}.`,
	};
}

export function getServiceOpsQueryError(message?: string): BusinessToast {
	if (message?.toLowerCase().includes("tenant access denied")) {
		return {
			description: "You do not have permission to view this tenant.",
			title: "Unable to load tenant data.",
		};
	}

	return {
		description: "Refresh the page or try again in a moment.",
		title: "Unable to load service data.",
	};
}

export function getAuthError({
	action,
	message,
}: {
	action: "sign-in" | "sign-up";
	message?: string;
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
					? "Check your email and password, then try again."
					: "Check the account details and try again.",
			title: action === "sign-in" ? "Unable to sign in." : "Unable to sign up.",
		};
	}

	if (
		normalizedMessage.includes("already") ||
		normalizedMessage.includes("exists") ||
		normalizedMessage.includes("duplicate")
	) {
		return {
			description: "Use a different email address or sign in instead.",
			title: "Account already exists.",
		};
	}

	return {
		description:
			action === "sign-in"
				? "Check your credentials and try again."
				: "Check the account details and try again.",
		title: action === "sign-in" ? "Unable to sign in." : "Unable to sign up.",
	};
}
