"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useDashboardHeaderActionsTarget } from "@/components/dashboard/DashboardHeaderActionsContext";
import { getUserExams } from "@/server/actions/exam";
import { chatWithAI } from "@/server/actions/ai";
import {
  Plus,
  Trash2,
  Sparkle,
  ChevronDown,
  Clock,
  BarChart2,
  Calendar,
  Target,
  TrendingUp,
  Heart,
  PanelLeft,
  SquarePen,
  Upload,
  Search,
  Mic,
  MicOff,
  ArrowUp,
  Copy,
  Check,
  Paperclip,
  CircleCheck,
  type LucideIcon,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/types";

interface AssistantMode {
  id: string;
  title: string;
  desc: string;
}

const ASSISTANT_MODES: AssistantMode[] = [
  { id: "AI Koç", title: "AI Koç", desc: "Stratejik planlama ve sınav rehberliği" },
  { id: "Soru Çözücü", title: "Soru Çözücü", desc: "Adım adım soru çözüm ve problem analizi" },
  { id: "Konu Anlatıcı", title: "Konu Anlatıcı", desc: "Kavramsal özetler ve püf noktaları" },
];

interface QuickAction {
  label: string;
  icon: LucideIcon;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Deneme analizi",
    icon: BarChart2,
    prompt:
      "Son denemelerimi detaylı analiz et. Hangi derslerde iyi gidiyorum, hangilerinde düşüş var? Net ortalamalarıma göre öncelikli çalışmam gereken konuları sırala ve her biri için somut bir strateji öner.",
  },
  {
    label: "Haftalık plan",
    icon: Calendar,
    prompt:
      "Deneme sonuçlarıma göre bana 7 günlük detaylı bir çalışma planı oluştur. Zayıf derslere daha fazla zaman ayır, güçlü derslere tekrar süresi ver. Tabloyu gün gün yaz.",
  },
  {
    label: "Zayıf konularım",
    icon: Target,
    prompt:
      "Denemelerime bakarak en çok hata yaptığım dersleri ve konuları listele. Her ders için öncelikli konu başlıklarını ve nasıl çalışmam gerektiğini (yöntem, kaynak) kısaca öner.",
  },
  {
    label: "Sınav stratejisi",
    icon: Clock,
    prompt:
      "YKS sınavında en verimli çözüm sırasını ve zaman yönetimini anlat. TYT ve AYT için ayrı ayrı: Hangi sorudan başlamalıyım? Hangi bölüme ne kadar süre? Atlama stratejisi nasıl olmalı?",
  },
  {
    label: "Hedef net hesapla",
    icon: TrendingUp,
    prompt:
      "Mevcut deneme ortalamalarıma göre tahmini YKS sıralamam ne olur? İstediğim bölüme girebilmem için TYT ve AYT'de kaç net yapmam gerekiyor? Her ders için hedef netleri belirle.",
  },
  {
    label: "Motivasyon",
    icon: Heart,
    prompt:
      "Sınava hazırlanırken motivasyonum düşüyor ve stres hissediyorum. Bana moral ver, verimli çalışmak için pratik öneriler sun ve sınav kaygısıyla başa çıkmam için somut teknikler yaz.",
  },
];

const EXAM_TARGETS = ["TYT", "AYT", "Genel", "YDT"];

interface Conversation {
  id: string;
  title: string;
  date: string;
  messages: ChatMessage[];
}

