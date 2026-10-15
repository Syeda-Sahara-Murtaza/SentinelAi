import { urlAnalysisSchema } from "@/lib/validation";
import { analyzeUrl } from "@/lib/analysis/service";
import { apiError, readJson } from "@/lib/api";
import { Errors } from "@/lib/errors";
import { completeAnalysis, requireSiteUser } from "@/lib/history";
export async function POST(request: Request) {
  try {
    await requireSiteUser();
    const parsed = urlAnalysisSchema.safeParse(await readJson(request));
    if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);
    return Response.json(await completeAnalysis("url", await analyzeUrl(parsed.data.url)));
  } catch (error) { return apiError(error); }
}
