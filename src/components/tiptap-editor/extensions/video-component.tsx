'use client'

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { VideoPlayer } from '@/components/video/VideoPlayer'

export function VideoNodeComponent({ node, selected }: NodeViewProps) {
  const videoId = (node?.attrs?.videoId as string | null) ?? null

  return (
    <NodeViewWrapper
      className={`video-node-wrapper my-4 rounded-lg overflow-hidden ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
    >
      {videoId ? (
        <VideoPlayer videoId={videoId} className="w-full" />
      ) : (
        <div className="flex items-center justify-center bg-muted aspect-video">
          <span className="text-sm text-muted-foreground">
            Video no disponible
          </span>
        </div>
      )}
    </NodeViewWrapper>
  )
}
