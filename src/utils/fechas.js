import { MESES } from './meses.js';

export function etiquetaFecha(id) {
  const fecha = new Date(id + 'T00:00:00');
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
}

export function fechaISO(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}
