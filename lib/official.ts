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

/** INEGI DENUE: establishments around a point (radius in meters, max 5000). `termino` "todos" = any. */
export async function denueCercanos(lat: number, lon: number, radio = 250, termino = "todos") {
  const token = process.env.INEGI_TOKEN;
  if (!token) throw missing("INEGI_TOKEN", "https://www.inegi.org.mx/servicios/api_denue.html");
  const r = Math.min(Math.max(Math.round(radio), 1), 5000);
  const url = `https://www.inegi.org.mx/app/api/denue/v1/consulta/Buscar/${encodeURIComponent(termino)}/${lat},${lon}/${r}/${token}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`INEGI DENUE respondió ${res.status}`);
  const text = await res.text();
  if (!text.trim().startsWith("[")) return [];
  return (JSON.parse(text) as Record<string, string>[]).map((e) => ({
    clee: e.CLEE, nombre: e.Nombre, razon_social: e.Razon_social || null, actividad: e.Clase_actividad,
    personal: e.Estrato, calle: e.Calle, colonia: e.Colonia, cp: e.CP, municipio_y_estado: e.Ubicacion,
    telefono: e.Telefono || null, correo: e.Correo_e || null, web: e.Sitio_internet || null,
    lat: Number(e.Latitud), lon: Number(e.Longitud),
  }));
}

/** INEGI Banco de Indicadores: latest observations of one indicator for an area ("00" national, "07000001".. states). */
export async function inegiIndicador(indicador: string, area = "00", fuente: "BISE" | "BIE" = "BISE") {
  const token = process.env.INEGI_TOKEN;
  if (!token) throw missing("INEGI_TOKEN", "https://www.inegi.org.mx/servicios/api_indicadores.html");
  const url = `https://www.inegi.org.mx/app/api/indicadores/desarrolladores/jsonxml/INDICATOR/${indicador}/es/${area}/false/${fuente}/2.0/${token}?type=json`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  const body = (await res.json()) as unknown;
  if (Array.isArray(body)) throw new Error(`INEGI: ${String(body[0]).replace("ErrorInfo:", "")}`);
  const s = (body as { Series: { INDICADOR: string; UNIT: string; LASTUPDATE: string; OBSERVATIONS: { TIME_PERIOD: string; OBS_VALUE: string }[] }[] }).Series[0];
  return {
    indicador: s.INDICADOR, unidad: s.UNIT, actualizado: s.LASTUPDATE, fuente,
    observaciones: s.OBSERVATIONS.map((o) => ({ periodo: o.TIME_PERIOD, valor: o.OBS_VALUE === "" ? null : Number(o.OBS_VALUE) })),
  };
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
