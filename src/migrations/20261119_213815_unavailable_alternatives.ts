import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_bookings_lines_traveller_choice" AS ENUM('alternative_1', 'alternative_2', 'refund');
  CREATE TABLE "bookings_lines_alternatives" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"price" numeric NOT NULL
  );
  
  ALTER TABLE "bookings_lines" ADD COLUMN "unavailable_at" timestamp(3) with time zone;
  ALTER TABLE "bookings_lines" ADD COLUMN "choice_deadline" timestamp(3) with time zone;
  ALTER TABLE "bookings_lines" ADD COLUMN "traveller_choice" "enum_bookings_lines_traveller_choice";
  ALTER TABLE "bookings_lines_alternatives" ADD CONSTRAINT "bookings_lines_alternatives_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bookings_lines"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "bookings_lines_alternatives_order_idx" ON "bookings_lines_alternatives" USING btree ("_order");
  CREATE INDEX "bookings_lines_alternatives_parent_id_idx" ON "bookings_lines_alternatives" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "bookings_lines_alternatives" CASCADE;
  ALTER TABLE "bookings_lines" DROP COLUMN "unavailable_at";
  ALTER TABLE "bookings_lines" DROP COLUMN "choice_deadline";
  ALTER TABLE "bookings_lines" DROP COLUMN "traveller_choice";
  DROP TYPE "public"."enum_bookings_lines_traveller_choice";`)
}
