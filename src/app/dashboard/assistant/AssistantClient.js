"use client";

import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import Image from "next/image";

const AssistantClient = () => {
  const [conversations, setConversations] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [examContext, setExamContext] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    const updatedConversations = conversations.filter((c) => c.id !== chatId);
    saveToLocalStorage(updatedConversations);

    if (chatId === currentChatId) {
      if (updatedConversations.length > 0) {
        loadChat(updatedConversations[0].id, updatedConversations);
      } else {
        startNewChat(updatedConversations);
      }
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
            if (firstUserMsg) {
              title =
                firstUserMsg.content.slice(0, 30) +
                (firstUserMsg.content.length > 30 ? "..." : "");
            }
          }
          return {
            ...c,
            messages: newMessages,
            title,
            date: new Date().toISOString(),
          };
        }
        return c;
      });
    } else {
      let title = "Yeni Sohbet";
      const firstUserMsg = newMessages.find((m) => m.role === "user");
      if (firstUserMsg) {
        title =
          firstUserMsg.content.slice(0, 30) +
          (firstUserMsg.content.length > 30 ? "..." : "");
      }

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    updateCurrentChat(updatedMessages);
    setInput("");
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const responseContent = await chatWithAI(input, examContext);
      const aiMessage = {
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      updateCurrentChat(finalMessages);
    } catch {
      const errorMessage = {
        role: "assistant",
        content: "Bir hata oluştu. Lütfen tekrar deneyin.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      label: "Denemelerimi analiz et",
      subtitle: "Güçlü ve zayıf yanlarımı göster",
      icon: "📊",
      prompt:
        "Son denemelerimi detaylı analiz et. Hangi derslerde iyi gidiyorum, hangi derslerde düşüş var? Net ortalamalarıma göre öncelikli çalışmam gereken konuları sırala ve her biri için kısa bir strateji öner.",
    },
    {
      label: "Haftalık çalışma planı",
      subtitle: "Kişiselleştirilmiş program",
      icon: "📅",
      prompt:
        "Deneme sonuçlarıma göre bana haftalık bir çalışma planı oluştur. Hangi gün hangi dersi ne kadar çalışmam gerektiğini tablo şeklinde yaz. Zayıf olduğum derslere daha çok zaman ayır, güçlü olduklarıma tekrar amaçlı kısa süre ver.",
    },
    {
      label: "Zayıf konularım neler?",
      subtitle: "Eksik analizin ve öneriler",
      icon: "🎯",
      prompt:
        "Denemelerime bakarak en çok net kaybettiğim dersleri ve muhtemel zayıf konularımı listele. Her ders için hangi konulara öncelik vermem gerektiğini ve o konuyu nasıl çalışmam gerektiğini (kaynak, yöntem) kısaca öner.",
    },
    {
      label: "Sınav stratejisi öner",
      subtitle: "Süre yönetimi ve taktikler",
      icon: "⏱️",
      prompt:
        "YKS sınavı için etkili bir sınav stratejisi öner. Hangi dersten başlamalıyım, her derse ne kadar süre ayırmalıyım, hangi soruları atlayıp sonra dönmeliyim? TYT ve AYT için ayrı ayrı strateji ver.",
    },
    {
      label: "Hedef net hesapla",
      subtitle: "Sıralama tahmini ve yol haritası",
      icon: "�",
      prompt:
        "Mevcut deneme ortalamalarıma bakarak, eğer bu tempoda devam edersem tahmini YKS sıralamam ne olur? İlk 100.000'e girmem için TYT ve AYT'de toplam kaç net yapmam gerekir? Her ders için hedef netleri yaz.",
    },
    {
      label: "Motivasyon ve moral",
      subtitle: "Sınav kaygısıyla başa çıkma",
      icon: "💪",
      prompt:
        "Sınava hazırlanırken motivasyonum düşüyor ve bazen çok stresli hissediyorum. Bana moral ver, verimli çalışma için pratik öneriler sun ve sınav kaygısıyla başa çıkmam için kısa taktikler öner.",
    },
  ];

  const handleQuickAction = async (prompt) => {
    if (loading) return;
    const userMessage = {
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    updateCurrentChat(updatedMessages);
    setLoading(true);

    try {
      const responseContent = await chatWithAI(prompt, examContext);
      const aiMessage = {
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      updateCurrentChat(finalMessages);
    } catch {
      const errorMessage = {
        role: "assistant",
        content: "Bir hata oluştu. Lütfen tekrar deneyin.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Empty state — no messages
  const isEmptyChat = messages.length === 0;

  return (
    <div className="flex h-full w-full relative">
      {/* Sidebar */}
      <div
        className={`absolute md:relative inset-y-0 left-0 w-60 bg-slate-900/95 backdrop-blur-xl border-r border-white/5 z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col h-full`}
      >
        <div className="p-3 flex items-center justify-between border-b border-white/5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
            Sohbetler
          </span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-2">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 text-sm text-slate-300 hover:text-white px-3 py-2.5 rounded-lg hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Yeni Sohbet</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2">
          {conversations.map((chat) => (
            <button
              key={chat.id}
              onClick={() => loadChat(chat.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer group relative pr-8 text-[13px]
                ${
                  currentChatId === chat.id
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
            >
              <MessageSquare
                size={14}
                className={`shrink-0 ${
                  currentChatId === chat.id
                    ? "text-purple-400"
                    : "text-slate-600"
                }`}
              />
              <span className="truncate flex-1">{chat.title}</span>

              <div
                onClick={(e) => deleteChat(e, chat.id)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-red-400 rounded-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Sil"
              >
                <Trash2 size={13} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden h-14 px-4 border-b border-white/5 flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <Menu size={22} />
          </button>
          <span className="text-sm font-medium text-white">Asistan</span>
        </div>

        {/* Messages / Empty State */}
        <div className="flex-1 overflow-y-auto">
          {isEmptyChat ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center mb-5">
                <Sparkles size={24} className="text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-1">
                Nasıl yardımcı olabilirim?
              </h2>
              <p className="text-slate-500 text-sm mb-8 text-center max-w-sm">
                YKS hazırlığın hakkında sorular sorabilir, deneme analizlerini
                inceleyebilir veya çalışma önerisi alabilirsin.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/20 hover:bg-purple-500/5 text-left transition-all cursor-pointer group"
                  >
                    <span className="text-lg mt-0.5">{action.icon}</span>
                    <div className="min-w-0">
                      <span className="text-sm text-slate-200 group-hover:text-white font-medium block">
                        {action.label}
                      </span>
                      <span className="text-[11px] text-slate-500 group-hover:text-slate-400 block mt-0.5">
                        {action.subtitle}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="flex flex-col w-full py-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`px-4 md:px-6 py-4 ${
                    msg.role === "assistant" ? "" : ""
                  }`}
                >
                  <div className="max-w-3xl mx-auto flex gap-3">
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center overflow-hidden relative mt-0.5 ${
                        msg.role === "user"
                          ? "bg-slate-700"
                          : "bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/20"
                      }`}
                    >
                      {msg.role === "user" ? (
                        auth.currentUser?.photoURL ? (
                          <Image
                            src={auth.currentUser.photoURL}
                            alt="User"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <User size={14} className="text-slate-300" />
                        )
                      ) : (
                        <Bot size={14} className="text-purple-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] text-slate-500 mb-1 block">
                        {msg.role === "user" ? "Siz" : "Asistan"}
                        {msg.timestamp && (
                          <span className="ml-2">
                            {new Date(msg.timestamp).toLocaleTimeString(
                              "tr-TR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        )}
                      </span>
                      <div
                        className={`text-[14px] leading-relaxed ${
                          msg.role === "user"
                            ? "text-slate-200"
                            : "prose prose-sm prose-invert max-w-none prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-2 prose-headings:text-white prose-a:text-purple-400 prose-strong:text-white prose-code:text-purple-300 prose-code:bg-purple-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-800/80 prose-pre:border prose-pre:border-white/5 prose-ul:text-slate-300 prose-li:text-slate-300"
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

              {/* Loading */}
              {loading && (
                <div className="px-4 md:px-6 py-4">
                  <div className="max-w-3xl mx-auto flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/20 shrink-0 flex items-center justify-center mt-0.5">
                      <Bot size={14} className="text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[11px] text-slate-500 mb-1 block">
                        Asistan
                      </span>
                      <div className="flex items-center gap-1.5 h-5">
                        <div className="w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-white/5 bg-slate-900/50 backdrop-blur-xl p-3 md:p-4 shrink-0">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-slate-800/80 rounded-2xl border border-white/5 px-4 py-1.5 focus-within:border-purple-500/30 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 128) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Bir mesaj yaz..."
                className="w-full bg-transparent text-white text-sm py-3 max-h-32 min-h-[40px] resize-none focus:outline-none placeholder:text-slate-600"
                rows={1}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-purple-600 mb-0.5 cursor-pointer"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[11px] text-slate-600 text-center mt-2">
              Yapay zeka hata yapabilir · Shift+Enter ile alt satır
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssistantClient;
