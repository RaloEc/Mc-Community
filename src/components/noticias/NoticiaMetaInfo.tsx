import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NoticiaMetaInfoProps {
  autor_nombre?: string;
  autor_avatar?: string;
  created_at: string;
  comentarios_count?: number;
  className?: string;
}

export function NoticiaMetaInfo({ 
  autor_nombre, 
  autor_avatar, 
  created_at, 
  comentarios_count = 0,
  className = ''
}: NoticiaMetaInfoProps) {
  return (
    <div className={`flex items-center justify-between pt-3 border-t border-gray-200 dark:border-white/10 ${className}`}>
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8 border-2 border-gray-200 dark:border-white/20">
          {autor_avatar && (
            <AvatarImage src={autor_avatar} alt={autor_nombre} />
          )}
          <AvatarFallback className="text-xs bg-gray-100 dark:bg-white/20 text-gray-800 dark:text-white">
            {autor_nombre?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-xs font-medium text-gray-900 dark:text-white">
            {autor_nombre || 'Usuario'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {formatDistanceToNow(new Date(created_at), { 
              addSuffix: true,
              locale: es 
            })}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
        <MessageSquare className="h-3.5 w-3.5" />
        <span>{comentarios_count}</span>
      </div>
    </div>
  );
}
