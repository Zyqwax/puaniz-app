"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  getTeacherAssignedClasses,
  getClassDetailForTeacher,
  addTeacherFeedback,
  getStudentFeedbacks,
} from "@/server/actions/teacher";
import type { ClassItem, TeacherFeedbackItem } from "@/types";
import {
  GraduationCap,
  Users,
  Award,
  ChevronRight,
  TrendingUp,
  BookOpen,
  MessageSquare,
  Send,
  X,
  Sparkles,
} from "lucide-react";

export default function TeacherClient() {
  const { userProfile, loading } = useAuth();
  const { showToast } = useToast();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classDetail, setClassDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Student feedback modal state
  const [feedbackStudent, setFeedbackStudent] = useState<any | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [pastFeedbacks, setPastFeedbacks] = useState<TeacherFeedbackItem[]>([]);
  const [loadingPastFeedbacks, setLoadingPastFeedbacks] = useState(false);

  const isTeacher =
    Boolean(userProfile?.isSuperAdmin) ||
    userProfile?.role === "teacher" ||
    userProfile?.role === "principal";

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const list = await getTeacherAssignedClasses();
      setClasses(list);
      if (list.length > 0 && !selectedClassId) {
        selectClass(list[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClasses(false);
    }
  };

  const selectClass = async (classId: string) => {
    setSelectedClassId(classId);
    setLoadingDetail(true);
    try {
      const detail = await getClassDetailForTeacher(classId);
      setClassDetail(detail);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openFeedbackModal = async (student: any) => {
    setFeedbackStudent(student);
    setFeedbackNote("");
    setLoadingPastFeedbacks(true);
    try {
      const history = await getStudentFeedbacks(student.userId);
      setPastFeedbacks(history);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPastFeedbacks(false);
    }
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackNote.trim() || !feedbackStudent) return;

    setSubmittingFeedback(true);
    const res = await addTeacherFeedback({
      studentUserId: feedbackStudent.userId,
      classId: selectedClassId || undefined,
      note: feedbackNote,
    });
    setSubmittingFeedback(false);

    if (res.success) {
      showToast(`${feedbackStudent.name} öğrencisine koçluk notu iletildi!`, "success");
      setFeedbackNote("");
      if (res.feedback) {
        setPastFeedbacks([res.feedback, ...pastFeedbacks]);
      }
    } else {
      showToast(res.error || "Geri bildirim gönderilemedi.", "error");
    }
  };

  useEffect(() => {
    if (isTeacher) {
      loadClasses();
    }
  }, [isTeacher]);

  if (loading) {
    return <div className="p-8 text-center text-[var(--text-subtle)]">Yükleniyor...</div>;
  }

  if (!isTeacher) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-4">
        <GraduationCap className="mx-auto text-amber-500" size={48} />
        <h2 className="text-xl font-bold text-[var(--text)]">Yetkisiz Erişim</h2>
        <p className="text-sm text-[var(--text-subtle)]">
          Bu sayfaya sadece öğretmen yetkisine sahip kullanıcılar erişebilir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      {loadingClasses ? (
        <div className="p-8 text-center text-sm text-[var(--text-subtle)]">Sınıflar yükleniyor...</div>
      ) : classes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
          <BookOpen className="mx-auto text-[var(--text-subtle)]" size={40} />
          <h3 className="font-bold text-base text-[var(--text)]">Henüz Bir Sınıfa Atanmadınız</h3>
          <p className="text-xs text-[var(--text-subtle)] max-w-md mx-auto">
            Okul müdürünüz henüz size bir sınıf yetkisi atamamış görünüyor. Lütfen okul yönetiminizle iletişime geçin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Class Sidebar Selector */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] px-1">
              Yetkili Sınıflarınız ({classes.length})
            </h2>
            <div className="space-y-1.5">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectClass(c.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left border transition cursor-pointer ${
                    selectedClassId === c.id
                      ? "bg-[var(--surface-2)] border-[var(--brand)] text-[var(--brand)] font-bold shadow-sm"
                      : "bg-[var(--surface)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <div>
                    <span className="block text-sm font-bold">{c.name}</span>
                    <span className="text-[11px] text-[var(--text-subtle)]">
                      {c.studentCount} Öğrenci • {c.grade}. Sınıf
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-[var(--text-subtle)]" />
                </button>
              ))}
            </div>
          </div>

          {/* Class Detail View */}
          <div className="lg:col-span-3 space-y-6">
            {loadingDetail ? (
              <div className="p-12 text-center text-sm text-[var(--text-subtle)]">
                Sınıf verileri yükleniyor...
              </div>
            ) : !classDetail ? (
              <div className="p-12 text-center text-sm text-[var(--text-subtle)]">
                Lütfen soldan bir sınıf seçin.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Class Header Banner */}
                <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[var(--text)]">
                        {classDetail.classInfo.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--text-subtle)] text-xs font-semibold">
                        {classDetail.classInfo.grade}. Sınıf {classDetail.classInfo.field && `• ${classDetail.classInfo.field}`}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-subtle)] mt-1">
                      Öğrenci Katılım Kodu: <strong className="font-mono text-[var(--brand)]">{classDetail.classInfo.joinCode}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-center">
                    <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] min-w-24">
                      <span className="text-[11px] text-[var(--text-subtle)] block">Öğrenci</span>
                      <span className="text-lg font-bold text-[var(--text)]">
                        {classDetail.students.length}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] min-w-24">
                      <span className="text-[11px] text-[var(--text-subtle)] block">Denemeler</span>
                      <span className="text-lg font-bold text-emerald-500">
                        {new Set(classDetail.examResults.map((r: any) => r.examId)).size}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Exam Results Table for this class */}
                <div className="space-y-3">
                  <h3 className="font-bold text-base text-[var(--text)] flex items-center gap-2">
                    <Award size={18} />
                    <span>Sınıfın Deneme Sonuçları</span>
                  </h3>

                  {classDetail.examResults.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[var(--text-subtle)] rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                      Bu sınıf için henüz okul denemesi sonucu girilmemiş.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--surface-2)] border-b border-[var(--border)] text-[var(--text-subtle)]">
                          <tr>
                            <th className="py-2.5 px-3">Deneme</th>
                            <th className="py-2.5 px-3">Tarih</th>
                            <th className="py-2.5 px-3">Öğrenci No & İsim</th>
                            <th className="py-2.5 px-3 text-center">Sınıf Sırası</th>
                            <th className="py-2.5 px-3 text-center">Okul Sırası</th>
                            <th className="py-2.5 px-3 text-right">Net</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {classDetail.examResults.map((r: any, idx: number) => (
                            <tr key={idx} className="hover:bg-[var(--surface-2)]">
                              <td className="py-2.5 px-3 font-semibold text-[var(--text)]">
                                {r.examName}
                                <span className="text-[10px] text-[var(--text-subtle)] ml-1.5 font-normal">
                                  ({r.examType})
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-[var(--text-subtle)]">{r.examDate}</td>
                              <td className="py-2.5 px-3">
                                <span className="font-mono text-[var(--brand)] font-bold mr-1.5">
                                  #{r.studentNumber}
                                </span>
                                <span className="font-medium text-[var(--text)]">{r.studentName}</span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-[var(--text)]">
                                {r.rankInClass ? `#${r.rankInClass}` : "-"}
                              </td>
                              <td className="py-2.5 px-3 text-center text-[var(--text-subtle)] font-medium">
                                #{r.rankInSchool}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-500 text-sm">
                                {r.totalNet}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Class Student Roster */}
                <div className="space-y-3">
                  <h3 className="font-bold text-base text-[var(--text)] flex items-center gap-2">
                    <Users size={18} />
                    <span>Sınıf Öğrenci Listesi ({classDetail.students.length})</span>
                  </h3>

                  {classDetail.students.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[var(--text-subtle)] rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                      Sınıfa katılmış öğrenci bulunmuyor.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {classDetail.students.map((s: any) => (
                        <div
                          key={s.memberId}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--brand)]">
                              #{s.studentNumber}
                            </span>
                            <div>
                              <span className="font-bold text-[var(--text)] block">{s.name}</span>
                              <span className="text-[11px] text-[var(--text-subtle)]">{s.email}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => openFeedbackModal(s)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] font-semibold border border-[var(--border)] transition cursor-pointer"
                          >
                            <MessageSquare size={13} className="text-[#2F6BFF]" />
                            <span>Koçluk Notu</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teacher Feedback Modal */}
      {feedbackStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#2F6BFF]/10 text-[#2F6BFF]">
                  <MessageSquare size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-base text-[var(--text)]">
                    Öğrenci Koçluk Notu
                  </h3>
                  <p className="text-xs text-[var(--text-subtle)]">
                    {feedbackStudent.name} (#{feedbackStudent.studentNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFeedbackStudent(null)}
                aria-label="Kapat"
                className="p-1 rounded-lg text-[var(--text-subtle)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Note form */}
            <form onSubmit={handleSendFeedback} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                  Öğrenciye İletilecek Not & Tavsiye
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Örn: Matematikte türev ve integral denemelerinde netlerin çok iyi, geometri üçgenler tekrarı yapmanı öneririm..."
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-strong)] text-sm text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[#2F6BFF] transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFeedbackStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback || !feedbackNote.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2F6BFF] hover:bg-[#4A80FF] text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                  <span>{submittingFeedback ? "Gönderiliyor..." : "Notu Kaydet & Öğrenciye İlet"}</span>
                </button>
              </div>
            </form>

            {/* Past notes */}
            <div className="border-t border-[var(--border)] pt-4 mt-2">
              <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Daha Önceki Notlar
              </h4>
              {loadingPastFeedbacks ? (
                <p className="text-xs text-[var(--text-subtle)] py-2">Yükleniyor...</p>
              ) : pastFeedbacks.length === 0 ? (
                <p className="text-xs text-[var(--text-subtle)] py-2">
                  Bu öğrenciye henüz koçluk notu yazılmamış.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pastFeedbacks.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-subtle)]">
                        <span className="font-semibold text-[var(--text)]">{f.teacherName || "Öğretmen"}</span>
                        <span>{new Date(f.createdAt).toLocaleDateString("tr-TR")}</span>
                      </div>
                      <p className="text-[var(--text)] leading-relaxed">{f.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
