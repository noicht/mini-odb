# Mini-OBD — contexto para el agente

Prueba técnica de Motormind. Implementación de `diagnose({ vehicleId, codes })` en `diagnose.js`.

## Stack

- Node >= 20, ES modules (`"type": "module"`), solo `node:*` builtins. Sin dependencias externas.
- Tests: `npm test` (equivale a `node --test`). Los tests viven en `diagnose_test.js`.
- Datos: `data/manual.json` — "manual de taller" derivado de PDFs; puede contener irregularidades (claves con espacios, referencias rotas, etc.). Verificar los datos antes de asumir que están limpios.

## Reglas del dominio

- Causas ordenadas de mayor a menor probabilidad, con desempate determinista.
- El resultado debe ser idéntico sin importar el orden de los códigos de entrada.
- Códigos no presentes en el manual del vehículo van a `notFound`.
- Vehículo inexistente → `Error`.
- Cuando varios códigos apuntan a la misma causa, la probabilidad se combina con noisy-or (`1 - Π(1 - p_i)`) y `cause.codes` lista todos los códigos que la apuntan. Decisión documentada en `DECISIONES.md`.

## Estilo

- Español para términos de dominio y mensajes de error; código simple y legible.
- Sin abstracciones innecesarias; el código se va a modificar en vivo en una entrevista.
- Comentarios solo donde aporten; el README es la fuente de verdad del contrato.
