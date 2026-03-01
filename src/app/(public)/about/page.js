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
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Heart,
    title: "Ücretsiz ve Açık",
    description:
      "Eğitimin herkes için erişilebilir olması gerektiğine inanıyoruz. Puaniz tamamen ücretsizdir.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Lightbulb,
    title: "Veri Odaklı",
    description:
      "Sezgiler yerine verilere dayalı kararlar almanız için sınav sonuçlarınızı profesyonelce analiz ediyoruz.",
    gradient: "from-amber-500 to-orange-500",
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
    <div className="pt-28 sm:pt-36 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
            Puaniz Hakkında
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Puaniz, YKS hazırlık sürecini profesyonel analiz araçlarıyla
            yönetmenizi sağlayan ücretsiz bir platformdur. Öğrenciler tarafından
            geliştirilmiştir.
          </p>
        </div>

        {/* Mission */}
        <div className="relative p-8 sm:p-12 rounded-3xl bg-slate-800/40 border border-slate-700/50 mb-16 sm:mb-20 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Misyonumuz</h2>
          <p className="text-slate-400 leading-relaxed max-w-3xl">
            Her öğrencinin sınav hazırlık sürecinde veriye dayalı kararlar
            alabilmesini sağlamak. YKS sürecinde deneme sınavlarını takip etmek,
            güçlü ve zayıf yönleri analiz etmek ve doğru strateji geliştirmek
            çoğu zaman zor ve zaman alıcıdır. Puaniz, bu süreci kolaylaştırmak
            ve her öğrenciye eşit fırsat sunmak için geliştirilmiştir.
          </p>
        </div>

        {/* Values */}
        <div className="mb-16 sm:mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">
            Değerlerimiz
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mb-4`}
                >
                  <value.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Capabilities */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">
            Ne Sunuyoruz?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="flex items-start gap-4 p-5 rounded-xl bg-slate-800/30 border border-slate-700/30"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <cap.icon size={18} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {cap.title}
                  </h3>
                  <p className="text-sm text-slate-400">{cap.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
