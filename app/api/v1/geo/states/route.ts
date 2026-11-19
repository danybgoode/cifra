import { STATES, normalizeState } from "@/lib/geo";
import { respond } from "@/lib/http";
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q");
  return respond(async () => { if (q === null) return STATES; const s = normalizeState(q); if (!s) throw new Error(`No reconozco '${q}' como entidad federativa`); return s; });
}
