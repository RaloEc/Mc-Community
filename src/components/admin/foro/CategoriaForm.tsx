'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Definimos la interfaz aquí también para mantener la consistencia
interface Categoria {
  id?: string;
  nombre: string;
  slug: string;
  descripcion: string;
  orden: number;
  icono: string;
}

interface CategoriaFormProps {
  categoriaInicial?: Categoria | null;
  onSave: (categoria: Categoria) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function CategoriaForm({ categoriaInicial, onSave, onCancel, isSaving }: CategoriaFormProps) {
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [orden, setOrden] = useState(0);
  const [icono, setIcono] = useState('');

  useEffect(() => {
    if (categoriaInicial) {
      setNombre(categoriaInicial.nombre || '');
      setSlug(categoriaInicial.slug || '');
      setDescripcion(categoriaInicial.descripcion || '');
      setOrden(categoriaInicial.orden || 0);
      setIcono(categoriaInicial.icono || '');
    } else {
      // Resetear el formulario si no hay datos iniciales
      setNombre('');
      setSlug('');
      setDescripcion('');
      setOrden(0);
      setIcono('');
    }
  }, [categoriaInicial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const categoriaData: Categoria = {
      ...(categoriaInicial || {}),
      nombre,
      slug,
      descripcion,
      orden,
      icono,
    };
    onSave(categoriaData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="orden">Orden</Label>
        <Input id="orden" type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} required />
      </div>
      <div>
        <Label htmlFor="icono">Icono (ej: 'Home', 'Hash')</Label>
        <Input id="icono" value={icono} onChange={(e) => setIcono(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  );
}
