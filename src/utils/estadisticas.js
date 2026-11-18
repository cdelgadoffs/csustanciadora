const TRIMESTRES = [
  { etiqueta: 'sep-nov', meses: [9, 10, 11] },
  { etiqueta: 'dic-feb', meses: [12, 1, 2] },
  { etiqueta: 'mar-may', meses: [3, 4, 5] },
  { etiqueta: 'jun-ago', meses: [6, 7, 8] },
];

export function periodoDeFecha(iso) {
  const [anio, mes] = iso.split('-').map(Number);
  return mes >= 9 ? anio : anio - 1;
}

export function etiquetaPeriodo(inicio) {
  return `Sep ${inicio} – Ago ${inicio + 1}`;
}

function dentroDelPeriodo(iso, inicio) {
  return iso >= `${inicio}-09-01` && iso <= `${inicio + 1}-08-31`;
}

export function periodosDisponibles(sesiones, hoyISO) {
  const inicios = new Set([periodoDeFecha(hoyISO), ...sesiones.map((s) => periodoDeFecha(s.id))]);
  return [...inicios].sort((a, b) => b - a);
}

export function resumenPeriodo(datos, inicio) {
  const sesiones = (datos?.sesiones ?? []).filter((s) => dentroDelPeriodo(s.id, inicio));
  const columnas = TRIMESTRES.map(({ etiqueta, meses }) => {
    const propias = sesiones.filter((s) => meses.includes(Number(s.id.slice(5, 7))));
    return { etiqueta, reuniones: propias.length, asuntos: propias.reduce((t, s) => t + s.asuntos, 0) };
  });
  const ids = new Set(sesiones.map((s) => s.id));
  return { columnas, relevantes: (datos?.relevantes ?? []).filter((r) => ids.has(r.sesionId)) };
}
