DROP TYPE IF EXISTS "public"."tenant_role_new";--> statement-breakpoint
CREATE TYPE "public"."tenant_role_new" AS ENUM(
	'super_admin',
	'tenant_admin',
	'operator',
	'observer'
);--> statement-breakpoint
ALTER TABLE "tenant_memberships"
ALTER COLUMN "role"
TYPE "public"."tenant_role_new"
USING (
	CASE "role"::text
		WHEN 'super_admin' THEN 'super_admin'
		WHEN 'tenant_admin' THEN 'tenant_admin'
		WHEN 'operator' THEN 'operator'
		WHEN 'observer' THEN 'observer'
		WHEN 'admin' THEN 'tenant_admin'
		WHEN 'coordinator' THEN 'operator'
		WHEN 'engineer' THEN 'operator'
		WHEN 'hospital_user' THEN 'observer'
		ELSE 'observer'
	END
)::"public"."tenant_role_new";--> statement-breakpoint
DROP TYPE "public"."tenant_role";--> statement-breakpoint
ALTER TYPE "public"."tenant_role_new" RENAME TO "tenant_role";
