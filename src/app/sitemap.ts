import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.puaniz.com.tr";

  const routes: MetadataRoute.Sitemap = ["", "/about", "/pricing", "/contact", "/auth"].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
      priority: route === "" ? 1 : 0.8,
    }),
  );

  return routes;
}
