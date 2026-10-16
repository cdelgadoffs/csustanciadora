import { useEffect, useLayoutEffect, useState } from 'react';
import BotonS from '../../components/base/BotonS.jsx';
import BotonAgregar from '../../components/base/BotonAgregar.jsx';
import CalendarioMes from '../../components/base/CalendarioMes.jsx';
import CardS from '../../components/base/CardS.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { encabezadoSesion } from '../../utils/sesiones.js';

const ESTADO_LABEL = {
  proxima: 'Próxima',
  'no-celebrada': 'No celebrada',
  pendiente: 'Pendiente',
  celebrada: 'Celebrada',
};

function mesActualISO() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

export function BotonNuevoCalendarioMensual() {
  const { panelControlActivo, setMostrarFormularioCalendario } = useUI();

  if (panelControlActivo !== 'calendarizacionMensual') return null;

  return (
    <BotonAgregar etiqueta="Nuevo calendario" onClick={() => setMostrarFormularioCalendario((v) => !v)}>+</BotonAgregar>
  );
}

export default function CalendarizacionMensual() {
  const { setSidebar5Ancho, setPanelControlActivo, mostrarFormularioCalendario, setMostrarFormularioCalendario } = useUI();
  const { FECHAS_SESIONES, sesionActivaFecha, cargarSesion, agregarSesiones } = useProyecto();
  const [mes, setMes] = useState(mesActualISO);
  const [fechasSeleccionadas, setFechasSeleccionadas] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSidebar5Ancho(true);
    return () => setSidebar5Ancho(false);
  }, [setSidebar5Ancho]);

  useLayoutEffect(() => {
    setMostrarFormularioCalendario(FECHAS_SESIONES.length === 0);
  }, []);

  function cambiarMes(delta) {
    const [anio, mesNum] = mes.split('-').map(Number);
    let nuevoMes = mesNum + delta;
    let nuevoAnio = anio;
    if (nuevoMes < 1) { nuevoMes = 12; nuevoAnio--; }
    if (nuevoMes > 12) { nuevoMes = 1; nuevoAnio++; }
    setMes(`${nuevoAnio}-${String(nuevoMes).padStart(2, '0')}`);
  }

  function alternarFecha(fecha) {
    setFechasSeleccionadas((prev) =>
      prev.includes(fecha) ? prev.filter((f) => f !== fecha) : [...prev, fecha]
    );
  }

  async function agregar() {
    if (fechasSeleccionadas.length === 0 || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await agregarSesiones(fechasSeleccionadas);
      setFechasSeleccionadas([]);
      setMostrarFormularioCalendario(false);
    } catch (e) {
      setError(e.mensaje || 'No se pudieron agregar las sesiones.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ margin: '16px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ alignSelf: 'flex-start' }}>
        <BotonS onClick={() => setPanelControlActivo(null)}>Volver</BotonS>
      </div>

      {mostrarFormularioCalendario ? (
        <>
          <CalendarioMes
            mes={mes}
            onCambiarMes={cambiarMes}
            fechasSeleccionadas={fechasSeleccionadas}
            onSeleccionarFecha={alternarFecha}
            diasOcupados={FECHAS_SESIONES.map((f) => f.id)}
          />
          {error && <p style={{ color: '#e57373', fontSize: '12.5px', margin: 0 }}>{error}</p>}
          <BotonS onClick={agregar} disabled={enviando}>Agregar{fechasSeleccionadas.length > 0 ? ` (${fechasSeleccionadas.length})` : ''}</BotonS>
        </>
      ) : (
        <>
          <p style={{ color: '#aaa', fontSize: '12.5px', margin: 0 }}>Sesiones: {FECHAS_SESIONES.length}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FECHAS_SESIONES.map((f) => (
              <CardS
                key={f.id}
                estado={f.estado}
                titulo={encabezadoSesion(f).titulo}
                subtitulo={f.label}
                estadoLabel={f.id === sesionActivaFecha ? 'Activa' : ESTADO_LABEL[f.estado]}
                onClick={() => cargarSesion(f.id)}
                onEliminar={() => {}}
                eliminarDeshabilitado
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
