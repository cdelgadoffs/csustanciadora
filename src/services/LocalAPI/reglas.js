import { ApiError } from '../ApiError.js';

const CAMPOS_PUNTO = ['seccion', 'remitente', 'remitenteOtro', 'contenido', 'contenidoFormato', 'acuerdo', 'confidencial', 'relevante'];
const MAX_TEXTO = 20000;
const MAX_BYTES_ARCHIVO = 100 * 1024 * 1024;
const MAX_ARCHIVOS_PUNTO = 30;
const EXTENSIONES_PERMITIDAS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif', 'webp'];

const USUARIO = { id: 'usuario-local', nombre: 'Capturista local', rol: 'capturista' };

export function usuarioActual() {
  return USUARIO;
}

export function exigirEscritura() {
  if (USUARIO.rol !== 'capturista') {
    throw new ApiError('NO_AUTORIZADO', 'No tienes permiso para modificar.');
  }
}

export function puedeVerConfidencial() {
  return USUARIO.rol === 'capturista';
}

export function fechaISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

export function validarFechasISO(fechas) {
  if (!Array.isArray(fechas) || fechas.length === 0) {
    throw new ApiError('VALIDACION', 'Debes indicar al menos una fecha.');
  }
  fechas.forEach((f) => {
    const valida = typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f) && fechaISO(new Date(f + 'T00:00:00')) === f;
    if (!valida) throw new ApiError('VALIDACION', `Fecha inválida: ${f}.`);
  });
}

export function estaCelebrada(sesion) {
  return !!sesion.celebrada || (!!sesion.listaCerrada && sesion.id < fechaISO(new Date()));
}

export function calcularEstados(sesiones) {
  const hoyISO = fechaISO(new Date());
  const ordenadas = [...sesiones].sort((a, b) => (a.id < b.id ? -1 : 1));
  const proxima = ordenadas.find((s) => s.id >= hoyISO && !estaCelebrada(s));
  let consecutivo = 0;
  return ordenadas.map((s) => {
    let estado = 'pendiente';
    if (estaCelebrada(s)) estado = 'celebrada';
    else if (proxima && s.id === proxima.id) estado = 'proxima';
    else if (s.id < hoyISO) estado = 'no-celebrada';
    if (estado !== 'no-celebrada') consecutivo += 1;
    return {
      id: s.id,
      numeroSesion: consecutivo,
      estado,
      celebrada: estaCelebrada(s),
      listaCerrada: !!s.listaCerrada,
      horaProgramada: s.horaProgramada || null,
      horaTermino: s.horaTermino || null,
      invitados: s.invitados || [],
      version: s.version,
    };
  });
}

export function camposPunto(datos) {
  const limpio = {};
  CAMPOS_PUNTO.forEach((c) => {
    if (c in datos) limpio[c] = datos[c];
  });
  return limpio;
}

function buscarSeccion(catalogos, id) {
  return (catalogos.secciones || []).find((s) => s.id === id);
}

export function admiteConListaCerrada(catalogos, secciones) {
  return secciones.every((id) => !!buscarSeccion(catalogos, id)?.admiteConListaCerrada);
}

export function vaAlFinal(catalogos, punto) {
  return !!buscarSeccion(catalogos, punto.seccion)?.alFinal;
}

const MARCAS_PERMITIDAS = ['bold', 'italic', 'underline'];
const MAX_PARRAFOS = 500;

function limpiarNodoEnLinea(nodo) {
  if (nodo?.type === 'hardBreak') return { type: 'hardBreak' };
  if (nodo?.type !== 'text' || typeof nodo.text !== 'string' || nodo.text === '') {
    throw new ApiError('VALIDACION', 'El formato del contenido es inválido.');
  }
  const marcas = Array.isArray(nodo.marks) ? nodo.marks.map((m) => m?.type) : [];
  if (marcas.some((m) => !MARCAS_PERMITIDAS.includes(m))) {
    throw new ApiError('VALIDACION', 'El contenido solo admite negrita, cursiva y subrayado.');
  }
  const unicas = MARCAS_PERMITIDAS.filter((m) => marcas.includes(m));
  return unicas.length ? { type: 'text', text: nodo.text, marks: unicas.map((type) => ({ type })) } : { type: 'text', text: nodo.text };
}

export function limpiarFormato(doc) {
  if (!doc || doc.type !== 'doc' || !Array.isArray(doc.content) || doc.content.length > MAX_PARRAFOS) {
    throw new ApiError('VALIDACION', 'El formato del contenido es inválido.');
  }
  return {
    type: 'doc',
    content: doc.content.map((parrafo) => {
      if (parrafo?.type !== 'paragraph') throw new ApiError('VALIDACION', 'El formato del contenido es inválido.');
      const hijos = Array.isArray(parrafo.content) ? parrafo.content.map(limpiarNodoEnLinea) : [];
      return hijos.length ? { type: 'paragraph', content: hijos } : { type: 'paragraph' };
    }),
  };
}

