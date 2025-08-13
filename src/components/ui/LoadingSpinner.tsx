import { Loader } from 'lucide-react'

const LoadingSpinner = ({ size = 'default' }: { size?: 'default' | 'large' }) => {
  const sizeClasses = size === 'large' ? 'h-16 w-16' : 'h-8 w-8'

  return (
    <div className="flex h-full min-h-[200px] w-full items-center justify-center bg-background">
      <Loader className={`${sizeClasses} animate-spin text-primary`} />
    </div>
  )
}

export default LoadingSpinner
