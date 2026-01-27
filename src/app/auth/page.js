import AuthClient from "./AuthClient";

export const metadata = {
  title: "Giriş Yap / Kayıt Ol",
  description:
    "Puanİz hesabınıza giriş yapın veya ücretsiz kayıt olarak YKS hazırlık sürecinizi profesyonelce yönetmeye başlayın.",
  keywords: ["giriş yap", "kayıt ol", "ücretsiz üyelik", "yks koçluk", "hesap oluştur"],
};

export default function AuthPage() {
  return <AuthClient />;
}
