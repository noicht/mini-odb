# Mini-OBD: del código de avería a las causas

En Motormind ayudamos a mecánicos de taller a diagnosticar coches. El mecánico conecta el equipo de diagnosis, lee uno o más códigos de avería (códigos OBD, como `P0300`) y nos pregunta qué puede estar pasando. Le respondemos con las causas posibles **de ese vehículo**, de la más a la menos probable, y cada una con los pasos para comprobarla en el taller.

Este proyecto es la versión mínima de ese problema.

## La tarea

Implementá `diagnose({ vehicleId, codes })` en `diagnose.js`.

- `data/manual.json` es nuestro «manual de taller»: vehículos, los códigos de cada vehículo, las causas de cada código con su probabilidad y los pasos de comprobación. Como el de verdad, sale de procesar PDFs de manuales.
- La función recibe el id de un vehículo y los códigos que leyó el mecánico, y devuelve:

```js
{
  vehicle: 'Chery Tiggo 4 Pro 1.5T',
  codes: [{ code: 'P0301', description: 'Fallo de encendido en el cilindro 1' }], // los que encontró
  notFound: [],                                                                  // los que no
  causes: [
    {
      id: 'bobina-cil1',
      title: 'Bobina de encendido del cilindro 1 averiada',
      component: 'Bobina de encendido cil. 1',
      probability: 0.45,
      codes: ['P0301'],            // qué códigos apuntan a esta causa
      steps: [{ text: '…', expected: '…' }],
    },
    // …
  ],
}
```

Reglas:

1. Las causas van de la más a la menos probable.
2. Si un código no está en el manual para ese vehículo, el mecánico tiene que enterarse.
3. Si el vehículo no existe, la función lanza un error.
4. El resultado no puede depender del orden en que lleguen los códigos.
5. **Esto lo decidís vos:** si dos códigos apuntan a la misma causa, ¿cómo se muestra y qué probabilidad tiene? Elegí una opción y explicala en `DECISIONES.md`.

## Cómo trabajar

- **Usá la IA para todo lo que quieras** (Claude Code, Cursor, Copilot, ChatGPT…). No buscamos que escribas el código a mano, sino ver cómo trabajás con ella.
- **Tiempo orientativo: 15 minutos.** No pasa nada si te pasás, pero anotá cuánto tardaste.
- No hay nada que instalar. Hace falta Node 20 o superior.

```bash
npm test        # o: node --test
```

Hay 3 tests de ejemplo. **Después vamos a correr más tests, con casos que no están acá.**

## Qué entregar

Un zip (o un repo) con:

1. **Tu código.** Commiteá cuando te parezca.
2. **El historial completo de tu conversación con la IA, sin editar.** Nos interesa cómo trabajaste, no que quede prolijo.
   - Claude Code: el archivo `.jsonl` de la sesión, en `~/.claude/projects/<carpeta-del-proyecto>/`. Trae la hora de cada mensaje.
   - Cursor u otros: exportá el chat. Si la herramienta no guarda las horas, mandá también una grabación de pantalla.
3. **`DECISIONES.md` completo** (5 a 10 líneas, con tus palabras).
