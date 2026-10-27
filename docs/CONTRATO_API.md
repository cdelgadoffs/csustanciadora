# Contrato del API (v1)

Fuente de verdad de lo que `services/LocalAPI/` simula y `services/ServerConnection/` consume. Es lo que implementa el backend. Cualquier cambio se hace **aquí primero**.

Todas las operaciones son asíncronas. Los datos viajan como JSON. Los errores tienen siempre la forma `{ codigo, mensaje }` (`services/ApiError.js`).

## Convenciones

- Todos los timestamps son ISO 8601 UTC, asignados por el **servidor**.
- Todo registro modificable lleva `version` (entero, empieza en 1, +1 en cada cambio). Se usa para detectar conflictos.
- El **reloj del servidor** define "hoy". El cliente nunca decide estados.
- Los datos **derivados** (`estado`, `numeroSesion`) no se guardan: se calculan al leer.
- La identidad y el rol salen del token en el servidor, nunca del cliente.

## Modelo

### Sesión
| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Fecha `YYYY-MM-DD`. Es la identidad natural: **una sesión por fecha**. |
| `numeroSesion` | int | Derivado. Consecutivo oficial. Avanza en `celebrada` y `proxima`; una `no-celebrada` no consume número. |
| `estado` | string | Derivado. `celebrada` · `proxima` · `no-celebrada` · `pendiente`. |
| `celebrada` | bool | **Derivado.** `true` si la lista está cerrada y la fecha ya pasó (`listaCerrada && id < hoy`, reloj del servidor). No hay operación para celebrar. (Compatibilidad: una sesión guardada antes con `celebrada: true` sigue celebrada.) |
| `horaProgramada` | string \| null | Hora convocada de la reunión, escrita a mano (`"HH:MM"`), con `programarHora`. `null` si no se ha definido. |
| `horaTermino` | string \| null | Hora de término de la reunión, escrita a mano (`"HH:MM"`), con `programarHoraTermino`. `null` si no se ha definido. |
| `actasAprobadas` | string[] \| ausente | Solo en sesiones celebradas con la versión anterior del flujo (compatibilidad): ids de las sesiones cuya acta se aprobó en ella. Interno del servidor; no se entrega en `listarSesiones`. |
| `listaCerrada` | bool | Hecho persistido. `false` por omisión (las sesiones anteriores al campo se leen como `false`). Ver "Lista cerrada". |
| `celebradaEn` | string \| null | Timestamp. |
| `version` | int | |

Reglas de `estado` (con la fecha de hoy del servidor, entre sesiones ordenadas por `id`):
`celebrada` si `celebrada` (derivado, ver arriba); `proxima` si es la primera con `id >= hoy` y no celebrada; `no-celebrada` si `id < hoy` y no celebrada; `pendiente` en cualquier otro caso.

### Punto
| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Asignado por el servidor (UUID). |
| `sesionId` | string | Sesión a la que pertenece. Obligatorio. |
| `seccion` | string | `id` de un elemento del catálogo `secciones`. |
| `remitente` | string | `id` de un elemento del catálogo `remitentes`. |
| `contenido` | string | Obligatorio, máx. 20 000 caracteres. |
| `acuerdo` | string | Obligatorio si la sección tiene `requiereAcuerdo: true`; si no, se guarda vacío. Máx. 20 000. |
| `confidencial` | bool | |
| `archivos` | `Archivo[]` | Metadatos de los archivos adjuntos (ver "Archivo"). |
| `orden` | int | Posición dentro de su (sesión, sección), 1…n (ver "Orden"). |
| `deliberacion` | string | Lo deliberado en la sesión sobre el punto. Empieza vacío (los puntos anteriores al campo se leen como `""`). Máx. 20 000. Solo cambia con `guardarDeliberacion`. Los puntos fijos no lo tienen. |
| `agregadoEnSesion` | bool | `true` si el punto se agregó durante la reunión (desde la elaboración del acta) y no estaba previsto en el orden del día. Solo se fija al crear (`crearPunto`, opcional, `false` por omisión) y no cambia después; solo se admite en secciones con `admiteConListaCerrada` (`VALIDACION`). Los puntos anteriores al campo se leen como `false`. El cliente lo usa para excluirlo del orden del día. |
| `tratado` | bool | Marca de la celebración: el punto ya se trató. Empieza en `false`; los puntos anteriores al campo se leen como `false`. Solo cambia con `marcarPunto`. |
| `version` | int | |
| `creadoPor`, `creadoEn`, `modificadoEn` | string | Autoría y fechas, del servidor. |
| `fijo` | bool | **Derivado.** `true` solo en los puntos fijos (ver "Puntos fijos"). |
| `clave` | string | **Derivado.** Solo en puntos fijos: su `id` en el catálogo `puntosFijos` (`orden-dia`, `acta-anterior`, `asuntos-generales`). |
| `actas` | `{ sesionId, numeroSesion, fecha }[]` | **Derivado.** Solo en el punto fijo `acta-anterior`: las actas pendientes que aprueba. |
| `encabezado` | bool | **Derivado.** Solo en puntos fijos que son un título de cierre (no se tratan ni se marcan). |

