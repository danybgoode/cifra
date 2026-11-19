// datos.gob.mx catalog (CKAN Action API). Metadata only: the data files themselves are served from
// repodatos.atdt.gob.mx, which currently refuses automated clients, so Cifra links to them instead of fetching them.
const BASE = "https://www.datos.gob.mx/api/3/action";
const UA = "cifra/0.1 (catalogo de datos publicos de Mexico)";

export type Resource = { id: string; nombre: string; formato: string; url: string };
export type Dataset = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  publicador: { id: string; nombre: string } | null;
  licencia: string | null;
  actualizado: string; // ISO date-time, from CKAN metadata_modified
  etiquetas: string[];
  recursos: Resource[];
  fuente: string; // human page on datos.gob.mx
};

type CkanResource = { id: string; name?: string; format?: string; url?: string };
type CkanPackage = {
  id: string; name: string; title: string; notes?: string; license_title?: string; metadata_modified: string;
  organization?: { name: string; title: string } | null; tags?: { name: string }[]; resources?: CkanResource[];
};

async function call<T>(action: string, params: Record<string, string | number>): Promise<T> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const res = await fetch(`${BASE}/${action}?${qs}`, {
    headers: { "user-agent": UA, accept: "application/json" },
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`datos.gob.mx ${action} respondió ${res.status}`);
  const body = (await res.json()) as { success: boolean; result: T; error?: unknown };
  if (!body.success) throw new Error(`datos.gob.mx ${action} falló: ${JSON.stringify(body.error)}`);
  return body.result;
}

export function normalizePackage(p: CkanPackage): Dataset {
  return {
    id: p.id,
    slug: p.name,
    titulo: p.title,
    descripcion: (p.notes ?? "").trim(),
    publicador: p.organization ? { id: p.organization.name, nombre: p.organization.title } : null,
    licencia: p.license_title ?? null,
    actualizado: p.metadata_modified.endsWith("Z") ? p.metadata_modified : `${p.metadata_modified}Z`,
    etiquetas: (p.tags ?? []).map((t) => t.name),
    recursos: (p.resources ?? []).map((r) => ({
      id: r.id, nombre: r.name ?? "", formato: (r.format ?? "").toUpperCase(), url: r.url ?? "",
    })),
    fuente: `https://www.datos.gob.mx/dataset/${p.name}`,
  };
}

export async function searchDatasets(opts: { q?: string; publicador?: string; limit?: number; offset?: number }) {
  const fq = opts.publicador ? `organization:${opts.publicador}` : "";
  const r = await call<{ count: number; results: CkanPackage[] }>("package_search", {
    q: opts.q ?? "", fq, rows: Math.min(opts.limit ?? 10, 50), start: opts.offset ?? 0,
  });
  return { total: r.count, datasets: r.results.map(normalizePackage) };
}

export async function getDataset(idOrSlug: string) {
  return normalizePackage(await call<CkanPackage>("package_show", { id: idOrSlug }));
}

/** Datasets whose metadata changed since `since` (ISO date), newest first. */
export async function changesSince(since: string, opts: { publicador?: string; limit?: number } = {}) {
  const d = new Date(since);
  if (Number.isNaN(d.getTime())) throw new Error("`since` debe ser una fecha ISO, p. ej. 2026-11-01");
  const fq = [`metadata_modified:[${d.toISOString()} TO *]`, opts.publicador ? `organization:${opts.publicador}` : ""]
    .filter(Boolean).join(" AND ");
  const r = await call<{ count: number; results: CkanPackage[] }>("package_search", {
    fq, sort: "metadata_modified desc", rows: Math.min(opts.limit ?? 20, 100),
  });
  return { desde: d.toISOString(), total: r.count, datasets: r.results.map(normalizePackage) };
}

export async function listPublishers() {
  const r = await call<{ name: string; title: string; package_count: number }[]>("organization_list", {
    all_fields: "true", limit: 1000,
  });
  return r.map((o) => ({ id: o.name, nombre: o.title, datasets: o.package_count }))
    .sort((a, b) => b.datasets - a.datasets);
}
