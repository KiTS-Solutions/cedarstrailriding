import siteFacts from "../../brief/05_site_facts.json";

export type Difficulty = "Beginner-Friendly" | "Scenic Ride" | "Adventure/Challenging" | null;

export type Trail = {
  id: string;
  name: string;
  difficulty: Difficulty;
  duration: string | null;
  feature: boolean;
  summary: string;
  features: string | null;
  image?: string;
};

const summaries: Record<string, string> = {
  "Pine Trail": "A gentle start through forest paths — perfect for first riders.",
  "Beit Eddine Trail": "Slow pace, big views near historic Beiteddine.",
  "Panoramic Trail": "Ridgeline vistas over the Shouf; bring a camera.",
  "Rocky Trail": "Technical terrain for riders who want more.",
  "Barouk Cedars Trail": "Our longest canter trail to the Barouk Cedars Reserve.",
  "Marj Bisri Trail": "Riverside camping and activities on a short expedition.",
  "Custom Trails": "Create your own full-day or multi-day trek.",
};

const featured = new Set(["Barouk Cedars Trail", "Marj Bisri Trail"]);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const trails: Trail[] = siteFacts.offerings.trail_rides.map((trail) => ({
  id: slugify(trail.name),
  name: trail.name,
  difficulty: (trail.difficulty as Difficulty) ?? null,
  duration: trail.duration ?? null,
  feature: featured.has(trail.name),
  summary: summaries[trail.name] ?? trail.features ?? "",
  features: trail.features ?? null,
}));
