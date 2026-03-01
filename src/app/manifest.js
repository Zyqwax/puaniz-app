export default function manifest() {
  return {
    name: "Puaniz App",
    short_name: "Puaniz",
    description: "YKS Analiz ve Takip Uygulaması",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
