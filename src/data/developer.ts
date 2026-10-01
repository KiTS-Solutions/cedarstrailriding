// Site credit for the agency that built and maintains this site (KiTS). Deliberately kept out
// of brief/05_site_facts.json — that file is the client's brand facts; this is ours.
// `null` social URLs are not rendered.

export const developer = {
  name: "KiTS",
  logoSrc: "/images/brand/kits-mark.webp",
  phone: "+961 81 290 662",
  whatsapp: "https://wa.me/96181290662",
  email: "kits.tech.co@gmail.com",
  instagram: "https://www.instagram.com/kits_solutions/" as string | null,
  facebook: "https://www.facebook.com/profile.php?id=61585989414621" as string | null,
} as const;
