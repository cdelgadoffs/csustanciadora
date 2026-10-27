import { Fragment } from 'react';
import '../../styles/base/TextoConFormato.css';

export default function TextoConFormato({ parrafos = [] }) {
  return (
    <span className="base-texto-formato">
      {parrafos.map((partes, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {partes.map((p, j) => (
            <span
              key={j}
              className={
                (p.negrita ? ' base-texto-formato-negrita' : '') +
                (p.cursiva ? ' base-texto-formato-cursiva' : '') +
                (p.subrayado ? ' base-texto-formato-subrayado' : '')
              }
            >
              {p.texto}
            </span>
          ))}
        </Fragment>
      ))}
    </span>
  );
}
