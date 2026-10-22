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
