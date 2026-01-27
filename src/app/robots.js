export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/private/", // Example: Disallow private routes if any
    },
    sitemap: "https://www.puaniz.com.tr/sitemap.xml",
  };
}
