import { createContext, useContext, useEffect, useState } from 'react';
import {
  listarCatalogos, listarSesiones, crearSesiones, celebrarSesion,
  establecerListaCerrada as establecerListaCerradaEnApi,
  comenzarSesion as comenzarSesionEnApi, editarHorario as editarHorarioEnApi,
  listarPuntos, crearPunto, reordenarPuntos as reordenarPuntosEnApi, marcarPunto as marcarPuntoEnApi, marcarPuntos as marcarPuntosEnApi,
  guardarDeliberacion as guardarDeliberacionEnApi,
  editarPunto as editarPuntoEnApi, eliminarPunto as eliminarPuntoEnApi,
  adjuntarArchivos as adjuntarArchivosEnApi, eliminarArchivo as eliminarArchivoEnApi,
  descargarArchivo as descargarArchivoEnApi,
} from '../services/api.js';
import {
  guardarBorrador, obtenerBorrador, eliminarBorrador,
  guardarCache, obtenerCache,
} from '../services/SesionIndexedDB.js';
import { etiquetaFecha } from '../utils/fechas.js';

const ProyectoContext = createContext(null);

const CACHE_CATALOGOS = 'catalogos';
const CACHE_SESIONES = 'sesiones';
const cachePuntos = (sesionId) => `puntos:${sesionId}`;

const conEtiqueta = (sesiones) => sesiones.map((s) => ({ ...s, label: etiquetaFecha(s.id) }));
const conSync = (punto) => ({ ...punto, sincronizacion: 'servidor' });

const CATALOGOS_VACIOS = { secciones: [], remitentes: [] };

