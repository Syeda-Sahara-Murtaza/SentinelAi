import { database, requireSiteUser, loadAccountHistory } from "@/lib/history";
import { isAIConfigured } from "@/lib/ai/provider";
import { apiError } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const user = await requireSiteUser();
    let scans: Awaited<ReturnType<typeof loadAccountHistory>> = [];
    let preferences = { fullName: user.fullName ?? "", analysisLanguage: "auto" };
    let warning = "";
    try {
      const [history,prefs] = await Promise.all([
        loadAccountHistory(user.userId),
        database().prepare("SELECT full_name,analysis_language FROM sentinel_preferences WHERE user_id = ?").bind(user.userId).first<{ full_name: string; analysis_language: string }>(),
      ]);
      scans = history;
      if (prefs) preferences = { fullName: prefs.full_name, analysisLanguage: prefs.analysis_language };
    } catch { warning = "Account history could not be loaded. Showing available browser copies; refresh to retry."; }
    return Response.json({ scope: user.userId, mode: "cloud", name: preferences.fullName, email: user.email, aiConfigured: isAIConfigured(), authConfigured: true, scans, preferences, warning }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return apiError(e); }
}
