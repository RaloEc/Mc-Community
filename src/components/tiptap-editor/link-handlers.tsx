// Funciones para manejar enlaces en el editor Tiptap

// Función para abrir el diálogo de enlaces
export const createHandleOpenLinkDialog = (editor, setLinkText, setLinkUrl, setLinkTarget, setLinkDialogOpen) => {
  return () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");

    setLinkText(text);
    setLinkUrl("");
    setLinkTarget("_blank");
    setLinkDialogOpen(true);
  };
};

// Función para guardar enlaces
export const createHandleSaveLink = (editor, linkUrl, linkTarget, linkText, setLinkDialogOpen) => {
  return () => {
    if (!editor) return;

    if (linkUrl) {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, ' ');
      
      // Si hay texto seleccionado, validar que no contenga espacios
      if (from !== to) {
        if (selectedText.includes(' ')) {
          alert('El texto seleccionado no puede contener espacios para convertirlo en enlace');
          return;
        }
        
        // Si hay texto seleccionado, convertirlo en enlace
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: linkUrl, target: linkTarget })
          .run();
      } else {
        // Si no hay texto seleccionado, insertar nuevo contenido con el texto del campo
        const textoParaEnlace = linkText.trim() !== '' ? linkText : linkUrl;
        
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'text',
            text: textoParaEnlace,
            marks: [
              {
                type: 'link',
                attrs: {
                  href: linkUrl,
                  target: linkTarget
                }
              }
            ]
          })
          .run();
      }
      
      // Mover el cursor al final del enlace y deseleccionar
      editor
        .chain()
        .focus()
        .setTextSelection(to)
        .run();

      setLinkDialogOpen(false);
    }
  };
};
