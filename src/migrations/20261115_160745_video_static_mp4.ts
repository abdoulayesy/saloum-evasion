import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "videos" ADD COLUMN "static_mp4_url" varchar;
  ALTER TABLE "_videos_v" ADD COLUMN "version_static_mp4_url" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "videos" DROP COLUMN "static_mp4_url";
  ALTER TABLE "_videos_v" DROP COLUMN "version_static_mp4_url";`)
}
