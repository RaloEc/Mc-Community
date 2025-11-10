'use client'

interface VideoUploaderProps {
  userId: string
  onVideoUploaded: (videoId: string) => void
  onError?: (error: string) => void
}

const DISABLED_MESSAGE = 'La subida de videos está deshabilitada temporalmente.'

export function VideoUploader(_: VideoUploaderProps) {
  return (
    <div className="w-full">
      <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
        <p className="font-medium text-gray-700 dark:text-gray-200">
          {DISABLED_MESSAGE}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Estamos explorando alternativas para el procesamiento de videos.
        </p>
      </div>
    </div>
  )
}
