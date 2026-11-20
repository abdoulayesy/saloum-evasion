import type { PageKey } from '@/collections/Pages';
import type { Page } from '@/payload-types';
import { richText } from './content';
import type { PhotoKey } from './photos';

// Blocs des pages éditoriales du seed de DÉMONSTRATION (phase 7). Aucun fait inventé : les
// chiffres clés reprennent des faits du site (lieux présentés, moyens de paiement, délai de
// réponse annoncé) ; les mentions légales et la déclaration CDP restent « à compléter ».
// La version anglaise reprend les identifiants des blocs et des lignes de la version
// française (champs traduits d'un même bloc).

type Lang = 'fr' | 'en';
export type PageBlock = NonNullable<Page['blocks']>[number];

export type PageBlocksContext = {
  photo: (key: PhotoKey) => number;
  galleryPhotos: number[];
  teamMembers: number[];
};

const by = (lang: Lang, fr: string, en: string): string => (lang === 'fr' ? fr : en);

const blocksByPage = (
  key: PageKey,
  lang: Lang,
  ctx: PageBlocksContext,
  title: string,
): PageBlock[] => {
  const t = (fr: string, en: string) => by(lang, fr, en);
  switch (key) {
    case 'home':
      return [{ blockType: 'hero', heading: title, image: ctx.photo('jetty') }];
    case 'commitment':
      return [
        {
          blockType: 'hero',
          heading: t('Un voyage qui profite au delta', 'Travel that benefits the delta'),
          text: t(
            'Guides, piroguiers et hôtes du Saloum : chaque séjour fait travailler des gens d’ici.',
            'Guides, boatmen and hosts from the Saloum: every stay supports local people.',
          ),
          image: ctx.photo('villageShore'),
        },
        {
          blockType: 'richText',
          content: richText([
            t(
              'Texte de démonstration : l’équipe décrira ici ses engagements réels envers les villages, la mangrove et les visiteurs.',
              'Demonstration text: the team will describe its real commitments to the villages, the mangroves and visitors here.',
            ),
            t(
              'Petits groupes, respect des marées et des oiseaux, repas préparés avec les produits du delta.',
              'Small groups, respect for the tides and the birds, meals made with produce from the delta.',
            ),
          ]),
        },
        {
          blockType: 'figures',
          heading: t('En quelques chiffres', 'At a glance'),
          items: [
            { value: '6', label: t('lieux du delta présentés', 'places in the delta featured') },
            {
              value: '3',
              label: t('moyens de paiement au même rang', 'payment methods on an equal footing'),
            },
            { value: '24 h', label: t('pour vous répondre, au plus', 'at most to reply to you') },
          ],
        },
        { blockType: 'guarantees', heading: t('Nos garanties', 'Our guarantees') },
        {
          blockType: 'cta',
          heading: t('Prêt à partir ?', 'Ready to go?'),
          text: t('Choisissez un séjour tout compris.', 'Choose an all-inclusive stay.'),
          action: 'stays',
        },
      ];
    case 'about':
      return [
        {
          blockType: 'hero',
          heading: t('Une équipe de Ndangane', 'A team from Ndangane'),
          text: t(
            'Nous vivons ici et nous organisons chaque séjour nous-mêmes.',
            'We live here and organise every stay ourselves.',
          ),
          image: ctx.photo('villageWaterfront'),
        },
        {
          blockType: 'richText',
          content: richText([
            t(
              'Texte de démonstration : Saloum Évasion est une équipe basée à Ndangane, qui organise des séjours dans les îles et les bolongs du Sine-Saloum.',
              'Demonstration text: Saloum Évasion is a team based in Ndangane that organises stays in the islands and bolongs of the Sine-Saloum.',
            ),
          ]),
        },
        { blockType: 'team', heading: t('L’équipe', 'The team'), members: ctx.teamMembers },
        {
          blockType: 'steps',
          heading: t('Comment se passe votre séjour', 'How your stay works'),
          items: [
            {
              title: t('Vous nous écrivez', 'You get in touch'),
              text: t(
                'Par le formulaire ou sur WhatsApp, avec vos dates et vos envies.',
                'Through the form or on WhatsApp, with your dates and wishes.',
              ),
            },
            {
              title: t('Nous composons votre séjour', 'We put your stay together'),
              text: t(
                'Hébergement, sorties, repas et transfert, avec un prix clair.',
                'Accommodation, outings, meals and transfer, at a clear price.',
              ),
            },
            {
              title: t('Vous profitez du Saloum', 'You enjoy the Saloum'),
              text: t(
                'Un membre de l’équipe vous accompagne du début à la fin.',
                'A team member looks after you from start to finish.',
              ),
            },
          ],
        },
        {
          blockType: 'gallery',
          heading: t('Le Saloum en images', 'The Saloum in pictures'),
          images: ctx.galleryPhotos,
        },
        {
          blockType: 'cta',
          heading: t('Une question ?', 'A question?'),
          text: t('Écrivez-nous, nous répondons vite.', 'Write to us, we reply quickly.'),
          action: 'whatsapp',
        },
      ];
    case 'faq':
      return [
        {
          blockType: 'richText',
          content: richText([
            t(
              'Les réponses aux questions que l’on nous pose le plus souvent. Une autre question ? Écrivez-nous.',
              'Answers to the questions we are asked most often. Another question? Write to us.',
            ),
          ]),
        },
      ];
    case 'contact':
      return [
        {
          blockType: 'richText',
          content: richText([
            t(
              'Le plus simple est de nous écrire sur WhatsApp : nous répondons depuis Ndangane.',
              'The easiest way is to message us on WhatsApp: we reply from Ndangane.',
            ),
          ]),
        },
      ];
    case 'legal':
      return [
        {
          blockType: 'richText',
          content: richText([
            t(
              'Page de démonstration, à compléter avant le lancement.',
              'Demonstration page, to be completed before launch.',
            ),
            t(
              'Éditeur : raison sociale, forme juridique, NINEA, RCCM, adresse du siège et directeur de la publication (à compléter).',
              'Publisher: company name, legal form, NINEA, RCCM, registered address and publication director (to be completed).',
            ),
            t(
              'Hébergement : nom et adresse de l’hébergeur (à compléter).',
              'Hosting: name and address of the host (to be completed).',
            ),
          ]),
        },
      ];
    case 'privacy':
      return [
        {
          blockType: 'richText',
          content: richText([
            t(
              'Nous collectons le minimum de données, sans cookie de mesure d’audience. Le registre ci-dessous indique, pour chaque traitement, la finalité, la base légale, la durée de conservation, les destinataires et les transferts hors du Sénégal.',
              'We collect as little data as possible, with no analytics cookies. The register below lists, for each processing activity, its purpose, legal basis, retention period, recipients and transfers outside Senegal.',
            ),
            t(
              'Déclaration auprès de la Commission de protection des données personnelles (CDP, loi 2008-12) : en cours, à confirmer avant le lancement.',
              'Notification to the Senegalese data protection authority (CDP, law 2008-12): in progress, to be confirmed before launch.',
            ),
          ]),
        },
        {
          blockType: 'processingRegister',
          entries: [
            {
              purpose: t('Demandes de séjour', 'Stay requests'),
              data: t(
                'Nom, e-mail, téléphone ou WhatsApp, dates, nombre de voyageurs, message.',
                'Name, email, phone or WhatsApp, dates, number of travellers, message.',
              ),
              legalBasis: t(
                'Mesures précontractuelles prises à votre demande',
                'Pre-contractual steps taken at your request',
              ),
              retention: t(
                '24 mois, sauf si la demande a donné lieu à un séjour',
                '24 months, unless the request led to a stay',
              ),
              recipients: t(
                'Équipe Saloum Évasion ; hébergeur du site ; Resend (envoi des e-mails)',
                'Saloum Évasion team; website host; Resend (email delivery)',
              ),
              transfers: t(
                'Hébergeur en Europe de l’Ouest ; Resend (États-Unis). Garanties contractuelles à confirmer.',
                'Host in Western Europe; Resend (United States). Contractual safeguards to be confirmed.',
              ),
            },
            {
              purpose: t('Réservations et paiements', 'Bookings and payments'),
              data: t(
                'Nom, e-mail, WhatsApp, prestations, dates, nombre de voyageurs, demande particulière, montants, référence et statut des paiements. Aucune donnée de carte : elle est saisie sur la page sécurisée du prestataire de paiement.',
                'Name, email, WhatsApp, services, dates, number of travellers, special request, amounts, payment reference and status. No card data: it is entered on the payment provider’s secure page.',
              ),
              legalBasis: t(
                'Exécution du contrat ; obligations comptables',
                'Performance of the contract; accounting obligations',
              ),
              retention: t(
                '10 ans pour les pièces comptables (réservations, paiements, remboursements, à confirmer par le comptable), puis anonymisation',
                '10 years for accounting records (bookings, payments, refunds, to be confirmed by the accountant), then anonymised',
              ),
              recipients: t(
                'Équipe Saloum Évasion ; prestataire concerné (nom, dates, nombre de voyageurs, demande particulière) ; prestataire de paiement (Wave, Orange Money, carte : agrégateur à désigner) ; hébergeur du site ; Resend (e-mails) ; Meta (WhatsApp)',
                'Saloum Évasion team; the partner concerned (name, dates, number of travellers, special request); payment provider (Wave, Orange Money, card: aggregator to be appointed); website host; Resend (email); Meta (WhatsApp)',
              ),
              transfers: t(
                'Hébergeur en Europe de l’Ouest ; Resend et Meta (États-Unis) ; prestataire de paiement au Sénégal ou dans l’UEMOA (à confirmer). Garanties contractuelles à confirmer.',
                'Host in Western Europe; Resend and Meta (United States); payment provider in Senegal or the WAEMU (to be confirmed). Contractual safeguards to be confirmed.',
              ),
            },
            {
              purpose: t('Relances de paiement', 'Payment reminders'),
              data: t(
                'Prénom, e-mail, WhatsApp, contenu du panier, ouverture du lien de relance.',
                'First name, email, WhatsApp, cart contents, whether the reminder link was opened.',
              ),
              legalBasis: t(
                'Consentement (case à cocher, retirable à tout moment par le lien de désinscription)',
                'Consent (checkbox, withdrawable at any time through the unsubscribe link)',
              ),
              retention: t(
                'Deux relances au plus ; panier non payé supprimé 30 jours après sa dernière modification ; journal des relances 12 mois',
                'Two reminders at most; unpaid cart deleted 30 days after its last change; reminder log 12 months',
              ),
              recipients: t(
                'Resend (e-mails) ; Meta (WhatsApp)',
                'Resend (email); Meta (WhatsApp)',
              ),
              transfers: t('États-Unis (Resend, Meta)', 'United States (Resend, Meta)'),
            },
            {
              purpose: t('Messages WhatsApp de suivi', 'WhatsApp follow-up messages'),
              data: t(
                'Numéro WhatsApp, prénom, référence de réservation, liens de gestion et statut d’envoi.',
                'WhatsApp number, first name, booking reference, management links and delivery status.',
              ),
              legalBasis: t('Exécution du contrat', 'Performance of the contract'),
              retention: t('Journal d’envoi : 24 mois', 'Delivery log: 24 months'),
              recipients: t('Meta (API WhatsApp Cloud)', 'Meta (WhatsApp Cloud API)'),
              transfers: t(
                'États-Unis et Union européenne (Meta)',
                'United States and European Union (Meta)',
              ),
            },
            {
              purpose: t('Prestataires partenaires', 'Partner providers'),
              data: t(
                'Nom du contact, téléphone, WhatsApp, e-mail, moyen et coordonnées de reversement, commissions et reversements.',
                'Contact name, phone, WhatsApp, email, payout method and details, commissions and payouts.',
              ),
              legalBasis: t(
                'Exécution du contrat de partenariat ; obligations comptables',
                'Performance of the partnership contract; accounting obligations',
              ),
              retention: t(
                'Pendant le partenariat ; commissions et reversements 10 ans (pièces comptables)',
                'During the partnership; commissions and payouts 10 years (accounting records)',
              ),
              recipients: t(
                'Équipe Saloum Évasion (coordonnées de reversement : finance seulement) ; hébergeur du site ; Meta (WhatsApp)',
                'Saloum Évasion team (payout details: finance only); website host; Meta (WhatsApp)',
              ),
              transfers: t(
                'Europe de l’Ouest (hébergeur) ; États-Unis (Meta)',
                'Western Europe (host); United States (Meta)',
              ),
            },
            {
              purpose: t('Cookies du panier', 'Cart cookies'),
              data: t(
                '« se_cart » : identifiant aléatoire du panier (HttpOnly) ; « se_cart_summary » : nombre d’articles et total affichés. Aucun cookie de mesure ni de publicité.',
                '“se_cart”: random cart identifier (HttpOnly); “se_cart_summary”: number of items and total shown. No analytics or advertising cookie.',
              ),
              legalBasis: t(
                'Strictement nécessaires au service demandé (panier), sans consentement préalable',
                'Strictly necessary for the requested service (cart), no prior consent needed',
              ),
              retention: t('7 jours', '7 days'),
              recipients: t('Aucun : lus par le site seulement', 'None: read by the website only'),
              transfers: t('Aucun', 'None'),
            },
            {
              purpose: t('Mesure d’audience', 'Audience measurement'),
              data: t(
                'Pages vues, site d’origine, type d’appareil, pays, en statistiques agrégées, sans cookie.',
                'Page views, referring site, device type, country, as aggregated statistics, with no cookie.',
              ),
              legalBasis: t('Intérêt légitime', 'Legitimate interest'),
              retention: t(
                'Statistiques agrégées, sans donnée individuelle',
                'Aggregated statistics, no individual data',
              ),
              recipients: t('Plausible Analytics', 'Plausible Analytics'),
              transfers: t('Union européenne (Plausible)', 'European Union (Plausible)'),
            },
            {
              purpose: t('Lecture des vidéos', 'Video playback'),
              data: t(
                'Adresse IP et données techniques de lecture, seulement après le clic sur lecture.',
                'IP address and technical playback data, only after you press play.',
              ),
              legalBasis: t('Intérêt légitime', 'Legitimate interest'),
              retention: t(
                'Selon la politique de Mux (à confirmer)',
                'According to Mux’s policy (to be confirmed)',
              ),
              recipients: t('Mux (diffusion vidéo)', 'Mux (video streaming)'),
              transfers: t('États-Unis (Mux)', 'United States (Mux)'),
            },
            {
              purpose: t('Comptes de l’équipe', 'Team accounts'),
              data: t('Nom, e-mail, rôle, dates de connexion.', 'Name, email, role, login dates.'),
              legalBasis: t(
                'Intérêt légitime (sécurité du site)',
                'Legitimate interest (site security)',
              ),
              retention: t(
                'Pendant la fonction, puis suppression du compte',
                'While in post, then the account is deleted',
              ),
              recipients: t('Hébergeur du site', 'Website host'),
              transfers: t('Europe de l’Ouest (hébergeur)', 'Western Europe (host)'),
            },
            {
              purpose: t(
                'Protection du formulaire contre les abus',
                'Protecting the form against abuse',
              ),
              data: t(
                'Empreinte de l’adresse IP (hachée avec sel).',
                'Fingerprint of the IP address (salted hash).',
              ),
              legalBasis: t(
                'Intérêt légitime (sécurité du site)',
                'Legitimate interest (site security)',
              ),
              retention: t('24 heures', '24 hours'),
              recipients: t('Hébergeur du site', 'Website host'),
              transfers: t('Europe de l’Ouest (hébergeur)', 'Western Europe (host)'),
            },
          ],
        },
      ];
    case 'film':
      return [
        {
          blockType: 'richText',
          content: richText([
            t(
              'Vidéo de démonstration : le film réel du Saloum, tourné par l’équipe, la remplacera avant le lancement.',
              'Demonstration video: the real Saloum film, shot by the team, will replace it before launch.',
            ),
          ]),
        },
      ];
    default:
      return [];
  }
};

