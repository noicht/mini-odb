import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagnose } from '../diagnose.js';

test('devuelve las causas de un código, de la más a la menos probable', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301'] });
  assert.deepEqual(r.causes.map((c) => c.id), ['bobina-cil1', 'bujias', 'inyector-cil1']);
});

test('respeta el formato de la respuesta', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301'] });
  assert.equal(r.vehicle, 'Chery Tiggo 4 Pro 1.5T');
  assert.deepEqual(r.codes, [{ code: 'P0301', description: 'Fallo de encendido en el cilindro 1' }]);
  assert.deepEqual(r.notFound, []);
  assert.deepEqual(r.causes[0], {
    id: 'bobina-cil1',
    title: 'Bobina de encendido del cilindro 1 averiada',
    component: 'Bobina de encendido cil. 1',
    probability: 0.45,
    codes: ['P0301'],
    steps: [
      { text: 'Intercambiar la bobina del cilindro 1 con la del 2 y borrar los códigos', expected: 'Si la bobina es la causa, el fallo pasa a P0302' },
      { text: 'Medir la resistencia del primario', expected: '0,5–0,8 Ω' },
    ],
  });
});

test('un vehículo que no existe es un error', () => {
  assert.throws(() => diagnose({ vehicleId: 'no-existe', codes: ['P0300'] }));
});

test('independencia del orden de los códigos', () => {
  const r1 = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301', 'P0300'] });
  const r2 = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0300', 'P0301'] });
  assert.deepEqual(r1, r2);
});

test('causa compartida toma el máximo de las probabilidades', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301', 'P0300'] });
  const bujias = r.causes.find(c => c.id === 'bujias');
  assert.ok(bujias);
  assert.equal(bujias.codes.length, 2);
  assert.ok(bujias.codes.includes('P0301'));
  assert.ok(bujias.codes.includes('P0300'));
  assert.equal(bujias.probability, 0.4);
});

test('código desconocido va a notFound', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301', 'P9999'] });
  assert.deepEqual(r.notFound, ['P9999']);
  assert.equal(r.codes.length, 1);
  assert.equal(r.codes[0].code, 'P0301');
});

test('código con espacios se normaliza', () => {
  const r = diagnose({ vehicleId: 'golf7-14tsi', codes: ['P0420 '] });
  assert.equal(r.codes.length, 1);
  assert.equal(r.codes[0].code, 'P0420');
  assert.equal(r.notFound.length, 0);
});

test('lista vacía de códigos', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: [] });
  assert.deepEqual(r.codes, []);
  assert.deepEqual(r.notFound, []);
  assert.deepEqual(r.causes, []);
});

test('codes que no es un array lanza error', () => {
  assert.throws(() => diagnose({ vehicleId: 'tiggo4-15t', codes: null }), /array/);
  assert.throws(() => diagnose({ vehicleId: 'tiggo4-15t', codes: undefined }), /array/);
  assert.throws(() => diagnose({ vehicleId: 'tiggo4-15t', codes: 'P0301' }), /array/);
});

test('segundo vehículo funciona correctamente', () => {
  const r = diagnose({ vehicleId: 'golf7-14tsi', codes: ['P0300'] });
  assert.equal(r.vehicle, 'Volkswagen Golf VII 1.4 TSI');
  assert.deepEqual(r.causes.map(c => c.id), ['bobina-lapiz', 'bujias', 'carbonilla']);
});

test('códigos duplicados se manejan correctamente', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301', 'P0301', 'P0300'] });
  assert.equal(r.codes.length, 2);
  assert.deepEqual(r.codes.map(c => c.code), ['P0300', 'P0301']);
  assert.deepEqual(r.notFound, []);
});

test('todos los códigos desconocidos', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P9999', 'P8888'] });
  assert.deepEqual(r.codes, []);
  assert.deepEqual(r.causes, []);
  assert.deepEqual(r.notFound, ['P8888', 'P9999']);
});

test('un código existe en un vehículo pero no en otro', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0171'] });
  assert.deepEqual(r.notFound, ['P0171']);
});

