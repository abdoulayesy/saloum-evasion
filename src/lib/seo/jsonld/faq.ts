import type { FAQPage } from 'schema-dts';
import { faqId } from './touristTrip';

// FAQPage (contrat jsonld.md) : uniquement les questions et réponses visibles sur la page.
export type FaqEntry = { question: string; answer: string };

export const buildFaqPage = (url: string, entries: readonly FaqEntry[]): FAQPage => ({
  '@type': 'FAQPage',
  '@id': faqId(url),
  mainEntity: entries.map((entry) => ({
    '@type': 'Question',
    name: entry.question,
    acceptedAnswer: { '@type': 'Answer', text: entry.answer },
  })),
});
