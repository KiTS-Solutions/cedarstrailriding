// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Production defaults; the GitHub Pages demo build overrides both (see
  // .github/workflows/pages.yml). SITE_BASE is the URL sub-path, e.g. "/cedarstrailriding".
  site: process.env.SITE_ORIGIN ?? 'https://cedarstrailriding.com',
  base: process.env.SITE_BASE ?? '/',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar', 'fr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],
});