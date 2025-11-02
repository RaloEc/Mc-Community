'use client'

import Youtube from '@tiptap/extension-youtube'
import { ReactNodeViewRenderer } from '@tiptap/react'
import YoutubeEmbedComponent from './youtube-embed-component'

const clampDimension = (value: unknown, fallback: number) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback
  }
  return Math.round(numeric)
}

export const YoutubeEmbed = Youtube.extend({
  addAttributes() {
    const parentAttributes = this.parent?.() ?? {}

    return {
      ...parentAttributes,
      width: {
        default: 640,
        parseHTML: element => {
          const attr = element.getAttribute('data-width') ?? element.getAttribute('width')
          return clampDimension(attr, 640)
        },
        renderHTML: attributes => {
          const width = clampDimension(attributes.width, 640)
          return {
            width,
            'data-width': width,
          }
        },
      },
      height: {
        default: 360,
        parseHTML: element => {
          const attr = element.getAttribute('data-height') ?? element.getAttribute('height')
          return clampDimension(attr, 360)
        },
        renderHTML: attributes => {
          const height = clampDimension(attributes.height, 360)
          return {
            height,
            'data-height': height,
          }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(YoutubeEmbedComponent)
  },
})
