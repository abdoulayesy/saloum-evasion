import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_experiences_offer_kind" AS ENUM('activity', 'table');
  CREATE TYPE "public"."enum__experiences_v_version_offer_kind" AS ENUM('activity', 'table');
  CREATE TYPE "public"."enum_transfers_origin" AS ENUM('aibd', 'dakar');
  CREATE TYPE "public"."enum_partners_kind" AS ENUM('lodging', 'guide', 'restaurant', 'transport', 'other');
  CREATE TYPE "public"."enum_partners_payout_method" AS ENUM('bank_transfer', 'wave', 'orange_money', 'cash');
  CREATE TYPE "public"."enum_carts_items_offer_type" AS ENUM('stay', 'accommodation', 'experience', 'table', 'transfer');
  CREATE TYPE "public"."enum_carts_items_transfer_direction" AS ENUM('outbound', 'return');
  CREATE TYPE "public"."enum_carts_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_carts_status" AS ENUM('open', 'checked_out', 'abandoned', 'expired');
  CREATE TYPE "public"."enum_bookings_lines_offer_type" AS ENUM('stay', 'accommodation', 'experience', 'table', 'transfer');
  CREATE TYPE "public"."enum_bookings_lines_transfer_direction" AS ENUM('outbound', 'return');
  CREATE TYPE "public"."enum_bookings_lines_availability_status" AS ENUM('pending', 'confirmed', 'unavailable', 'replaced');
  CREATE TYPE "public"."enum_bookings_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_bookings_payment_plan" AS ENUM('full', 'deposit');
  CREATE TYPE "public"."enum_bookings_status" AS ENUM('awaiting_payment', 'deposit_paid', 'paid', 'expired', 'cancellation_requested', 'cancelled', 'partially_cancelled', 'completed');
  CREATE TYPE "public"."enum_payments_purpose" AS ENUM('full', 'deposit', 'balance');
  CREATE TYPE "public"."enum_payments_method" AS ENUM('wave', 'orange_money', 'card');
  CREATE TYPE "public"."enum_payments_status" AS ENUM('initiated', 'pending', 'succeeded', 'failed', 'abandoned', 'expired');
  CREATE TYPE "public"."enum_payments_failure_reason" AS ENUM('declined', 'insufficient_funds', 'timeout', 'cancelled_by_user', 'technical');
  CREATE TYPE "public"."enum_refunds_reason" AS ENUM('traveller', 'company', 'partner', 'unavailable');
  CREATE TYPE "public"."enum_refunds_method" AS ENUM('original', 'wave', 'orange_money', 'bank_transfer');
  CREATE TYPE "public"."enum_refunds_status" AS ENUM('requested', 'approved', 'paid', 'rejected');
  CREATE TYPE "public"."enum_commission_entries_kind" AS ENUM('collected', 'refund_adjustment');
  CREATE TYPE "public"."enum_payouts_method" AS ENUM('bank_transfer', 'wave', 'orange_money', 'cash');
  CREATE TYPE "public"."enum_reminders_target_type" AS ENUM('carts', 'bookings');
  CREATE TYPE "public"."enum_reminders_kind" AS ENUM('abandoned_cart', 'failed_payment', 'balance_due', 'balance_overdue');
  CREATE TYPE "public"."enum_reminders_channel" AS ENUM('email', 'whatsapp');
  CREATE TYPE "public"."enum_reminders_status" AS ENUM('scheduled', 'sent', 'failed', 'cancelled');
  CREATE TYPE "public"."enum_notifications_channel" AS ENUM('email', 'whatsapp');
  CREATE TYPE "public"."enum_notifications_locale" AS ENUM('fr', 'en');
  CREATE TYPE "public"."enum_notifications_status" AS ENUM('queued', 'sent', 'failed', 'escalated');
  CREATE TYPE "public"."enum_commission_rates_rates_offer_type" AS ENUM('stay', 'accommodation', 'experience', 'table', 'transfer');
  ALTER TYPE "public"."enum_users_role" ADD VALUE 'operations';
  ALTER TYPE "public"."enum_users_role" ADD VALUE 'finance';
  CREATE TABLE "experiences_slots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_time" varchar
  );
  
  CREATE TABLE "experiences_slots_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_experiences_v_version_slots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"start_time" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_experiences_v_version_slots_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "transfers_price_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"max_passengers" numeric NOT NULL,
  	"price_per_vehicle" numeric NOT NULL
  );
  
  CREATE TABLE "transfers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"origin" "enum_transfers_origin" NOT NULL,
  	"destination_id" integer NOT NULL,
  	"duration_minutes" numeric,
  	"bookable" boolean DEFAULT false,
  	"partner_id" integer,
  	"cancellation_policy_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "transfers_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "cancellation_policies_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"days_before_arrival_min" numeric NOT NULL,
  	"refund_percent" numeric NOT NULL
  );
  
  CREATE TABLE "partners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"kind" "enum_partners_kind" NOT NULL,
  	"contact_name" varchar,
  	"phone" varchar,
  	"whatsapp" varchar,
  	"email" varchar,
  	"payout_method" "enum_partners_payout_method" DEFAULT 'bank_transfer' NOT NULL,
  	"payout_details" varchar,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "carts_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"line_id" varchar NOT NULL,
  	"offer_type" "enum_carts_items_offer_type" NOT NULL,
  	"start_date" varchar NOT NULL,
  	"end_date" varchar,
  	"slot" varchar,
  	"transfer_direction" "enum_carts_items_transfer_direction",
  	"transfer_time" varchar,
  	"adults" numeric NOT NULL,
  	"children" numeric DEFAULT 0 NOT NULL,
  	"infants" numeric DEFAULT 0 NOT NULL,
  	"quoted_unit_price" numeric NOT NULL,
  	"quoted_total" numeric NOT NULL
  );
  
  CREATE TABLE "carts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"locale" "enum_carts_locale" DEFAULT 'fr' NOT NULL,
  	"version" numeric DEFAULT 0 NOT NULL,
  	"contact_first_name" varchar,
  	"contact_last_name" varchar,
  	"contact_whatsapp" varchar,
  	"contact_email" varchar,
  	"reminders_consent" boolean DEFAULT false,
  	"reminders_sent" numeric DEFAULT 0 NOT NULL,
  	"status" "enum_carts_status" DEFAULT 'open' NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"migrated_from_request" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "carts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stays_id" integer,
  	"accommodations_id" integer,
  	"experiences_id" integer,
  	"transfers_id" integer
  );
  
  CREATE TABLE "bookings_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"line_id" varchar NOT NULL,
  	"offer_type" "enum_bookings_lines_offer_type" NOT NULL,
  	"start_date" varchar NOT NULL,
  	"end_date" varchar,
  	"slot" varchar,
  	"transfer_direction" "enum_bookings_lines_transfer_direction",
  	"transfer_time" varchar,
  	"adults" numeric NOT NULL,
  	"children" numeric DEFAULT 0 NOT NULL,
  	"infants" numeric DEFAULT 0 NOT NULL,
  	"quoted_unit_price" numeric NOT NULL,
  	"quoted_total" numeric NOT NULL,
  	"title" varchar NOT NULL,
  	"partner_id" integer,
  	"unit_price" numeric NOT NULL,
  	"line_total" numeric NOT NULL,
  	"commission_rate_bp" numeric,
  	"commission_amount" numeric,
  	"partner_amount" numeric,
  	"policy_snapshot" jsonb,
  	"availability_status" "enum_bookings_lines_availability_status" DEFAULT 'pending' NOT NULL,
  	"availability_note" varchar,
  	"cancelled" boolean DEFAULT false,
  	"partner_notified_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "bookings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar NOT NULL,
  	"cart_id" integer NOT NULL,
  	"cart_version" numeric NOT NULL,
  	"locale" "enum_bookings_locale" NOT NULL,
  	"traveller_first_name" varchar NOT NULL,
  	"traveller_last_name" varchar NOT NULL,
  	"traveller_whatsapp" varchar NOT NULL,
  	"traveller_email" varchar NOT NULL,
  	"special_request" varchar,
  	"total" numeric NOT NULL,
  	"amount_paid" numeric NOT NULL,
  	"payment_plan" "enum_bookings_payment_plan" NOT NULL,
  	"deposit_amount" numeric NOT NULL,
  	"balance_amount" numeric NOT NULL,
  	"balance_due_date" varchar,
  	"status" "enum_bookings_status" DEFAULT 'awaiting_payment' NOT NULL,
  	"first_arrival_date" varchar NOT NULL,
  	"availability_deadline" timestamp(3) with time zone,
  	"manage_token_hash" varchar,
  	"voucher_version" numeric DEFAULT 0 NOT NULL,
  	"voucher_generated_at" timestamp(3) with time zone,
  	"consent_processing_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bookings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stays_id" integer,
  	"accommodations_id" integer,
  	"experiences_id" integer,
  	"transfers_id" integer
  );
  
  CREATE TABLE "payments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"booking_id" integer NOT NULL,
  	"purpose" "enum_payments_purpose" NOT NULL,
  	"method" "enum_payments_method" NOT NULL,
  	"amount" numeric NOT NULL,
  	"currency" varchar DEFAULT 'XOF' NOT NULL,
  	"gateway" varchar NOT NULL,
  	"idempotency_key" varchar NOT NULL,
  	"gateway_reference" varchar,
  	"status" "enum_payments_status" DEFAULT 'initiated' NOT NULL,
  	"failure_reason" "enum_payments_failure_reason",
  	"redirect_url" varchar,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"confirmed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payment_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"payment_id" integer,
  	"gateway_event_id" varchar NOT NULL,
  	"type" varchar NOT NULL,
  	"payload" jsonb,
  	"signature_valid" boolean DEFAULT false,
  	"received_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "refunds_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"line_id" varchar NOT NULL,
  	"amount" numeric NOT NULL
  );
  
  CREATE TABLE "refunds" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"booking_id" integer NOT NULL,
  	"amount" numeric NOT NULL,
  	"calculated_amount" numeric NOT NULL,
  	"adjustment_reason" varchar,
  	"reason" "enum_refunds_reason" NOT NULL,
  	"method" "enum_refunds_method" DEFAULT 'original' NOT NULL,
  	"method_justification" varchar,
  	"status" "enum_refunds_status" DEFAULT 'requested' NOT NULL,
  	"rejection_reason" varchar,
  	"gateway_refund_reference" varchar,
  	"requested_by_id" integer,
  	"approved_by_id" integer,
  	"approved_at" timestamp(3) with time zone,
  	"paid_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "commission_entries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"booking_id" integer NOT NULL,
  	"line_id" varchar NOT NULL,
  	"partner_id" integer NOT NULL,
  	"kind" "enum_commission_entries_kind" NOT NULL,
  	"payment_id" integer,
  	"refund_id" integer,
  	"gross_amount" numeric NOT NULL,
  	"commission_amount" numeric NOT NULL,
  	"partner_amount" numeric NOT NULL,
  	"rate_bp" numeric NOT NULL,
  	"occurred_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payouts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"partner_id" integer NOT NULL,
  	"period_start" varchar NOT NULL,
  	"period_end" varchar NOT NULL,
  	"amount" numeric NOT NULL,
  	"method" "enum_payouts_method" NOT NULL,
  	"reference" varchar,
  	"paid_at" timestamp(3) with time zone NOT NULL,
  	"recorded_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reminders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"target_type" "enum_reminders_target_type" NOT NULL,
  	"target_id" numeric NOT NULL,
  	"kind" "enum_reminders_kind" NOT NULL,
  	"channel" "enum_reminders_channel" NOT NULL,
  	"rank" numeric DEFAULT 1 NOT NULL,
  	"scheduled_for" timestamp(3) with time zone NOT NULL,
  	"sent_at" timestamp(3) with time zone,
  	"status" "enum_reminders_status" DEFAULT 'scheduled' NOT NULL,
  	"link_opened_at" timestamp(3) with time zone,
  	"unsubscribed" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "notifications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"booking_id" integer,
  	"template" varchar NOT NULL,
  	"channel" "enum_notifications_channel" NOT NULL,
  	"recipient" varchar NOT NULL,
  	"locale" "enum_notifications_locale" DEFAULT 'fr' NOT NULL,
  	"payload" jsonb,
  	"attempts" numeric DEFAULT 0 NOT NULL,
  	"status" "enum_notifications_status" DEFAULT 'queued' NOT NULL,
  	"provider_message_id" varchar,
  	"last_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "commission_rates_rates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"offer_type" "enum_commission_rates_rates_offer_type" NOT NULL,
  	"rate_bp" numeric NOT NULL,
  	"effective_from" varchar NOT NULL
  );
  
  CREATE TABLE "commission_rates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "stays" ADD COLUMN "bookable" boolean DEFAULT false;
  ALTER TABLE "stays" ADD COLUMN "partner_id" integer;
  ALTER TABLE "stays" ADD COLUMN "child_price_percent" numeric DEFAULT 50;
  ALTER TABLE "stays" ADD COLUMN "require_full_payment" boolean DEFAULT false;
  ALTER TABLE "_stays_v" ADD COLUMN "version_bookable" boolean DEFAULT false;
  ALTER TABLE "_stays_v" ADD COLUMN "version_partner_id" integer;
  ALTER TABLE "_stays_v" ADD COLUMN "version_child_price_percent" numeric DEFAULT 50;
  ALTER TABLE "_stays_v" ADD COLUMN "version_require_full_payment" boolean DEFAULT false;
  ALTER TABLE "experiences" ADD COLUMN "max_participants" numeric DEFAULT 12;
  ALTER TABLE "experiences" ADD COLUMN "offer_kind" "enum_experiences_offer_kind" DEFAULT 'activity';
  ALTER TABLE "experiences" ADD COLUMN "bookable" boolean DEFAULT false;
  ALTER TABLE "experiences" ADD COLUMN "partner_id" integer;
  ALTER TABLE "experiences" ADD COLUMN "cancellation_policy_id" integer;
  ALTER TABLE "experiences" ADD COLUMN "child_price_percent" numeric DEFAULT 50;
  ALTER TABLE "_experiences_v" ADD COLUMN "version_max_participants" numeric DEFAULT 12;
  ALTER TABLE "_experiences_v" ADD COLUMN "version_offer_kind" "enum__experiences_v_version_offer_kind" DEFAULT 'activity';
  ALTER TABLE "_experiences_v" ADD COLUMN "version_bookable" boolean DEFAULT false;
  ALTER TABLE "_experiences_v" ADD COLUMN "version_partner_id" integer;
  ALTER TABLE "_experiences_v" ADD COLUMN "version_cancellation_policy_id" integer;
  ALTER TABLE "_experiences_v" ADD COLUMN "version_child_price_percent" numeric DEFAULT 50;
  ALTER TABLE "accommodations" ADD COLUMN "pricing_low_season_per_night" numeric;
  ALTER TABLE "accommodations" ADD COLUMN "pricing_high_season_per_night" numeric;
  ALTER TABLE "accommodations" ADD COLUMN "min_nights" numeric DEFAULT 1;
  ALTER TABLE "accommodations" ADD COLUMN "bookable" boolean DEFAULT false;
  ALTER TABLE "accommodations" ADD COLUMN "partner_id" integer;
  ALTER TABLE "accommodations" ADD COLUMN "cancellation_policy_id" integer;
  ALTER TABLE "_accommodations_v" ADD COLUMN "version_pricing_low_season_per_night" numeric;
  ALTER TABLE "_accommodations_v" ADD COLUMN "version_pricing_high_season_per_night" numeric;
  ALTER TABLE "_accommodations_v" ADD COLUMN "version_min_nights" numeric DEFAULT 1;
  ALTER TABLE "_accommodations_v" ADD COLUMN "version_bookable" boolean DEFAULT false;
  ALTER TABLE "_accommodations_v" ADD COLUMN "version_partner_id" integer;
  ALTER TABLE "_accommodations_v" ADD COLUMN "version_cancellation_policy_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "transfers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "partners_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "carts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "bookings_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payments_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payment_events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "refunds_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "commission_entries_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payouts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reminders_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "notifications_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "checkout_deposit_percent" numeric DEFAULT 30 NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "checkout_deposit_threshold_days" numeric DEFAULT 30 NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "checkout_balance_due_days_before_arrival" numeric DEFAULT 14 NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "checkout_availability_sla_minutes" numeric DEFAULT 120 NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "checkout_business_hours_start" varchar DEFAULT '08:00';
  ALTER TABLE "site_settings" ADD COLUMN "checkout_business_hours_end" varchar DEFAULT '20:00';
  ALTER TABLE "site_settings" ADD COLUMN "checkout_refund_delay_days" numeric DEFAULT 14 NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "checkout_cart_ttl_days" numeric DEFAULT 7 NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "checkout_cart_purge_days" numeric DEFAULT 30 NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "checkout_min_lead_days" numeric DEFAULT 1 NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "notifications_whatsapp_sender_id" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "notifications_finance_email" varchar;
  ALTER TABLE "experiences_slots" ADD CONSTRAINT "experiences_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "experiences_slots_locales" ADD CONSTRAINT "experiences_slots_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."experiences_slots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v_version_slots" ADD CONSTRAINT "_experiences_v_version_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_experiences_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_experiences_v_version_slots_locales" ADD CONSTRAINT "_experiences_v_version_slots_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_experiences_v_version_slots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "transfers_price_tiers" ADD CONSTRAINT "transfers_price_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."transfers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "transfers" ADD CONSTRAINT "transfers_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transfers" ADD CONSTRAINT "transfers_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transfers" ADD CONSTRAINT "transfers_cancellation_policy_id_cancellation_policies_id_fk" FOREIGN KEY ("cancellation_policy_id") REFERENCES "public"."cancellation_policies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "transfers_locales" ADD CONSTRAINT "transfers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."transfers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cancellation_policies_tiers" ADD CONSTRAINT "cancellation_policies_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cancellation_policies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "carts_items" ADD CONSTRAINT "carts_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "carts_rels" ADD CONSTRAINT "carts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "carts_rels" ADD CONSTRAINT "carts_rels_stays_fk" FOREIGN KEY ("stays_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "carts_rels" ADD CONSTRAINT "carts_rels_accommodations_fk" FOREIGN KEY ("accommodations_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "carts_rels" ADD CONSTRAINT "carts_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "carts_rels" ADD CONSTRAINT "carts_rels_transfers_fk" FOREIGN KEY ("transfers_id") REFERENCES "public"."transfers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookings_lines" ADD CONSTRAINT "bookings_lines_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookings_lines" ADD CONSTRAINT "bookings_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookings_rels" ADD CONSTRAINT "bookings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookings_rels" ADD CONSTRAINT "bookings_rels_stays_fk" FOREIGN KEY ("stays_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookings_rels" ADD CONSTRAINT "bookings_rels_accommodations_fk" FOREIGN KEY ("accommodations_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookings_rels" ADD CONSTRAINT "bookings_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookings_rels" ADD CONSTRAINT "bookings_rels_transfers_fk" FOREIGN KEY ("transfers_id") REFERENCES "public"."transfers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "refunds_lines" ADD CONSTRAINT "refunds_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."refunds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "refunds" ADD CONSTRAINT "refunds_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "refunds" ADD CONSTRAINT "refunds_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_refund_id_refunds_id_fk" FOREIGN KEY ("refund_id") REFERENCES "public"."refunds"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payouts" ADD CONSTRAINT "payouts_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payouts" ADD CONSTRAINT "payouts_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "commission_rates_rates" ADD CONSTRAINT "commission_rates_rates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."commission_rates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "experiences_slots_order_idx" ON "experiences_slots" USING btree ("_order");
  CREATE INDEX "experiences_slots_parent_id_idx" ON "experiences_slots" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "experiences_slots_locales_locale_parent_id_unique" ON "experiences_slots_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "experiences_slots_locales_parent_id_idx" ON "experiences_slots_locales" USING btree ("_parent_id");
  CREATE INDEX "_experiences_v_version_slots_order_idx" ON "_experiences_v_version_slots" USING btree ("_order");
  CREATE INDEX "_experiences_v_version_slots_parent_id_idx" ON "_experiences_v_version_slots" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_experiences_v_version_slots_locales_locale_parent_id_unique" ON "_experiences_v_version_slots_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_experiences_v_version_slots_locales_parent_id_idx" ON "_experiences_v_version_slots_locales" USING btree ("_parent_id");
  CREATE INDEX "transfers_price_tiers_order_idx" ON "transfers_price_tiers" USING btree ("_order");
  CREATE INDEX "transfers_price_tiers_parent_id_idx" ON "transfers_price_tiers" USING btree ("_parent_id");
  CREATE INDEX "transfers_destination_idx" ON "transfers" USING btree ("destination_id");
  CREATE INDEX "transfers_partner_idx" ON "transfers" USING btree ("partner_id");
  CREATE INDEX "transfers_cancellation_policy_idx" ON "transfers" USING btree ("cancellation_policy_id");
  CREATE INDEX "transfers_updated_at_idx" ON "transfers" USING btree ("updated_at");
  CREATE INDEX "transfers_created_at_idx" ON "transfers" USING btree ("created_at");
  CREATE UNIQUE INDEX "transfers_locales_locale_parent_id_unique" ON "transfers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "transfers_locales_parent_id_idx" ON "transfers_locales" USING btree ("_parent_id");
  CREATE INDEX "cancellation_policies_tiers_order_idx" ON "cancellation_policies_tiers" USING btree ("_order");
  CREATE INDEX "cancellation_policies_tiers_parent_id_idx" ON "cancellation_policies_tiers" USING btree ("_parent_id");
  CREATE INDEX "partners_updated_at_idx" ON "partners" USING btree ("updated_at");
  CREATE INDEX "partners_created_at_idx" ON "partners" USING btree ("created_at");
  CREATE INDEX "carts_items_order_idx" ON "carts_items" USING btree ("_order");
  CREATE INDEX "carts_items_parent_id_idx" ON "carts_items" USING btree ("_parent_id");
  CREATE INDEX "carts_status_idx" ON "carts" USING btree ("status");
  CREATE INDEX "carts_expires_at_idx" ON "carts" USING btree ("expires_at");
  CREATE INDEX "carts_updated_at_idx" ON "carts" USING btree ("updated_at");
  CREATE INDEX "carts_created_at_idx" ON "carts" USING btree ("created_at");
  CREATE INDEX "carts_rels_order_idx" ON "carts_rels" USING btree ("order");
  CREATE INDEX "carts_rels_parent_idx" ON "carts_rels" USING btree ("parent_id");
  CREATE INDEX "carts_rels_path_idx" ON "carts_rels" USING btree ("path");
  CREATE INDEX "carts_rels_stays_id_idx" ON "carts_rels" USING btree ("stays_id");
  CREATE INDEX "carts_rels_accommodations_id_idx" ON "carts_rels" USING btree ("accommodations_id");
  CREATE INDEX "carts_rels_experiences_id_idx" ON "carts_rels" USING btree ("experiences_id");
  CREATE INDEX "carts_rels_transfers_id_idx" ON "carts_rels" USING btree ("transfers_id");
  CREATE INDEX "bookings_lines_order_idx" ON "bookings_lines" USING btree ("_order");
  CREATE INDEX "bookings_lines_parent_id_idx" ON "bookings_lines" USING btree ("_parent_id");
  CREATE INDEX "bookings_lines_partner_idx" ON "bookings_lines" USING btree ("partner_id");
  CREATE UNIQUE INDEX "bookings_reference_idx" ON "bookings" USING btree ("reference");
  CREATE INDEX "bookings_cart_idx" ON "bookings" USING btree ("cart_id");
  CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");
  CREATE INDEX "bookings_updated_at_idx" ON "bookings" USING btree ("updated_at");
  CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");
  CREATE UNIQUE INDEX "cart_cartVersion_idx" ON "bookings" USING btree ("cart_id","cart_version");
  CREATE INDEX "bookings_rels_order_idx" ON "bookings_rels" USING btree ("order");
  CREATE INDEX "bookings_rels_parent_idx" ON "bookings_rels" USING btree ("parent_id");
  CREATE INDEX "bookings_rels_path_idx" ON "bookings_rels" USING btree ("path");
  CREATE INDEX "bookings_rels_stays_id_idx" ON "bookings_rels" USING btree ("stays_id");
  CREATE INDEX "bookings_rels_accommodations_id_idx" ON "bookings_rels" USING btree ("accommodations_id");
  CREATE INDEX "bookings_rels_experiences_id_idx" ON "bookings_rels" USING btree ("experiences_id");
  CREATE INDEX "bookings_rels_transfers_id_idx" ON "bookings_rels" USING btree ("transfers_id");
  CREATE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id");
  CREATE UNIQUE INDEX "payments_idempotency_key_idx" ON "payments" USING btree ("idempotency_key");
  CREATE UNIQUE INDEX "payments_gateway_reference_idx" ON "payments" USING btree ("gateway_reference");
  CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");
  CREATE INDEX "payments_updated_at_idx" ON "payments" USING btree ("updated_at");
  CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");
  CREATE INDEX "payment_events_payment_idx" ON "payment_events" USING btree ("payment_id");
  CREATE UNIQUE INDEX "payment_events_gateway_event_id_idx" ON "payment_events" USING btree ("gateway_event_id");
  CREATE INDEX "payment_events_updated_at_idx" ON "payment_events" USING btree ("updated_at");
  CREATE INDEX "payment_events_created_at_idx" ON "payment_events" USING btree ("created_at");
  CREATE INDEX "refunds_lines_order_idx" ON "refunds_lines" USING btree ("_order");
  CREATE INDEX "refunds_lines_parent_id_idx" ON "refunds_lines" USING btree ("_parent_id");
  CREATE INDEX "refunds_booking_idx" ON "refunds" USING btree ("booking_id");
  CREATE INDEX "refunds_status_idx" ON "refunds" USING btree ("status");
  CREATE INDEX "refunds_requested_by_idx" ON "refunds" USING btree ("requested_by_id");
  CREATE INDEX "refunds_approved_by_idx" ON "refunds" USING btree ("approved_by_id");
  CREATE INDEX "refunds_updated_at_idx" ON "refunds" USING btree ("updated_at");
  CREATE INDEX "refunds_created_at_idx" ON "refunds" USING btree ("created_at");
  CREATE INDEX "commission_entries_booking_idx" ON "commission_entries" USING btree ("booking_id");
  CREATE INDEX "commission_entries_partner_idx" ON "commission_entries" USING btree ("partner_id");
  CREATE INDEX "commission_entries_payment_idx" ON "commission_entries" USING btree ("payment_id");
  CREATE INDEX "commission_entries_refund_idx" ON "commission_entries" USING btree ("refund_id");
  CREATE INDEX "commission_entries_occurred_at_idx" ON "commission_entries" USING btree ("occurred_at");
  CREATE INDEX "commission_entries_updated_at_idx" ON "commission_entries" USING btree ("updated_at");
  CREATE INDEX "commission_entries_created_at_idx" ON "commission_entries" USING btree ("created_at");
  CREATE INDEX "payouts_partner_idx" ON "payouts" USING btree ("partner_id");
  CREATE INDEX "payouts_recorded_by_idx" ON "payouts" USING btree ("recorded_by_id");
  CREATE INDEX "payouts_updated_at_idx" ON "payouts" USING btree ("updated_at");
  CREATE INDEX "payouts_created_at_idx" ON "payouts" USING btree ("created_at");
  CREATE INDEX "reminders_scheduled_for_idx" ON "reminders" USING btree ("scheduled_for");
  CREATE INDEX "reminders_updated_at_idx" ON "reminders" USING btree ("updated_at");
  CREATE INDEX "reminders_created_at_idx" ON "reminders" USING btree ("created_at");
  CREATE UNIQUE INDEX "targetType_targetId_kind_channel_rank_idx" ON "reminders" USING btree ("target_type","target_id","kind","channel","rank");
  CREATE INDEX "notifications_booking_idx" ON "notifications" USING btree ("booking_id");
  CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");
  CREATE INDEX "notifications_updated_at_idx" ON "notifications" USING btree ("updated_at");
  CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");
  CREATE INDEX "commission_rates_rates_order_idx" ON "commission_rates_rates" USING btree ("_order");
  CREATE INDEX "commission_rates_rates_parent_id_idx" ON "commission_rates_rates" USING btree ("_parent_id");
  ALTER TABLE "stays" ADD CONSTRAINT "stays_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_stays_v" ADD CONSTRAINT "_stays_v_version_partner_id_partners_id_fk" FOREIGN KEY ("version_partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "experiences" ADD CONSTRAINT "experiences_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "experiences" ADD CONSTRAINT "experiences_cancellation_policy_id_cancellation_policies_id_fk" FOREIGN KEY ("cancellation_policy_id") REFERENCES "public"."cancellation_policies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_version_partner_id_partners_id_fk" FOREIGN KEY ("version_partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_experiences_v" ADD CONSTRAINT "_experiences_v_version_cancellation_policy_id_cancellation_policies_id_fk" FOREIGN KEY ("version_cancellation_policy_id") REFERENCES "public"."cancellation_policies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_cancellation_policy_id_cancellation_policies_id_fk" FOREIGN KEY ("cancellation_policy_id") REFERENCES "public"."cancellation_policies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_accommodations_v" ADD CONSTRAINT "_accommodations_v_version_partner_id_partners_id_fk" FOREIGN KEY ("version_partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_accommodations_v" ADD CONSTRAINT "_accommodations_v_version_cancellation_policy_id_cancellation_policies_id_fk" FOREIGN KEY ("version_cancellation_policy_id") REFERENCES "public"."cancellation_policies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_transfers_fk" FOREIGN KEY ("transfers_id") REFERENCES "public"."transfers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_carts_fk" FOREIGN KEY ("carts_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk" FOREIGN KEY ("bookings_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payments_fk" FOREIGN KEY ("payments_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payment_events_fk" FOREIGN KEY ("payment_events_id") REFERENCES "public"."payment_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_refunds_fk" FOREIGN KEY ("refunds_id") REFERENCES "public"."refunds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_commission_entries_fk" FOREIGN KEY ("commission_entries_id") REFERENCES "public"."commission_entries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payouts_fk" FOREIGN KEY ("payouts_id") REFERENCES "public"."payouts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reminders_fk" FOREIGN KEY ("reminders_id") REFERENCES "public"."reminders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notifications_fk" FOREIGN KEY ("notifications_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "stays_partner_idx" ON "stays" USING btree ("partner_id");
  CREATE INDEX "_stays_v_version_version_partner_idx" ON "_stays_v" USING btree ("version_partner_id");
  CREATE INDEX "experiences_partner_idx" ON "experiences" USING btree ("partner_id");
  CREATE INDEX "experiences_cancellation_policy_idx" ON "experiences" USING btree ("cancellation_policy_id");
  CREATE INDEX "_experiences_v_version_version_partner_idx" ON "_experiences_v" USING btree ("version_partner_id");
  CREATE INDEX "_experiences_v_version_version_cancellation_policy_idx" ON "_experiences_v" USING btree ("version_cancellation_policy_id");
  CREATE INDEX "accommodations_partner_idx" ON "accommodations" USING btree ("partner_id");
  CREATE INDEX "accommodations_cancellation_policy_idx" ON "accommodations" USING btree ("cancellation_policy_id");
  CREATE INDEX "_accommodations_v_version_version_partner_idx" ON "_accommodations_v" USING btree ("version_partner_id");
  CREATE INDEX "_accommodations_v_version_version_cancellation_policy_idx" ON "_accommodations_v" USING btree ("version_cancellation_policy_id");
  CREATE INDEX "payload_locked_documents_rels_transfers_id_idx" ON "payload_locked_documents_rels" USING btree ("transfers_id");
  CREATE INDEX "payload_locked_documents_rels_partners_id_idx" ON "payload_locked_documents_rels" USING btree ("partners_id");
  CREATE INDEX "payload_locked_documents_rels_carts_id_idx" ON "payload_locked_documents_rels" USING btree ("carts_id");
  CREATE INDEX "payload_locked_documents_rels_bookings_id_idx" ON "payload_locked_documents_rels" USING btree ("bookings_id");
  CREATE INDEX "payload_locked_documents_rels_payments_id_idx" ON "payload_locked_documents_rels" USING btree ("payments_id");
  CREATE INDEX "payload_locked_documents_rels_payment_events_id_idx" ON "payload_locked_documents_rels" USING btree ("payment_events_id");
  CREATE INDEX "payload_locked_documents_rels_refunds_id_idx" ON "payload_locked_documents_rels" USING btree ("refunds_id");
  CREATE INDEX "payload_locked_documents_rels_commission_entries_id_idx" ON "payload_locked_documents_rels" USING btree ("commission_entries_id");
  CREATE INDEX "payload_locked_documents_rels_payouts_id_idx" ON "payload_locked_documents_rels" USING btree ("payouts_id");
  CREATE INDEX "payload_locked_documents_rels_reminders_id_idx" ON "payload_locked_documents_rels" USING btree ("reminders_id");
  CREATE INDEX "payload_locked_documents_rels_notifications_id_idx" ON "payload_locked_documents_rels" USING btree ("notifications_id");`)

  // 002 (T024, FR-019) : une seule tentative de paiement active par réservation et par objet.
  await db.execute(sql`
  CREATE UNIQUE INDEX "payments_one_active_per_purpose" ON "payments" USING btree ("booking_id", "purpose") WHERE "status" IN ('initiated', 'pending');`)

  // 002 (T020) : prix saisonniers des hébergements existants repris du « à partir de » (les deux
  // saisons au même prix, à ajuster dans l'admin).
  await db.execute(sql`
  UPDATE "accommodations" SET "pricing_low_season_per_night" = "price_from_per_night", "pricing_high_season_per_night" = "price_from_per_night" WHERE "pricing_low_season_per_night" IS NULL AND "price_from_per_night" IS NOT NULL;
  UPDATE "_accommodations_v" SET "version_pricing_low_season_per_night" = "version_price_from_per_night", "version_pricing_high_season_per_night" = "version_price_from_per_night" WHERE "version_pricing_low_season_per_night" IS NULL AND "version_price_from_per_night" IS NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP INDEX IF EXISTS "payments_one_active_per_purpose";`)
  await db.execute(sql`
   ALTER TABLE "experiences_slots" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "experiences_slots_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_experiences_v_version_slots" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_experiences_v_version_slots_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "transfers_price_tiers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "transfers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "transfers_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cancellation_policies_tiers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "carts_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "carts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "carts_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bookings_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bookings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bookings_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payment_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "refunds_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "refunds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "commission_entries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payouts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reminders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "notifications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "commission_rates_rates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "commission_rates" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "experiences_slots" CASCADE;
  DROP TABLE "experiences_slots_locales" CASCADE;
  DROP TABLE "_experiences_v_version_slots" CASCADE;
  DROP TABLE "_experiences_v_version_slots_locales" CASCADE;
  DROP TABLE "transfers_price_tiers" CASCADE;
  DROP TABLE "transfers" CASCADE;
  DROP TABLE "transfers_locales" CASCADE;
  DROP TABLE "cancellation_policies_tiers" CASCADE;
  DROP TABLE "partners" CASCADE;
  DROP TABLE "carts_items" CASCADE;
  DROP TABLE "carts" CASCADE;
  DROP TABLE "carts_rels" CASCADE;
  DROP TABLE "bookings_lines" CASCADE;
  DROP TABLE "bookings" CASCADE;
  DROP TABLE "bookings_rels" CASCADE;
  DROP TABLE "payments" CASCADE;
  DROP TABLE "payment_events" CASCADE;
  DROP TABLE "refunds_lines" CASCADE;
  DROP TABLE "refunds" CASCADE;
  DROP TABLE "commission_entries" CASCADE;
  DROP TABLE "payouts" CASCADE;
  DROP TABLE "reminders" CASCADE;
  DROP TABLE "notifications" CASCADE;
  DROP TABLE "commission_rates_rates" CASCADE;
  DROP TABLE "commission_rates" CASCADE;
  ALTER TABLE "stays" DROP CONSTRAINT IF EXISTS "stays_partner_id_partners_id_fk";
  
  ALTER TABLE "_stays_v" DROP CONSTRAINT IF EXISTS "_stays_v_version_partner_id_partners_id_fk";
  
  ALTER TABLE "experiences" DROP CONSTRAINT IF EXISTS "experiences_partner_id_partners_id_fk";
  
  ALTER TABLE "experiences" DROP CONSTRAINT IF EXISTS "experiences_cancellation_policy_id_cancellation_policies_id_fk";
  
  ALTER TABLE "_experiences_v" DROP CONSTRAINT IF EXISTS "_experiences_v_version_partner_id_partners_id_fk";
  
  ALTER TABLE "_experiences_v" DROP CONSTRAINT IF EXISTS "_experiences_v_version_cancellation_policy_id_cancellation_policies_id_fk";
  
  ALTER TABLE "accommodations" DROP CONSTRAINT IF EXISTS "accommodations_partner_id_partners_id_fk";
  
  ALTER TABLE "accommodations" DROP CONSTRAINT IF EXISTS "accommodations_cancellation_policy_id_cancellation_policies_id_fk";
  
  ALTER TABLE "_accommodations_v" DROP CONSTRAINT IF EXISTS "_accommodations_v_version_partner_id_partners_id_fk";
  
  ALTER TABLE "_accommodations_v" DROP CONSTRAINT IF EXISTS "_accommodations_v_version_cancellation_policy_id_cancellation_policies_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_transfers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_partners_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_carts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_bookings_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_payments_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_payment_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_refunds_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_commission_entries_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_payouts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_reminders_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_notifications_fk";
  
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  DROP INDEX "stays_partner_idx";
  DROP INDEX "_stays_v_version_version_partner_idx";
  DROP INDEX "experiences_partner_idx";
  DROP INDEX "experiences_cancellation_policy_idx";
  DROP INDEX "_experiences_v_version_version_partner_idx";
  DROP INDEX "_experiences_v_version_version_cancellation_policy_idx";
  DROP INDEX "accommodations_partner_idx";
  DROP INDEX "accommodations_cancellation_policy_idx";
  DROP INDEX "_accommodations_v_version_version_partner_idx";
  DROP INDEX "_accommodations_v_version_version_cancellation_policy_idx";
  DROP INDEX "payload_locked_documents_rels_transfers_id_idx";
  DROP INDEX "payload_locked_documents_rels_partners_id_idx";
  DROP INDEX "payload_locked_documents_rels_carts_id_idx";
  DROP INDEX "payload_locked_documents_rels_bookings_id_idx";
  DROP INDEX "payload_locked_documents_rels_payments_id_idx";
  DROP INDEX "payload_locked_documents_rels_payment_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_refunds_id_idx";
  DROP INDEX "payload_locked_documents_rels_commission_entries_id_idx";
  DROP INDEX "payload_locked_documents_rels_payouts_id_idx";
  DROP INDEX "payload_locked_documents_rels_reminders_id_idx";
  DROP INDEX "payload_locked_documents_rels_notifications_id_idx";
  ALTER TABLE "stays" DROP COLUMN "bookable";
  ALTER TABLE "stays" DROP COLUMN "partner_id";
  ALTER TABLE "stays" DROP COLUMN "child_price_percent";
  ALTER TABLE "stays" DROP COLUMN "require_full_payment";
  ALTER TABLE "_stays_v" DROP COLUMN "version_bookable";
  ALTER TABLE "_stays_v" DROP COLUMN "version_partner_id";
  ALTER TABLE "_stays_v" DROP COLUMN "version_child_price_percent";
  ALTER TABLE "_stays_v" DROP COLUMN "version_require_full_payment";
  ALTER TABLE "experiences" DROP COLUMN "max_participants";
  ALTER TABLE "experiences" DROP COLUMN "offer_kind";
  ALTER TABLE "experiences" DROP COLUMN "bookable";
  ALTER TABLE "experiences" DROP COLUMN "partner_id";
  ALTER TABLE "experiences" DROP COLUMN "cancellation_policy_id";
  ALTER TABLE "experiences" DROP COLUMN "child_price_percent";
  ALTER TABLE "_experiences_v" DROP COLUMN "version_max_participants";
  ALTER TABLE "_experiences_v" DROP COLUMN "version_offer_kind";
  ALTER TABLE "_experiences_v" DROP COLUMN "version_bookable";
  ALTER TABLE "_experiences_v" DROP COLUMN "version_partner_id";
  ALTER TABLE "_experiences_v" DROP COLUMN "version_cancellation_policy_id";
  ALTER TABLE "_experiences_v" DROP COLUMN "version_child_price_percent";
  ALTER TABLE "accommodations" DROP COLUMN "pricing_low_season_per_night";
  ALTER TABLE "accommodations" DROP COLUMN "pricing_high_season_per_night";
  ALTER TABLE "accommodations" DROP COLUMN "min_nights";
  ALTER TABLE "accommodations" DROP COLUMN "bookable";
  ALTER TABLE "accommodations" DROP COLUMN "partner_id";
  ALTER TABLE "accommodations" DROP COLUMN "cancellation_policy_id";
  ALTER TABLE "_accommodations_v" DROP COLUMN "version_pricing_low_season_per_night";
  ALTER TABLE "_accommodations_v" DROP COLUMN "version_pricing_high_season_per_night";
  ALTER TABLE "_accommodations_v" DROP COLUMN "version_min_nights";
  ALTER TABLE "_accommodations_v" DROP COLUMN "version_bookable";
  ALTER TABLE "_accommodations_v" DROP COLUMN "version_partner_id";
  ALTER TABLE "_accommodations_v" DROP COLUMN "version_cancellation_policy_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "transfers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "partners_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "carts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "bookings_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payments_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payment_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "refunds_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "commission_entries_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payouts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "reminders_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "notifications_id";
  ALTER TABLE "site_settings" DROP COLUMN "checkout_deposit_percent";
  ALTER TABLE "site_settings" DROP COLUMN "checkout_deposit_threshold_days";
  ALTER TABLE "site_settings" DROP COLUMN "checkout_balance_due_days_before_arrival";
  ALTER TABLE "site_settings" DROP COLUMN "checkout_availability_sla_minutes";
  ALTER TABLE "site_settings" DROP COLUMN "checkout_business_hours_start";
  ALTER TABLE "site_settings" DROP COLUMN "checkout_business_hours_end";
  ALTER TABLE "site_settings" DROP COLUMN "checkout_refund_delay_days";
  ALTER TABLE "site_settings" DROP COLUMN "checkout_cart_ttl_days";
  ALTER TABLE "site_settings" DROP COLUMN "checkout_cart_purge_days";
  ALTER TABLE "site_settings" DROP COLUMN "checkout_min_lead_days";
  ALTER TABLE "site_settings" DROP COLUMN "notifications_whatsapp_sender_id";
  ALTER TABLE "site_settings" DROP COLUMN "notifications_finance_email";
  DROP TYPE "public"."enum_experiences_offer_kind";
  DROP TYPE "public"."enum__experiences_v_version_offer_kind";
  DROP TYPE "public"."enum_transfers_origin";
  DROP TYPE "public"."enum_partners_kind";
  DROP TYPE "public"."enum_partners_payout_method";
  DROP TYPE "public"."enum_carts_items_offer_type";
  DROP TYPE "public"."enum_carts_items_transfer_direction";
  DROP TYPE "public"."enum_carts_locale";
  DROP TYPE "public"."enum_carts_status";
  DROP TYPE "public"."enum_bookings_lines_offer_type";
  DROP TYPE "public"."enum_bookings_lines_transfer_direction";
  DROP TYPE "public"."enum_bookings_lines_availability_status";
  DROP TYPE "public"."enum_bookings_locale";
  DROP TYPE "public"."enum_bookings_payment_plan";
  DROP TYPE "public"."enum_bookings_status";
  DROP TYPE "public"."enum_payments_purpose";
  DROP TYPE "public"."enum_payments_method";
  DROP TYPE "public"."enum_payments_status";
  DROP TYPE "public"."enum_payments_failure_reason";
  DROP TYPE "public"."enum_refunds_reason";
  DROP TYPE "public"."enum_refunds_method";
  DROP TYPE "public"."enum_refunds_status";
  DROP TYPE "public"."enum_commission_entries_kind";
  DROP TYPE "public"."enum_payouts_method";
  DROP TYPE "public"."enum_reminders_target_type";
  DROP TYPE "public"."enum_reminders_kind";
  DROP TYPE "public"."enum_reminders_channel";
  DROP TYPE "public"."enum_reminders_status";
  DROP TYPE "public"."enum_notifications_channel";
  DROP TYPE "public"."enum_notifications_locale";
  DROP TYPE "public"."enum_notifications_status";
  DROP TYPE "public"."enum_commission_rates_rates_offer_type";`)
}
