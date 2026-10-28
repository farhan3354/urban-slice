import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Urban Slice Pizza — Kabirwala",
    short_name: "Urban Slice",
    description: "Freshly baked pizza, sides & drinks in Kabirwala. Order on WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF5E8",
    theme_color: "#E63936",
    icons: [{ src: "/images/logo.png", sizes: "512x512", type: "image/png" }],
  };
}