### Archivo
| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Asignado por el servidor. |
| `nombre` | string | Nombre original del archivo. |
| `tipo` | string | Tipo MIME. |
| `tamano` | int | Bytes. |
| `creadoEn`, `creadoPor` | string | Del servidor. |

`Punto.archivos` es `Archivo[]`. Reglas, todas del servidor (los valores se editan en `LocalAPI/reglas.js` y en el backend):
- Máximo **100 MB por archivo** y **30 archivos por punto**.
- Tipos permitidos: PDF, Word (`.doc`, `.docx`), Excel (`.xls`, `.xlsx`) e imágenes (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`). Cualquier otro → `ARCHIVO_INVALIDO`.
- El contenido binario nunca viaja dentro del `Punto`: se obtiene con `descargarArchivo`. El caché del cliente guarda solo los metadatos.

### Orden
- `Punto.orden`: entero (1…n) dentro de cada (`sesionId`, `seccion`). Al crear un punto queda **al final** de su sección. `listarPuntos` devuelve ordenado por `orden`.
- No tiene que ser contiguo tras eliminar; `reordenarPuntos` lo reescribe a 1…n.
- Solo cambian de `version` y `modificadoEn` los puntos cuyo `orden` cambió.
- Si `editarPunto` cambia la `seccion` de un punto, queda **al final** de la nueva sección.
- Los puntos creados antes de existir `orden` reciben uno al actualizar la base, según su fecha de creación.

### Lista cerrada

Con `Sesion.listaCerrada = true` la lista de puntos queda **bloqueada**: `crearPunto`, `editarPunto`, `eliminarPunto` y `reordenarPuntos` responden `LISTA_CERRADA`, **salvo** cuando todas las secciones que tocan (la del punto y, al editar, la nueva) tienen `admiteConListaCerrada` (hoy, los asuntos generales). Siguen permitidos `adjuntarArchivos`, `eliminarArchivo`, `marcarPunto`, `marcarPuntos` y `guardarDeliberacion`. Cerrar la lista es lo que permite que la sesión quede celebrada cuando pase su fecha; una sesión cuya fecha pasó con la lista abierta queda `no-celebrada`.

### Puntos fijos

Los define el catálogo `puntosFijos`; el servidor **los genera al leer** (`listarPuntos`, `marcarPunto`, `marcarPuntos`): nunca existen como registros de puntos. En este proyecto, el orden de cada sesión es:

1. `orden-dia` — "Orden del día" (siempre).
2. `acta-anterior` — "Aprobación de actas" (texto genérico). Solo si la sesión tiene **actas pendientes de aprobar**. Lleva el campo derivado `actas`: `[{ sesionId, numeroSesion, fecha }]`, las reuniones pendientes en orden de fecha (`fecha` = `sesionId`, `YYYY-MM-DD`). **La frase que se muestra ("Aprobación del acta de la quinta reunión del 23 de abril de 2026" / "Aprobación de las actas de las quinta y sexta reunión del …") la redacta el cliente** a partir de `actas` (presentación); `contenido` queda como respaldo genérico.
3. Los puntos registrados, por `orden`.
4. `asuntos-generales` — "Asuntos Generales" (siempre, al final). Es `encabezado`: un título de cierre, no un punto a tratar.

- Su `id` es `fijo:<sesionId>:<clave>`; `contenido` es el texto; `remitente` es `null`; `archivos` es `[]`; `confidencial` es `false`; `seccion` es la primera del catálogo.
- **No se pueden editar, eliminar, mover ni adjuntarles archivos** (`VALIDACION`). `reordenarPuntos` recibe solo los ids de los puntos registrados.
- **Actas pendientes (regla del servidor):** para una sesión X, son las sesiones **celebradas** con fecha anterior a X cuya acta no se ha aprobado en otra sesión celebrada anterior a X. Una sesión celebrada C aprueba **todas** las actas que estaban pendientes en C **si su punto `acta-anterior` está marcado como tratado**; si no, siguen pendientes y pasan a la siguiente. Se calcula al leer (nada se guarda). Compatibilidad: si una sesión guardó `actasAprobadas` (flujo anterior), se respeta esa lista.
- Los que no son `encabezado` se marcan como cualquier punto (`marcarPunto` con su `id`, y `marcarPuntos`); la marca se guarda en la sesión (`fijosTratados`) y empieza en `false`. Un `encabezado` siempre tiene `tratado: false` y `marcarPunto` lo rechaza (`VALIDACION`).

### Catálogos

Los catálogos de dominio son **datos, no código**: el API ofrece un mecanismo genérico y cada proyecto carga sus propias filas (semilla). El API valida contra lo que haya cargado y aplica los atributos sin saber qué significan. Así el motor es reutilizable entre proyectos.

`listarCatalogos()` devuelve `{ [nombreCatalogo]: Item[] }`, donde cada `Item` es `{ id, nombre, ...atributos }`. En este proyecto:

| Catálogo | Atributos | Valores actuales |
|---|---|---|
| `secciones` | `requiereAcuerdo: bool`, `admiteConListaCerrada: bool` (opcional), `alFinal: bool` (opcional) | `asuntos` (false) y `asuntos-generales` ("Asunto general": `admiteConListaCerrada`, `alFinal`) |
| `puntosFijos` | `texto`, `posicion` (`inicio`/`final`), `condicion` (`siempre`/`actasPendientes`), `encabezado: bool` | `orden-dia`, `acta-anterior`, `asuntos-generales` (ver "Puntos fijos") |
| `remitentes` | — | `pleno`, `presidencia`, `secretaria-general` |

**Orden de `listarPuntos`:** fijos de `posicion: 'inicio'` → puntos registrados de secciones sin `alFinal` (por `orden`) → fijos de `posicion: 'final'` → puntos registrados de secciones con `alFinal` (por `orden`). Así los asuntos generales quedan después de su título.

Lo que **no** es catálogo y vive solo en el cliente: la estructura de la interfaz (menú, textos, íconos).

## Operaciones

| Operación | Entrada | Salida | Errores |
|---|---|---|---|
| `listarCatalogos()` | — | `{ secciones: Item[], remitentes: Item[] }` | — |
| `listarSesiones()` | — | `Sesion[]` (con derivados, ordenadas por `id`) | — |
| `crearSesiones(fechas)` | `string[]` de fechas `YYYY-MM-DD` | `Sesion[]` (la lista completa actualizada) | `NO_AUTORIZADO`, `VALIDACION` |
| `programarHora(id, hora)` | id de sesión + `"HH:MM"` (o `""` para borrarla) | `Sesion` actualizada | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `LISTA_CERRADA`, `VALIDACION` |
| `programarHoraTermino(id, hora)` | id de sesión + `"HH:MM"` (o `""` para borrarla) | `Sesion` actualizada | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `VALIDACION`, `HORARIO_INVALIDO` |
| `establecerListaCerrada(id, cerrada)` | id de sesión + bool | `Sesion` actualizada | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `VALIDACION` |
| `listarPuntos(sesionId)` | id de sesión | `Punto[]` (ordenados por `orden`, **ya filtrados según el usuario**) | — |
| `crearPunto(sesionId, datos)` | sesión + `{ seccion, remitente, contenido, acuerdo, confidencial, archivos, agregadoEnSesion? }` | `Punto` creado | `NO_AUTORIZADO`, `VALIDACION`, `NO_ENCONTRADO`, `SESION_CELEBRADA` |
| `editarPunto(id, version, cambios)` | id, `version` que el cliente tiene, campos a cambiar | `Punto` actualizado | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `CONFLICTO`, `VALIDACION` |
| `eliminarPunto(id)` | id | — | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA` |

### Operaciones de archivos, de orden y de celebración

| Operación | Entrada | Salida | Errores |
|---|---|---|---|
| `marcarPunto(id, tratado)` | id de punto + bool | `Punto` actualizado | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `VALIDACION` |
| `guardarDeliberacion(id, texto)` | id de punto + string | `Punto` actualizado | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `VALIDACION` |
| `marcarPuntos(sesionId, tratado)` | id de sesión + bool | `Punto[]` de la sesión (ordenados, ya filtrados según el usuario) | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `VALIDACION` |
| `adjuntarArchivos(puntoId, archivos)` | id de punto + archivos (binarios) | `Punto` actualizado (`version` + 1) | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `ARCHIVO_INVALIDO` |
| `eliminarArchivo(puntoId, archivoId)` | ids | `Punto` actualizado | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA` |
| `descargarArchivo(archivoId)` | id | `{ nombre, tipo, blob }` (en el servidor real, una URL firmada) | `NO_AUTORIZADO`, `NO_ENCONTRADO` |
| `reordenarPuntos(sesionId, seccion, ids)` | sesión, sección e **ids de la sección en el orden deseado** | `Punto[]` de esa sección, ya ordenados | `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `CONFLICTO`, `VALIDACION` |

- `marcarPunto(id, tratado)` fija `tratado` (bool) del punto y devuelve el `Punto` actualizado. Es **idempotente** (repetir el mismo valor no cambia nada ni sube `version`) y no exige `version`: solo guarda un valor, no hay edición concurrente que proteger. Errores: `NO_AUTORIZADO`, `NO_ENCONTRADO`, `SESION_CELEBRADA`, `VALIDACION` (si `tratado` no es booleano). Solo cuando cambia el valor se incrementa `version` y se actualiza `modificadoEn`.
- `guardarDeliberacion(id, texto)` reemplaza la `deliberacion` del punto y devuelve el `Punto` actualizado. Como `marcarPunto`, no exige `version` (el cliente lo llama solo mientras se escribe, con el texto completo; gana la última escritura) y es idempotente. `VALIDACION` si `texto` no es string, supera 20 000 caracteres o el punto es fijo; `SESION_CELEBRADA` si la sesión ya se celebró.
- `marcarPuntos` fija `tratado` en **todos** los puntos de la sesión que el usuario puede ver, en una sola operación **atómica** (o se aplican todos o ninguno). Es idempotente: solo cambian de `version` y `modificadoEn` los puntos cuyo valor cambió.
- `editarPunto` **no** modifica `tratado`.
- `crearPunto` acepta `archivos` (binarios) opcionales y los valida con las mismas reglas de `adjuntarArchivos`. El formato antiguo `[{ nombre }]` se rechaza con `ARCHIVO_INVALIDO`.
- Las operaciones que tocan el punto y sus binarios (crear con archivos, adjuntar, quitar, y la cascada al eliminar el punto) son **atómicas**: o se aplican todas o ninguna.
- `editarPunto` **no** modifica `archivos` ni `orden`: para eso están `adjuntarArchivos`, `eliminarArchivo` y `reordenarPuntos`.
- `reordenarPuntos` recibe el orden **completo** de la sección (atómico e idempotente: repetir el mismo orden no cambia nada). Si `ids` no es exactamente el conjunto actual de puntos de esa sección → `CONFLICTO` y el cliente recarga. Sección inexistente o `ids` que no es una lista → `VALIDACION`.

Notas de comportamiento:
- `crearSesiones` es **idempotente**: las fechas que ya existen se ignoran (no resetea `celebrada`); devuelve siempre la lista completa porque los derivados de las demás sesiones pueden cambiar.
- **Celebración automática.** No hay operaciones para comenzar ni celebrar: una sesión queda `celebrada` sola cuando su lista está cerrada y su fecha ya pasó (reloj del servidor). Desde ese momento es inmutable (`SESION_CELEBRADA`) y ya no se puede reabrir la lista.
- `programarHora` fija la hora convocada **solo con la lista abierta** (`LISTA_CERRADA`) y la sesión sin celebrar; valida `HH:MM` (00:00–23:59, `VALIDACION`); `""` la borra. Es idempotente. `HORARIO_INVALIDO` si quedaría después de `horaTermino`.
- `programarHoraTermino` fija la hora de término escrita a mano. **Se permite siempre**, también con la lista cerrada y con la sesión celebrada (las horas alimentan el acta). Valida `HH:MM` (`VALIDACION`); `""` la borra; idempotente. `HORARIO_INVALIDO` si quedaría antes de `horaProgramada`.
- `establecerListaCerrada` es idempotente (repetir el mismo valor no cambia nada ni sube `version`); `VALIDACION` si `cerrada` no es booleano.
- `editarPunto` con `version` distinta de la actual → `CONFLICTO` (el cliente debe recargar). Solo se modifican los campos permitidos del punto; el resultado se valida completo.
- Una sesión **celebrada es inmutable**: no admite crear, editar ni eliminar puntos.

## Códigos de error

| Código | Cuándo |
|---|---|
| `NO_AUTORIZADO` | El usuario no tiene permiso para la operación. |
| `NO_ENCONTRADO` | La sesión o el punto no existe. |
| `VALIDACION` | Datos inválidos (fecha, sección, remitente, campos obligatorios, longitudes). |
| `CONFLICTO` | `version` desactualizada. |
| `SESION_CELEBRADA` | La operación no aplica a una sesión ya celebrada. |
| `ARCHIVO_INVALIDO` | Archivo con tipo no permitido, que excede el tamaño (100 MB) o que supera el máximo por punto (30). |
| `NO_DISPONIBLE` | El servidor no puede atender la operación en este momento (en `LocalAPI`: la base está bloqueada por otra pestaña con una versión anterior). Se puede reintentar. |
| `HORARIO_INVALIDO` | La hora de inicio quedaría después de la de término. |
| `LISTA_CERRADA` | La lista de puntos de la sesión está cerrada y la operación la modificaría. |
| `NO_IMPLEMENTADO` | Solo `ServerConnection` mientras no exista backend. |

## Permisos

| Rol | Sesiones y puntos | Confidenciales |
|---|---|---|
| `capturista` | Lectura y escritura (único con CRUD de puntos y de sesiones) | Los ve |
| Lectores (remitentes, colaboradores) | Solo lectura | **No se les envían** — el servidor los excluye de `listarPuntos` |

Las restricciones finas de lectura por remitente/colaborador están por definir; la regla siempre se aplica en el servidor.

## Pendiente de definir

- Estado de publicación de la sesión (`en preparación` → `publicado` → `celebrada`): si los lectores ven los puntos al crearse o al publicarse.
- Administración de catálogos (hoy solo lectura; las filas se cargan por semilla).
- Archivos en el servidor real: URLs firmadas, antivirus y cuotas totales (los límites por archivo y por punto ya están definidos arriba).
- Autenticación (MSAL) y origen del rol.
- Auditoría (bitácora de cambios).
