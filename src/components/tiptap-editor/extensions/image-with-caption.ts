'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ImageWithCaptionComponent from './image-with-caption-component'

export interface ImageWithCaptionOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageWithCaption: {
      /**
       * Insertar una imagen con descripción
       */
      setImageWithCaption: (options: { src: string; alt?: string; title?: string; caption?: string }) => ReturnType
    }
  }
}

export const ImageWithCaption = Node.create<ImageWithCaptionOptions>({
  name: 'imageWithCaption',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  content: '',

  draggable: true,

  isolating: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => {
          const img = element.querySelector('img')
          return img?.getAttribute('src')
        },
        renderHTML: attributes => {
          // Importante: retornar el src para que se incluya en el HTML serializado
          if (!attributes.src) {
            console.warn('[ImageWithCaption] renderHTML: src es null o undefined')
            return {}
          }
          console.log('[ImageWithCaption] renderHTML: incluyendo src en HTML:', attributes.src.substring(0, 50))
          return {
            src: attributes.src
          }
        },
      },
      alt: {
        default: null,
        parseHTML: element => {
          const img = element.querySelector('img')
          return img?.getAttribute('alt')
        },
      },
      title: {
        default: null,
        parseHTML: element => {
          const img = element.querySelector('img')
          return img?.getAttribute('title')
        },
      },
      caption: {
        default: null,
        parseHTML: element => {
          const figcaption = element.querySelector('figcaption')
          return figcaption?.textContent || null
        },
      },
      width: {
        default: null,
        parseHTML: element => {
          const img = element.querySelector('img')
          return img?.getAttribute('width')
        },
      },
      height: {
        default: null,
        parseHTML: element => {
          const img = element.querySelector('img')
          return img?.getAttribute('height')
        },
      },
      textAlign: {
        default: 'left',
        parseHTML: element => {
          return element.style.textAlign || 'left'
        },
        renderHTML: attributes => {
          // Importante: retornar textAlign para que se incluya en el style del HTML serializado
          if (!attributes.textAlign) {
            return {}
          }
          console.log('[ImageWithCaption] renderHTML: incluyendo textAlign:', attributes.textAlign)
          return {
            style: `text-align: ${attributes.textAlign}`
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image-with-caption"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, title, caption, width, height, textAlign } = HTMLAttributes

    const figureAttrs = mergeAttributes(this.options.HTMLAttributes, {
      'data-type': 'image-with-caption',
      class: 'image-with-caption-figure',
      style: textAlign ? `text-align: ${textAlign}` : undefined,
    })

    const imgAttrs = {
      src,
      alt: alt || '',
      title: title || '',
      class: 'editor-image',
      ...(width && { width }),
      ...(height && { height }),
    }

    if (caption) {
      return [
        'figure',
        figureAttrs,
        ['img', imgAttrs],
        ['figcaption', { class: 'image-caption' }, caption],
      ]
    }

    return [
      'figure',
      figureAttrs,
      ['img', imgAttrs],
    ]
  },

  addCommands() {
    return {
      setImageWithCaption:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageWithCaptionComponent)
  },
})

export default ImageWithCaption
