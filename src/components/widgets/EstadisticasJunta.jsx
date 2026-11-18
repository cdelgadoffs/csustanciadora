import { useEffect, useState } from 'react';
import ListaExpandible from '../base/ListaExpandible.jsx';
import TextoConFormato from '../base/TextoConFormato.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { periodoDeFecha, etiquetaPeriodo, periodosDisponibles, resumenPeriodo } from '../../utils/estadisticas.js';
import { partesConFormato, docDesdeTexto } from '../../utils/textoFormato.js';
import { fechaISO } from '../../utils/fechas.js';
import '../../styles/widgets/EstadisticasJunta.css';

const INTRODUCCION = 'En primera reunión del 25 de septiembre 2025, el Secretario Ejecutivo del Pleno y el Secretario General de Acuerdos del TDJ instalaron la Junta de Coordinación que ha fungido como agencia permanente de coordinación institucional para agilizar el trámite de procedimientos de responsabilidad administrativa, generar proyectos y colaboraciones en temas afines con la participación de titulares de otras áreas, así como para tomar acuerdos conjuntos.';

export default function EstadisticasJunta() {
  const { ESTADISTICAS, cargarEstadisticas } = useProyecto();
  const hoy = fechaISO(new Date());
  const [periodo, setPeriodo] = useState(() => periodoDeFecha(hoy));

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const { datos, cargando, error } = ESTADISTICAS;
  const periodos = periodosDisponibles(datos?.sesiones ?? [], hoy);
  const { columnas, relevantes } = resumenPeriodo(datos, periodo);
  const maximo = Math.max(0, ...columnas.flatMap((c) => [c.reuniones, c.asuntos]));

  return (
    <div className="widget-estadisticas">
      <div className="widget-estadisticas-encabezado">
        <h2 className="widget-estadisticas-titulo">Junta de Coordinación</h2>
        <ListaExpandible
          valorActual={periodo}
          etiquetaActual={etiquetaPeriodo(periodo)}
          opciones={periodos.map((p) => ({ id: p, label: etiquetaPeriodo(p) }))}
          onSeleccionar={setPeriodo}
        />
      </div>
      <p className="widget-estadisticas-introduccion">{INTRODUCCION}</p>

      {error && <div className="widget-estadisticas-aviso widget-estadisticas-error">No se pudo cargar la información: {error.mensaje}</div>}
      {!error && !datos && cargando && <div className="widget-estadisticas-aviso">Cargando…</div>}

      {datos && (
        <>
          <div className="widget-estadisticas-resumen">
          <table className="widget-estadisticas-tabla">
            <thead>
              <tr>
                <th></th>
                {columnas.map((c) => <th key={c.etiqueta}>{c.etiqueta}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Reuniones</th>
                {columnas.map((c) => <td key={c.etiqueta}>{c.reuniones}</td>)}
              </tr>
              <tr>
                <th>Asuntos</th>
                {columnas.map((c) => <td key={c.etiqueta}>{c.asuntos}</td>)}
              </tr>
            </tbody>
          </table>
          <div className="widget-estadisticas-grafica" role="img" aria-label="Reuniones y asuntos por trimestre">
            <div className="widget-estadisticas-barras">
              {columnas.map((c) => (
                <div key={c.etiqueta} className="widget-estadisticas-grupo">
                  <div className="widget-estadisticas-par">
                    {[['reuniones', c.reuniones], ['asuntos', c.asuntos]].map(([serie, valor]) => (
                      <div key={serie} className="widget-estadisticas-columna">
                        <div
                          className={`widget-estadisticas-barra widget-estadisticas-barra-${serie}`}
                          style={{ height: `${maximo ? (valor / maximo) * 100 : 0}%` }}
                          title={`${c.etiqueta}: ${valor} ${serie}`}
                        >
                          <span className="widget-estadisticas-valor">{valor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <span className="widget-estadisticas-eje">{c.etiqueta}</span>
                </div>
              ))}
            </div>
            <div className="widget-estadisticas-leyenda">
              <span><i className="widget-estadisticas-muestra widget-estadisticas-barra-reuniones" />Reuniones</span>
              <span><i className="widget-estadisticas-muestra widget-estadisticas-barra-asuntos" />Asuntos</span>
            </div>
          </div>
          </div>

          <h3 className="widget-estadisticas-subtitulo">Asuntos relevantes</h3>
          {relevantes.length === 0 ? (
            <div className="widget-estadisticas-aviso">Sin asuntos relevantes en este periodo.</div>
          ) : (
            <ul className="widget-estadisticas-relevantes">
              {relevantes.map((r) => (
                <li key={r.id}>
                  <TextoConFormato parrafos={partesConFormato(r.contenidoFormato ?? docDesdeTexto(r.contenido))} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
