import { createContext, useContext, useState } from 'react';

export const ANCHO_SIDEBAR1 = 270;
export const ANCHO_SIDEBAR2 = 250;
export const ANCHO_SIDEBAR3 = 500;
export const ALTO_TOPBAR = 52;
export const ALTO_CINTA = 50;
export const ANCHO_SIDEBAR4 = 320;

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [sidebar3Abierto, setSidebar3Abierto] = useState(false);
  const [sidebar4Abierto, setSidebar4Abierto] = useState(false);
  const [sidebar5Abierto, setSidebar5Abierto] = useState(false);
  const [sidebar5Ancho, setSidebar5Ancho] = useState(false);
  const [panelControlActivo, setPanelControlActivo] = useState(null);
  const [mostrarFormularioCalendario, setMostrarFormularioCalendario] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [vistaActual, setVistaActualEstado] = useState('inicio');
  const [puntoEnEdicionId, setPuntoEnEdicionId] = useState(null);
  const [seccionNuevoPunto, setSeccionNuevoPunto] = useState(null);
  const [nuevoPuntoEnSesion, setNuevoPuntoEnSesion] = useState(false);
  const [puntoSesionSeleccionadoId, setPuntoSesionSeleccionadoId] = useState(null);
  const [archivoEnVista, setArchivoEnVista] = useState(null);
  const [elementoNavegador, setElementoNavegador] = useState(null);
  const [puntoDestinoProyecto, setPuntoDestinoProyecto] = useState(null);
  const izquierdaSidebar1 = 0;
  const izquierdaSidebar3 = izquierdaSidebar1 + ANCHO_SIDEBAR1;

  function toggleSidebar5() {
    if (sidebar5Abierto) setPanelControlActivo(null);
    setSidebar5Abierto((a) => !a);
  }
  function abrirEdicionPunto(id, seccion = null) {
    setPuntoEnEdicionId(id);
    setSeccionNuevoPunto(seccion);
    setNuevoPuntoEnSesion(false);
    setSidebar3Abierto(true);
  }
  function abrirNuevoPunto(seccion = null, { agregadoEnSesion = false } = {}) {
    setPuntoEnEdicionId(null);
    setSeccionNuevoPunto(seccion);
    setNuevoPuntoEnSesion(agregadoEnSesion);
    setSidebar3Abierto(true);
  }
  function cerrarSidebar3() {
    setSidebar3Abierto(false);
    setPuntoEnEdicionId(null);
  }
  function setVistaActual(vista) {
    setVistaActualEstado(vista);
    cerrarSidebar3();
    setElementoNavegador(null);
    setArchivoEnVista(null);
    if (vista !== 'proyecto') setPuntoDestinoProyecto(null);
  }
  function irAPunto(puntoId) {
    setPuntoDestinoProyecto(puntoId);
    setTerminoBusqueda('');
    setVistaActual('proyecto');
  }
  function abrirVistaArchivo(archivo) {
    setArchivoEnVista({ id: archivo.id, nombre: archivo.nombre, tipo: archivo.tipo, generador: archivo.generador ?? null, sesionId: archivo.sesionId ?? null });
  }
  function cerrarVistaArchivo() {
    setArchivoEnVista(null);
  }
  function cerrarSidebar5() {
    setSidebar5Abierto(false);
    setPanelControlActivo(null);
  }

  const value = {
    sidebar3Abierto, setSidebar3Abierto, cerrarSidebar3,
    sidebar4Abierto, setSidebar4Abierto,
    sidebar5Abierto, toggleSidebar5, cerrarSidebar5,
    sidebar5Ancho, setSidebar5Ancho,
    panelControlActivo, setPanelControlActivo,
    mostrarFormularioCalendario, setMostrarFormularioCalendario,
    terminoBusqueda, setTerminoBusqueda,
    vistaActual, setVistaActual,
    puntoEnEdicionId, setPuntoEnEdicionId, abrirEdicionPunto, seccionNuevoPunto, nuevoPuntoEnSesion, abrirNuevoPunto,
    puntoSesionSeleccionadoId, setPuntoSesionSeleccionadoId,
    archivoEnVista, abrirVistaArchivo, cerrarVistaArchivo,
    elementoNavegador, setElementoNavegador,
    puntoDestinoProyecto, irAPunto,
    izquierdaSidebar1, izquierdaSidebar3,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  return useContext(UIContext);
}
