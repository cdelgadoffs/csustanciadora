import { ApiError } from '../ApiError.js';
import {
  STORE_SESIONES, STORE_PUNTOS, STORE_CATALOGOS, STORE_ARCHIVOS,
  obtenerTodos, obtener, guardar, escribirVarios,
} from './db.js';
import {
  usuarioActual, exigirEscritura, puedeVerConfidencial,
  validarFechasISO, calcularEstados,
  camposPunto, validarPunto, normalizarPunto,
  validarArchivos, prepararArchivos,
  validarDeliberacion, validarHoraDelDia, validarOrdenHorario, estaCelebrada, admiteConListaCerrada, vaAlFinal, esPuntoFijo, exigirNoFijo, analizarPuntoFijo, generarPuntosFijos,
} from './reglas.js';

async function exigirSesionAbierta(sesionId) {
  const sesion = await obtener(STORE_SESIONES, sesionId);
  if (!sesion) throw new ApiError('NO_ENCONTRADO', 'La sesión no existe.');
  if (estaCelebrada(sesion)) throw new ApiError('SESION_CELEBRADA', 'La sesión ya fue celebrada y no admite cambios.');
  return sesion;
}

async function exigirListaAbierta(sesionId, secciones = []) {
  const sesion = await exigirSesionAbierta(sesionId);
  if (secciones.length > 0 && admiteConListaCerrada(await listarCatalogos(), secciones)) return sesion;
  if (sesion.listaCerrada) throw new ApiError('LISTA_CERRADA', 'La lista de puntos está cerrada. Ábrela para hacer cambios.');
  return sesion;
}

function porOrden(a, b) {
  if (a.orden !== b.orden) return a.orden - b.orden;
  if (a.creadoEn !== b.creadoEn) return a.creadoEn < b.creadoEn ? -1 : 1;
  return a.id < b.id ? -1 : 1;
}

function siguienteOrden(todos, sesionId, seccion) {
  const ordenes = todos.filter((p) => p.sesionId === sesionId && p.seccion === seccion).map((p) => p.orden);
  return Math.max(0, ...ordenes) + 1;
}

export async function listarCatalogos() {
  const filas = await obtenerTodos(STORE_CATALOGOS);
  return Object.fromEntries(filas.map((f) => [f.nombre, f.items]));
}

export async function listarSesiones() {
  return calcularEstados(await obtenerTodos(STORE_SESIONES));
}

export async function crearSesiones(fechas) {
  exigirEscritura();
  validarFechasISO(fechas);
  const existentes = new Set((await obtenerTodos(STORE_SESIONES)).map((s) => s.id));
  const ahora = new Date().toISOString();
  for (const id of new Set(fechas)) {
    if (existentes.has(id)) continue;
    await guardar(STORE_SESIONES, {
      id, version: 1,
      creadaEn: ahora, creadaPor: usuarioActual().id,
    });
  }
  return listarSesiones();
}

export async function programarHora(id, hora) {
  exigirEscritura();
  const sesion = await exigirListaAbierta(id);
  const valor = hora === '' || hora === null ? null : hora;
  if (valor !== null) validarHoraDelDia(valor);
  validarOrdenHorario(valor, sesion.horaTermino);
  if ((sesion.horaProgramada || null) !== valor) {
    await guardar(STORE_SESIONES, { ...sesion, horaProgramada: valor, version: sesion.version + 1 });
  }
  return (await listarSesiones()).find((s) => s.id === id);
}

export async function programarHoraTermino(id, hora) {
  exigirEscritura();
  const sesion = await obtener(STORE_SESIONES, id);
  if (!sesion) throw new ApiError('NO_ENCONTRADO', 'La sesión no existe.');
  const valor = hora === '' || hora === null ? null : hora;
  if (valor !== null) validarHoraDelDia(valor);
  validarOrdenHorario(sesion.horaProgramada, valor);
  if ((sesion.horaTermino || null) !== valor) {
    await guardar(STORE_SESIONES, { ...sesion, horaTermino: valor, version: sesion.version + 1 });
  }
  return (await listarSesiones()).find((s) => s.id === id);
}

