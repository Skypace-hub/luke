import { ensureDefaultSuperAdmin } from "@luke/auth";

import { LoginChooser } from "./login-chooser";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
	await ensureDefaultSuperAdmin();

	return <LoginChooser />;
}
