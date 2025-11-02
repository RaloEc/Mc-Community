'use client'

import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

/**
 * NodeView React para bloques de código TipTap usando react-syntax-highlighter
 */
export function CodeBlockComponent({ node, extension }: NodeViewProps) {
  const language = node.attrs.language || extension.options.defaultLanguage || 'javascript'
  const code = node.textContent || ' '

  return (
    <NodeViewWrapper className="code-block-node">
      <div className="code-block-highlight" aria-hidden>
        <SyntaxHighlighter
          language={language}
          style={atomDark}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            background: 'transparent',
            borderRadius: 'inherit',
            border: 'none',
          }}
          codeTagProps={{
            style: {
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: '0.875rem',
            },
          }}
          wrapLines
          wrapLongLines
          showLineNumbers={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>

      <pre className="code-block-editor-layer" spellCheck={false}>
        <NodeViewContent as="code" className="code-block-editor-content" />
      </pre>
    </NodeViewWrapper>
  )
}
