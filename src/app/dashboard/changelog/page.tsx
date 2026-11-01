import React from "react";
import Markdown, { type Components } from "react-markdown";
import {
  CalendarDays,
  Sparkles,
  Layers,
  Wrench,
  CheckCircle2,
  Tag,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import fs from "fs";
import path from "path";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yenilikler & Güncellemeler | Puanİz",
  description: "Puanİz platformuna eklenen son özellikler, iyileştirmeler ve sürüm notları.",
  keywords: ["güncellemeler", "yenilikler", "changelog", "yeni özellikler", "sürüm notları"],
};

interface UpdateItem {
  title?: string;
  date?: string;
  timestamp?: string;
  content: string;
  filename: string;
  version?: string;
}

function parseFile(filename: string, fileContent: string): UpdateItem {
  const match = fileContent.match(
    /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+([\s\S]*)$/
  );
  const data: Record<string, string> = {};
  let content = fileContent;

  if (match) {
    content = match[2];
    match[1].split("\n").forEach((line) => {
      const [key, ...value] = line.split(":");
      if (key && value.length) {
        data[key.trim()] = value.join(":").trim().replace(/^"|"$/g, "");
      }
    });
  }

  // Sürüm numarasını başlık veya dosya adından çıkar (örn: v1.5, v2.0)
  const fullText = `${data.title || ""} ${filename}`;
  const vMatch = fullText.match(/\bv?(\d+\.\d+[\w-]*)\b/i);
  const version = vMatch ? (vMatch[0].startsWith("v") || vMatch[0].startsWith("V") ? vMatch[0] : `v${vMatch[0]}`) : undefined;

  return { ...data, content, filename, version };
}

const time = (u: UpdateItem) => {
  const t = new Date(u.timestamp || u.date || "").getTime();
  return Number.isNaN(t) ? 0 : t;
};

async function getUpdates(): Promise<UpdateItem[]> {
  const dir = path.join(process.cwd(), "src/content/updates");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => n.endsWith(".md"))
    .map((n) => parseFile(n, fs.readFileSync(path.join(dir, n), "utf8")))
    .sort((a, b) => time(b) - time(a));
}

const textOf = (children: React.ReactNode): string =>
  React.Children.toArray(children)
    .map((c) => (typeof c === "string" ? c : ""))
    .join("");

// Bölüm başlıkları için belirteç ikonu ve renk stili
function getSectionBadge(raw: string) {
  const t = raw.toLocaleLowerCase("tr");
  if (/(özellik|neler yeni|büyük|devrim|yeni)/.test(t)) {
    return {
      bg: "bg-[var(--ok-bg)] text-[var(--ok)] border-[var(--ok)]/20",
      icon: <Sparkles size={13} className="shrink-0" />,
      label: "Yeni Özellik",
    };
  }
  if (/(hata|düzelt|fix|bug)/.test(t)) {
    return {
      bg: "bg-[var(--err-bg)] text-[var(--err)] border-[var(--err)]/20",
      icon: <Wrench size={13} className="shrink-0" />,
      label: "Düzeltme",
    };
  }
  if (/(iyileştir|performans|tasarım|deneyim|ui|ux)/.test(t)) {
    return {
      bg: "bg-[var(--brand-soft)] text-[var(--link)] border-[var(--link)]/20",
      icon: <Layers size={13} className="shrink-0" />,
      label: "İyileştirme",
    };
  }
  return {
    bg: "bg-[var(--surface-3)] text-[var(--text)] border-[var(--border)]",
    icon: <Tag size={13} className="shrink-0" />,
    label: "Detay",
  };
}

const mdComponents: Components = {
  h2: ({ children }) => {
    const raw = textOf(children);
    const badge = getSectionBadge(raw);
    return (
      <div className="mt-8 mb-4 pt-4 first:mt-2 first:pt-0 border-t border-[var(--border)]/60 first:border-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}
          >
            {badge.icon}
            {badge.label}
          </span>
        </div>
        <h3 className="text-base font-bold text-[var(--text)] tracking-tight">
          {children}
        </h3>
      </div>
    );
  },
  h3: ({ children }) => (
    <h4 className="text-sm font-semibold text-[var(--text)] mt-4 mb-2 flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--link)]" />
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-[13.5px] leading-relaxed text-[var(--text-muted)] mb-3 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="space-y-2.5 mb-4 last:mb-0 pl-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-2 mb-4 last:mb-0 list-decimal pl-5 marker:text-[var(--text-subtle)] text-[13.5px] text-[var(--text-muted)]">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-[var(--text-muted)] [ol_&]:block">
      <CheckCircle2
        size={16}
        className="mt-0.5 shrink-0 text-[var(--link)] [ol_&]:hidden"
        aria-hidden
      />
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--text)]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-xs text-[var(--text-subtle)] italic block mt-3 border-l-2 border-[var(--border-strong)] pl-3">
      {children}
    </em>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      className="font-medium text-[var(--link)] underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-0.5"
    >
      <span>{children}</span>
      {href?.startsWith("http") && <ArrowUpRight size={12} />}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-[var(--surface-3)] px-1.5 py-0.5 text-[12px] font-mono text-[var(--text)] border border-[var(--border)]">
      {children}
    </code>
  ),
  hr: () => <hr className="my-6 border-[var(--border)]" />,
};