function sinPosicion(punto) {
  const copia = { ...punto };
  delete copia.posicion;
  return copia;
}

export async function establecerListaCerrada(id, cerrada) {
  exigirEscritura();
  if (typeof cerrada !== 'boolean') throw new ApiError('VALIDACION', 'El valor de "cerrada" debe ser verdadero o falso.');
  const sesion = await exigirSesionAbierta(id);
  if (!!sesion.listaCerrada !== cerrada) {
    await guardar(STORE_SESIONES, { ...sesion, listaCerrada: cerrada, version: sesion.version + 1 });
  }
  return (await listarSesiones()).find((s) => s.id === id);
}

export async function listarPuntos(sesionId) {
  const sesiones = await obtenerTodos(STORE_SESIONES);
  const sesion = sesiones.find((s) => s.id === sesionId);
  if (!sesion) return [];
  const verConfidencial = puedeVerConfidencial();
  const registrados = (await obtenerTodos(STORE_PUNTOS))
    .filter((p) => p.sesionId === sesionId && (verConfidencial || !p.confidencial))
    .sort(porOrden);
  const catalogos = await listarCatalogos();
  const fijos = generarPuntosFijos(sesion, sesiones, catalogos);
  return [
    ...fijos.filter((f) => f.posicion === 'inicio').map(sinPosicion),
    ...registrados.filter((p) => !vaAlFinal(catalogos, p)),
    ...fijos.filter((f) => f.posicion === 'final').map(sinPosicion),
    ...registrados.filter((p) => vaAlFinal(catalogos, p)),
  ];
}

export async function crearPunto(sesionId, datos) {
  exigirEscritura();
  if (!sesionId) throw new ApiError('VALIDACION', 'Debes indicar la sesión del punto.');
  await exigirListaAbierta(sesionId, [datos?.seccion]);
  const catalogos = await listarCatalogos();
  validarPunto(datos, catalogos);
  const archivos = Array.from(datos.archivos || []);
  validarArchivos(archivos);
  const id = crypto.randomUUID();
  const { registros, metadatos } = prepararArchivos(id, archivos);
  const orden = siguienteOrden(await obtenerTodos(STORE_PUNTOS), sesionId, datos.seccion);
  const ahora = new Date().toISOString();
  const punto = {
    id,
    sesionId,
    ...normalizarPunto(datos, catalogos),
    archivos: metadatos,
    orden,
    tratado: false,
    version: 1,
    creadoPor: usuarioActual().id,
    creadoEn: ahora,
    modificadoEn: ahora,
  };
  await escribirVarios({
    poner: [
      { store: STORE_PUNTOS, valor: punto },
      ...registros.map((valor) => ({ store: STORE_ARCHIVOS, valor })),
    ],
  });
  return punto;
}

export async function editarPunto(id, version, cambios) {
  exigirEscritura();
  exigirNoFijo(id);
  const actual = await obtener(STORE_PUNTOS, id);
  if (!actual) throw new ApiError('NO_ENCONTRADO', 'El punto no existe.');
  await exigirListaAbierta(actual.sesionId, [actual.seccion, cambios?.seccion ?? actual.seccion]);
  if (actual.version !== version) {
    throw new ApiError('CONFLICTO', 'El punto cambió desde que lo cargaste. Recarga e intenta de nuevo.');
  }
  const combinado = { ...actual, ...camposPunto(cambios) };
  const catalogos = await listarCatalogos();
  validarPunto(combinado, catalogos);
  const cambiaSeccion = combinado.seccion !== actual.seccion;
  const punto = {
    ...actual,
    ...normalizarPunto(combinado, catalogos),
    orden: cambiaSeccion ? siguienteOrden(await obtenerTodos(STORE_PUNTOS), actual.sesionId, combinado.seccion) : actual.orden,
    version: actual.version + 1,
    modificadoEn: new Date().toISOString(),
  };
  await guardar(STORE_PUNTOS, punto);
  return punto;
}

