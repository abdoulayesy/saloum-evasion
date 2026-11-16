import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "carts" ADD COLUMN "token_hash" varchar NOT NULL;
  CREATE UNIQUE INDEX "carts_token_hash_idx" ON "carts" USING btree ("token_hash");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "carts_token_hash_idx";
  ALTER TABLE "carts" DROP COLUMN "token_hash";`)
}
