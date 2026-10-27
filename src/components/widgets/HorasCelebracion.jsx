import { useState } from 'react';
import Card from '../base/Card.jsx';
import CampoHora from '../base/CampoHora.jsx';
import Modal from '../base/Modal.jsx';
import BotonS from '../base/BotonS.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import '../../styles/widgets/HorasCelebracion.css';

export default function HorasCelebracion() {
  const { sesionSeleccionada, sesionFinalizada, listaCerrada, programarHora } = useProyecto();
  const [error, setError] = useState(null);
  const editable = !!sesionSeleccionada && !sesionFinalizada && !listaCerrada;

  async function cambiar(hhmm) {
    try {
      await programarHora(hhmm);
    } catch (e) {
      setError(e.mensaje || 'No se pudo guardar la hora.');
    }
  }

  return (
    <div className="widget-horas-celebracion">
      <Card>
        <div className="widget-horas-celebracion-fila">
          <span className="widget-horas-celebracion-etiqueta">Hora de inicio</span>
          <CampoHora
            value={sesionSeleccionada?.horaProgramada ?? ''}
            onChange={cambiar}
            tono="verde"
            ariaLabel="Hora de inicio"
            disabled={!editable}
          />
        </div>
        {listaCerrada && !sesionFinalizada && (
          <p className="widget-horas-celebracion-aviso">Abre la lista para cambiar la hora de inicio.</p>
        )}
      </Card>
      <Modal abierto={!!error} titulo="Hora de inicio" onCerrar={() => setError(null)}>
        <p className="widget-horas-celebracion-mensaje">{error}</p>
        <div className="widget-horas-celebracion-acciones">
          <BotonS variant="claro" onClick={() => setError(null)}>Cerrar</BotonS>
        </div>
      </Modal>
    </div>
  );
}
