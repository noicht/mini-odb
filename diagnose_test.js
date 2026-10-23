import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagnose } from './diagnose.js';

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

test('causa compartida combina probabilidades con noisy-or', () => {
  const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301', 'P0300'] });
  const bujias = r.causes.find(c => c.id === 'bujias');
  assert.ok(bujias);
  assert.equal(bujias.codes.length, 2);
  assert.ok(bujias.codes.includes('P0301'));
  assert.ok(bujias.codes.includes('P0300'));
  // noisy-or: 1 - (1-0.3) * (1-0.4) = 1 - 0.7 * 0.6 = 0.58
  assert.equal(Math.round(bujias.probability * 100) / 100, 0.58);
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

test('codes inválido se trata como array vacío', () => {
  const r1 = diagnose({ vehicleId: 'tiggo4-15t', codes: null });
  const r2 = diagnose({ vehicleId: 'tiggo4-15t', codes: undefined });
  const r3 = diagnose({ vehicleId: 'tiggo4-15t', codes: 'P0301' });
  assert.deepEqual(r1.codes, []);
  assert.deepEqual(r2.codes, []);
  assert.deepEqual(r3.codes, []);
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
