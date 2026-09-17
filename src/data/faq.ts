export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

// EN master from brief/12_translation_pack.md "FAQ seeds". AR/FR live under the same
// keys (faq.1..faq.7) in src/i18n/locales/{ar,fr}.json.
export const faqItems: FaqItem[] = [
  {
    id: "faq-1",
    question: "Do I need riding experience?",
    answer:
      "No — our guides teach you the basics before every ride, and beginner trails are available.",
  },
  {
    id: "faq-2",
    question: "Can children ride?",
    answer: "Yes — with a local guide, even kids can ride. (Minimum age to confirm.)",
  },
  {
    id: "faq-3",
    question: "What should I wear?",
    answer: "Long trousers and closed shoes; we provide helmets and gear.",
  },
  {
    id: "faq-4",
    question: "Where are you located?",
    answer: "Based in Samqaniyeh, Beiteddine (Shouf District) — we operate all over Lebanon.",
  },
  {
    id: "faq-5",
    question: "What languages do you speak?",
    answer: "Arabic, English, and French.",
  },
  {
    id: "faq-6",
    question: "What if the weather is bad?",
    answer: "Rides are weather-dependent; we reschedule or refund.",
  },
  {
    id: "faq-7",
    question: "Do you pick up from Beirut?",
    answer: "Yes, on request.",
  },
];

/** Resolve each FAQ item through a locale's `t()` (keys `faq.<n>.q` / `faq.<n>.a`). */
export function localizedFaqItems(t: (key: string) => string): FaqItem[] {
  return faqItems.map((item, index) => {
    const n = index + 1;
    return { id: item.id, question: t(`faq.${n}.q`), answer: t(`faq.${n}.a`) };
  });
}
