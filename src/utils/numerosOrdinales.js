const UNIDADES = ['', 'primera', 'segunda', 'tercera', 'cuarta', 'quinta', 'sexta', 'séptima', 'octava', 'novena'];
const DECENAS = ['', 'décima', 'vigésima', 'trigésima', 'cuadragésima', 'quincuagésima'];
const ESPECIALES = { 11: 'undécima', 12: 'duodécima' };

export function ordinalFemenino(n) {
  if (!Number.isInteger(n) || n < 1 || n > 50) return String(n);
  if (ESPECIALES[n]) return ESPECIALES[n];
  const decena = DECENAS[Math.floor(n / 10)];
  const unidad = UNIDADES[n % 10];
  return [decena, unidad].filter(Boolean).join(' ');
}
