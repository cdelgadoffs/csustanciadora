import '../../styles/base/TextoConFormato.css';

export default function TextoConFormato({ parrafos = [] }) {
  return (
    <span className="base-texto-formato">
      {parrafos.map((partes, i) => (
        <span key={i} className={'base-texto-formato-linea' + (partes[0]?.vineta ? ' base-texto-formato-linea-vineta' : '')}>
          {partes.map((p, j) => (
            <span
              key={j}
              className={
                (p.vineta ? ' base-texto-formato-vineta' : '') +
                (p.negrita ? ' base-texto-formato-negrita' : '') +
                (p.cursiva ? ' base-texto-formato-cursiva' : '') +
                (p.subrayado ? ' base-texto-formato-subrayado' : '')
              }
            >
              {p.texto}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
