import { useProyecto } from '../../context/ProyectoContext.jsx';
import { contarPuntos } from '../../utils/puntos.js';

export default function ConteoPuntosSesion() {
  const { PUNTOS } = useProyecto();
  const total = contarPuntos(PUNTOS);
  return <>{total} {total === 1 ? 'punto' : 'puntos'}</>;
}
