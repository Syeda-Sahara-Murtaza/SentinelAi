import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/lib/site-auth";
import { makeEntry, type Analysis, type HistoryEntry } from "@/lib/dashboard";
import { Errors } from "@/lib/errors";
import type { ScanType } from "@/types";
export function database() { if (!env.DB) throw Errors.database("Account storage is temporarily unavailable."); return env.DB; }
export async function requireSiteUser() {
  const user = await getChatGPTUser();
  if (!user) throw Errors.auth("Sign in with ChatGPT to use your private workspace.");
  return user;
}
export async function completeAnalysis<T extends Analysis>(type: ScanType, result: T) {
  const user = await requireSiteUser(); const entry = makeEntry(type, result);
  try {
    await database().prepare("INSERT INTO sentinel_scans (id,user_id,type,created_at,result) VALUES (?,?,?,?,?)").bind(entry.id,user.userId,type,entry.createdAt,JSON.stringify(result)).run();
    entry.persisted = true;
    return { result, entry };
  } catch {
    return { result, entry, warning: "Analysis completed, but account history could not be saved. This browser keeps a copy if storage is available." };
  }
}
export async function loadAccountHistory(userId: string): Promise<HistoryEntry[]> {
  const rows = await database().prepare("SELECT id,type,created_at,result FROM sentinel_scans WHERE user_id = ? ORDER BY created_at DESC LIMIT 500").bind(userId).all<{ id: string; type: ScanType; created_at: string; result: string }>();
  return rows.results.map(row => ({ ...makeEntry(row.type,JSON.parse(row.result),row.id,row.created_at), persisted: true }));
}
