const VINETA = '• ';

export function docDesdeTexto(texto) {
  const lineas = String(texto || '').split('\n');
  return { type: 'doc', content: lineas.map((l) => (l ? { type: 'paragraph', content: [{ type: 'text', text: l }] } : { type: 'paragraph' })) };
}

function textoDeParrafo(p) {
  return (p.content || []).map((n) => (n.type === 'hardBreak' ? '\n' : n.text || '')).join('');
}

export function textoDeDoc(doc) {
  if (!doc?.content) return '';
  return doc.content
    .flatMap((b) => (b.type === 'bulletList'
      ? (b.content || []).map((item) => `${VINETA}${(item.content || []).map(textoDeParrafo).join('\n')}`)
      : [textoDeParrafo(b)]))
    .join('\n')
    .trim();
}

function lineasDeParrafo(p) {
  const lineas = [];
  let actual = [];
  (p.content || []).forEach((n) => {
    if (n.type === 'hardBreak') {
      lineas.push(actual);
      actual = [];
      return;
    }
    const marcas = (n.marks || []).map((m) => m.type);
    actual.push({
      texto: n.text || '',
      negrita: marcas.includes('bold'),
      cursiva: marcas.includes('italic'),
      subrayado: marcas.includes('underline'),
    });
  });
  lineas.push(actual);
  return lineas;
}

export function partesConFormato(doc) {
  const parrafos = [];
  (doc?.content || []).forEach((bloque) => {
    if (bloque.type !== 'bulletList') {
      parrafos.push(...lineasDeParrafo(bloque));
      return;
    }
    (bloque.content || []).forEach((item) => {
      (item.content || []).flatMap(lineasDeParrafo).forEach((linea, i) => {
        parrafos.push(i === 0 ? [{ texto: VINETA, vineta: true }, ...linea] : linea);
      });
    });
  });
  const vacia = (linea) => linea.every((r) => r.vineta || !r.texto.trim());
  while (parrafos.length && vacia(parrafos[parrafos.length - 1])) parrafos.pop();
  while (parrafos.length && vacia(parrafos[0])) parrafos.shift();
  return parrafos;
}
