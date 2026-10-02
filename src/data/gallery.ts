export type GalleryImage = {
  id: string;
  src: string;
  /** i18n key for the alt text (gallery.alt.<id>). */
  altKey: string;
  width: number;
  height: number;
};

// Photos: the only 3 real photos cleared for use right now (brief/07_image_assets.md section A).
// Rights are assumed (client is the operator) but NOT yet confirmed — see PRELAUNCH_CHECKLIST.md
// before public launch.
// Stills: frames from CTR's own v2 footage (public/images/hero/v2/, scripts/encode-hero-v2.sh),
// already on the site in the hero and ambient loops (rider consent tracked in the same checklist).
// Order is the masonry reading order: landscape photos and portrait stills alternate.
export const galleryImages: GalleryImage[] = [
  {
    id: "flag-sunset",
    src: "/images/hero/v2/ambient-flag.webp",
    altKey: "gallery.alt.flag-sunset",
    width: 540,
    height: 960,
  },
  {
    id: "tripadvisor-01",
    src: "/images/gallery/tripadvisor_01_1440x960.jpg",
    altKey: "gallery.alt.tripadvisor-01",
    width: 1440,
    height: 960,
  },
  {
    id: "ridge",
    src: "/images/hero/v2/ambient-ridge.webp",
    altKey: "gallery.alt.ridge",
    width: 540,
    height: 960,
  },
  {
    id: "tripadvisor-02",
    src: "/images/gallery/tripadvisor_02_1440x960.jpg",
    altKey: "gallery.alt.tripadvisor-02",
    width: 1440,
    height: 960,
  },
  {
    id: "gallop",
    src: "/images/hero/v2/ambient-gallop.webp",
    altKey: "gallery.alt.gallop",
    width: 540,
    height: 960,
  },
  {
    id: "aerial",
    src: "/images/hero/v2/poster-hd.webp",
    altKey: "gallery.alt.aerial",
    width: 720,
    height: 1280,
  },
  {
    id: "tripadvisor-03",
    src: "/images/gallery/tripadvisor_03_761x507.jpg",
    altKey: "gallery.alt.tripadvisor-03",
    width: 761,
    height: 507,
  },
  {
    id: "group",
    src: "/images/hero/v2/ambient-group.webp",
    altKey: "gallery.alt.group",
    width: 540,
    height: 960,
  },
];

// Shots still requested from the client (brief/07_image_assets.md section D /
// brief/15_media_asset_list.md: per-trail photos, horse portraits, team, groups). Until they
// arrive the grid ends with one designed "more this season" tile rather than labelled empty slots.
