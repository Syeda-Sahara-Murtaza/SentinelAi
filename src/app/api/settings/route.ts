import { database, requireSiteUser } from "@/lib/history";
import { apiError, readJson } from "@/lib/api";
import { Errors } from "@/lib/errors";
import { z } from "zod/v4";
import { textAnalysisSchema } from "@/lib/validation";
const schema = z.object({ fullName: z.string().trim().max(100), analysisLanguage: textAnalysisSchema.shape.language });
export async function PATCH(request: Request) {
  try {
    const user = await requireSiteUser(); const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) throw Errors.validation("Check your name and language selection.");
    await database().prepare("INSERT INTO sentinel_preferences (user_id,full_name,analysis_language) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET full_name=excluded.full_name, analysis_language=excluded.analysis_language").bind(user.userId,parsed.data.fullName,parsed.data.analysisLanguage).run();
    return Response.json({ ok: true });
  } catch(e) { return apiError(e); }
}
