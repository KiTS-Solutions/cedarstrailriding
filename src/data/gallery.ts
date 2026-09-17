export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
};

export type GalleryPlaceholder = {
  id: string;
  label: string;
};

// The only 3 real photos cleared for use right now (brief/07_image_assets.md section A).
// Rights are assumed (client is the operator) but NOT yet confirmed — see
// PRELAUNCH_CHECKLIST.md before public launch.
export const galleryImages: GalleryImage[] = [
  {
    id: "tripadvisor-01",
    src: "/images/gallery/tripadvisor_01_1440x960.jpg",
    alt: "Riders on a trail in the Shouf mountains",
  },
  {
    id: "tripadvisor-02",
    src: "/images/gallery/tripadvisor_02_1440x960.jpg",
    alt: "Guided horseback ride through Lebanon's countryside",
  },
  {
    id: "tripadvisor-03",
    src: "/images/gallery/tripadvisor_03_761x507.jpg",
    alt: "Cedars Trail Riding horseback tour",
  },
];

// Requested but not yet supplied by the client — brief/07_image_assets.md section D /
// brief/15_media_asset_list.md. Rendered as tasteful labeled placeholders so the grid
// reads intentionally rather than broken.
export const galleryPlaceholders: GalleryPlaceholder[] = [
  { id: "hero", label: "Hero: cedar forest ride" },
  { id: "pine-trail", label: "Pine Trail" },
  { id: "beit-eddine-trail", label: "Beit Eddine Trail" },
  { id: "panoramic-trail", label: "Panoramic Trail" },
  { id: "rocky-trail", label: "Rocky Trail" },
  { id: "barouk-cedars-trail", label: "Barouk Cedars Trail" },
  { id: "marj-bisri-trek", label: "Marj Bisri riverside camping" },
  { id: "horses", label: "Meet the horses — portraits" },
  { id: "team", label: "Guides & team, incl. Robin" },
  { id: "groups", label: "Groups, schools & corporate rides" },
];
