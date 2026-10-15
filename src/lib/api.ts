import { Errors, handleError } from "@/lib/errors";

export async function readJson(request: Request) {
  try { return await request.json(); } catch { throw Errors.validation("The request must contain valid JSON."); }
}
export function apiError(error: unknown) {
  const handled = handleError(error);
  return Response.json({ error: { message: handled.message, category: handled.category } }, { status: handled.statusCode });
}
export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, signal: options?.signal ?? AbortSignal.timeout(45_000) });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error((data as { error?: { message?: string } } | null)?.error?.message || "The service could not complete this request. Please try again.");
  return data as T;
}
