import { nombreArchivoOrdenDia, generarWordOrdenDia } from './ordenDia.js';
import { nombreArchivoActa, generarWordActa } from './actaSesion.js';

export const ID_CARPETA_ORDEN_DIA = 'orden-dia';
export const ID_CARPETA_ACTA_ANTERIOR = 'acta-anterior';
export const ID_ARCHIVO_ORDEN_DIA = 'auto:ordenDia';
export const ID_ARCHIVO_ACTA = 'auto:acta';
const TIPO_WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const GENERADORES_AUTOMATICOS = {
  ordenDia: generarWordOrdenDia,
  acta: generarWordActa,
};

function automatico(id, nombre, generador, sesionId = null) {
  return { id, nombre, tipo: TIPO_WORD, tamano: null, creadoEn: null, autogenerado: true, generador, sesionId };
}

function archivoOrdenDia(sesion) {
  return sesion?.listaCerrada ? [automatico(ID_ARCHIVO_ORDEN_DIA, nombreArchivoOrdenDia(sesion), 'ordenDia')] : [];
}

function archivoActa(sesion) {
  return sesion?.listaCerrada ? [automatico(ID_ARCHIVO_ACTA, nombreArchivoActa(sesion), 'acta')] : [];
}

function actasDeSesionesAnteriores(punto) {
  return (punto?.actas || []).map((a) => automatico(
    `${ID_ARCHIVO_ACTA}:${a.sesionId}`,
    nombreArchivoActa({ id: a.fecha, numeroSesion: a.numeroSesion }),
    'acta',
    a.sesionId,
  ));
}

function nombreSeguro(texto) {
  return (texto || 'Sin nombre').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').slice(0, 60).trim();
}

function entradasDe(punto) {
  return (punto.archivos || []).filter((a) => a.id).map((archivo) => ({ archivo, puntoId: punto.id }));
}

export function archivosAutomaticos(punto, sesion) {
  if (!punto?.fijo) return [];
  if (punto.clave === 'orden-dia') return [...archivoOrdenDia(sesion), ...archivoActa(sesion)];
  return actasDeSesionesAnteriores(punto);
}

export function carpetasDeSesion(puntos, sesion) {
  if (!sesion || puntos.length === 0) return [];
  const fijo = (clave) => puntos.find((p) => p.fijo && p.clave === clave);
  const ordenDia = fijo('orden-dia');
  const actaAnterior = fijo('acta-anterior');
  const carpetas = [{
    id: ID_CARPETA_ORDEN_DIA,
    nombre: '01-Aprobación del orden del día',
    puntoRef: ordenDia?.id ?? null,
    archivos: archivoOrdenDia(sesion).map((archivo) => ({ archivo, puntoId: ordenDia?.id ?? null })),
  }];
  if (actaAnterior) {
    carpetas.push({ id: ID_CARPETA_ACTA_ANTERIOR, nombre: '02-Acta de la sesión anterior', puntoRef: actaAnterior.id, archivos: actasDeSesionesAnteriores(actaAnterior).map((archivo) => ({ archivo, puntoId: actaAnterior.id })) });
  }
  puntos
    .filter((p) => !p.fijo && entradasDe(p).length > 0)
    .forEach((punto, i) => {
      const numero = String(i + 1 + carpetas.length).padStart(2, '0');
      carpetas.push({ id: punto.id, nombre: nombreSeguro(`${numero}-${punto.contenido}`), puntoRef: punto.id, archivos: entradasDe(punto) });
    });
  if (sesion.listaCerrada) {
    const numero = String(carpetas.length + 1).padStart(2, '0');
    carpetas.push({ id: ID_ARCHIVO_ACTA, nombre: `${numero}-Acta de la reunión`, puntoRef: null, archivos: archivoActa(sesion).map((archivo) => ({ archivo, puntoId: null })) });
  }
  return carpetas;
}
