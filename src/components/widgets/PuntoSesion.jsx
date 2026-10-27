import { useEffect, useRef, useState } from 'react';
import Card from '../base/Card.jsx';
import Textarea from '../base/Textarea.jsx';
import BadgeDinamico from '../base/BadgeDinamico.jsx';
import OpcionesNavegacion from './OpcionesNavegacion.jsx';
import OpcionesAUD from './OpcionesAUD.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { puntosOrdenados, puntoActivo, nombreRemitente } from '../../utils/puntos.js';
import { estiloArchivo } from '../../utils/archivos.js';
import { archivosAutomaticos } from '../../utils/arbolArchivos.js';
import '../../styles/widgets/PuntoSesion.css';

function CampoDeliberacion({ punto, deshabilitado, onGuardar }) {
  const [texto, setTexto] = useState(punto.deliberacion ?? '');
  const [estado, setEstado] = useState(null);
  const pendienteRef = useRef(null);
  const guardarRef = useRef(onGuardar);

  useEffect(() => {
    guardarRef.current = onGuardar;
  });

  async function guardar(valor) {
    pendienteRef.current = null;
    setEstado('guardando');
    try {
      await guardarRef.current(valor);
      setEstado('guardado');
    } catch (e) {
      setEstado(e.mensaje || 'No se pudo guardar la deliberación.');
    }
  }

  useEffect(() => {
    if (pendienteRef.current === null) return;
    const temporizador = setTimeout(() => guardar(texto), 600);
    return () => clearTimeout(temporizador);
  }, [texto]);

  useEffect(() => () => {
    if (pendienteRef.current !== null) guardarRef.current(pendienteRef.current).catch(() => null);
  }, []);

  function cambiar(valor) {
    pendienteRef.current = valor;
    setEstado(null);
    setTexto(valor);
  }

  const aviso = estado === 'guardando' ? 'Guardando…' : estado === 'guardado' ? 'Guardado' : estado;
  return (
    <div className="widget-punto-sesion-deliberacion">
      <span className="widget-punto-sesion-label">Deliberación</span>
      <Textarea
        value={texto}
        onChange={cambiar}
        placeholder={deshabilitado ? 'Sin deliberación registrada.' : 'Anota lo deliberado en la sesión…'}
        disabled={deshabilitado}
      />
      {aviso && (
        <span className={'widget-punto-sesion-deliberacion-estado' + (estado !== 'guardando' && estado !== 'guardado' ? ' widget-punto-sesion-deliberacion-error' : '')}>
          {aviso}
        </span>
      )}
    </div>
  );
}

export default function PuntoSesion() {
  const { PUNTOS, SECCIONES_DOCUMENTO, REMITENTES, sesionSeleccionada, sesionFinalizada, listaCerrada, guardarDeliberacion, cargando, error } = useProyecto();
  const { puntoSesionSeleccionadoId, setPuntoSesionSeleccionadoId, terminoBusqueda, abrirVistaArchivo } = useUI();

  const termino = terminoBusqueda.trim();
  const items = puntosOrdenados(PUNTOS, SECCIONES_DOCUMENTO, termino);
  const activo = puntoActivo(items, puntoSesionSeleccionadoId);

  if (!activo) {
    const mensaje = error
      ? `No se pudo cargar la información: ${error.mensaje}`
      : cargando ? 'Cargando…' : termino ? `Sin coincidencias para «${termino}».` : 'Esta sesión no tiene puntos.';
    return <div className="widget-punto-sesion"><div className="widget-punto-sesion-vacio">{mensaje}</div></div>;
  }

  const { punto, seccion, titulo } = activo;
  const indice = items.indexOf(activo);
  const irA = (delta) => setPuntoSesionSeleccionadoId(items[indice + delta].punto.id);
  const esInforme = !seccion.requiereAcuerdo;
  const remitente = nombreRemitente(punto, REMITENTES, { corto: true });

  return (
    <div className={'widget-punto-sesion' + (punto.tratado ? ' widget-punto-sesion-tratado' : '')}>
      <Card>
        <div className="widget-punto-sesion-header">
          <span className={'widget-punto-sesion-titulo' + (punto.confidencial ? ' widget-punto-sesion-titulo-confidencial' : '')}>
            {titulo}
          </span>
          {remitente && <span className="widget-punto-sesion-dependencia">{remitente}</span>}
        </div>
        {!punto.fijo && (
          <>
            {!esInforme && (
              <div className="widget-punto-sesion-columnas">
                <div className="widget-punto-sesion-columna widget-punto-sesion-principal">
                  <span className="widget-punto-sesion-label">Acuerdo</span>
                  <div className="widget-punto-sesion-acuerdo">{punto.acuerdo || 'Sin acuerdo'}</div>
                </div>
              </div>
            )}
            <CampoDeliberacion
              key={punto.id}
              punto={punto}
              deshabilitado={sesionFinalizada}
              onGuardar={(texto) => guardarDeliberacion(punto.id, texto)}
            />
          </>
        )}
        <div className="widget-punto-sesion-navegacion">
          <div className="widget-punto-sesion-archivos">
            {[...archivosAutomaticos(punto, sesionSeleccionada), ...(punto.fijo ? [] : punto.archivos)].map((a, i) => {
              const { icono, tono } = estiloArchivo(a.nombre);
              return (
                <BadgeDinamico
                  key={a.id ?? i}
                  texto={a.nombre}
                  icono={icono}
                  tono={tono}
                  onClick={a.id ? () => abrirVistaArchivo(a) : undefined}
                />
              );
            })}
          </div>
          <OpcionesNavegacion
            onAnterior={() => irA(-1)}
            onSiguiente={() => irA(1)}
            anteriorDeshabilitado={indice === 0}
            siguienteDeshabilitado={indice === items.length - 1}
            etiquetaAnterior="Punto anterior"
            etiquetaSiguiente="Punto siguiente"
          />
          {!sesionFinalizada && !listaCerrada && !punto.fijo && <OpcionesAUD punto={punto} ocultar={['adjuntar', 'editar']} />}
        </div>
      </Card>
    </div>
  );
}
