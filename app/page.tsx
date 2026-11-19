export default function Home() {
  return (
    <main>
      <h1>Cifra</h1>
      <p>Datos públicos de México en un formato estándar, para personas y agentes de IA. Cada respuesta incluye su fuente oficial y fecha.</p>
      <h2>Servidor MCP</h2>
      <pre>{`{ "cifra": { "url": "https://<este-dominio>/api/mcp" } }`}</pre>
      <p>Herramientas: buscar_datasets, ver_dataset, cambios_desde, listar_publicadores, verificar_rfc_69b, normalizar_entidad, banxico_series, denue_cercanos, inegi_indicador.</p>
      <h2>API REST</h2>
      <ul>
        <li><code>GET /api/v1/datasets?q=inversion extranjera</code></li>
        <li><code>GET /api/v1/datasets/:id</code></li>
        <li><code>GET /api/v1/changes?since=2026-11-01</code></li>
        <li><code>GET /api/v1/sat/69b?rfc=AAA080808HL8,XAXX010101000</code></li>
        <li><code>GET /api/v1/geo/states?q=Edomex</code></li>
      </ul>
      <p>Fuentes: datos.gob.mx (catálogo), SAT (lista 69-B), Banxico SIE, INEGI.</p>
    </main>
  );
}
