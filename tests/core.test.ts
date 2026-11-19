import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeState, STATES } from "../lib/geo.ts";
import { parse69B, RFC_RE, normalizeRfc } from "../lib/sat69b.ts";

test("32 entidades con claves únicas", () => {
  assert.equal(STATES.length, 32);
  assert.equal(new Set(STATES.map((s) => s.cve_ent)).size, 32);
});

test("normaliza nombres, abreviaturas y claves", () => {
  assert.equal(normalizeState("Edomex")?.cve_ent, "15");
  assert.equal(normalizeState("nuevo leon")?.cve_ent, "19");
  assert.equal(normalizeState("NL")?.cve_ent, "19");
  assert.equal(normalizeState(9)?.cve_ent, "09");
  assert.equal(normalizeState("Distrito Federal")?.nombre, "Ciudad de México");
  assert.equal(normalizeState("Querétaro")?.cve_ent, "22");
  assert.equal(normalizeState("Atlantis"), null);
});

test("valida RFC de personas morales y físicas", () => {
  assert.ok(RFC_RE.test("AAA080808HL8"));
  assert.ok(RFC_RE.test(normalizeRfc(" vapd-870512-ab1 ")));
  assert.ok(!RFC_RE.test("123"));
});

test("parsea el listado 69-B real (primeras filas)", () => {
  const list = parse69B(readFileSync(new URL("./fixtures/69b-head.csv", import.meta.url), "utf8"));
  assert.equal(list.asOf, "31 de diciembre de 2025");
  assert.ok(list.total >= 30);
  const e = list.byRfc.get("AAA080808HL8");
  assert.equal(e?.situacion, "Sentencia Favorable");
  assert.equal(e?.fechas.presunto_sat, "01/06/2018");
});
