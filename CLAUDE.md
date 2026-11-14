# saloum-evasion Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-11-14

## Active Technologies

- TypeScript 5.x (strict, noUncheckedIndexedAccess), Node.js 22 LTS (001-site-public-vitrine)
- Next.js 15 (App Router, RSC, Server Actions, next/image, next/font, next/og) + Payload CMS 3
  intégré, next-intl, Tailwind CSS v4, Zod, schema-dts, hls.js (à la demande), web-vitals,
  Resend (001-site-public-vitrine)
- PostgreSQL 16 managé (Europe de l'Ouest), stockage objet S3-compatible, Mux (vidéo HLS),
  Plausible (sans cookie) (001-site-public-vitrine)

## Project Structure

```text
src/app/(frontend)/[locale]/   # site public FR/EN (SSG + revalidateTag)
src/app/(payload)/admin/       # admin Payload
src/collections/ src/globals/ src/fields/ src/hooks/
src/lib/                       # pricing, seo (metadata, jsonld), request, whatsapp, analytics
src/components/                # ui, cards, client (îlots "use client"), blocks
tests/unit/ tests/e2e/
```

## Commands

pnpm dev; pnpm typecheck; pnpm lint; pnpm test; pnpm e2e; pnpm e2e:nojs; pnpm lhci; pnpm seo:check

## Code Style

- Constitution : `.specify/memory/constitution.md` (non négociable : mobile-first `min-width`
  uniquement, budgets Lighthouse, SEO SSR, WCAG 2.2 AA, aucun `any`).
- Montants en XOF entiers ; conversion EUR fixe 655,957, toujours « indicative ».
- Composants serveur par défaut ; `"use client"` seulement pour les îlots listés dans le plan.

## Recent Changes

- 001-site-public-vitrine: site public bilingue + Payload CMS (voir specs/001-site-public-vitrine/plan.md)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
