import { searchDatasets } from "@/lib/ckan";
import { respond } from "@/lib/http";
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  return respond(() => searchDatasets({ q: p.get("q") ?? "", publicador: p.get("publicador") ?? undefined, limit: Number(p.get("limit") ?? 10), offset: Number(p.get("offset") ?? 0) }));
}
