import Topbar from '../components/widgets/Topbar.jsx';
import Sidebar1 from '../components/base/Sidebar1.jsx';
import Sidebar2 from '../components/base/Sidebar2.jsx';
import Sidebar3 from '../components/base/Sidebar3.jsx';
import Sidebar5 from '../components/base/Sidebar5.jsx';
import PanelPrincipal from '../components/base/PanelPrincipal.jsx';
import BotonMarcarTodos from '../components/widgets/BotonMarcarTodos.jsx';
import VisorArchivo from '../components/widgets/VisorArchivo.jsx';
import FormularioPunto from '../components/widgets/FormularioPunto.jsx';
import ListaPuntosSesion from '../components/widgets/ListaPuntosSesion.jsx';
import PuntoSesion from '../components/widgets/PuntoSesion.jsx';
import MenuPrincipalSesion from '../components/widgets/MenuPrincipalSesion.jsx';
import MenuPanelControl, { AccionesHeaderPanelControl } from '../components/widgets/MenuPanelControl.jsx';
import HoraTermino from '../components/widgets/HoraTermino.jsx';
import BotonDescargar from '../components/widgets/BotonDescargar.jsx';
import ConteoPuntosSesion from '../components/widgets/ConteoPuntosSesion.jsx';
import { useUI, ANCHO_SIDEBAR2, ANCHO_SIDEBAR3 } from '../context/UIContext.jsx';
import { useProyecto } from '../context/ProyectoContext.jsx';
import { encabezadoSesion } from '../utils/sesiones.js';
import { tituloFormularioPunto } from '../utils/puntos.js';

const ANCHO_SIDEBAR1_SESION = 340;

export default function Sesion() {
  const {
    izquierdaSidebar1,
    sidebar3Abierto, cerrarSidebar3, puntoEnEdicionId, seccionNuevoPunto,
    sidebar5Abierto, cerrarSidebar5,
    sidebar5Ancho,
  } = useUI();
  const { sesionSeleccionada, listaCerrada, SECCIONES_DOCUMENTO } = useProyecto();
  const sesionActual = encabezadoSesion(sesionSeleccionada);
  const izquierdaSidebar2 = izquierdaSidebar1 + ANCHO_SIDEBAR1_SESION;
  const izquierdaSidebar3 = izquierdaSidebar2 + ANCHO_SIDEBAR2;
  const panelIzquierda = izquierdaSidebar3 + (sidebar3Abierto ? ANCHO_SIDEBAR3 : 0);

  return (
    <>
      <Topbar />
      <Sidebar1
        izquierda={izquierdaSidebar1}
        ancho={ANCHO_SIDEBAR1_SESION}
        titulo={sesionActual.titulo}
        subtitulo={sesionActual.subtitulo}
        pie={sesionSeleccionada && listaCerrada ? <BotonDescargar documento="acta" /> : null}
      >
        <MenuPrincipalSesion />
        <HoraTermino />
      </Sidebar1>
      <Sidebar2
        izquierda={izquierdaSidebar2}
        badge="Sesión en curso"
        subtitulo={<ConteoPuntosSesion />}
        mostrarCerrar={false}
        accionesHeader={<BotonMarcarTodos />}
      >
        <ListaPuntosSesion />
      </Sidebar2>
      <Sidebar3
        abierto={sidebar3Abierto}
        izquierda={izquierdaSidebar3}
        badge={tituloFormularioPunto(SECCIONES_DOCUMENTO, seccionNuevoPunto, !!puntoEnEdicionId)}
        onCerrar={cerrarSidebar3}
      >
        <FormularioPunto />
      </Sidebar3>
      <Sidebar5
        abierto={sidebar5Abierto}
        ancho={sidebar5Ancho}
        accionesHeader={<AccionesHeaderPanelControl />}
        onCerrar={cerrarSidebar5}
      >
        <MenuPanelControl />
      </Sidebar5>
      <PanelPrincipal izquierda={panelIzquierda}>
        <PuntoSesion />
      </PanelPrincipal>
      <VisorArchivo />
    </>
  );
}
