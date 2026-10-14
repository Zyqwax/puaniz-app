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

import {
  BarChart2,
  Calendar,
  Target,
  Clock as ClockIcon,
  TrendingUp,
  Heart,
} from "lucide-react";

/* ── Quick Action Prompts matching PDF page 12 ── */
const quickActions = [
  {
    label: "Deneme Analizi",
    subtitle: "Güçlü ve zayıf yanlarını göster",
    icon: BarChart2,
    iconBg: "bg-[#2F6BFF]",
    iconColor: "text-white",
    prompt:
      "Son denemelerimi detaylı analiz et. Hangi derslerde iyi gidiyorum, hangilerinde düşüş var? Net ortalamalarıma göre öncelikli çalışmam gereken konuları sırala ve her biri için somut bir strateji öner.",
  },
  {
    label: "Haftalık Plan",
    subtitle: "Kişiselleştirilmiş çalışma programı",
    icon: Calendar,
    iconBg: "bg-[#0F2A5C]",
    iconColor: "text-white",
    prompt:
      "Deneme sonuçlarıma göre bana 7 günlük detaylı bir çalışma planı oluştur. Zayıf derslere daha fazla zaman ayır, güçlü derslere tekrar süresi ver. Tabloyu gün gün yaz.",
  },
  {
    label: "Zayıf Konularım",
    subtitle: "Eksik analiz ve kaynak önerileri",
    icon: Target,
    iconBg: "bg-[#FFB020]",
    iconColor: "text-[#0F2A5C]",
    prompt:
      "Denemelerime bakarak en çok hata yaptığım dersleri ve konuları listele. Her ders için öncelikli konu başlıklarını ve nasıl çalışmam gerektiğini (yöntem, kaynak) kısaca öner.",
  },
  {
    label: "Sınav Stratejisi",
    subtitle: "Süre yönetimi ve çözüm taktikleri",
    icon: ClockIcon,
    iconBg: "bg-[#0F2A5C]",
    iconColor: "text-white",
    prompt:
      "YKS sınavında en verimli çözüm sırasını ve zaman yönetimini anlat. TYT ve AYT için ayrı ayrı: Hangi sorudan başlamalıyım? Hangi bölüme ne kadar süre? Atlama stratejisi nasıl olmalı?",
  },
  {
    label: "Hedef Net Hesapla",
    subtitle: "Tahmini sıralama ve yol haritası",
    icon: TrendingUp,
    iconBg: "bg-[#2F6BFF]",
    iconColor: "text-white",
    prompt:
      "Mevcut deneme ortalamalarıma göre tahmini YKS sıralamam ne olur? İstediğim bölüme girebilmem için TYT ve AYT'de kaç net yapmam gerekiyor? Her ders için hedef netleri belirle.",
  },
  {
    label: "Motivasyon & Moral",
    subtitle: "Stresle başa çıkma ve verimlilik",
    icon: Heart,
    iconBg: "bg-[#FFB020]",
    iconColor: "text-[#0F2A5C]",
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
    <div className="flex h-full w-full relative bg-[#F4F7FC]">

      {/* ── Sidebar ── */}
      <div
        className={`absolute lg:relative inset-y-0 left-0 w-64 bg-white border-r border-[#0F2A5C]/[0.08] z-30
          transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col h-full shadow-sm`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-[#0F2A5C]/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-[#2F6BFF]" />
            <span className="text-sm font-bold text-[#0F2A5C]">Sohbetler</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-[#4A5B7A] hover:text-[#0F2A5C] p-1 rounded-lg hover:bg-[#F4F7FC] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 shrink-0">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 text-sm text-white px-4 py-2.5 rounded-2xl bg-[#0F2A5C] hover:bg-[#1a3a78] transition-all cursor-pointer font-bold shadow-sm"
          >
            <Plus size={16} />
            <span>+ Yeni Sohbet</span>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
          {conversations.length === 0 ? (
            <p className="text-center text-xs text-[#4A5B7A]/60 py-8">Henüz sohbet yok</p>
          ) : (
            conversations.map((chat) => (
              <button
                key={chat.id}
                onClick={() => loadChat(chat.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group relative text-[13px]
                  ${currentChatId === chat.id
                    ? "bg-[#2F6BFF]/10 text-[#0F2A5C] font-bold border border-[#2F6BFF]/20"
                    : "text-[#4A5B7A] hover:bg-[#F4F7FC] hover:text-[#0F2A5C] border border-transparent"
                  }`}
              >
                <MessageSquare
                  size={14}
                  className={`shrink-0 ${currentChatId === chat.id ? "text-[#2F6BFF]" : "text-[#4A5B7A]/60"}`}
                />
                <span className="truncate flex-1">{chat.title}</span>
                <div
                  onClick={(e) => deleteChat(e, chat.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-[#4A5B7A]/60 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer hover:bg-red-50"
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
          className="absolute inset-0 bg-[#0F2A5C]/40 backdrop-blur-xs z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#F4F7FC]">

        {/* Top Bar */}
        <div className="shrink-0 h-16 px-5 border-b border-[#0F2A5C]/[0.08] flex items-center justify-between bg-white z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-[#4A5B7A] hover:text-[#0F2A5C] p-1.5 rounded-xl hover:bg-[#F4F7FC] cursor-pointer transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#2F6BFF]/10 border border-[#2F6BFF]/20 flex items-center justify-center">
                <Brain size={18} className="text-[#2F6BFF]" />
              </div>
              <div>
                <span className="text-sm font-bold text-[#0F2A5C]">YKS Asistan</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-[#4A5B7A] font-medium">Çevrimiçi · AI Koç</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={startNewChat}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F2A5C] hover:bg-[#F4F7FC] border border-[#0F2A5C]/10 rounded-xl transition-all cursor-pointer"
          >
            <Plus size={13} />
            Yeni Sohbet
          </button>
        </div>

        {/* Messages Area / Empty State */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {isEmptyChat ? (
            /* ── Empty / Welcome State ── */
            <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
              {/* Hero */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-3xl bg-[#0F2A5C] flex items-center justify-center shadow-xl shadow-[#0F2A5C]/15">
                  <Sparkles size={34} className="text-[#FFB020]" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0F2A5C] mb-2 text-center tracking-tight">
                Nasıl yardımcı olabilirim?
              </h2>
              <p className="text-[#4A5B7A] text-sm md:text-base mb-8 text-center max-w-md leading-relaxed">
                YKS hazırlığın hakkında her şeyi sorabilirsin. Deneme analizinden çalışma planına, eksik konu tespitinden strateji geliştirmeye kadar yanındayım.
              </p>

              {/* Quick Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    disabled={loading}
                    className={`flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#0F2A5C]/[0.08] shadow-xs transition-all cursor-pointer text-left group disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-md hover:border-[#2F6BFF]/30`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${action.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-[#0F2A5C] font-bold block leading-tight mb-0.5">{action.label}</span>
                      <span className="text-[11px] text-[#4A5B7A] block leading-snug">{action.subtitle}</span>
                    </div>
                    <ChevronRight size={15} className="text-[#4A5B7A]/50 group-hover:text-[#2F6BFF] transition-colors shrink-0 mt-1" />
                  </button>
                ))}
              </div>

              <p className="text-xs text-[#4A5B7A] mt-8 flex items-center gap-1.5 font-medium">
                <Clock size={13} className="text-[#2F6BFF]" />
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
                    msg.role === "assistant" ? "bg-white/60 border-y border-[#0F2A5C]/[0.03]" : ""
                  }`}
                >
                  <div className="max-w-3xl mx-auto flex gap-4">
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center overflow-hidden relative mt-0.5 shadow-xs ${
                        msg.role === "user"
                          ? "bg-[#0F2A5C] text-white"
                          : "bg-[#2F6BFF]/10 text-[#2F6BFF] border border-[#2F6BFF]/20"
                      }`}
                    >
                      {msg.role === "user" ? (
                        auth.currentUser?.photoURL ? (
                          <Image src={auth.currentUser.photoURL} alt="User" fill className="object-cover" />
                        ) : (
                          <span className="text-xs font-bold">ES</span>
                        )
                      ) : (
                        <Bot size={18} className="text-[#2F6BFF]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-[#0F2A5C]">
                          {msg.role === "user" ? "Siz" : "YKS Asistan"}
                        </span>
                        {msg.timestamp && (
                          <span className="text-[11px] text-[#4A5B7A]/70">
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
                            ? "text-[#0F2A5C] font-medium"
                            : "[&_p]:text-[#0F2A5C] [&_p]:leading-relaxed [&_p]:mb-2 [&_h1]:text-[#0F2A5C] [&_h1]:font-bold [&_h1]:text-lg [&_h1]:mb-2 [&_h2]:text-[#0F2A5C] [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-[#0F2A5C] [&_h3]:font-semibold [&_h3]:mb-1 [&_a]:text-[#2F6BFF] [&_strong]:text-[#0F2A5C] [&_strong]:font-bold [&_code]:text-[#0F2A5C] [&_code]:bg-[#F4F7FC] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-[#0F2A5C] [&_pre]:text-white [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_ul]:text-[#0F2A5C] [&_ul]:pl-4 [&_ul]:list-disc [&_li]:mb-1 [&_ol]:text-[#0F2A5C] [&_ol]:pl-4 [&_ol]:list-decimal"
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
                <div className="px-4 md:px-6 py-3 bg-white/60 border-y border-[#0F2A5C]/[0.03]">
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className="w-9 h-9 rounded-xl bg-[#2F6BFF]/10 border border-[#2F6BFF]/20 shrink-0 flex items-center justify-center">
                      <Bot size={18} className="text-[#2F6BFF]" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-[#0F2A5C] block mb-2">YKS Asistan</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-[#2F6BFF] rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 bg-[#2F6BFF] rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 bg-[#2F6BFF] rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Streaming / typewriter message bubble ── */}
              {streamingMsgId && (
                <div className="px-4 md:px-6 py-3 bg-white/60 border-y border-[#0F2A5C]/[0.03]">
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className="w-9 h-9 rounded-xl bg-[#2F6BFF]/10 border border-[#2F6BFF]/20 shrink-0 flex items-center justify-center mt-0.5">
                      <Bot size={18} className="text-[#2F6BFF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-[#0F2A5C]">YKS Asistan</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#2F6BFF] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] animate-pulse" />
                          Yazıyor...
                        </span>
                      </div>
                      <div className="text-[14px] leading-relaxed text-[#0F2A5C] whitespace-pre-wrap">
                        {streamingText}
                        <span className="inline-block w-0.5 h-4 bg-[#2F6BFF] ml-0.5 align-middle animate-[blink_0.8s_step-end_infinite]" />
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
        <div className="border-t border-[#0F2A5C]/[0.08] bg-white shrink-0 p-3 md:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-xs">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-[#F4F7FC] rounded-2xl border border-[#0F2A5C]/[0.1] px-4 py-2 focus-within:border-[#2F6BFF] focus-within:bg-white transition-all shadow-xs">
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
                className="w-full bg-transparent text-[#0F2A5C] text-sm py-2 max-h-36 min-h-[40px] resize-none focus:outline-none placeholder:text-[#4A5B7A]/60 leading-relaxed font-medium"
                rows={1}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 bg-[#2F6BFF] hover:bg-[#2558d6] text-white rounded-xl transition-all disabled:opacity-40 hover:shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0 mb-0.5 shrink-0 cursor-pointer shadow-xs"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[11px] text-[#4A5B7A] text-center mt-2 font-medium">
              YZ hata yapabilir · Sınav verilerinle kişiselleştirilmiş cevaplar alırsın
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssistantClient;
