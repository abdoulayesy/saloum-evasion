import type { Graph, Thing } from 'schema-dts';

// Assemble les nœuds d'une page dans un @graph unique.
export const buildGraph = (nodes: readonly Thing[]): Graph => ({
  '@context': 'https://schema.org',
  '@graph': [...nodes],
});