export default async function Changelog() {
  const updates = await getUpdates();

  return (
    <div className="w-full max-w-none pb-24">
      {/* Zaman Çizelgesi */}
      {updates.length > 0 ? (
        <div className="relative">
          {/* Dikey çizgi */}
          <div
            aria-hidden
            className="absolute left-3.5 sm:left-[148px] top-6 bottom-6 w-[2px] bg-[var(--border)]"
          />

          <ol className="space-y-8 sm:space-y-12">
            {updates.map((u, i) => {
              const latest = i === 0;

              return (
            <li
                  key={u.filename}
              className="relative grid grid-cols-1 items-start gap-3 pl-9 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-7 sm:pl-0"
                >
                  {/* Timeline Noktası */}
                  <div
                    aria-hidden
                    className={`absolute left-1 top-4 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-transform duration-200 sm:left-[140px] ${
                      latest
                        ? "border-[var(--link)] bg-[var(--surface)] shadow-[0_0_0_4px_var(--brand-soft)]"
                        : "border-[var(--border-strong)] bg-[var(--surface)]"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        latest ? "bg-[var(--link)]" : "bg-[var(--text-subtle)]"
                      }`}
                    />
                  </div>

                  {/* Sol Sütun: Tarih & Versiyon Bilgisi */}
                  <div className="sm:text-right sm:pt-3.5">
                  <div className="flex flex-wrap items-center gap-2 sm:sticky sm:top-24 sm:flex-col sm:items-end sm:pt-4">
                      <time
                        dateTime={u.timestamp || u.date}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]"
                      >
                        <CalendarDays size={13} className="text-[var(--text-subtle)]" />
                        <span>{u.date}</span>
                      </time>
                    </div>
                  </div>

                  {/* Sürüm kartı: eski notlar kapalı başlar, en yenisi açıktır. */}
                  <details
                    open={latest}
                    className={`group overflow-hidden rounded-2xl border bg-[var(--surface)] transition-all duration-200 hover:shadow-md sm:rounded-3xl ${
                      latest
                        ? "border-[var(--link)]/40 shadow-sm ring-1 ring-[var(--link)]/20"
                        : "border-[var(--border)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {u.version && <span className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--text)]">{u.version}</span>}
                          {latest && <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--accent-text)]"><Sparkles size={11} /> Son sürüm</span>}
                          <span className="text-[11px] text-[var(--text-subtle)]">{(u.content.match(/^##\s+/gm) || []).length} başlık</span>
                        </div>
                        <h2 className="truncate text-base font-bold leading-snug tracking-tight text-[var(--text)] sm:text-lg">{u.title || `Güncelleme · ${u.date}`}</h2>
                        <p className="mt-1 text-xs text-[var(--text-muted)] sm:hidden">{u.date}</p>
                      </div>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] transition group-open:rotate-180 group-open:border-[var(--link)]/30 group-open:text-[var(--link)]`}><ChevronDown size={17} /></span>
                    </summary>
                    <div className="border-t border-[var(--border)] px-4 py-5 sm:px-7 sm:py-7">
                      <div className="changelog-markdown">
                        <Markdown components={mdComponents}>{u.content}</Markdown>
                      </div>
                    </div>
                  </details>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] py-20 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-3)] text-[var(--text-subtle)]">
            <Sparkles size={28} />
          </div>
          <h3 className="text-base font-semibold text-[var(--text)]">Henüz bir güncelleme notu yok</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)] max-w-sm mx-auto">
            Yeni özellikler ve iyileştirmeler yayınlandığında burada listelenecektir.
          </p>
        </div>
      )}
    </div>
  );
}
