import type { ThreatAnalysisResult } from "@/types";
import { getRiskBadgeClasses, getRiskLabel } from "@/lib/risk";
import { ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle, Info, ArrowRight } from "lucide-react";

interface AnalysisResultProps {
  result: ThreatAnalysisResult;
  labels?: {
    threatTypes?: string;
    signals?: string;
    whyFlagged?: string;
    recommended?: string;
    language?: string;
    confidence?: string;
    aiAssessment?: string;
  };
}

export function AnalysisResult({ result, labels }: AnalysisResultProps) {
  const l = {
    threatTypes: labels?.threatTypes ?? "Threat Types",
    signals: labels?.signals ?? "Detected Signals",
    whyFlagged: labels?.whyFlagged ?? "What this result means",
    recommended: labels?.recommended ?? "Recommended Actions",
    language: labels?.language ?? "Detected Language",
    confidence: labels?.confidence ?? "Confidence",
    aiAssessment: labels?.aiAssessment ?? "AI-assisted risk assessment",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Risk Score Header */}
      <div className={`sentinel-card border ${getRiskBadgeClasses(result.riskLevel)}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {result.riskLevel === "safe" ? (
              <ShieldCheck className="text-risk-safe" size={28} />
            ) : result.riskLevel === "suspicious" ? (
              <AlertTriangle className="text-risk-suspicious" size={28} />
            ) : (
              <ShieldAlert className="text-risk-high" size={28} />
            )}
            <div>
              <p className="text-xl font-semibold">{result.riskLevel === "safe" ? "No strong warning signals" : getRiskLabel(result.riskLevel)}</p>
              <p className="text-sm text-text-secondary">{result.analysisMethod === "rules" ? "Basic pattern analysis" : result.analysisMethod === "ai" ? l.aiAssessment : "Saved assessment"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-text-secondary">Risk score</p>
            <p className="text-3xl font-bold">{result.riskScore}</p>
            <p className="text-xs text-text-muted">/ 100</p>
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-text-secondary">Higher scores mean more or stronger warning signals were found. This score is not a probability and does not prove that content is safe or malicious.</p>
      {result.limitations && <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4"><p className="mb-2 text-xs font-semibold text-amber-200">Analysis limits</p>{result.limitations.map((note,i) => <p key={i} className="mt-1 text-xs leading-relaxed text-text-secondary">{note}</p>)}</div>}
      {/* Threat Types */}
      {result.threatTypes.length > 0 && (
        <div className="sentinel-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-text-secondary">
            <AlertTriangle size={14} />
            {l.threatTypes}
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.threatTypes.map((type) => (
              <span key={type} className={`sentinel-badge ${getRiskBadgeClasses(result.riskLevel)}`}>
                {type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detected Signals */}
      {result.signals.length > 0 && (
        <div className="sentinel-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-text-secondary">
            <Info size={14} />
            {l.signals}
          </h3>
          <div className="space-y-3">
            {result.signals.map((signal, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-navy-900 p-3">
                <span
                  className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${
                    signal.severity === "high"
                      ? "bg-risk-high"
                      : signal.severity === "medium"
                      ? "bg-risk-suspicious"
                      : "bg-risk-safe"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium">{signal.name}</p>
                  <p className="text-xs text-text-secondary mt-1">{signal.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      {result.explanation.length > 0 && (
        <div className="sentinel-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-text-secondary">
            <Info size={14} />
            {l.whyFlagged}
          </h3>
          <ul className="space-y-2">
            {result.explanation.map((exp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <ArrowRight size={14} className="mt-0.5 flex-shrink-0 text-accent-cyan" />
                {exp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Actions */}
      {result.recommendedActions.length > 0 && (
        <div className="sentinel-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-text-secondary">
            <CheckCircle size={14} />
            {l.recommended}
          </h3>
          <ul className="space-y-2">
            {result.recommendedActions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent-blue/20 text-xs text-accent-blue">
                  {i + 1}
                </span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-xs text-text-muted">
        <span>{result.analysisMethod === "rules" ? "Confidence: not calibrated for rule checks" : `${l.confidence} (model estimate): ${result.confidence}%`}</span>
        <span>{l.language}: {result.detectedLanguage}</span>
      </div>
    </div>
  );
}
