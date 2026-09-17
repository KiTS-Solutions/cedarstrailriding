/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_WEB3FORMS_ACCESS_KEY?: string;
  readonly PUBLIC_GA4_ID?: string;
  readonly PUBLIC_META_PIXEL_ID?: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
