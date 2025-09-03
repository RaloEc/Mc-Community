import React, { useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { SendHorizontal } from 'lucide-react';

interface CommentFormProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  ctaText?: string;
  initialText?: string;
  isLoading?: boolean;
}

export const CommentForm: React.FC<CommentFormProps> = ({ 
  onSubmit, 
  placeholder = 'Escribe tu comentario...', 
  ctaText = 'Enviar', 
  initialText = '',
  isLoading = false
}) => {
  const [text, setText] = useState(initialText);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <Input
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1"
        disabled={isLoading}
      />
      <Button
        type="submit"
        disabled={!text.trim() || isLoading}
        variant="primary"
        size="icon"
        aria-label="Enviar comentario"
        title={isLoading ? 'Enviando…' : 'Enviar comentario'}
      >
        {isLoading ? (
          <span className="h-5 w-5 animate-pulse">···</span>
        ) : (
          <SendHorizontal className="h-5 w-5" />
        )}
      </Button>
    </form>
  );
};
