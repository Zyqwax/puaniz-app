"use client";
export default function Error({reset}:{reset:()=>void}){return <div className="p-6"><p role="alert">Çalışma planı yüklenemedi.</p><button onClick={reset} className="student-button">Yeniden dene</button></div>;}
