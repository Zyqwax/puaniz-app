"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
export default function LearningReportError({reset}:{reset:()=>void}) {
 const pathname=usePathname();
 return <div className="p-6 space-y-4"><p role="alert">Veriler yüklenemedi. Filtreleri ve erişim yetkilerinizi kontrol edin.</p><div className="flex gap-4"><Link href={pathname}>Filtreleri sıfırla</Link><button onClick={reset} className="rounded-lg px-4 py-2 bg-[var(--brand)] text-white">Yeniden dene</button></div></div>;
}
