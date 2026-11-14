import type { Page } from '@playwright/test';

// Profils réseau de référence (constitution I et II, spec FR-020).
// Débits en octets par seconde, latence en millisecondes.
export type NetworkProfileName = 'slow4g' | '3g';

type NetworkProfile = {
  downloadThroughput: number;
  uploadThroughput: number;
  latency: number;
  cpuSlowdown: number;
};

const kbit = (value: number): number => (value * 1000) / 8;

export const networkProfiles: Record<NetworkProfileName, NetworkProfile> = {
  slow4g: {
    downloadThroughput: kbit(1600),
    uploadThroughput: kbit(750),
    latency: 150,
    cpuSlowdown: 4,
  },
  '3g': {
    downloadThroughput: kbit(780),
    uploadThroughput: kbit(330),
    latency: 300,
    cpuSlowdown: 4,
  },
};

const openSession = async (page: Page) => page.context().newCDPSession(page);

/** Applique un profil réseau et processeur (Chromium uniquement). */
export const applyNetwork = async (page: Page, name: NetworkProfileName): Promise<void> => {
  const profile = networkProfiles[name];
  const session = await openSession(page);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: profile.latency,
    downloadThroughput: profile.downloadThroughput,
    uploadThroughput: profile.uploadThroughput,
  });
  await session.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuSlowdown });
};

/** Coupe ou rétablit le réseau (scénarios de connexion partielle). */
export const setOffline = async (page: Page, offline: boolean): Promise<void> => {
  await page.context().setOffline(offline);
};
