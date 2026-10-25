import React from "react";
import Markdown from "react-markdown";
import { Calendar, Sparkles } from "lucide-react";
import fs from "fs";
import path from "path";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yenilikler",
  description: "Puanİz platformuna eklenen son özellikler ve güncellemeler.",
  keywords: ["güncellemeler", "yenilikler", "changelog", "yeni özellikler"],
};

interface UpdateItem {
  title?: string;
  date?: string;
  timestamp?: string;
  content: string;
  filename: string;
  [key: string]: any;
}

async function getUpdates(): Promise<UpdateItem[]> {
  const updatesDir = path.join(process.cwd(), "src/content/updates");
  if (!fs.existsSync(updatesDir)) return [];
  const filenames = fs.readdirSync(updatesDir);

  const updates: UpdateItem[] = filenames
    .filter((name) => name.endsWith(".md"))
    .map((filename) => {
      const filePath = path.join(updatesDir, filename);
      const fileContent = fs.readFileSync(filePath, "utf8");

      const match = fileContent.match(
        /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+([\s\S]*)$/
      );

      const data: Record<string, string> = {};
      let markdownContent = fileContent;

      if (match) {
        const frontMatter = match[1];
        markdownContent = match[2];

        frontMatter.split("\n").forEach((line) => {
          const [key, ...value] = line.split(":");
          if (key && value) {
            data[key.trim()] = value.join(":").trim().replace(/^"|"$/g, "");
          }
        });
      }

      return {
        ...data,
        content: markdownContent,
        filename,
      };
    });

  updates.sort((a, b) => {
    const dateA = a.timestamp ? new Date(a.timestamp).getTime() : a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.timestamp ? new Date(b.timestamp).getTime() : b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  return updates;
}

export default async function Changelog() {
  const updates = await getUpdates();

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-1 flex items-center gap-3">
          <Sparkles className="text-[var(--link)]" size={28} />
          Yenilikler
        </h1>
        <p className="text-[var(--text-muted)] text-sm">
          Son gelişmeler ve güncellemeler
        </p>
      </div>

      {/* Timeline */}
      {updates.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-[#2F6BFF]/40 via-[var(--border)] to-transparent" />

          <div className="space-y-10">
            {updates.map((update, index) => (
              <div key={index} className="relative pl-8">
                {/* Timeline dot */}
                <div
                  className={`absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 ${
                    index === 0
                      ? "bg-[#2F6BFF] border-[#7FB0FF] shadow-lg shadow-[#2F6BFF]/30"
                      : "bg-[var(--surface-2)] border-[var(--border)]"
                  }`}
                />

                {/* Date badge */}
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mb-2">
                  <Calendar size={11} />
                  <span>{update.date}</span>
                  {index === 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-[var(--link)] text-[10px] font-semibold uppercase tracking-wider">
                      Son
                    </span>
                  )}
                </div>

                {/* Card */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 md:p-5 shadow-xs">
                  {/* Title */}
                  <h2 className="text-base font-semibold text-[var(--text)] mb-2">
                    {update.title}
                  </h2>

                  {/* Content */}
                  <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed prose-p:text-[var(--text-muted)] prose-p:text-[13px] prose-p:leading-relaxed prose-p:mb-2 prose-headings:text-[var(--text)] prose-headings:text-xs prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5 prose-a:text-[var(--link)] prose-strong:text-[var(--text)] prose-ul:text-[var(--text-muted)] prose-ul:text-[13px] prose-li:text-[var(--text-muted)] prose-li:text-[13px] prose-li:marker:text-[var(--text-subtle)] prose-h2:text-sm prose-h2:text-[var(--text)] prose-h3:text-xs">
                    <Markdown>{update.content}</Markdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-[var(--text-muted)] text-sm">
            Henüz bir güncelleme notu bulunmuyor.
          </p>
        </div>
      )}
    </div>
  );
}
