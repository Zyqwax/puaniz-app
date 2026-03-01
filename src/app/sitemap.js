export default function sitemap() {
  const baseUrl = "https://www.puaniz.com.tr";

  const routes = ["", "/about", "/pricing", "/contact", "/auth"].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? "daily" : "weekly",
      priority: route === "" ? 1 : 0.8,
    }),
  );

  return routes;
}
