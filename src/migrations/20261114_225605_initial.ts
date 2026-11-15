import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_stays_moods" AS ENUM('nature', 'culture', 'gastronomie', 'detente', 'aventure', 'famille');
  CREATE TYPE "public"."enum_stays_duration_category" AS ENUM('weekend', 'short', 'week');
  CREATE TYPE "public"."enum_stays_budget_band" AS ENUM('lt250k', '250k-500k', 'gt500k');
  CREATE TYPE "public"."enum_stays_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__stays_v_version_moods" AS ENUM('nature', 'culture', 'gastronomie', 'detente', 'aventure', 'famille');
  CREATE TYPE "public"."enum__stays_v_version_duration_category" AS ENUM('weekend', 'short', 'week');
  CREATE TYPE "public"."enum__stays_v_version_budget_band" AS ENUM('lt250k', '250k-500k', 'gt500k');
  CREATE TYPE "public"."enum__stays_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__stays_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_experiences_season_months" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum_experiences_level" AS ENUM('facile', 'modere', 'sportif');
  CREATE TYPE "public"."enum_experiences_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__experiences_v_version_season_months" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum__experiences_v_version_level" AS ENUM('facile', 'modere', 'sportif');
  CREATE TYPE "public"."enum__experiences_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__experiences_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_accommodations_amenities" AS ENUM('piscine', 'climatisation', 'wifi', 'vue-bolong', 'acces-plage', 'cuisine', 'parking', 'pmr');
  CREATE TYPE "public"."enum_accommodations_type" AS ENUM('villa', 'ecolodge', 'campement');
  CREATE TYPE "public"."enum_accommodations_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__accommodations_v_version_amenities" AS ENUM('piscine', 'climatisation', 'wifi', 'vue-bolong', 'acces-plage', 'cuisine', 'parking', 'pmr');
  CREATE TYPE "public"."enum__accommodations_v_version_type" AS ENUM('villa', 'ecolodge', 'campement');
  CREATE TYPE "public"."enum__accommodations_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__accommodations_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_destinations_kind" AS ENUM('village', 'ile', 'reserve');
  CREATE TYPE "public"."enum_destinations_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__destinations_v_version_kind" AS ENUM('village', 'ile', 'reserve');
  CREATE TYPE "public"."enum__destinations_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__destinations_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_universes_kind" AS ENUM('experience', 'stay');
  CREATE TYPE "public"."enum_universes_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__universes_v_version_kind" AS ENUM('experience', 'stay');
  CREATE TYPE "public"."enum__universes_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__universes_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_videos_captions_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_videos_format" AS ENUM('film', 'vertical15', 'loop');
  CREATE TYPE "public"."enum_videos_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__videos_v_version_captions_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum__videos_v_version_format" AS ENUM('film', 'vertical15', 'loop');
  CREATE TYPE "public"."enum__videos_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__videos_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_pages_blocks_cta_action" AS ENUM('request', 'whatsapp', 'stays');
  CREATE TYPE "public"."enum_pages_key" AS ENUM('home', 'commitment', 'about', 'faq', 'contact', 'legal', 'privacy', 'film', 'stays_list', 'experiences_hub', 'accommodations_list', 'destinations_list', 'not_found');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_action" AS ENUM('request', 'whatsapp', 'stays');
  CREATE TYPE "public"."enum__pages_v_version_key" AS ENUM('home', 'commitment', 'about', 'faq', 'contact', 'legal', 'privacy', 'film', 'stays_list', 'experiences_hub', 'accommodations_list', 'destinations_list', 'not_found');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_faq_items_category" AS ENUM('general', 'reservation', 'paiement', 'transport', 'sejour');
  CREATE TYPE "public"."enum_requests_items_kind" AS ENUM('stay', 'experience', 'accommodation');
  CREATE TYPE "public"."enum_requests_moods" AS ENUM('nature', 'culture', 'gastronomie', 'detente', 'aventure', 'famille');
  CREATE TYPE "public"."enum_requests_status" AS ENUM('new', 'in_progress', 'quoted', 'won', 'lost', 'spam');
  CREATE TYPE "public"."enum_requests_budget_band" AS ENUM('lt250k', '250k-500k', 'gt500k');
  CREATE TYPE "public"."enum_requests_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_redirects_type" AS ENUM('301');
  CREATE TYPE "public"."enum_redirects_reason" AS ENUM('slug_change', 'unpublished', 'manual');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_site_settings_payment_methods" AS ENUM('wave', 'orange_money', 'card');
  CREATE TYPE "public"."enum_navigation_main_route" AS ENUM('home', 'staysList', 'experiencesHub', 'accommodationsList', 'destinationsList', 'film', 'commitment', 'about', 'faq', 'contact', 'legal', 'privacy');
  CREATE TYPE "public"."enum_navigation_footer_route" AS ENUM('home', 'staysList', 'experiencesHub', 'accommodationsList', 'destinationsList', 'film', 'commitment', 'about', 'faq', 'contact', 'legal', 'privacy');
  CREATE TABLE "stays_moods" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_stays_moods",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "stays_itinerary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" numeric
  );
  
  CREATE TABLE "stays_itinerary_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "stays_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "stays_included_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "stays_not_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "stays_not_included_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "stays" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_image_id" integer,
  	"duration_nights" numeric,
  	"duration_category" "enum_stays_duration_category",
  	"pricing_low_season_per_person" numeric,
  	"pricing_high_season_per_person" numeric,
  	"budget_band" "enum_stays_budget_band",
  	"cancellation_policy_id" integer,
  	"map_illustration" varchar,
  	"max_travellers" numeric,
  	"featured" boolean DEFAULT false,
  	"seo_share_image_id" integer,
  	"seo_noindex" boolean DEFAULT false,
  	"locale_status_en_published" boolean DEFAULT false,
  	"replacement_target_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_stays_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "stays_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"pricing_basis" varchar DEFAULT 'par personne, base 2 adultes',
  	"body" jsonb,
  	"seo_slug" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_target_keyword" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "stays_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"destinations_id" integer,
  	"accommodations_id" integer,
  	"experiences_id" integer,
  	"stays_id" integer,
  	"faq_items_id" integer
  );
  
  CREATE TABLE "_stays_v_version_moods" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__stays_v_version_moods",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_stays_v_version_itinerary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"day" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_stays_v_version_itinerary_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_stays_v_version_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_stays_v_version_included_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_stays_v_version_not_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_stays_v_version_not_included_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_stays_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_hero_image_id" integer,
  	"version_duration_nights" numeric,
  	"version_duration_category" "enum__stays_v_version_duration_category",
  	"version_pricing_low_season_per_person" numeric,
  	"version_pricing_high_season_per_person" numeric,
  	"version_budget_band" "enum__stays_v_version_budget_band",
  	"version_cancellation_policy_id" integer,
  	"version_map_illustration" varchar,
  	"version_max_travellers" numeric,
  	"version_featured" boolean DEFAULT false,
  	"version_seo_share_image_id" integer,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_locale_status_en_published" boolean DEFAULT false,
  	"version_replacement_target_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__stays_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__stays_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_stays_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_pricing_basis" varchar DEFAULT 'par personne, base 2 adultes',
  	"version_body" jsonb,
  	"version_seo_slug" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_target_keyword" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_stays_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"destinations_id" integer,
  	"accommodations_id" integer,
  	"experiences_id" integer,
  	"stays_id" integer,
  	"faq_items_id" integer
  );
  
  CREATE TABLE "experiences_season_months" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_experiences_season_months",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "experiences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_image_id" integer,
  	"universe_id" integer,
  	"duration_minutes" numeric,
  	"level" "enum_experiences_level" DEFAULT 'facile',
  	"price_per_person" numeric,
  	"min_participants" numeric DEFAULT 1,
  	"destination_id" integer,
  	"seo_share_image_id" integer,
  	"seo_noindex" boolean DEFAULT false,
  	"locale_status_en_published" boolean DEFAULT false,
  	"replacement_target_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_experiences_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "experiences_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"meeting_point" varchar,
  	"body" jsonb,
  	"seo_slug" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_target_keyword" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "experiences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"faq_items_id" integer
  );
  
  CREATE TABLE "_experiences_v_version_season_months" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__experiences_v_version_season_months",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_experiences_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_hero_image_id" integer,
  	"version_universe_id" integer,
  	"version_duration_minutes" numeric,
  	"version_level" "enum__experiences_v_version_level" DEFAULT 'facile',
  	"version_price_per_person" numeric,
  	"version_min_participants" numeric DEFAULT 1,
  	"version_destination_id" integer,
  	"version_seo_share_image_id" integer,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_locale_status_en_published" boolean DEFAULT false,
  	"version_replacement_target_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__experiences_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__experiences_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_experiences_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_meeting_point" varchar,
  	"version_body" jsonb,
  	"version_seo_slug" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_target_keyword" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_experiences_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"faq_items_id" integer
  );
  
  CREATE TABLE "accommodations_amenities" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_accommodations_amenities",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "accommodations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_image_id" integer,
  	"type" "enum_accommodations_type",
  	"capacity" numeric,
  	"bedrooms" numeric,
  	"price_from_per_night" numeric,
  	"destination_id" integer,
  	"geo_latitude" numeric,
  	"geo_longitude" numeric,
  	"identifier" varchar,
  	"seo_share_image_id" integer,
  	"seo_noindex" boolean DEFAULT false,
  	"locale_status_en_published" boolean DEFAULT false,
  	"replacement_target_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_accommodations_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "accommodations_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"address" varchar,
  	"body" jsonb,
  	"seo_slug" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_target_keyword" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "accommodations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_accommodations_v_version_amenities" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__accommodations_v_version_amenities",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_accommodations_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_hero_image_id" integer,
  	"version_type" "enum__accommodations_v_version_type",
  	"version_capacity" numeric,
  	"version_bedrooms" numeric,
  	"version_price_from_per_night" numeric,
  	"version_destination_id" integer,
  	"version_geo_latitude" numeric,
  	"version_geo_longitude" numeric,
  	"version_identifier" varchar,
  	"version_seo_share_image_id" integer,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_locale_status_en_published" boolean DEFAULT false,
  	"version_replacement_target_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__accommodations_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__accommodations_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_accommodations_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_address" varchar,
  	"version_body" jsonb,
  	"version_seo_slug" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_target_keyword" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_accommodations_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "destinations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_destinations_kind" DEFAULT 'village',
  	"hero_image_id" integer,
  	"geo_latitude" numeric,
  	"geo_longitude" numeric,
  	"seo_share_image_id" integer,
  	"seo_noindex" boolean DEFAULT false,
  	"locale_status_en_published" boolean DEFAULT false,
  	"replacement_target_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_destinations_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "destinations_locales" (
  	"name" varchar,
  	"intro" varchar,
  	"body" jsonb,
  	"seo_slug" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_target_keyword" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "destinations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_destinations_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_kind" "enum__destinations_v_version_kind" DEFAULT 'village',
  	"version_hero_image_id" integer,
  	"version_geo_latitude" numeric,
  	"version_geo_longitude" numeric,
  	"version_seo_share_image_id" integer,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_locale_status_en_published" boolean DEFAULT false,
  	"version_replacement_target_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__destinations_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__destinations_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_destinations_v_locales" (
  	"version_name" varchar,
  	"version_intro" varchar,
  	"version_body" jsonb,
  	"version_seo_slug" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_target_keyword" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_destinations_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "universes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_universes_kind" DEFAULT 'experience',
  	"image_id" integer,
  	"order" numeric DEFAULT 0,
  	"seo_share_image_id" integer,
  	"seo_noindex" boolean DEFAULT false,
  	"locale_status_en_published" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_universes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "universes_locales" (
  	"name" varchar,
  	"intro" varchar,
  	"seo_slug" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_target_keyword" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_universes_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_kind" "enum__universes_v_version_kind" DEFAULT 'experience',
  	"version_image_id" integer,
  	"version_order" numeric DEFAULT 0,
  	"version_seo_share_image_id" integer,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_locale_status_en_published" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__universes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__universes_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_universes_v_locales" (
  	"version_name" varchar,
  	"version_intro" varchar,
  	"version_seo_slug" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_target_keyword" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "videos_captions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"locale" "enum_videos_captions_locale",
  	"url" varchar
  );
  
  CREATE TABLE "videos_chapters" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_seconds" numeric
  );
  
  CREATE TABLE "videos_chapters_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"format" "enum_videos_format",
  	"mux_playback_id" varchar,
  	"duration_seconds" numeric,
  	"poster_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"provenance_author" varchar,
  	"provenance_place" varchar,
  	"provenance_date" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_videos_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "videos_locales" (
  	"title" varchar,
  	"description" varchar,
  	"descriptive_transcript" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_videos_v_version_captions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"locale" "enum__videos_v_version_captions_locale",
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_videos_v_version_chapters" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"start_seconds" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_videos_v_version_chapters_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_videos_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_format" "enum__videos_v_version_format",
  	"version_mux_playback_id" varchar,
  	"version_duration_seconds" numeric,
  	"version_poster_id" integer,
  	"version_upload_date" timestamp(3) with time zone,
  	"version_provenance_author" varchar,
  	"version_provenance_place" varchar,
  	"version_provenance_date" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__videos_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__videos_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_videos_v_locales" (
  	"version_title" varchar,
  	"version_description" varchar,
  	"version_descriptive_transcript" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt_fr" varchar NOT NULL,
  	"alt_en" varchar NOT NULL,
  	"provenance_author" varchar NOT NULL,
  	"provenance_place" varchar NOT NULL,
  	"provenance_date" timestamp(3) with time zone NOT NULL,
  	"blur_data_u_r_l" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_hero_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_rich_text_locales" (
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_team_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_figures_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "pages_blocks_figures_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_figures" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_figures_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_gallery_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_steps_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_steps_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_guarantees" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_guarantees_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"action" "enum_pages_blocks_cta_action" DEFAULT 'request',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_processing_register_entries" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_processing_register_entries_locales" (
  	"purpose" varchar,
  	"data" varchar,
  	"legal_basis" varchar,
  	"retention" varchar,
  	"recipients" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_processing_register" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" "enum_pages_key",
  	"seo_share_image_id" integer,
  	"seo_noindex" boolean DEFAULT false,
  	"locale_status_en_published" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar,
  	"seo_slug" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_target_keyword" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"team_members_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "_pages_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text_locales" (
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_figures_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_figures_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_figures" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_figures_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_gallery_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_steps_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_steps_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_guarantees" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_guarantees_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" "enum__pages_v_blocks_cta_action" DEFAULT 'request',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_processing_register_entries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_processing_register_entries_locales" (
  	"purpose" varchar,
  	"data" varchar,
  	"legal_basis" varchar,
  	"retention" varchar,
  	"recipients" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_processing_register" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_key" "enum__pages_v_version_key",
  	"version_seo_share_image_id" integer,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_locale_status_en_published" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pages_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_title" varchar,
  	"version_seo_slug" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_target_keyword" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"team_members_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "faq_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"category" "enum_faq_items_category" DEFAULT 'general' NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faq_items_locales" (
  	"question" varchar,
  	"answer" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "cancellation_policies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cancellation_policies_locales" (
  	"summary" varchar,
  	"details" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "team_members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"photo_id" integer NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "team_members_locales" (
  	"role" varchar,
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "requests_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_requests_items_kind" NOT NULL,
  	"title_snapshot" varchar NOT NULL
  );
  
  CREATE TABLE "requests_moods" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_requests_moods",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar,
  	"submission_id" varchar NOT NULL,
  	"status" "enum_requests_status" DEFAULT 'new' NOT NULL,
  	"arrival_date" timestamp(3) with time zone NOT NULL,
  	"departure_date" timestamp(3) with time zone,
  	"adults" numeric NOT NULL,
  	"children" numeric DEFAULT 0,
  	"budget_band" "enum_requests_budget_band",
  	"first_name" varchar NOT NULL,
  	"whatsapp" varchar NOT NULL,
  	"email" varchar,
  	"message" varchar,
  	"locale" "enum_requests_locale" NOT NULL,
  	"source_path" varchar,
  	"consent_at" timestamp(3) with time zone NOT NULL,
  	"notified_at" timestamp(3) with time zone,
  	"notify_attempts" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "requests_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stays_id" integer,
  	"experiences_id" integer,
  	"accommodations_id" integer
  );
  
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to" varchar NOT NULL,
  	"type" "enum_redirects_type" DEFAULT '301' NOT NULL,
  	"reason" "enum_redirects_reason" DEFAULT 'manual' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rate_limits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ip_hash" varchar NOT NULL,
  	"window_start" timestamp(3) with time zone NOT NULL,
  	"count" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stays_id" integer,
  	"experiences_id" integer,
  	"accommodations_id" integer,
  	"destinations_id" integer,
  	"universes_id" integer,
  	"videos_id" integer,
  	"media_id" integer,
  	"pages_id" integer,
  	"faq_items_id" integer,
  	"cancellation_policies_id" integer,
  	"team_members_id" integer,
  	"requests_id" integer,
  	"redirects_id" integer,
  	"rate_limits_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_same_as" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_high_seasons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_guarantees" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar
  );
  
  CREATE TABLE "site_settings_guarantees_locales" (
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_payment_methods" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_site_settings_payment_methods",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_name" varchar DEFAULT 'Saloum Évasion' NOT NULL,
  	"legal_name" varchar,
  	"address_street_address" varchar,
  	"address_locality" varchar DEFAULT 'Ndangane' NOT NULL,
  	"address_region" varchar DEFAULT 'Fatick' NOT NULL,
  	"address_postal_code" varchar,
  	"address_country" varchar DEFAULT 'SN' NOT NULL,
  	"phone" varchar,
  	"whatsapp_number" varchar,
  	"email" varchar,
  	"geo_latitude" numeric,
  	"geo_longitude" numeric,
  	"notification_email" varchar,
  	"fallback_notification_email" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"response_time_text" varchar DEFAULT 'Réponse sous 24 h, souvent dans l’heure',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "navigation_main" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"route" "enum_navigation_main_route" NOT NULL
  );
  
  CREATE TABLE "navigation_main_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"route" "enum_navigation_footer_route" NOT NULL
  );
  
  CREATE TABLE "navigation_footer_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "stays_moods" ADD CONSTRAINT "stays_moods_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays_itinerary" ADD CONSTRAINT "stays_itinerary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays_itinerary_locales" ADD CONSTRAINT "stays_itinerary_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stays_itinerary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays_included" ADD CONSTRAINT "stays_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays_included_locales" ADD CONSTRAINT "stays_included_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stays_included"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays_not_included" ADD CONSTRAINT "stays_not_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays_not_included_locales" ADD CONSTRAINT "stays_not_included_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stays_not_included"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays" ADD CONSTRAINT "stays_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stays" ADD CONSTRAINT "stays_cancellation_policy_id_cancellation_policies_id_fk" FOREIGN KEY ("cancellation_policy_id") REFERENCES "public"."cancellation_policies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stays" ADD CONSTRAINT "stays_seo_share_image_id_media_id_fk" FOREIGN KEY ("seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stays" ADD CONSTRAINT "stays_replacement_target_id_stays_id_fk" FOREIGN KEY ("replacement_target_id") REFERENCES "public"."stays"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stays_locales" ADD CONSTRAINT "stays_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays_rels" ADD CONSTRAINT "stays_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays_rels" ADD CONSTRAINT "stays_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays_rels" ADD CONSTRAINT "stays_rels_destinations_fk" FOREIGN KEY ("destinations_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays_rels" ADD CONSTRAINT "stays_rels_accommodations_fk" FOREIGN KEY ("accommodations_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays_rels" ADD CONSTRAINT "stays_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays_rels" ADD CONSTRAINT "stays_rels_stays_fk" FOREIGN KEY ("stays_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays_rels" ADD CONSTRAINT "stays_rels_faq_items_fk" FOREIGN KEY ("faq_items_id") REFERENCES "public"."faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stays_v_version_moods" ADD CONSTRAINT "_stays_v_version_moods_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_stays_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stays_v_version_itinerary" ADD CONSTRAINT "_stays_v_version_itinerary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_stays_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stays_v_version_itinerary_locales" ADD CONSTRAINT "_stays_v_version_itinerary_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_stays_v_version_itinerary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stays_v_version_included" ADD CONSTRAINT "_stays_v_version_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_stays_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stays_v_version_included_locales" ADD CONSTRAINT "_stays_v_version_included_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_stays_v_version_included"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stays_v_version_not_included" ADD CONSTRAINT "_stays_v_version_not_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_stays_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stays_v_version_not_included_locales" ADD CONSTRAINT "_stays_v_version_not_included_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_stays_v_version_not_included"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stays_v" ADD CONSTRAINT "_stays_v_parent_id_stays_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."stays"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_stays_v" ADD CONSTRAINT "_stays_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_stays_v" ADD CONSTRAINT "_stays_v_version_cancellation_policy_id_cancellation_policies_id_fk" FOREIGN KEY ("version_cancellation_policy_id") REFERENCES "public"."cancellation_policies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_stays_v" ADD CONSTRAINT "_stays_v_version_seo_share_image_id_media_id_fk" FOREIGN KEY ("version_seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_stays_v" ADD CONSTRAINT "_stays_v_version_replacement_target_id_stays_id_fk" FOREIGN KEY ("version_replacement_target_id") REFERENCES "public"."stays"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_stays_v_locales" ADD CONSTRAINT "_stays_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_stays_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stays_v_rels" ADD CONSTRAINT "_stays_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_stays_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stays_v_rels" ADD CONSTRAINT "_stays_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stays_v_rels" ADD CONSTRAINT "_stays_v_rels_destinations_fk" FOREIGN KEY ("destinations_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stays_v_rels" ADD CONSTRAINT "_stays_v_rels_accommodations_fk" FOREIGN KEY ("accommodations_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stays_v_rels" ADD CONSTRAINT "_stays_v_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stays_v_rels" ADD CONSTRAINT "_stays_v_rels_stays_fk" FOREIGN KEY ("stays_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stays_v_rels" ADD CONSTRAINT "_stays_v_rels_faq_items_fk" FOREIGN KEY ("faq_items_id") REFERENCES "public"."faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experiences_season_months" ADD CONSTRAINT "experiences_season_months_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experiences" ADD CONSTRAINT "experiences_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "experiences" ADD CONSTRAINT "experiences_universe_id_universes_id_fk" FOREIGN KEY ("universe_id") REFERENCES "public"."universes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "experiences" ADD CONSTRAINT "experiences_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "experiences" ADD CONSTRAINT "experiences_seo_share_image_id_media_id_fk" FOREIGN KEY ("seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "experiences" ADD CONSTRAINT "experiences_replacement_target_id_experiences_id_fk" FOREIGN KEY ("replacement_target_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "experiences_locales" ADD CONSTRAINT "experiences_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experiences_rels" ADD CONSTRAINT "experiences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experiences_rels" ADD CONSTRAINT "experiences_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experiences_rels" ADD CONSTRAINT "experiences_rels_faq_items_fk" FOREIGN KEY ("faq_items_id") REFERENCES "public"."faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v_version_season_months" ADD CONSTRAINT "_experiences_v_version_season_months_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_parent_id_experiences_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_version_universe_id_universes_id_fk" FOREIGN KEY ("version_universe_id") REFERENCES "public"."universes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_version_destination_id_destinations_id_fk" FOREIGN KEY ("version_destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_version_seo_share_image_id_media_id_fk" FOREIGN KEY ("version_seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_version_replacement_target_id_experiences_id_fk" FOREIGN KEY ("version_replacement_target_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v_locales" ADD CONSTRAINT "_experiences_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v_rels" ADD CONSTRAINT "_experiences_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v_rels" ADD CONSTRAINT "_experiences_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v_rels" ADD CONSTRAINT "_experiences_v_rels_faq_items_fk" FOREIGN KEY ("faq_items_id") REFERENCES "public"."faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "accommodations_amenities" ADD CONSTRAINT "accommodations_amenities_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_seo_share_image_id_media_id_fk" FOREIGN KEY ("seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_replacement_target_id_accommodations_id_fk" FOREIGN KEY ("replacement_target_id") REFERENCES "public"."accommodations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accommodations_locales" ADD CONSTRAINT "accommodations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "accommodations_rels" ADD CONSTRAINT "accommodations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "accommodations_rels" ADD CONSTRAINT "accommodations_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_accommodations_v_version_amenities" ADD CONSTRAINT "_accommodations_v_version_amenities_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_accommodations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_accommodations_v" ADD CONSTRAINT "_accommodations_v_parent_id_accommodations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."accommodations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_accommodations_v" ADD CONSTRAINT "_accommodations_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_accommodations_v" ADD CONSTRAINT "_accommodations_v_version_destination_id_destinations_id_fk" FOREIGN KEY ("version_destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_accommodations_v" ADD CONSTRAINT "_accommodations_v_version_seo_share_image_id_media_id_fk" FOREIGN KEY ("version_seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_accommodations_v" ADD CONSTRAINT "_accommodations_v_version_replacement_target_id_accommodations_id_fk" FOREIGN KEY ("version_replacement_target_id") REFERENCES "public"."accommodations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_accommodations_v_locales" ADD CONSTRAINT "_accommodations_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_accommodations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_accommodations_v_rels" ADD CONSTRAINT "_accommodations_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_accommodations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_accommodations_v_rels" ADD CONSTRAINT "_accommodations_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "destinations" ADD CONSTRAINT "destinations_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "destinations" ADD CONSTRAINT "destinations_seo_share_image_id_media_id_fk" FOREIGN KEY ("seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "destinations" ADD CONSTRAINT "destinations_replacement_target_id_destinations_id_fk" FOREIGN KEY ("replacement_target_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "destinations_locales" ADD CONSTRAINT "destinations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "destinations_rels" ADD CONSTRAINT "destinations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "destinations_rels" ADD CONSTRAINT "destinations_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_destinations_v" ADD CONSTRAINT "_destinations_v_parent_id_destinations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_destinations_v" ADD CONSTRAINT "_destinations_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_destinations_v" ADD CONSTRAINT "_destinations_v_version_seo_share_image_id_media_id_fk" FOREIGN KEY ("version_seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_destinations_v" ADD CONSTRAINT "_destinations_v_version_replacement_target_id_destinations_id_fk" FOREIGN KEY ("version_replacement_target_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_destinations_v_locales" ADD CONSTRAINT "_destinations_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_destinations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_destinations_v_rels" ADD CONSTRAINT "_destinations_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_destinations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_destinations_v_rels" ADD CONSTRAINT "_destinations_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "universes" ADD CONSTRAINT "universes_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "universes" ADD CONSTRAINT "universes_seo_share_image_id_media_id_fk" FOREIGN KEY ("seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "universes_locales" ADD CONSTRAINT "universes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."universes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_universes_v" ADD CONSTRAINT "_universes_v_parent_id_universes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."universes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_universes_v" ADD CONSTRAINT "_universes_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_universes_v" ADD CONSTRAINT "_universes_v_version_seo_share_image_id_media_id_fk" FOREIGN KEY ("version_seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_universes_v_locales" ADD CONSTRAINT "_universes_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_universes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "videos_captions" ADD CONSTRAINT "videos_captions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "videos_chapters" ADD CONSTRAINT "videos_chapters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "videos_chapters_locales" ADD CONSTRAINT "videos_chapters_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."videos_chapters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos_locales" ADD CONSTRAINT "videos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_videos_v_version_captions" ADD CONSTRAINT "_videos_v_version_captions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_videos_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_videos_v_version_chapters" ADD CONSTRAINT "_videos_v_version_chapters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_videos_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_videos_v_version_chapters_locales" ADD CONSTRAINT "_videos_v_version_chapters_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_videos_v_version_chapters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_parent_id_videos_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_poster_id_media_id_fk" FOREIGN KEY ("version_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v_locales" ADD CONSTRAINT "_videos_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_videos_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_locales" ADD CONSTRAINT "pages_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text_locales" ADD CONSTRAINT "pages_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team" ADD CONSTRAINT "pages_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_locales" ADD CONSTRAINT "pages_blocks_team_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_figures_items" ADD CONSTRAINT "pages_blocks_figures_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_figures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_figures_items_locales" ADD CONSTRAINT "pages_blocks_figures_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_figures_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_figures" ADD CONSTRAINT "pages_blocks_figures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_figures_locales" ADD CONSTRAINT "pages_blocks_figures_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_figures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery" ADD CONSTRAINT "pages_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_locales" ADD CONSTRAINT "pages_blocks_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps_items" ADD CONSTRAINT "pages_blocks_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps_items_locales" ADD CONSTRAINT "pages_blocks_steps_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps" ADD CONSTRAINT "pages_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps_locales" ADD CONSTRAINT "pages_blocks_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_guarantees" ADD CONSTRAINT "pages_blocks_guarantees_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_guarantees_locales" ADD CONSTRAINT "pages_blocks_guarantees_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_guarantees"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_locales" ADD CONSTRAINT "pages_blocks_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_processing_register_entries" ADD CONSTRAINT "pages_blocks_processing_register_entries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_processing_register"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_processing_register_entries_locales" ADD CONSTRAINT "pages_blocks_processing_register_entries_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_processing_register_entries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_processing_register" ADD CONSTRAINT "pages_blocks_processing_register_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_share_image_id_media_id_fk" FOREIGN KEY ("seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_locales" ADD CONSTRAINT "_pages_v_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD CONSTRAINT "_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text_locales" ADD CONSTRAINT "_pages_v_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team" ADD CONSTRAINT "_pages_v_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_locales" ADD CONSTRAINT "_pages_v_blocks_team_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_figures_items" ADD CONSTRAINT "_pages_v_blocks_figures_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_figures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_figures_items_locales" ADD CONSTRAINT "_pages_v_blocks_figures_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_figures_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_figures" ADD CONSTRAINT "_pages_v_blocks_figures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_figures_locales" ADD CONSTRAINT "_pages_v_blocks_figures_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_figures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery" ADD CONSTRAINT "_pages_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_locales" ADD CONSTRAINT "_pages_v_blocks_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps_items" ADD CONSTRAINT "_pages_v_blocks_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps_items_locales" ADD CONSTRAINT "_pages_v_blocks_steps_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps" ADD CONSTRAINT "_pages_v_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps_locales" ADD CONSTRAINT "_pages_v_blocks_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_guarantees" ADD CONSTRAINT "_pages_v_blocks_guarantees_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_guarantees_locales" ADD CONSTRAINT "_pages_v_blocks_guarantees_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_guarantees"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_locales" ADD CONSTRAINT "_pages_v_blocks_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_processing_register_entries" ADD CONSTRAINT "_pages_v_blocks_processing_register_entries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_processing_register"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_processing_register_entries_locales" ADD CONSTRAINT "_pages_v_blocks_processing_register_entries_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_processing_register_entries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_processing_register" ADD CONSTRAINT "_pages_v_blocks_processing_register_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_share_image_id_media_id_fk" FOREIGN KEY ("version_seo_share_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faq_items_locales" ADD CONSTRAINT "faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cancellation_policies_locales" ADD CONSTRAINT "cancellation_policies_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cancellation_policies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members" ADD CONSTRAINT "team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_locales" ADD CONSTRAINT "team_members_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "requests_items" ADD CONSTRAINT "requests_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "requests_moods" ADD CONSTRAINT "requests_moods_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "requests_rels" ADD CONSTRAINT "requests_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "requests_rels" ADD CONSTRAINT "requests_rels_stays_fk" FOREIGN KEY ("stays_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "requests_rels" ADD CONSTRAINT "requests_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "requests_rels" ADD CONSTRAINT "requests_rels_accommodations_fk" FOREIGN KEY ("accommodations_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stays_fk" FOREIGN KEY ("stays_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_accommodations_fk" FOREIGN KEY ("accommodations_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_destinations_fk" FOREIGN KEY ("destinations_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_universes_fk" FOREIGN KEY ("universes_id") REFERENCES "public"."universes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faq_items_fk" FOREIGN KEY ("faq_items_id") REFERENCES "public"."faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cancellation_policies_fk" FOREIGN KEY ("cancellation_policies_id") REFERENCES "public"."cancellation_policies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_requests_fk" FOREIGN KEY ("requests_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rate_limits_fk" FOREIGN KEY ("rate_limits_id") REFERENCES "public"."rate_limits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_same_as" ADD CONSTRAINT "site_settings_same_as_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_high_seasons" ADD CONSTRAINT "site_settings_high_seasons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_guarantees" ADD CONSTRAINT "site_settings_guarantees_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_guarantees_locales" ADD CONSTRAINT "site_settings_guarantees_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_guarantees"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_payment_methods" ADD CONSTRAINT "site_settings_payment_methods_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_main" ADD CONSTRAINT "navigation_main_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_main_locales" ADD CONSTRAINT "navigation_main_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_main"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer" ADD CONSTRAINT "navigation_footer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_locales" ADD CONSTRAINT "navigation_footer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "stays_moods_order_idx" ON "stays_moods" USING btree ("order");
  CREATE INDEX "stays_moods_parent_idx" ON "stays_moods" USING btree ("parent_id");
  CREATE INDEX "stays_itinerary_order_idx" ON "stays_itinerary" USING btree ("_order");
  CREATE INDEX "stays_itinerary_parent_id_idx" ON "stays_itinerary" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "stays_itinerary_locales_locale_parent_id_unique" ON "stays_itinerary_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "stays_itinerary_locales_parent_id_idx" ON "stays_itinerary_locales" USING btree ("_parent_id");
  CREATE INDEX "stays_included_order_idx" ON "stays_included" USING btree ("_order");
  CREATE INDEX "stays_included_parent_id_idx" ON "stays_included" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "stays_included_locales_locale_parent_id_unique" ON "stays_included_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "stays_included_locales_parent_id_idx" ON "stays_included_locales" USING btree ("_parent_id");
  CREATE INDEX "stays_not_included_order_idx" ON "stays_not_included" USING btree ("_order");
  CREATE INDEX "stays_not_included_parent_id_idx" ON "stays_not_included" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "stays_not_included_locales_locale_parent_id_unique" ON "stays_not_included_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "stays_not_included_locales_parent_id_idx" ON "stays_not_included_locales" USING btree ("_parent_id");
  CREATE INDEX "stays_hero_image_idx" ON "stays" USING btree ("hero_image_id");
  CREATE INDEX "stays_cancellation_policy_idx" ON "stays" USING btree ("cancellation_policy_id");
  CREATE INDEX "stays_seo_seo_share_image_idx" ON "stays" USING btree ("seo_share_image_id");
  CREATE INDEX "stays_replacement_target_idx" ON "stays" USING btree ("replacement_target_id");
  CREATE INDEX "stays_updated_at_idx" ON "stays" USING btree ("updated_at");
  CREATE INDEX "stays_created_at_idx" ON "stays" USING btree ("created_at");
  CREATE INDEX "stays__status_idx" ON "stays" USING btree ("_status");
  CREATE INDEX "stays_seo_seo_slug_idx" ON "stays_locales" USING btree ("seo_slug","_locale");
  CREATE UNIQUE INDEX "stays_locales_locale_parent_id_unique" ON "stays_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "stays_locales_parent_id_idx" ON "stays_locales" USING btree ("_parent_id");
  CREATE INDEX "stays_rels_order_idx" ON "stays_rels" USING btree ("order");
  CREATE INDEX "stays_rels_parent_idx" ON "stays_rels" USING btree ("parent_id");
  CREATE INDEX "stays_rels_path_idx" ON "stays_rels" USING btree ("path");
  CREATE INDEX "stays_rels_media_id_idx" ON "stays_rels" USING btree ("media_id");
  CREATE INDEX "stays_rels_destinations_id_idx" ON "stays_rels" USING btree ("destinations_id");
  CREATE INDEX "stays_rels_accommodations_id_idx" ON "stays_rels" USING btree ("accommodations_id");
  CREATE INDEX "stays_rels_experiences_id_idx" ON "stays_rels" USING btree ("experiences_id");
  CREATE INDEX "stays_rels_stays_id_idx" ON "stays_rels" USING btree ("stays_id");
  CREATE INDEX "stays_rels_faq_items_id_idx" ON "stays_rels" USING btree ("faq_items_id");
  CREATE INDEX "_stays_v_version_moods_order_idx" ON "_stays_v_version_moods" USING btree ("order");
  CREATE INDEX "_stays_v_version_moods_parent_idx" ON "_stays_v_version_moods" USING btree ("parent_id");
  CREATE INDEX "_stays_v_version_itinerary_order_idx" ON "_stays_v_version_itinerary" USING btree ("_order");
  CREATE INDEX "_stays_v_version_itinerary_parent_id_idx" ON "_stays_v_version_itinerary" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_stays_v_version_itinerary_locales_locale_parent_id_unique" ON "_stays_v_version_itinerary_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_stays_v_version_itinerary_locales_parent_id_idx" ON "_stays_v_version_itinerary_locales" USING btree ("_parent_id");
  CREATE INDEX "_stays_v_version_included_order_idx" ON "_stays_v_version_included" USING btree ("_order");
  CREATE INDEX "_stays_v_version_included_parent_id_idx" ON "_stays_v_version_included" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_stays_v_version_included_locales_locale_parent_id_unique" ON "_stays_v_version_included_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_stays_v_version_included_locales_parent_id_idx" ON "_stays_v_version_included_locales" USING btree ("_parent_id");
  CREATE INDEX "_stays_v_version_not_included_order_idx" ON "_stays_v_version_not_included" USING btree ("_order");
  CREATE INDEX "_stays_v_version_not_included_parent_id_idx" ON "_stays_v_version_not_included" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_stays_v_version_not_included_locales_locale_parent_id_uniqu" ON "_stays_v_version_not_included_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_stays_v_version_not_included_locales_parent_id_idx" ON "_stays_v_version_not_included_locales" USING btree ("_parent_id");
  CREATE INDEX "_stays_v_parent_idx" ON "_stays_v" USING btree ("parent_id");
  CREATE INDEX "_stays_v_version_version_hero_image_idx" ON "_stays_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_stays_v_version_version_cancellation_policy_idx" ON "_stays_v" USING btree ("version_cancellation_policy_id");
  CREATE INDEX "_stays_v_version_seo_version_seo_share_image_idx" ON "_stays_v" USING btree ("version_seo_share_image_id");
  CREATE INDEX "_stays_v_version_version_replacement_target_idx" ON "_stays_v" USING btree ("version_replacement_target_id");
  CREATE INDEX "_stays_v_version_version_updated_at_idx" ON "_stays_v" USING btree ("version_updated_at");
  CREATE INDEX "_stays_v_version_version_created_at_idx" ON "_stays_v" USING btree ("version_created_at");
  CREATE INDEX "_stays_v_version_version__status_idx" ON "_stays_v" USING btree ("version__status");
  CREATE INDEX "_stays_v_created_at_idx" ON "_stays_v" USING btree ("created_at");
  CREATE INDEX "_stays_v_updated_at_idx" ON "_stays_v" USING btree ("updated_at");
  CREATE INDEX "_stays_v_snapshot_idx" ON "_stays_v" USING btree ("snapshot");
  CREATE INDEX "_stays_v_published_locale_idx" ON "_stays_v" USING btree ("published_locale");
  CREATE INDEX "_stays_v_latest_idx" ON "_stays_v" USING btree ("latest");
  CREATE INDEX "_stays_v_version_seo_version_seo_slug_idx" ON "_stays_v_locales" USING btree ("version_seo_slug","_locale");
  CREATE UNIQUE INDEX "_stays_v_locales_locale_parent_id_unique" ON "_stays_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_stays_v_locales_parent_id_idx" ON "_stays_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_stays_v_rels_order_idx" ON "_stays_v_rels" USING btree ("order");
  CREATE INDEX "_stays_v_rels_parent_idx" ON "_stays_v_rels" USING btree ("parent_id");
  CREATE INDEX "_stays_v_rels_path_idx" ON "_stays_v_rels" USING btree ("path");
  CREATE INDEX "_stays_v_rels_media_id_idx" ON "_stays_v_rels" USING btree ("media_id");
  CREATE INDEX "_stays_v_rels_destinations_id_idx" ON "_stays_v_rels" USING btree ("destinations_id");
  CREATE INDEX "_stays_v_rels_accommodations_id_idx" ON "_stays_v_rels" USING btree ("accommodations_id");
  CREATE INDEX "_stays_v_rels_experiences_id_idx" ON "_stays_v_rels" USING btree ("experiences_id");
  CREATE INDEX "_stays_v_rels_stays_id_idx" ON "_stays_v_rels" USING btree ("stays_id");
  CREATE INDEX "_stays_v_rels_faq_items_id_idx" ON "_stays_v_rels" USING btree ("faq_items_id");
  CREATE INDEX "experiences_season_months_order_idx" ON "experiences_season_months" USING btree ("order");
  CREATE INDEX "experiences_season_months_parent_idx" ON "experiences_season_months" USING btree ("parent_id");
  CREATE INDEX "experiences_hero_image_idx" ON "experiences" USING btree ("hero_image_id");
  CREATE INDEX "experiences_universe_idx" ON "experiences" USING btree ("universe_id");
  CREATE INDEX "experiences_destination_idx" ON "experiences" USING btree ("destination_id");
  CREATE INDEX "experiences_seo_seo_share_image_idx" ON "experiences" USING btree ("seo_share_image_id");
  CREATE INDEX "experiences_replacement_target_idx" ON "experiences" USING btree ("replacement_target_id");
  CREATE INDEX "experiences_updated_at_idx" ON "experiences" USING btree ("updated_at");
  CREATE INDEX "experiences_created_at_idx" ON "experiences" USING btree ("created_at");
  CREATE INDEX "experiences__status_idx" ON "experiences" USING btree ("_status");
  CREATE INDEX "experiences_seo_seo_slug_idx" ON "experiences_locales" USING btree ("seo_slug","_locale");
  CREATE UNIQUE INDEX "experiences_locales_locale_parent_id_unique" ON "experiences_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "experiences_locales_parent_id_idx" ON "experiences_locales" USING btree ("_parent_id");
  CREATE INDEX "experiences_rels_order_idx" ON "experiences_rels" USING btree ("order");
  CREATE INDEX "experiences_rels_parent_idx" ON "experiences_rels" USING btree ("parent_id");
  CREATE INDEX "experiences_rels_path_idx" ON "experiences_rels" USING btree ("path");
  CREATE INDEX "experiences_rels_media_id_idx" ON "experiences_rels" USING btree ("media_id");
  CREATE INDEX "experiences_rels_faq_items_id_idx" ON "experiences_rels" USING btree ("faq_items_id");
  CREATE INDEX "_experiences_v_version_season_months_order_idx" ON "_experiences_v_version_season_months" USING btree ("order");
  CREATE INDEX "_experiences_v_version_season_months_parent_idx" ON "_experiences_v_version_season_months" USING btree ("parent_id");
  CREATE INDEX "_experiences_v_parent_idx" ON "_experiences_v" USING btree ("parent_id");
  CREATE INDEX "_experiences_v_version_version_hero_image_idx" ON "_experiences_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_experiences_v_version_version_universe_idx" ON "_experiences_v" USING btree ("version_universe_id");
  CREATE INDEX "_experiences_v_version_version_destination_idx" ON "_experiences_v" USING btree ("version_destination_id");
  CREATE INDEX "_experiences_v_version_seo_version_seo_share_image_idx" ON "_experiences_v" USING btree ("version_seo_share_image_id");
  CREATE INDEX "_experiences_v_version_version_replacement_target_idx" ON "_experiences_v" USING btree ("version_replacement_target_id");
  CREATE INDEX "_experiences_v_version_version_updated_at_idx" ON "_experiences_v" USING btree ("version_updated_at");
  CREATE INDEX "_experiences_v_version_version_created_at_idx" ON "_experiences_v" USING btree ("version_created_at");
  CREATE INDEX "_experiences_v_version_version__status_idx" ON "_experiences_v" USING btree ("version__status");
  CREATE INDEX "_experiences_v_created_at_idx" ON "_experiences_v" USING btree ("created_at");
  CREATE INDEX "_experiences_v_updated_at_idx" ON "_experiences_v" USING btree ("updated_at");
  CREATE INDEX "_experiences_v_snapshot_idx" ON "_experiences_v" USING btree ("snapshot");
  CREATE INDEX "_experiences_v_published_locale_idx" ON "_experiences_v" USING btree ("published_locale");
  CREATE INDEX "_experiences_v_latest_idx" ON "_experiences_v" USING btree ("latest");
  CREATE INDEX "_experiences_v_version_seo_version_seo_slug_idx" ON "_experiences_v_locales" USING btree ("version_seo_slug","_locale");
  CREATE UNIQUE INDEX "_experiences_v_locales_locale_parent_id_unique" ON "_experiences_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_experiences_v_locales_parent_id_idx" ON "_experiences_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_experiences_v_rels_order_idx" ON "_experiences_v_rels" USING btree ("order");
  CREATE INDEX "_experiences_v_rels_parent_idx" ON "_experiences_v_rels" USING btree ("parent_id");
  CREATE INDEX "_experiences_v_rels_path_idx" ON "_experiences_v_rels" USING btree ("path");
  CREATE INDEX "_experiences_v_rels_media_id_idx" ON "_experiences_v_rels" USING btree ("media_id");
  CREATE INDEX "_experiences_v_rels_faq_items_id_idx" ON "_experiences_v_rels" USING btree ("faq_items_id");
  CREATE INDEX "accommodations_amenities_order_idx" ON "accommodations_amenities" USING btree ("order");
  CREATE INDEX "accommodations_amenities_parent_idx" ON "accommodations_amenities" USING btree ("parent_id");
  CREATE INDEX "accommodations_hero_image_idx" ON "accommodations" USING btree ("hero_image_id");
  CREATE INDEX "accommodations_destination_idx" ON "accommodations" USING btree ("destination_id");
  CREATE INDEX "accommodations_seo_seo_share_image_idx" ON "accommodations" USING btree ("seo_share_image_id");
  CREATE INDEX "accommodations_replacement_target_idx" ON "accommodations" USING btree ("replacement_target_id");
  CREATE INDEX "accommodations_updated_at_idx" ON "accommodations" USING btree ("updated_at");
  CREATE INDEX "accommodations_created_at_idx" ON "accommodations" USING btree ("created_at");
  CREATE INDEX "accommodations__status_idx" ON "accommodations" USING btree ("_status");
  CREATE INDEX "accommodations_seo_seo_slug_idx" ON "accommodations_locales" USING btree ("seo_slug","_locale");
  CREATE UNIQUE INDEX "accommodations_locales_locale_parent_id_unique" ON "accommodations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "accommodations_locales_parent_id_idx" ON "accommodations_locales" USING btree ("_parent_id");
  CREATE INDEX "accommodations_rels_order_idx" ON "accommodations_rels" USING btree ("order");
  CREATE INDEX "accommodations_rels_parent_idx" ON "accommodations_rels" USING btree ("parent_id");
  CREATE INDEX "accommodations_rels_path_idx" ON "accommodations_rels" USING btree ("path");
  CREATE INDEX "accommodations_rels_media_id_idx" ON "accommodations_rels" USING btree ("media_id");
  CREATE INDEX "_accommodations_v_version_amenities_order_idx" ON "_accommodations_v_version_amenities" USING btree ("order");
  CREATE INDEX "_accommodations_v_version_amenities_parent_idx" ON "_accommodations_v_version_amenities" USING btree ("parent_id");
  CREATE INDEX "_accommodations_v_parent_idx" ON "_accommodations_v" USING btree ("parent_id");
  CREATE INDEX "_accommodations_v_version_version_hero_image_idx" ON "_accommodations_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_accommodations_v_version_version_destination_idx" ON "_accommodations_v" USING btree ("version_destination_id");
  CREATE INDEX "_accommodations_v_version_seo_version_seo_share_image_idx" ON "_accommodations_v" USING btree ("version_seo_share_image_id");
  CREATE INDEX "_accommodations_v_version_version_replacement_target_idx" ON "_accommodations_v" USING btree ("version_replacement_target_id");
  CREATE INDEX "_accommodations_v_version_version_updated_at_idx" ON "_accommodations_v" USING btree ("version_updated_at");
  CREATE INDEX "_accommodations_v_version_version_created_at_idx" ON "_accommodations_v" USING btree ("version_created_at");
  CREATE INDEX "_accommodations_v_version_version__status_idx" ON "_accommodations_v" USING btree ("version__status");
  CREATE INDEX "_accommodations_v_created_at_idx" ON "_accommodations_v" USING btree ("created_at");
  CREATE INDEX "_accommodations_v_updated_at_idx" ON "_accommodations_v" USING btree ("updated_at");
  CREATE INDEX "_accommodations_v_snapshot_idx" ON "_accommodations_v" USING btree ("snapshot");
  CREATE INDEX "_accommodations_v_published_locale_idx" ON "_accommodations_v" USING btree ("published_locale");
  CREATE INDEX "_accommodations_v_latest_idx" ON "_accommodations_v" USING btree ("latest");
  CREATE INDEX "_accommodations_v_version_seo_version_seo_slug_idx" ON "_accommodations_v_locales" USING btree ("version_seo_slug","_locale");
  CREATE UNIQUE INDEX "_accommodations_v_locales_locale_parent_id_unique" ON "_accommodations_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_accommodations_v_locales_parent_id_idx" ON "_accommodations_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_accommodations_v_rels_order_idx" ON "_accommodations_v_rels" USING btree ("order");
  CREATE INDEX "_accommodations_v_rels_parent_idx" ON "_accommodations_v_rels" USING btree ("parent_id");
  CREATE INDEX "_accommodations_v_rels_path_idx" ON "_accommodations_v_rels" USING btree ("path");
  CREATE INDEX "_accommodations_v_rels_media_id_idx" ON "_accommodations_v_rels" USING btree ("media_id");
  CREATE INDEX "destinations_hero_image_idx" ON "destinations" USING btree ("hero_image_id");
  CREATE INDEX "destinations_seo_seo_share_image_idx" ON "destinations" USING btree ("seo_share_image_id");
  CREATE INDEX "destinations_replacement_target_idx" ON "destinations" USING btree ("replacement_target_id");
  CREATE INDEX "destinations_updated_at_idx" ON "destinations" USING btree ("updated_at");
  CREATE INDEX "destinations_created_at_idx" ON "destinations" USING btree ("created_at");
  CREATE INDEX "destinations__status_idx" ON "destinations" USING btree ("_status");
  CREATE INDEX "destinations_seo_seo_slug_idx" ON "destinations_locales" USING btree ("seo_slug","_locale");
  CREATE UNIQUE INDEX "destinations_locales_locale_parent_id_unique" ON "destinations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "destinations_locales_parent_id_idx" ON "destinations_locales" USING btree ("_parent_id");
  CREATE INDEX "destinations_rels_order_idx" ON "destinations_rels" USING btree ("order");
  CREATE INDEX "destinations_rels_parent_idx" ON "destinations_rels" USING btree ("parent_id");
  CREATE INDEX "destinations_rels_path_idx" ON "destinations_rels" USING btree ("path");
  CREATE INDEX "destinations_rels_media_id_idx" ON "destinations_rels" USING btree ("media_id");
  CREATE INDEX "_destinations_v_parent_idx" ON "_destinations_v" USING btree ("parent_id");
  CREATE INDEX "_destinations_v_version_version_hero_image_idx" ON "_destinations_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_destinations_v_version_seo_version_seo_share_image_idx" ON "_destinations_v" USING btree ("version_seo_share_image_id");
  CREATE INDEX "_destinations_v_version_version_replacement_target_idx" ON "_destinations_v" USING btree ("version_replacement_target_id");
  CREATE INDEX "_destinations_v_version_version_updated_at_idx" ON "_destinations_v" USING btree ("version_updated_at");
  CREATE INDEX "_destinations_v_version_version_created_at_idx" ON "_destinations_v" USING btree ("version_created_at");
  CREATE INDEX "_destinations_v_version_version__status_idx" ON "_destinations_v" USING btree ("version__status");
  CREATE INDEX "_destinations_v_created_at_idx" ON "_destinations_v" USING btree ("created_at");
  CREATE INDEX "_destinations_v_updated_at_idx" ON "_destinations_v" USING btree ("updated_at");
  CREATE INDEX "_destinations_v_snapshot_idx" ON "_destinations_v" USING btree ("snapshot");
  CREATE INDEX "_destinations_v_published_locale_idx" ON "_destinations_v" USING btree ("published_locale");
  CREATE INDEX "_destinations_v_latest_idx" ON "_destinations_v" USING btree ("latest");
  CREATE INDEX "_destinations_v_version_seo_version_seo_slug_idx" ON "_destinations_v_locales" USING btree ("version_seo_slug","_locale");
  CREATE UNIQUE INDEX "_destinations_v_locales_locale_parent_id_unique" ON "_destinations_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_destinations_v_locales_parent_id_idx" ON "_destinations_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_destinations_v_rels_order_idx" ON "_destinations_v_rels" USING btree ("order");
  CREATE INDEX "_destinations_v_rels_parent_idx" ON "_destinations_v_rels" USING btree ("parent_id");
  CREATE INDEX "_destinations_v_rels_path_idx" ON "_destinations_v_rels" USING btree ("path");
  CREATE INDEX "_destinations_v_rels_media_id_idx" ON "_destinations_v_rels" USING btree ("media_id");
  CREATE INDEX "universes_image_idx" ON "universes" USING btree ("image_id");
  CREATE INDEX "universes_seo_seo_share_image_idx" ON "universes" USING btree ("seo_share_image_id");
  CREATE INDEX "universes_updated_at_idx" ON "universes" USING btree ("updated_at");
  CREATE INDEX "universes_created_at_idx" ON "universes" USING btree ("created_at");
  CREATE INDEX "universes__status_idx" ON "universes" USING btree ("_status");
  CREATE INDEX "universes_seo_seo_slug_idx" ON "universes_locales" USING btree ("seo_slug","_locale");
  CREATE UNIQUE INDEX "universes_locales_locale_parent_id_unique" ON "universes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "universes_locales_parent_id_idx" ON "universes_locales" USING btree ("_parent_id");
  CREATE INDEX "_universes_v_parent_idx" ON "_universes_v" USING btree ("parent_id");
  CREATE INDEX "_universes_v_version_version_image_idx" ON "_universes_v" USING btree ("version_image_id");
  CREATE INDEX "_universes_v_version_seo_version_seo_share_image_idx" ON "_universes_v" USING btree ("version_seo_share_image_id");
  CREATE INDEX "_universes_v_version_version_updated_at_idx" ON "_universes_v" USING btree ("version_updated_at");
  CREATE INDEX "_universes_v_version_version_created_at_idx" ON "_universes_v" USING btree ("version_created_at");
  CREATE INDEX "_universes_v_version_version__status_idx" ON "_universes_v" USING btree ("version__status");
  CREATE INDEX "_universes_v_created_at_idx" ON "_universes_v" USING btree ("created_at");
  CREATE INDEX "_universes_v_updated_at_idx" ON "_universes_v" USING btree ("updated_at");
  CREATE INDEX "_universes_v_snapshot_idx" ON "_universes_v" USING btree ("snapshot");
  CREATE INDEX "_universes_v_published_locale_idx" ON "_universes_v" USING btree ("published_locale");
  CREATE INDEX "_universes_v_latest_idx" ON "_universes_v" USING btree ("latest");
  CREATE INDEX "_universes_v_version_seo_version_seo_slug_idx" ON "_universes_v_locales" USING btree ("version_seo_slug","_locale");
  CREATE UNIQUE INDEX "_universes_v_locales_locale_parent_id_unique" ON "_universes_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_universes_v_locales_parent_id_idx" ON "_universes_v_locales" USING btree ("_parent_id");
  CREATE INDEX "videos_captions_order_idx" ON "videos_captions" USING btree ("_order");
  CREATE INDEX "videos_captions_parent_id_idx" ON "videos_captions" USING btree ("_parent_id");
  CREATE INDEX "videos_chapters_order_idx" ON "videos_chapters" USING btree ("_order");
  CREATE INDEX "videos_chapters_parent_id_idx" ON "videos_chapters" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "videos_chapters_locales_locale_parent_id_unique" ON "videos_chapters_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "videos_chapters_locales_parent_id_idx" ON "videos_chapters_locales" USING btree ("_parent_id");
  CREATE INDEX "videos_poster_idx" ON "videos" USING btree ("poster_id");
  CREATE INDEX "videos_updated_at_idx" ON "videos" USING btree ("updated_at");
  CREATE INDEX "videos_created_at_idx" ON "videos" USING btree ("created_at");
  CREATE INDEX "videos__status_idx" ON "videos" USING btree ("_status");
  CREATE UNIQUE INDEX "videos_locales_locale_parent_id_unique" ON "videos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "videos_locales_parent_id_idx" ON "videos_locales" USING btree ("_parent_id");
  CREATE INDEX "_videos_v_version_captions_order_idx" ON "_videos_v_version_captions" USING btree ("_order");
  CREATE INDEX "_videos_v_version_captions_parent_id_idx" ON "_videos_v_version_captions" USING btree ("_parent_id");
  CREATE INDEX "_videos_v_version_chapters_order_idx" ON "_videos_v_version_chapters" USING btree ("_order");
  CREATE INDEX "_videos_v_version_chapters_parent_id_idx" ON "_videos_v_version_chapters" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_videos_v_version_chapters_locales_locale_parent_id_unique" ON "_videos_v_version_chapters_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_videos_v_version_chapters_locales_parent_id_idx" ON "_videos_v_version_chapters_locales" USING btree ("_parent_id");
  CREATE INDEX "_videos_v_parent_idx" ON "_videos_v" USING btree ("parent_id");
  CREATE INDEX "_videos_v_version_version_poster_idx" ON "_videos_v" USING btree ("version_poster_id");
  CREATE INDEX "_videos_v_version_version_updated_at_idx" ON "_videos_v" USING btree ("version_updated_at");
  CREATE INDEX "_videos_v_version_version_created_at_idx" ON "_videos_v" USING btree ("version_created_at");
  CREATE INDEX "_videos_v_version_version__status_idx" ON "_videos_v" USING btree ("version__status");
  CREATE INDEX "_videos_v_created_at_idx" ON "_videos_v" USING btree ("created_at");
  CREATE INDEX "_videos_v_updated_at_idx" ON "_videos_v" USING btree ("updated_at");
  CREATE INDEX "_videos_v_snapshot_idx" ON "_videos_v" USING btree ("snapshot");
  CREATE INDEX "_videos_v_published_locale_idx" ON "_videos_v" USING btree ("published_locale");
  CREATE INDEX "_videos_v_latest_idx" ON "_videos_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_videos_v_locales_locale_parent_id_unique" ON "_videos_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_videos_v_locales_parent_id_idx" ON "_videos_v_locales" USING btree ("_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_image_idx" ON "pages_blocks_hero" USING btree ("image_id");
  CREATE UNIQUE INDEX "pages_blocks_hero_locales_locale_parent_id_unique" ON "pages_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_hero_locales_parent_id_idx" ON "pages_blocks_hero_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_rich_text_locales_locale_parent_id_unique" ON "pages_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_rich_text_locales_parent_id_idx" ON "pages_blocks_rich_text_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_order_idx" ON "pages_blocks_team" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_parent_id_idx" ON "pages_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_path_idx" ON "pages_blocks_team" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_team_locales_locale_parent_id_unique" ON "pages_blocks_team_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_team_locales_parent_id_idx" ON "pages_blocks_team_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_figures_items_order_idx" ON "pages_blocks_figures_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_figures_items_parent_id_idx" ON "pages_blocks_figures_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_figures_items_locales_locale_parent_id_unique" ON "pages_blocks_figures_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_figures_items_locales_parent_id_idx" ON "pages_blocks_figures_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_figures_order_idx" ON "pages_blocks_figures" USING btree ("_order");
  CREATE INDEX "pages_blocks_figures_parent_id_idx" ON "pages_blocks_figures" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_figures_path_idx" ON "pages_blocks_figures" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_figures_locales_locale_parent_id_unique" ON "pages_blocks_figures_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_figures_locales_parent_id_idx" ON "pages_blocks_figures_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_order_idx" ON "pages_blocks_gallery" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_parent_id_idx" ON "pages_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_path_idx" ON "pages_blocks_gallery" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_gallery_locales_locale_parent_id_unique" ON "pages_blocks_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_gallery_locales_parent_id_idx" ON "pages_blocks_gallery_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_steps_items_order_idx" ON "pages_blocks_steps_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_steps_items_parent_id_idx" ON "pages_blocks_steps_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_steps_items_locales_locale_parent_id_unique" ON "pages_blocks_steps_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_steps_items_locales_parent_id_idx" ON "pages_blocks_steps_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_steps_order_idx" ON "pages_blocks_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_steps_parent_id_idx" ON "pages_blocks_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_steps_path_idx" ON "pages_blocks_steps" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_steps_locales_locale_parent_id_unique" ON "pages_blocks_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_steps_locales_parent_id_idx" ON "pages_blocks_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_guarantees_order_idx" ON "pages_blocks_guarantees" USING btree ("_order");
  CREATE INDEX "pages_blocks_guarantees_parent_id_idx" ON "pages_blocks_guarantees" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_guarantees_path_idx" ON "pages_blocks_guarantees" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_guarantees_locales_locale_parent_id_unique" ON "pages_blocks_guarantees_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_guarantees_locales_parent_id_idx" ON "pages_blocks_guarantees_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "pages_blocks_cta" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_cta_locales_locale_parent_id_unique" ON "pages_blocks_cta_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_cta_locales_parent_id_idx" ON "pages_blocks_cta_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_processing_register_entries_order_idx" ON "pages_blocks_processing_register_entries" USING btree ("_order");
  CREATE INDEX "pages_blocks_processing_register_entries_parent_id_idx" ON "pages_blocks_processing_register_entries" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_processing_register_entries_locales_locale_pare" ON "pages_blocks_processing_register_entries_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_processing_register_entries_locales_parent__idx" ON "pages_blocks_processing_register_entries_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_processing_register_order_idx" ON "pages_blocks_processing_register" USING btree ("_order");
  CREATE INDEX "pages_blocks_processing_register_parent_id_idx" ON "pages_blocks_processing_register" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_processing_register_path_idx" ON "pages_blocks_processing_register" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_key_idx" ON "pages" USING btree ("key");
  CREATE INDEX "pages_seo_seo_share_image_idx" ON "pages" USING btree ("seo_share_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "pages_seo_seo_slug_idx" ON "pages_locales" USING btree ("seo_slug","_locale");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_locales_parent_id_idx" ON "pages_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_team_members_id_idx" ON "pages_rels" USING btree ("team_members_id");
  CREATE INDEX "pages_rels_media_id_idx" ON "pages_rels" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "_pages_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_image_idx" ON "_pages_v_blocks_hero" USING btree ("image_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_hero_locales_locale_parent_id_unique" ON "_pages_v_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_locales_parent_id_idx" ON "_pages_v_blocks_hero_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_order_idx" ON "_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_parent_id_idx" ON "_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_path_idx" ON "_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_rich_text_locales_locale_parent_id_unique" ON "_pages_v_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_locales_parent_id_idx" ON "_pages_v_blocks_rich_text_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_order_idx" ON "_pages_v_blocks_team" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_parent_id_idx" ON "_pages_v_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_path_idx" ON "_pages_v_blocks_team" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_team_locales_locale_parent_id_unique" ON "_pages_v_blocks_team_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_team_locales_parent_id_idx" ON "_pages_v_blocks_team_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_figures_items_order_idx" ON "_pages_v_blocks_figures_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_figures_items_parent_id_idx" ON "_pages_v_blocks_figures_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_figures_items_locales_locale_parent_id_uniqu" ON "_pages_v_blocks_figures_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_figures_items_locales_parent_id_idx" ON "_pages_v_blocks_figures_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_figures_order_idx" ON "_pages_v_blocks_figures" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_figures_parent_id_idx" ON "_pages_v_blocks_figures" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_figures_path_idx" ON "_pages_v_blocks_figures" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_figures_locales_locale_parent_id_unique" ON "_pages_v_blocks_figures_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_figures_locales_parent_id_idx" ON "_pages_v_blocks_figures_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_order_idx" ON "_pages_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_parent_id_idx" ON "_pages_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_path_idx" ON "_pages_v_blocks_gallery" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_gallery_locales_locale_parent_id_unique" ON "_pages_v_blocks_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_locales_parent_id_idx" ON "_pages_v_blocks_gallery_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_items_order_idx" ON "_pages_v_blocks_steps_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_steps_items_parent_id_idx" ON "_pages_v_blocks_steps_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_steps_items_locales_locale_parent_id_unique" ON "_pages_v_blocks_steps_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_items_locales_parent_id_idx" ON "_pages_v_blocks_steps_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_order_idx" ON "_pages_v_blocks_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_steps_parent_id_idx" ON "_pages_v_blocks_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_path_idx" ON "_pages_v_blocks_steps" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_steps_locales_locale_parent_id_unique" ON "_pages_v_blocks_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_locales_parent_id_idx" ON "_pages_v_blocks_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_guarantees_order_idx" ON "_pages_v_blocks_guarantees" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_guarantees_parent_id_idx" ON "_pages_v_blocks_guarantees" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_guarantees_path_idx" ON "_pages_v_blocks_guarantees" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_guarantees_locales_locale_parent_id_unique" ON "_pages_v_blocks_guarantees_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_guarantees_locales_parent_id_idx" ON "_pages_v_blocks_guarantees_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_order_idx" ON "_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_parent_id_idx" ON "_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_path_idx" ON "_pages_v_blocks_cta" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_cta_locales_locale_parent_id_unique" ON "_pages_v_blocks_cta_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_locales_parent_id_idx" ON "_pages_v_blocks_cta_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_processing_register_entries_order_idx" ON "_pages_v_blocks_processing_register_entries" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_processing_register_entries_parent_id_idx" ON "_pages_v_blocks_processing_register_entries" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_processing_register_entries_locales_locale_p" ON "_pages_v_blocks_processing_register_entries_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_processing_register_entries_locales_pare_idx" ON "_pages_v_blocks_processing_register_entries_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_processing_register_order_idx" ON "_pages_v_blocks_processing_register" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_processing_register_parent_id_idx" ON "_pages_v_blocks_processing_register" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_processing_register_path_idx" ON "_pages_v_blocks_processing_register" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_key_idx" ON "_pages_v" USING btree ("version_key");
  CREATE INDEX "_pages_v_version_seo_version_seo_share_image_idx" ON "_pages_v" USING btree ("version_seo_share_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_version_seo_version_seo_slug_idx" ON "_pages_v_locales" USING btree ("version_seo_slug","_locale");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_locales_parent_id_idx" ON "_pages_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_team_members_id_idx" ON "_pages_v_rels" USING btree ("team_members_id");
  CREATE INDEX "_pages_v_rels_media_id_idx" ON "_pages_v_rels" USING btree ("media_id");
  CREATE INDEX "faq_items_updated_at_idx" ON "faq_items" USING btree ("updated_at");
  CREATE INDEX "faq_items_created_at_idx" ON "faq_items" USING btree ("created_at");
  CREATE UNIQUE INDEX "faq_items_locales_locale_parent_id_unique" ON "faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "faq_items_locales_parent_id_idx" ON "faq_items_locales" USING btree ("_parent_id");
  CREATE INDEX "cancellation_policies_updated_at_idx" ON "cancellation_policies" USING btree ("updated_at");
  CREATE INDEX "cancellation_policies_created_at_idx" ON "cancellation_policies" USING btree ("created_at");
  CREATE UNIQUE INDEX "cancellation_policies_locales_locale_parent_id_unique" ON "cancellation_policies_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "cancellation_policies_locales_parent_id_idx" ON "cancellation_policies_locales" USING btree ("_parent_id");
  CREATE INDEX "team_members_photo_idx" ON "team_members" USING btree ("photo_id");
  CREATE INDEX "team_members_updated_at_idx" ON "team_members" USING btree ("updated_at");
  CREATE INDEX "team_members_created_at_idx" ON "team_members" USING btree ("created_at");
  CREATE UNIQUE INDEX "team_members_locales_locale_parent_id_unique" ON "team_members_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "team_members_locales_parent_id_idx" ON "team_members_locales" USING btree ("_parent_id");
  CREATE INDEX "requests_items_order_idx" ON "requests_items" USING btree ("_order");
  CREATE INDEX "requests_items_parent_id_idx" ON "requests_items" USING btree ("_parent_id");
  CREATE INDEX "requests_moods_order_idx" ON "requests_moods" USING btree ("order");
  CREATE INDEX "requests_moods_parent_idx" ON "requests_moods" USING btree ("parent_id");
  CREATE UNIQUE INDEX "requests_reference_idx" ON "requests" USING btree ("reference");
  CREATE UNIQUE INDEX "requests_submission_id_idx" ON "requests" USING btree ("submission_id");
  CREATE INDEX "requests_updated_at_idx" ON "requests" USING btree ("updated_at");
  CREATE INDEX "requests_created_at_idx" ON "requests" USING btree ("created_at");
  CREATE INDEX "requests_rels_order_idx" ON "requests_rels" USING btree ("order");
  CREATE INDEX "requests_rels_parent_idx" ON "requests_rels" USING btree ("parent_id");
  CREATE INDEX "requests_rels_path_idx" ON "requests_rels" USING btree ("path");
  CREATE INDEX "requests_rels_stays_id_idx" ON "requests_rels" USING btree ("stays_id");
  CREATE INDEX "requests_rels_experiences_id_idx" ON "requests_rels" USING btree ("experiences_id");
  CREATE INDEX "requests_rels_accommodations_id_idx" ON "requests_rels" USING btree ("accommodations_id");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE INDEX "rate_limits_ip_hash_idx" ON "rate_limits" USING btree ("ip_hash");
  CREATE INDEX "rate_limits_window_start_idx" ON "rate_limits" USING btree ("window_start");
  CREATE INDEX "rate_limits_updated_at_idx" ON "rate_limits" USING btree ("updated_at");
  CREATE INDEX "rate_limits_created_at_idx" ON "rate_limits" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_stays_id_idx" ON "payload_locked_documents_rels" USING btree ("stays_id");
  CREATE INDEX "payload_locked_documents_rels_experiences_id_idx" ON "payload_locked_documents_rels" USING btree ("experiences_id");
  CREATE INDEX "payload_locked_documents_rels_accommodations_id_idx" ON "payload_locked_documents_rels" USING btree ("accommodations_id");
  CREATE INDEX "payload_locked_documents_rels_destinations_id_idx" ON "payload_locked_documents_rels" USING btree ("destinations_id");
  CREATE INDEX "payload_locked_documents_rels_universes_id_idx" ON "payload_locked_documents_rels" USING btree ("universes_id");
  CREATE INDEX "payload_locked_documents_rels_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("videos_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_faq_items_id_idx" ON "payload_locked_documents_rels" USING btree ("faq_items_id");
  CREATE INDEX "payload_locked_documents_rels_cancellation_policies_id_idx" ON "payload_locked_documents_rels" USING btree ("cancellation_policies_id");
  CREATE INDEX "payload_locked_documents_rels_team_members_id_idx" ON "payload_locked_documents_rels" USING btree ("team_members_id");
  CREATE INDEX "payload_locked_documents_rels_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("requests_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_locked_documents_rels_rate_limits_id_idx" ON "payload_locked_documents_rels" USING btree ("rate_limits_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_same_as_order_idx" ON "site_settings_same_as" USING btree ("_order");
  CREATE INDEX "site_settings_same_as_parent_id_idx" ON "site_settings_same_as" USING btree ("_parent_id");
  CREATE INDEX "site_settings_high_seasons_order_idx" ON "site_settings_high_seasons" USING btree ("_order");
  CREATE INDEX "site_settings_high_seasons_parent_id_idx" ON "site_settings_high_seasons" USING btree ("_parent_id");
  CREATE INDEX "site_settings_guarantees_order_idx" ON "site_settings_guarantees" USING btree ("_order");
  CREATE INDEX "site_settings_guarantees_parent_id_idx" ON "site_settings_guarantees" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_guarantees_locales_locale_parent_id_unique" ON "site_settings_guarantees_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_guarantees_locales_parent_id_idx" ON "site_settings_guarantees_locales" USING btree ("_parent_id");
  CREATE INDEX "site_settings_payment_methods_order_idx" ON "site_settings_payment_methods" USING btree ("order");
  CREATE INDEX "site_settings_payment_methods_parent_idx" ON "site_settings_payment_methods" USING btree ("parent_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_locales_parent_id_idx" ON "site_settings_locales" USING btree ("_parent_id");
  CREATE INDEX "navigation_main_order_idx" ON "navigation_main" USING btree ("_order");
  CREATE INDEX "navigation_main_parent_id_idx" ON "navigation_main" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_main_locales_locale_parent_id_unique" ON "navigation_main_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_main_locales_parent_id_idx" ON "navigation_main_locales" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_order_idx" ON "navigation_footer" USING btree ("_order");
  CREATE INDEX "navigation_footer_parent_id_idx" ON "navigation_footer" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_footer_locales_locale_parent_id_unique" ON "navigation_footer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_footer_locales_parent_id_idx" ON "navigation_footer_locales" USING btree ("_parent_id");`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "stays_moods" CASCADE;
  DROP TABLE "stays_itinerary" CASCADE;
  DROP TABLE "stays_itinerary_locales" CASCADE;
  DROP TABLE "stays_included" CASCADE;
  DROP TABLE "stays_included_locales" CASCADE;
  DROP TABLE "stays_not_included" CASCADE;
  DROP TABLE "stays_not_included_locales" CASCADE;
  DROP TABLE "stays" CASCADE;
  DROP TABLE "stays_locales" CASCADE;
  DROP TABLE "stays_rels" CASCADE;
  DROP TABLE "_stays_v_version_moods" CASCADE;
  DROP TABLE "_stays_v_version_itinerary" CASCADE;
  DROP TABLE "_stays_v_version_itinerary_locales" CASCADE;
  DROP TABLE "_stays_v_version_included" CASCADE;
  DROP TABLE "_stays_v_version_included_locales" CASCADE;
  DROP TABLE "_stays_v_version_not_included" CASCADE;
  DROP TABLE "_stays_v_version_not_included_locales" CASCADE;
  DROP TABLE "_stays_v" CASCADE;
  DROP TABLE "_stays_v_locales" CASCADE;
  DROP TABLE "_stays_v_rels" CASCADE;
  DROP TABLE "experiences_season_months" CASCADE;
  DROP TABLE "experiences" CASCADE;
  DROP TABLE "experiences_locales" CASCADE;
  DROP TABLE "experiences_rels" CASCADE;
  DROP TABLE "_experiences_v_version_season_months" CASCADE;
  DROP TABLE "_experiences_v" CASCADE;
  DROP TABLE "_experiences_v_locales" CASCADE;
  DROP TABLE "_experiences_v_rels" CASCADE;
  DROP TABLE "accommodations_amenities" CASCADE;
  DROP TABLE "accommodations" CASCADE;
  DROP TABLE "accommodations_locales" CASCADE;
  DROP TABLE "accommodations_rels" CASCADE;
  DROP TABLE "_accommodations_v_version_amenities" CASCADE;
  DROP TABLE "_accommodations_v" CASCADE;
  DROP TABLE "_accommodations_v_locales" CASCADE;
  DROP TABLE "_accommodations_v_rels" CASCADE;
  DROP TABLE "destinations" CASCADE;
  DROP TABLE "destinations_locales" CASCADE;
  DROP TABLE "destinations_rels" CASCADE;
  DROP TABLE "_destinations_v" CASCADE;
  DROP TABLE "_destinations_v_locales" CASCADE;
  DROP TABLE "_destinations_v_rels" CASCADE;
  DROP TABLE "universes" CASCADE;
  DROP TABLE "universes_locales" CASCADE;
  DROP TABLE "_universes_v" CASCADE;
  DROP TABLE "_universes_v_locales" CASCADE;
  DROP TABLE "videos_captions" CASCADE;
  DROP TABLE "videos_chapters" CASCADE;
  DROP TABLE "videos_chapters_locales" CASCADE;
  DROP TABLE "videos" CASCADE;
  DROP TABLE "videos_locales" CASCADE;
  DROP TABLE "_videos_v_version_captions" CASCADE;
  DROP TABLE "_videos_v_version_chapters" CASCADE;
  DROP TABLE "_videos_v_version_chapters_locales" CASCADE;
  DROP TABLE "_videos_v" CASCADE;
  DROP TABLE "_videos_v_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_hero_locales" CASCADE;
  DROP TABLE "pages_blocks_rich_text" CASCADE;
  DROP TABLE "pages_blocks_rich_text_locales" CASCADE;
  DROP TABLE "pages_blocks_team" CASCADE;
  DROP TABLE "pages_blocks_team_locales" CASCADE;
  DROP TABLE "pages_blocks_figures_items" CASCADE;
  DROP TABLE "pages_blocks_figures_items_locales" CASCADE;
  DROP TABLE "pages_blocks_figures" CASCADE;
  DROP TABLE "pages_blocks_figures_locales" CASCADE;
  DROP TABLE "pages_blocks_gallery" CASCADE;
  DROP TABLE "pages_blocks_gallery_locales" CASCADE;
  DROP TABLE "pages_blocks_steps_items" CASCADE;
  DROP TABLE "pages_blocks_steps_items_locales" CASCADE;
  DROP TABLE "pages_blocks_steps" CASCADE;
  DROP TABLE "pages_blocks_steps_locales" CASCADE;
  DROP TABLE "pages_blocks_guarantees" CASCADE;
  DROP TABLE "pages_blocks_guarantees_locales" CASCADE;
  DROP TABLE "pages_blocks_cta" CASCADE;
  DROP TABLE "pages_blocks_cta_locales" CASCADE;
  DROP TABLE "pages_blocks_processing_register_entries" CASCADE;
  DROP TABLE "pages_blocks_processing_register_entries_locales" CASCADE;
  DROP TABLE "pages_blocks_processing_register" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_team" CASCADE;
  DROP TABLE "_pages_v_blocks_team_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_figures_items" CASCADE;
  DROP TABLE "_pages_v_blocks_figures_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_figures" CASCADE;
  DROP TABLE "_pages_v_blocks_figures_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_steps_items" CASCADE;
  DROP TABLE "_pages_v_blocks_steps_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_steps_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_guarantees" CASCADE;
  DROP TABLE "_pages_v_blocks_guarantees_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_cta" CASCADE;
  DROP TABLE "_pages_v_blocks_cta_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_processing_register_entries" CASCADE;
  DROP TABLE "_pages_v_blocks_processing_register_entries_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_processing_register" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP TABLE "faq_items" CASCADE;
  DROP TABLE "faq_items_locales" CASCADE;
  DROP TABLE "cancellation_policies" CASCADE;
  DROP TABLE "cancellation_policies_locales" CASCADE;
  DROP TABLE "team_members" CASCADE;
  DROP TABLE "team_members_locales" CASCADE;
  DROP TABLE "requests_items" CASCADE;
  DROP TABLE "requests_moods" CASCADE;
  DROP TABLE "requests" CASCADE;
  DROP TABLE "requests_rels" CASCADE;
  DROP TABLE "redirects" CASCADE;
  DROP TABLE "rate_limits" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_same_as" CASCADE;
  DROP TABLE "site_settings_high_seasons" CASCADE;
  DROP TABLE "site_settings_guarantees" CASCADE;
  DROP TABLE "site_settings_guarantees_locales" CASCADE;
  DROP TABLE "site_settings_payment_methods" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TABLE "navigation_main" CASCADE;
  DROP TABLE "navigation_main_locales" CASCADE;
  DROP TABLE "navigation_footer" CASCADE;
  DROP TABLE "navigation_footer_locales" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_stays_moods";
  DROP TYPE "public"."enum_stays_duration_category";
  DROP TYPE "public"."enum_stays_budget_band";
  DROP TYPE "public"."enum_stays_status";
  DROP TYPE "public"."enum__stays_v_version_moods";
  DROP TYPE "public"."enum__stays_v_version_duration_category";
  DROP TYPE "public"."enum__stays_v_version_budget_band";
  DROP TYPE "public"."enum__stays_v_version_status";
  DROP TYPE "public"."enum__stays_v_published_locale";
  DROP TYPE "public"."enum_experiences_season_months";
  DROP TYPE "public"."enum_experiences_level";
  DROP TYPE "public"."enum_experiences_status";
  DROP TYPE "public"."enum__experiences_v_version_season_months";
  DROP TYPE "public"."enum__experiences_v_version_level";
  DROP TYPE "public"."enum__experiences_v_version_status";
  DROP TYPE "public"."enum__experiences_v_published_locale";
  DROP TYPE "public"."enum_accommodations_amenities";
  DROP TYPE "public"."enum_accommodations_type";
  DROP TYPE "public"."enum_accommodations_status";
  DROP TYPE "public"."enum__accommodations_v_version_amenities";
  DROP TYPE "public"."enum__accommodations_v_version_type";
  DROP TYPE "public"."enum__accommodations_v_version_status";
  DROP TYPE "public"."enum__accommodations_v_published_locale";
  DROP TYPE "public"."enum_destinations_kind";
  DROP TYPE "public"."enum_destinations_status";
  DROP TYPE "public"."enum__destinations_v_version_kind";
  DROP TYPE "public"."enum__destinations_v_version_status";
  DROP TYPE "public"."enum__destinations_v_published_locale";
  DROP TYPE "public"."enum_universes_kind";
  DROP TYPE "public"."enum_universes_status";
  DROP TYPE "public"."enum__universes_v_version_kind";
  DROP TYPE "public"."enum__universes_v_version_status";
  DROP TYPE "public"."enum__universes_v_published_locale";
  DROP TYPE "public"."enum_videos_captions_locale";
  DROP TYPE "public"."enum_videos_format";
  DROP TYPE "public"."enum_videos_status";
  DROP TYPE "public"."enum__videos_v_version_captions_locale";
  DROP TYPE "public"."enum__videos_v_version_format";
  DROP TYPE "public"."enum__videos_v_version_status";
  DROP TYPE "public"."enum__videos_v_published_locale";
  DROP TYPE "public"."enum_pages_blocks_cta_action";
  DROP TYPE "public"."enum_pages_key";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_cta_action";
  DROP TYPE "public"."enum__pages_v_version_key";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum__pages_v_published_locale";
  DROP TYPE "public"."enum_faq_items_category";
  DROP TYPE "public"."enum_requests_items_kind";
  DROP TYPE "public"."enum_requests_moods";
  DROP TYPE "public"."enum_requests_status";
  DROP TYPE "public"."enum_requests_budget_band";
  DROP TYPE "public"."enum_requests_locale";
  DROP TYPE "public"."enum_redirects_type";
  DROP TYPE "public"."enum_redirects_reason";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_site_settings_payment_methods";
  DROP TYPE "public"."enum_navigation_main_route";
  DROP TYPE "public"."enum_navigation_footer_route";`);
}
