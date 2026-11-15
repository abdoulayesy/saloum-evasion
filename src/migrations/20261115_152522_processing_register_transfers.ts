import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_processing_register_entries_locales" ADD COLUMN "transfers" varchar;
  ALTER TABLE "_pages_v_blocks_processing_register_entries_locales" ADD COLUMN "transfers" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_processing_register_entries_locales" DROP COLUMN "transfers";
  ALTER TABLE "_pages_v_blocks_processing_register_entries_locales" DROP COLUMN "transfers";`)
}
