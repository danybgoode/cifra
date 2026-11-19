# Cifra

**Datos públicos de México en un formato estándar, para personas y agentes de IA.**
Public Mexican government data in one consistent shape, over a REST API and an MCP server.

Cada respuesta incluye su fuente oficial y la fecha de los datos. Ninguna cifra sale de un modelo de lenguaje: todo es lectura y transformación determinista de archivos y APIs oficiales.

- API pública: https://cifra-topaz.vercel.app
- Servidor MCP: `https://cifra-topaz.vercel.app/api/mcp`

## Fuentes

| Fuente | Qué cubre | Acceso |
|---|---|---|
| datos.gob.mx (CKAN) | Catálogo de 1,900+ datasets y qué cambió | Abierto |
| SAT, lista 69-B | Contribuyentes con operaciones presuntamente inexistentes | Abierto |
| Banxico SIE | Tipo de cambio, tasas y miles de series | Token gratuito |
| INEGI (DENUE e Indicadores) | Negocios por ubicación, indicadores nacionales y estatales | Token gratuito |
| INEGI, Marco Geoestadístico | Claves de las 32 entidades (`cve_ent`) | Incluido |

Nota: los archivos de datos de datos.gob.mx se sirven desde `repodatos.atdt.gob.mx`, que hoy rechaza clientes automatizados. Cifra enlaza esos archivos en lugar de copiarlos.

## Herramientas MCP

`buscar_datasets`, `ver_dataset`, `cambios_desde`, `listar_publicadores`, `verificar_rfc_69b`, `normalizar_entidad`, `banxico_series`, `denue_cercanos`, `inegi_indicador`.

```json
{ "cifra": { "url": "https://cifra-topaz.vercel.app/api/mcp" } }
```

## API REST

```
GET /api/v1/datasets?q=inversion extranjera
GET /api/v1/datasets/:id
GET /api/v1/changes?since=2026-11-01
GET /api/v1/sat/69b?rfc=AAA080808HL8
GET /api/v1/geo/states?q=Edomex
```

## Correr localmente

```bash
pnpm install
cp .env.example .env.local   # BANXICO_TOKEN e INEGI_TOKEN son opcionales
pnpm dev
pnpm test
```

## Licencia

Código: MIT. Los datos pertenecen a sus fuentes oficiales y se rigen por sus propias licencias y términos de uso.
