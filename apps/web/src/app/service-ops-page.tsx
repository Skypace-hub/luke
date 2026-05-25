import {
	getDefaultTenantIdForUser,
	getServiceOpsSnapshot,
} from "@luke/api/services/service-ops";
import { auth } from "@luke/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import ServiceOpsPlatform from "@/components/service-ops-platform";

export default async function ServiceOpsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const tenantId = await getDefaultTenantIdForUser(session.user.id);

	if (!tenantId) {
		throw new Error("No active tenant membership found for this user.");
	}

	const initialData = await getServiceOpsSnapshot(tenantId);

	return <ServiceOpsPlatform initialData={initialData} />;
}
