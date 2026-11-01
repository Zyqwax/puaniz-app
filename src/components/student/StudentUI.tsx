"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { calculateNet } from "@/lib/exam";
import { AlertCircle, Inbox, X } from "lucide-react";
import { useDashboardHeaderActionsTarget } from "@/components/dashboard/DashboardHeaderActionsContext";

export const studentButton = "student-button";
export const studentPrimary = "student-button student-button-primary";
export const studentDanger = "student-button student-button-danger";
export const studentInput = "student-input";

export function StudentHeaderActions({ children }: { children: ReactNode }) {
  const target = useDashboardHeaderActionsTarget();
  return target ? createPortal(<div className="student-workspace flex items-center gap-2">{children}</div>, target) : null;
}

export function StudentSection({ title, description, actions, children, className = "" }: { title: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`student-section ${className}`}>
    <div className="student-section-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}</div>
    {children}
  </section>;
}

export function StudentMetric({ label, value, detail, tone = "default" }: { label: string; value: ReactNode; detail?: ReactNode; tone?: "default" | "positive" | "accent" }) {
  return <div className="student-metric"><p>{label}</p><strong data-tone={tone}>{value}</strong>{detail && <div>{detail}</div>}</div>;
}

export function StudentSegments<T extends string>({ value, options, onChange, label = "Görünüm" }: { value: T; options: readonly { value: T; label: string; disabled?: boolean }[]; onChange: (value: T) => void; label?: string }) {
  return <div role="group" aria-label={label} className="student-segments">{options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} disabled={option.disabled} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>;
}

export function StudentEmpty({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="student-empty"><Inbox size={28} aria-hidden/><h3>{title}</h3><p>{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function StudentNotice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div role={error ? "alert" : "status"} className={`student-notice ${error ? "student-notice-error" : ""}`}><AlertCircle size={17} className="mt-0.5 shrink-0"/><div>{children}</div></div>;
}

export function StudentLoading() {
  return <div role="status" aria-label="Öğrenci verileri yükleniyor" className="student-page animate-pulse"><div className="student-metrics">{[1,2,3,4].map(i=><div key={i} className="h-24 rounded-xl bg-[var(--surface-3)]"/>)}</div><div className="h-64 rounded-xl bg-[var(--surface-3)]"/><div className="h-40 rounded-xl bg-[var(--surface-3)]"/></div>;
}

export function StudentModal({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (!ref.current?.open) ref.current?.showModal(); }, []);
  return <dialog ref={ref} aria-label={title} className="student-workspace student-dialog" onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target!==event.currentTarget)return;const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)onClose();}}>
    <div className="student-section-heading"><div><h2>{title}</h2>{description&&<p>{description}</p>}</div><button type="button" aria-label="Kapat" className={studentButton} onClick={onClose}><X size={17}/></button></div>
    {children}
  </dialog>;
}

export function StudentScoreRow({label,values,onChange,max=40}:{label:string;values:{d:number;y:number};onChange:(field:"d"|"y",value:number)=>void;max?:number}) {
  const total=values.d+values.y;
  const invalid=total>max||values.d<0||values.y<0;
  return <div className="student-score-row" aria-invalid={invalid}>
    <div><p className="font-medium">{label}</p><p className="text-xs text-[var(--text-muted)]">{max} soru</p>{invalid&&<p role="alert" className="mt-1 flex items-center gap-1 text-xs text-[var(--err)]"><AlertCircle size={12}/> Toplam {max} soruyu geçemez.</p>}</div>
    {(["d","y"] as const).map(field=><label key={field}><span className="student-score-label">{field==="d"?"Doğru":"Yanlış"}</span><input type="number" min={0} max={max} step={1} aria-label={`${label} ${field==="d"?"doğru":"yanlış"}`} aria-invalid={invalid} value={values[field]||""} placeholder="0" onChange={event=>onChange(field,Math.max(0,Number.parseInt(event.target.value)||0))} className={`${studentInput} text-center tabular-nums`}/></label>)}
    <div className="text-center tabular-nums"><span className="student-score-label">Boş</span><span className="text-[var(--text-muted)]">{Math.max(0,max-total)}</span></div>
    <div className="text-center font-semibold tabular-nums"><span className="student-score-label">Net</span>{calculateNet(values.d,values.y).toFixed(2)}</div>
  </div>;
}
