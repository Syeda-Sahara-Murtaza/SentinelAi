import { z } from "zod/v4";
import type { PrivacyAnalysisResult, RiskLevel, ScanType, ThreatAnalysisResult } from "@/types";

export type Analysis = ThreatAnalysisResult | PrivacyAnalysisResult;
export interface HistoryEntry {
  id: string;
  type: ScanType;
  createdAt: string;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  summary: string;
  result: Analysis | null;
  persisted?: boolean;
}
export const SCAN_LABELS: Record<ScanType, string> = { message: "Message", url: "URL", qr: "QR code", voice: "Voice", privacy: "Privacy" };
export const HISTORY_LIMIT = 500;
export function makeEntry(type: ScanType, result: Analysis, id = crypto.randomUUID(), createdAt = new Date().toISOString()): HistoryEntry {
  const privacy = "privacyRisk" in result;
  return {
    id, type, createdAt, result,
    // Header-only privacy checks have a category, not a calibrated numeric score.
    riskScore: privacy ? null : result.riskScore,
    riskLevel: privacy ? result.privacyRisk : result.riskLevel,
    summary: privacy ? `${result.totalCookies} response cookies observed. ${result.recommendations[0] ?? ""}` : result.explanation[0] ?? "Analysis completed.",
  };
}
export function mergeHistory(...sources: HistoryEntry[][]): HistoryEntry[] {
  const map = new Map<string, HistoryEntry>();
  for (const source of sources) for (const entry of source) map.set(entry.id, entry);
  return [...map.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, HISTORY_LIMIT);
}
const savedThreat = z.object({ riskScore: z.number().min(0).max(100), riskLevel: z.enum(["safe","suspicious","high-risk"]), threatTypes: z.array(z.string()), signals: z.array(z.object({ name: z.string(), severity: z.enum(["low","medium","high"]), explanation: z.string() })), explanation: z.array(z.string()), recommendedActions: z.array(z.string()), confidence: z.number(), detectedLanguage: z.string(), analysisMethod: z.enum(["rules","ai"]).optional(), limitations: z.array(z.string()).optional() }).passthrough();
const savedPrivacy = z.object({ privacyRisk: z.enum(["safe","suspicious","high-risk"]), totalCookies: z.number().nonnegative(), thirdPartyCookies: z.number().nonnegative(), trackers: z.number().nonnegative(), advertisingTrackers: z.number().nonnegative(), categories: z.array(z.object({ name: z.string(), type: z.enum(["essential","analytics","advertising","tracking","third-party","unknown"]), count: z.number().nonnegative() })), recommendations: z.array(z.string()), limitations: z.array(z.string()).optional() }).passthrough();
function readableResult(value: unknown): Analysis | null { const parsed = z.union([savedThreat,savedPrivacy]).safeParse(value); return parsed.success ? parsed.data as Analysis : null; }
export function readHistory(storage: Pick<Storage, "getItem">, key: string): HistoryEntry[] {
  const raw = storage.getItem(key);
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error("Saved history is unreadable.");
  return value.filter((s): s is HistoryEntry => !!s && typeof s === "object" && typeof s.id === "string" && Object.hasOwn(SCAN_LABELS, s.type) && Number.isFinite(Date.parse(s.createdAt)) && typeof s.summary === "string" && (s.riskScore === null || typeof s.riskScore === "number" && s.riskScore >= 0 && s.riskScore <= 100) && [null, "safe", "suspicious", "high-risk"].includes(s.riskLevel)).slice(0, HISTORY_LIMIT).map(entry => ({ ...entry, result: readableResult(entry.result) }));
}
export function dashboardStats(scans: HistoryEntry[], now = new Date()) {
  const today = now.toDateString();
  return {
    total: scans.length,
    threats: scans.filter(s => s.riskLevel === "suspicious" || s.riskLevel === "high-risk").length,
    highRisk: scans.filter(s => s.riskLevel === "high-risk").length,
    today: scans.filter(s => new Date(s.createdAt).toDateString() === today).length,
  };
}
export function trustScore(scans: HistoryEntry[], types?: ScanType[]): number | null {
  const scored = scans.filter(s => s.riskScore !== null && (!types || types.includes(s.type)));
  return scored.length ? Math.round(100 - scored.reduce((sum, s) => sum + s.riskScore!, 0) / scored.length) : null;
}
export function filterHistory(scans: HistoryEntry[], type: string, risk: string, query: string) {
  const search = query.toLocaleLowerCase().trim();
  return scans.filter(s => (type === "all" || s.type === type) && (risk === "all" || s.riskLevel === risk || risk === "unknown" && s.riskLevel === null) && (!search || `${SCAN_LABELS[s.type]} ${s.summary}`.toLocaleLowerCase().includes(search)));
}
export function weeklyActivity(scans: HistoryEntry[], now = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now); date.setDate(date.getDate() - 6 + i);
    const entries = scans.filter(s => new Date(s.createdAt).toDateString() === date.toDateString());
    return { date: date.toDateString(), label: date.toLocaleDateString("en", { weekday: "short" }), count: entries.length, flagged: entries.filter(s => s.riskLevel === "suspicious" || s.riskLevel === "high-risk").length };
  });
}
