'use client'

import { useState } from 'react'
import { 
  Share2, 
  Link as LinkIcon,
  Twitter, 
  Facebook, 
  Linkedin,
  Mail,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface ShareButtonProps {
  url: string
  title: string
  description?: string
  className?: string
  shareText?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function ShareButton({ 
  url, 
  title, 
  description = '',
  className = '',
  shareText = 'Compartir',
  variant = 'outline',
  size = 'sm'
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  // Verificar si la Web Share API está disponible
  const canUseNativeShare = typeof window !== 'undefined' && navigator.share

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Enlace copiado al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('No se pudo copiar el enlace')
    }
  }

  const shareOnSocial = (platform: string) => {
    const text = `${title} ${description ? `- ${description}` : ''}`.trim()
    let shareUrl = ''

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        break
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
        break
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
        break
      case 'mail':
        shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`
        break
    }

    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title,
        text: description,
        url,
      })
    } catch (err) {
      // El usuario canceló el compartir o hubo un error
      console.log('Compartir cancelado o error:', err)
    }
  }

  // Si la Web Share API está disponible, usamos el menú nativo
  if (canUseNativeShare) {
    return (
      <Button 
        variant={variant}
        size={size}
        className={className}
        onClick={handleNativeShare}
      >
        <Share2 className="h-4 w-4 mr-2" />
        {shareText}
      </Button>
    )
  }

  // Fallback: menú personalizado
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          {shareText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <LinkIcon className="h-4 w-4 mr-2" />
          )}
          {copied ? '¡Copiado!' : 'Copiar enlace'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareOnSocial('twitter')}>
          <Twitter className="h-4 w-4 mr-2 text-blue-400" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareOnSocial('facebook')}>
          <Facebook className="h-4 w-4 mr-2 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareOnSocial('linkedin')}>
          <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareOnSocial('whatsapp')}>
          <span className="text-green-600 mr-2">WA</span>
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareOnSocial('telegram')}>
          <span className="text-blue-400 mr-2">TG</span>
          Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareOnSocial('mail')}>
          <Mail className="h-4 w-4 mr-2" />
          Correo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
