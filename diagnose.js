import { readFileSync } from 'node:fs';
import { validateManual } from './utils/validarManual.js';

const rawManual = JSON.parse(readFileSync(new URL('./data/manual.json', import.meta.url), 'utf8'));

// Se valida antes de normalizar y de usar el manual
const { errors, warnings } = validateManual(rawManual);
if (errors.length > 0) {
  throw new Error(`Manual con errores:\n${errors.map(e => `  - ${e}`).join('\n')}`);
}
for (const w of warnings) {
  console.warn(`[manual] ${w}`);
}

// Normalizar claves de códigos (trim + mayúsculas, igual que la entrada)
const manual = {
  ...rawManual,
  vehicles: rawManual.vehicles.map(vehicle => ({
    ...vehicle,
    codes: Object.fromEntries(
      Object.entries(vehicle.codes).map(([key, value]) => [key.trim().toUpperCase(), value])
    )
  }))
};

/**
 * @param {{ vehicleId: string, codes: string[], excludedCauses?: string[] }} input
 * @returns {{
 *   vehicle: string,
 *   codes: { code: string, description: string }[],
 *   notFound: string[],
 *   causes: {
 *     id: string, title: string, component: string, probability: number,
 *     codes: string[], steps: { text: string, expected: string }[]
 *   }[]
 * }}
 */
export function diagnose({ vehicleId, codes, excludedCauses = [] }) {
  const vehicle = manual.vehicles.find(v => v.id === vehicleId);
  if (!vehicle) {
    throw new Error(`Vehículo con id "${vehicleId}" no encontrado`);
  }

  if (!Array.isArray(codes)) {
    throw new Error('"codes" debe ser un array de strings');
  }
  if (!Array.isArray(excludedCauses)) {
    throw new Error('"excludedCauses" debe ser un array de strings');
  }
  // Set: el orden de las causas excluidas no influye en el resultado
  const excluded = new Set();
  for (const id of excludedCauses) {
    if (typeof id !== 'string') { 
      throw new Error(`Causa excluida inválida: ${id}`);
    }
    excluded.add(id.trim());
  }

  // Deduplicar códigos manteniendo orden de primera aparición
  const uniqueCodes = [];
  const seen = new Set();
  for (const code of codes) {
    if (typeof code !== 'string') {
      throw new Error(`Código inválido: ${code}`);
    }
    
    
      const normalizedCode = code.trim().toUpperCase();


    if (!normalizedCode) {
      throw new Error('Código vacío');
    }
    
    if (!seen.has(normalizedCode)) {
      seen.add(normalizedCode);
      uniqueCodes.push(normalizedCode);
    }
  }

  // Separar códigos encontrados y no encontrados
  const foundCodes = [];
  const notFound = [];
  for (const normalizedCode of uniqueCodes) {
    const codeData = vehicle.codes[normalizedCode];
    if (codeData) {
      foundCodes.push({ code: normalizedCode, description: codeData.description });
    } else {
      notFound.push(normalizedCode);
    }
  }

  // Orden alfabético para resultado determinista
  foundCodes.sort((a, b) => a.code.localeCompare(b.code));
  notFound.sort();

  // Recolectar causas; si varios códigos apuntan a la misma, se toma el máximo
  const causesMap = new Map();
  for (const codeInfo of foundCodes) {
    const codeKey = codeInfo.code;
    const codeData = vehicle.codes[codeKey];

    for (const causeRef of codeData.causes) {
      const causeId = causeRef.cause;
      if (excluded.has(causeId)) continue;
      const causeDef = vehicle.causes[causeId];
      if (!causeDef) continue;

      if (causesMap.has(causeId)) {
        const existing = causesMap.get(causeId);
        existing.codes.push(codeKey);
        existing.probability = Math.max(existing.probability, causeRef.probability);
      } else {
        causesMap.set(causeId, {
          id: causeId,
          title: causeDef.title,
          component: causeDef.component,
          steps: causeDef.steps.map(step => ({ ...step })),
          probability: causeRef.probability,
          codes: [codeKey]
        });
      }
    }
  }

  for (const cause of causesMap.values()) {
    cause.codes.sort();
  }

  // Probabilidad descendente, desempate por id ascendente
  const causes = Array.from(causesMap.values()).sort((a, b) => {
    if (b.probability !== a.probability) 
      {
        return b.probability - a.probability;
      }
    return a.id.localeCompare(b.id);
  });

  return { vehicle: vehicle.name, codes: foundCodes, notFound, causes };
}