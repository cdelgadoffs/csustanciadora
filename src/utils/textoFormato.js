export function docDesdeTexto(texto) {
  const lineas = String(texto || '').split('\n');
  return { type: 'doc', content: lineas.map((l) => (l ? { type: 'paragraph', content: [{ type: 'text', text: l }] } : { type: 'paragraph' })) };
}

export function textoDeDoc(doc) {
  if (!doc?.content) return '';
  return doc.content
    .map((p) => (p.content || []).map((n) => (n.type === 'hardBreak' ? '\n' : n.text || '')).join(''))
    .join('\n')
    .trim();
}

export function partesConFormato(doc) {
  const parrafos = [];
  (doc?.content || []).forEach((p) => {
    let actual = [];
    (p.content || []).forEach((n) => {
      if (n.type === 'hardBreak') {
        parrafos.push(actual);
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
    parrafos.push(actual);
  });
  while (parrafos.length && parrafos[parrafos.length - 1].every((r) => !r.texto.trim())) parrafos.pop();
  while (parrafos.length && parrafos[0].every((r) => !r.texto.trim())) parrafos.shift();
  return parrafos;
}