export function textoDeFormato(doc) {
  return doc.content
    .map((p) => (p.content || []).map((n) => (n.type === 'hardBreak' ? '\n' : n.text)).join(''))
    .join('\n')
    .trim();
}

export function conContenidoDeFormato(datos) {
  if (datos.contenidoFormato === undefined || datos.contenidoFormato === null) return { ...datos, contenidoFormato: null };
  const contenidoFormato = limpiarFormato(datos.contenidoFormato);
  return { ...datos, contenidoFormato, contenido: textoDeFormato(contenidoFormato) };
}

export function validarPunto(p, catalogos) {
  const seccion = buscarSeccion(catalogos, p.seccion);
  if (!seccion) throw new ApiError('VALIDACION', 'Sección inválida.');
  const remitente = (catalogos.remitentes || []).find((r) => r.id === p.remitente);
  if (!remitente) throw new ApiError('VALIDACION', 'Remitente inválido.');
  const otro = typeof p.remitenteOtro === 'string' ? p.remitenteOtro.trim() : '';
  if (p.remitenteOtro !== undefined && typeof p.remitenteOtro !== 'string') throw new ApiError('VALIDACION', 'El remitente debe ser texto.');
  if (remitente.admiteTextoLibre && !otro) throw new ApiError('VALIDACION', 'Escribe el remitente.');
  if (!remitente.admiteTextoLibre && otro) throw new ApiError('VALIDACION', 'Este remitente no admite texto libre.');
  if (otro.length > 200) throw new ApiError('VALIDACION', 'El remitente es demasiado largo.');
  if (typeof p.contenido !== 'string' || p.contenido.trim().length === 0) {
    throw new ApiError('VALIDACION', 'El contenido es obligatorio.');
  }
  if (p.contenido.length > MAX_TEXTO) throw new ApiError('VALIDACION', 'El contenido es demasiado largo.');
  const acuerdo = typeof p.acuerdo === 'string' ? p.acuerdo : '';
  if (seccion.requiereAcuerdo && acuerdo.trim().length === 0) {
    throw new ApiError('VALIDACION', 'El acuerdo es obligatorio.');
  }
  if (acuerdo.length > MAX_TEXTO) throw new ApiError('VALIDACION', 'El acuerdo es demasiado largo.');
  if (typeof p.confidencial !== 'boolean') throw new ApiError('VALIDACION', 'Indicador de confidencialidad inválido.');
  if (p.relevante !== undefined && typeof p.relevante !== 'boolean') throw new ApiError('VALIDACION', 'Indicador de asunto relevante inválido.');
}

export function validarAgregadoEnSesion(datos, catalogos) {
  if (datos.agregadoEnSesion === undefined) return false;
  if (typeof datos.agregadoEnSesion !== 'boolean') throw new ApiError('VALIDACION', 'Indicador de punto agregado en sesión inválido.');
  if (datos.agregadoEnSesion && !buscarSeccion(catalogos, datos.seccion)?.admiteConListaCerrada) {
    throw new ApiError('VALIDACION', 'Solo los asuntos generales se pueden agregar durante la sesión.');
  }
  return datos.agregadoEnSesion;
}

export function validarArchivos(archivos, yaAdjuntos = 0) {
  if (!Array.isArray(archivos)) throw new ApiError('ARCHIVO_INVALIDO', 'Lista de archivos inválida.');
  if (yaAdjuntos + archivos.length > MAX_ARCHIVOS_PUNTO) {
    throw new ApiError('ARCHIVO_INVALIDO', `Un punto admite como máximo ${MAX_ARCHIVOS_PUNTO} archivos.`);
  }
  archivos.forEach((a) => {
    if (!(a instanceof File) || a.name.length === 0) throw new ApiError('ARCHIVO_INVALIDO', 'Archivo inválido.');
    const extension = a.name.split('.').pop().toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
      throw new ApiError('ARCHIVO_INVALIDO', `«${a.name}»: tipo de archivo no permitido.`);
    }
    if (a.size > MAX_BYTES_ARCHIVO) {
      throw new ApiError('ARCHIVO_INVALIDO', `«${a.name}» supera el máximo de 100 MB.`);
    }
  });
}

export function prepararArchivos(puntoId, archivos) {
  const ahora = new Date().toISOString();
  const creadoPor = USUARIO.id;
  const registros = archivos.map((a) => ({
    id: crypto.randomUUID(), puntoId, nombre: a.name, tipo: a.type, tamano: a.size, creadoEn: ahora, creadoPor, blob: a,
  }));
  const metadatos = registros.map((r) => ({
    id: r.id, nombre: r.nombre, tipo: r.tipo, tamano: r.tamano, creadoEn: r.creadoEn, creadoPor: r.creadoPor,
  }));
  return { registros, metadatos };
}

