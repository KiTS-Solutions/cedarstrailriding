export type Experience = {
  id: string;
  name: string;
  audience: string;
};

// Sourced verbatim from brief/05_site_facts.json offerings.special_experiences
// and brief/03_messaging_and_copy.md section B.
export const experiences: Experience[] = [
  { id: "hiking-with-horses", name: "Hiking with horses", audience: "for large groups or schools" },
  {
    id: "business-events",
    name: "Business events & team-building retreats",
    audience: "for corporate teams",
  },
  {
    id: "custom-experiences",
    name: "Custom experiences",
    audience: "birthdays, proposals, and more",
  },
];
