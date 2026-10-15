import { classifyRisk, computeRiskScore } from "@/lib/risk";
import { analyzeUrlPatterns, validateUrl } from "@/lib/security";
import type { ThreatAnalysisResult, ThreatSignal, URLAnalysisResult } from "@/types";

export function analyzeMessageRules(text: string): ThreatAnalysisResult {
  const signals: ThreatSignal[] = [];
  const rules: [RegExp, string, ThreatSignal["severity"], string][] = [
    [/\b(urgent|immediately|act now|within \d+ (minutes|hours)|account.{0,20}(suspended|blocked|closed))\b/i, "Pressure to act", "medium", "The message creates time pressure. Scammers use urgency to stop you checking the source."],
    [/\b(send|share|enter|provide|confirm|give).{0,55}\b(password|otp|pin|verification code|one.time code|bank details|card number|seed phrase)\b/i, "Request for sensitive information", "high", "It asks for credentials or financial details. Verify the request using the organisation’s official channel."],
    [/\b(won|winner|lottery|claim.{0,15}prize|free money|guaranteed.{0,20}(profit|return))\b/i, "Unexpected reward", "high", "It promises a prize or guaranteed money, a common scam pattern."],
    [/\b(gift cards?|wire transfer|send.{0,20}(bitcoin|crypto)|pay.{0,20}(fee|deposit)|transfer.{0,20}money)\b/i, "Unusual payment request", "high", "It requests a payment method or upfront fee that may be hard to recover."],
    [/\b(anydesk|teamviewer|remote access|install.{0,25}(app|software))\b/i, "Device access request", "high", "It asks you to install software or grant access to your device."],
    [/\b(ignore.{0,20}(instructions|rules)|reveal.{0,20}(prompt|secret))\b/i, "Instructions aimed at the analyzer", "medium", "The submitted content attempts to influence analysis rather than provide ordinary message content."],
  ];
  for (const [pattern, name, severity, explanation] of rules) {
    const match = text.match(pattern);
    if (match) signals.push({ name, severity, explanation: `${explanation} Matched: “${match[0].slice(0,100)}”.` });
  }
  const links = text.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  for (const link of links.slice(0, 5)) {
    try { signals.push(...analyzeUrlPatterns(validateUrl(link)).signals); }
    catch { signals.push({ name: "Unverified link", severity: "medium", explanation: "A link in the message could not be checked as a public web address." }); }
  }
  const unique = [...new Map(signals.map(s => [s.name, s])).values()];
  const riskScore = computeRiskScore({ signals: unique });
  return {
    riskScore, riskLevel: classifyRisk(riskScore), signals: unique,
    threatTypes: unique.length ? ["Potential social engineering"] : [],
    explanation: [unique.length ? `${unique.length} warning pattern${unique.length === 1 ? " was" : "s were"} found in this content.` : "No matching warning patterns were found. This does not establish that the sender or content is trustworthy."],
    recommendedActions: unique.length ? ["Pause before replying, paying, or opening a link.", "Contact the organisation through a phone number or website you already trust.", "Never share passwords, one-time codes, or recovery phrases."] : ["Check the sender independently before sharing personal information or making a payment."],
    confidence: 0, detectedLanguage: /[\u0600-\u06ff]/.test(text) ? "und" : "en",
    analysisMethod: "rules",
    limitations: ["Basic checks use a small English rule set and URL patterns. They can miss scams, especially in other languages, and can flag harmless content. No sender identity or live reputation was verified."],
  };
}

export function analyzeUrlRules(raw: string): URLAnalysisResult {
  const url = validateUrl(raw);
  const { signals, suspiciousPatterns } = analyzeUrlPatterns(url);
  const riskScore = computeRiskScore({ signals });
  return {
    url: url.href, hostname: url.hostname, protocol: url.protocol,
    suspiciousPatterns, domainAge: null, reputation: null,
    riskScore, riskLevel: classifyRisk(riskScore), signals,
    threatTypes: signals.length ? ["URL warning patterns"] : [],
    explanation: [signals.length ? `${signals.length} warning pattern${signals.length === 1 ? " was" : "s were"} found in this address.` : "No common warning patterns were found in this address. This is not proof the website is safe."],
    recommendedActions: ["Check the exact domain using the organisation’s official website.", "Avoid entering credentials or paying until you have verified the destination."],
    confidence: 0, detectedLanguage: "en", analysisMethod: "rules",
    limitations: ["Only the address was inspected. The website was not opened; reputation, domain age, page content, and redirects were not checked."],
  };
}
