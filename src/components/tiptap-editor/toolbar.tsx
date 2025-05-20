'use client'

import React from 'react'
import { Editor } from '@tiptap/react'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Upload,
  Underline as UnderlineIcon,
  Strikethrough,
  Type,
  Undo,
  Redo,
  Palette,
  Code,
  Highlighter,
  Grid,
  Table as TableIcon,
  Youtube as YoutubeIcon,
  Minus,
  TextSelect,
  Hash,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ToolbarProps {
  editor: Editor | null
  onImageClick: () => void
  onColorClick: () => void
  onHighlightColorClick: () => void
  onLinkClick: () => void
  onYoutubeClick: () => void
  onTableClick: () => void
  currentFontFamily: string
  setCurrentFontFamily: (font: string) => void
}

export const Toolbar: React.FC<ToolbarProps> = ({
  editor,
  onImageClick,
  onColorClick,
  onHighlightColorClick,
  onLinkClick,
  onYoutubeClick,
  onTableClick,
  currentFontFamily,
  setCurrentFontFamily
}) => {
  if (!editor) {
    return null
  }
  
  // Función para prevenir la acción por defecto y aplicar el estilo
  const applyStyle = (styleFunction: () => void, e: React.MouseEvent) => {
    e.preventDefault();  // Prevenir el envío del formulario
    e.stopPropagation(); // Detener la propagación del evento
    styleFunction();     // Aplicar el estilo
  };
  
  // Funciones para los botones que reciben eventos externos
  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onImageClick();
  };
  
  const handleColorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onColorClick();
  };
  
  const handleHighlightColorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onHighlightColorClick();
  };
  
  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLinkClick();
  };
  
  const handleYoutubeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onYoutubeClick();
  };
  
  const handleTableClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTableClick();
  };

  const fontFamilies = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open Sans', value: 'Open Sans, sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
    { name: 'Minecraft', value: 'Minecraft, sans-serif' }
  ]

  return (
    <div className="tiptap-toolbar">
      {/* Botones de herramientas en una sola fila horizontal */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().undo().run(), e)}
        disabled={!editor.can().undo()}
        title="Deshacer"
        type="button"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().redo().run(), e)}
        disabled={!editor.can().redo()}
        title="Rehacer"
        type="button"
      >
        <Redo className="h-4 w-4" />
      </Button>
      
      <div className="toolbar-separator"></div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().toggleBold().run(), e)}
        className={editor.isActive('bold') ? 'is-active' : ''}
        title="Negrita"
        type="button"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().toggleItalic().run(), e)}
        className={editor.isActive('italic') ? 'is-active' : ''}
        title="Cursiva"
        type="button"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().toggleUnderline().run(), e)}
        className={editor.isActive('underline') ? 'is-active' : ''}
        title="Subrayado"
        type="button"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().toggleStrike().run(), e)}
        className={editor.isActive('strike') ? 'is-active' : ''}
        title="Tachado"
        type="button"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      
      <div className="toolbar-separator"></div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={handleImageClick}
        title="Imagen"
        type="button"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleYoutubeClick}
        title="YouTube"
        type="button"
      >
        <YoutubeIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLinkClick}
        className={editor.isActive('link') ? 'is-active' : ''}
        title="Enlace"
        type="button"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      
      <div className="toolbar-separator"></div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().toggleCodeBlock().run(), e)}
        className={editor.isActive('codeBlock') ? 'is-active' : ''}
        title="Bloque de código"
        type="button"
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleTableClick}
        title="Tabla"
        type="button"
      >
        <TableIcon className="h-4 w-4" />
      </Button>
      
      <div className="toolbar-separator"></div>
      
      {/* Botones de alineación de texto */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().setTextAlign('left').run(), e)}
        className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
        title="Alinear a la izquierda"
        type="button"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().setTextAlign('center').run(), e)}
        className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
        title="Centrar"
        type="button"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().setTextAlign('right').run(), e)}
        className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
        title="Alinear a la derecha"
        type="button"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().setTextAlign('justify').run(), e)}
        className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}
        title="Justificar"
        type="button"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>
    </div>
  )
}

export const BubbleToolbar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  if (!editor) {
    return null
  }

  // Función para prevenir la acción por defecto y aplicar el estilo
  const applyStyle = (styleFunction: () => void, e: React.MouseEvent) => {
    e.preventDefault();  // Prevenir el envío del formulario
    e.stopPropagation(); // Detener la propagación del evento
    styleFunction();     // Aplicar el estilo
  };

  return (
    <div className="bubble-menu">
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().toggleBold().run(), e)}
        className={editor.isActive('bold') ? 'is-active' : ''}
        type="button" // Especificar explícitamente que es un botón, no un submit
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().toggleItalic().run(), e)}
        className={editor.isActive('italic') ? 'is-active' : ''}
        type="button"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().toggleUnderline().run(), e)}
        className={editor.isActive('underline') ? 'is-active' : ''}
        type="button"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().toggleStrike().run(), e)}
        className={editor.isActive('strike') ? 'is-active' : ''}
        type="button"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
    </div>
  )
}

export const FloatingToolbar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  if (!editor) {
    return null
  }

  // Función para prevenir la acción por defecto y aplicar el estilo
  const applyStyle = (styleFunction: () => void, e: React.MouseEvent) => {
    e.preventDefault();  // Prevenir el envío del formulario
    e.stopPropagation(); // Detener la propagación del evento
    styleFunction();     // Aplicar el estilo
  };

  return (
    <div className="floating-menu">
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), e)}
        type="button"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), e)}
        type="button"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().toggleBulletList().run(), e)}
        type="button"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().toggleOrderedList().run(), e)}
        type="button"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => applyStyle(() => editor.chain().focus().toggleCodeBlock().run(), e)}
        type="button"
      >
        <Code className="h-4 w-4" />
      </Button>
    </div>
  )
}
