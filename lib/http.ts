import { NextResponse } from "next/server";
export async function respond(fn: () => Promise<unknown>) {
  try {
    return NextResponse.json(await fn(), { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const status = /debe ser|no reconozco|inválid/i.test(message) ? 400 : /Falta /.test(message) ? 501 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
