import type { UIFieldServerProps } from 'payload';
import { guideWarnings } from '@/lib/guides/guards';

// Encadré « Points à vérifier » en tête du formulaire d'un guide (004, T053, FR-015b) : liens,
// longueur du texte et du chapeau dans la langue éditée. Informatif : ne bloque jamais la
// publication. Calculé sur la version enregistrée (rechargée après chaque enregistrement).

type Obj = Record<string, unknown>;

const isRecord = (value: unknown): value is Obj =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const count = (value: unknown): number => (Array.isArray(value) ? value.length : 0);

export const GuideWarnings = ({ data, req }: UIFieldServerProps) => {
  if (!isRecord(data) || data.id === undefined) return null;
  const warnings = guideWarnings({
    locale: req.locale === 'en' ? 'en' : 'fr',
    guide: {
      standfirst: typeof data.standfirst === 'string' ? data.standfirst : null,
      body: data.body,
    },
    author: null,
    reviewer: null,
    linksCount:
      count(data.relatedStays) +
      count(data.relatedExperiences) +
      count(data.relatedAccommodations) +
      count(data.relatedDestinations),
  });
  if (warnings.length === 0) return null;
  return (
    <div
      role="note"
      data-guide-warnings
      style={{
        marginBottom: 24,
        padding: '12px 16px',
        borderLeft: '4px solid var(--theme-warning-500)',
        background: 'var(--theme-warning-50)',
      }}
    >
      <p style={{ fontWeight: 600, margin: 0 }}>
        Points à vérifier (la publication reste possible)
      </p>
      <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
};
