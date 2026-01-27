# Puaniz 📊

**Puaniz**, öğrencilerin sınav sonuçlarını analiz edip, eksiklerini belirlemelerine yardımcı olan akıllı bir eğitim platformudur.

![Next.js](https://img.shields.io/badge/Next.js-16.1.5-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.3-61dafb?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-12.8.0-ffca28?logo=firebase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06b6d4?logo=tailwindcss)

---

## 🚀 Özellikler

### 📝 Sınav Yönetimi

- YKS, LGS, KPSS gibi farklı sınav türleri için destek
- TYT, AYT, YDT alt sınav kategorileri
- Kolay sınav ekleme ve düzenleme

### 📈 Detaylı Analiz

- Ders bazlı performans grafikleri
- Net hesaplama ve puan tahmini
- Zayıf ve güçlü alanların tespiti
- PDF ve görsel olarak rapor indirme

### 🤖 AI Asistan

- **Groq AI** destekli akıllı sohbet
- Markdown formatında zengin yanıtlar
- Konu anlatımı ve soru çözümü desteği

### 👥 Topluluk

- Soru odaları oluşturma ve katılma
- Kullanıcılar arası etkileşim
- Etiket bazlı soru filtreleme

### 📚 Sınav Geçmişi

- Tüm sınavların kronolojik listesi
- Liste ve kart görünüm seçenekleri
- Geçmiş sınavları düzenleme ve silme

### ⚙️ Ayarlar

- Profil düzenleme
- Cloudinary ile resim yükleme
- Hesap yönetimi

---

## 🛠️ Teknolojiler

| Kategori      | Teknoloji                           |
| ------------- | ----------------------------------- |
| **Framework** | Next.js 16 (App Router)             |
| **Frontend**  | React 19, Tailwind CSS 4            |
| **Backend**   | Firebase (Auth, Firestore, Storage) |
| **AI**        | Groq SDK                            |
| **Grafikler** | Recharts                            |
| **PDF**       | jsPDF, jspdf-autotable              |
| **Görsel**    | html2canvas-pro                     |
| **İkonlar**   | Lucide React                        |

---

## 📁 Proje Yapısı

```
puaniz-app/
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Ana dashboard sayfaları
│   │   │   ├── add-exam/      # Sınav ekleme
│   │   │   ├── analysis/      # Analiz sayfası
│   │   │   ├── assistant/     # AI asistan
│   │   │   ├── changelog/     # Değişiklik günlüğü
│   │   │   ├── community/     # Topluluk
│   │   │   ├── history/       # Sınav geçmişi
│   │   │   └── settings/      # Ayarlar
│   │   └── auth/              # Kimlik doğrulama
│   ├── components/            # Yeniden kullanılabilir bileşenler
│   ├── content/               # Statik içerikler
│   ├── context/               # React Context
│   ├── lib/                   # Firebase yapılandırması
│   ├── services/              # API servisleri
│   └── utils/                 # Yardımcı fonksiyonlar
└── public/                    # Statik dosyalar
```

---

## 🚀 Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn

### Adımlar

1. **Depoyu klonlayın:**

   ```bash
   git clone https://github.com/your-username/puaniz-app.git
   cd puaniz-app
   ```

2. **Bağımlılıkları yükleyin:**

   ```bash
   npm install
   ```

3. **Ortam değişkenlerini ayarlayın:**

   `.env.local` dosyası oluşturun:

   ```env
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=

   # Groq AI
   GROQ_API_KEY=

   # Cloudinary
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
   ```

4. **Geliştirme sunucusunu başlatın:**

   ```bash
   npm run dev
   ```

5. **Tarayıcıda açın:** [http://localhost:3000](http://localhost:3000)

---

## 📜 Scriptler

| Komut           | Açıklama                        |
| --------------- | ------------------------------- |
| `npm run dev`   | Geliştirme sunucusunu başlatır  |
| `npm run build` | Prodüksiyon için derler         |
| `npm run start` | Prodüksiyon sunucusunu başlatır |
| `npm run lint`  | ESLint ile kod kontrolü         |

---

## 🔐 Ortam Değişkenleri

| Değişken                   | Açıklama                         |
| -------------------------- | -------------------------------- |
| `NEXT_PUBLIC_FIREBASE_*`   | Firebase yapılandırma bilgileri  |
| `GROQ_API_KEY`             | Groq AI API anahtarı             |
| `NEXT_PUBLIC_CLOUDINARY_*` | Cloudinary resim yükleme servisi |

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request oluşturun

---

<p align="center">
  Made with ❤️ by Puaniz Team
</p>
