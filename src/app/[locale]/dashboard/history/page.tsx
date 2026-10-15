"use client";
import { useState } from "react";
import { Clock, Download, Search } from "lucide-react";
import { useDashboard } from "@/components/DashboardProvider";
import { EmptyHistory, HistoryList } from "@/components/HistoryList";
import { filterHistory, SCAN_LABELS } from "@/lib/dashboard";
export default function HistoryPage() {
  const { scans, ready } = useDashboard();
  const [type, setType] = useState("all"); const [risk, setRisk] = useState("all"); const [query, setQuery] = useState("");
  const filtered = filterHistory(scans, type, risk, query);
  function download() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), scans: filtered }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `sentinel-history-${new Date().toISOString().slice(0,10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="mx-auto max-w-5xl space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="flex items-center gap-3 text-2xl font-semibold"><Clock size={24} className="text-accent-blue"/> Scan history</h1><p className="mt-2 text-sm text-text-secondary">Find, review, and export your saved results.</p></div><button onClick={download} disabled={!filtered.length} className="sentinel-btn-secondary disabled:opacity-40"><Download size={16}/> Export results</button></div>
    <div className="sentinel-card grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr]"><div><label className="mb-2 block text-xs text-text-secondary" htmlFor="history-query">Search results</label><div className="relative"><Search size={15} className="absolute left-3 top-3 text-text-muted"/><input id="history-query" className="sentinel-input !pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search summaries…"/></div></div><div><label htmlFor="history-type" className="mb-2 block text-xs text-text-secondary">Scan type</label><select id="history-type" className="sentinel-input" value={type} onChange={e => setType(e.target.value)}><option value="all">All types</option>{Object.entries(SCAN_LABELS).map(([key,label]) => <option value={key} key={key}>{label}</option>)}</select></div><div><label htmlFor="history-risk" className="mb-2 block text-xs text-text-secondary">Risk level</label><select id="history-risk" className="sentinel-input" value={risk} onChange={e => setRisk(e.target.value)}><option value="all">All levels</option><option value="safe">Low observed risk</option><option value="suspicious">Suspicious</option><option value="high-risk">High risk</option><option value="unknown">Unknown</option></select></div></div>
    <p className="text-xs text-text-muted" role="status">{filtered.length} of {scans.length} saved scans · Showing up to 500 recent scans</p>
    {!ready ? <p role="status">Loading history…</p> : filtered.length ? <HistoryList scans={filtered}/> : scans.length ? <div className="sentinel-card py-12 text-center"><p>No results match these filters.</p><button className="sentinel-btn-secondary mt-4" onClick={() => { setQuery(""); setType("all"); setRisk("all"); }}>Reset filters</button></div> : <EmptyHistory message="No scans saved yet."/>}
  </div>;
}
