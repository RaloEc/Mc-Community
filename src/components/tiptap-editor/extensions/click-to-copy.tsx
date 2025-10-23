'use client'

import { Mark, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { toast } from 'sonner'

export interface ClickToCopyOptions {
  HTMLAttributes: Record<string, any>
}

// Extender el tipo de comandos de Tiptap
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    clickToCopy: {
      /**
       * Alterna el formato de texto copiable
       */
      toggleClickToCopy: () => ReturnType
    }
  }
}

/**
 * Extensión personalizada de Tiptap para crear texto clickeable y copiable.
 * Usa un plugin de ProseMirror para manejar los clics de forma declarativa.
 */
export const ClickToCopy = Mark.create<ClickToCopyOptions>({
  name: 'clickToCopy',

  // Agrupar con otras marcas de formato
  group: 'code',

  // El mark es inline
  inline: true,

  // Hacer que sea exclusivo para evitar superposiciones no deseadas
  // Esto hará que no se pueda aplicar a texto ya formateado con otras marcas
  excludes: '_', // Excluye todas las demás marcas
  
  // Asegurar que el mark no se extienda más allá de la selección
  spanning: false,
  
  // No permitir que el mark se extienda a espacios en blanco
  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        // Busca cualquier span con el atributo data-click-to-copy
        tag: 'span[data-click-to-copy]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // Renderiza un <span> con el atributo y las clases para el estilo
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-click-to-copy': 'true',
        class: 'click-to-copy-text',
        title: 'Haz clic para copiar',
      }),
      0, // El '0' indica dónde debe ir el contenido del texto
    ]
  },

  addCommands() {
    return {
      toggleClickToCopy:
        () =>
        ({ commands }: any) => {
          return commands.toggleMark(this.name)
        },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('clickToCopyHandler'),
        props: {
          handleDOMEvents: {
            click: (view, event) => {
              const target = event.target as HTMLElement
              const copyableElement = target.closest('[data-click-to-copy="true"]')

              if (copyableElement) {
                event.preventDefault()
                event.stopPropagation()

                const textToCopy = (copyableElement as HTMLElement).innerText

                navigator.clipboard
                  .writeText(textToCopy)
                  .then(() => {
                    toast.success('¡Texto copiado al portapapeles!', {
                      duration: 2000,
                    })
                  })
                  .catch((err) => {
                    console.error('Error al copiar texto: ', err)
                    toast.error('No se pudo copiar el texto.')
                  })

                return true
              }

              return false
            },
          },
        },
      }),
    ]
  },
})
