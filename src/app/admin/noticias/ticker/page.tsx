'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, GripVertical, Newspaper } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DndProvider, useDrag, useDrop } from 'react-dnd/dist/index.js';
import { HTML5Backend } from 'react-dnd-html5-backend/dist/index.js';
import { NoticiaSelector } from '@/components/admin/NoticiaSelector';

type TickerMessage = {
  id: string;
  mensaje: string;
  activo: boolean;
  orden: number;
};

const DraggableItem = ({ 
  message, 
  index, 
  onUpdate, 
  onRemove, 
  moveItem 
}: { 
  message: TickerMessage; 
  index: number;
  onUpdate: (id: string, updates: Partial<TickerMessage>) => void;
  onRemove: (id: string) => void;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'TICKER_ITEM',
    item: { id: message.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'TICKER_ITEM',
    hover(item: { id: string; index: number }, monitor) {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      // Solo mover cuando el ratón ha cruzado la mitad del elemento
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div 
      ref={ref}
      id={`ticker-message-${message.id}`}
      className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow mb-2 ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="flex items-center cursor-move text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <Input
          value={message.mensaje}
          onChange={(e) => onUpdate(message.id, { mensaje: e.target.value })}
          placeholder="Nuevo mensaje"
          className="w-full"
        />
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <Switch
            id={`active-${message.id}`}
            checked={message.activo}
            onCheckedChange={(checked) => onUpdate(message.id, { activo: checked })}
          />
          <Label htmlFor={`active-${message.id}`} className="text-sm">
            {message.activo ? 'Activo' : 'Inactivo'}
          </Label>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(message.id)}
          className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const TickerAdmin = () => {
  const [messages, setMessages] = useState<TickerMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSelectNoticia = (noticia: { id: string; titulo: string }) => {
    // Verificar si ya existe un mensaje con este título
    const tituloExistente = messages.some(msg => 
      msg.mensaje.includes(noticia.titulo)
    );

    if (tituloExistente) {
      toast.warning('Este título ya está en la lista');
      return;
    }

    // Generar un ID temporal único
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newMessage: TickerMessage = {
      id: tempId,
      mensaje: noticia.titulo,
      activo: true,
      orden: messages.length,
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
    
    // Hacer scroll hasta el nuevo mensaje después de un pequeño retraso
    setTimeout(() => {
      const element = document.getElementById(`ticker-message-${tempId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  useEffect(() => {
    fetchTickerMessages();
  }, []);

  const fetchTickerMessages = async () => {
    try {
      const response = await fetch('/api/admin/news-ticker');
      if (!response.ok) {
        throw new Error('Error al cargar los mensajes');
      }
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los mensajes del ticker');
    } finally {
      setIsLoading(false);
    }
  };

  const addNewMessage = () => {
    // Generar un ID temporal único
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newMessage: TickerMessage = {
      id: tempId,
      mensaje: '',
      activo: true,
      orden: messages.length,
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
    
    // Hacer scroll hasta el nuevo mensaje después de un pequeño retraso para permitir que se renderice
    setTimeout(() => {
      const element = document.getElementById(`ticker-message-${tempId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Enfocar el input del nuevo mensaje
        const input = element.querySelector('input');
        if (input) {
          input.focus();
        }
      }
    }, 100);
  };

  const updateMessage = (id: string, updates: Partial<TickerMessage>) => {
    setMessages(messages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  const removeMessage = (id: string) => {
    setMessages(messages.filter(msg => msg.id !== id));
  };

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const newMessages = [...messages];
    const [removed] = newMessages.splice(dragIndex, 1);
    newMessages.splice(hoverIndex, 0, removed);
    
    // Actualizar el orden
    const updatedMessages = newMessages.map((msg, index) => ({
      ...msg,
      orden: index,
    }));
    
    setMessages(updatedMessages);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Filtrar mensajes vacíos y asegurar que tengan el formato correcto
      const validMessages = messages
        .filter(msg => msg.mensaje && msg.mensaje.trim() !== '')
        .map((msg, index) => ({
          id: msg.id.startsWith('temp-') ? undefined : msg.id,
          mensaje: msg.mensaje.trim(),
          activo: Boolean(msg.activo),
          orden: index
        }));

      const response = await fetch('/api/admin/news-ticker', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validMessages),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Error al guardar los cambios');
      }

      const result = await response.json();
      setMessages(result);
      toast.success('Cambios guardados correctamente');
      router.refresh();
    } catch (error) {
      console.error('Error al guardar los mensajes:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Administrar Ticker de Noticias</h1>
          <div className="flex gap-2">
            <div className="flex gap-2">
              <NoticiaSelector onSelect={handleSelectNoticia} disabled={isSaving} />
              <Button 
                onClick={addNewMessage} 
                variant="outline"
                disabled={isSaving}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Mensaje personalizado</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || messages.length === 0}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Guardando...</span>
                </>
              ) : (
                <>
                  <Newspaper className="h-4 w-4" />
                  <span className="hidden sm:inline">Guardar cambios</span>
                  <span className="sm:hidden">Guardar</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No hay mensajes en el ticker. Agrega uno nuevo para comenzar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message, index) => (
                <DraggableItem
                  key={message.id}
                  message={message}
                  index={index}
                  onUpdate={updateMessage}
                  onRemove={removeMessage}
                  moveItem={moveItem}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Vista previa del Ticker</h3>
          <div className="bg-white dark:bg-gray-800 p-4 rounded border border-blue-200 dark:border-blue-800">
            <div className="flex items-center bg-gradient-to-r from-blue-600 to-blue-800 text-white text-sm py-2 px-4 rounded-t-lg">
              <div className="flex items-center font-medium mr-4">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>ÚLTIMAS NOTICIAS</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="whitespace-nowrap">
                  {messages
                    .filter(msg => msg.activo && msg.mensaje.trim() !== '')
                    .map((msg, i, arr) => (
                      <span key={msg.id} className="inline-block mr-8">
                        • {msg.mensaje}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default TickerAdmin;
