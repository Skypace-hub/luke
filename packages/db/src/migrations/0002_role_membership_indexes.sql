DROP INDEX IF EXISTS "tenant_memberships_tenant_user_role_uidx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_memberships_tenant_user_uidx" ON "tenant_memberships" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_memberships_tenant_idx" ON "tenant_memberships" USING btree ("tenant_id");
