import { useState } from 'react';
import Card from '../base/Card.jsx';
import CampoHora from '../base/CampoHora.jsx';
import Modal from '../base/Modal.jsx';
import BotonS from '../base/BotonS.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import '../../styles/widgets/HoraTermino.css';

export default function HoraTermino() {
  const { sesionSeleccionada, programarHoraTermino } = useProyecto();
  const [error, setError] = useState(null);

  async function cambiar(hhmm) {
    try {
      await programarHoraTermino(hhmm);
    } catch (e) {
      setError(e.mensaje || 'No se pudo guardar la hora.');
    }
  }

  return (
    <div className="widget-hora-termino">
      <Card>
        <div className="widget-hora-termino-fila">
          <span className="widget-hora-termino-etiqueta">Hora de término</span>
          <CampoHora
            value={sesionSeleccionada?.horaTermino ?? ''}
            onChange={cambiar}
            tono="rojo"
            ariaLabel="Hora de término"
            disabled={!sesionSeleccionada}
          />
        </div>
      </Card>
      <Modal abierto={!!error} titulo="Hora de término" onCerrar={() => setError(null)}>
        <p className="widget-hora-termino-mensaje">{error}</p>
        <div className="widget-hora-termino-acciones">
          <BotonS variant="claro" onClick={() => setError(null)}>Cerrar</BotonS>
        </div>
      </Modal>
    </div>
  );
}
