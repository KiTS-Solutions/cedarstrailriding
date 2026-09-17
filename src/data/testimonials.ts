export type Testimonial = {
  id: string;
  quote: string;
  attribution: string;
  source: "tripadvisor" | "wikiloc";
};

// Paraphrased from verified reviews per brief/05_site_facts.json testimonials.draft_quotes.
// [CONFIRM] verbatim wording + attribution with the client before launch — see
// PRELAUNCH_CHECKLIST.md.
export const testimonials: Testimonial[] = [
  {
    id: "testimonial-1",
    quote:
      "Amazing experience in the Shouf — the horses are well trained and easy to handle, even for beginners. The guide was patient and put everyone at ease.",
    attribution: "TripAdvisor traveler, 2025",
    source: "tripadvisor",
  },
  {
    id: "testimonial-2",
    quote: "Friendly, great vibes, and they truly know the best places. Arabic and English both spoken.",
    attribution: "TripAdvisor traveler, 2025",
    source: "tripadvisor",
  },
  {
    id: "testimonial-3",
    quote: "You can be accompanied by a local guide, so even children can do it.",
    attribution: "Wikiloc rider",
    source: "wikiloc",
  },
];
