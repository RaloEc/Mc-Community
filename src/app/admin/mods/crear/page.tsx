'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

type Categoria = {
  id: string;
  nombre: string;
  descripcion: string | null;
};

export default function CrearModPage() {
  const [nombre, setNombre] = useState('');
  const [version, setVersion] = useState('');
  const [versionMinecraft, setVersionMinecraft] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [autor, setAutor] = useState('');
  const [enlaceCurseforge, setEnlaceCurseforge] = useState('');
  const [enlaceModrinth, setEnlaceModrinth] = useState('');
  const [enlaceGithub, setEnlaceGithub] = useState('');
  const [enlaceWebAutor, setEnlaceWebAutor] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [imagen, setImagen] = useState<File | null>(null);
  const [imagenPrevia, setImagenPrevia] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(true);
  
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  // Cargar categorías al montar el componente
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const { data, error } = await supabase
          .from('categorias_mod')
          .select('*')
          .order('nombre', { ascending: true });

        if (error) throw error;
        
        setCategorias(data || []);
      } catch (error) {
        console.error('Error al cargar las categorías:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las categorías. Por favor, inténtalo de nuevo.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingCategorias(false);
      }
    };

    cargarCategorias();
  }, [supabase, toast]);

  // Manejar la selección de imagen
  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagen(file);
      
      // Crear una vista previa de la imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPrevia(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!nombre || !version || !versionMinecraft || !descripcion || !autor) {
      toast({
        title: 'Error',
        description: 'Por favor, completa todos los campos obligatorios.',
        variant: 'destructive',
      });
      return;
    }

    // Validar que al menos un enlace esté presente
    if (!enlaceCurseforge && !enlaceModrinth && !enlaceGithub) {
      toast({
        title: 'Error',
        description: 'Debes proporcionar al menos un enlace de descarga (CurseForge, Modrinth o GitHub).',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      let imagenUrl = '';
      
      // Subir la imagen si se proporcionó
      if (imagen) {
        const nombreArchivo = `${Date.now()}-${imagen.name.replace(/[^a-zA-Z0-9.]/g, '-')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('mods')
          .upload(`imagenes/${nombreArchivo}`, imagen, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;
        
        // Obtener la URL pública de la imagen
        const { data: urlData } = supabase.storage
          .from('mods')
          .getPublicUrl(uploadData.path);
          
        imagenUrl = urlData.publicUrl;
      }

      // Crear el objeto de datos del mod
      const modData = {
        nombre,
        version,
        version_minecraft: versionMinecraft,
        descripcion,
        autor,
        enlace_curseforge: enlaceCurseforge || null,
        enlace_modrinth: enlaceModrinth || null,
        enlace_github: enlaceGithub || null,
        enlace_web_autor: enlaceWebAutor || null,
        imagen_url: imagenUrl || null,
        categoria_ids: categoriasSeleccionadas,
      };

      // Enviar los datos a la API
      const response = await fetch('/api/mods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el mod');
      }

      // Mostrar mensaje de éxito y redirigir
      toast({
        title: '¡Éxito!',
        description: 'El mod se ha creado correctamente.',
      });
      
      // Redirigir al listado de mods
      router.push('/admin/mods');
      router.refresh();
    } catch (error) {
      console.error('Error al crear el mod:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al crear el mod. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/mods">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Agregar Nuevo Mod</h1>
          <p className="text-muted-foreground">Completa el formulario para agregar un nuevo mod.</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Información básica */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Información Básica</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Mod <span className="text-destructive">*</span></Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: OptiFine, JourneyMap, etc."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="version">Versión <span className="text-destructive">*</span></Label>
                    <Input
                      id="version"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="Ej: 1.0.0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version_minecraft">Versión de Minecraft <span className="text-destructive">*</span></Label>
                    <Input
                      id="version_minecraft"
                      value={versionMinecraft}
                      onChange={(e) => setVersionMinecraft(e.target.value)}
                      placeholder="Ej: 1.20.1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autor">Autor <span className="text-destructive">*</span></Label>
                  <Input
                    id="autor"
                    value={autor}
                    onChange={(e) => setAutor(e.target.value)}
                    placeholder="Nombre del autor o desarrollador"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describe el mod y sus características principales..."
                    rows={5}
                    required
                  />
                </div>
              </div>

              {/* Enlaces */}
              <div className="space-y-4 pt-4">
                <h2 className="text-xl font-semibold">Enlaces de Descarga</h2>
                <p className="text-sm text-muted-foreground">Proporciona al menos un enlace de descarga.</p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="enlace_curseforge">Enlace de CurseForge</Label>
                    <Input
                      id="enlace_curseforge"
                      type="url"
                      value={enlaceCurseforge}
                      onChange={(e) => setEnlaceCurseforge(e.target.value)}
                      placeholder="https://www.curseforge.com/minecraft/mc-mods/..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="enlace_modrinth">Enlace de Modrinth</Label>
                    <Input
                      id="enlace_modrinth"
                      type="url"
                      value={enlaceModrinth}
                      onChange={(e) => setEnlaceModrinth(e.target.value)}
                      placeholder="https://modrinth.com/mod/..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="enlace_github">Enlace de GitHub (opcional)</Label>
                    <Input
                      id="enlace_github"
                      type="url"
                      value={enlaceGithub}
                      onChange={(e) => setEnlaceGithub(e.target.value)}
                      placeholder="https://github.com/..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="enlace_web_autor">Sitio web del autor (opcional)</Label>
                    <Input
                      id="enlace_web_autor"
                      type="url"
                      value={enlaceWebAutor}
                      onChange={(e) => setEnlaceWebAutor(e.target.value)}
                      placeholder="https://ejemplo.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Barra lateral */}
            <div className="space-y-6">
              {/* Imagen */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Imagen del Mod</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="imagen"
                      className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {imagenPrevia ? (
                        <div className="relative w-full h-full">
                          <img
                            src={imagenPrevia}
                            alt="Vista previa de la imagen"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG o WEBP (MAX. 5MB)
                          </p>
                        </div>
                      )}
                      <input
                        id="imagen"
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImagenChange}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Categorías */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Categorías</h2>
                {isLoadingCategorias ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : categorias.length > 0 ? (
                  <div className="space-y-2">
                    {categorias.map((categoria) => (
                      <div key={categoria.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`categoria-${categoria.id}`}
                          checked={categoriasSeleccionadas.includes(categoria.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setCategoriasSeleccionadas([...categoriasSeleccionadas, categoria.id]);
                            } else {
                              setCategoriasSeleccionadas(
                                categoriasSeleccionadas.filter((id) => id !== categoria.id)
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`categoria-${categoria.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {categoria.nombre}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay categorías disponibles.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/mods">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Mod'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
