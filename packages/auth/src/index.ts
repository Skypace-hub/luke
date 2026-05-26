import { expo } from "@better-auth/expo";
import { createDb } from "@luke/db";
import {
	account,
	accountRelations,
	session,
	sessionRelations,
	user,
	userRelations,
	verification,
} from "@luke/db/schema/auth";
import { tenantMemberships, tenants } from "@luke/db/schema/service-ops";
import { env } from "@luke/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hashPassword } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import { and, eq } from "drizzle-orm";

import { defaultSuperAdmin } from "./default-admin";

const authSchema = {
	account,
	accountRelations,
	session,
	sessionRelations,
	user,
	userRelations,
	verification,
};

export async function ensureDefaultSuperAdmin() {
	const db = createDb();
	const now = new Date();
	const [existingAdmin] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, defaultSuperAdmin.email))
		.limit(1);
	const userId = existingAdmin?.id ?? defaultSuperAdmin.userId;

	if (existingAdmin) {
		await db
			.update(user)
			.set({
				emailVerified: true,
				name: defaultSuperAdmin.name,
				updatedAt: now,
			})
			.where(eq(user.id, userId));
	} else {
		await db.insert(user).values({
			createdAt: now,
			email: defaultSuperAdmin.email,
			emailVerified: true,
			id: userId,
			name: defaultSuperAdmin.name,
			updatedAt: now,
		});
	}

	const [existingCredential] = await db
		.select({ id: account.id, password: account.password })
		.from(account)
		.where(
			and(eq(account.userId, userId), eq(account.providerId, "credential"))
		)
		.limit(1);

	if (!existingCredential?.password) {
		await db.delete(account).where(eq(account.id, defaultSuperAdmin.accountId));
		await db.insert(account).values({
			accountId: userId,
			createdAt: now,
			id: defaultSuperAdmin.accountId,
			password: await hashPassword(defaultSuperAdmin.password),
			providerId: "credential",
			updatedAt: now,
			userId,
		});
	}

	await db
		.insert(tenants)
		.values({
			id: defaultSuperAdmin.tenantId,
			name: defaultSuperAdmin.tenantName,
			region: "Global",
			releaseLabel: "Platform",
		})
		.onConflictDoNothing();

	await db
		.insert(tenantMemberships)
		.values({
			permissions: ["*"],
			role: "super_admin",
			status: "active",
			tenantId: defaultSuperAdmin.tenantId,
			userId,
		})
		.onConflictDoUpdate({
			set: {
				permissions: ["*"],
				role: "super_admin",
				status: "active",
				updatedAt: now,
			},
			target: [tenantMemberships.tenantId, tenantMemberships.userId],
		});

	return userId;
}

export function createAuth() {
	const db = createDb();

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",

			schema: authSchema,
		}),
		trustedOrigins: [
			env.CORS_ORIGIN,
			"luke://",
			"exp://",
			"http://localhost:8081",
		],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		plugins: [expo(), nextCookies()],
	});
}

export const auth = createAuth();
