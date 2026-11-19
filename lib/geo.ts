// INEGI Marco Geoestadístico: state keys (cve_ent). Deterministic normalization, no model involved.
export type State = { cve_ent: string; nombre: string; abrev: string };

export const STATES: State[] = [
  ["01", "Aguascalientes", "AGS"], ["02", "Baja California", "BC"], ["03", "Baja California Sur", "BCS"],
  ["04", "Campeche", "CAMP"], ["05", "Coahuila de Zaragoza", "COAH"], ["06", "Colima", "COL"],
  ["07", "Chiapas", "CHIS"], ["08", "Chihuahua", "CHIH"], ["09", "Ciudad de México", "CDMX"],
  ["10", "Durango", "DGO"], ["11", "Guanajuato", "GTO"], ["12", "Guerrero", "GRO"],
  ["13", "Hidalgo", "HGO"], ["14", "Jalisco", "JAL"], ["15", "México", "MEX"],
  ["16", "Michoacán de Ocampo", "MICH"], ["17", "Morelos", "MOR"], ["18", "Nayarit", "NAY"],
  ["19", "Nuevo León", "NL"], ["20", "Oaxaca", "OAX"], ["21", "Puebla", "PUE"],
  ["22", "Querétaro", "QRO"], ["23", "Quintana Roo", "QROO"], ["24", "San Luis Potosí", "SLP"],
  ["25", "Sinaloa", "SIN"], ["26", "Sonora", "SON"], ["27", "Tabasco", "TAB"],
  ["28", "Tamaulipas", "TAMPS"], ["29", "Tlaxcala", "TLAX"], ["30", "Veracruz de Ignacio de la Llave", "VER"],
  ["31", "Yucatán", "YUC"], ["32", "Zacatecas", "ZAC"],
].map(([cve_ent, nombre, abrev]) => ({ cve_ent, nombre, abrev }));

const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const ALIASES: Record<string, string> = {
  "coahuila": "05", "michoacan": "16", "veracruz": "30", "distrito federal": "09", "df": "09", "cdmx": "09",
  "ciudad de mexico": "09", "estado de mexico": "15", "edomex": "15", "edo mex": "15", "mexico": "15",
  "queretaro de arteaga": "22", "nuevo leon": "19",
};

const INDEX = new Map<string, string>();
for (const s of STATES) {
  INDEX.set(fold(s.nombre), s.cve_ent);
  INDEX.set(fold(s.abrev), s.cve_ent);
  INDEX.set(s.cve_ent, s.cve_ent);
  INDEX.set(String(Number(s.cve_ent)), s.cve_ent);
}
for (const [k, v] of Object.entries(ALIASES)) INDEX.set(k, v);

/** Returns the INEGI state for a name, abbreviation or key ("Edomex", "15", "Nuevo León"), or null. */
export function normalizeState(input: string | number | null | undefined): State | null {
  if (input === null || input === undefined) return null;
  const key = INDEX.get(fold(String(input)));
  return key ? STATES.find((s) => s.cve_ent === key) ?? null : null;
}
