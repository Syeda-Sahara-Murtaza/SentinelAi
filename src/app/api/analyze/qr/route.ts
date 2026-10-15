import { z } from "zod/v4";
import { analyzeMessage, analyzeUrl } from "@/lib/analysis/service";
import { apiError, readJson } from "@/lib/api";
import { Errors } from "@/lib/errors";
import { completeAnalysis, requireSiteUser } from "@/lib/history";
const schema = z.object({ content: z.string().trim().min(1).max(10000) });
// Pixels are decoded in the browser. The server checks the decoded content.
export async function POST(request: Request) {
  try {
    await requireSiteUser();
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) throw Errors.validation("A valid decoded QR value is required.");
    const decodedUrl = parsed.data.content;
    const urlAnalysis = /^https?:/i.test(decodedUrl) ? await analyzeUrl(decodedUrl) : null;
    const analysis = urlAnalysis ?? await analyzeMessage(decodedUrl, "QR code content");
    if (!urlAnalysis) analysis.limitations = [...(analysis.limitations ?? []), "This QR code contains non-web content. Do not open or import it unless you trust the source."];
    return Response.json(await completeAnalysis("qr", { ...analysis, decodedUrl, urlAnalysis }));
  } catch (error) { return apiError(error); }
}
