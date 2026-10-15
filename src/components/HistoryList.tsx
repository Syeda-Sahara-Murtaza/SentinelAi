"use client";
import { useState } from "react";
import { ChevronDown, MessageSquare, Link2, QrCode, Mic, Cookie, Shield } from "lucide-react";
import { SCAN_LABELS, type HistoryEntry } from "@/lib/dashboard";
import { getRiskBadgeClasses } from "@/lib/risk";
import { AnalysisResult } from "@/components/AnalysisResult";
const icons = { message: MessageSquare, url: Link2, qr: QrCode, voice: Mic, privacy: Cookie };
export function riskLabel(level: HistoryEntry["riskLevel"]) { return level === "high-risk" ? "High risk" : level === "suspicious" ? "Suspicious" : level === "safe" ? "Low observed risk" : "Unknown"; }
export function HistoryList({ scans }: { scans: HistoryEntry[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">{scans.map(scan => { const Icon = icons[scan.type]; const open = expanded === scan.id;
    return <div key={scan.id} className="border-b border-border-subtle last:border-0"><button onClick={() => setExpanded(open ? null : scan.id)} aria-expanded={open} aria-controls={`scan-${scan.id}`} className="flex w-full items-start gap-4 p-4 text-left hover:bg-surface-hover/50 sm:p-5"><span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-navy-900"><Icon size={18} className="text-accent-blue"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">{SCAN_LABELS[scan.type]} scan</span><span className={`sentinel-badge ${scan.riskLevel ? getRiskBadgeClasses(scan.riskLevel) : "sentinel-badge-neutral"}`}>{riskLabel(scan.riskLevel)}{scan.riskScore !== null ? ` · ${scan.riskScore}/100` : ""}</span></div><p className="mt-1 truncate text-xs text-text-secondary">{scan.summary}</p><p className="mt-2 text-[11px] text-text-muted">{new Date(scan.createdAt).toLocaleString()}{scan.persisted ? " · Account" : " · This browser"}</p></div><ChevronDown size={16} className={`mt-2 shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}/></button>
      {open && <div id={`scan-${scan.id}`} className="border-t border-border-subtle p-4 sm:p-6">{scan.result && "riskScore" in scan.result ? <AnalysisResult result={scan.result}/> : scan.result && "privacyRisk" in scan.result ? <div className="space-y-3"><p className="text-sm">{scan.result.totalCookies} response cookies observed.</p>{scan.result.recommendations.map((r,i) => <p className="text-sm text-text-secondary" key={i}>{r}</p>)}{scan.result.limitations?.map((r,i) => <p className="text-xs text-amber-200" key={i}>{r}</p>)}</div> : <p className="text-sm text-text-secondary">Detailed results were not stored for this older scan. Run a new scan for a full report.</p>}</div>}
    </div>;
  })}</div>;
}
export function EmptyHistory({ message = "Your first scan starts here." }: { message?: string }) { return <div className="sentinel-card flex flex-col items-center py-12 text-center"><div className="mb-4 rounded-2xl border border-accent-blue/20 bg-accent-blue/5 p-4"><Shield size={28} className="text-accent-blue"/></div><p className="font-medium">{message}</p><p className="mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">Check a message, link, or QR code. Your results will appear here automatically.</p></div>; }
