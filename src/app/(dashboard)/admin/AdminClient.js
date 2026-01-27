"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Users, FileText, MessageSquare, Activity, Calendar, Mail, User } from "lucide-react";
import AdminRoute from "@/components/AdminRoute";
import { getAdminStats, getAllUsers, getUserExamStats } from "@/services/adminService";
import Skeleton from "@/components/Skeleton";

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="glass-panel p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const formatDate = (date) => {
  if (!date) return "-";
  const d = date instanceof Date ? date : date?.toDate?.() || new Date(date);
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminClient = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [userExamStats, setUserExamStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, usersData, examStats] = await Promise.all([
          getAdminStats(),
          getAllUsers(),
          getUserExamStats(),
        ]);
        setStats(statsData);
        setUsers(usersData);
        setUserExamStats(examStats);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Merge users with exam stats
  const usersWithStats = users.map((user) => ({
    ...user,
    examCount: userExamStats[user.id]?.examCount || 0,
    lastExamDate: userExamStats[user.id]?.lastExamDate || null,
  }));

  // Sort users by exam count descending
  usersWithStats.sort((a, b) => b.examCount - a.examCount);

  return (
    <AdminRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-slate-400">Kullanıcı ve deneme istatistikleri</p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Toplam Kullanıcı"
              value={stats?.totalUsers || 0}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <StatCard
              icon={FileText}
              label="Toplam Deneme"
              value={stats?.totalExams || 0}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              icon={Activity}
              label="Deneme Yükleyen"
              value={stats?.usersWithExams || 0}
              color="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              icon={MessageSquare}
              label="Toplam Gönderi"
              value={stats?.totalPosts || 0}
              color="bg-gradient-to-br from-pink-500 to-pink-600"
            />
          </div>
        )}

        {/* Users Table */}
        <div className="glass-panel p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Kullanıcı Listesi</h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : usersWithStats.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Henüz kullanıcı yok</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-400 text-sm font-medium py-3 px-4">Kullanıcı</th>
                    <th className="text-left text-slate-400 text-sm font-medium py-3 px-4">E-posta</th>
                    <th className="text-left text-slate-400 text-sm font-medium py-3 px-4">Kayıt Tarihi</th>
                    <th className="text-center text-slate-400 text-sm font-medium py-3 px-4">Deneme Sayısı</th>
                    <th className="text-left text-slate-400 text-sm font-medium py-3 px-4">Son Deneme</th>
                  </tr>
                </thead>
                <tbody>
                  {usersWithStats.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt={user.name || "Avatar"}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                              {user.name?.charAt(0)?.toUpperCase() || <User size={16} />}
                            </div>
                          )}
                          <span className="text-white font-medium">{user.name || "İsimsiz"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Mail size={14} />
                          <span className="text-sm">{user.email || "-"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar size={14} />
                          <span className="text-sm">{formatDate(user.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium ${
                            user.examCount > 0 ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"
                          }`}
                        >
                          {user.examCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-sm">{formatDate(user.lastExamDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminRoute>
  );
};

export default AdminClient;
