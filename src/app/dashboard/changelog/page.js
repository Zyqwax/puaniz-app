import React from "react";
import Markdown from "react-markdown";
import { Calendar, Sparkles } from "lucide-react";
import fs from "fs";
import path from "path";

export const metadata = {
  title: "Yenilikler",
  description: "Puanİz platformuna eklenen son özellikler ve güncellemeler.",
  keywords: ["güncellemeler", "yenilikler", "changelog", "yeni özellikler"],
};

async function getUpdates() {
  const updatesDir = path.join(process.cwd(), "src/content/updates");
  if (!fs.existsSync(updatesDir)) return [];
  const filenames = fs.readdirSync(updatesDir);

  const updates = filenames
    .filter((name) => name.endsWith(".md"))
    .map((filename) => {
      const filePath = path.join(updatesDir, filename);
      const fileContent = fs.readFileSync(filePath, "utf8");

      const match = fileContent.match(
        /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+([\s\S]*)$/,
      );

      let data = {};
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
    const dateA = a.timestamp ? new Date(a.timestamp) : new Date(a.date);
    const dateB = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
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
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <Sparkles className="text-purple-400" size={28} />
          Yenilikler
        </h1>
        <p className="text-slate-400 text-sm">
          Son gelişmeler ve güncellemeler
        </p>
      </div>

      {/* Timeline */}
      {updates.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-purple-500/40 via-white/10 to-transparent" />

          <div className="space-y-10">
            {updates.map((update, index) => (
              <div key={index} className="relative pl-8">
                {/* Timeline dot */}
                <div
                  className={`absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 ${
                    index === 0
                      ? "bg-purple-500 border-purple-400 shadow-lg shadow-purple-500/30"
                      : "bg-slate-800 border-slate-600"
                  }`}
                />

                {/* Date badge */}
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                  <Calendar size={11} />
                  <span>{update.date}</span>
                  {index === 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 text-[10px] font-semibold uppercase tracking-wider">
                      Son
                    </span>
                  )}
                </div>

                {/* Card */}
                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4 md:p-5">
                  {/* Title */}
                  <h2 className="text-base font-semibold text-white mb-2">
                    {update.title}
                  </h2>

                  {/* Content */}
                  <div className="prose prose-sm prose-invert max-w-none text-[13px] leading-relaxed prose-p:text-slate-400 prose-p:text-[13px] prose-p:leading-relaxed prose-p:mb-2 prose-headings:text-slate-200 prose-headings:text-xs prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5 prose-a:text-purple-400 prose-strong:text-slate-300 prose-ul:text-slate-400 prose-ul:text-[13px] prose-li:text-slate-400 prose-li:text-[13px] prose-li:marker:text-slate-600 prose-h2:text-sm prose-h2:text-white prose-h3:text-xs">
                    <Markdown>{update.content}</Markdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm">
            Henüz bir güncelleme notu bulunmuyor.
          </p>
        </div>
      )}
    </div>
  );
}
