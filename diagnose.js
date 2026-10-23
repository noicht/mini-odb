import { readFileSync } from 'node:fs';

const rawManual = JSON.parse(readFileSync(new URL('./data/manual.json', import.meta.url), 'utf8'));

// Normalizar claves de códigos (trim para manejar espacios como "P0420 ")
const manual = {
  ...rawManual,
  vehicles: rawManual.vehicles.map(vehicle => ({
    ...vehicle,
    codes: Object.fromEntries(
      Object.entries(vehicle.codes).map(([key, value]) => [key.trim(), value])
    )
  }))
};

/**
 * @param {{ vehicleId: string, codes: string[] }} input
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
export function diagnose({ vehicleId, codes }) {
  // Validar vehículo
  const vehicle = manual.vehicles.find(v => v.id === vehicleId);
  if (!vehicle) {
    throw new Error(`Vehículo con id "${vehicleId}" no encontrado`);
  }

  // Normalizar codes a array
  const inputCodes = Array.isArray(codes) ? codes : [];

  // Deduplicar códigos manteniendo orden de primera aparición
  const uniqueCodes = [];
  const seen = new Set();
  for (const code of inputCodes) {
    const normalizedCode = code.trim();
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
      foundCodes.push({
        code: normalizedCode,
        description: codeData.description
      });
    } else {
      notFound.push(normalizedCode);
    }
  }

  // Ordenar codes y notFound alfabéticamente para resultado determinista
  foundCodes.sort((a, b) => a.code.localeCompare(b.code));
  notFound.sort();

  // Recolectar causas con noisy-or
  const causesMap = new Map();

  for (const codeInfo of foundCodes) {
    const codeKey = codeInfo.code;
    const codeData = vehicle.codes[codeKey];

    for (const causeRef of codeData.causes) {
      const causeId = causeRef.cause;
      const causeDef = vehicle.causes[causeId];

      if (!causeDef) continue;

      if (causesMap.has(causeId)) {
        const existing = causesMap.get(causeId);
        existing.codes.push(codeKey);
        // Noisy-or: 1 - Π(1 - p_i)
        existing.probability = 1 - (1 - existing.probability) * (1 - causeRef.probability);
      } else {
        causesMap.set(causeId, {
          id: causeId,
          title: causeDef.title,
          component: causeDef.component,
          steps: [...causeDef.steps],
          probability: causeRef.probability,
          codes: [codeKey]
        });
      }
    }
  }

  // Ordenar códigos dentro de cada causa alfabéticamente
  for (const cause of causesMap.values()) {
    cause.codes.sort();
  }

  // Convertir a array y ordenar por probabilidad descendente, desempate por ID ascendente
  const causes = Array.from(causesMap.values()).sort((a, b) => {
    if (b.probability !== a.probability) {
      return b.probability - a.probability;
    }
    return a.id.localeCompare(b.id);
  });

  return {
    vehicle: vehicle.name,
    codes: foundCodes,
    notFound,
    causes
  };
}