async function marcarPuntoFijo(id, tratado) {
  const { sesionId, clave } = analizarPuntoFijo(id);
  const sesion = await exigirSesionAbierta(sesionId);
  const fijo = (await listarPuntos(sesionId)).find((p) => p.id === id);
  if (!fijo) throw new ApiError('NO_ENCONTRADO', 'El punto no existe.');
  if (fijo.encabezado) throw new ApiError('VALIDACION', 'Este punto es un título y no se marca.');
  if (fijo.tratado === tratado) return fijo;
  await guardar(STORE_SESIONES, { ...sesion, fijosTratados: { ...(sesion.fijosTratados ?? {}), [clave]: tratado } });
  return { ...fijo, tratado };
}

export async function marcarPunto(id, tratado) {
  exigirEscritura();
  if (typeof tratado !== 'boolean') throw new ApiError('VALIDACION', 'El valor de "tratado" debe ser verdadero o falso.');
  if (esPuntoFijo(id)) return marcarPuntoFijo(id, tratado);
  const actual = await obtener(STORE_PUNTOS, id);
  if (!actual) throw new ApiError('NO_ENCONTRADO', 'El punto no existe.');
  await exigirSesionAbierta(actual.sesionId);
  if (!!actual.tratado === tratado) return { ...actual, tratado };
  const punto = { ...actual, tratado, version: actual.version + 1, modificadoEn: new Date().toISOString() };
  await guardar(STORE_PUNTOS, punto);
  return punto;
}

export async function guardarDeliberacion(id, texto) {
  exigirEscritura();
  exigirNoFijo(id);
  validarDeliberacion(texto);
  const actual = await obtener(STORE_PUNTOS, id);
  if (!actual) throw new ApiError('NO_ENCONTRADO', 'El punto no existe.');
  await exigirSesionAbierta(actual.sesionId);
  if ((actual.deliberacion ?? '') === texto) return { ...actual, deliberacion: texto };
  const punto = { ...actual, deliberacion: texto, version: actual.version + 1, modificadoEn: new Date().toISOString() };
  await guardar(STORE_PUNTOS, punto);
  return punto;
}

export async function marcarPuntos(sesionId, tratado) {
  exigirEscritura();
  if (typeof tratado !== 'boolean') throw new ApiError('VALIDACION', 'El valor de "tratado" debe ser verdadero o falso.');
  const sesion = await exigirSesionAbierta(sesionId);
  const lista = await listarPuntos(sesionId);
  const ahora = new Date().toISOString();
  const cambiados = lista
    .filter((p) => !p.fijo && !!p.tratado !== tratado)
    .map((p) => ({ ...p, tratado, version: p.version + 1, modificadoEn: ahora }));
  const clavesFijas = lista.filter((p) => p.fijo && !p.encabezado).map((p) => p.clave);
  const cambianFijos = lista.some((p) => p.fijo && !p.encabezado && p.tratado !== tratado);
  await escribirVarios({
    poner: [
      ...cambiados.map((valor) => ({ store: STORE_PUNTOS, valor })),
      ...(cambianFijos ? [{
        store: STORE_SESIONES,
        valor: { ...sesion, fijosTratados: { ...(sesion.fijosTratados ?? {}), ...Object.fromEntries(clavesFijas.map((c) => [c, tratado])) } },
      }] : []),
    ],
  });
  return listarPuntos(sesionId);
}

export async function eliminarPunto(id) {
  exigirEscritura();
  exigirNoFijo(id);
  const actual = await obtener(STORE_PUNTOS, id);
  if (!actual) throw new ApiError('NO_ENCONTRADO', 'El punto no existe.');
  await exigirListaAbierta(actual.sesionId, [actual.seccion]);
  await escribirVarios({
    borrar: [
      { store: STORE_PUNTOS, id },
      ...actual.archivos.filter((a) => a.id).map((a) => ({ store: STORE_ARCHIVOS, id: a.id })),
    ],
  });
}

