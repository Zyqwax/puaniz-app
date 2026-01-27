import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Profil Ayarları",
  description: "Hesap ayarlarınızı ve tercihlerinizi güncelleyin.",
  keywords: ["profil ayarları", "hesap ayarları", "kullanıcı profili"],
};

export default function SettingsPage() {
  return <SettingsClient />;
}