export function ProyectoProvider({ children }) {
  const [fechasSesiones, setFechasSesiones] = useState([]);
  const [sesionActivaFecha, setSesionActivaFecha] = useState(null);
  const [puntos, setPuntos] = useState([]);
  const [catalogos, setCatalogos] = useState(CATALOGOS_VACIOS);
  const [cargas, setCargas] = useState({ catalogos: { cargando: true }, sesiones: { cargando: true }, puntos: {} });

  function marcarCarga(recurso, estado) {
    setCargas((c) => ({ ...c, [recurso]: estado }));
  }

  useEffect(() => {
    let vigente = true;
    let servidorListo = false;
    obtenerCache(CACHE_CATALOGOS).then((c) => {
      if (vigente && !servidorListo && c) setCatalogos(c);
    });
    listarCatalogos()
      .then((c) => {
        if (!vigente) return;
        servidorListo = true;
        const completos = { ...CATALOGOS_VACIOS, ...c };
        setCatalogos(completos);
        guardarCache(CACHE_CATALOGOS, completos);
        marcarCarga('catalogos', {});
      })
      .catch((e) => vigente && marcarCarga('catalogos', { error: e }));
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    let vigente = true;
    let servidorListo = false;
    obtenerCache(CACHE_SESIONES).then((c) => {
      if (vigente && !servidorListo && c) setFechasSesiones(c);
    });
    listarSesiones()
      .then((sesiones) => {
        if (!vigente) return;
        servidorListo = true;
        const lista = conEtiqueta(sesiones);
        setFechasSesiones(lista);
        guardarCache(CACHE_SESIONES, lista);
        marcarCarga('sesiones', {});
      })
      .catch((e) => vigente && marcarCarga('sesiones', { error: e }));
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    if (sesionActivaFecha !== null) return;
    const proxima = fechasSesiones.find((f) => f.estado === 'proxima');
    if (proxima) setSesionActivaFecha(proxima.id);
  }, [fechasSesiones, sesionActivaFecha]);

  useEffect(() => {
    setPuntos([]);
    if (!sesionActivaFecha) {
      marcarCarga('puntos', {});
      return;
    }
    marcarCarga('puntos', { cargando: true });
    let vigente = true;
    let servidorListo = false;
    const clave = cachePuntos(sesionActivaFecha);
    obtenerCache(clave).then((c) => {
      if (vigente && !servidorListo && c) setPuntos(c);
    });
    listarPuntos(sesionActivaFecha)
      .then((lista) => {
        if (!vigente) return;
        servidorListo = true;
        const conEstado = lista.map(conSync);
        setPuntos(conEstado);
        guardarCache(clave, conEstado);
        marcarCarga('puntos', {});
      })
      .catch((e) => vigente && marcarCarga('puntos', { error: e }));
    return () => { vigente = false; };
  }, [sesionActivaFecha]);

  function aplicarSesiones(sesiones) {
    const lista = conEtiqueta(sesiones);
    setFechasSesiones(lista);
    guardarCache(CACHE_SESIONES, lista);
  }

  async function agregarSesiones(fechas) {
    aplicarSesiones(await crearSesiones(fechas));
  }
  function cargarSesion(fecha) {
    setSesionActivaFecha(fecha);
  }
  async function comenzarSesion() {
    await comenzarSesionEnApi(sesionActivaFecha);
    aplicarSesiones(await listarSesiones());
  }
  async function editarHorario(cambios) {
    await editarHorarioEnApi(sesionActivaFecha, cambios);
    aplicarSesiones(await listarSesiones());
  }
  async function finalizarSesion() {
    await celebrarSesion(sesionActivaFecha);
    aplicarSesiones(await listarSesiones());
  }
  async function establecerListaCerrada(cerrada) {
    await establecerListaCerradaEnApi(sesionActivaFecha, cerrada);
    aplicarSesiones(await listarSesiones());
  }
  function aplicarPuntos(lista) {
    setPuntos(lista);
    guardarCache(cachePuntos(sesionActivaFecha), lista);
  }
  async function recargarPuntos() {
    aplicarPuntos((await listarPuntos(sesionActivaFecha)).map(conSync));
  }
  async function agregarPunto(datos) {
    await crearPunto(sesionActivaFecha, datos);
    await recargarPuntos();
  }
  async function editarPunto(id, version, cambios) {
    try {
      const editado = conSync(await editarPuntoEnApi(id, version, cambios));
      aplicarPuntos(puntos.map((p) => (p.id === id ? editado : p)));
    } catch (e) {
      if (e.codigo === 'CONFLICTO') await recargarPuntos();
      throw e;
    }
  }
  async function eliminarPunto(id) {
    await eliminarPuntoEnApi(id);
    aplicarPuntos(puntos.filter((p) => p.id !== id));
  }
  async function reordenarPuntos(seccion, ids) {
    try {
      await reordenarPuntosEnApi(sesionActivaFecha, seccion, ids);
      await recargarPuntos();
    } catch (e) {
      if (e.codigo === 'CONFLICTO') await recargarPuntos();
      throw e;
    }
  }
  async function marcarPunto(id, tratado) {
    const editado = conSync(await marcarPuntoEnApi(id, tratado));
    aplicarPuntos(puntos.map((p) => (p.id === id ? editado : p)));
  }
  async function guardarDeliberacion(id, texto) {
    const editado = conSync(await guardarDeliberacionEnApi(id, texto));
    aplicarPuntos(puntos.map((p) => (p.id === id ? editado : p)));
  }
  async function marcarTodosPuntos(tratado) {
    aplicarPuntos((await marcarPuntosEnApi(sesionActivaFecha, tratado)).map(conSync));
  }
  async function adjuntarArchivos(puntoId, archivos) {
    const editado = conSync(await adjuntarArchivosEnApi(puntoId, archivos));
    aplicarPuntos(puntos.map((p) => (p.id === puntoId ? editado : p)));
  }
  async function eliminarArchivo(puntoId, archivoId) {
    const editado = conSync(await eliminarArchivoEnApi(puntoId, archivoId));
    aplicarPuntos(puntos.map((p) => (p.id === puntoId ? editado : p)));
  }
  function descargarArchivo(archivoId) {
    return descargarArchivoEnApi(archivoId);
  }

  const cargando = Object.values(cargas).some((c) => c.cargando);
  const error = Object.values(cargas).map((c) => c.error).find(Boolean) ?? null;

  const sesionSeleccionada = fechasSesiones.find((f) => f.id === sesionActivaFecha);
  const sesionFinalizada = !!sesionSeleccionada?.celebrada;
  const listaCerrada = !!sesionSeleccionada?.listaCerrada;

  const value = {
    sesionSeleccionada,
    SECCIONES_DOCUMENTO: catalogos.secciones, REMITENTES: catalogos.remitentes,
    FECHAS_SESIONES: fechasSesiones,
    sesionActivaFecha, cargarSesion,
    sesionFinalizada, comenzarSesion, finalizarSesion, editarHorario,
    listaCerrada, establecerListaCerrada,
    PUNTOS: puntos, agregarPunto, editarPunto, eliminarPunto, reordenarPuntos,
    marcarPunto, marcarTodosPuntos, guardarDeliberacion, adjuntarArchivos, eliminarArchivo, descargarArchivo,
    agregarSesiones,
    guardarBorrador, obtenerBorrador, eliminarBorrador,
    cargando, error,
  };
  return <ProyectoContext.Provider value={value}>{children}</ProyectoContext.Provider>;
}

export function useProyecto() {
  return useContext(ProyectoContext);
}
