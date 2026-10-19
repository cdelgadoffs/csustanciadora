import { MESES } from './meses.js';
import { ordinalFemenino } from './numerosOrdinales.js';

function diaYMes(iso) {
  const [, mes, dia] = iso.split('-').map(Number);
  return `${dia} de ${MESES[mes - 1].toLowerCase()}`;
}

export function enumerar(textos) {
  return textos.length > 1 ? `${textos.slice(0, -1).join(', ')} y ${textos[textos.length - 1]}` : textos[0];
}

export function fechasAgrupadas(fechas) {
  const anios = [...new Set(fechas.map((f) => f.slice(0, 4)))];
  if (anios.length > 1) return { dias: enumerar(fechas.map((f) => `${diaYMes(f)} de ${f.slice(0, 4)}`)), anio: null };
  return { dias: enumerar(fechas.map(diaYMes)), anio: anios[0] };
}

export function textoPunto(punto) {
  const actas = punto.actas || [];
  if (actas.length === 0) return punto.contenido || 'Sin contenido';
  const reuniones = enumerar(actas.map((a) => ordinalFemenino(a.numeroSesion)));
  const { dias, anio } = fechasAgrupadas(actas.map((a) => a.fecha));
  if (actas.length === 1) return `Aprobación del acta de la ${reuniones} reunión celebrada el ${dias}${anio ? ` de ${anio}` : ''}`;
  const todas = actas.length === 2 ? 'ambas' : 'todas';
  return `Aprobación de las actas de la ${reuniones} reuniones celebradas el ${dias}${anio ? `, ${todas} de ${anio}` : ''}`;
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
