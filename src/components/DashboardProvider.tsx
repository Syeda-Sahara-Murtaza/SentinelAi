"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { fetchJson } from "@/lib/api";
import { mergeHistory, readHistory, type HistoryEntry } from "@/lib/dashboard";

export interface Preferences { fullName: string; analysisLanguage: string }
export interface DashboardState {
  scope: string; mode: "local" | "cloud"; name: string; email: string;
  aiConfigured: boolean; authConfigured: boolean;
  scans: HistoryEntry[]; preferences: Preferences | null; warning: string;
}
const initial: DashboardState = { scope: "guest", mode: "local", name: "", email: "", aiConfigured: false, authConfigured: false, scans: [], preferences: null, warning: "" };
const defaults = { fullName: "", analysisLanguage: "auto" };
const Context = createContext<{
  state: DashboardState; scans: HistoryEntry[]; ready: boolean; refreshing: boolean;
  preferences: Preferences; warning: string; refresh: () => Promise<void>;
  record: (data: { entry: HistoryEntry; warning?: string }) => void;
  savePreferences: (preferences: Preferences) => Promise<void>;
  clearHistory: () => Promise<void>;
} | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initial);
  const [scans, setScans] = useState<HistoryEntry[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState("");
  const stateRef = useRef(state);
  const scansRef = useRef(scans);
  const busy = useRef(false);
  const key = (scope: string) => `sentinel:history:v2:${scope}`;

  const persist = useCallback((entries: HistoryEntry[], scope: string) => {
    try { localStorage.setItem(`sentinel:history:v2:${scope}`, JSON.stringify(entries)); }
    catch { setWarning("Browser storage is unavailable or full. Your result is visible now, but unsynced scans may be lost on refresh. Export history to keep a copy."); }
  }, []);
  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true; setRefreshing(true);
    const startedAt = Date.now();
    const previousScope = stateRef.current.scope;
    try {
      const account = await fetchJson<DashboardState>("/api/dashboard", { cache: "no-store" });
      stateRef.current = account; setState(account);
      let local: HistoryEntry[] = [];
      let prefs = account.preferences ?? defaults;
      setWarning(account.warning ?? "");
      try {
        local = readHistory(localStorage, key(account.scope));
        const raw = localStorage.getItem(`sentinel:preferences:v2:${account.scope}`);
        if (!account.preferences && raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.fullName === "string" && typeof parsed.analysisLanguage === "string") prefs = parsed;
        }
      } catch { setWarning("Saved browser data could not be read. New results remain available for this session."); }
      // A successful cloud refresh replaces persisted cache entries; failed reads retain them.
      const retained = account.mode === "cloud" && !account.warning ? local.filter(s => !s.persisted) : local;
      const justCreated = previousScope === account.scope ? scansRef.current.filter(s => Date.parse(s.createdAt) >= startedAt) : [];
      const merged = mergeHistory(retained, account.scans, justCreated);
      scansRef.current = merged; setScans(merged); setPreferences(prefs);
      persist(merged, account.scope);
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "Could not refresh dashboard.");
      // Keep existing state on an outage; never replace a user's visible data with zeros.
      if (stateRef.current.scope === "guest") {
        try { const local = readHistory(localStorage, key("guest")); scansRef.current = local; setScans(local); } catch { /* warning is already visible */ }
      }
    } finally { setReady(true); setRefreshing(false); busy.current = false; }
  }, [persist]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === key(stateRef.current.scope)) {
      try { const entries = readHistory(localStorage, event.key); scansRef.current = entries; setScans(entries); }
      catch { setWarning("History changed in another tab but could not be read."); }
    } };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function record(data: { entry: HistoryEntry; warning?: string }) {
    const entries = mergeHistory(scansRef.current, [data.entry]);
    scansRef.current = entries; setScans(entries); persist(entries, stateRef.current.scope);
    if (data.warning) setWarning(data.warning);
  }
  async function savePreferences(value: Preferences) {
    if (state.mode === "cloud") await fetchJson("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
    localStorage.setItem(`sentinel:preferences:v2:${state.scope}`, JSON.stringify(value));
    setPreferences(value);
  }
  async function clearHistory() {
    if (state.mode === "cloud") await fetchJson("/api/history", { method: "DELETE" });
    localStorage.removeItem(key(state.scope));
    scansRef.current = []; setScans([]);
  }
  return <Context.Provider value={{ state, scans, preferences, ready, refreshing, warning, refresh, record, savePreferences, clearHistory }}>{children}</Context.Provider>;
}
export function useDashboard() {
  const value = useContext(Context);
  if (!value) throw new Error("DashboardProvider is required.");
  return value;
}
