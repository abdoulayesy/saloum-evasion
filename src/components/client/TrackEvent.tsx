'use client';

import { useEffect } from 'react';
import { track, type AnalyticsEvent } from '@/lib/analytics';

// Émet un évènement de mesure à l'affichage d'une étape du tunnel (002, T065). Aucune donnée
// personnelle dans les propriétés.
export const TrackEvent = ({
  event,
  props = {},
}: {
  event: AnalyticsEvent;
  props?: Record<string, string | number | boolean>;
}) => {
  const serialized = JSON.stringify(props);
  useEffect(() => {
    track(event, JSON.parse(serialized));
  }, [event, serialized]);
  return null;
};
