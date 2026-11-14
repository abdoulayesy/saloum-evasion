import type { MetadataRoute } from 'next';
import { fixedEntries } from '@/lib/seo/sitemapEntries';

// /sitemap.xml — régénéré à chaque publication (revalidateTag('sitemap'), phase 2B).
const sitemap = (): MetadataRoute.Sitemap => fixedEntries();

export default sitemap;
