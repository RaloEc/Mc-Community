'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, AlertCircle, Check, X } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Versiones de Minecraft disponibles
const minecraftVersions = [
  '1.20.4', '1.20.2', '1.20.1', '1.20', 
  '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
  '1.18.2', '1.18.1', '1.18',
  '1.17.1', '1.17',
  '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16',
  '1.15.2', '1.15.1', '1.15',
  '1.14.4', '1.14.3', '1.14.2', '1.14.1', '1.14',
  '1.12.2', '1.12.1', '1.12',
  '1.8.9', '1.7.10'
];

export default function EditarModPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { session, user, loading: authLoading } = useAuth();
  const { id } = params;
  
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modExistente, setModExistente] = useState<any>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    version: '',
    version_minecraft: '1.20.4',
    enlace_descarga: '',
    enlace_curseforge: '',
    enlace_modrinth: '',
    tipo_enlace_principal: 'descarga',
    categorias_seleccionadas: [] as string[],
    imagen: null as File | null,
    imagen_url: '' as string | null
  });

  // Verificar si el usuario es administrador
  useEffect(() => {
    if (authLoading) return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('perfiles')
          .select('role')
          .eq('id', user?.id)
          .single();

        if (error) throw error;
        
        if (data?.role !== 'admin') {
          router.push('/');
          return;
        }
        
        setIsAdmin(true);
      } catch (err) {
        console.error('Error al verificar el rol de administrador:', err);
        router.push('/');
      }
    };

    checkAdminStatus();
  }, [session, user, authLoading, router]);

  // Cargar datos del mod y categorías
  useEffect(() => {
    if (!isAdmin || !id) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // Obtener datos del mod
        const { data: modData, error: modError } = await supabase
          .from('mods')
          .select('*')
          .eq('id', id)
          .single();
          
        if (modError) throw modError;
        
        if (!modData) {
          setError('No se encontró el mod especificado.');
          return;
        }
        
        // Obtener categorías del mod
        const { data: modCategoriasData, error: modCategoriasError } = await supabase
          .from('mods_categorias')
          .select('categoria_id')
          .eq('mod_id', id);
          
        if (modCategoriasError) throw modCategoriasError;
        
        // Obtener todas las categorías disponibles
        const { data: categoriasData, error: categoriasError } = await supabase
          .from('categorias_mod')
          .select('*')
          .order('nombre');
          
        if (categoriasError) throw categoriasError;
        
        // Establecer datos
        setCategorias(categoriasData || []);
        setModExistente(modData);
        
        // Establecer datos del formulario
        setFormData({
          nombre: modData.nombre || '',
          descripcion: modData.descripcion || '',
          version: modData.version || '',
          version_minecraft: modData.version_minecraft || '1.20.4',
          enlace_descarga: modData.enlace_descarga || '',
          enlace_curseforge: modData.enlace_curseforge || '',
          enlace_modrinth: modData.enlace_modrinth || '',
          tipo_enlace_principal: modData.tipo_enlace_principal || 'descarga',
          categorias_seleccionadas: modCategoriasData?.map(cat => cat.categoria_id) || [],
          imagen: null,
          imagen_url: modData.imagen_url
        });
        
        // Establecer URL de previsualización si hay imagen
        if (modData.imagen_url) {
          setPreviewUrl(modData.imagen_url);
        }
        
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos del mod. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isAdmin, id]);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Manejar cambios en selects
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Manejar cambios en categorías
  const handleCategoriaChange = (categoriaId: string) => {
    setFormData(prev => {
      const categorias = [...prev.categorias_seleccionadas];
      
      if (categorias.includes(categoriaId)) {
        return {
          ...prev,
          categorias_seleccionadas: categorias.filter(id => id !== categoriaId)
        };
      } else {
        return {
          ...prev,
          categorias_seleccionadas: [...categorias, categoriaId]
        };
      }
    });
  };
  
  // Manejar cambio de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError('La imagen no debe superar los 5MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, imagen: file, imagen_url: null }));
      
      // Crear URL para previsualización
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Limpiar URL al desmontar
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setFormData(prev => ({ ...prev, imagen: null }));
      setPreviewUrl(null);
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin || !id) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Validar campos requeridos
      if (!formData.nombre || !formData.descripcion || !formData.version_minecraft) {
        setError('Por favor, completa todos los campos requeridos.');
        return;
      }
      
      // Al menos un enlace debe estar presente
      if (!formData.enlace_descarga && !formData.enlace_curseforge && !formData.enlace_modrinth) {
        setError('Debes proporcionar al menos un enlace para el mod.');
        return;
      }
      
      // Crear API endpoint para actualizar el mod
      const apiUrl = `/api/admin/recursos/mods/${id}`;
      
      // Preparar datos para la actualización
      const updateData: any = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        version: formData.version,
        version_minecraft: formData.version_minecraft,
        enlace_descarga: formData.enlace_descarga,
        enlace_curseforge: formData.enlace_curseforge,
        enlace_modrinth: formData.enlace_modrinth,
        tipo_enlace_principal: formData.tipo_enlace_principal,
        categorias: formData.categorias_seleccionadas
      };
      
      // Subir imagen si hay una nueva
      if (formData.imagen) {
        const supabase = createClient();
        const fileExt = formData.imagen.name.split('.').pop();
        const fileName = `${uuidv4()}-${Date.now()}.${fileExt}`;
        const filePath = `mods/${fileName}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('imagenes')
          .upload(filePath, formData.imagen);
          
        if (uploadError) throw uploadError;
        
        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('imagenes')
          .getPublicUrl(filePath);
          
        updateData.imagen_url = publicUrl;
      } else if (formData.imagen_url === null) {
        // Si se eliminó la imagen
        updateData.imagen_url = null;
      }
      
      // Realizar la actualización mediante API
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el mod');
      }
      
      setSuccess(true);
      
      // Redireccionar después de 2 segundos
      setTimeout(() => {
        router.push('/admin/recursos/mods');
      }, 2000);
      
    } catch (err) {
      console.error('Error al actualizar el mod:', err);
      setError('Error al actualizar el mod. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setSubmitting(false);
    }
  };

  // Si no se ha cargado el mod o no existe
  if (!modExistente && !loading && !error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>No se encontró el mod especificado.</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/admin/recursos/mods">Volver a la lista de mods</Link>
        </Button>
      </div>
    );
  }

  if (authLoading || (loading && !error)) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/admin/recursos/mods">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Editar Mod: {modExistente?.nombre}</h1>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>¡Éxito!</AlertTitle>
          <AlertDescription>El mod ha sido actualizado correctamente. Redirigiendo...</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Columna izquierda */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Mod <span className="text-destructive">*</span></Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Nombre del mod"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción <span className="text-destructive">*</span></Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Descripción del mod"
                rows={5}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Versión del Mod</Label>
                <Input
                  id="version"
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  placeholder="Ej: 1.2.3"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="version_minecraft">Versión de Minecraft <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.version_minecraft}
                  onValueChange={(value) => handleSelectChange('version_minecraft', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una versión" />
                  </SelectTrigger>
                  <SelectContent>
                    {minecraftVersions.map((version) => (
                      <SelectItem key={version} value={version}>
                        {version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Categorías</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {categorias.map((categoria) => (
                  <div key={categoria.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`categoria-${categoria.id}`}
                      checked={formData.categorias_seleccionadas.includes(categoria.id)}
                      onChange={() => handleCategoriaChange(categoria.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor={`categoria-${categoria.id}`} className="cursor-pointer">
                      {categoria.nombre}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Columna derecha */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="imagen">Imagen del Mod</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-muted">
                <div className="space-y-1 text-center">
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Vista previa"
                        className="mx-auto h-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl(null);
                          setFormData(prev => ({ ...prev, imagen: null, imagen_url: null }));
                        }}
                        className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-muted-foreground"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-muted-foreground">
                        <label
                          htmlFor="imagen"
                          className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none"
                        >
                          <span>Sube una imagen</span>
                          <input
                            id="imagen"
                            name="imagen"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">o arrastra y suelta</p>
                      </div>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF hasta 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Enlaces</CardTitle>
                <CardDescription>Proporciona al menos un enlace para descargar el mod</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="enlace_descarga">Enlace de Descarga Directa</Label>
                  <Input
                    id="enlace_descarga"
                    name="enlace_descarga"
                    value={formData.enlace_descarga}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/mod.jar"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="enlace_curseforge">Enlace de CurseForge</Label>
                  <Input
                    id="enlace_curseforge"
                    name="enlace_curseforge"
                    value={formData.enlace_curseforge}
                    onChange={handleChange}
                    placeholder="https://www.curseforge.com/minecraft/mc-mods/ejemplo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="enlace_modrinth">Enlace de Modrinth</Label>
                  <Input
                    id="enlace_modrinth"
                    name="enlace_modrinth"
                    value={formData.enlace_modrinth}
                    onChange={handleChange}
                    placeholder="https://modrinth.com/mod/ejemplo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tipo_enlace_principal">Enlace Principal</Label>
                  <Select
                    value={formData.tipo_enlace_principal}
                    onValueChange={(value) => handleSelectChange('tipo_enlace_principal', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el enlace principal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="descarga">Descarga Directa</SelectItem>
                      <SelectItem value="curseforge">CurseForge</SelectItem>
                      <SelectItem value="modrinth">Modrinth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/recursos/mods">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
