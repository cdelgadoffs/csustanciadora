import { MESES } from './meses.js';
import { ordinalFemenino } from './numerosOrdinales.js';

function fechaCompleta(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return `${dia} de ${MESES[mes - 1].toLowerCase()} de ${anio}`;
}

function enumerar(textos) {
  return textos.length > 1 ? `${textos.slice(0, -1).join(', ')} y ${textos[textos.length - 1]}` : textos[0];
}

export function textoPunto(punto) {
  const actas = punto.actas || [];
  if (actas.length === 0) return punto.contenido || 'Sin contenido';
  const reuniones = enumerar(actas.map((a) => ordinalFemenino(a.numeroSesion)));
  const fechas = enumerar(actas.map((a) => fechaCompleta(a.fecha)));
  return actas.length === 1
    ? `Aprobación del acta de la ${reuniones} reunión del ${fechas}`
    : `Aprobación de las actas de las ${reuniones} reunión del ${fechas}`;
}

export function tituloPunto(numero, punto) {
  return `${numero}. ${textoPunto(punto)}`;
}

export function etiquetaAsunto(numero) {
  return `Asunto ${numero}`;
}

export function puntosNumerados(puntos) {
  return puntos.map((punto, i) => ({ punto, numero: i + 1, titulo: tituloPunto(i + 1, punto) }));
}

export function normalizarTexto(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function puntoCoincide(punto, termino) {
  const buscado = normalizarTexto(termino).trim();
  if (!buscado) return true;
  return [textoPunto(punto), punto.deliberacion].some((texto) => normalizarTexto(texto).includes(buscado));
}

export function puntosOrdenados(puntos, secciones, termino = '') {
  return puntosNumerados(puntos)
    .filter(({ punto }) => !punto.encabezado && puntoCoincide(punto, termino))
    .map((item) => ({ ...item, seccion: secciones.find((s) => s.id === item.punto.seccion) }))
    .filter((item) => item.seccion);
}

export function puntoActivo(items, id) {
  return items.find((i) => i.punto.id === id) ?? items[0] ?? null;
}

export function contarPuntos(puntos) {
  return puntos.filter((p) => !p.encabezado).length;
}
