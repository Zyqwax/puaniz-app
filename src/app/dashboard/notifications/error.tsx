"use client";
export default function Error({reset}:{reset:()=>void}){return <div className="p-6 space-y-4"><p role="alert">Bildirimler yüklenemedi.</p><button onClick={reset} className="px-4 py-2 rounded-lg bg-[var(--brand)] text-white">Yeniden dene</button></div>;}
