const implementacion = import.meta.env.VITE_API_MODE === 'real'
  ? await import('./ServerConnection/index.js')
  : await import('./LocalAPI/index.js');

export const {
  listarCatalogos,
  listarSesiones,
  crearSesiones,
  celebrarSesion,
  listarPuntos,
  crearPunto,
  editarPunto,
  eliminarPunto,
  reordenarPuntos,
  marcarPunto,
  marcarPuntos,
  guardarDeliberacion,
  adjuntarArchivos,
  eliminarArchivo,
  descargarArchivo,
} = implementacion;
