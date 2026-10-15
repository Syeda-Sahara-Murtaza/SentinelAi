"use client";
import { Shield, MessageSquare, Link2, Mic, Cookie, Info } from "lucide-react";
import { useDashboard } from "@/components/DashboardProvider";
import { trustScore } from "@/lib/dashboard";
import type { ScanType } from "@/types";
export default function TrustScorePage() {
  const { scans, ready } = useDashboard(); const overall = trustScore(scans);
  const dimensions: { label: string; types: ScanType[]; icon: typeof Shield }[] = [
    { label: "Messages", types: ["message"], icon: MessageSquare },
    { label: "URLs & QR codes", types: ["url","qr"], icon: Link2 },
    { label: "Voice transcripts", types: ["voice"], icon: Mic },
  ];
  const scored = scans.filter(s => s.riskScore !== null).length;
  const circumference = 2 * Math.PI * 52;
  return <div className="mx-auto max-w-4xl space-y-6"><div><h1 className="flex items-center gap-3 text-2xl font-semibold"><Shield className="text-accent-blue" size={24}/> Trust summary</h1><p className="mt-2 text-sm text-text-secondary">Understand the observed risk in the content you have checked.</p></div>
    <div className="sentinel-card py-8 text-center"><div className="relative mx-auto h-40 w-40"><svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true"><circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="7" className="text-border-subtle"/><circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="7" className="text-accent-cyan" strokeDasharray={circumference} strokeDashoffset={circumference*(1-(overall ?? 0)/100)} strokeLinecap="round"/></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-4xl font-semibold">{ready ? overall ?? "—" : "…"}</span><span className="mt-1 text-xs text-text-muted">{overall === null ? "No scored scans" : "out of 100"}</span></div></div><h2 className="mt-5 font-semibold">{overall === null ? "Your summary will appear after a scan" : "Overall scan trust summary"}</h2><p className="mt-2 text-xs text-text-secondary">Based on {scored} scored {scored === 1 ? "scan" : "scans"} in your saved history.</p></div>
    <div className="grid gap-4 sm:grid-cols-3">{dimensions.map(d => { const value = trustScore(scans,d.types); const count = scans.filter(s => d.types.includes(s.type) && s.riskScore !== null).length;
      return <div className="sentinel-card" key={d.label}><d.icon size={20} className="mb-4 text-accent-blue"/><h2 className="text-sm font-medium">{d.label}</h2><p className="mt-4 text-2xl font-semibold">{value === null ? "—" : `${value}/100`}</p><div className="mt-3 h-1.5 rounded-full bg-border-subtle"><div className="h-full rounded-full bg-accent-cyan" style={{ width: `${value ?? 0}%` }}/></div><p className="mt-3 text-xs text-text-muted">{count ? `${count} scored scans` : "No scans in this category"}</p></div>; })}</div>
    <div className="sentinel-card flex items-start gap-3"><Cookie className="shrink-0 text-accent-blue" size={20}/><div><h2 className="text-sm font-medium">Privacy observations</h2><p className="mt-2 text-sm text-text-secondary">{scans.filter(s => s.type === "privacy").length} privacy checks saved. Header-only cookie observations do not provide a numeric trust score and are excluded from this average.</p></div></div>
    <div className="sentinel-card flex items-start gap-3"><Info size={20} className="shrink-0 text-accent-cyan"/><div><h2 className="text-sm font-medium">How to read this number</h2><p className="mt-2 text-sm leading-relaxed text-text-secondary">Score = 100 − average risk score of saved, scored scans. Higher values mean fewer warning signals were found in that content. It is not a measure of your device’s protection, a probability of safety, or a guarantee. Basic rule checks and AI assessments have different limitations; open individual results for context.</p></div></div>
  </div>;
}
