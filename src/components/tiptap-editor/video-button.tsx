'use client'

import { useCallback, useState } from 'react'
import { useEditor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VideoUploader } from '@/components/video/VideoUploader'
import { Film } from 'lucide-react'
import { useSessionQuery } from '@/hooks/useAuthQuery'

interface VideoButtonProps {
  editor: ReturnType<typeof useEditor> | null
}

export function VideoButton({ editor }: VideoButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSessionQuery()
  const [error, setError] = useState<string | null>(null)
  const user = session?.user

  const handleVideoUploaded = useCallback(
    (videoId: string) => {
      if (!editor) return

      console.log(`[VideoButton] Insertando video: ${videoId}`)

      // Insertar el nodo de video en el editor
      editor.commands.insertVideo(videoId)

      setIsOpen(false)
      setError(null)
    },
    [editor]
  )

  if (!user) {
    return null
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        title="Insertar video"
        className="gap-2"
      >
        <Film className="w-4 h-4" />
        <span className="hidden sm:inline">Video</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subir Video</DialogTitle>
            <DialogDescription>
              Sube un video que será convertido automáticamente a WebM (VP9) para optimizar el
              tamaño y la compatibilidad.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <VideoUploader
              userId={user.id}
              onVideoUploaded={handleVideoUploaded}
              onError={setError}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
