import { MESES } from './meses.js';

const UNIDADES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const DIEZ_A_VEINTINUEVE = [
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
];
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function menorQueCien(n) {
  if (n < 10) return UNIDADES[n];
  if (n < 30) return DIEZ_A_VEINTINUEVE[n - 10];
  const unidad = n % 10;
  return unidad ? `${DECENAS[Math.floor(n / 10)]} y ${UNIDADES[unidad]}` : DECENAS[n / 10];
}

function menorQueMil(n) {
  if (n === 100) return 'cien';
  const centena = Math.floor(n / 100);
  const resto = n % 100;
  return [centena ? CENTENAS[centena] : '', resto ? menorQueCien(resto) : ''].filter(Boolean).join(' ');
}

export function numeroEnLetras(n) {
  if (!Number.isInteger(n) || n < 0 || n > 999999) return String(n);
  if (n < 1000) return n === 0 ? 'cero' : menorQueMil(n);
  const miles = Math.floor(n / 1000);
  const resto = n % 1000;
  return [miles === 1 ? 'mil' : `${menorQueMil(miles)} mil`, resto ? menorQueMil(resto) : ''].filter(Boolean).join(' ');
}

export function horaEnLetras(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const horas = h === 1 ? 'la una hora' : `las ${numeroEnLetras(h)} horas`;
  return m ? `${horas} con ${numeroEnLetras(m)} ${m === 1 ? 'minuto' : 'minutos'}` : horas;
}

export function fechaEnLetras(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return `${numeroEnLetras(dia)} de ${MESES[mes - 1].toLowerCase()} de ${numeroEnLetras(anio)}`;
}
