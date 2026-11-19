// SAT list of taxpayers presumed to issue invoices for non-existent operations (CFF art. 69-B).
// Public file, Latin-1 CSV with two preamble lines. Parsed deterministically and cached per instance.
import Papa from "papaparse";

export const SOURCE_URL = "http://omawww.sat.gob.mx/cifras_sat/Documents/Listado_Completo_69-B.csv";
const TTL_MS = 6 * 60 * 60 * 1000;

export type Situacion = "Presunto" | "Desvirtuado" | "Definitivo" | "Sentencia Favorable" | string;
export type Entry = {
  rfc: string;
  nombre: string;
  situacion: Situacion;
  fechas: { presunto_sat: string | null; presunto_dof: string | null; definitivo_dof: string | null; desvirtuado_dof: string | null; sentencia_favorable_dof: string | null };
};
export type List69B = { asOf: string | null; total: number; porSituacion: Record<string, number>; byRfc: Map<string, Entry> };

export const RFC_RE = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;
export const normalizeRfc = (s: string) => s.trim().toUpperCase().replace(/[\s-]/g, "");

const blank = (s: string | undefined) => (s && s.trim() ? s.trim() : null);

export function parse69B(text: string): List69B {
  const lines = text.split(/\r?\n/);
  const asOfMatch = lines[0]?.match(/actualizada al ([0-9]{1,2} de [a-záéíóú]+ de [0-9]{4})/i);
  const headerIdx = lines.findIndex((l) => /^"?No"?,\s*"?RFC"?/i.test(l));
  if (headerIdx < 0) throw new Error("Formato inesperado del listado 69-B: no se encontró el encabezado");
  const rows = Papa.parse<string[]>(lines.slice(headerIdx + 1).join("\n"), { skipEmptyLines: true }).data;
  const byRfc = new Map<string, Entry>();
  const porSituacion: Record<string, number> = {};
  for (const r of rows) {
    const rfc = normalizeRfc(r[1] ?? "");
    if (!rfc) continue;
    const situacion = (r[3] ?? "").trim();
    porSituacion[situacion] = (porSituacion[situacion] ?? 0) + 1;
    byRfc.set(rfc, {
      rfc, nombre: (r[2] ?? "").trim(), situacion,
      fechas: { presunto_sat: blank(r[5]), presunto_dof: blank(r[7]), desvirtuado_dof: blank(r[11]), definitivo_dof: blank(r[15]), sentencia_favorable_dof: blank(r[19]) },
    });
  }
  return { asOf: asOfMatch?.[1] ?? null, total: byRfc.size, porSituacion, byRfc };
}

let cache: { at: number; list: List69B } | null = null;

export async function load69B(): Promise<List69B> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.list;
  const res = await fetch(SOURCE_URL, { headers: { "user-agent": "cifra/0.1" }, cache: "no-store" });
  if (!res.ok) throw new Error(`SAT 69-B respondió ${res.status}`);
  const text = new TextDecoder("latin1").decode(await res.arrayBuffer());
  cache = { at: Date.now(), list: parse69B(text) };
  return cache.list;
}

/** Checks RFCs against the list. Invalid RFCs are reported, not silently dropped. */
export async function check69B(rfcs: string[]) {
  const list = await load69B();
  const resultados = rfcs.map((raw) => {
    const rfc = normalizeRfc(raw);
    if (!RFC_RE.test(rfc)) return { rfc, valido: false as const, enLista: false, entrada: null };
    const e = list.byRfc.get(rfc) ?? null;
    return { rfc, valido: true as const, enLista: !!e, entrada: e };
  });
  return {
    fuente: SOURCE_URL, actualizadoAl: list.asOf, resultados,
    nota: "“Definitivo” significa que el SAT confirmó operaciones inexistentes: sus facturas no deben deducirse. “Presunto” está en revisión.",
  };
}
