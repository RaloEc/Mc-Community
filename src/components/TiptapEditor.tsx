'use client'

// Este archivo ahora simplemente reexporta el componente modular
// y define las props correctas para evitar errores de tipo.

import TiptapEditor from './tiptap-editor';

export interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onImageChange?: (hasTemporaryImages: boolean) => void;
}

export default TiptapEditor