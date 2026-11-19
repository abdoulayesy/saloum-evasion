import { z } from 'zod';

// Variables d'environnement du tunnel de commande (002, T002), lues et validées une seule fois
// côté serveur. Les valeurs facultatives absentes désactivent proprement le service concerné
// (WhatsApp journalisé, passerelle réelle indisponible) au lieu de faire échouer le site.
// Module serveur : ne jamais l'importer depuis un îlot client.

const optional = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() !== '' ? value.trim() : undefined));

const checkoutEnvSchema = z
  .object({
    PAYMENT_GATEWAY: z.string().trim().min(1).default('fake'),
    FAKE_GATEWAY_SECRET: optional,
    PAYMENT_GATEWAY_API_KEY: optional,
    PAYMENT_GATEWAY_WEBHOOK_SECRET: optional,
    WHATSAPP_CLOUD_TOKEN: optional,
    WHATSAPP_PHONE_NUMBER_ID: optional,
    WHATSAPP_APP_SECRET: optional,
    WHATSAPP_VERIFY_TOKEN: optional,
    CRON_SECRET: optional,
    PLAUSIBLE_EVENTS_API: z.string().trim().url().default('https://plausible.io/api/event'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    // Recettes sur préproduction uniquement : autorise la passerelle factice en production.
    ALLOW_FAKE_GATEWAY: optional,
  })
  .superRefine((env, context) => {
    // La passerelle factice n'est jamais acceptée en production.
    // Lu dans la source validée (et non dans process.env) : résultat indépendant de l'environnement.
    if (
      env.NODE_ENV === 'production' &&
      env.PAYMENT_GATEWAY === 'fake' &&
      env.ALLOW_FAKE_GATEWAY !== '1'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['PAYMENT_GATEWAY'],
        message: 'La passerelle « fake » est interdite en production.',
      });
    }
    if (env.PAYMENT_GATEWAY === 'fake' && !env.FAKE_GATEWAY_SECRET) {
      context.addIssue({
        code: 'custom',
        path: ['FAKE_GATEWAY_SECRET'],
        message: 'FAKE_GATEWAY_SECRET est requis avec la passerelle « fake ».',
      });
    }
  });

export type CheckoutEnv = z.infer<typeof checkoutEnvSchema>;

/** Valide un jeu de variables (testable sans dépendre de process.env). */
export const parseCheckoutEnv = (source: Record<string, string | undefined>): CheckoutEnv => {
  const result = checkoutEnvSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues.map(
      (issue) => `${issue.path.join('.')} : ${issue.message}`,
    );
    throw new Error(`Configuration du tunnel invalide :\n- ${details.join('\n- ')}`);
  }
  return result.data;
};

let cached: CheckoutEnv | null = null;

/** Variables du tunnel, validées à la première lecture. */
export const checkoutEnv = (): CheckoutEnv => {
  cached ??= parseCheckoutEnv(process.env);
  return cached;
};
