"use client";
export default function Error({reset}:{reset:()=>void}){return <div className="p-6 space-y-4"><p role="alert">Gelişim verileri yüklenemedi. Okul ve sınıf yetkilerini kontrol ederek yeniden dene.</p><button onClick={reset} className="rounded-lg bg-[var(--brand)] text-white px-4 py-2">Yeniden dene</button></div>;}
