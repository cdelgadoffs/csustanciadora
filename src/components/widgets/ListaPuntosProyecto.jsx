import { useState } from 'react';
import Card from '../base/Card.jsx';
import IndicadorSync from '../base/IndicadorSync.jsx';
import BadgeDinamico from '../base/BadgeDinamico.jsx';
import OpcionesAUD from './OpcionesAUD.jsx';
import OpcionesNavegacion from './OpcionesNavegacion.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { estiloArchivo, guardarEnDisco } from '../../utils/archivos.js';
import { puntosNumerados } from '../../utils/puntos.js';
import '../../styles/widgets/ListaPuntosProyecto.css';

function seleccionarSiNoEsControl(e, seleccionar) {
  if (e.target.closest('button, a, input, label')) return;
  seleccionar();
}

function TarjetaPunto({ punto, titulo, requiereAcuerdo, nombreRemitente, opciones, onDescargar, seleccionada, onSeleccionar }) {
  const esInforme = !requiereAcuerdo;
  return (
    <div className={'widget-lista-puntos-item' + (seleccionada ? ' widget-lista-puntos-item-seleccionado' : '')}>
      <Card onClick={(e) => seleccionarSiNoEsControl(e, onSeleccionar)}>
        <div className="widget-lista-puntos-header">
          <span className={'widget-lista-puntos-titulo' + (punto.confidencial ? ' widget-lista-puntos-titulo-confidencial' : '')}>
            {titulo}
          </span>
          <div className="widget-lista-puntos-header-derecha">
            <IndicadorSync estado={punto.sincronizacion} />
            {nombreRemitente && <span className="widget-lista-puntos-dependencia">{nombreRemitente}</span>}
            {opciones && (
              <div className="widget-lista-puntos-opciones">
                <div className="widget-lista-puntos-opciones-interior">{opciones}</div>
              </div>
            )}
          </div>
        </div>
        {!esInforme && (
          <div className="widget-lista-puntos-fila">
            <span className="widget-lista-puntos-label">Acuerdo</span>
            <div className="widget-lista-puntos-acuerdo">{punto.acuerdo || 'Sin acuerdo'}</div>
          </div>
        )}
        {punto.archivos.length > 0 && (
          <div className="widget-lista-puntos-archivos">
            {punto.archivos.map((a, i) => {
              const { icono, tono } = estiloArchivo(a.nombre);
              return (
                <BadgeDinamico
                  key={a.id ?? i}
                  texto={a.nombre}
                  icono={icono}
                  tono={tono}
                  onClick={a.id ? () => onDescargar(a) : undefined}
                />
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function listaDeSeccion(puntos, seccion, remitentes, estadoCarga, renderOpciones, onDescargar, seleccionadoId, seleccionar) {
  const deLaSeccion = puntos.filter((p) => p.seccion === seccion.id);
  if (deLaSeccion.length === 0) {
    if (estadoCarga === 'error') return null;
    if (estadoCarga === 'cargando') return <div className="widget-lista-puntos-vacio">Cargando…</div>;
    return <div className="widget-lista-puntos-vacio">Sin asuntos registrados.</div>;
  }
  const registrados = deLaSeccion.filter((p) => !p.fijo);
  const vacio = registrados.length === 0 && estadoCarga === 'listo' && (
    <div key="vacio" className="widget-lista-puntos-vacio">Sin asuntos registrados.</div>
  );
  const numeros = new Map(puntosNumerados(puntos).map(({ punto, titulo }) => [punto.id, titulo]));
  const elementos = deLaSeccion.map((p) => {
    if (p.encabezado) {
      return <div key={p.id} className="widget-lista-puntos-encabezado">{numeros.get(p.id)}</div>;
    }
    const i = registrados.indexOf(p);
    return (
      <TarjetaPunto
        key={p.id}
        punto={p}
        titulo={numeros.get(p.id)}
        requiereAcuerdo={seccion.requiereAcuerdo}
        nombreRemitente={remitentes.find((r) => r.id === p.remitente)?.nombre ?? p.remitente}
        opciones={p.fijo ? null : renderOpciones(p, i, registrados, seccion.id)}
        onDescargar={onDescargar}
        seleccionada={seleccionadoId === p.id}
        onSeleccionar={() => seleccionar(p.id)}
      />
    );
  });
  const indiceCierre = deLaSeccion.findIndex((p) => p.encabezado);
  if (vacio) elementos.splice(indiceCierre === -1 ? elementos.length : indiceCierre, 0, vacio);
  return elementos;
}

export default function ListaPuntosProyecto({ opcionesOcultas = [], opcionesExtra }) {
  const { PUNTOS: puntos, SECCIONES_DOCUMENTO, REMITENTES, sesionFinalizada, listaCerrada, descargarArchivo, reordenarPuntos, cargando, error } = useProyecto();
  const [errorAccion, setErrorAccion] = useState(null);
  const [moviendo, setMoviendo] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const seleccionar = setSeleccionadoId;
  const estadoCarga = error ? 'error' : cargando ? 'cargando' : 'listo';
  const avisoError = (error || errorAccion) && (
    <div className="widget-lista-puntos-error">
      {error ? `No se pudo cargar la información: ${error.mensaje}` : errorAccion}
    </div>
  );
  async function descargar(archivo) {
    setErrorAccion(null);
    try {
      const { nombre, blob } = await descargarArchivo(archivo.id);
      guardarEnDisco(nombre, blob);
    } catch (e) {
      setErrorAccion(e.mensaje || 'No se pudo descargar el archivo.');
    }
  }
  async function mover(seccionId, deLaSeccion, indice, delta) {
    if (moviendo) return;
    const ids = deLaSeccion.map((p) => p.id);
    [ids[indice], ids[indice + delta]] = [ids[indice + delta], ids[indice]];
    setMoviendo(true);
    setErrorAccion(null);
    try {
      await reordenarPuntos(seccionId, ids);
    } catch (e) {
      setErrorAccion(e.mensaje || 'No se pudo mover el punto.');
    } finally {
      setMoviendo(false);
    }
  }
  const ocultas = listaCerrada ? [...opcionesOcultas, 'mover', 'editar', 'eliminar'] : opcionesOcultas;
  const renderOpciones = (punto, indice, deLaSeccion, seccionId) => (sesionFinalizada ? null : (
    <>
      {deLaSeccion.length > 1 && !ocultas.includes('mover') && (
        <OpcionesNavegacion
          orientacion="vertical"
          onAnterior={() => mover(seccionId, deLaSeccion, indice, -1)}
          onSiguiente={() => mover(seccionId, deLaSeccion, indice, 1)}
          anteriorDeshabilitado={moviendo || indice === 0}
          siguienteDeshabilitado={moviendo || indice === deLaSeccion.length - 1}
          etiquetaAnterior="Subir punto"
          etiquetaSiguiente="Bajar punto"
        />
      )}
      <OpcionesAUD punto={punto} ocultar={ocultas}>
        {opcionesExtra && opcionesExtra(punto)}
      </OpcionesAUD>
    </>
  ));

  const seccion = SECCIONES_DOCUMENTO[0];

  return (
    <div className="widget-lista-puntos-proyecto">
      {avisoError}
      {seccion ? listaDeSeccion(puntos, seccion, REMITENTES, estadoCarga, renderOpciones, descargar, seleccionadoId, seleccionar) : (
        estadoCarga === 'listo' && <div className="widget-lista-puntos-vacio">Sin secciones definidas.</div>
      )}
      {!seccion && estadoCarga === 'cargando' && <div className="widget-lista-puntos-vacio">Cargando…</div>}
    </div>
  );
}
