"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { getUserExams } from "@/services/examService";
import { chatWithAI } from "@/services/aiService";
import {
  Send,
  Plus,
  MessageSquare,
  Menu,
  User,
  X,
  Trash2,
  Bot,
  Sparkles,
  Brain,
  ChevronRight,
  Clock,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import Image from "next/image";

/* ── Quick Action Prompts ── */
const quickActions = [
  {
    label: "Deneme Analizi",
    subtitle: "Güçlü & zayıf yanlarımı göster",
    icon: "📊",
    color: "from-purple-600/20 to-violet-600/10 border-purple-500/20 hover:border-purple-500/40",
    iconBg: "bg-purple-500/10",
    prompt:
      "Son denemelerimi detaylı analiz et. Hangi derslerde iyi gidiyorum, hangilerinde düşüş var? Net ortalamalarıma göre öncelikli çalışmam gereken konuları sırala ve her biri için somut bir strateji öner.",
  },
  {
    label: "Haftalık Plan",
    subtitle: "Kişiselleştirilmiş çalışma programı",
    icon: "📅",
    color: "from-blue-600/20 to-cyan-600/10 border-blue-500/20 hover:border-blue-500/40",
    iconBg: "bg-blue-500/10",
    prompt:
      "Deneme sonuçlarıma göre bana 7 günlük detaylı bir çalışma planı oluştur. Zayıf derslere daha fazla zaman ayır, güçlü derslere tekrar süresi ver. Tabloyu gün gün yaz.",
  },
  {
    label: "Zayıf Konularım",
    subtitle: "Eksik analiz ve kaynak önerileri",
    icon: "🎯",
    color: "from-red-600/20 to-rose-600/10 border-red-500/20 hover:border-red-500/40",
    iconBg: "bg-red-500/10",
    prompt:
      "Denemelerime bakarak en çok hata yaptığım dersleri ve konuları listele. Her ders için öncelikli konu başlıklarını ve nasıl çalışmam gerektiğini (yöntem, kaynak) kısaca öner.",
  },
  {
    label: "Sınav Stratejisi",
    subtitle: "Süre yönetimi ve çözüm taktikleri",
    icon: "⏱️",
    color: "from-amber-600/20 to-yellow-600/10 border-amber-500/20 hover:border-amber-500/40",
    iconBg: "bg-amber-500/10",
    prompt:
      "YKS sınavında en verimli çözüm sırasını ve zaman yönetimini anlat. TYT ve AYT için ayrı ayrı: Hangi sorudan başlamalıyım? Hangi bölüme ne kadar süre? Atlama stratejisi nasıl olmalı?",
  },
  {
    label: "Hedef Net Hesapla",
    subtitle: "Tahmini sıralama ve yol haritası",
    icon: "🏆",
    color: "from-emerald-600/20 to-teal-600/10 border-emerald-500/20 hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10",
    prompt:
      "Mevcut deneme ortalamalarıma göre tahmini YKS sıralamam ne olur? İstediğim bölüme girebilmem için TYT ve AYT'de kaç net yapmam gerekiyor? Her ders için hedef netleri belirle.",
  },
  {
    label: "Motivasyon & Moral",
    subtitle: "Stresle başa çıkma ve verimlilik",
    icon: "💪",
    color: "from-pink-600/20 to-rose-600/10 border-pink-500/20 hover:border-pink-500/40",
    iconBg: "bg-pink-500/10",
    prompt:
      "Sınava hazırlanırken motivasyonum düşüyor ve stres hissediyorum. Bana moral ver, verimli çalışmak için pratik öneriler sun ve sınav kaygısıyla başa çıkmam için somut teknikler yaz.",
  },
];

const AssistantClient = () => {
  const [conversations, setConversations] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [examContext, setExamContext] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Typewriter animation state
  const [streamingText, setStreamingText] = useState("");
  const [streamingMsgId, setStreamingMsgId] = useState(null);
  const streamingRef = useRef(null); // holds the interval id
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const storedHistory = localStorage.getItem("chatHistory");
    if (storedHistory) {
      const history = JSON.parse(storedHistory);
      setConversations(history);
      if (history.length > 0) {
        loadChat(history[0].id, history);
      } else {
        startNewChat();
      }
    } else {
      startNewChat();
    }

    const fetchContext = async () => {
      if (auth.currentUser) {
        const exams = await getUserExams(auth.currentUser.uid);
        const summary = exams
          .slice(0, 5)
          .map((e) => `${e.date} tarihli ${e.type} denemesi: ${e.totalNet} Net`)
          .join("\n");
        setExamContext(summary);
      }
    };
    fetchContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveToLocalStorage = (updatedConversations) => {
    localStorage.setItem("chatHistory", JSON.stringify(updatedConversations));
    setConversations(updatedConversations);
  };

  const startNewChat = () => {
    const newChatId = uuidv4();
    setCurrentChatId(newChatId);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const loadChat = (chatId, currentList = conversations) => {
    const chat = currentList.find((c) => c.id === chatId);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(chat.messages);
      setIsSidebarOpen(false);
    }
  };

  const deleteChat = (e, chatId) => {
    e.stopPropagation();
    const updated = conversations.filter((c) => c.id !== chatId);
    saveToLocalStorage(updated);
    if (chatId === currentChatId) {
      if (updated.length > 0) loadChat(updated[0].id, updated);
      else startNewChat();
    }
  };

  const updateCurrentChat = (newMessages) => {
    let updatedConversations;
    const chatExists = conversations.some((c) => c.id === currentChatId);

    if (chatExists) {
      updatedConversations = conversations.map((c) => {
        if (c.id === currentChatId) {
          let title = c.title;
          if (title === "Yeni Sohbet" && newMessages.length > 1) {
            const firstUserMsg = newMessages.find((m) => m.role === "user");
            if (firstUserMsg)
              title = firstUserMsg.content.slice(0, 32) + (firstUserMsg.content.length > 32 ? "..." : "");
          }
          return { ...c, messages: newMessages, title, date: new Date().toISOString() };
        }
        return c;
      });
    } else {
      let title = "Yeni Sohbet";
      const firstUserMsg = newMessages.find((m) => m.role === "user");
      if (firstUserMsg)
        title = firstUserMsg.content.slice(0, 32) + (firstUserMsg.content.length > 32 ? "..." : "");

      const newConversation = {
        id: currentChatId,
        title,
        date: new Date().toISOString(),
        messages: newMessages,
      };
      updatedConversations = [newConversation, ...conversations];
    }

    updatedConversations.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveToLocalStorage(updatedConversations);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Typewriter animation ──
  const animateText = useCallback((fullText, onComplete) => {
    let i = 0;
    setStreamingText("");
    const id = setInterval(() => {
      i++;
      setStreamingText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(id);
        streamingRef.current = null;
        onComplete();
      }
    }, 8); // ms per character — lower = faster
    streamingRef.current = id;
  }, []);

  // Clear animation on unmount
  useEffect(() => {
    return () => { if (streamingRef.current) clearInterval(streamingRef.current); };
  }, []);

  const sendMessage = async (content) => {
    if (!content.trim() || loading) return;

    const userMessage = { role: "user", content, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    updateCurrentChat(updatedMessages);
    setInput("");
    setLoading(true);

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const responseContent = await chatWithAI(content, examContext);
      const aiTimestamp = new Date().toISOString();
      const tempId = uuidv4();

      // Start streaming animation — show placeholder while typing
      setLoading(false);
      setStreamingMsgId(tempId);

      animateText(responseContent, () => {
        // Animation done — commit to messages
        const aiMessage = { role: "assistant", content: responseContent, timestamp: aiTimestamp };
        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
        updateCurrentChat(finalMessages);
        setStreamingMsgId(null);
        setStreamingText("");
      });
    } catch {
      setLoading(false);
      const errorMessage = {
        role: "assistant",
        content: "Bir hata oluştu. Lütfen tekrar deneyin.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const isEmptyChat = messages.length === 0;

  return (
    <div className="flex h-full w-full relative">

      {/* ── Sidebar ── */}
      <div
        className={`absolute lg:relative inset-y-0 left-0 w-64 bg-slate-950/95 backdrop-blur-xl border-r border-white/5 z-30
          transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col h-full`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-purple-400" />
            <span className="text-sm font-bold text-white">Sohbetler</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 shrink-0">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2.5 text-sm text-slate-200 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/20 hover:border-purple-500/40 hover:from-purple-600/30 hover:to-pink-600/30 transition-all cursor-pointer font-medium"
          >
            <Plus size={15} />
            <span>Yeni Sohbet</span>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-4">
          {conversations.length === 0 ? (
            <p className="text-center text-xs text-slate-600 py-8">Henüz sohbet yok</p>
          ) : (
            conversations.map((chat) => (
              <button
                key={chat.id}
                onClick={() => loadChat(chat.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group relative text-[13px]
                  ${currentChatId === chat.id
                    ? "bg-white/10 text-white border border-white/5"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                  }`}
              >
                <MessageSquare
                  size={13}
                  className={`shrink-0 ${currentChatId === chat.id ? "text-purple-400" : "text-slate-600"}`}
                />
                <span className="truncate flex-1 font-medium">{chat.title}</span>
                <div
                  onClick={(e) => deleteChat(e, chat.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-red-400 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer hover:bg-red-500/10"
                  title="Sil"
                >
                  <Trash2 size={13} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col h-full min-w-0">

        {/* Top Bar */}
        <div className="shrink-0 h-14 px-4 border-b border-white/5 flex items-center justify-between bg-slate-900/70 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center">
                <Brain size={15} className="text-purple-400" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">YKS Asistan</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-slate-400 font-medium">Çevrimiçi</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={startNewChat}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all cursor-pointer font-medium"
          >
            <Plus size={13} />
            Yeni
          </button>
        </div>

        {/* Messages Area / Empty State */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {isEmptyChat ? (
            /* ── Empty / Welcome State ── */
            <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
              {/* Hero */}
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/20 flex items-center justify-center shadow-2xl shadow-purple-900/20">
                  <Sparkles size={32} className="text-purple-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 border-2 border-slate-900 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white mb-2 text-center tracking-tight">
                Nasıl yardımcı olabilirim?
              </h2>
              <p className="text-slate-400 text-sm md:text-base mb-10 text-center max-w-md leading-relaxed">
                YKS hazırlığın hakkında her şeyi sorabilirsin. Deneme analizinden çalışma planına, motivasyondan strateji geliştirmeye kadar buradayım.
              </p>

              {/* Quick Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    disabled={loading}
                    className={`flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br ${action.color} border transition-all cursor-pointer text-left group disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${action.iconBg} flex items-center justify-center shrink-0 text-xl group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm text-white font-bold block leading-tight mb-0.5">{action.label}</span>
                      <span className="text-[11px] text-slate-400 block leading-snug">{action.subtitle}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0 mt-1 ml-auto" />
                  </button>
                ))}
              </div>

              <p className="text-xs text-slate-600 mt-8 flex items-center gap-1.5">
                <Clock size={11} />
                Sınav verilerine göre kişiselleştirilmiş cevaplar alırsın
              </p>
            </div>
          ) : (
            /* ── Messages ── */
            <div className="flex flex-col w-full py-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`px-4 md:px-6 py-3 transition-opacity ${
                    msg.role === "assistant" ? "bg-white/[0.01]" : ""
                  }`}
                >
                  <div className="max-w-3xl mx-auto flex gap-4">
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center overflow-hidden relative mt-0.5 border ${
                        msg.role === "user"
                          ? "bg-slate-700/80 border-slate-600/50"
                          : "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/20"
                      }`}
                    >
                      {msg.role === "user" ? (
                        auth.currentUser?.photoURL ? (
                          <Image src={auth.currentUser.photoURL} alt="User" fill className="object-cover" />
                        ) : (
                          <User size={15} className="text-slate-300" />
                        )
                      ) : (
                        <Bot size={15} className="text-purple-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-slate-400">
                          {msg.role === "user" ? "Siz" : "Asistan"}
                        </span>
                        {msg.timestamp && (
                          <span className="text-[10px] text-slate-600">
                            {new Date(msg.timestamp).toLocaleTimeString("tr-TR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[14px] leading-relaxed ${
                          msg.role === "user"
                            ? "text-slate-200"
                            : "[&_p]:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-2 [&_h1]:text-white [&_h1]:font-bold [&_h1]:text-lg [&_h1]:mb-2 [&_h2]:text-white [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-slate-200 [&_h3]:font-semibold [&_h3]:mb-1 [&_a]:text-purple-400 [&_strong]:text-white [&_code]:text-purple-300 [&_code]:bg-purple-500/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-slate-800/80 [&_pre]:border [&_pre]:border-white/5 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_ul]:text-slate-300 [&_ul]:pl-4 [&_ul]:list-disc [&_li]:mb-1 [&_ol]:text-slate-300 [&_ol]:pl-4 [&_ol]:list-decimal"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* ── Loading indicator (API waiting) ── */}
              {loading && (
                <div className="px-4 md:px-6 py-3 bg-white/[0.01]">
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 shrink-0 flex items-center justify-center">
                      <Bot size={15} className="text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-400 block mb-2">Asistan</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-purple-400/70 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 bg-purple-400/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 bg-purple-400/70 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Streaming / typewriter message bubble ── */}
              {streamingMsgId && (
                <div className="px-4 md:px-6 py-3 bg-white/[0.01]">
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 shrink-0 flex items-center justify-center mt-0.5">
                      <Bot size={15} className="text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-slate-400">Asistan</span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                          Yazıyor...
                        </span>
                      </div>
                      <div className="text-[14px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                        {streamingText}
                        <span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 align-middle animate-[blink_0.8s_step-end_infinite]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>

          )}
        </div>

        {/* ── Input Area ── */}
        <div className="border-t border-white/5 bg-slate-900/60 backdrop-blur-xl shrink-0 p-3 md:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-slate-800/60 rounded-2xl border border-white/10 px-4 py-2 focus-within:border-purple-500/50 focus-within:bg-slate-800 transition-all shadow-lg">
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
                    handleSend(e);
                  }
                }}
                placeholder="Bir mesaj yaz... (Shift+Enter ile satır ekle)"
                className="w-full bg-transparent text-white text-sm py-2.5 max-h-36 min-h-[40px] resize-none focus:outline-none placeholder:text-slate-600 leading-relaxed"
                rows={1}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl transition-all disabled:opacity-30 hover:shadow-lg hover:shadow-purple-900/30 hover:-translate-y-0.5 disabled:hover:translate-y-0 mb-0.5 shrink-0 cursor-pointer"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-600 text-center mt-2">
              YZ hata yapabilir · Sınav verilerinle kişiselleştirilmiş cevaplar alırsın
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssistantClient;
