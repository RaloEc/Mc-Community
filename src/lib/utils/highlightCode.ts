'use client'

import { common, createLowlight } from 'lowlight'

// Crear instancia de lowlight con lenguajes comunes
const lowlight = createLowlight(common)

/**
 * Procesa el HTML para aplicar resaltado de sintaxis a los bloques de código
 * @param html - El HTML a procesar
 * @returns El HTML procesado con resaltado de sintaxis
 */
export function highlightCodeBlocks(html: string): string {
  if (typeof window === 'undefined') {
    // En el servidor, devolver el HTML sin procesar
    return html
  }

  // Crear un elemento temporal para parsear el HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  // Buscar todos los bloques de código (con o sin clase específica)
  const codeBlocks = tempDiv.querySelectorAll('pre code')

  codeBlocks.forEach((codeBlock) => {
    const code = codeBlock.textContent || ''
    
    try {
      // Evitar reprocesar si ya contiene clases de lowlight/highlight.js
      if (codeBlock.querySelector('[class^="hljs-"]')) {
        return
      }

      // Intentar obtener el lenguaje desde atributos/clases
      const pre = codeBlock.closest('pre')
      const classList = Array.from(codeBlock.classList)
      const langClass = classList.find(c => c.startsWith('language-'))
      const attrLang = (codeBlock.getAttribute('data-language') || pre?.getAttribute('data-language') || '').toString()
      const explicitLang = (langClass ? langClass.replace('language-', '') : attrLang || undefined) as string | undefined

      let result: any
      if (explicitLang && lowlight.listLanguages().includes(explicitLang)) {
        result = lowlight.highlight(explicitLang, code)
      } else {
        result = lowlight.highlightAuto(code)
      }

      // El árbol devuelto es un Root con children; renderizamos el root
      const tree = result || null
      let highlightedHtml = tree ? toHtml(tree) : ''

      // Si no generó tokens (sin 'hljs-'), intentar con 'javascript' como fallback
      if (!/hljs-/.test(highlightedHtml)) {
        try {
          const jsResult = lowlight.highlight('javascript', code)
          highlightedHtml = toHtml(jsResult)
          if (explicitLang == null) {
            codeBlock.classList.add('language-javascript')
          }
        } catch {}
      }

      // Si no obtuvimos HTML (por algún motivo), dejamos el texto original escapado
      codeBlock.innerHTML = highlightedHtml && highlightedHtml.trim().length > 0
        ? highlightedHtml
        : escapeHtml(code)

      // Asegurar que el <pre> padre tenga la clase para estilos globales
      if (pre && !pre.classList.contains('editor-code-block')) {
        pre.classList.add('editor-code-block')
      }

      // Añadir clases a <code> para compatibilidad con estilos (hljs + language-*)
      if (!codeBlock.classList.contains('hljs')) {
        codeBlock.classList.add('hljs')
      }
      if (result && result.language) {
        const langClass = `language-${result.language}`
        if (!codeBlock.classList.contains(langClass)) {
          codeBlock.classList.add(langClass)
        }
      }
    } catch (error) {
      console.error('Error al resaltar código:', error)
      // Si hay un error, mantener el código sin resaltar
    }
  })

  return tempDiv.innerHTML
}

/**
 * Convierte el resultado de lowlight a HTML
 * @param node - El nodo de lowlight
 * @returns El HTML generado
 */
function toHtml(node: any): string {
  if (typeof node === 'string') {
    return escapeHtml(node)
  }

  if (Array.isArray(node)) {
    return node.map(toHtml).join('')
  }

  // Root de lowlight (hast Root)
  if (node && node.type === 'root' && Array.isArray(node.children)) {
    return node.children.map(toHtml).join('')
  }

  if (node.type === 'element') {
    const className = node.properties?.className
      ? ` class="${node.properties.className.join(' ')}"`
      : ''
    const children = node.children ? node.children.map(toHtml).join('') : ''
    return `<${node.tagName}${className}>${children}</${node.tagName}>`
  }

  if (node.type === 'text') {
    return escapeHtml(node.value)
  }

  return ''
}

/**
 * Escapa caracteres HTML especiales
 * @param text - El texto a escapar
 * @returns El texto escapado
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}
