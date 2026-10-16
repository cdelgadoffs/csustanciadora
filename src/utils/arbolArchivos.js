import { nombreArchivoOrdenDia } from './ordenDia.js';

export const ID_CARPETA_ORDEN_DIA = 'orden-dia';
export const ID_CARPETA_ACTA_ANTERIOR = 'acta-anterior';
export const ID_ARCHIVO_ORDEN_DIA = 'auto:ordenDia';

function nombreSeguro(texto) {
  return (texto || 'Sin nombre').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').slice(0, 60).trim();
}

function entradasDe(punto) {
  return (punto.archivos || []).filter((a) => a.id).map((archivo) => ({ archivo, puntoId: punto.id }));
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
    archivos: sesion.listaCerrada
      ? [{ archivo: { id: ID_ARCHIVO_ORDEN_DIA, nombre: nombreArchivoOrdenDia(sesion), tipo: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', tamano: null, creadoEn: null, autogenerado: true }, puntoId: ordenDia?.id ?? null }]
      : [],
  }];
  if (actaAnterior) {
    carpetas.push({ id: ID_CARPETA_ACTA_ANTERIOR, nombre: '02-Acta de la sesión anterior', puntoRef: actaAnterior.id, archivos: [] });
  }
  puntos
    .filter((p) => !p.fijo && entradasDe(p).length > 0)
    .forEach((punto, i) => {
      const numero = String(i + 1 + carpetas.length).padStart(2, '0');
      carpetas.push({ id: punto.id, nombre: nombreSeguro(`${numero}-${punto.contenido}`), puntoRef: punto.id, archivos: entradasDe(punto) });
    });
  return carpetas;
}
