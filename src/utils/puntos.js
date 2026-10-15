export function puntosOrdenados(puntos, secciones) {
  return secciones.flatMap((seccion) => {
    let consecutivo = 0;
    return puntos
      .filter((p) => p.seccion === seccion.id && !p.encabezado)
      .map((punto) => ({
        punto,
        seccion,
        titulo: punto.fijo ? punto.contenido : `${seccion.nombre} ${++consecutivo}`,
      }));
  });
}

export function puntoActivo(items, id) {
  return items.find((i) => i.punto.id === id) ?? items[0] ?? null;
}

export function contarPuntos(puntos) {
  return puntos.filter((p) => !p.encabezado).length;
}
