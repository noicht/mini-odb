# Decisiones

**Tiempo que tardé:** -> 16 minutos, 40 segundos. (aclaro que me pase del tiempo orientativo para revisar y corregir.)

## Causa compartida entre dos códigos

<!-- Qué hiciste y por qué. -->

- Utilice un noisy-or, que es una manera de calcular la probabilidad de que al menos un codigo este acertado usando la formula 1 - (1-p1)(1-p2).
- En mi opinion, me parecio una manera elegante y no tan trivial de encarar el problema, ya que cuantos mas codigos presenten la misma causa, mayor probabilidad hay de confirmarla utilizando dicho modelo.

## Otros supuestos

<!-- Lo que el enunciado no decía y tuviste que decidir. -->
- si codes no es un array, lo trato como []. Me parecio mas razonable que hacer fallar el programa
- use trim() para normalizar codigos de entrada y los del manual, para quitar espacios indeseaados en los codigos
- el manual tiene una referencia rota: el P0420 del Tiggo apunta a la causa `sonda-anterior`, que no esta definida en las causas de ese vehiculo. Como viene de un PDF, asumi que es dato corrupto y lo salteo sin romper. De todas formas, en un sistema real deberia reportarse como inconsistencia del manual
- en notFound devuelvo el código normalizado
- en cause.codes listo los codigos que apuntan a esa causa, ordenados alfabeticamente para que el resultado no dependa del orden de entrada

## Dónde se equivocó la IA (o casi)

<!-- Qué te propuso que no aceptaste o tuviste que corregir. -->

pasados los 3 tests, revise la implementacion de nuevo, corriendo edge cases contra el manual.json y encontre errores en el mismo (esto no sale en el video pero tiene su timestamp en el .json del chat con el agente):

- el resultado cambiaba segun el orden de los codigos (codes, notFound y cause.codes se armaban en orden de llegada), incumpliendo la regla 4 del readme.
-  el Golf tiene la clave "P0420 " con un espacio (manual que sale de un pdf). el codigo limpiaba la entrada pero no las claves del manual, asi que P0420 iba a notFound a pesar de que existe.
- un codigo repetido combinaba la evidencia consigo misma e inflaba la probabilidad (bujias de 0,3 a 0,51). noisy-or funciona con pistas independientes

.
## Qué haría con más tiempo

- falta toUpperCase() para normalizar entradas como p0301
- si codes viene con null, tira TypeError, falta validar.
- reportar referencias rotas del manual en vez de saltearlas>

