import {
  Target,
  Heart,
  Lightbulb,
  GraduationCap,
  BarChart3,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Hakkında | Puaniz",
  description:
    "Puaniz, YKS hazırlık sürecini veriye dayalı analizlerle yönetmeyi hedefleyen ücretsiz bir platformdur. Öğrenciler tarafından, öğrenciler için.",
  openGraph: {
    title: "Hakkında | Puaniz",
    description:
      "YKS hazırlık sürecini veriye dayalı analizlerle yönetmeyi hedefleyen ücretsiz platform.",
    url: "https://www.puaniz.com.tr/about",
  },
};

const values = [
  {
    icon: Target,
    title: "Hedefe Odaklı",
    description:
      "Her öğrencinin kendi hedeflerine ulaşması için kişiselleştirilmiş analiz ve takip araçları sunuyoruz.",
    iconBg: "bg-[#2F6BFF]",
    iconColor: "text-white",
  },
  {
    icon: Heart,
    title: "Ücretsiz ve Açık",
    description:
      "Eğitimin herkes için erişilebilir olması gerektiğine inanıyoruz. Puaniz tamamen ücretsizdir.",
    iconBg: "bg-[#FFB020]",
    iconColor: "text-[#0F2A5C]",
  },
  {
    icon: Lightbulb,
    title: "Veri Odaklı",
    description:
      "Sezgiler yerine verilere dayalı kararlar almanız için sınav sonuçlarınızı profesyonelce analiz ediyoruz.",
    iconBg: "bg-[#0F2A5C]",
    iconColor: "text-white",
  },
];

const capabilities = [
  {
    icon: BarChart3,
    title: "Deneme Analizi",
    description: "Her TYT ve AYT denemenizi detaylı ders bazında analiz edin.",
  },
  {
    icon: GraduationCap,
    title: "Net Takibi",
    description:
      "Net grafiklerinizle gelişiminizi gözle görülür şekilde izleyin.",
  },
  {
    icon: Users,
    title: "Soru-Cevap Topluluğu",
    description: "Diğer öğrencilerle bilgi paylaşın ve birlikte öğrenin.",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-28 sm:pt-36 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F2A5C] mb-6 tracking-tight">
            Puaniz <span className="text-[#2F6BFF] underline decoration-[#FFB020] decoration-wavy underline-offset-8">Hakkında</span>
          </h1>
          <p className="text-lg text-[#4A5B7A] max-w-2xl mx-auto leading-relaxed">
            Puaniz, YKS hazırlık sürecini profesyonel analiz araçlarıyla
            yönetmenizi sağlayan ücretsiz bir platformdur. Öğrenciler tarafından
            geliştirilmiştir.
          </p>
        </div>

        {/* Mission */}
        <div className="relative p-8 sm:p-14 rounded-3xl bg-[#0F2A5C] text-white mb-20 overflow-hidden shadow-xl">
          {/* Subtle stylized background bars representing growth */}
          <div className="absolute right-8 bottom-0 flex items-end gap-3 opacity-20 pointer-events-none">
            <div className="w-8 h-24 bg-white rounded-t-xl" />
            <div className="w-8 h-36 bg-white rounded-t-xl" />
            <div className="w-8 h-56 bg-white rounded-t-xl" />
            <div className="w-8 h-80 bg-white rounded-t-xl" />
          </div>

          <div className="relative z-10 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-6">Misyonumuz</h2>
            <p className="text-white/85 text-base sm:text-lg leading-relaxed mb-4">
              Her öğrencinin sınav hazırlık sürecinde veriye dayalı kararlar
              alabilmesini sağlamak. YKS sürecinde deneme sınavlarını takip etmek,
              güçlü ve zayıf yönleri analiz etmek ve doğru strateji geliştirmek
              çoğu zaman zor ve zaman alıcıdır. Puaniz, bu süreci kolaylaştırmak
              ve her öğrenciye eşit fırsat sunmak için geliştirilmiştir.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl sm:text-4xl font-black text-[#0F2A5C] text-center mb-12">
            Değerlerimiz
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="p-8 rounded-3xl bg-white border border-[#0F2A5C]/[0.08] shadow-sm hover:shadow-md transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${value.iconBg} ${value.iconColor} flex items-center justify-center mb-6 shadow-sm`}
                >
                  <value.icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-[#0F2A5C] mb-3">
                  {value.title}
                </h3>
                <p className="text-sm text-[#4A5B7A] leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Capabilities */}
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0F2A5C] text-center mb-12">
            Ne Sunuyoruz?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="flex items-center gap-4 p-6 rounded-2xl bg-white border border-[#0F2A5C]/[0.08] shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#F4F7FC] text-[#2F6BFF] flex items-center justify-center shrink-0">
                  <cap.icon size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F2A5C] mb-1">
                    {cap.title}
                  </h3>
                  <p className="text-xs text-[#4A5B7A]">{cap.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
