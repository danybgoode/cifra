import { changesSince } from "@/lib/ckan";
import { respond } from "@/lib/http";
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const since = p.get("since") ?? new Date(Date.now() - 86400000).toISOString();
  return respond(() => changesSince(since, { publicador: p.get("publicador") ?? undefined, limit: Number(p.get("limit") ?? 20) }));
}
