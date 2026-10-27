import '../../styles/base/CampoTexto.css';

export default function CampoTexto({ value, onChange, onEnter, placeholder, disabled, ariaLabel }) {
  return (
    <input
      type="text"
      className="base-campo-texto"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel ?? placeholder}
      onChange={(e) => onChange && onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onEnter) {
          e.preventDefault();
          onEnter();
        }
      }}
    />
  );
}
