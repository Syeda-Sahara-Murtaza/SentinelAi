import { transcribeAudio, isAIConfigured } from "@/lib/ai/provider";
import { analyzeMessage } from "@/lib/analysis/service";
import { apiError, readJson } from "@/lib/api";
import { Errors } from "@/lib/errors";
import { audioUploadSchema, textAnalysisSchema } from "@/lib/validation";
import { completeAnalysis, requireSiteUser } from "@/lib/history";
export async function POST(request: Request) {
  try {
    await requireSiteUser();
    let transcript: string; let duration: number | null = null;
    let language = "auto";
    if (request.headers.get("content-type")?.includes("application/json")) {
      const parsed = textAnalysisSchema.safeParse(await readJson(request));
      if (!parsed.success) throw Errors.validation(parsed.error.issues[0].message);
      transcript = parsed.data.text; language = parsed.data.language;
    } else {
      if (!isAIConfigured()) throw Errors.transcription("Audio transcription is not connected. Use the transcript tab to analyze the words from a call.");
      const form = await request.formData();
      const file = form.get("audio");
      if (!(file instanceof File) || file.size === 0) throw Errors.file("Select a nonempty audio file.");
      const parsed = audioUploadSchema.safeParse(file);
      if (!parsed.success) throw Errors.file(parsed.error.issues[0].message);
      const transcribed = await transcribeAudio(file);
      transcript = transcribed.transcript; duration = transcribed.duration;
      const lang = textAnalysisSchema.shape.language.safeParse(form.get("language") ?? "auto");
      if (lang.success) language = lang.data;
    }
    if (!transcript.trim()) throw Errors.file("No speech was found in the recording.");
    if (transcript.length > 10000) throw Errors.validation("This transcript exceeds 10,000 characters. Analyze a shorter recording or excerpt.");
    const analysis = await analyzeMessage(transcript, "voice transcript", language);
    return Response.json(await completeAnalysis("voice", { ...analysis, transcript, duration }));
  } catch (error) { return apiError(error); }
}
