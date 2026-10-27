import '../../styles/base/BadgeDinamico.css';

export default function BadgeDinamico({ texto, icono, tono = 'gris', title, onClick, onEditar, onEliminar }) {
  const contenido = (
    <>
      {icono && <i className={icono}></i>}
      <span className="base-badge-dinamico-texto">{texto}</span>
    </>
  );
  return (
    <span className={`base-badge-dinamico base-badge-dinamico-${tono}`} title={title ?? texto}>
      {onClick ? (
        <button type="button" className="base-badge-dinamico-boton" onClick={onClick}>{contenido}</button>
      ) : contenido}
      {onEditar && (
        <button type="button" className="base-badge-dinamico-editar" aria-label={`Editar ${title ?? texto}`} onClick={onEditar}>
          <i className="ri-pencil-line"></i>
        </button>
      )}
      {onEliminar && (
        <button type="button" className="base-badge-dinamico-quitar" aria-label={`Quitar ${title ?? texto}`} onClick={onEliminar}>✕</button>
      )}
    </span>
  );
}
