"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  createSchool,
  getSchools,
  createStaffAccount,
  getSchoolStaffAndClasses,
  deleteSchool,
  removeStaffMember,
} from "@/server/actions/admin";
import type { School } from "@/types";
import {
  Building2,
  Plus,
  UserPlus,
  Copy,
  Check,
  ShieldCheck,
  Users,
  GraduationCap,
  Sparkles,
  Search,
  Trash2,
} from "lucide-react";

export default function AdminClient() {
  const { userProfile, loading } = useAuth();

  const [schools, setSchools] = useState<School[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // School creation state
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [schoolCity, setSchoolCity] = useState("");
  const [schoolDistrict, setSchoolDistrict] = useState("");
  const [schoolError, setSchoolError] = useState("");
  const [creatingSchool, setCreatingSchool] = useState(false);

  // Staff creation state
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState<"principal" | "teacher">("principal");
  const [staffTitle, setStaffTitle] = useState("");
  const [staffError, setStaffError] = useState("");
  const [creatingStaff, setCreatingStaff] = useState(false);

  // Generated credentials display
  const [generatedCreds, setGeneratedCreds] = useState<{
    email: string;
    password: string;
    name: string;
    role: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // School inspect state
  const [inspectedSchool, setInspectedSchool] = useState<any>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  const isSuperAdmin = Boolean(userProfile?.isSuperAdmin);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const list = await getSchools();
      setSchools(list);
      if (list.length > 0 && !selectedSchoolId) {
        setSelectedSchoolId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) {
      setSchoolError("Okul adı zorunludur.");
      return;
    }
    setSchoolError("");
    setCreatingSchool(true);
    const res = await createSchool({
      name: schoolName,
      code: schoolCode || undefined,
      city: schoolCity || undefined,
      district: schoolDistrict || undefined,
    });
    setCreatingSchool(false);
    if (!res.success) {
      setSchoolError(res.error || "Okul oluşturulamadı.");
      return;
    }
    setSchoolName("");
    setSchoolCode("");
    setSchoolCity("");
    setSchoolDistrict("");
    setShowAddSchool(false);
    loadData();
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) {
      setStaffError("Lütfen bir okul seçin.");
      return;
    }
    if (!staffName.trim() || !staffEmail.trim()) {
      setStaffError("Ad Soyad ve E-posta zorunludur.");
      return;
    }
    setStaffError("");
    setCreatingStaff(true);
    const res = await createStaffAccount({
      schoolId: selectedSchoolId,
      name: staffName,
      email: staffEmail,
      role: staffRole,
      title: staffTitle || undefined,
    });
    setCreatingStaff(false);
    if (!res.success) {
      setStaffError(res.error || "Hesap oluşturulamadı.");
      return;
    }
    if (res.credentials) {
      setGeneratedCreds(res.credentials);
    }
    setStaffName("");
    setStaffEmail("");
    setStaffTitle("");
    setShowAddStaff(false);
    loadData();
  };

  const handleInspect = async (schoolId: string) => {
    setInspectLoading(true);
    const details = await getSchoolStaffAndClasses(schoolId);
    setInspectedSchool(details);
    setInspectLoading(false);
  };

  const handleDeleteSchool = async (schoolId: string, name: string) => {
    if (!window.confirm(`"${name}" okulunu ve tüm sınıf/deneme verilerini silmek istediğinize emin misiniz?`)) {
      return;
    }
    const res = await deleteSchool(schoolId);
    if (res.success) {
      if (inspectedSchool?.school?.id === schoolId) setInspectedSchool(null);
      loadData();
    }
  };

  const handleRemoveStaff = async (memberId: string, schoolId: string) => {
    if (!window.confirm("Bu yetkilinin okul görevini kaldırmak istediğinize emin misiniz?")) {
      return;
    }
    const res = await removeStaffMember(memberId);
    if (res.success) {
      handleInspect(schoolId);
      loadData();
    }
  };

  const totalClasses = schools.reduce((acc, s) => acc + (s.classCount ?? 0), 0);
  const totalTeachers = schools.reduce((acc, s) => acc + (s.teacherCount ?? 0), 0);
  const totalStudents = schools.reduce((acc, s) => acc + (s.studentCount ?? 0), 0);

  const filteredSchools = schools.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.city && s.city.toLowerCase().includes(q)) ||
      (s.district && s.district.toLowerCase().includes(q))
    );
  });

  const copyCreds = () => {
    if (!generatedCreds) return;
    const text = `Puaniz Okul Giriş Bilgileri:\nRol: ${generatedCreds.role}\nAd: ${generatedCreds.name}\nE-posta: ${generatedCreds.email}\nŞifre: ${generatedCreds.password}\nGiriş URL: ${window.location.origin}/auth`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[var(--text-subtle)]">Yükleniyor...</div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-4">
        <ShieldCheck className="mx-auto text-amber-500" size={48} />
        <h2 className="text-xl font-bold text-[var(--text)]">Yetkisiz Erişim</h2>
        <p className="text-sm text-[var(--text-subtle)]">
          Bu sayfaya yalnızca yönetici e-posta adresine sahip kullanıcılar erişebilir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowAddSchool(true);
              setShowAddStaff(false);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold hover:opacity-90 transition cursor-pointer"
          >
            <Plus size={18} />
            <span>Okul Ekle</span>
          </button>
          <button
            onClick={() => {
              setShowAddStaff(true);
              setShowAddSchool(false);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] text-sm font-semibold border border-[var(--border)] hover:bg-[var(--surface)] transition cursor-pointer"
          >
            <UserPlus size={18} />
            <span>Okul Müdürü Ata</span>
          </button>
        </div>
      </div>

      {/* Generated Credentials Popup/Banner */}
      {generatedCreds && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[var(--text)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-500 text-sm">
              <Sparkles size={18} />
              <span>Hesap Başarıyla Oluşturuldu! Bilgileri Kopyalayın</span>
            </div>
            <button
              onClick={() => setGeneratedCreds(null)}
              className="text-xs text-[var(--text-subtle)] hover:text-[var(--text)] cursor-pointer"
            >
              Kapat
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[var(--surface)] p-3.5 rounded-xl border border-[var(--border)] text-sm">
            <div>
              <span className="text-xs text-[var(--text-subtle)] block">Rol & İsim</span>
              <span className="font-semibold">{generatedCreds.role} - {generatedCreds.name}</span>
            </div>
            <div>
              <span className="text-xs text-[var(--text-subtle)] block">E-posta</span>
              <span className="font-mono text-xs">{generatedCreds.email}</span>
            </div>
            <div>
              <span className="text-xs text-[var(--text-subtle)] block">Üretilen Şifre</span>
              <span className="font-mono font-bold text-emerald-500 text-sm">{generatedCreds.password}</span>
            </div>
            <div className="flex items-end">
              <button
                onClick={copyCreds}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-semibold cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? "Kopyalandı!" : "Bilgileri Kopyala"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add School Modal Form */}
      {showAddSchool && (
        <form
          onSubmit={handleCreateSchool}
          className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-[var(--text)]">Yeni Okul Oluştur</h3>
            <button
              type="button"
              onClick={() => setShowAddSchool(false)}
              className="text-sm text-[var(--text-subtle)] cursor-pointer"
            >
              İptal
            </button>
          </div>

          {schoolError && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
              {schoolError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-subtle)] mb-1">
                Okul Adı *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Atatürk Anadolu Lisesi"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-subtle)] mb-1">
                Özel Okul Kodu (Opsiyonel)
              </label>
              <input
                type="text"
                placeholder="Boş bırakılırsa otomatik üretilir"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-subtle)] mb-1">
                İl
              </label>
              <input
                type="text"
                placeholder="Örn: İstanbul"
                value={schoolCity}
                onChange={(e) => setSchoolCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-subtle)] mb-1">
                İlçe
              </label>
              <input
                type="text"
                placeholder="Örn: Kadıköy"
                value={schoolDistrict}
                onChange={(e) => setSchoolDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={creatingSchool}
              className="px-5 py-2 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              {creatingSchool ? "Oluşturuluyor..." : "Okulu Kaydet"}
            </button>
          </div>
        </form>
      )}

      {/* Add Staff Modal Form */}
      {showAddStaff && (
        <form
          onSubmit={handleCreateStaff}
          className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-[var(--text)]">
              Okul Müdürü Hesabı Oluştur
            </h3>
            <button
              type="button"
              onClick={() => setShowAddStaff(false)}
              className="text-sm text-[var(--text-subtle)] cursor-pointer"
            >
              İptal
            </button>
          </div>

          {staffError && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
              {staffError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-subtle)] mb-1">
                Ait Olduğu Okul *
              </label>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-subtle)] mb-1">
                Rol *
              </label>
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as "principal" | "teacher")}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
              >
                <option value="principal">Okul Müdürü (Tam Yetkili)</option>
                <option value="teacher">Öğretmen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-subtle)] mb-1">
                Yetkili Ad Soyad *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Ahmet Yılmaz"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-subtle)] mb-1">
                E-posta Adresi *
              </label>
              <input
                type="email"
                required
                placeholder="Örn: mudur@okul.k12.tr"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-subtle)] mb-1">
                Ünvan / Branş (Opsiyonel)
              </label>
              <input
                type="text"
                placeholder="Örn: Okul Müdürü, Müdür Yardımcısı, Matematik Öğretmeni"
                value={staffTitle}
                onChange={(e) => setStaffTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={creatingStaff}
              className="px-5 py-2 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              {creatingStaff ? "Hesap Açılıyor..." : "Müdür Hesabı ve Şifre Üret"}
            </button>
          </div>
        </form>
      )}

      {/* System KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] block">
            Toplam Okul
          </span>
          <span className="text-3xl font-black text-[var(--text)] mt-1 block">{schools.length}</span>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] block">
            Toplam Sınıf
          </span>
          <span className="text-3xl font-black text-[var(--brand)] mt-1 block">{totalClasses}</span>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] block">
            Yetkili & Öğretmen
          </span>
          <span className="text-3xl font-black text-purple-500 mt-1 block">{totalTeachers}</span>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] block">
            Kayıtlı Öğrenci
          </span>
          <span className="text-3xl font-black text-emerald-500 mt-1 block">{totalStudents}</span>
        </div>
      </div>

      {/* Schools List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <Building2 size={20} />
            <span>Kayıtlı Okullar ({filteredSchools.length})</span>
          </h2>
          {schools.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
              />
              <input
                type="text"
                placeholder="Okul adı, kod veya şehir ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[var(--brand)]"
              />
            </div>
          )}
        </div>

        {dataLoading ? (
          <div className="p-8 text-center text-sm text-[var(--text-subtle)]">Okullar yükleniyor...</div>
        ) : filteredSchools.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
            <Building2 className="mx-auto text-[var(--text-subtle)]" size={40} />
            <p className="text-sm text-[var(--text-subtle)]">
              {searchQuery ? "Aramaya uygun okul bulunamadı." : "Henüz kayıtlı okul bulunmuyor."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddSchool(true)}
                className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold cursor-pointer"
              >
                İlk Okulu Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchools.map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-[var(--text)] text-base">{s.name}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--text-subtle)] font-mono text-xs">
                      {s.code}
                    </span>
                  </div>

                  {(s.city || s.district) && (
                    <p className="text-xs text-[var(--text-subtle)] mt-1">
                      {[s.district, s.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--border)] text-center text-xs">
                  <div>
                    <span className="text-[var(--text-subtle)] block">Sınıflar</span>
                    <span className="font-bold text-[var(--text)]">{s.classCount ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-subtle)] block">Öğretmenler</span>
                    <span className="font-bold text-[var(--text)]">{s.teacherCount ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-subtle)] block">Öğrenciler</span>
                    <span className="font-bold text-[var(--text)]">{s.studentCount ?? 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleInspect(s.id)}
                    className="flex-1 py-1.5 rounded-xl bg-[var(--surface-2)] text-xs font-medium text-[var(--text)] hover:bg-[var(--border)] transition cursor-pointer"
                  >
                    Detayları İncele
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSchoolId(s.id);
                      setShowAddStaff(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[var(--brand)] text-xs font-medium text-white hover:opacity-90 transition cursor-pointer"
                    title="Yetkili Ekle"
                  >
                    + Yetkili
                  </button>
                  <button
                    onClick={() => handleDeleteSchool(s.id, s.name)}
                    className="p-1.5 rounded-xl bg-[var(--err-bg)] text-[var(--err)] hover:opacity-80 transition cursor-pointer"
                    title="Okulu Sil"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {inspectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="font-bold text-lg text-[var(--text)]">
                  {inspectedSchool.school.name}
                </h3>
                <span className="text-xs text-[var(--text-subtle)] font-mono">
                  Kod: {inspectedSchool.school.code}
                </span>
              </div>
              <button
                onClick={() => setInspectedSchool(null)}
                className="text-sm text-[var(--text-subtle)] hover:text-[var(--text)] cursor-pointer"
              >
                Kapat
              </button>
            </div>

            {/* Principals */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] mb-2">
                Okul Müdürleri ({inspectedSchool.principals.length})
              </h4>
              {inspectedSchool.principals.length === 0 ? (
                <p className="text-xs text-[var(--text-subtle)]">Atanmış müdür yok.</p>
              ) : (
                <div className="space-y-1.5">
                  {inspectedSchool.principals.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)] text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[var(--text)]">{p.name}</span>
                        <span className="text-[var(--text-subtle)] ml-2">({p.email})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">
                          {p.title || "Müdür"}
                        </span>
                        <button
                          onClick={() => handleRemoveStaff(p.id, inspectedSchool.school.id)}
                          className="p-1 text-[var(--err)] hover:bg-[var(--err-bg)] rounded cursor-pointer"
                          title="Yetkiyi Kaldır"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Teachers */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] mb-2">
                Öğretmenler ({inspectedSchool.teachers.length})
              </h4>
              {inspectedSchool.teachers.length === 0 ? (
                <p className="text-xs text-[var(--text-subtle)]">Atanmış öğretmen yok.</p>
              ) : (
                <div className="space-y-1.5">
                  {inspectedSchool.teachers.map((t: any) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)] text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[var(--text)]">{t.name}</span>
                        <span className="text-[var(--text-subtle)] ml-2">({t.email})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 font-medium">
                          {t.title || "Öğretmen"}
                        </span>
                        <button
                          onClick={() => handleRemoveStaff(t.id, inspectedSchool.school.id)}
                          className="p-1 text-[var(--err)] hover:bg-[var(--err-bg)] rounded cursor-pointer"
                          title="Yetkiyi Kaldır"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Classes */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] mb-2">
                Sınıflar ({inspectedSchool.classes.length})
              </h4>
              {inspectedSchool.classes.length === 0 ? (
                <p className="text-xs text-[var(--text-subtle)]">Oluşturulmuş sınıf yok.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {inspectedSchool.classes.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs"
                    >
                      <span className="font-bold text-[var(--text)] block">{c.name}</span>
                      <span className="text-[10px] text-[var(--text-subtle)] font-mono">
                        Kod: {c.joinCode}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* School Exams (Read-only) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] mb-2">
                Okul Denemeleri ({inspectedSchool.exams?.length || 0})
              </h4>
              {!inspectedSchool.exams || inspectedSchool.exams.length === 0 ? (
                <p className="text-xs text-[var(--text-subtle)]">Henüz deneme yüklenmemiş.</p>
              ) : (
                <div className="space-y-1.5">
                  {inspectedSchool.exams.map((ex: any) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)] text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[var(--text)]">{ex.name}</span>
                        <span className="text-[var(--text-subtle)] ml-2">({ex.type} • {ex.date})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">
                        Aktif
                      </span>
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
