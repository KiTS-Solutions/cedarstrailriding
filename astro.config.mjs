// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

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

  // Self-hosted at build time (Astro Fonts API): files are downloaded, served from our own
  // origin and paired with metric-matched fallbacks so the swap doesn't shift layout.
  // Latin pages: Fraunces (display) + Inter (body). Arabic: El Messiri (display) + IBM Plex
  // Sans Arabic (body). Each page preloads only its own script's faces (BaseLayout.astro).
  fonts: [
    {
      name: 'Fraunces',
      cssVariable: '--font-fraunces',
      provider: fontProviders.google(),
      weights: ['400 700'],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      name: 'Inter',
      cssVariable: '--font-inter',
      provider: fontProviders.google(),
      weights: ['400 700'],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      name: 'El Messiri',
      cssVariable: '--font-el-messiri',
      provider: fontProviders.google(),
      weights: ['400 700'],
      styles: ['normal'],
      subsets: ['arabic', 'latin'],
      fallbacks: ['serif'],
    },
    {
      name: 'IBM Plex Sans Arabic',
      cssVariable: '--font-plex-arabic',
      provider: fontProviders.google(),
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['arabic', 'latin'],
      fallbacks: ['sans-serif'],
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],
});