import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gleanings",
    short_name: "Gleanings",
    description: "Your saved LinkedIn posts, summarized and searchable.",
    start_url: "/",
    display: "standalone",
    background_color: "#f9f7f3",
    theme_color: "#f9f7f3",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
