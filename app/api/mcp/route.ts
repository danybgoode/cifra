import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { changesSince, getDataset, listPublishers, searchDatasets } from "@/lib/ckan";
import { check69B } from "@/lib/sat69b";
import { STATES, normalizeState } from "@/lib/geo";
import { banxicoSeries } from "@/lib/official";

export const maxDuration = 60;

const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const fail = (e: unknown) => ({ isError: true, content: [{ type: "text" as const, text: e instanceof Error ? e.message : String(e) }] });
const run = async (fn: () => Promise<unknown>) => { try { return json(await fn()); } catch (e) { return fail(e); } };

const handler = createMcpHandler((server) => {
  server.registerTool("buscar_datasets", {
    title: "Buscar datasets públicos de México",
    description: "Busca en el catálogo de datos.gob.mx (1,900+ datasets de 200+ dependencias). Devuelve metadatos normalizados, fecha de última actualización, licencia y enlaces a los archivos.",
    inputSchema: z.object({
      q: z.string().describe("Texto a buscar, p. ej. 'inversión extranjera' o 'incidencia delictiva'"),
      publicador: z.string().optional().describe("ID del publicador, p. ej. 'se' o 'sesnsp' (ver listar_publicadores)"),
      limit: z.number().int().min(1).max(50).default(10),
    }),
  }, (a) => run(() => searchDatasets(a)));

  server.registerTool("ver_dataset", {
    title: "Ver un dataset",
    description: "Metadatos completos de un dataset de datos.gob.mx por ID o slug, con todos sus recursos (archivos).",
    inputSchema: z.object({ id: z.string() }),
  }, ({ id }) => run(() => getDataset(id)));

  server.registerTool("cambios_desde", {
    title: "Qué cambió en los datos públicos",
    description: "Datasets cuyo contenido o metadatos cambiaron desde una fecha, del más reciente al más antiguo. Útil para monitorear publicaciones nuevas.",
    inputSchema: z.object({
      desde: z.string().describe("Fecha ISO, p. ej. 2026-11-01"),
      publicador: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(20),
    }),
  }, (a) => run(() => changesSince(a.desde, { publicador: a.publicador, limit: a.limit })));

  server.registerTool("listar_publicadores", {
    title: "Listar dependencias publicadoras",
    description: "Dependencias que publican en datos.gob.mx, con su número de datasets.",
    inputSchema: z.object({}),
  }, () => run(() => listPublishers()));

  server.registerTool("verificar_rfc_69b", {
    title: "Verificar RFCs en la lista 69-B del SAT",
    description: "Revisa si uno o más RFC aparecen en la lista del SAT de contribuyentes con operaciones presuntamente inexistentes (art. 69-B CFF), y en qué situación.",
    inputSchema: z.object({ rfcs: z.array(z.string()).min(1).max(500) }),
  }, ({ rfcs }) => run(() => check69B(rfcs)));

  server.registerTool("normalizar_entidad", {
    title: "Normalizar entidad federativa",
    description: "Convierte un nombre, abreviatura o clave de estado ('Edomex', 'NL', '9') a la clave INEGI (cve_ent) y nombre oficial. Sin argumento, lista las 32 entidades.",
    inputSchema: z.object({ entrada: z.string().optional() }),
  }, ({ entrada }) => run(async () => (entrada === undefined ? STATES : normalizeState(entrada) ?? { error: `No reconozco '${entrada}' como entidad federativa` })));

  server.registerTool("banxico_series", {
    title: "Series de Banxico (SIE)",
    description: "Último dato o rango de series del Sistema de Información Económica de Banxico, p. ej. SF43718 (tipo de cambio FIX), SF61745 (tasa objetivo).",
    inputSchema: z.object({
      series: z.array(z.string()).min(1).max(20),
      desde: z.string().optional().describe("YYYY-MM-DD"),
      hasta: z.string().optional().describe("YYYY-MM-DD"),
    }),
  }, (a) => run(() => banxicoSeries(a.series, a.desde && a.hasta ? { desde: a.desde, hasta: a.hasta } : undefined)));
});

export { handler as GET, handler as POST, handler as DELETE };
