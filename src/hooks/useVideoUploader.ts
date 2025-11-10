import { useState } from 'react'

interface UploadProgress {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed'
  videoId: string | null
  error: string | null
  progress: number // 0-100
}

const DISABLED_ERROR = 'La subida de videos está deshabilitada.'

export function useVideoUploader() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: 'idle',
    videoId: null,
    error: null,
    progress: 0,
  })

  const uploadVideo = async (_file: File, _userId: string): Promise<never> => {
    setUploadProgress({
      status: 'failed',
      videoId: null,
      error: DISABLED_ERROR,
      progress: 0,
    })

    throw new Error(DISABLED_ERROR)
  }

  const resetProgress = () => {
    setUploadProgress({
      status: 'idle',
      videoId: null,
      error: null,
      progress: 0,
    })
  }

  return {
    uploadVideo,
    uploadProgress,
    resetProgress,
  }
}
