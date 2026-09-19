import { brand, contact, logoSrc, social } from "./siteSettings";
import type { FaqItem } from "./faq";

const SITE_URL = "https://cedarstrailriding.com";
const BUSINESS_ID = `${SITE_URL}/#business`;

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": BUSINESS_ID,
    name: brand.name,
    description: brand.positioning,
    url: SITE_URL,
    image: `${SITE_URL}${logoSrc}`,
    telephone: contact.phones,
    email: contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Samqaniyeh, Beiteddine",
      addressRegion: "Shouf District",
      addressCountry: "LB",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: contact.coordinates.lat,
      longitude: contact.coordinates.lng,
    },
    sameAs: [social.instagram_main && brand.instagram, brand.facebook].filter(Boolean),
  };
}

export function touristTripSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: brand.tagline,
    description: brand.mission,
    provider: { "@id": BUSINESS_ID },
    touristType: ["Families", "Couples", "Solo travelers", "Beginners", "Adventure seekers"],
  };
}

export function faqPageSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbSchema(crumbs: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.url}`,
    })),
  };
}