type WithId = { id?: string | null };

const withItemIds = <T extends object>(
  items: readonly T[] | null | undefined,
  previous: readonly WithId[] | null | undefined,
): T[] =>
  (items ?? []).map((item, index) => {
    const id = previous?.[index]?.id;
    return id ? { ...item, id } : { ...item };
  });

/** Bloc anglais avec les identifiants du bloc français correspondant. */
const mergeBlock = (block: PageBlock, previous: PageBlock | undefined): PageBlock => {
  if (!previous || previous.blockType !== block.blockType) return block;
  const id = previous.id ?? undefined;
  switch (block.blockType) {
    case 'figures':
      return {
        ...block,
        id,
        items: withItemIds(block.items, previous.blockType === 'figures' ? previous.items : null),
      };
    case 'steps':
      return {
        ...block,
        id,
        items: withItemIds(block.items, previous.blockType === 'steps' ? previous.items : null),
      };
    case 'processingRegister':
      return {
        ...block,
        id,
        entries: withItemIds(
          block.entries,
          previous.blockType === 'processingRegister' ? previous.entries : null,
        ),
      };
    default:
      return { ...block, id };
  }
};

export const pageBlocks = (
  key: PageKey,
  lang: Lang,
  ctx: PageBlocksContext,
  title: string,
  french?: readonly PageBlock[] | null,
): PageBlock[] => {
  const blocks = blocksByPage(key, lang, ctx, title);
  return french ? blocks.map((block, index) => mergeBlock(block, french[index])) : blocks;
};
