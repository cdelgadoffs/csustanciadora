export function tituloPunto(numero, punto) {
  return `${numero}. ${punto.contenido || 'Sin contenido'}`;
}

export function puntosNumerados(puntos) {
  return puntos.map((punto, i) => ({ punto, numero: i + 1, titulo: tituloPunto(i + 1, punto) }));
}

export function puntosOrdenados(puntos, secciones) {
  return puntosNumerados(puntos)
    .filter(({ punto }) => !punto.encabezado)
    .map((item) => ({ ...item, seccion: secciones.find((s) => s.id === item.punto.seccion) }))
    .filter((item) => item.seccion);
}

export function puntoActivo(items, id) {
  return items.find((i) => i.punto.id === id) ?? items[0] ?? null;
}

export function contarPuntos(puntos) {
  return puntos.filter((p) => !p.encabezado).length;
}
