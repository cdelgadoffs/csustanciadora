import '../../styles/base/BotonIcono.css';

export default function BotonIcono({ icono, onClick, ariaLabel, disabled, activo, sinRobarFoco = false }) {
  return (
    <button
      type="button"
      className={'base-boton-icono' + (activo ? ' base-boton-icono-activo' : '')}
      onClick={onClick}
      onMouseDown={sinRobarFoco ? (e) => e.preventDefault() : undefined}
      aria-label={ariaLabel}
      aria-pressed={activo === undefined ? undefined : !!activo}
      title={ariaLabel}
      disabled={disabled}
    >
      <i className={icono}></i>
    </button>
  );
}
