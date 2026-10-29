import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateManual } from '../utils/validarManual.js';

const manualValido = () => ({
  vehicles: [{
    id: 'v1',
    name: 'Vehículo 1',
    codes: { P0001: { description: 'd', causes: [{ cause: 'c1', probability: 0.5 }] } },
    causes: { c1: { title: 't', component: 'x', steps: [{ text: 'a', expected: 'b' }] } },
  }],
});

test('manual real sin errores y una sola referencia rota (tomando el manual.json sin haberlo modificado)', () => {
  const real = JSON.parse(readFileSync(new URL('../data/manual.json', import.meta.url), 'utf8'));
  const { errors, warnings } = validateManual(real);
  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /sonda-anterior/);
});

test('manual válido no da errores ni warnings', () => {
  assert.deepEqual(validateManual(manualValido()), { errors: [], warnings: [] });
});

test('referencia rota es warning, no error', () => {
  const m = manualValido();
  m.vehicles[0].codes.P0001.causes.push({ cause: 'fantasma', probability: 0.1 });
  const { errors, warnings } = validateManual(m);
  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 1);
});

test('probabilidad fuera de rango o no numérica es error', () => {
  const m = manualValido();
  m.vehicles[0].codes.P0001.causes[0].probability = 1.5;
  assert.equal(validateManual(m).errors.length, 1);
  m.vehicles[0].codes.P0001.causes[0].probability = '0.5';
  assert.equal(validateManual(m).errors.length, 1);
});

test('claves duplicadas tras normalizar son error', () => {
  const m = manualValido();
  m.vehicles[0].codes['P0001 '] = m.vehicles[0].codes.P0001;
  assert.ok(validateManual(m).errors.some(e => /duplicado/.test(e)));
  const m2 = manualValido();
  m2.vehicles[0].codes.p0001 = m2.vehicles[0].codes.P0001;
  assert.ok(validateManual(m2).errors.some(e => /duplicado/.test(e)));
});

test('estructura rota es error y no lanza TypeError', () => {
  assert.equal(validateManual({}).errors.length, 1);
  assert.equal(validateManual(null).errors.length, 1);

  const m = manualValido();
  m.vehicles[0].causes.c1.steps = 'no-es-array';
  assert.ok(validateManual(m).errors.length >= 1);

  const m2 = manualValido();
  delete m2.vehicles[0].codes;
  assert.ok(validateManual(m2).errors.length >= 1);
});

test('vehículos con id repetido son error', () => {
  const m = manualValido();
  m.vehicles.push(structuredClone(m.vehicles[0]));
  assert.ok(validateManual(m).errors.some(e => /duplicado/.test(e)));
});