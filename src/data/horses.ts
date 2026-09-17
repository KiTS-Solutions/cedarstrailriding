export type Horse = {
  id: string;
  name: string;
  personality?: string;
  image?: string;
};

// No horse names/personalities confirmed by the client yet (brief/06_open_questions.md
// item 14). DO NOT invent names — render "coming soon" placeholder cards instead.
export const horses: Horse[] = [];

export const HORSE_PLACEHOLDER_COUNT = 3;
