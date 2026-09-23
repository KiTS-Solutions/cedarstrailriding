import type { APIRoute } from "astro";
import { withBase } from "../i18n";

// Generated (not a static public/ file) so start_url and icon paths follow the deploy base path.
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: "Cedars Trail Riding",
      short_name: "Cedars Riding",
      description: "Guided horseback trail rides in the Shouf, Lebanon.",
      start_url: withBase("/"),
      display: "browser",
      background_color: "#fbf7ee",
      theme_color: "#3c4710",
      icons: [
        { src: withBase("/icon-192.png"), sizes: "192x192", type: "image/png" },
        { src: withBase("/icon-512.png"), sizes: "512x512", type: "image/png" },
        { src: withBase("/icon-maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    }),
    { headers: { "Content-Type": "application/manifest+json" } },
  );
