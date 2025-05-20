'use client'

// Este archivo ahora simplemente reexporta el componente modular
import TiptapEditor from './tiptap-editor'
import { processEditorContent } from './tiptap-editor/processImages'
import { imageCache } from './tiptap-editor/ImageCache'

export { processEditorContent, imageCache }
export default TiptapEditor