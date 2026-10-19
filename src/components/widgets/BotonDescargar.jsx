import { useState } from 'react';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { generarWordOrdenDia } from '../../utils/ordenDia.js';
import { generarWordActa } from '../../utils/actaSesion.js';
import { guardarEnDisco } from '../../utils/archivos.js';
import '../../styles/widgets/BotonDescargar.css';

const DOCUMENTOS = {
  ordenDia: { texto: 'Descargar orden del día', generar: generarWordOrdenDia },
  acta: { texto: 'Descargar acta', generar: generarWordActa },
};

export default function BotonDescargar({ documento = 'ordenDia' }) {
  const { texto, generar } = DOCUMENTOS[documento];
  const { sesionSeleccionada, PUNTOS } = useProyecto();
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState(null);

  async function descargar() {
    setGenerando(true);
    setError(null);
    try {
      const { blob, nombreArchivo } = await generar({ sesion: sesionSeleccionada, puntos: PUNTOS });
      guardarEnDisco(nombreArchivo, blob);
    } catch (e) {
      setError(`No se pudo generar el documento Word: ${e.message || 'error desconocido'}`);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="widget-boton-descargar">
      <BotonS variant="claro" onClick={descargar} disabled={generando || !sesionSeleccionada || PUNTOS.length === 0}>
        {generando ? 'Generando...' : texto}
      </BotonS>
      <Modal abierto={!!error} titulo="No se pudo descargar" onCerrar={() => setError(null)}>
        <p className="widget-boton-descargar-mensaje">{error}</p>
      </Modal>
    </div>
  );
}