export default function AssistantClient() {
  const headerActionsTarget = useDashboardHeaderActionsTarget();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [examContext, setExamContext] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Assistant settings
  const [currentMode, setCurrentMode] = useState("AI Koç");
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [examTarget, setExamTarget] = useState("TYT");
  const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);
  const [isDeepThinking, setIsDeepThinking] = useState(false);
  const [isExamContextAttached, setIsExamContextAttached] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

  // Voice recording state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<unknown>(null);

  // Copied state
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [shareFeedback, setShareFeedback] = useState(false);

  // Typewriter streaming state
  const [streamingText, setStreamingText] = useState("");
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const streamingRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const startNewChat = useCallback(() => {
    const newChatId = uuidv4();
    setCurrentChatId(newChatId);
    setMessages([]);
  }, []);

  const loadChat = useCallback((chatId: string, currentList: Conversation[] = conversations) => {
    const chat = currentList.find((c) => c.id === chatId);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(chat.messages || []);
    }
  }, [conversations]);

  useEffect(() => {
    const storedHistory = localStorage.getItem("chatHistory");
    if (storedHistory) {
      try {
        const history: Conversation[] = JSON.parse(storedHistory);
        setConversations(history);
        if (history.length > 0) {
          loadChat(history[0].id, history);
        } else {
          startNewChat();
        }
      } catch {
        startNewChat();
      }
    } else {
      startNewChat();
    }

    const fetchContext = async () => {
      try {
        const exams = await getUserExams();
        if (exams && exams.length > 0) {
          const summary = exams
            .slice(0, 5)
            .map((e) => `${e.date} tarihli ${e.type} denemesi: ${e.totalNet} Net`)
            .join("\n");
          setExamContext(summary);
        }
      } catch (e) {
        console.error("Error fetching exams for assistant:", e);
      }
    };
    fetchContext();
  }, [loadChat, startNewChat]);

  const saveToLocalStorage = (updatedConversations: Conversation[]) => {
    localStorage.setItem("chatHistory", JSON.stringify(updatedConversations));
    setConversations(updatedConversations);
  };

  const deleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    const updated = conversations.filter((c) => c.id !== chatId);
    saveToLocalStorage(updated);
    if (chatId === currentChatId) {
      if (updated.length > 0) loadChat(updated[0].id, updated);
      else startNewChat();
    }
  };

  const updateCurrentChat = (newMessages: ChatMessage[]) => {
    let updatedConversations: Conversation[];
    const chatExists = conversations.some((c) => c.id === currentChatId);

    if (chatExists) {
      updatedConversations = conversations.map((c) => {
        if (c.id === currentChatId) {
          let title = c.title;
          if (title === "Yeni Sohbet" && newMessages.length > 0) {
            const firstUserMsg = newMessages.find((m) => m.role === "user");
            if (firstUserMsg) {
              title = firstUserMsg.content.slice(0, 36) + (firstUserMsg.content.length > 36 ? "..." : "");
            }
          }
          return { ...c, messages: newMessages, title, date: new Date().toISOString() };
        }
        return c;
      });
    } else {
      let title = "Yeni Sohbet";
      const firstUserMsg = newMessages.find((m) => m.role === "user");
      if (firstUserMsg) {
        title = firstUserMsg.content.slice(0, 36) + (firstUserMsg.content.length > 36 ? "..." : "");
      }

      const newConversation: Conversation = {
        id: currentChatId || uuidv4(),
        title,
        date: new Date().toISOString(),
        messages: newMessages,
      };
      updatedConversations = [newConversation, ...conversations];
    }

    updatedConversations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    saveToLocalStorage(updatedConversations);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const animateText = useCallback((fullText: string, onComplete: () => void) => {
    let i = 0;
    setStreamingText("");
    const id = setInterval(() => {
      i += 2;
      setStreamingText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(id);
        streamingRef.current = null;
        onComplete();
      }
    }, 12);
    streamingRef.current = id;
  }, []);

  useEffect(() => {
    return () => {
      if (streamingRef.current) clearInterval(streamingRef.current);
    };
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      deepThink: isDeepThinking,
      examTarget,
    };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    updateCurrentChat(updatedMessages);
    setInput("");
    setLoading(true);

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const activeContext = isExamContextAttached && examContext ? examContext : "";
      const responseContent = await chatWithAI(content, activeContext, {
        mode: currentMode,
        examTarget,
        deepThink: isDeepThinking,
      });

      const aiTimestamp = new Date().toISOString();
      const tempId = uuidv4();

      setLoading(false);
      setStreamingMsgId(tempId);

      animateText(responseContent, () => {
        const aiMessage: ChatMessage = {
          role: "assistant",
          content: responseContent,
          timestamp: aiTimestamp,
          deepThink: isDeepThinking,
        };
        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
        updateCurrentChat(finalMessages);
        setStreamingMsgId(null);
        setStreamingText("");
      });
    } catch {
      setLoading(false);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Bir hata oluştu. Lütfen tekrar deneyin.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleSend = (e?: FormEvent) => {
    if (e) e.preventDefault();
    sendMessage(input);
  };

  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const windowSpeech = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        continuous: boolean;
        onresult: (e: { results: Array<Array<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        continuous: boolean;
        onresult: (e: { results: Array<Array<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
    };

    const SpeechRecognition = windowSpeech.SpeechRecognition || windowSpeech.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tarayıcınız sesle yazmayı desteklemiyor.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current && typeof (recognitionRef.current as { stop?: () => void }).stop === "function") {
        (recognitionRef.current as { stop: () => void }).stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "tr-TR";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + " " + transcript : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    }
  };

  const handleCopy = (id: number, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const groupedConversations = useMemo(() => {
    const filtered = conversations.filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const pastWeek = new Date(today);
    pastWeek.setDate(pastWeek.getDate() - 7);

    const groups: Record<"today" | "yesterday" | "lastWeek" | "older", Conversation[]> = {
      today: [],
      yesterday: [],
      lastWeek: [],
      older: [],
    };

    filtered.forEach((chat) => {
      const chatDate = new Date(chat.date || now);
      if (chatDate >= today) {
        groups.today.push(chat);
      } else if (chatDate >= yesterday) {
        groups.yesterday.push(chat);
      } else if (chatDate >= pastWeek) {
        groups.lastWeek.push(chat);
      } else {
        groups.older.push(chat);
      }
    });

    return [
      { key: "today", title: "Bugün", items: groups.today },
      { key: "yesterday", title: "Dün", items: groups.yesterday },
      { key: "lastWeek", title: "Önceki 7 gün", items: groups.lastWeek },
      { key: "older", title: "Daha eski", items: groups.older },
    ].filter((g) => g.items.length > 0);
  }, [conversations, searchQuery]);

  const isEmptyChat = messages.length === 0;

  const headerActions = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-3">
        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsModeDropdownOpen((prev) => !prev)}
            aria-label="Asistan modu"
            aria-expanded={isModeDropdownOpen}
            className="flex items-center gap-1.5 text-left text-[var(--text)] hover:bg-[var(--surface-2)] px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer group"
          >
            <span className="text-xs md:text-sm text-[var(--text-muted)] font-medium">
              {currentMode}
            </span>
            <ChevronDown size={14} className="text-[var(--text-subtle)] group-hover:text-[var(--text)] transition-transform duration-200" />
          </button>

          {isModeDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsModeDropdownOpen(false)}
              />
              <div className="absolute left-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] sm:left-auto sm:right-0 bg-[var(--surface)] border border-[var(--border-strong)] rounded-2xl shadow-xl z-50 p-1.5 space-y-1">
                {ASSISTANT_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setCurrentMode(mode.id);
                      setIsModeDropdownOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                      currentMode === mode.id
                        ? "bg-[var(--brand-soft)] border border-[var(--border)]"
                        : "hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <div className="mt-0.5">
                      {currentMode === mode.id ? (
                        <CircleCheck size={16} className="text-[var(--brand)]" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[var(--border-strong)]" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text)]">{mode.title}</p>
                      <p className="text-[11px] text-[var(--text-muted)] leading-snug">{mode.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          aria-label={isSidebarOpen ? "Sohbet geçmişini gizle" : "Sohbet geçmişini aç"}
          aria-expanded={isSidebarOpen}
          className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] rounded-xl transition-colors cursor-pointer"
          title="Kenar çubuğu"
        >
          <PanelLeft size={18} />
        </button>
        <button
          onClick={startNewChat}
          aria-label="Yeni Sohbet"
          className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] rounded-xl transition-colors cursor-pointer"
          title="Yeni Sohbet"
        >
          <SquarePen size={18} />
        </button>
        <div className="relative">
          <button
            onClick={handleShare}
            aria-label="Sohbeti Paylaş"
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] rounded-xl transition-colors cursor-pointer"
            title="Sohbeti Paylaş"
          >
            <Upload size={18} />
          </button>
          {shareFeedback && (
            <div className="absolute right-0 top-full mt-1.5 px-3 py-1 bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] rounded-lg text-xs font-bold shadow-lg whitespace-nowrap z-50">
              Bağlantı Kopyalandı!
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {headerActionsTarget && createPortal(headerActions, headerActionsTarget)}
      <div className="flex h-full w-full relative bg-[var(--bg)] overflow-hidden font-sans">
        {/* ── Collapsible Left Sidebar ── */}
        <div
          className={`fixed md:relative inset-y-0 left-0 z-40 w-72 bg-[var(--surface)] border-r border-[var(--border)]
            flex flex-col h-full transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden"}`}
        >
          {/* Search Bar */}
          <div className="p-3 shrink-0 min-w-72">
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl focus-within:border-[var(--brand)] focus-within:ring-1 focus-within:ring-[var(--brand)]/20 transition-all">
              <button onClick={() => setIsSidebarOpen(false)} aria-label="Sohbet geçmişini kapat" className="shrink-0 text-[var(--text-muted)] md:hidden"><PanelLeft size={16} /></button>
              <Search size={15} className="text-[var(--text-subtle)] shrink-0" />
              <input
                type="text"
                placeholder="Sohbetlerde ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Temizle"
                  className="text-[var(--text-subtle)] hover:text-[var(--text)] cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Grouped Chat List */}
          <div className="flex-1 overflow-y-auto px-3 space-y-4 pb-6 min-w-72 scrollbar-thin">
            {groupedConversations.length === 0 ? (
              <p className="text-center text-xs text-[var(--text-subtle)] py-10 font-medium">
                {searchQuery ? "Eşleşen sohbet bulunamadı" : "Henüz sohbet yok"}
              </p>
            ) : (
              groupedConversations.map((group) => (
                <div key={group.key} className="space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-subtle)] px-2.5 uppercase tracking-wider block mb-1">
                    {group.title}
                  </span>
                  {group.items.map((chat) => {
                    const isActive = currentChatId === chat.id;
                    return (
                      <button
                        key={chat.id}
                        onClick={() => loadChat(chat.id)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer group relative ${
                          isActive
                            ? "bg-[var(--surface-2)] text-[var(--text)] font-bold border border-[var(--border-strong)]"
                            : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] border border-transparent"
                        }`}
                      >
                        <span className="truncate flex-1">{chat.title}</span>
                        <div
                          onClick={(e) => deleteChat(e, chat.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-subtle)] hover:text-[var(--err)] rounded-lg transition-all hover:bg-[var(--err-bg)] cursor-pointer shrink-0"
                          title="Sil"
                        >
                          <Trash2 size={13} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* ── Main Chat Area ── */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-[var(--bg)] relative">
          {/* ── Content View ── */}
          <div className="flex-1 overflow-y-auto flex flex-col justify-between">
            {isEmptyChat ? (
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-3xl mx-auto w-full">
                <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
                  <Sparkle size={20} className="text-[#FFB020] fill-[#FFB020]" />
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)] text-center tracking-tight mb-8">
                  Bugün neye çalışıyoruz?
                </h1>

                {/* Central Floating Capsule Input */}
                <div className="w-full bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-3xl p-4 shadow-sm focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]/20 transition-all mb-6">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="YKS hakkında bir şey sor..."
                    className="w-full bg-transparent text-sm md:text-base text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none resize-none min-h-[48px] max-h-40 leading-relaxed font-medium"
                    rows={1}
                  />

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/60 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsAttachMenuOpen((p) => !p)}
                          aria-label="Veri Ekle"
                          className={`w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center transition-colors cursor-pointer ${
                            isExamContextAttached
                              ? "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--brand)]/40"
                              : "bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]"
                          }`}
                          title="Veri Ekle"
                        >
                          <Plus size={15} />
                        </button>

                        {isAttachMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setIsAttachMenuOpen(false)}
                            />
                            <div className="absolute left-0 bottom-full mb-2 w-64 bg-[var(--surface)] border border-[var(--border-strong)] rounded-2xl shadow-xl z-50 p-2">
                              <button
                                onClick={() => {
                                  setIsExamContextAttached((prev) => !prev);
                                  setIsAttachMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-[var(--surface-2)] text-left text-xs font-semibold text-[var(--text)] transition-colors cursor-pointer"
                              >
                                <Paperclip size={14} className="text-[var(--brand)]" />
                                <span>
                                  {isExamContextAttached ? "Deneme Verilerini Çıkar" : "Son Deneme Sonuçlarımı Ekle"}
                                </span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsExamDropdownOpen((p) => !p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-3)] text-xs font-bold text-[var(--text)] transition-all cursor-pointer"
                        >
                          <span>{examTarget}</span>
                          <ChevronDown size={12} className="text-[var(--text-subtle)]" />
                        </button>

                        {isExamDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setIsExamDropdownOpen(false)}
                            />
                            <div className="absolute left-0 bottom-full mb-2 w-32 bg-[var(--surface)] border border-[var(--border-strong)] rounded-2xl shadow-xl z-50 p-1 space-y-0.5">
                              {EXAM_TARGETS.map((target) => (
                                <button
                                  key={target}
                                  onClick={() => {
                                    setExamTarget(target);
                                    setIsExamDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    examTarget === target
                                      ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                                      : "text-[var(--text)] hover:bg-[var(--surface-2)]"
                                  }`}
                                >
                                  {target}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsDeepThinking((prev) => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                          isDeepThinking
                            ? "bg-[#FFB020]/15 border-[#FFB020]/50 text-[#FFB020] shadow-xs"
                            : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]"
                        }`}
                      >
                        <Sparkle size={13} className={isDeepThinking ? "text-[#FFB020] fill-[#FFB020]" : "text-[#FFB020]"} />
                        <span>Derin düşün</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleVoiceInput}
                        aria-label={isListening ? "Dinlemeyi durdur" : "Sesle yaz"}
                        className={`p-2 rounded-full transition-colors cursor-pointer ${
                          isListening
                            ? "bg-red-500/15 text-red-500 animate-pulse"
                            : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
                        }`}
                        title={isListening ? "Dinlemeyi durdur" : "Sesle yaz"}
                      >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => sendMessage(input)}
                        disabled={loading || !input.trim()}
                        aria-label="Gönder"
                        className="w-9 h-9 rounded-full bg-[#2F6BFF] hover:bg-[#4A80FF] text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-[#2F6BFF] cursor-pointer shadow-sm"
                        title="Gönder"
                      >
                        <ArrowUp size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Action Pills Below the Input */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        onClick={() => sendMessage(action.prompt)}
                        disabled={loading}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--text)] text-xs md:text-sm font-medium transition-all cursor-pointer shadow-xs"
                      >
                        <Icon size={14} className="text-[var(--brand)]" />
                        <span>{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── Active Conversation Messages ── */
              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 max-w-4xl mx-auto w-full">
                {messages.map((msg, idx) => {
                  const isAssistant = msg.role === "assistant";
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 md:gap-4 ${isAssistant ? "justify-start" : "justify-end"}`}
                    >
                      {isAssistant && (
                        <div className="w-8 h-8 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-1 shadow-xs">
                          <Sparkle size={15} className="text-[#FFB020] fill-[#FFB020]" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] md:max-w-2xl rounded-2xl p-4 md:p-5 text-sm leading-relaxed transition-all relative group ${
                          isAssistant
                            ? "bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)]"
                            : "bg-[#2F6BFF] text-white font-medium shadow-sm"
                        }`}
                      >
                        {isAssistant && msg.deepThink && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFB020]/15 text-[#FFB020] text-[11px] font-bold border border-[#FFB020]/30 mb-3">
                            <Sparkle size={12} className="fill-[#FFB020]" />
                            <span>Derinlemesine analiz edildi</span>
                          </div>
                        )}

                        {isAssistant ? (
                          <div className="[&_p]:mb-2.5 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:font-bold [&_strong]:text-[var(--text)] [&_a]:text-[var(--link)] [&_code]:bg-[var(--surface-3)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded text-[var(--text)]">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}

                        {isAssistant && (
                          <div className="flex items-center justify-end gap-2 pt-2 mt-2 border-t border-[var(--border)]/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCopy(idx, msg.content)}
                              aria-label="Kopyala"
                              className="p-1 text-[var(--text-subtle)] hover:text-[var(--text)] rounded transition-colors cursor-pointer"
                              title="Kopyala"
                            >
                              {copiedId === idx ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkle size={15} className="text-[#FFB020] fill-[#FFB020]" />
                    </div>
                    <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#2F6BFF] animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-[#2F6BFF] animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 rounded-full bg-[#2F6BFF] animate-bounce [animation-delay:-0.3s]" />
                    </div>
                  </div>
                )}

                {streamingMsgId && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0 shadow-xs mt-1">
                      <Sparkle size={15} className="text-[#FFB020] fill-[#FFB020]" />
                    </div>
                    <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-4 md:p-5 text-sm text-[var(--text)] leading-relaxed max-w-[85%] md:max-w-2xl">
                      <p className="whitespace-pre-wrap">{streamingText}</p>
                      <span className="inline-block w-1.5 h-4 bg-[#2F6BFF] ml-1 align-middle animate-pulse" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} className="h-4" />
              </div>
            )}

            {/* Fixed Bottom Input */}
            {!isEmptyChat && (
              <div className="shrink-0 p-4 pb-2 border-t border-[var(--border)] bg-[var(--bg)]">
                <div className="max-w-3xl mx-auto w-full">
                  <div className="w-full bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-3xl p-3 md:p-4 shadow-sm focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]/20 transition-all">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="YKS hakkında bir şey sor..."
                      className="w-full bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none resize-none min-h-[40px] max-h-36 leading-relaxed font-medium"
                      rows={1}
                    />

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/60 mt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsExamContextAttached((prev) => !prev)}
                          aria-label="Deneme verisi"
                          className={`w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center transition-colors cursor-pointer ${
                            isExamContextAttached
                              ? "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--brand)]/40"
                              : "bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"
                          }`}
                          title={isExamContextAttached ? "Deneme verisi ekli" : "Deneme verisi ekle"}
                        >
                          <Plus size={14} />
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsExamDropdownOpen((p) => !p)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-3)] text-xs font-bold text-[var(--text)] transition-all cursor-pointer"
                          >
                            <span>{examTarget}</span>
                            <ChevronDown size={11} className="text-[var(--text-subtle)]" />
                          </button>

                          {isExamDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsExamDropdownOpen(false)}
                              />
                              <div className="absolute left-0 bottom-full mb-2 w-32 bg-[var(--surface)] border border-[var(--border-strong)] rounded-2xl shadow-xl z-50 p-1 space-y-0.5">
                                {EXAM_TARGETS.map((target) => (
                                  <button
                                    key={target}
                                    onClick={() => {
                                      setExamTarget(target);
                                      setIsExamDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                      examTarget === target
                                        ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                                        : "text-[var(--text)] hover:bg-[var(--surface-2)]"
                                    }`}
                                  >
                                    {target}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsDeepThinking((prev) => !prev)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                            isDeepThinking
                              ? "bg-[#FFB020]/15 border-[#FFB020]/50 text-[#FFB020]"
                              : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                          }`}
                        >
                          <Sparkle size={12} className={isDeepThinking ? "text-[#FFB020] fill-[#FFB020]" : "text-[#FFB020]"} />
                          <span>Derin düşün</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleVoiceInput}
                          aria-label={isListening ? "Durdur" : "Sesle yaz"}
                          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                            isListening
                              ? "bg-red-500/15 text-red-500 animate-pulse"
                              : "text-[var(--text-muted)] hover:text-[var(--text)]"
                          }`}
                          title={isListening ? "Durdur" : "Sesle yaz"}
                        >
                          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => sendMessage(input)}
                          disabled={loading || !input.trim()}
                          aria-label="Gönder"
                          className="w-8 h-8 rounded-full bg-[#2F6BFF] hover:bg-[#4A80FF] text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                          title="Gönder"
                        >
                          <ArrowUp size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Disclaimer */}
            <div className="py-2.5 text-center shrink-0">
              <p className="text-[11px] text-[var(--text-subtle)] font-medium">
                YZ hata yapabilir. Önemli bilgileri kontrol et.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