export async function adjuntarArchivos(puntoId, archivos) {
  exigirEscritura();
  exigirNoFijo(puntoId);
  const actual = await obtener(STORE_PUNTOS, puntoId);
  if (!actual) throw new ApiError('NO_ENCONTRADO', 'El punto no existe.');
  await exigirSesionAbierta(actual.sesionId);
  const nuevos = Array.from(archivos || []);
  validarArchivos(nuevos, actual.archivos.length);
  const { registros, metadatos } = prepararArchivos(puntoId, nuevos);
  const punto = {
    ...actual,
    archivos: [...actual.archivos, ...metadatos],
    version: actual.version + 1,
    modificadoEn: new Date().toISOString(),
  };
  await escribirVarios({
    poner: [
      { store: STORE_PUNTOS, valor: punto },
      ...registros.map((valor) => ({ store: STORE_ARCHIVOS, valor })),
    ],
  });
  return punto;
}

export async function eliminarArchivo(puntoId, archivoId) {
  exigirEscritura();
  exigirNoFijo(puntoId);
  const actual = await obtener(STORE_PUNTOS, puntoId);
  if (!actual) throw new ApiError('NO_ENCONTRADO', 'El punto no existe.');
  await exigirSesionAbierta(actual.sesionId);
  if (!actual.archivos.some((a) => a.id === archivoId)) throw new ApiError('NO_ENCONTRADO', 'El archivo no existe.');
  const punto = {
    ...actual,
    archivos: actual.archivos.filter((a) => a.id !== archivoId),
    version: actual.version + 1,
    modificadoEn: new Date().toISOString(),
  };
  await escribirVarios({
    poner: [{ store: STORE_PUNTOS, valor: punto }],
    borrar: [{ store: STORE_ARCHIVOS, id: archivoId }],
  });
  return punto;
}

export async function descargarArchivo(archivoId) {
  const registro = await obtener(STORE_ARCHIVOS, archivoId);
  if (!registro) throw new ApiError('NO_ENCONTRADO', 'El archivo no existe.');
  const punto = await obtener(STORE_PUNTOS, registro.puntoId);
  if (!punto) throw new ApiError('NO_ENCONTRADO', 'El archivo no existe.');
  if (punto.confidencial && !puedeVerConfidencial()) {
    throw new ApiError('NO_AUTORIZADO', 'No tienes permiso para ver este archivo.');
  }
  return { nombre: registro.nombre, tipo: registro.tipo, blob: registro.blob };
}

export async function reordenarPuntos(sesionId, seccion, ids) {
  exigirEscritura();
  await exigirListaAbierta(sesionId, [seccion]);
  const catalogos = await listarCatalogos();
  if (!catalogos.secciones.some((s) => s.id === seccion)) throw new ApiError('VALIDACION', 'Sección inválida.');
  if (!Array.isArray(ids)) throw new ApiError('VALIDACION', 'El orden debe ser una lista de ids.');
  ids.forEach(exigirNoFijo);
  const actuales = (await obtenerTodos(STORE_PUNTOS))
    .filter((p) => p.sesionId === sesionId && p.seccion === seccion)
    .sort(porOrden);
  const mismoConjunto = ids.length === actuales.length
    && new Set(ids).size === ids.length
    && ids.every((id) => actuales.some((p) => p.id === id));
  if (!mismoConjunto) {
    throw new ApiError('CONFLICTO', 'Los puntos de la sección cambiaron. Recarga e intenta de nuevo.');
  }
  const ahora = new Date().toISOString();
  const cambiados = [];
  const resultado = ids.map((id, i) => {
    const actual = actuales.find((p) => p.id === id);
    if (actual.orden === i + 1) return actual;
    const nuevo = { ...actual, orden: i + 1, version: actual.version + 1, modificadoEn: ahora };
    cambiados.push(nuevo);
    return nuevo;
  });
  await escribirVarios({ poner: cambiados.map((valor) => ({ store: STORE_PUNTOS, valor })) });
  return resultado;
}
