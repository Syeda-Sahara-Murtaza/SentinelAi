import { analyzeTextThreat, isAIConfigured } from "@/lib/ai/provider";
import { analyzeMessageRules, analyzeUrlRules } from "./rules";
import { classifyRisk } from "@/lib/risk";
export async function analyzeMessage(text: string, context = "general", language = "auto") {
  if (isAIConfigured()) {
    try { return await analyzeTextThreat(text, context, language); }
    catch {
      const fallback = analyzeMessageRules(text);
      fallback.limitations!.unshift("AI analysis was unavailable. This result uses basic rules only; try again later for AI analysis.");
      return fallback;
    }
  }
  return analyzeMessageRules(text);
}
export async function analyzeUrl(raw: string) {
  const result = analyzeUrlRules(raw);
  if (!isAIConfigured()) return result;
  try {
    const ai = await analyzeTextThreat(result.url, "URL structure only; do not claim to have visited the destination");
    const riskScore = Math.max(result.riskScore, ai.riskScore);
    return { ...result, ...ai, riskScore, riskLevel: classifyRisk(riskScore), signals: [...new Map([...result.signals, ...ai.signals].map(s => [s.name, s])).values()], limitations: [...result.limitations!, ...ai.limitations!] };
  } catch {
    result.limitations!.unshift("AI analysis was unavailable. This result uses URL structure checks only.");
    return result;
  }
}
