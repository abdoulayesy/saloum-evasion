import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guides_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guides_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guides_v_published_locale" AS ENUM('fr', 'en');
  CREATE TABLE "team_members_same_as" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "guides" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_image_id" integer,
  	"theme_id" integer,
  	"priority" numeric DEFAULT 100,
  	"author_id" integer,
  	"reviewer_id" integer,
  	"requires_community_review" boolean DEFAULT false,
  	"substantive_update" boolean DEFAULT false,
  	"published_on" varchar,
  	"updated_on" varchar,
  	"seo_share_image_id" integer,
  	"seo_noindex" boolean DEFAULT false,
  	"locale_status_en_published" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_guides_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "guides_locales" (
  	"title" varchar,
  	"standfirst" varchar,
  	"body" jsonb,
  	"reading_minutes" numeric,
  	"seo_slug" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_target_keyword" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "guides_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"faq_items_id" integer,
  	"stays_id" integer,
  	"experiences_id" integer,
  	"accommodations_id" integer,
  	"destinations_id" integer
  );
  
  CREATE TABLE "_guides_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_hero_image_id" integer,
  	"version_theme_id" integer,
  	"version_priority" numeric DEFAULT 100,
  	"version_author_id" integer,
  	"version_reviewer_id" integer,
  	"version_requires_community_review" boolean DEFAULT false,
  	"version_substantive_update" boolean DEFAULT false,
  	"version_published_on" varchar,
  	"version_updated_on" varchar,
  	"version_seo_share_image_id" integer,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_locale_status_en_published" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__guides_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__guides_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_guides_v_locales" (
  	"version_title" varchar,
  	"version_standfirst" varchar,
  	"version_body" jsonb,
  	"version_reading_minutes" numeric,
  	"version_seo_slug" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_target_keyword" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guides_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"faq_items_id" integer,
  	"stays_id" integer,
  	"experiences_id" integer,
  	"accommodations_id" integer,
  	"destinations_id" integer
  );
  
  CREATE TABLE "guide_themes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "guide_themes_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "team_members" ADD COLUMN "slug" varchar;
  ALTER TABLE "team_members" ADD COLUMN "active" boolean DEFAULT true;
  ALTER TABLE "team_members_locales" ADD COLUMN "place" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "guides_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "guide_themes_id" integer;
  ALTER TABLE "team_members_same_as" ADD CONSTRAINT "team_members_same_as_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_theme_id_guide_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."guide_themes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_author_id_team_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_reviewer_id_team_members_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_seo_share_image_id_media_id_fk" FOREIGN KEY ("seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_locales" ADD CONSTRAINT "guides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_faq_items_fk" FOREIGN KEY ("faq_items_id") REFERENCES "public"."faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_stays_fk" FOREIGN KEY ("stays_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_accommodations_fk" FOREIGN KEY ("accommodations_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_destinations_fk" FOREIGN KEY ("destinations_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_parent_id_guides_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_theme_id_guide_themes_id_fk" FOREIGN KEY ("version_theme_id") REFERENCES "public"."guide_themes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_author_id_team_members_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_reviewer_id_team_members_id_fk" FOREIGN KEY ("version_reviewer_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_seo_share_image_id_media_id_fk" FOREIGN KEY ("version_seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_locales" ADD CONSTRAINT "_guides_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_faq_items_fk" FOREIGN KEY ("faq_items_id") REFERENCES "public"."faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_stays_fk" FOREIGN KEY ("stays_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_accommodations_fk" FOREIGN KEY ("accommodations_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_destinations_fk" FOREIGN KEY ("destinations_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guide_themes_locales" ADD CONSTRAINT "guide_themes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guide_themes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "team_members_same_as_order_idx" ON "team_members_same_as" USING btree ("_order");
  CREATE INDEX "team_members_same_as_parent_id_idx" ON "team_members_same_as" USING btree ("_parent_id");
  CREATE INDEX "guides_hero_image_idx" ON "guides" USING btree ("hero_image_id");
  CREATE INDEX "guides_theme_idx" ON "guides" USING btree ("theme_id");
  CREATE INDEX "guides_author_idx" ON "guides" USING btree ("author_id");
  CREATE INDEX "guides_reviewer_idx" ON "guides" USING btree ("reviewer_id");
  CREATE INDEX "guides_seo_seo_share_image_idx" ON "guides" USING btree ("seo_share_image_id");
  CREATE INDEX "guides_updated_at_idx" ON "guides" USING btree ("updated_at");
  CREATE INDEX "guides_created_at_idx" ON "guides" USING btree ("created_at");
  CREATE INDEX "guides__status_idx" ON "guides" USING btree ("_status");
  CREATE INDEX "guides_seo_seo_slug_idx" ON "guides_locales" USING btree ("seo_slug","_locale");
  CREATE UNIQUE INDEX "guides_locales_locale_parent_id_unique" ON "guides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guides_locales_parent_id_idx" ON "guides_locales" USING btree ("_parent_id");
  CREATE INDEX "guides_rels_order_idx" ON "guides_rels" USING btree ("order");
  CREATE INDEX "guides_rels_parent_idx" ON "guides_rels" USING btree ("parent_id");
  CREATE INDEX "guides_rels_path_idx" ON "guides_rels" USING btree ("path");
  CREATE INDEX "guides_rels_faq_items_id_idx" ON "guides_rels" USING btree ("faq_items_id");
  CREATE INDEX "guides_rels_stays_id_idx" ON "guides_rels" USING btree ("stays_id");
  CREATE INDEX "guides_rels_experiences_id_idx" ON "guides_rels" USING btree ("experiences_id");
  CREATE INDEX "guides_rels_accommodations_id_idx" ON "guides_rels" USING btree ("accommodations_id");
  CREATE INDEX "guides_rels_destinations_id_idx" ON "guides_rels" USING btree ("destinations_id");
  CREATE INDEX "_guides_v_parent_idx" ON "_guides_v" USING btree ("parent_id");
  CREATE INDEX "_guides_v_version_version_hero_image_idx" ON "_guides_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_guides_v_version_version_theme_idx" ON "_guides_v" USING btree ("version_theme_id");
  CREATE INDEX "_guides_v_version_version_author_idx" ON "_guides_v" USING btree ("version_author_id");
  CREATE INDEX "_guides_v_version_version_reviewer_idx" ON "_guides_v" USING btree ("version_reviewer_id");
  CREATE INDEX "_guides_v_version_seo_version_seo_share_image_idx" ON "_guides_v" USING btree ("version_seo_share_image_id");
  CREATE INDEX "_guides_v_version_version_updated_at_idx" ON "_guides_v" USING btree ("version_updated_at");
  CREATE INDEX "_guides_v_version_version_created_at_idx" ON "_guides_v" USING btree ("version_created_at");
  CREATE INDEX "_guides_v_version_version__status_idx" ON "_guides_v" USING btree ("version__status");
  CREATE INDEX "_guides_v_created_at_idx" ON "_guides_v" USING btree ("created_at");
  CREATE INDEX "_guides_v_updated_at_idx" ON "_guides_v" USING btree ("updated_at");
  CREATE INDEX "_guides_v_snapshot_idx" ON "_guides_v" USING btree ("snapshot");
  CREATE INDEX "_guides_v_published_locale_idx" ON "_guides_v" USING btree ("published_locale");
  CREATE INDEX "_guides_v_latest_idx" ON "_guides_v" USING btree ("latest");
  CREATE INDEX "_guides_v_version_seo_version_seo_slug_idx" ON "_guides_v_locales" USING btree ("version_seo_slug","_locale");
  CREATE UNIQUE INDEX "_guides_v_locales_locale_parent_id_unique" ON "_guides_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guides_v_locales_parent_id_idx" ON "_guides_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_rels_order_idx" ON "_guides_v_rels" USING btree ("order");
  CREATE INDEX "_guides_v_rels_parent_idx" ON "_guides_v_rels" USING btree ("parent_id");
  CREATE INDEX "_guides_v_rels_path_idx" ON "_guides_v_rels" USING btree ("path");
  CREATE INDEX "_guides_v_rels_faq_items_id_idx" ON "_guides_v_rels" USING btree ("faq_items_id");
  CREATE INDEX "_guides_v_rels_stays_id_idx" ON "_guides_v_rels" USING btree ("stays_id");
  CREATE INDEX "_guides_v_rels_experiences_id_idx" ON "_guides_v_rels" USING btree ("experiences_id");
  CREATE INDEX "_guides_v_rels_accommodations_id_idx" ON "_guides_v_rels" USING btree ("accommodations_id");
  CREATE INDEX "_guides_v_rels_destinations_id_idx" ON "_guides_v_rels" USING btree ("destinations_id");
  CREATE UNIQUE INDEX "guide_themes_key_idx" ON "guide_themes" USING btree ("key");
  CREATE INDEX "guide_themes_updated_at_idx" ON "guide_themes" USING btree ("updated_at");
  CREATE INDEX "guide_themes_created_at_idx" ON "guide_themes" USING btree ("created_at");
  CREATE UNIQUE INDEX "guide_themes_locales_locale_parent_id_unique" ON "guide_themes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guide_themes_locales_parent_id_idx" ON "guide_themes_locales" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guide_themes_fk" FOREIGN KEY ("guide_themes_id") REFERENCES "public"."guide_themes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "team_members_slug_idx" ON "team_members" USING btree ("slug");
  CREATE INDEX "payload_locked_documents_rels_guides_id_idx" ON "payload_locked_documents_rels" USING btree ("guides_id");
  CREATE INDEX "payload_locked_documents_rels_guide_themes_id_idx" ON "payload_locked_documents_rels" USING btree ("guide_themes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "team_members_same_as" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guide_themes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guide_themes_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "team_members_same_as" CASCADE;
  DROP TABLE "guides" CASCADE;
  DROP TABLE "guides_locales" CASCADE;
  DROP TABLE "guides_rels" CASCADE;
  DROP TABLE "_guides_v" CASCADE;
  DROP TABLE "_guides_v_locales" CASCADE;
  DROP TABLE "_guides_v_rels" CASCADE;
  DROP TABLE "guide_themes" CASCADE;
  DROP TABLE "guide_themes_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_guides_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_guide_themes_fk";
  
  DROP INDEX "team_members_slug_idx";
  DROP INDEX "payload_locked_documents_rels_guides_id_idx";
  DROP INDEX "payload_locked_documents_rels_guide_themes_id_idx";
  ALTER TABLE "team_members" DROP COLUMN "slug";
  ALTER TABLE "team_members" DROP COLUMN "active";
  ALTER TABLE "team_members_locales" DROP COLUMN "place";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "guides_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "guide_themes_id";
  DROP TYPE "public"."enum_guides_status";
  DROP TYPE "public"."enum__guides_v_version_status";
  DROP TYPE "public"."enum__guides_v_published_locale";`)
}
