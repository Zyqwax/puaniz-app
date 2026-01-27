"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, Target, Award, Calendar, Edit2, Save, X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getUserExams } from "@/services/examService";
import { getUserProfile, updateUserGoals } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

const StatCard = ({ title, value, subtext, icon, color, onClick, actionIcon: ActionIcon }) => {
  const Icon = icon;
  return (
    <div
      className={`glass-card flex items-start justify-between ${onClick ? "cursor-pointer hover:bg-slate-800/80 transition-all" : ""}`}
      onClick={onClick}
    >
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className={`text-xs ${subtext && subtext.includes("+") ? "text-green-400" : "text-slate-500"}`}>{subtext}</p>
      </div>
      <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400 flex items-center gap-2`}>
        <Icon size={24} />
        {ActionIcon && <ActionIcon size={16} className="text-white/50" />}
      </div>
    </div>
  );
};

const GoalModal = ({ currentGoals, onClose, onSave }) => {
  const [goals, setGoals] = useState(currentGoals);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="glass-panel w-full max-w-sm p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold text-white mb-6">Hedeflerini Belirle</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">TYT Hedef Net</label>
            <input
              type="number"
              value={goals.tyt || ""}
              onChange={(e) => setGoals({ ...goals, tyt: e.target.value === "" ? 0 : Number(e.target.value) })}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">AYT Hedef Net</label>
            <input
              type="number"
              value={goals.ayt || ""}
              onChange={(e) => setGoals({ ...goals, ayt: e.target.value === "" ? 0 : Number(e.target.value) })}
              className="glass-input w-full"
            />
          </div>

          <button
            onClick={() => onSave(goals)}
            className="glass-btn w-full flex items-center justify-center gap-2 mt-4"
          >
            <Save size={18} /> Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardContent = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState({ tyt: 0, ayt: 0 });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalExams: 0,
    tytAvg: 0,
    aytAvg: 0,
  });
  const [welcomeMessage, setWelcomeMessage] = useState("Verilerin analiz ediliyor... 🚀");
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const userId = user.uid;

        // Fetch Exams
        const examData = await getUserExams(userId);
        const reversedData = [...examData].reverse();
        setExams(reversedData);

        // Fetch User Profile (Goals & Welcome Message)
        const userProfile = await getUserProfile(userId);
        if (userProfile && userProfile.goals) {
          setGoals(userProfile.goals);
        }
        if (userProfile && userProfile.welcomeMessage) {
          setWelcomeMessage(userProfile.welcomeMessage);
        } else {
          setWelcomeMessage("Hoşgeldin! İlk denemeni ekleyerek yolculuğa başla. 🚀");
        }

        // Calculate Stats
        const tytExams = examData.filter((e) => e.type === "TYT");
        const aytExams = examData.filter((e) => e.type === "AYT");

        const tytAvg =
          tytExams.length > 0
            ? (tytExams.reduce((acc, curr) => acc + curr.totalNet, 0) / tytExams.length).toFixed(2)
            : 0;

        const aytAvg =
          aytExams.length > 0
            ? (aytExams.reduce((acc, curr) => acc + curr.totalNet, 0) / aytExams.length).toFixed(2)
            : 0;

        setStats({
          totalExams: examData.length,
          tytAvg,
          aytAvg,
        });
      }
      setLoading(false);
    };
    if (user) fetchData();
  }, [user]);

  const handleGoalSave = async (newGoals) => {
    if (user) {
      await updateUserGoals(user.uid, newGoals);
      setGoals(newGoals);
      setIsGoalModalOpen(false);
    }
  };

  const tytData = exams
    .filter((e) => e.type === "TYT")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((e) => ({ trialName: e.name, date: e.date, net: e.totalNet }));

  const aytData = exams
    .filter((e) => e.type === "AYT")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((e) => ({ trialName: e.name, date: e.date, net: e.totalNet }));

  // Determine goal progress text
  const getGoalStatus = (current, goal) => {
    if (!goal || goal === 0) return "Hedef ayarla";
    const diff = current - goal;
    if (diff >= 0) return "Hedefe ulaşıldı! 🎉";
    return `${Math.abs(diff).toFixed(2)} net kaldı`;
  };

  return (
    <div className="space-y-8">
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Genel Bakış</h1>
            <p className="text-slate-400">{welcomeMessage}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Toplam Deneme"
              value={stats.totalExams}
              subtext="Tüm zamanlar"
              icon={Calendar}
              color="blue"
            />
            <StatCard
              title="TYT Ortalama"
              value={stats.tytAvg}
              subtext={getGoalStatus(stats.tytAvg, goals.tyt)}
              icon={Target}
              color="purple"
            />
            <StatCard
              title="AYT Ortalama"
              value={stats.aytAvg}
              subtext={getGoalStatus(stats.aytAvg, goals.ayt)}
              icon={Award}
              color="pink"
            />
            <StatCard
              title="Hedef Netler"
              value={`${goals.tyt} / ${goals.ayt}`}
              subtext="Düzenlemek için tıkla"
              icon={TrendingUp}
              color="green"
              onClick={() => setIsGoalModalOpen(true)}
              actionIcon={Edit2}
            />
          </div>

          {/* Main Chart */}
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-6">TYT Net Değişimi</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tytData.length > 0 ? tytData : []} margin={{ bottom: 50 }}>
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    tick={{ angle: -90, textAnchor: "end", fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (!value) return "";
                      const date = new Date(value);
                      return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
                    }}
                    height={60}
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
                            <p className="font-medium text-slate-200 mb-1">{payload[0].payload.trialName}</p>
                            <p className="text-purple-400 font-bold">{payload[0].value} Net</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="net"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorNet)"
                    strokeWidth={3}
                    name="Net"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AYT Chart */}
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-6">AYT Net Değişimi</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aytData.length > 0 ? aytData : []} margin={{ bottom: 50 }}>
                  <defs>
                    <linearGradient id="colorAytNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    tick={{ angle: -90, textAnchor: "end", fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (!value) return "";
                      const date = new Date(value);
                      return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
                    }}
                    height={60}
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
                            <p className="font-medium text-slate-200 mb-1">{payload[0].payload.trialName}</p>
                            <p className="text-pink-400 font-bold">{payload[0].value} Net</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="net"
                    stroke="#ec4899"
                    fillOpacity={1}
                    fill="url(#colorAytNet)"
                    strokeWidth={3}
                    name="Net"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {isGoalModalOpen && (
        <GoalModal currentGoals={goals} onClose={() => setIsGoalModalOpen(false)} onSave={handleGoalSave} />
      )}
    </div>
  );
};

export default DashboardContent;
