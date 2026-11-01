"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  createClass,
  reviseSchoolClass,
  getSchoolClassRevisions,
  getSchoolClasses,
  getSchoolTeachersWithClasses,
  assignTeacherClasses,
  getSchoolExams,
  createTeacherAccount,
  getClassComparisonStats,
  type ClassPerformanceStat,
} from "@/server/actions/school";
import { getSchools } from "@/server/actions/admin";
import SchoolExamImport from "@/components/school/SchoolExamImport";
import type { ClassItem, SchoolExamRecord } from "@/types";
import {
  Building2,
  Users,
  Plus,
  Upload,
  Copy,
  Check,
  GraduationCap,
  Sparkles,
  Award,
  BarChart3,
} from "lucide-react";

type ActiveTab = "classes" | "teachers" | "upload" | "results" | "comparison";

export default function SchoolClient() {
  const { userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("classes");
  const [schoolAccessChecked, setSchoolAccessChecked] = useState(false);
  const [hasAvailableSchool, setHasAvailableSchool] = useState(true);

  // Classes state
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("12");
  const [newClassField, setNewClassField] = useState("SAY");
  const [classError, setClassError] = useState("");
  const [creatingClass, setCreatingClass] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editingClass,setEditingClass]=useState<ClassItem|null>(null);
  const [classEditError,setClassEditError]=useState("");
  const [savingClass,setSavingClass]=useState(false);
  const [classHistory,setClassHistory]=useState<Awaited<ReturnType<typeof getSchoolClassRevisions>>|null>(null);

  // Teachers state
  const [teachers, setTeachers] = useState<Awaited<ReturnType<typeof getSchoolTeachersWithClasses>>>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Awaited<ReturnType<typeof getSchoolTeachersWithClasses>>[number] | null>(null);
  const [selectedTeacherClassIds, setSelectedTeacherClassIds] = useState<string[]>([]);
  const [savingTeacherAssignment, setSavingTeacherAssignment] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");

  // Add teacher state
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherTitle, setTeacherTitle] = useState("");
  const [teacherError, setTeacherError] = useState("");
  const [creatingTeacher, setCreatingTeacher] = useState(false);
  const [createdTeacherCreds, setCreatedTeacherCreds] = useState<{
    email: string;
    password: string;
    name: string;
  } | null>(null);
  const [copiedTeacherCreds, setCopiedTeacherCreds] = useState(false);

  // Exams / Results state
  const [exams, setExams] = useState<SchoolExamRecord[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);

  // Comparison state
  const [comparisonStats, setComparisonStats] = useState<ClassPerformanceStat[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  const isPrincipal =
    Boolean(userProfile?.isSuperAdmin) || userProfile?.role === "principal";

  const loadClasses = async () => {
    setClassesLoading(true);
    try {
      const list = await getSchoolClasses();
      setClasses(list);
    } catch (e) {
      console.error(e);
    } finally {
      setClassesLoading(false);
    }
  };

  const loadTeachers = async () => {
    setTeachersLoading(true);
    try {
      const list = await getSchoolTeachersWithClasses();
      setTeachers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setTeachersLoading(false);
    }
  };

  const loadExams = async () => {
    setExamsLoading(true);
    try {
      const list = await getSchoolExams();
      setExams(list);
    } catch (e) {
      console.error(e);
    } finally {
      setExamsLoading(false);
    }
  };

  useEffect(() => {
    if (loading || !isPrincipal) return;
    let active = true;
    void Promise.all([getSchoolClasses(), userProfile?.isSuperAdmin ? getSchools() : Promise.resolve(null)])
      .then(([list, schools]) => {
        if (!active) return;
        setHasAvailableSchool(schools === null || schools.length > 0);
        setClasses(list);
        setSchoolAccessChecked(true);
        setClassesLoading(false);
      });
    return () => { active = false; };
  }, [isPrincipal, loading, userProfile?.isSuperAdmin]);

  useEffect(() => {
    if (!isPrincipal || !schoolAccessChecked || !hasAvailableSchool) return;
    if (activeTab === "teachers") void getSchoolTeachersWithClasses().then(setTeachers).finally(() => setTeachersLoading(false));
    if (activeTab === "results") void getSchoolExams().then(setExams).finally(() => setExamsLoading(false));
    if (activeTab === "comparison") void getClassComparisonStats().then(setComparisonStats).finally(() => setComparisonLoading(false));
  }, [activeTab, hasAvailableSchool, isPrincipal, schoolAccessChecked]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      setClassError("Sınıf adı zorunludur.");
      return;
    }
    setClassError("");
    setCreatingClass(true);
    const res = await createClass({
      name: newClassName,
      grade: newClassGrade,
      field: newClassField || undefined,
    });
    setCreatingClass(false);
    if (!res.success) {
      setClassError(res.error || "Sınıf oluşturulamadı.");
      return;
    }
    setNewClassName("");
    setShowAddClass(false);
    loadClasses();
  };

  const handleReviseClass=async(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();if(!editingClass)return;const form=new FormData(e.currentTarget);setSavingClass(true);setClassEditError("");
    try{await reviseSchoolClass({classId:editingClass.id,name:String(form.get("name")),grade:String(form.get("grade")),field:String(form.get("field")),reason:String(form.get("reason"))});setEditingClass(null);await loadClasses();}
    catch(error){setClassEditError(error instanceof Error?error.message:"Sınıf güncellenemedi.");}finally{setSavingClass(false);}
  };

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSaveTeacherAssignment = async () => {
    if (!editingTeacher) return;
    setSavingTeacherAssignment(true);
    setAssignmentError("");
    try {
      const result = await assignTeacherClasses({ teacherId: editingTeacher.userId, classIds: selectedTeacherClassIds });
      if (!result.success) { setAssignmentError(result.error || "Atama kaydedilemedi."); return; }
      setEditingTeacher(null);
      await loadTeachers();
    } catch { setAssignmentError("Atama kaydedilemedi. Yeniden deneyin."); }
    finally { setSavingTeacherAssignment(false); }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !teacherEmail.trim()) {
      setTeacherError("Ad Soyad ve E-posta zorunludur.");
      return;
    }
    setTeacherError("");
    setCreatingTeacher(true);
    const res = await createTeacherAccount({
      name: teacherName,
      email: teacherEmail,
      title: teacherTitle || undefined,
    });
    setCreatingTeacher(false);
    if (!res.success) {
      setTeacherError(res.error || "Öğretmen hesabı oluşturulamadı.");
      return;
    }
    if (res.credentials) {
      setCreatedTeacherCreds(res.credentials);
    }
    setTeacherName("");
    setTeacherEmail("");
    setTeacherTitle("");
    setShowAddTeacher(false);
    loadTeachers();
  };

  const copyTeacherCreds = () => {
    if (!createdTeacherCreds) return;
    const text = `Puaniz Öğretmen Giriş Bilgileri:\nAd: ${createdTeacherCreds.name}\nE-posta: ${createdTeacherCreds.email}\nŞifre: ${createdTeacherCreds.password}\nGiriş URL: ${window.location.origin}/auth`;
    navigator.clipboard.writeText(text);
    setCopiedTeacherCreds(true);
    setTimeout(() => setCopiedTeacherCreds(false), 2500);
  };

  if (loading || (isPrincipal && !schoolAccessChecked)) {
    return <div className="p-8 text-center text-[var(--text-subtle)]">Yükleniyor...</div>;
  }

  if (!isPrincipal) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-4">
        <Building2 className="mx-auto text-amber-500" size={48} />
        <h2 className="text-xl font-bold text-[var(--text)]">Yetkisiz Erişim</h2>
        <p className="text-sm text-[var(--text-subtle)]">
          Bu sayfaya sadece Okul Müdürü yetkisine sahip kullanıcılar erişebilir.
        </p>
      </div>
    );
  }

  if (!hasAvailableSchool) {
    return (
      <div className="max-w-lg mx-auto mt-16 p-7 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-4">
        <Building2 className="mx-auto text-[var(--link)]" size={44} />
        <h2 className="text-xl font-bold text-[var(--text)]">Henüz okul oluşturulmamış</h2>
        <p className="text-sm leading-6 text-[var(--text-muted)]">
          Okul yönetimi panelini kullanmak için önce uygulama yönetiminden bir okul oluşturun.
        </p>
        <a href="/dashboard/admin" className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-bold text-white hover:opacity-90">
          Uygulama yönetimine git
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("classes")}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "classes"
              ? "border-[var(--brand)] text-[var(--brand)]"
              : "border-transparent text-[var(--text-subtle)] hover:text-[var(--text)]"
          }`}
        >
          <GraduationCap size={18} />
          <span>Sınıflar & Kodlar ({classes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("teachers")}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "teachers"
              ? "border-[var(--brand)] text-[var(--brand)]"
              : "border-transparent text-[var(--text-subtle)] hover:text-[var(--text)]"
          }`}
        >
          <Users size={18} />
          <span>Öğretmen Yetkilendirme</span>
        </button>

        <button
          onClick={() => setActiveTab("upload")}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "upload"
              ? "border-[var(--brand)] text-[var(--brand)]"
              : "border-transparent text-[var(--text-subtle)] hover:text-[var(--text)]"
          }`}
        >
          <Upload size={18} />
          <span>Toplu Deneme Yükle</span>
        </button>

        <button
          onClick={() => setActiveTab("results")}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "results"
              ? "border-[var(--brand)] text-[var(--brand)]"
              : "border-transparent text-[var(--text-subtle)] hover:text-[var(--text)]"
          }`}
        >
          <Award size={18} />
          <span>Deneme Sonuçları</span>
        </button>

        <button
          onClick={() => setActiveTab("comparison")}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "comparison"
              ? "border-[var(--brand)] text-[var(--brand)]"
              : "border-transparent text-[var(--text-subtle)] hover:text-[var(--text)]"
          }`}
        >
          <BarChart3 size={18} />
          <span>Sınıf Başarı Analizi</span>
        </button>
      </div>

      {/* ── TAB 1: CLASSES ──────────────────────────────────────────────── */}
      {activeTab === "classes" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-[var(--text)]">Mevcut Sınıflar</h2>
            <button
              onClick={() => setShowAddClass(!showAddClass)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold hover:opacity-90 transition cursor-pointer"
            >
              <Plus size={16} />
              <span>Yeni Sınıf Aç</span>
            </button>
          </div>

          {/* Add Class Form */}
          {showAddClass && (
            <form
              onSubmit={handleCreateClass}
              className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4"
            >
              <h3 className="font-bold text-sm text-[var(--text)]">Yeni Sınıf Bilgileri</h3>
              {classError && (
                <div className="p-3 text-xs bg-red-500/10 text-red-500 rounded-xl">
                  {classError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-subtle)] mb-1">
                    Sınıf Adı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: 12-A, 11-B, Mezun-SAY"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-subtle)] mb-1">
                    Kademe *
                  </label>
                  <select
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
                  >
                    <option value="12">12. Sınıf</option>
                    <option value="11">11. Sınıf</option>
                    <option value="10">10. Sınıf</option>
                    <option value="9">9. Sınıf</option>
                    <option value="Mezun">Mezun</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-subtle)] mb-1">
                    Alan
                  </label>
                  <select
                    value={newClassField}
                    onChange={(e) => setNewClassField(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
                  >
                    <option value="SAY">Sayısal (SAY)</option>
                    <option value="EA">Eşit Ağırlık (EA)</option>
                    <option value="SÖZ">Sözel (SÖZ)</option>
                    <option value="DİL">Dil (DİL)</option>
                    <option value="GENEL">Genel</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddClass(false)}
                  className="px-4 py-1.5 rounded-xl text-xs text-[var(--text-subtle)] hover:text-[var(--text)] cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={creatingClass}
                  className="px-4 py-1.5 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {creatingClass ? "Oluşturuluyor..." : "Sınıfı Oluştur"}
                </button>
              </div>
            </form>
          )}

          {/* Classes Cards Grid */}
          {classesLoading ? (
            <div className="p-8 text-center text-sm text-[var(--text-subtle)]">Sınıflar yükleniyor...</div>
          ) : classes.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
              <GraduationCap className="mx-auto text-[var(--text-subtle)]" size={40} />
              <p className="text-sm text-[var(--text-subtle)]">Henüz oluşturulmuş bir sınıf yok.</p>
              <button
                onClick={() => setShowAddClass(true)}
                className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold cursor-pointer"
              >
                İlk Sınıfı Oluştur
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-[var(--text)]">{c.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--text-subtle)] text-xs font-semibold">
                        {c.grade}. Sınıf {c.field && `• ${c.field}`}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-subtle)] mt-1">
                      Kayıtlı Öğrenci: <strong className="text-[var(--text)]">{c.studentCount}</strong>
                    </p>
                  </div>
                  <button onClick={()=>setEditingClass(c)} className="px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text)]">Sınıf bilgilerini düzenle</button>
                  <button onClick={()=>void getSchoolClassRevisions(c.id).then(setClassHistory)} className="px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text)]">Değişiklik geçmişi</button>

                  {/* Join Code Display */}
                  <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[var(--text-subtle)] uppercase tracking-wider block font-bold">
                        Öğrenci Katılım Kodu
                      </span>
                      <span className="font-mono font-bold text-sm text-[var(--brand)] tracking-wider">
                        {c.joinCode}
                      </span>
                    </div>
                    <button
                      onClick={() => copyJoinCode(c.joinCode)}
                      className="p-2 rounded-lg bg-[var(--surface)] text-[var(--text-subtle)] hover:text-[var(--text)] border border-[var(--border)] transition cursor-pointer"
                      title="Kodu Kopyala"
                    >
                      {copiedCode === c.joinCode ? (
                        <Check size={16} className="text-emerald-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>

                  <Link
                    href={`/dashboard/principal/students?classId=${c.id}`}
                    className="block w-full py-2 text-center rounded-xl bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--border)] transition cursor-pointer"
                  >
                    Öğrenci Listesi ({c.studentCount})
                  </Link>
                </div>
              ))}
            </div>
          )}

          {editingClass&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><form onSubmit={handleReviseClass} className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4"><h2 className="text-lg font-bold">Sınıf bilgilerini düzenle</h2>{classEditError&&<p role="alert">{classEditError}</p>}<label className="block text-sm">Sınıf adı<input name="name" required maxLength={100} defaultValue={editingClass.name} className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"/></label><label className="block text-sm">Kademe<input name="grade" required maxLength={20} defaultValue={editingClass.grade} className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"/></label><label className="block text-sm">Alan<input name="field" maxLength={30} defaultValue={editingClass.field||""} className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"/></label><label className="block text-sm">Değişiklik gerekçesi<input name="reason" required maxLength={500} className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"/></label><div className="flex justify-end gap-2"><button type="button" onClick={()=>setEditingClass(null)} className="rounded-xl border border-[var(--border)] px-4 py-2">Vazgeç</button><button disabled={savingClass} className="rounded-xl bg-[var(--brand)] px-4 py-2 text-white">{savingClass?"Kaydediliyor…":"Gerekçeli kaydet"}</button></div></form></div>}
          {classHistory&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={()=>setClassHistory(null)}><div role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()} className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3"><div className="flex justify-between"><h2 className="text-lg font-bold">Sınıf değişiklik geçmişi</h2><button onClick={()=>setClassHistory(null)}>Kapat</button></div>{classHistory.length?classHistory.map(row=><article key={row.id} className="rounded-xl border border-[var(--border)] p-4"><strong>{row.action} · {row.actorName||"Silinmiş kullanıcı"}</strong><p>{new Date(row.createdAt).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul"})} · {row.reason}</p>{row.before&&<p>Önce: {JSON.stringify(row.before)}</p>}{row.after&&<p>Sonra: {JSON.stringify(row.after)}</p>}</article>):<p>Henüz değişiklik kaydı yok.</p>}</div></div>}

        </div>
      )}

      {/* ── TAB 2: TEACHERS ─────────────────────────────────────────────── */}
      {activeTab === "teachers" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text)]">Öğretmenler & Sınıf Yetkileri</h2>
              <p className="text-xs text-[var(--text-subtle)] mt-0.5">
                Okulunuzun öğretmen hesaplarını oluşturun ve hangi sınıfları görebileceklerini yetkilendirin.
              </p>
            </div>
            <button
              onClick={() => setShowAddTeacher(!showAddTeacher)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold hover:opacity-90 transition cursor-pointer self-start sm:self-auto"
            >
              <Plus size={16} />
              <span>Yeni Öğretmen Ekle</span>
            </button>
          </div>

          {/* Generated Teacher Credentials Banner */}
          {createdTeacherCreds && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[var(--text)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-500 text-xs flex items-center gap-1.5">
                  <Sparkles size={16} />
                  Öğretmen Hesabı Başarıyla Oluşturuldu! Bilgileri Öğretmeninize İletin
                </span>
                <button
                  onClick={() => setCreatedTeacherCreds(null)}
                  className="text-xs text-[var(--text-subtle)] hover:text-[var(--text)] cursor-pointer"
                >
                  Kapat
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)] text-xs">
                <div>
                  <span className="text-[10px] text-[var(--text-subtle)] block">Öğretmen</span>
                  <span className="font-semibold">{createdTeacherCreds.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-subtle)] block">E-posta</span>
                  <span className="font-mono text-xs">{createdTeacherCreds.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-subtle)] block">Şifre</span>
                  <span className="font-mono font-bold text-emerald-500 text-sm">{createdTeacherCreds.password}</span>
                </div>
              </div>
              <button
                onClick={copyTeacherCreds}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-semibold cursor-pointer"
              >
                {copiedTeacherCreds ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedTeacherCreds ? "Kopyalandı!" : "Giriş Bilgilerini Kopyala"}</span>
              </button>
            </div>
          )}

          {/* Add Teacher Form */}
          {showAddTeacher && (
            <form
              onSubmit={handleCreateTeacher}
              className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[var(--text)]">Yeni Öğretmen Hesabı Aç</h3>
                <button
                  type="button"
                  onClick={() => setShowAddTeacher(false)}
                  className="text-xs text-[var(--text-subtle)] cursor-pointer"
                >
                  İptal
                </button>
              </div>

              {teacherError && (
                <div className="p-3 text-xs bg-red-500/10 text-red-500 rounded-xl">
                  {teacherError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-subtle)] mb-1">
                    Öğretmen Adı Soyadı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ayşe Demir"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-subtle)] mb-1">
                    E-posta Adresi *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Örn: ayse@okul.com"
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-subtle)] mb-1">
                    Branş / Ünvan
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Matematik, Fizik, Rehberlik"
                    value={teacherTitle}
                    onChange={(e) => setTeacherTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddTeacher(false)}
                  className="px-4 py-1.5 rounded-xl text-xs text-[var(--text-subtle)] cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={creatingTeacher}
                  className="px-4 py-1.5 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {creatingTeacher ? "Hesap Oluşturuluyor..." : "Öğretmeni Kaydet ve Şifre Üret"}
                </button>
              </div>
            </form>
          )}

          {teachersLoading ? (
            <div className="p-8 text-center text-sm text-[var(--text-subtle)]">Yükleniyor...</div>
          ) : teachers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <Users className="mx-auto text-[var(--text-subtle)]" size={40} />
              <p className="text-sm text-[var(--text-subtle)] mt-2">
                Okulunuzda henüz kayıtlı öğretmen bulunmuyor.
              </p>
              <p className="text-xs text-[var(--text-subtle)] mt-1">
                Sistem Yöneticinizle iletişime geçerek öğretmen hesapları oluşturabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teachers.map((t) => (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-[var(--text)] text-base">{t.name}</h3>
                        <span className="text-xs text-[var(--text-subtle)]">{t.email}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 text-xs font-semibold">
                        {t.title || "Öğretmen"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <span className="text-xs font-semibold text-[var(--text-subtle)] block mb-1.5">
                        Yetkili Olduğu Sınıflar:
                      </span>
                      {t.assignedClasses.length === 0 ? (
                        <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                          Atanmış sınıf yok
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {t.assignedClasses.map((ac) => (
                            <span
                              key={ac.classId}
                              className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--text)] font-semibold text-xs border border-[var(--border)]"
                            >
                              {ac.className}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setAssignmentError("");
                      setEditingTeacher(t);
                      setSelectedTeacherClassIds(t.assignedClasses.map((c) => c.classId));
                    }}
                    className="block w-full py-2 text-center rounded-xl bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--border)] transition cursor-pointer"
                  >
                    Sınıf Yetkilerini Düzenle
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Teacher Assignment Modal */}
          {editingTeacher && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <h3 className="font-bold text-base text-[var(--text)]">
                      {editingTeacher.name} - Sınıf Seçimi
                    </h3>
                    <span className="text-xs text-[var(--text-subtle)]">
                      Bu öğretmenin görebileceği sınıfları işaretleyin
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingTeacher(null)}
                    className="text-sm text-[var(--text-subtle)] cursor-pointer"
                  >
                    İptal
                  </button>
                </div>

                {assignmentError && <p role="alert" className="text-[var(--err)]">{assignmentError}</p>}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {classes.map((c) => {
                    const checked = selectedTeacherClassIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] cursor-pointer hover:bg-[var(--border)] transition"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTeacherClassIds([...selectedTeacherClassIds, c.id]);
                            } else {
                              setSelectedTeacherClassIds(
                                selectedTeacherClassIds.filter((id) => id !== c.id),
                              );
                            }
                          }}
                          className="w-4 h-4 rounded text-[var(--brand)]"
                        />
                        <span className="font-semibold text-sm text-[var(--text)]">{c.name}</span>
                        <span className="text-xs text-[var(--text-subtle)]">
                          ({c.grade}. Sınıf {c.field})
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingTeacher(null)}
                    className="px-4 py-2 rounded-xl text-xs text-[var(--text-subtle)] cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleSaveTeacherAssignment}
                    disabled={savingTeacherAssignment}
                    className="px-5 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {savingTeacherAssignment ? "Kaydediliyor..." : "Yetkileri Kaydet"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: BULK EXAM UPLOAD ─────────────────────────────────────── */}
      {activeTab === "upload" && <SchoolExamImport classes={classes} onUploaded={() => { void loadExams(); }} />}

      {/* ── TAB 4: RESULTS ─────────────────────────────────────────────── */}
      {activeTab === "results" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-[var(--text)]">Geçmiş Okul Denemeleri</h2>
            <p className="text-xs text-[var(--text-subtle)]">
              Yüklenen deneme sınavları, katılım sayıları ve okul sıralamaları.
            </p>
          </div>

          {examsLoading ? (
            <div className="p-8 text-center text-sm text-[var(--text-subtle)]">Yükleniyor...</div>
          ) : exams.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
              <Award className="mx-auto text-[var(--text-subtle)]" size={40} />
              <p className="text-sm text-[var(--text-subtle)]">Henüz okul denemesi yüklenmemiş.</p>
              <button
                onClick={() => setActiveTab("upload")}
                className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold cursor-pointer"
              >
                İlk Denemeyi Yükle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((e) => (
                <div
                  key={e.id}
                  className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-xs font-bold">
                        {e.type}
                      </span>
                      <span className="text-xs text-[var(--text-subtle)]">{e.date}</span>
                    </div>

                    <h3 className="font-bold text-base text-[var(--text)] mt-2">{e.name}</h3>

                    <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-[var(--surface-2)] text-center text-xs">
                      <div>
                        <span className="text-[var(--text-subtle)] block">Katılımcı</span>
                        <span className="font-bold text-[var(--text)] text-sm">{e.totalParticipants}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-subtle)] block">Okul Ort. Net</span>
                        <span className="font-bold text-emerald-500 text-sm">{e.averageNet}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/principal/data?examId=${e.id}`}
                    className="block w-full py-2 text-center rounded-xl bg-[var(--brand)] text-xs font-semibold text-white hover:opacity-90 transition cursor-pointer"
                  >
                    Sonuç Tablosunu İncele
                  </Link>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ── TAB 5: CLASS COMPARISON & ANALYTICS ─────────────────────────── */}
      {activeTab === "comparison" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[var(--text)]">Sınıflar Arası Başarı Analizi</h2>
              <p className="text-xs text-[var(--text-subtle)]">
                Okulunuzdaki sınıfların deneme sınavlarındaki ortalama netleri ve başarı dağılımı.
              </p>
            </div>
          </div>

          {comparisonLoading ? (
            <div className="p-8 text-center text-sm text-[var(--text-subtle)]">Analizler yükleniyor...</div>
          ) : comparisonStats.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
              <BarChart3 className="mx-auto text-[var(--text-subtle)]" size={40} />
              <p className="text-sm text-[var(--text-subtle)]">Henüz karşılaştırılacak sınıf verisi bulunamadı.</p>
              <p className="text-xs text-[var(--text-subtle)]">
                Öğrenciler sınıflara katıldıkça ve deneme sonuçları yüklendikçe burada sınıflar arası karşılaştırmalar oluşacaktır.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Comparative Ranking Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparisonStats
                  .sort((a, b) => b.averageNet - a.averageNet)
                  .map((item, index) => (
                    <div
                      key={item.classId}
                      className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-[var(--surface-2)] text-[var(--text)]">
                            {index === 0 ? "🥇 En Başarılı Sınıf" : `#${index + 1} Sırada`}
                          </span>
                          <span className="text-xs font-semibold text-[var(--text-subtle)]">
                            {item.grade}. Sınıf {item.field ? `· ${item.field}` : ""}
                          </span>
                        </div>

                        <h3 className="font-black text-lg text-[var(--text)] mt-2">
                          {item.className}
                        </h3>

                        <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-[var(--surface-2)] text-center text-xs">
                          <div>
                            <span className="text-[10px] text-[var(--text-subtle)] block">Öğrenci</span>
                            <span className="font-bold text-[var(--text)] text-sm">{item.studentCount}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[var(--text-subtle)] block">Deneme</span>
                            <span className="font-bold text-[var(--text)] text-sm">{item.examCount}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[var(--text-subtle)] block">Ort. Net</span>
                            <span className="font-bold text-emerald-500 text-sm">{item.averageNet}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar visual */}
                      <div>
                        <div className="w-full h-2 rounded-full bg-[var(--surface-3)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#2F6BFF] transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(5, (item.averageNet / 120) * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--text-subtle)] block text-right mt-1">
                          120 Net Üzerinden %{((item.averageNet / 120) * 100).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
