import { database, requireSiteUser } from "@/lib/history";
import { apiError } from "@/lib/api";
export async function DELETE() {
  try { const user = await requireSiteUser(); await database().prepare("DELETE FROM sentinel_scans WHERE user_id = ?").bind(user.userId).run(); return Response.json({ ok: true }); }
  catch(e) { return apiError(e); }
}
