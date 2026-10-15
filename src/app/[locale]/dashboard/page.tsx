"use client";
import { useLocale } from "next-intl";
import { Scan, AlertTriangle, ShieldAlert, Activity, MessageSquare, Link2, QrCode, Mic, Cookie, ArrowUpRight, Shield, Plus, ArrowRight } from "lucide-react";
import { useDashboard } from "@/components/DashboardProvider";
import { dashboardStats, trustScore, weeklyActivity } from "@/lib/dashboard";
import { EmptyHistory, HistoryList } from "@/components/HistoryList";
export default function DashboardPage() {
  const locale = useLocale(); const { scans, state, ready, preferences } = useDashboard();
  const stats = dashboardStats(scans); const score = trustScore(scans); const week = weeklyActivity(scans);
  const max = Math.max(1, ...week.map(d => d.count));
  const cards = [
    { label: "Total scans", value: stats.total, desc: "Saved analyses", icon: Scan, color: "text-accent-blue" },
    { label: "Flagged scans", value: stats.threats, desc: "Suspicious or high risk", icon: AlertTriangle, color: "text-amber-400" },
    { label: "High-risk scans", value: stats.highRisk, desc: "Review before taking action", icon: ShieldAlert, color: "text-red-400" },
    { label: "Scans today", value: stats.today, desc: "Based on your local time", icon: Activity, color: "text-accent-cyan" },
  ];
  const actions = [
    { title: "Message", desc: "Spot suspicious requests", icon: MessageSquare, path: "analyzer" },
    { title: "URL", desc: "Inspect a destination", icon: Link2, path: "url" },
    { title: "QR code", desc: "Check before you scan", icon: QrCode, path: "qr" },
    { title: "Voice", desc: "Review a call’s words", icon: Mic, path: "voice" },
    { title: "Privacy", desc: "Inspect response cookies", icon: Cookie, path: "privacy" },
  ];
  return <div className="mx-auto max-w-6xl space-y-7">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-cyan">Your digital safety, in focus</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{preferences.fullName ? `Welcome back, ${preferences.fullName.split(" ")[0]}.` : "Your safety overview."}</h1><p className="mt-2 text-sm text-text-secondary">A clearer view of what deserves your attention.</p></div><a href={`/${locale}/dashboard/analyzer`} className="sentinel-btn-primary"><Plus size={16}/> New scan</a></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(c => <div className="sentinel-card" key={c.label}><div className="flex items-center justify-between"><p className="text-xs font-medium text-text-secondary">{c.label}</p><c.icon size={17} className={c.color}/></div><p className="mt-5 text-3xl font-semibold tabular-nums" aria-label={`${c.label}: ${ready ? c.value : "loading"}`}>{ready ? c.value : "—"}</p><p className="mt-2 text-[11px] text-text-muted">{c.desc}</p></div>)}</div>
    <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
      <section className="sentinel-card"><div className="flex justify-between"><div><h2 className="text-sm font-semibold">Scan activity</h2><p className="mt-1 text-xs text-text-muted">Your last 7 days</p></div><span className="text-xs text-text-muted">{week.reduce((n,d) => n+d.count,0)} scans</span></div><div className="mt-7 flex h-36 items-end justify-between gap-3" role="img" aria-label={week.map(d => `${d.label}: ${d.count} scans`).join(", ")}>{week.map(d => <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] text-text-muted">{d.count}</span><div className="w-full max-w-9 rounded-t bg-accent-blue/80 transition-all" style={{ height: `${Math.max(3,d.count/max*85)}px`, opacity: d.count ? 1 : .15 }} title={`${d.count} scans, ${d.flagged} flagged`}/><span className="text-[10px] text-text-muted">{d.label}</span></div>)}</div></section>
      <section className="sentinel-card relative overflow-hidden"><div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-blue/5 blur-2xl"/><div className="flex items-center gap-2"><Shield size={18} className="text-accent-cyan"/><h2 className="text-sm font-semibold">Scan trust summary</h2></div><div className="mt-5 flex items-end gap-2"><span className="text-4xl font-semibold tabular-nums">{score ?? "—"}</span>{score !== null && <span className="mb-1 text-sm text-text-muted">/100</span>}</div><p className="mt-3 text-xs leading-relaxed text-text-secondary">{score === null ? "Run a message, URL, QR, or voice scan to see a summary." : "100 minus your average observed risk. This describes your scanned content, not the security of your device."}</p><a href={`/${locale}/dashboard/trust-score`} className="mt-4 inline-flex items-center gap-2 text-xs text-accent-blue">Understand this score <ArrowRight size={13}/></a></section>
    </div>
    <section><div className="mb-4 flex justify-between"><h2 className="text-sm font-semibold">What would you like to check?</h2><span className="text-[11px] text-text-muted">{state.aiConfigured ? "AI + pattern checks" : "Basic pattern checks"}</span></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{actions.map(a => <a href={`/${locale}/dashboard/${a.path}`} className="sentinel-card group !p-4 transition-colors hover:border-accent-blue/40 hover:bg-surface-hover" key={a.path}><div className="mb-5 flex justify-between"><a.icon size={21} className="text-accent-blue"/><ArrowUpRight size={14} className="text-text-muted group-hover:text-accent-blue"/></div><p className="text-sm font-medium">{a.title}</p><p className="mt-1 text-[11px] text-text-muted">{a.desc}</p></a>)}</div></section>
    <section><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold">Recent activity</h2><a href={`/${locale}/dashboard/history`} className="flex items-center gap-1 text-xs text-accent-blue">View all <ArrowUpRight size={13}/></a></div>{!ready ? <div className="sentinel-card text-sm text-text-secondary" role="status">Loading your scans…</div> : scans.length ? <HistoryList scans={scans.slice(0,4)}/> : <EmptyHistory/>}</section>
    <p className="text-[11px] text-text-muted">{state.mode === "local" ? "History is stored in this browser. Export it before clearing browser data or changing devices." : "Showing your most recent 500 saved scans, including any scans pending account sync."}</p>
  </div>;
}
