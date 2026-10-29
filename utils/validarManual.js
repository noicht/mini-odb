const isObject = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

/**
 * Valida la estructura del manual.
 * - errors: estructura rota (quien llama debe lanzar).
 * - warnings: referencias rotas a causas (se reportan y se saltean).
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateManual(manual) {
  const errors = [];
  const warnings = [];

  if (!manual || !Array.isArray(manual.vehicles)) {
    return { errors: ['"vehicles" debe ser un array'], warnings };
  }

  const vehicleIds = new Set();
  for (const vehicle of manual.vehicles) {
    const vid = vehicle?.id;
    if (typeof vid !== 'string' || !vid) {
      errors.push('Vehículo sin id válido');
      continue;
    }
    if (vehicleIds.has(vid)) errors.push(`Vehículo "${vid}" duplicado`);
    vehicleIds.add(vid);

    if (typeof vehicle.name !== 'string' || !vehicle.name) {
      errors.push(`Vehículo "${vid}": falta "name"`);
    }
    if (!isObject(vehicle.codes) || !isObject(vehicle.causes)) {
      errors.push(`Vehículo "${vid}": "codes" y "causes" deben ser objetos`);
      continue;
    }

    validateCauses(vid, vehicle.causes, errors);
    validateCodes(vid, vehicle, errors, warnings);
  }

  return { errors, warnings };
}

function validateCauses(vid, causes, errors) {
  for (const [causeId, def] of Object.entries(causes)) {
    const where = `Vehículo "${vid}", causa "${causeId}"`;
    if (!isObject(def) || typeof def.title !== 'string' || typeof def.component !== 'string' || !Array.isArray(def.steps)) {
      errors.push(`${where}: debe tener title, component y steps (array)`);
      continue;
    }
    for (const step of def.steps) {
      if (!isObject(step) || typeof step.text !== 'string' || typeof step.expected !== 'string') {
        errors.push(`${where}: paso inválido (necesita text y expected)`);
      }
    }
  }
}

function validateCodes(vid, vehicle, errors, warnings) {
  const seenKeys = new Set();
  for (const [rawKey, data] of Object.entries(vehicle.codes)) {
    const key = rawKey.trim().toUpperCase();
    const where = `Vehículo "${vid}", código "${key}"`;
    if (seenKeys.has(key)) errors.push(`${where}: duplicado después de normalizar`);
    seenKeys.add(key);

    if (!isObject(data) || typeof data.description !== 'string' || !Array.isArray(data.causes)) {
      errors.push(`${where}: debe tener description y causes (array)`);
      continue;
    }
    for (const ref of data.causes) {
      if (!isObject(ref) || typeof ref.cause !== 'string') {
        errors.push(`${where}: referencia a causa inválida`);
        continue;
      }
      if (typeof ref.probability !== 'number' || !(ref.probability >= 0 && ref.probability <= 1)) {
        errors.push(`${where}, causa "${ref.cause}": probabilidad inválida (debe estar entre 0 y 1)`);
      }
      if (!Object.hasOwn(vehicle.causes, ref.cause)) {
        warnings.push(`${where}: causa "${ref.cause}" no está definida`);
      }
    }
  }
}