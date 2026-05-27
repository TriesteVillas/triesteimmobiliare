// @ts-check
import { defineConfig } from 'astro/config';

import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.triesteimmobiliare.com',
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
  }),
  integrations: [mdx(), sitemap()],
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en', 'de', 'sl'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
    fallback: {
      en: 'it',
      de: 'it',
      sl: 'it',
    },
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