export function normalizarPunto(p, catalogos) {
  const seccion = buscarSeccion(catalogos, p.seccion);
  return {
    seccion: p.seccion,
    remitente: p.remitente,
    remitenteOtro: typeof p.remitenteOtro === 'string' ? p.remitenteOtro.trim().replace(/\s+/g, ' ') : '',
    contenido: p.contenido.trim(),
    contenidoFormato: p.contenidoFormato ?? null,
    acuerdo: seccion.requiereAcuerdo ? (p.acuerdo || '').trim() : '',
    confidencial: p.confidencial,
    relevante: !!p.relevante,
  };
}


export function esPuntoFijo(id) {
  return typeof id === 'string' && id.startsWith('fijo:');
}

export function exigirNoFijo(id) {
  if (esPuntoFijo(id)) {
    throw new ApiError('VALIDACION', 'Los puntos fijos se generan automáticamente y no se pueden modificar.');
  }
}

export function analizarPuntoFijo(id) {
  const [, sesionId, clave] = id.split(':');
  return { sesionId, clave };
}

export function actasPendientes(sesion, sesiones) {
  const celebradas = sesiones.filter((s) => estaCelebrada(s) && s.id < sesion.id).sort((a, b) => (a.id < b.id ? -1 : 1));
  const aprobadas = new Set();
  celebradas.forEach((c, i) => {
    if (Array.isArray(c.actasAprobadas)) c.actasAprobadas.forEach((id) => aprobadas.add(id));
    else if (c.fijosTratados?.['acta-anterior']) celebradas.slice(0, i).forEach((anterior) => aprobadas.add(anterior.id));
  });
  return celebradas.filter((c) => !aprobadas.has(c.id));
}

export function generarPuntosFijos(sesion, sesiones, catalogos) {
  const numeros = new Map(calcularEstados(sesiones).map((s) => [s.id, s.numeroSesion]));
  const pendientes = actasPendientes(sesion, sesiones);
  return (catalogos.puntosFijos || [])
    .filter((f) => f.condicion !== 'actasPendientes' || pendientes.length > 0)
    .map((f) => ({
      id: `fijo:${sesion.id}:${f.id}`,
      sesionId: sesion.id,
      seccion: catalogos.secciones?.[0]?.id ?? null,
      remitente: null,
      contenido: f.texto,
      acuerdo: '',
      confidencial: false,
      relevante: false,
      archivos: [],
      tratado: f.encabezado ? false : !!sesion.fijosTratados?.[f.id],
      version: sesion.version,
      fijo: true,
      clave: f.id,
      encabezado: !!f.encabezado,
      posicion: f.posicion,
      ...(f.condicion === 'actasPendientes'
        ? { actas: pendientes.map((p) => ({ sesionId: p.id, numeroSesion: numeros.get(p.id), fecha: p.id })) }
        : null),
    }));
}

export function validarDeliberacion(texto) {
  if (typeof texto !== 'string') throw new ApiError('VALIDACION', 'La deliberación debe ser texto.');
  if (texto.length > MAX_TEXTO) throw new ApiError('VALIDACION', 'La deliberación es demasiado larga.');
}

export function validarHoraDelDia(texto) {
  if (typeof texto !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(texto)) {
    throw new ApiError('VALIDACION', 'La hora debe tener el formato HH:MM (de 00:00 a 23:59).');
  }
}

export function validarOrdenHorario(inicio, termino) {
  if (inicio && termino && inicio > termino) {
    throw new ApiError('HORARIO_INVALIDO', 'La hora de inicio no puede ser posterior a la hora de término.');
  }
}

const MAX_NOMBRE_INVITADO = 200;
const MAX_INVITADOS = 50;

export function validarInvitado(datos, catalogos, existentes) {
  const nombre = typeof datos?.nombre === 'string' ? datos.nombre.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-MX').replace(/(^|[\s-])(\p{L})/gu, (_, sep, letra) => sep + letra.toLocaleUpperCase('es-MX')) : '';
  if (!nombre) throw new ApiError('VALIDACION', 'Escribe el nombre del invitado.');
  if (nombre.length > MAX_NOMBRE_INVITADO) throw new ApiError('VALIDACION', 'El nombre del invitado es demasiado largo.');
  if (!(catalogos.generos || []).some((g) => g.id === datos.genero)) throw new ApiError('VALIDACION', 'Elige el género del invitado.');
  if (!(catalogos.gradosAcademicos || []).some((g) => g.id === datos.grado)) throw new ApiError('VALIDACION', 'Elige el grado académico del invitado.');
  if (existentes.length >= MAX_INVITADOS) throw new ApiError('VALIDACION', `Una sesión admite como máximo ${MAX_INVITADOS} invitados.`);
  return { nombre, genero: datos.genero, grado: datos.grado };
}
