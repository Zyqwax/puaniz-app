"use client";

import React, { useEffect, useState } from "react";
import {
  getContactMessages,
  updateContactMessageStatus,
} from "@/server/actions/contact";
import { CONTACT_TYPE_LABELS, type ContactMessageItem } from "@/lib/contact";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Inbox,
  Mail,
  Building2,
  Bug,
  Lightbulb,
  MessageSquare,
  MailOpen,
  Archive,
  Reply,
  ShieldCheck,
  Loader2,
} from "lucide-react";

const TYPE_ICON: Record<string, typeof Mail> = {
  general: MessageSquare,
  school: Building2,
  bug: Bug,
  suggestion: Lightbulb,
};

const STATUS_LABEL: Record<string, string> = {
  new: "Yeni",
  read: "Okundu",
  replied: "Yanıtlandı",
  archived: "Arşiv",
};

const STATUS_STYLE: Record<string, string> = {
  new: "bg-[var(--brand-soft)] text-[var(--link)]",
  read: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  replied: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  archived: "bg-[var(--surface-3)] text-[var(--text-subtle)]",
};

type Filter = "all" | "new" | "school" | "bug" | "suggestion";

export default function MessagesClient() {
  const { userProfile, loading } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<ContactMessageItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isSuperAdmin = Boolean(userProfile?.isSuperAdmin);

  const load = async () => {
    setFetching(true);
    try {
      setMessages(await getContactMessages());
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin]);

  const setStatus = async (id: string, status: "new" | "read" | "replied" | "archived") => {
    setBusyId(id);
    await updateContactMessageStatus(id, status);
    setBusyId(null);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    if (selected?.id === id) setSelected({ ...selected, status });
    showToast(`Durum "${STATUS_LABEL[status]}" olarak güncellendi.`, "success");
  };

  const openMessage = async (m: ContactMessageItem) => {
    setSelected(m);
    if (m.status === "new") await setStatus(m.id, "read");
  };

  const visible = messages.filter((m) => {
    if (filter === "all") return true;
    if (filter === "new") return m.status === "new";
    return m.type === filter;
  });

  const counts = {
    new: messages.filter((m) => m.status === "new").length,
    school: messages.filter((m) => m.type === "school").length,
    bug: messages.filter((m) => m.type === "bug").length,
    suggestion: messages.filter((m) => m.type === "suggestion").length,
  };

  if (loading) return <div className="p-8 text-center text-[var(--text-subtle)]">Yükleniyor...</div>;

  if (!isSuperAdmin) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-4">
        <ShieldCheck className="mx-auto text-amber-500" size={48} />
        <h2 className="text-xl font-bold text-[var(--text)]">Yetkisiz Erişim</h2>
        <p className="text-sm text-[var(--text-subtle)]">
          İletişim mesajları yalnızca Sistem Yöneticisi tarafından görüntülenebilir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex justify-end">
        {counts.new > 0 && (
          <span className="self-start px-3 py-1.5 rounded-xl bg-[var(--brand)] text-white text-xs font-bold">
            {counts.new} yeni mesaj
          </span>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["all", `Tümü (${messages.length})`],
            ["new", `Yeni (${counts.new})`],
            ["school", `Kurumsal (${counts.school})`],
            ["bug", `Hata (${counts.bug})`],
            ["suggestion", `Öneri (${counts.suggestion})`],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              filter === key
                ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-strong)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {fetching ? (
        <div className="p-12 text-center text-sm text-[var(--text-subtle)] flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Mesajlar yükleniyor...
        </div>
      ) : visible.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <Inbox className="mx-auto text-[var(--text-subtle)]" size={36} />
          <p className="text-sm text-[var(--text-subtle)]">Bu filtrede mesaj bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* List */}
          <div className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {visible.map((m) => {
              const Icon = TYPE_ICON[m.type] ?? Mail;
              return (
                <button
                  key={m.id}
                  onClick={() => openMessage(m)}
                  className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer ${
                    selected?.id === m.id
                      ? "bg-[var(--surface-2)] border-[var(--brand)]"
                      : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--link)]">
                      <Icon size={13} />
                      {CONTACT_TYPE_LABELS[m.type as keyof typeof CONTACT_TYPE_LABELS] ?? m.type}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLE[m.status]}`}>
                      {STATUS_LABEL[m.status] ?? m.status}
                    </span>
                  </div>
                  <span className="block text-xs font-bold text-[var(--text)] truncate">{m.subject}</span>
                  <span className="block text-[11px] text-[var(--text-subtle)] truncate mt-0.5">
                    {m.name}
                    {m.organization ? ` · ${m.organization}` : ""}
                  </span>
                  <span className="block text-[10px] text-[var(--text-subtle)] mt-1 tabular-nums">
                    {new Date(m.createdAt).toLocaleString("tr-TR")}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div className="lg:col-span-3">
            {!selected ? (
              <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-subtle)]">
                Görüntülemek için soldan bir mesaj seçin.
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-5">
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text)]">{selected.subject}</h2>
                    <p className="text-xs text-[var(--text-subtle)] mt-1">
                      {selected.name} ·{" "}
                      <a href={`mailto:${selected.email}`} className="text-[var(--link)] hover:underline">
                        {selected.email}
                      </a>
                      {selected.phone ? ` · ${selected.phone}` : ""}
                    </p>
                    {selected.organization && (
                      <p className="text-xs text-[var(--text-subtle)] mt-0.5">
                        Kurum: <strong className="text-[var(--text)]">{selected.organization}</strong>
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-bold ${STATUS_STYLE[selected.status]}`}>
                    {STATUS_LABEL[selected.status]}
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-[var(--text)] whitespace-pre-wrap">
                  {selected.message}
                </p>

                <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(
                      `Re: ${selected.subject}`,
                    )}`}
                    onClick={() => setStatus(selected.id, "replied")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-bold hover:opacity-90 transition"
                  >
                    <Reply size={14} /> E-posta ile yanıtla
                  </a>
                  {selected.status !== "read" && (
                    <button
                      onClick={() => setStatus(selected.id, "read")}
                      disabled={busyId === selected.id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-3)] transition cursor-pointer"
                    >
                      <MailOpen size={14} /> Okundu işaretle
                    </button>
                  )}
                  {selected.status !== "archived" && (
                    <button
                      onClick={() => setStatus(selected.id, "archived")}
                      disabled={busyId === selected.id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-3)] transition cursor-pointer"
                    >
                      <Archive size={14} /> Arşivle
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
