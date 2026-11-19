// Official APIs that require a free personal token. Each adapter is inert until its token is set.
const missing = (name: string, url: string) =>
  new Error(`Falta ${name}. Es gratuito: regístralo en ${url} y agrégalo como variable de entorno.`);

/** Banxico SIE: latest value(s) of one or more series, e.g. SF43718 (FIX USD/MXN). */
export async function banxicoSeries(series: string[], rango?: { desde: string; hasta: string }) {
  const token = process.env.BANXICO_TOKEN;
  if (!token) throw missing("BANXICO_TOKEN", "https://www.banxico.org.mx/SieAPIRest/service/v1/token");
  const ids = series.map((s) => s.trim().toUpperCase()).filter(Boolean).join(",");
  const path = rango ? `datos/${rango.desde}/${rango.hasta}` : "datos/oportuno";
  const res = await fetch(`https://www.banxico.org.mx/SieAPIRest/service/v1/series/${ids}/${path}`, {
    headers: { "Bmx-Token": token, accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Banxico SIE respondió ${res.status}`);
  const body = (await res.json()) as { bmx: { series: { idSerie: string; titulo: string; datos?: { fecha: string; dato: string }[] }[] } };
  return body.bmx.series.map((s) => ({
    serie: s.idSerie, titulo: s.titulo,
    datos: (s.datos ?? []).map((d) => ({ fecha: d.fecha, valor: d.dato === "N/E" ? null : Number(d.dato.replace(/,/g, "")) })),
    fuente: `https://www.banxico.org.mx/SieInternet/consultarDirectorioInternetAction.do?sector=&idCuadro=&locale=es&serie=${s.idSerie}`,
  }));
}

/** INEGI DENUE: establishments matching a term within a state (cve_ent "00" = national). */
export async function denueBuscar(termino: string, cveEnt: string, desde = 1, hasta = 25) {
  const token = process.env.INEGI_TOKEN;
  if (!token) throw missing("INEGI_TOKEN", "https://www.inegi.org.mx/servicios/api_denue.html");
  const url = `https://www.inegi.org.mx/app/api/denue/v1/consulta/BuscarEntidad/${encodeURIComponent(termino)}/${cveEnt}/${desde}/${hasta}/${token}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`INEGI DENUE respondió ${res.status}`);
  return (await res.json()) as unknown[];
}
