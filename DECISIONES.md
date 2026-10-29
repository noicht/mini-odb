# Decisiones

**Tiempo que tardé:** -> 36 minutos aproximadamente. (aclaro que me pase del tiempo orientativo para revisar y corregir lo que no sale en el video pero esta contemplado en el transcript del agente)

## Causa compartida entre dos códigos

<!-- Qué hiciste y por qué. -->

- Utilice un noisy-or, que es una manera de calcular la probabilidad de que al menos un codigo este acertado usando la formula 1 - (1-p1)(1-p2).
- En mi opinion, me parecio una manera elegante y no tan trivial de encarar el problema, ya que cuantos mas codigos presenten la misma causa, mayor probabilidad hay de confirmarla utilizando dicho modelo.

## Otros supuestos

<!-- Lo que el enunciado no decía y tuviste que decidir. -->
- si codes no es un array, arroja un error.
- use trim() para normalizar codigos de entrada y los del manual, para quitar espacios indeseaados en los codigos, tambien agregue un .toUpperCase() para evitar inputs como p0300
- el manual tiene una referencia rota: el P0420 del Tiggo apunta a la causa `sonda-anterior`, que no esta definida en las causas de ese vehiculo. Como viene de un PDF, asumi que es dato corrupto y lo salteo sin romper. De todas formas, en un sistema real deberia reportarse como inconsistencia del manual
- en notFound devuelvo el código normalizado
- en cause.codes listo los codigos que apuntan a esa causa, ordenados alfabeticamente para que el resultado no dependa del orden de entrada

## Dónde se equivocó la IA (o casi)

<!-- Qué te propuso que no aceptaste o tuviste que corregir. -->

pasados los 3 tests, revise la implementacion de nuevo, corriendo edge cases contra el manual.json y encontre errores en el mismo (esto no sale en el video pero tiene su timestamp en el .json del chat con el agente):

- el resultado cambiaba segun el orden de los codigos (codes, notFound y cause.codes se armaban en orden de llegada), incumpliendo la regla 4 del readme.
-  el Golf tiene la clave "P0420 " con un espacio (manual que sale de un pdf). el codigo limpiaba la entrada pero no las claves del manual, asi que P0420 iba a notFound a pesar de que existe.
- un codigo repetido combinaba la evidencia consigo misma e inflaba la probabilidad (bujias de 0,3 a 0,51). noisy-or funciona con pistas independientes
- La IA deberia haber modularizado una funcion para validar el manual de entrada antes de ponerse a trabajar con la funcion diagnose
- 

.
## Qué haría con más tiempo

- falta toUpperCase() para normalizar entradas como p0301
- si codes viene con null, tira TypeError, falta validar.
- reportar referencias rotas del manual en vez de saltearlas>



## MEJORAS REALIZADAS

- `const normalizedCode = code.trim().toUpperCase();`--> agregue un toUpperCase() para sanear los codigos que vengan con caracteres en minuscula
- `existing.probability = Math.max(existing.probability, causeRef.probability)`--> cambie el tipo de probabilidad, noisy-OR sobreestima, ya que por ejemplo para P0300 y P0301 son sintomas correlacionados, no inependientes, un maximo supone correlacion total de los sintomas. La realidad es que esto esta en un valor intermedio, podria ser mas calibrado con mas datos

- `if (!Array.isArray(codes)) {throw new Error('"codes" debe ser un array de strings');}`
y `if (typeof code !== 'string') throw new Error(`Código inválido: ${code}`);`-- > valido codigos con esto, tanto el array de codes que entra como el dentro del for

## MEJORAS REALIZADAS 29/10

- agregado parametro `excludedCauses` a `diagnose()` para permitir diagnostico iterativo. El usuario puede descartar causas ya revisadas y obtener las siguientes más probables. Esto habilita un flujo interactivo donde el mecanico va descartando causas en orden de probabilidad.
- la exclusion se aplica antes de combinar porbabilidades así una causa excluida no influye en nada y las probabilidades de las demás quedan tal cual vienen del manual, descarte renormalizar a 100% (lo propuso devin), las probabilidades del manual no suman 1 ni las causas son exhaustivas, asiu que normalizar inventaria probabilidades sin evidencia nueva, y ademas daria NaN si se excluyen todas las causas
- `excludedCauses` se valida (debe ser array de strings) y se guarda en un `Set`, así el orden en que se excluyen no cambia el resultado.
- validación estricta del manual al cargar, en un archivo aparte. Separe dos niveles: los errores estructurales tiran error y frenan la carga, las referencias rotas (el `sonda-anterior` del Tiggo que no valide) solo avisan con `console.warn` y se saltean. Descarte tirar error tambien en las referencias rotas porque el `manual.json` real tiene una y el módulo no cargaría.
- un codigo vacio o solo con espacios ahora tira error

