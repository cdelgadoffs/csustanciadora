import { useState } from 'react';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useAjustesVisuales } from '../../context/AjustesVisualesContext.jsx';
import Scrollbar from '../base/Scrollbar.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import { carpetasDeSesion } from '../../utils/arbolArchivos.js';
import { estiloArchivo, formatoTamano } from '../../utils/archivos.js';
import { encabezadoSesion } from '../../utils/sesiones.js';
import { normalizarTexto, puntoCoincide } from '../../utils/puntos.js';
import '../../styles/widgets/VistaNavegador.css';

function fechaCorta(iso) {
  return iso ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

function buscarEnCarpetas(carpetas, consulta) {
  const q = normalizarTexto(consulta);
  const carpetasEncontradas = carpetas
    .filter((c) => normalizarTexto(c.nombre).includes(q))
    .map((c) => ({ clave: `c:${c.id}`, id: c.id, nombre: c.nombre, cantidad: c.archivos.length, puntoId: c.puntoRef }));
  const archivosEncontrados = carpetas.flatMap((c) => c.archivos
    .filter((entrada) => normalizarTexto(entrada.archivo.nombre).includes(q))
    .map((entrada) => ({ ...entrada, origen: c.nombre })));
  return { carpetasEncontradas, archivosEncontrados };
}

export default function VistaNavegador() {
  const { sesionSeleccionada, PUNTOS, cargando, error } = useProyecto();
  const { abrirVistaArchivo, terminoBusqueda, elementoNavegador, setElementoNavegador, irAPunto } = useUI();
  const { infoNavegadorAbierta, cambiarAjuste } = useAjustesVisuales();
  const [posicion, setPosicion] = useState({ sesionId: null, carpetaId: null, busqueda: '' });

  const sesionId = sesionSeleccionada?.id ?? null;
  const carpetaId = posicion.sesionId === sesionId ? posicion.carpetaId : null;
  const busqueda = posicion.sesionId === sesionId ? posicion.busqueda : '';
  const buscando = busqueda.trim() !== '';
  const todasLasCarpetas = carpetasDeSesion(PUNTOS, sesionSeleccionada);
  const terminoGlobal = terminoBusqueda.trim();
  const carpetas = terminoGlobal
    ? todasLasCarpetas.filter((c) => { const p = PUNTOS.find((x) => x.id === c.puntoRef); return p && puntoCoincide(p, terminoGlobal); })
    : todasLasCarpetas;
  const carpeta = carpetaId ? todasLasCarpetas.find((c) => c.id === carpetaId) ?? null : null;
  const titulo = encabezadoSesion(sesionSeleccionada).titulo;
  const claveSeleccionada = elementoNavegador && elementoNavegador.sesionId === sesionId ? elementoNavegador.clave : null;

  function ir(nuevaCarpetaId) {
    setElementoNavegador(null);
    setPosicion({ sesionId, carpetaId: nuevaCarpetaId, busqueda: '' });
  }

  function buscar(texto) {
    setElementoNavegador(null);
    setPosicion({ sesionId, carpetaId, busqueda: texto });
  }

  function subir() {
    if (buscando) buscar('');
    else if (carpeta) ir(null);
  }

  function teclaNavegador(e) {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'Backspace' || (e.altKey && e.key === 'ArrowLeft')) {
      e.preventDefault();
      subir();
    }
  }

  const migas = [
    { clave: 'raiz', texto: titulo, alIr: () => ir(null) },
    ...(carpeta ? [{ clave: carpeta.id, texto: carpeta.nombre, alIr: () => ir(carpeta.id) }] : []),
  ];

  const resultados = buscando ? buscarEnCarpetas(carpetas, busqueda.trim()) : null;
  const filasCarpetas = buscando
    ? resultados.carpetasEncontradas
    : carpeta ? [] : carpetas.map((c) => ({ clave: `c:${c.id}`, id: c.id, nombre: c.nombre, cantidad: c.archivos.length, puntoId: c.puntoRef }));
  const filasArchivos = buscando ? resultados.archivosEncontrados : carpeta ? carpeta.archivos : [];
  const vacio = filasCarpetas.length === 0 && filasArchivos.length === 0;

  function seleccionarCarpeta(f) {
    setElementoNavegador({ sesionId, clave: f.clave, tipo: 'carpeta', nombre: f.nombre, icono: 'ri-folder-3-fill', tono: 'carpeta', cantidad: f.cantidad, ubicacion: titulo, puntoId: f.puntoId });
  }

  function seleccionarArchivo(entrada) {
    const { archivo } = entrada;
    const punto = archivo.nombre.lastIndexOf('.');
    setElementoNavegador({
      sesionId, clave: `a:${archivo.id}`, tipo: 'archivo', nombre: archivo.nombre, ...estiloArchivo(archivo.nombre),
      extension: punto > 0 ? archivo.nombre.slice(punto) : '', tamano: archivo.tamano, fecha: archivo.creadoEn, puntoId: entrada.puntoId,
      ubicacion: entrada.origen || [titulo, carpeta?.nombre].filter(Boolean).join(' / '),
    });
  }

  function botonIrAPunto(puntoId) {
    return (
      <span className="widget-vista-navegador-col-acciones">
        {puntoId && PUNTOS.some((p) => p.id === puntoId) && (
          <button
            type="button"
            className="widget-vista-navegador-ir"
            onClick={(e) => { e.stopPropagation(); irAPunto(puntoId); }}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            Ir al punto
          </button>
        )}
      </span>
    );
  }

  function textoVacio() {
    if (buscando) return `Sin resultados para «${busqueda.trim()}».`;
    if (carpeta) return 'Esta carpeta está vacía.';
    if (terminoGlobal) return `Ningún punto coincide con «${terminoGlobal}».`;
    return 'Esta sesión aún no tiene archivos.';
  }

  return (
    <div className="widget-vista-navegador" tabIndex={-1} onKeyDown={teclaNavegador}>
      <div className="widget-vista-navegador-barra">
        <div className="widget-vista-navegador-migas">
          {migas.map((m, i) => (
            <span key={m.clave} className="widget-vista-navegador-miga-envoltorio">
              {i > 0 && <i className="ri-arrow-right-s-line widget-vista-navegador-separador"></i>}
              <button
                type="button"
                className={'widget-vista-navegador-miga' + (i === migas.length - 1 ? ' widget-vista-navegador-miga-actual' : '')}
                onClick={m.alIr}
                disabled={i === migas.length - 1}
              >
                {m.texto}
              </button>
            </span>
          ))}
        </div>
        <div className="widget-vista-navegador-busqueda">
          <i className="ri-search-line"></i>
          <input
            className="widget-vista-navegador-busqueda-entrada"
            value={busqueda}
            placeholder="Buscar en la sesión"
            disabled={!sesionSeleccionada}
            onChange={(e) => buscar(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') buscar(''); }}
            aria-label="Buscar en la sesión"
          />
          {busqueda && (
            <button type="button" className="widget-vista-navegador-busqueda-limpiar" onClick={() => buscar('')} aria-label="Limpiar búsqueda" title="Limpiar búsqueda">
              <i className="ri-close-line"></i>
            </button>
          )}
        </div>
      </div>
      <div className="widget-vista-navegador-herramientas">
        <BotonIcono icono="ri-arrow-up-line" ariaLabel="Subir un nivel" onClick={subir} disabled={!buscando && !carpeta} />
        <span className="widget-vista-navegador-herramientas-espacio"></span>
        <BotonIcono
          icono={infoNavegadorAbierta ? 'ri-information-fill' : 'ri-information-line'}
          ariaLabel="Información"
          onClick={() => cambiarAjuste('infoNavegadorAbierta', !infoNavegadorAbierta)}
        />
      </div>

      <div className="widget-vista-navegador-encabezado">
        <span className="widget-vista-navegador-col-nombre">Nombre</span>
        <span className="widget-vista-navegador-col-fecha">Fecha</span>
        <span className="widget-vista-navegador-col-tamano">Tamaño</span>
        <span className="widget-vista-navegador-col-acciones"></span>
      </div>

      <div className="widget-vista-navegador-cuerpo" onClick={() => setElementoNavegador(null)}>
        <Scrollbar>
          {!sesionSeleccionada && <div className="widget-vista-navegador-vacio">Selecciona una sesión para ver sus archivos.</div>}
          {sesionSeleccionada && cargando && PUNTOS.length === 0 && <div className="widget-vista-navegador-vacio">Cargando…</div>}
          {sesionSeleccionada && error && PUNTOS.length === 0 && <div className="widget-vista-navegador-vacio">No se pudieron cargar los archivos.</div>}
          {sesionSeleccionada && !cargando && !error && vacio && <div className="widget-vista-navegador-vacio">{textoVacio()}</div>}

          {filasCarpetas.map((f) => {
            const vacia = f.cantidad === 0;
            return (
              <div
                key={f.clave}
                className={'widget-vista-navegador-fila' + (f.clave === claveSeleccionada ? ' widget-vista-navegador-fila-seleccionada' : '') + (vacia ? ' widget-vista-navegador-fila-vacia' : '')}
                onClick={(e) => { e.stopPropagation(); if (!vacia) seleccionarCarpeta(f); }}
                onDoubleClick={() => { if (!vacia) ir(f.id); }}
                role="button"
                aria-disabled={vacia}
                tabIndex={vacia ? -1 : 0}
                onKeyDown={(e) => { if (e.key === 'Enter' && !vacia) ir(f.id); }}
              >
                <span className="widget-vista-navegador-col-nombre">
                  <i className="ri-folder-3-fill widget-vista-navegador-icono-carpeta"></i>
                  <span className="widget-vista-navegador-nombre">{f.nombre}</span>
                </span>
                <span className="widget-vista-navegador-col-fecha"></span>
                <span className="widget-vista-navegador-col-tamano">{f.cantidad} {f.cantidad === 1 ? 'elemento' : 'elementos'}</span>
                {botonIrAPunto(f.puntoId)}
              </div>
            );
          })}

          {filasArchivos.map((entrada) => {
            const { archivo } = entrada;
            const estilo = estiloArchivo(archivo.nombre);
            return (
              <div
                key={archivo.id}
                className={'widget-vista-navegador-fila' + (`a:${archivo.id}` === claveSeleccionada ? ' widget-vista-navegador-fila-seleccionada' : '')}
                onClick={(e) => { e.stopPropagation(); seleccionarArchivo(entrada); }}
                onDoubleClick={() => abrirVistaArchivo(archivo)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') abrirVistaArchivo(archivo); }}
              >
                <span className="widget-vista-navegador-col-nombre">
                  <i className={`${estilo.icono} widget-vista-navegador-icono widget-vista-navegador-icono-${estilo.tono}`}></i>
                  <span className="widget-vista-navegador-nombre" title={archivo.nombre}>{archivo.nombre}</span>
                  {entrada.origen && <span className="widget-vista-navegador-origen" title={entrada.origen}>{entrada.origen}</span>}
                </span>
                <span className="widget-vista-navegador-col-fecha">{fechaCorta(archivo.creadoEn)}</span>
                <span className="widget-vista-navegador-col-tamano">{archivo.tamano ? formatoTamano(archivo.tamano) : '—'}</span>
                {botonIrAPunto(entrada.puntoId)}
              </div>
            );
          })}
        </Scrollbar>
      </div>
    </div>
  );
}
