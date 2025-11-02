'use client'

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeBlockProps {
  language?: string
  value: string
  className?: string
}

/**
 * Componente para mostrar bloques de código con syntax highlighting
 * Usa react-syntax-highlighter con el tema atomDark de Prism
 * 
 * @param language - Lenguaje de programación (javascript, typescript, python, etc.)
 * @param value - Código a mostrar
 * @param className - Clases CSS adicionales
 */
export function CodeBlock({ language = 'javascript', value, className = '' }: CodeBlockProps) {
  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <SyntaxHighlighter
        language={language}
        style={atomDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          borderRadius: '0.5rem',
          backgroundColor: '#1e1e1e',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        wrapLines={true}
        wrapLongLines={true}
        showLineNumbers={false}
        codeTagProps={{
          style: {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '0.875rem',
          },
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
}
