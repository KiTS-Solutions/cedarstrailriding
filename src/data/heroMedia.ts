// Hero footage variants. "v2" is CTR's own vertical (9:16) footage shot for the site
// (scripts/encode-hero-v2.sh); "v1" is the previous AI-generated landscape clip
// (scripts/encode-hero.sh), kept intact as a proven fallback. Flip HERO_VARIANT to switch.

export type HeroVariant = "v1" | "v2";
export const HERO_VARIANT: HeroVariant = "v2";

export interface HeroMedia {
  /** "bleed" = full-screen video everywhere; "panel" = portrait video panel on wide screens. */
  layout: "bleed" | "panel";
  /** Public directory (no base prefix) holding the files below. */
  dir: string;
  video: { desktop: string; mobile: string; compact: string };
  poster: {
    desktop: { src: string; width: number; height: number };
    mobile: string;
  };
  /** i18n keys for the copy that describes the footage itself. */
  copy: { chapter2: string; act2Body: string };
  /** Decorative particle style drawn over the scrub. */
  fx: "splash" | "dust";
}

export const HERO_MEDIA: Record<HeroVariant, HeroMedia> = {
  v1: {
    layout: "bleed",
    dir: "/images/hero/v1",
    video: {
      desktop: "ride-desktop.mp4",
      mobile: "ride-mobile.mp4",
      compact: "ride-compact.mp4",
    },
    poster: {
      desktop: { src: "poster-desktop.webp", width: 1600, height: 900 },
      mobile: "poster-mobile.webp",
    },
    copy: { chapter2: "hero.chapter2", act2Body: "hero.act2.body" },
    fx: "splash",
  },
  v2: {
    layout: "panel",
    dir: "/images/hero/v2",
    video: {
      desktop: "ride-hd.mp4",
      mobile: "ride-mobile.mp4",
      compact: "ride-compact.mp4",
    },
    poster: {
      desktop: { src: "poster-hd.webp", width: 720, height: 1280 },
      mobile: "poster-mobile.webp",
    },
    copy: { chapter2: "hero.v2.chapter2", act2Body: "hero.v2.act2.body" },
    fx: "dust",
  },
};

export const heroMedia = HERO_MEDIA[HERO_VARIANT];

/** Media query under which ScrollHero serves the mobile poster (keep the two in sync). */
export const HERO_MOBILE_MEDIA = "(max-width: 767px) and (orientation: portrait)";

/**
 * Head preloads for the hero poster (the home page's LCP image). The <picture> alone was
 * fetched at Low priority behind CSS and below-fold posters on mobile.
 */
export const heroPosterPreloads = [
  { href: `${heroMedia.dir}/${heroMedia.poster.mobile}`, media: HERO_MOBILE_MEDIA },
  {
    href: `${heroMedia.dir}/${heroMedia.poster.desktop.src}`,
    media: `not all and ${HERO_MOBILE_MEDIA}`,
  },
];

/** v2-only clips (welcome loader + ambient section loops), same encode script. */
export const v2Clips = {
  loader: {
    video: "/images/hero/v2/loader.mp4",
    poster: "/images/hero/v2/loader.webp",
  },
  group: {
    video: "/images/hero/v2/ambient-group.mp4",
    poster: "/images/hero/v2/ambient-group.webp",
  },
  ridge: {
    video: "/images/hero/v2/ambient-ridge.mp4",
    poster: "/images/hero/v2/ambient-ridge.webp",
  },
  gallop: {
    video: "/images/hero/v2/ambient-gallop.mp4",
    poster: "/images/hero/v2/ambient-gallop.webp",
  },
} as const;
