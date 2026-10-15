"use client";
import { useRef, useState } from "react";
import { Mic, Upload, FileAudio } from "lucide-react";
import { AnalysisResult } from "@/components/AnalysisResult";
import { ErrorState, LoadingState } from "@/components/States";
import { useDashboard } from "@/components/DashboardProvider";
import { fetchJson } from "@/lib/api";
import type { HistoryEntry } from "@/lib/dashboard";
import type { VoiceAnalysisResult } from "@/types";
export default function VoicePage() {
  const { state, record, preferences, ready } = useDashboard();
  const [mode,setMode] = useState("transcript"); const [text,setText] = useState("");
  const [file,setFile] = useState<File | null>(null); const [result,setResult] = useState<VoiceAnalysisResult | null>(null);
  const [loading,setLoading] = useState(false); const [error,setError] = useState(""); const input = useRef<HTMLInputElement>(null);
  async function analyze() {
    setLoading(true); setError(""); setResult(null);
    try {
      let options: RequestInit;
      if (mode === "audio") { if (!file) throw new Error("Select an audio file."); const form = new FormData(); form.append("audio",file); form.append("language",preferences.analysisLanguage); options = { method: "POST", body: form }; }
      else options = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, language: preferences.analysisLanguage }) };
      const data = await fetchJson<{ result: VoiceAnalysisResult; entry: HistoryEntry; warning?: string }>("/api/analyze/voice", options);
      record(data); setResult(data.result);
    } catch(e) { setError(e instanceof Error ? e.message : "Voice analysis failed."); } finally { setLoading(false); }
  }
  function select(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(null); setResult(null); setError(""); const selected = e.target.files?.[0]; if (!selected) return;
    if (selected.size === 0 || selected.size > 10*1024*1024) { setError("Choose a nonempty file under 10 MB."); return; }
    if (!["audio/mpeg","audio/mp3","audio/wav","audio/x-wav","audio/ogg","audio/webm","audio/mp4","audio/x-m4a"].includes(selected.type)) { setError("Supported audio formats: MP3, WAV, OGG, WebM, M4A."); return; }
    setFile(selected);
  }
  return <div className="mx-auto max-w-4xl space-y-6"><div><h1 className="flex items-center gap-3 text-2xl font-semibold"><Mic size={24} className="text-accent-blue"/> Voice guard</h1><p className="mt-2 text-sm text-text-secondary">Check the words in a call for scam patterns. This does not detect voice cloning or verify the speaker.</p></div>
    <div className="sentinel-card space-y-5"><div className="flex flex-wrap gap-2" role="group" aria-label="Voice input method">{["transcript","audio"].map(tab => <button key={tab} disabled={loading} aria-pressed={mode===tab} onClick={() => { setMode(tab); setResult(null); setError(""); }} className={mode===tab ? "sentinel-btn-primary" : "sentinel-btn-secondary"}>{tab === "transcript" ? "Paste a transcript" : "Upload audio"}</button>)}</div>
    {mode === "transcript" ? <div><label htmlFor="voice-text" className="mb-2 block text-sm text-text-secondary">What was said in the call?</label><textarea id="voice-text" className="sentinel-textarea" rows={7} maxLength={10000} value={text} disabled={loading} onChange={e => setText(e.target.value)} placeholder="Paste the conversation or the part you are unsure about…"/><p className="mt-2 text-xs text-text-muted">{text.length}/10,000 characters</p></div> : <div className="space-y-4">{!state.aiConfigured && <p className="rounded-lg bg-amber-500/5 p-4 text-sm text-amber-200">Audio transcription is not connected. The transcript tab is available now.</p>}<button type="button" onClick={() => input.current?.click()} disabled={loading || !state.aiConfigured} className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-border-default p-8 text-sm disabled:opacity-50">{file ? <FileAudio className="text-accent-blue"/> : <Upload className="text-accent-blue"/>}{file ? file.name : "Choose a recording"}<span className="text-xs text-text-muted">MP3, WAV, OGG, WebM, M4A · Up to 10 MB</span></button><input ref={input} type="file" accept="audio/*" className="sr-only" aria-label="Audio recording" onChange={select}/><p className="text-xs text-text-muted">Audio is sent to the configured transcription provider. Only upload recordings you have permission to share.</p></div>}
    <button className="sentinel-btn-primary" onClick={analyze} disabled={loading || !ready || (mode === "audio" ? !file || !state.aiConfigured : !text.trim())}>{loading ? "Analyzing…" : "Analyze conversation"}</button></div>
    {loading && <LoadingState message="Checking the conversation…"/>}{error && <ErrorState message={error} onRetry={analyze}/>}
    {result && <><div className="sentinel-card"><h2 className="mb-3 text-sm font-medium">Analyzed transcript</h2><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary">{result.transcript}</p>{result.duration !== null && <p className="mt-3 text-xs text-text-muted">Duration: {Math.round(result.duration)} seconds</p>}</div><AnalysisResult result={result}/></>}
  </div>;
}
