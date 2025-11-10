import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { VideoNodeComponent } from './video-component'

export interface VideoOptions {
  HTMLAttributes: Record<string, any>
}

declare global {
  namespace ProseMirror {
    interface Nodes {
      video: {
        attrs: {
          videoId: string
        }
      }
    }
  }
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      insertVideo: (videoId: string) => ReturnType
    }
  }
}

export const Video = Node.create<VideoOptions>({
  name: 'video',

  group: 'block',

  selectable: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      videoId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-video-id'),
        renderHTML: (attributes) => ({
          'data-video-id': attributes.videoId,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="video"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'video',
        class: 'video-node',
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeComponent)
  },

  addCommands() {
    return {
      insertVideo:
        (videoId: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              videoId,
            },
          })
        },
    }
  },
})
