"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calculator, ArrowRight, Sparkles, TrendingUp } from "lucide-react";

export default function LandingNetCalculator() {
  const [turkce, setTurkce] = useState(30);
  const [sosyal, setSosyal] = useState(14);
  const [matematik, setMatematik] = useState(26);
  const [fen, setFen] = useState(12);

  const [aytMat, setAytMat] = useState(24);
  const [aytFen, setAytFen] = useState(20);

  const totalTytNet = Number((turkce + sosyal + matematik + fen).toFixed(2));
  const totalAytNet = Number((aytMat + aytFen).toFixed(2));

  // Approximate YKS formula (ÖSYM base score ~100 + TYT net * 3.3 + AYT net * 3.0)
  const approxTytPuan = Math.min(500, Math.round(100 + totalTytNet * 3.33));
  const approxSayPuan = Math.min(500, Math.round(100 + totalTytNet * 1.33 + totalAytNet * 3.0));

  let rankEstimate = "İlk 100.000 - 150.000";
  if (approxSayPuan >= 470) rankEstimate = "İlk 1.000 - 3.000";
  else if (approxSayPuan >= 440) rankEstimate = "İlk 5.000 - 12.000";
  else if (approxSayPuan >= 400) rankEstimate = "İlk 20.000 - 35.000";
  else if (approxSayPuan >= 360) rankEstimate = "İlk 50.000 - 75.000";

  return (
    <div className="p-6 sm:p-10 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2F6BFF]/10 text-[#2F6BFF] text-xs font-bold mb-2">
            <Calculator size={14} />
            <span>İnteraktif Net & Sıralama Simülatörü</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight">
            Netlerini Kaydır, Tahmini Sıralamanı Gör
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Kayıt olmadan önce Puaniz analiz algoritmasını canlı olarak deneyimleyin.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-xl bg-[var(--surface-2)] text-[var(--text)] self-start sm:self-auto">
          2026 Katsayıları İle
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Sliders Area */}
        <div className="lg:col-span-7 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            TYT Net Simülasyonu (Maks. 120 Soru)
          </h4>

          {/* Türkçe */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1">
              <span className="text-[var(--text)]">Türkçe (40 Soru)</span>
              <span className="text-[#2F6BFF] font-black">{turkce} Net</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={turkce}
              onChange={(e) => setTurkce(Number(e.target.value))}
              className="w-full accent-[#2F6BFF] cursor-pointer"
            />
          </div>

          {/* Temel Matematik */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1">
              <span className="text-[var(--text)]">Temel Matematik (40 Soru)</span>
              <span className="text-[#2F6BFF] font-black">{matematik} Net</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={matematik}
              onChange={(e) => setMatematik(Number(e.target.value))}
              className="w-full accent-[#2F6BFF] cursor-pointer"
            />
          </div>

          {/* Fen Bilimleri */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1">
              <span className="text-[var(--text)]">Fen Bilimleri (20 Soru)</span>
              <span className="text-[#2F6BFF] font-black">{fen} Net</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={fen}
              onChange={(e) => setFen(Number(e.target.value))}
              className="w-full accent-[#2F6BFF] cursor-pointer"
            />
          </div>

          {/* Sosyal Bilimler */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1">
              <span className="text-[var(--text)]">Sosyal Bilimler (20 Soru)</span>
              <span className="text-[#2F6BFF] font-black">{sosyal} Net</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={sosyal}
              onChange={(e) => setSosyal(Number(e.target.value))}
              className="w-full accent-[#2F6BFF] cursor-pointer"
            />
          </div>

          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] pt-3">
            AYT Net Simülasyonu (Maks. 80 Soru)
          </h4>

          {/* AYT Matematik */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1">
              <span className="text-[var(--text)]">AYT Matematik (40 Soru)</span>
              <span className="text-purple-600 dark:text-purple-400 font-black">{aytMat} Net</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={aytMat}
              onChange={(e) => setAytMat(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* AYT Fen */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1">
              <span className="text-[var(--text)]">AYT Fen / Edebiyat (40 Soru)</span>
              <span className="text-purple-600 dark:text-purple-400 font-black">{aytFen} Net</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={aytFen}
              onChange={(e) => setAytFen(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Live Result Score Card */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[var(--hero-to)] border border-white/10 text-white flex flex-col justify-between space-y-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#FFB020] text-xs font-bold mb-4">
              <Sparkles size={14} />
              <span>Canlı Simülasyon Sonucu</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-white/70 block mb-1">Toplam TYT</span>
                <span className="text-2xl font-black text-white">{totalTytNet} Net</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-white/70 block mb-1">Toplam AYT</span>
                <span className="text-2xl font-black text-[#FFB020]">{totalAytNet} Net</span>
              </div>
            </div>

            <div className="space-y-3 border-t border-white/10 pt-4">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-white/80">Tahmini SAY/EA Puanı:</span>
                <span className="text-xl font-black text-white">{approxSayPuan}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-white/80">Tahmini Başarı Sırası:</span>
                <span className="text-sm font-black text-emerald-400">{rankEstimate}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <p className="text-xs text-white/70 leading-relaxed">
              Bu sonuçlar genel YKS katsayılarına göre hesaplanmıştır. Puaniz&apos;e kaydolarak ders ders konu analizlerinizi ve zayıf noktalarınızı görün.
            </p>
            <Link
              href="/auth"
              className="w-full py-3 rounded-xl bg-[#2F6BFF] hover:bg-[#4A80FF] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <span>Ücretsiz Başla ve Denemelerini Kaydet</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
