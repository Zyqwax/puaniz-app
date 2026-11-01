"use client";
import { useEffect,useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Bell } from 'lucide-react';
import { getLearningNotificationCount } from '@/server/actions/notifications';
export default function LearningNotificationBell() {
 const {user}=useAuth();
 const [snapshot,setSnapshot]=useState({userId:"",count:0});
 const count=snapshot.userId===user?.id?snapshot.count:0;
 useEffect(()=>{
  if(!user?.id)return;
  const userId=user.id;
  let active=true;let loading=false;
  const update=()=>{if(document.visibilityState==='hidden'||loading)return;loading=true;void getLearningNotificationCount().then(n=>{if(active)setSnapshot({userId,count:n});}).catch(()=>{}).finally(()=>{loading=false;});};
  update();const timer=setInterval(update,60000);window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);window.addEventListener('learning-notifications-changed',update);
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);window.removeEventListener('learning-notifications-changed',update);};
 },[user?.id]);
 return <Link href="/dashboard/notifications" aria-label={`Gelişim bildirimleri${count?`, ${count} okunmamış`:''}`} title="Gelişim bildirimleri" className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]"><Bell size={18}/>{count>0&&<span className="absolute -right-1 -top-1 rounded-full bg-[var(--brand)] px-1.5 text-[10px] font-bold text-white">{count>99?'99+':count}</span>}</Link>;
}
