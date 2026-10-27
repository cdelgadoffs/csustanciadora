import { useEffect, useRef } from 'react';
import { useEditor, useEditorState, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import BotonIcono from '../base/BotonIcono.jsx';
import '../../styles/widgets/EditorTexto.css';

const BOTONES = [
  { marca: 'bold', icono: 'ri-bold', etiqueta: 'Negrita' },
  { marca: 'italic', icono: 'ri-italic', etiqueta: 'Cursiva' },
  { marca: 'underline', icono: 'ri-underline', etiqueta: 'Subrayado' },
];

function extensiones(placeholder) {
  return [
    StarterKit.configure({
      heading: false,
      blockquote: false,
      codeBlock: false,
      code: false,
      horizontalRule: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
      listKeymap: false,
      strike: false,
      link: false,
    }),
    Placeholder.configure({ placeholder }),
  ];
}

export default function EditorTexto({ value, onChange, placeholder, ariaLabel }) {
  const ultimoRef = useRef(JSON.stringify(value));

  const editor = useEditor({
    extensions: extensiones(placeholder),
    content: value,
    editorProps: { attributes: { class: 'widget-editor-texto-contenido', ...(ariaLabel ? { 'aria-label': ariaLabel } : null) } },
    onUpdate: ({ editor: instancia }) => {
      const json = instancia.getJSON();
      ultimoRef.current = JSON.stringify(json);
      onChange(json);
    },
  }, []);

  useEffect(() => {
    if (!editor) return;
    const clave = JSON.stringify(value);
    if (clave !== ultimoRef.current) {
      editor.commands.setContent(value, { emitUpdate: false });
      ultimoRef.current = clave;
    }
  }, [value, editor]);

  const activas = useEditorState({
    editor,
    selector: ({ editor: e }) => Object.fromEntries(BOTONES.map((b) => [b.marca, !!e?.isActive(b.marca)])),
  }) ?? {};

  return (
    <div className="widget-editor-texto">
      <div className="widget-editor-texto-barra">
        {BOTONES.map((b) => (
          <BotonIcono
            key={b.marca}
            icono={b.icono}
            ariaLabel={b.etiqueta}
            activo={activas[b.marca]}
            sinRobarFoco
            onClick={() => editor?.chain().focus().toggleMark(b.marca).run()}
          />
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
