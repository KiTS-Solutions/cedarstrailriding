import siteFacts from "../../brief/05_site_facts.json";

// Single source of truth is brief/05_site_facts.json — never hardcode brand/contact
// facts elsewhere. Fields that are `null` there are genuinely unknown (client hasn't
// supplied them yet); render "coming soon" states instead of inventing values.

export const brand = siteFacts.brand;
export const contact = siteFacts.contact;
export const social = siteFacts.social;
export const offerings = siteFacts.offerings;
export const audiences = siteFacts.audiences;
export const reviewsEvidence = siteFacts.reviews_evidence;
export const values = siteFacts.values;
export const seo = siteFacts.seo;
export const buildDecisions = siteFacts.build_decisions;
export const knownTeam = siteFacts.known_team;

export const footerMap = buildDecisions.footer_map;

/** `05_site_facts.json` stores asset paths relative to the repo root (e.g. "public/images/..."); strip the `public/` prefix to get the URL path Astro serves it at. */
function toPublicPath(repoPath: string): string {
  return `/${repoPath.replace(/^public\//, "")}`;
}

export const logoSrc = toPublicPath(buildDecisions.logo.local_file);

export const brandFamily =
  buildDecisions.brand_family_footer.confirmed_brands.map((entry) => ({
    name: entry.name,
    href:
      "site" in entry
        ? entry.site
        : "instagram" in entry
          ? entry.instagram
          : undefined,
    logoSrc: toPublicPath(entry.logo),
  }));

export const palette = {
  cedarDeep: "#0E3B2E",
  cedarSoft: "#2A5C4A",
  sand: "#F5EFE2",
  warmWhite: "#FBF7EE",
  gold: "#C9A227",
  ink: "#1C241F",
  terracotta: "#B4552D",
} as const;
