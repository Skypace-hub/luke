export const defaultSuperAdmin = {
	accountId: "default-super-admin-credential",
	email: "admin@utiliti.local",
	login: "admin",
	name: "Super Administrator",
	password: "admin",
	tenantId: "platform",
	tenantName: "Platform Administration",
	userId: "default-super-admin",
} as const;

export function normalizeSignInEmail(value: string) {
	return value.trim().toLowerCase() === defaultSuperAdmin.login
		? defaultSuperAdmin.email
		: value.trim();
}
