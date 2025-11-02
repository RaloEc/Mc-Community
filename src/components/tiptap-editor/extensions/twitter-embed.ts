'use client'

import { Node, mergeAttributes, nodeInputRule, nodePasteRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import TwitterEmbedComponent from './twitter-embed-component'

const TWITTER_URL_REGEX = /(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/\d+)(?:\?[^\s]*)?/i

const buildTwitterAttributes = (url: string) => ({
  twitterData: {
    url,
    html: null,
    authorName: null,
  },
})

export interface TwitterEmbedOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    twitterEmbed: {
      /**
       * Insertar un embed de Twitter/X
       */
      setTwitterEmbed: (options: { url: string; html?: string; authorName?: string }) => ReturnType
    }
  }
}

export const TwitterEmbed = Node.create<TwitterEmbedOptions>({
  name: 'twitterEmbed',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  atom: true,

  draggable: true,

  isolating: true,

  addAttributes() {
    return {
      // Atributo único que contiene todos los datos del tweet
      twitterData: {
        default: {
          url: null,
          html: null,
          authorName: null,
        },
        
        // Cómo TipTap lee el atributo DESDE el HTML (al cargar)
        parseHTML: element => {
          const data = element.getAttribute('data-twitter');
          if (data) {
            try {
              return JSON.parse(data);
            } catch (e) {
              console.error('[TwitterEmbed] Error parseando data-twitter:', e);
              return {
                url: null,
                html: null,
                authorName: null,
              };
            }
          }
          
          // Fallback para compatibilidad con tweets antiguos
          const url = element.getAttribute('data-url');
          const encodedHtml = element.getAttribute('data-html-encoded');
          let html = null;
          
          if (encodedHtml) {
            try {
              html = decodeURIComponent(escape(atob(encodedHtml)));
            } catch (e) {
              console.error('[TwitterEmbed] Error decodificando HTML:', e);
            }
          }
          
          return {
            url: url || null,
            html: html || null,
            authorName: element.getAttribute('data-author-name') || null,
          };
        },
        
        // ¡LA MÁS IMPORTANTE!
        // Cómo TipTap escribe el atributo EN el HTML (al guardar)
        renderHTML: attributes => {
          const twitterData = attributes.twitterData;
          
          if (!twitterData || !twitterData.url) {
            return {};
          }
          
          // NO re-codificar el HTML - ya está en base64 desde twitter-embed-component.tsx
          // twitterData.html ya contiene el HTML codificado en base64
          const serializedData = {
            url: twitterData.url || '',
            html: twitterData.html || '',  // Ya está en base64, no re-codificar
            authorName: twitterData.authorName || '',
          };
          
          console.log('[TwitterEmbed] renderHTML - serializando:', serializedData);
          
          return {
            'data-twitter': JSON.stringify(serializedData),
          };
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="twitter-embed"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    console.log('[TwitterEmbed] renderHTML - HTMLAttributes:', HTMLAttributes);
    
    const attrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-type': 'twitter-embed',
      class: 'twitter-embed-container',
    })

    return ['div', attrs]
  },

  addCommands() {
    return {
      setTwitterEmbed:
        (options) =>
        ({ commands }) => {
          console.log('[TwitterEmbed] setTwitterEmbed - options:', options);
          return commands.insertContent({
            type: this.name,
            attrs: {
              twitterData: {
                url: options.url || null,
                html: options.html || null,
                authorName: options.authorName || null,
              },
            },
          })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(TwitterEmbedComponent)
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: TWITTER_URL_REGEX,
        type: this.type,
        getAttributes: match => {
          const url = match?.[1] ?? match?.[0]
          if (!url) return {}
          return buildTwitterAttributes(url)
        },
      }),
    ]
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: TWITTER_URL_REGEX,
        type: this.type,
        getAttributes: match => {
          const url = match?.[1] ?? match?.[0]
          if (!url) return {}
          return buildTwitterAttributes(url)
        },
      }),
    ]
  },
})

export default TwitterEmbed
