export function encabezadoSesion(sesion) {
  return sesion
    ? { titulo: `Reunión N° ${sesion.numeroSesion}`, subtitulo: sesion.label }
    : { titulo: 'Reunión', subtitulo: 'Fecha por definir' };
}
