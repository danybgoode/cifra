import { check69B } from "@/lib/sat69b";
import { respond } from "@/lib/http";
export const maxDuration = 60;
export async function GET(req: Request) {
  const rfcs = (new URL(req.url).searchParams.get("rfc") ?? "").split(",").filter(Boolean);
  return respond(async () => { if (!rfcs.length) throw new Error("rfc debe ser una lista separada por comas"); return check69B(rfcs.slice(0, 500)); });
}
