export function tituloInvitado(invitado, grados, { abreviado = false } = {}) {
  const grado = grados.find((g) => g.id === invitado.grado);
  if (!grado) return '';
  const mujer = invitado.genero === 'mujer';
  if (abreviado) return mujer ? grado.abreviaturaFemenino : grado.abreviaturaMasculino;
  return mujer ? grado.femenino : grado.masculino;
}

export function tratamientoInvitado(invitado, grados) {
  const titulo = tituloInvitado(invitado, grados);
  const nombre = titulo ? `${titulo} ${invitado.nombre}` : invitado.nombre;
  return invitado.cargo ? `${nombre}, ${invitado.cargo}` : nombre;
}

export function nombrePropio(texto) {
  return texto.toLocaleLowerCase('es-MX').replace(/(^|[\s-])(\p{L})/gu, (_, sep, letra) => sep + letra.toLocaleUpperCase('es-MX'));
}
