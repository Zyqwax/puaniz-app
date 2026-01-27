import React from "react";
import Markdown from "react-markdown";
import { Calendar, Tag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import fs from "fs";
import path from "path";

async function getUpdates() {
  const updatesDir = path.join(process.cwd(), "src/content/updates");
  if (!fs.existsSync(updatesDir)) return [];
  const filenames = fs.readdirSync(updatesDir);

  const updates = filenames
    .filter((name) => name.endsWith(".md"))
    .map((filename) => {
      const filePath = path.join(updatesDir, filename);
      const fileContent = fs.readFileSync(filePath, "utf8");

      const match = fileContent.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+([\s\S]*)$/);

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
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <title>Yenilikler - Puanİz</title>
      <meta name="description" content="Puanİz platformuna eklenen son özellikler ve güncellemeler." />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
              <span>Geri Dön</span>
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Tag className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-bold text-white">Yenilikler</h1>
            </div>
            <p className="text-slate-400 text-lg">Uygulamamızdaki son gelişmeler ve güncellemeler.</p>
          </div>
        </div>

        {/* Updates List */}
        <div className="space-y-8">
          {updates.length > 0 ? (
            updates.map((update, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 hover:bg-slate-800/80 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-6">
                  <h2 className="text-2xl font-bold text-white">{update.title}</h2>
                  <div className="flex items-center gap-2 text-purple-400 bg-purple-500/10 px-4 py-2 rounded-full w-fit">
                    <Calendar size={18} />
                    <span className="font-medium">{update.date}</span>
                  </div>
                </div>

                <div className="prose prose-invert prose-lg max-w-none prose-p:text-slate-300 prose-headings:text-white prose-a:text-purple-400 hover:prose-a:text-purple-300 prose-strong:text-white prose-ul:text-slate-300 prose-li:text-slate-300">
                  <Markdown>{update.content}</Markdown>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500">Henüz bir güncelleme notu bulunmuyor.</div>
          )}
        </div>
      </div>
    </div>
  );
}