test('excludedCauses filtra causas ya revisadas', () => {
  const r1 = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301'] });
  assert.deepEqual(r1.causes.map(c => c.id), ['bobina-cil1', 'bujias', 'inyector-cil1']);
  const r2 = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301'], excludedCauses: ['bobina-cil1'] });
  assert.deepEqual(r2.causes.map(c => c.id), ['bujias', 'inyector-cil1']);
  const r3 = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301'], excludedCauses: ['bobina-cil1', 'bujias'] });
  assert.deepEqual(r3.causes.map(c => c.id), ['inyector-cil1']);
});

test('excludedCauses que no es un array lanza error', () => {
  assert.throws(() => diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301'], excludedCauses: null }), /array/);
  assert.throws(() => diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301'], excludedCauses: 'bujias' }), /array/);
});

test('código en minúsculas se normaliza', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['p0301'] });
  assert.deepEqual(r.codes.map(c => c.code), ['P0301']);
  assert.deepEqual(r.notFound, []);
});

test('espacios y minúsculas a la vez', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['  p0301  '] });
  assert.equal(r.codes[0].code, 'P0301');
  assert.deepEqual(r.notFound, []);
});

test('duplicados con distinta forma cuentan una sola vez', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301', 'p0301', ' P0301 '] });
  assert.equal(r.codes.length, 1);
});

test('código desconocido en minúsculas va a notFound normalizado', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: [' p9999 '] });
  assert.deepEqual(r.notFound, ['P9999']);
});

test('código vacío o solo espacios lanza error', () => {
  assert.throws(() => diagnose({ vehicleId: 'tiggo4-15t', codes: ['   '] }), /vacío/);
  assert.throws(() => diagnose({ vehicleId: 'tiggo4-15t', codes: [''] }), /vacío/);
});


test('modificar el resultado no contamina el manual', () => {
  const a = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301'] });
  a.causes[0].steps[0].text = 'MUTADO';
  a.causes[0].steps.push({ text: 'x', expected: 'y' });
  const b = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301'] });
  assert.equal(b.causes[0].steps.length, 2);
  assert.notEqual(b.causes[0].steps[0].text, 'MUTADO');
});

test('empate de probabilidad se desempata por id', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0300', 'P0301'] });
  assert.deepEqual(r.causes.map(c => c.id),
    ['bobina-cil1', 'bujias', 'inyector-cil1', 'toma-aire', 'presion-combustible']);
});

test('excluir no altera las probabilidades de las demás', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301'], excludedCauses: ['bujias'] });
  assert.deepEqual(r.causes.map(c => [c.id, c.probability]), [['bobina-cil1', 0.45], ['inyector-cil1', 0.25]]);
});

test('excluir una causa compartida la saca de todos los códigos', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0300', 'P0301'], excludedCauses: ['bujias'] });
  assert.ok(!r.causes.some(c => c.id === 'bujias'));
  assert.equal(r.codes.length, 2);
});

test('excluir todas las causas deja causes vacío y el código encontrado', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301'], excludedCauses: ['bobina-cil1', 'bujias', 'inyector-cil1'] });
  assert.deepEqual(r.causes, []);
  assert.equal(r.codes.length, 1);
});

test('el orden de excludedCauses no importa', () => {
  const a = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0300'], excludedCauses: ['bujias', 'toma-aire'] });
  const b = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0300'], excludedCauses: ['toma-aire', 'bujias'] });
  assert.deepEqual(a, b);
});

test('excluir un id inexistente se ignora', () => {
  const sin = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301'] });
  const con = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301'], excludedCauses: ['no-existe'] });
  assert.deepEqual(con, sin);
});

test('excludedCauses con elemento no string lanza error', () => {
  assert.throws(() => diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301'], excludedCauses: [null] }), /inválida/);
  assert.throws(() => diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301'], excludedCauses: [123] }), /inválida/);
});

test('tercer vehículo (Clio) funciona', () => {
  const r = diagnose({ vehicleId: 'clio4-15dci', codes: ['P0087', 'P0401'] });
  assert.deepEqual(r.causes.map(c => [c.id, c.probability]),
    [['egr-obstruida', 0.6], ['filtro-gasoil', 0.5], ['sensor-egr', 0.4], ['bomba-alta', 0.3], ['regulador-presion', 0.2]]);
});