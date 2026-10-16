import BuscadorGlobal from '../base/BuscadorGlobal.jsx';
import FechaDia from '../base/FechaDia.jsx';
import BotonS from '../base/BotonS.jsx';
import BotonExpandible from '../base/BotonExpandible.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAjustesVisuales } from '../../context/AjustesVisualesContext.jsx';
import { NIVELES_BRILLO } from '../../utils/brillo.js';
import '../../styles/widgets/Topbar.css';

const PREFIJO_BRILLO = 'brillo:';

export default function Topbar({ opcionesConfiguracion = [], onSeleccionarConfiguracion }) {
  const { toggleSidebar5, terminoBusqueda, setTerminoBusqueda } = useUI();
  const { cerrarSesion } = useAuth();
  const { brilloPantalla, cambiarAjuste } = useAjustesVisuales();
  const opcionesBrillo = NIVELES_BRILLO.map((nivel) => ({
    id: `${PREFIJO_BRILLO}${nivel}`,
    label: nivel === 0 ? 'Normal' : `Atenuado ${nivel} %`,
    grupo: 'Brillo de la pantalla',
    icono: nivel === brilloPantalla ? 'ri-radio-button-line' : 'ri-checkbox-blank-circle-line',
  }));

  function seleccionarConfiguracion(id) {
    if (id.startsWith(PREFIJO_BRILLO)) cambiarAjuste('brilloPantalla', Number(id.slice(PREFIJO_BRILLO.length)));
    else if (onSeleccionarConfiguracion) onSeleccionarConfiguracion(id);
  }

  return (
    <header className="widget-topbar">
      <div className="widget-topbar-left">
        <button type="button" className="widget-topbar-menu" aria-label="Alternar panel" onClick={toggleSidebar5}>☰</button>
        <img
          className="widget-topbar-logo"
          src="https://raw.githubusercontent.com/cdelgadoffs/CGD/535876195bedc1b602f98438ee3a42ff11cbb817/logo.png"
          alt="Logo institucional"
        />
      </div>
      <div className="widget-topbar-right">
        <BuscadorGlobal value={terminoBusqueda} onChange={setTerminoBusqueda} placeholder="Buscar punto..." />
        <FechaDia />
        <BotonS onClick={cerrarSesion}>Salir</BotonS>
        <BotonExpandible
          icono="ri-settings-3-line"
          ariaLabel="Configuración visual"
          opciones={[...opcionesConfiguracion, ...opcionesBrillo]}
          onSeleccionar={seleccionarConfiguracion}
          textoVacio="Sin configuraciones en esta vista."
        />
      </div>
    </header>
  );
}
