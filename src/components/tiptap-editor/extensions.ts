'use client'

import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import ImageResize from 'tiptap-extension-resize-image'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Youtube from '@tiptap/extension-youtube'
import FontFamily from '@tiptap/extension-font-family'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CharacterCount from '@tiptap/extension-character-count'
import { FloatingMenu as TiptapFloatingMenu } from '@tiptap/extension-floating-menu'
import Mention from '@tiptap/extension-mention'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import { common, createLowlight } from 'lowlight'
import { Extension } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'

// Crear instancia de lowlight con lenguajes comunes
export const lowlight = createLowlight(common)

// Función para crear reglas de pegado para enlaces
export const createLinkPasteRules = () => {
  return Extension.create({
    addPasteRules() {
      return [
        {
          find: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g,
          handler({ state, range, match }) {
            const from = range.from
            const to = range.to
            const url = match[0]
            
            // Verificar si la URL es segura
            if (!isAllowedUri(url)) {
              return false
            }
            
            // Insertar enlace
            const transaction = state.tr.replaceWith(
              from, 
              to, 
              state.schema.text(url)
            )
            
            // Seleccionar el texto
            transaction.setSelection(
              new NodeSelection(transaction.doc.resolve(from))
            )
            
            return true
          }
        }
      ]
    }
  })
}

// Función para validar URLs
export const isAllowedUri = (url: string, ctx?: any) => {
  // Lista de dominios permitidos
  const allowedDomains = [
    'minecraft.net',
    'mojang.com',
    'curseforge.com',
    'spigotmc.org',
    'bukkit.org',
    'github.com',
    'youtube.com',
    'youtu.be',
    'imgur.com',
    'discord.com',
    'discord.gg',
    'twitter.com',
    'facebook.com',
    'instagram.com',
    'reddit.com',
    'planetminecraft.com',
    'minecraftforum.net',
    'twitch.tv',
    'modrinth.com',
    'mcpedl.com',
    'minecraft-heads.com',
    'minecraftskins.com',
    'namemc.com',
    'minecraft-maps.com',
  ]
  
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.replace(/^www\./, '')
    
    // Verificar si el dominio está en la lista de permitidos
    return allowedDomains.some(allowed => domain === allowed || domain.endsWith(`.${allowed}`))
  } catch (e) {
    return false
  }
}

// Función para crear sugerencias de menciones
export const createMentionSuggestions = (suggestions: string[]) => {
  return {
    items: ({ query }: { query: string }) => {
      return suggestions
        .filter(item => item.toLowerCase().startsWith(query.toLowerCase()))
        .slice(0, 5)
    },
    render: () => {
      let component: any
      let popup: HTMLElement | null = null
      
      return {
        onStart: (props: any) => {
          if (!props.clientRect) {
            return
          }
          
          popup = document.createElement('div')
          popup.classList.add('mention-popup')
          document.body.appendChild(popup)
          
          popup.style.position = 'absolute'
          popup.style.left = `${props.clientRect.left}px`
          popup.style.top = `${props.clientRect.top + 24}px`
          
          component = {
            update: (items: string[]) => {
              if (popup) {
                popup.innerHTML = ''
                
                items.forEach((item, index) => {
                  const itemElement = document.createElement('div')
                  itemElement.classList.add('mention-item')
                  if (index === 0) {
                    itemElement.classList.add('selected')
                  }
                  itemElement.textContent = item
                  itemElement.addEventListener('click', () => {
                    props.command({ id: item })
                    popup?.remove()
                  })
                  popup?.appendChild(itemElement)
                })
              }
            },
            onKeyDown: (props: any) => {
              if (props.event.key === 'ArrowDown') {
                const selected = popup?.querySelector('.selected')
                const next = selected?.nextElementSibling || popup?.querySelector('.mention-item')
                if (selected) selected.classList.remove('selected')
                if (next) next.classList.add('selected')
                props.event.preventDefault()
                return true
              }
              
              if (props.event.key === 'ArrowUp') {
                const selected = popup?.querySelector('.selected')
                const prev = selected?.previousElementSibling || popup?.querySelector('.mention-item:last-child')
                if (selected) selected.classList.remove('selected')
                if (prev) prev.classList.add('selected')
                props.event.preventDefault()
                return true
              }
              
              if (props.event.key === 'Enter') {
                const selected = popup?.querySelector('.selected')
                if (selected) {
                  props.command({ id: selected.textContent })
                  popup?.remove()
                  props.event.preventDefault()
                  return true
                }
              }
              
              return false
            },
            onExit: () => {
              popup?.remove()
            },
          }
          
          return component
        },
        onUpdate: (props: any) => {
          component?.update(props.items)
          
          if (!props.clientRect) {
            return
          }
          
          if (popup) {
            popup.style.left = `${props.clientRect.left}px`
            popup.style.top = `${props.clientRect.top + 24}px`
          }
        },
        onKeyDown: (props: any) => {
          if (component) {
            return component.onKeyDown(props)
          }
          
          return false
        },
        onExit: () => {
          if (component) {
            component.onExit()
          }
          
          popup?.remove()
          popup = null
        },
      }
    },
  }
}

// Exportar configuración de extensiones por defecto
export const getDefaultExtensions = (mentionSuggestions: string[]) => [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    codeBlock: false,
    // Desactivar horizontalRule en StarterKit para evitar duplicados
    horizontalRule: false,
    // Habilitar listas
    bulletList: {
      HTMLAttributes: {
        class: 'list-disc pl-6',
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: 'list-decimal pl-6',
      },
    },
    listItem: {
      HTMLAttributes: {
        class: 'list-item',
      },
    },
  }),
  Link.configure({
    protocols: ['http', 'https', 'mailto', 'tel'],
    openOnClick: true,
    linkOnPaste: true,
    HTMLAttributes: {
      rel: 'noopener noreferrer',
      class: 'editor-link',
    },
  }),
  ImageResize.configure({
    HTMLAttributes: {
      class: 'editor-image',
    },
  }),
  Underline,
  TextStyle,
  Color,
  TextAlign.configure({
    types: ['heading', 'paragraph', 'image'],
  }),
  Highlight.configure({
    multicolor: true,
  }),
  Youtube.configure({
    width: 640,
    height: 360,
    HTMLAttributes: {
      class: 'editor-youtube resizable-video',
      'data-resizable': 'true'
    },
    // Deshabilitar controles de redimensionamiento predeterminados
    controls: false,
  }),
  FontFamily.configure({
    types: ['textStyle'],
  }),
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: 'editor-table',
    },
  }),
  TableRow,
  TableCell,
  TableHeader,
  CharacterCount,
  TiptapFloatingMenu,
  Mention.configure({
    HTMLAttributes: {
      class: 'editor-mention',
    },
    suggestion: createMentionSuggestions(mentionSuggestions),
  }),
  CodeBlockLowlight.configure({
    lowlight,
    HTMLAttributes: {
      class: 'editor-code-block',
    },
  }),
  HorizontalRule.configure({
    HTMLAttributes: {
      class: 'editor-hr',
    },
  }),
  createLinkPasteRules(),
]
