import { textAnalysisSchema } from "@/lib/validation";
import { analyzeMessage } from "@/lib/analysis/service";
import { apiError, readJson } from "@/lib/api";
import { Errors } from "@/lib/errors";
import { completeAnalysis, requireSiteUser } from "@/lib/history";
export async function POST(request: Request) {
  try {
    await requireSiteUser();
    const parsed = textAnalysisSchema.safeParse(await readJson(request));
    if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);
    const result = await analyzeMessage(parsed.data.text, parsed.data.context, parsed.data.language);
    return Response.json(await completeAnalysis("message", result));
  } catch (error) { return apiError(error); }
}
