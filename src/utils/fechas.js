import { MESES } from './meses.js';

export function etiquetaFecha(id) {
  const fecha = new Date(id + 'T00:00:00');
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
}
