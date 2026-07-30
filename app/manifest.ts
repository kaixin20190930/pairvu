import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pairvu",
    short_name: "Pairvu",
    description: "Compare an AI-generated or edited product image with the approved original before publishing.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#245cf5",
    icons: [
      {
        src: "/brand/pairvu-app-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
