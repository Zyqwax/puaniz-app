"use client";

import React, { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { getUserExams } from "@/services/examService";
import { chatWithAI } from "@/services/aiService";
import { Send, Plus, MessageSquare, Menu, BookOpen, User, X, Trash2 } from "lucide-react";
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
    const initialMessage = {
      role: "assistant",
      content: "Merhaba! Ben senin YKS koçunum. Sınav analizlerini yapabilirim. Bugün ne yapmak istersin?",
      timestamp: new Date().toISOString(),
    };

    setCurrentChatId(newChatId);
    setMessages([initialMessage]);
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
              title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "");
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
        title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "");
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

    const userMessage = { role: "user", content: input, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    updateCurrentChat(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const responseContent = await chatWithAI(input, examContext);
      const aiMessage = { role: "assistant", content: responseContent, timestamp: new Date().toISOString() };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      updateCurrentChat(finalMessages);
    } catch {
      const errorMessage = { role: "assistant", content: "Bir hata oluştu.", timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full relative">
      {/* Sidebar - Desktop & Mobile */}
      <div
        className={`absolute md:relative inset-y-0 left-0 w-56 bg-slate-900 border-r border-white/10 z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col h-full`}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/5 h-16">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <BookOpen size={20} className="text-purple-500" /> Sohbetler
          </h3>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium cursor-pointer"
          >
            <Plus size={18} />
            <span>Yeni Sohbet</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {conversations.map((chat) => (
            <button
              key={chat.id}
              onClick={() => loadChat(chat.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors cursor-pointer group relative pr-8
                ${currentChatId === chat.id ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              <MessageSquare
                size={16}
                className={`shrink-0 ${currentChatId === chat.id ? "text-purple-400" : "text-slate-500 group-hover:text-purple-400"}`}
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{chat.title}</p>
                <p className="text-[10px] text-slate-500">{new Date(chat.date).toLocaleDateString("tr-TR")}</p>
              </div>

              <div
                onClick={(e) => deleteChat(e, chat.id)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-red-500 hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Sohbeti Sil"
              >
                <Trash2 size={14} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Backdrop for Mobile Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-950">
        {/* Mobile Header Toggle */}
        <div className="md:hidden h-16 px-4 border-b border-white/10 flex items-center gap-3 bg-slate-900 sticky top-0 z-10 w-full">
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={24} />
          </button>
          <span className="font-semibold text-white">AI Asistan</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="flex flex-col w-full pb-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`w-full border-b border-white/5 px-4 py-6 md:px-8 ${
                  msg.role === "assistant" ? "bg-slate-900/50" : "bg-transparent"
                }`}
              >
                <div className="max-w-4xl mx-auto flex gap-4 md:gap-6">
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 flex items-center justify-center overflow-hidden relative
                    ${msg.role === "user" ? "bg-purple-600" : "bg-emerald-600"}`}
                  >
                    {msg.role === "user" ? (
                      auth.currentUser?.photoURL ? (
                        <Image src={auth.currentUser.photoURL} alt="User" fill className="object-cover" />
                      ) : (
                        <User size={18} className="text-white" />
                      )
                    ) : (
                      <div className="p-1.5 bg-white w-full h-full flex items-center justify-center relative">
                        <Image src="/favicon.ico" alt="AI" fill className="object-contain" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-white">
                        {msg.role === "user" ? "Siz" : "Puaniz Asistan"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
                          : ""}
                      </span>
                    </div>
                    <div className="prose prose-invert prose-sm md:prose-base max-w-none text-slate-300 leading-relaxed">
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

            {loading && (
              <div className="w-full border-b border-white/5 px-4 py-6 md:px-8 bg-slate-900/50">
                <div className="max-w-4xl mx-auto flex gap-4 md:gap-6">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-600 shrink-0 flex items-center justify-center overflow-hidden">
                    <div className="p-1.5 bg-white w-full h-full flex items-center justify-center relative">
                      <Image src="/favicon.ico" alt="AI" fill className="object-contain" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-white">Puaniz Asistan</span>
                    </div>
                    <div className="flex items-center space-x-2 h-6">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 bg-slate-900 p-2 md:p-4 shrink-0">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative">
            <div className="relative flex items-end gap-2 bg-slate-800 rounded-4xl border border-white/10 px-3 py-1.5 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="YKS ile ilgili sorunu buraya yaz... (Shift+Enter alt satır)"
                className="w-full bg-transparent text-white pl-3 py-3 max-h-32 min-h-[40px] resize-none focus:outline-none placeholder:text-slate-500 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
                rows={1}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-0.5"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-center mt-2">
              <p className="text-xs text-slate-500">Yapay zeka hata yapabilir. Önemli bilgileri kontrol ediniz.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssistantClient;
