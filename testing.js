import { diagnose } from "./diagnose.js";

// console.log(diagnose({vehicleId: 'tiggo4-15t', codes: ['p0301', 'P0300']}))

const r = diagnose({ vehicleId: 'tiggo4-15t', codes: ['P0301', 'P0300'] });

// Ranking completo de causas
console.table(r.causes.map(c => ({
  id: c.id,
  probability: c.probability,
  codes: c.codes.join(', '),
})));

// Solo la causa compartida
console.log('bujias:', r.causes.find(c => c.id === 'bujias').probability);