export function tituloPunto(numero, punto) {
  return `${numero}. ${punto.contenido || 'Sin contenido'}`;
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
  return [punto.contenido, punto.deliberacion].some((texto) => normalizarTexto(texto).includes(buscado));
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
