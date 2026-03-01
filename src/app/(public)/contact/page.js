import { Mail, Building2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "İletişim | Puaniz",
  description:
    "Puaniz ile iletişime geçin. Okullar, kurumlar ve iş birlikleri için bizimle iletişime geçebilirsiniz.",
  openGraph: {
    title: "İletişim | Puaniz",
    description:
      "Puaniz ile iletişime geçin. Okullar ve kurumlar için iş birliği fırsatları.",
    url: "https://www.puaniz.com.tr/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="pt-28 sm:pt-36 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
            İletişim
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Bir okulun veya kurumun temsilcisi misiniz? Birlikte çalışmak için
            bizimle iletişime geçin.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-5">
              <Building2 size={22} className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Okullar İçin
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Okulunuzdaki öğrencilerin gelişimini takip etmek, deneme
              sonuçlarını toplu analiz etmek ve kurumsal dashboard erişimi için
              bizimle iletişime geçin.
            </p>
            <span className="inline-flex items-center gap-1 text-sm text-purple-400 font-medium">
              Yakında
              <ArrowRight size={14} />
            </span>
          </div>

          <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-all">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-5">
              <Mail size={22} className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Genel İletişim
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Geri bildirim, öneriler veya sorularınız için bize
              ulaşabilirsiniz. Her türlü geri bildirimi memnuniyetle
              karşılıyoruz.
            </p>
            <a
              href="mailto:iletisim@puaniz.com.tr"
              className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              iletisim@puaniz.com.tr
              <ArrowRight size={14} />
            </a>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-900/20 to-pink-900/10 border border-purple-500/10">
          <p className="text-slate-400 text-sm">
            🚧 İletişim formu yakında aktif olacaktır. Şimdilik yukarıdaki
            e-posta adresi üzerinden ulaşabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
