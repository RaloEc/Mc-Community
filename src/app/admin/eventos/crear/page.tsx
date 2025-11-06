"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Clock,
  Upload,
  Link,
  Calendar,
  AlertCircle,
  Gamepad2,
  Info,
  ImageIcon,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Edit as EditIcon,
  Trash2,
  Save,
  RefreshCcw,
  Loader2,
  Search,
  Check,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";

// Interfaces para los tipos de datos
interface Juego {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  imagen_portada_url?: string;
  icono_url?: string;
  fecha_lanzamiento?: string;
  desarrollador?: string;
  created_at?: string;
  updated_at?: string;
}

interface JuegoListado extends Juego {
  iconoPublicUrl: string | null;
}

type JuegoRow = {
  id: string;
  nombre: string;
  slug: string;
  icono_url: string | null;
  descripcion: string | null;
  desarrollador: string | null;
  fecha_lanzamiento: string | null;
};

// Esquema de validación para juegos
const juegoSchema = z.object({
  id: z.string().optional(),
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres"),
  slug: z.string().optional(),
  descripcion: z.string().optional(),
  desarrollador: z.string().optional(),
  fecha_lanzamiento: z.date().optional().nullable(),
  icono_url: z.string().optional(),
});

type JuegoFormValues = z.infer<typeof juegoSchema>;

// Esquema de validación con validaciones condicionales
const eventoSchema = z
  .object({
    titulo: z
      .string()
      .min(3, "El título debe tener al menos 3 caracteres")
      .max(100, "El título no puede exceder los 100 caracteres"),
    descripcion: z
      .string()
      .min(10, "La descripción debe tener al menos 10 caracteres"),
    fecha: z.date({
      required_error: "La fecha es obligatoria",
    }),
    tipo: z.enum(["actualizacion", "parche", "evento", "torneo"], {
      required_error: "Debes seleccionar un tipo de evento",
    }),
    tipo_icono: z.enum(["juego_existente", "personalizado"], {
      required_error: "Debes seleccionar el tipo de icono",
    }),
    juego_id: z.string().optional(),
    juego_nombre: z.string().optional(),
    imagen_url: z.string().optional(),
    icono_url: z.string().optional(),
    url: z.string().url("La URL debe ser válida").optional().or(z.literal("")),
    estado: z.enum(["borrador", "publicado", "cancelado"], {
      required_error: "Debes seleccionar un estado",
    }),
  })
  .superRefine((data, ctx) => {
    // Validar que si tipo_icono es 'juego_existente', juego_id sea obligatorio
    if (data.tipo_icono === "juego_existente" && !data.juego_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["juego_id"],
        message: "Debes seleccionar un juego",
      });
    }

    // Validar que si tipo_icono es 'personalizado', icono_url sea obligatorio
    if (data.tipo_icono === "personalizado" && !data.icono_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["icono_url"],
        message: "Debes subir un icono personalizado",
      });
    }
  });

type EventoFormValues = z.infer<typeof eventoSchema>;

export default function CrearEvento() {
  const { isAdmin, isLoading: authLoading, user: authUser } = useAdminAuth();
  const router = useRouter();
  const supabase = createClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [iconoPreview, setIconoPreview] = useState<string | null>(null);
  const [juegos, setJuegos] = useState<JuegoListado[]>([]);
  const [isLoadingJuegos, setIsLoadingJuegos] = useState(false);
  const [isFechaPopoverOpen, setIsFechaPopoverOpen] = useState(false);
  const [juegosError, setJuegosError] = useState<string | null>(null);
  const [hasTriedLoadingJuegos, setHasTriedLoadingJuegos] = useState(false);
  const [isJuegoDialogOpen, setIsJuegoDialogOpen] = useState(false);
  const [juegoEditando, setJuegoEditando] = useState<Juego | null>(null);
  const [juegoIconoPreview, setJuegoIconoPreview] = useState<string | null>(
    null
  );
  const [isSubmittingJuego, setIsSubmittingJuego] = useState(false);
  const [juegoEliminandoId, setJuegoEliminandoId] = useState<string | null>(
    null
  );

  // Inicializar formulario
  const form = useForm<EventoFormValues>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      fecha: new Date(),
      tipo: "evento",
      tipo_icono: "juego_existente",
      juego_id: "",
      juego_nombre: "",
      imagen_url: "",
      icono_url: "",
      url: "",
      estado: "borrador",
    },
  });

  const juegoSeleccionadoId = form.watch("juego_id");

  const selectedJuego = useMemo(() => {
    if (!juegoSeleccionadoId) return null;
    return juegos.find((juego) => juego.id === juegoSeleccionadoId) ?? null;
  }, [juegos, juegoSeleccionadoId]);

  // Función para cargar juegos con cacheo de URLs públicas
  const fetchJuegos = useCallback(async () => {
    try {
      setIsLoadingJuegos(true);
      // ...
      setJuegosError(null);
      setHasTriedLoadingJuegos(true);

      const { data, error } = await supabase
        .from("juegos")
        .select(
          "id, nombre, slug, icono_url, descripcion, desarrollador, fecha_lanzamiento"
        )
        .order("nombre");

      if (error) throw error;

      if (data) {
        // Cachear URLs públicas para cada juego
        const juegosConUrls: JuegoListado[] = (data as JuegoRow[]).map(
          (juego) => {
            let iconoPublicUrl: string | null = null;

            if (juego.icono_url) {
              try {
                // Si ya es una URL pública (comienza con http), usarla directamente
                if (juego.icono_url.startsWith("http")) {
                  iconoPublicUrl = juego.icono_url;
                } else {
                  // Si es una ruta relativa, generar URL pública
                  const { data: publicUrlData } = supabase.storage
                    .from("iconos")
                    .getPublicUrl(juego.icono_url);
                  iconoPublicUrl = publicUrlData?.publicUrl || null;
                }
              } catch (e) {
                console.warn(
                  `[fetchJuegos] Error obteniendo URL para ${juego.nombre}:`,
                  e
                );
              }
            }

            return {
              ...juego,
              iconoPublicUrl,
            };
          }
        );

        setJuegos(juegosConUrls);
        console.log(
          "[fetchJuegos] Juegos cargados:",
          juegosConUrls.length,
          "con iconos"
        );
      }
    } catch (error) {
      console.error("[fetchJuegos] Error:", error);
      setJuegosError("No se pudieron cargar los juegos. Intenta de nuevo.");
    } finally {
      setIsLoadingJuegos(false);
    }
  }, [supabase]);

  // Redireccionar si no es admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/admin/login");
    }
  }, [isAdmin, authLoading, router]);

  // Cargar juegos desde Supabase
  useEffect(() => {
    fetchJuegos();
  }, [fetchJuegos]);

  // Sincronizar datos cuando se selecciona un juego
  useEffect(() => {
    if (!selectedJuego) {
      return;
    }

    form.setValue("juego_nombre", selectedJuego.nombre);
    form.setValue("icono_url", selectedJuego.icono_url || "");
    setIconoPreview(selectedJuego.iconoPublicUrl);
  }, [selectedJuego, form]);

  // Manejar envío del formulario
  const onSubmit = async (data: EventoFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("[onSubmit] Datos del formulario recibidos:", {
        ...data,
        fecha: data.fecha?.toISOString?.() ?? data.fecha,
      });

      // Crear el evento usando la API protegida
      const payload = {
        titulo: data.titulo,
        descripcion: data.descripcion,
        fecha: data.fecha.toISOString(),
        tipo: data.tipo,
        juego_nombre: data.juego_nombre || null,
        imagen_url: data.imagen_url || null,
        icono_url: data.icono_url || null,
        url: data.url || null,
        estado: data.estado,
        tipo_icono: data.tipo_icono,
        juego_id: data.juego_id || null,
      };

      console.log("[onSubmit] Payload preparado para envío:", payload);

      const response = await fetch("/api/admin/eventos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log(
        "[onSubmit] Respuesta recibida:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[onSubmit] Error en respuesta:", errorData);
        throw new Error(errorData.error || "Error al crear evento");
      }

      const eventoCreado = await response.json();
      console.log("[onSubmit] Evento creado:", eventoCreado);

      toast({
        title: "Evento creado",
        description: `El evento "${data.titulo}" ha sido creado correctamente.`,
        variant: "default",
      });

      // Redireccionar a la lista de eventos
      router.push("/admin/eventos");
    } catch (error) {
      console.error("[onSubmit] Error capturado:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo crear el evento.",
        variant: "destructive",
      });
    } finally {
      console.log("[onSubmit] Finalizando envío");
      setIsSubmitting(false);
    }
  };

  // Manejar carga de imagen
  const handleImagenUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Crear URL local temporal para vista previa
        const previewUrl = URL.createObjectURL(file);
        setImagenPreview(previewUrl);

        // Subir imagen a Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `evento-imagen-${Date.now()}.${fileExt}`;
        const filePath = `eventos/${fileName}`;

        const { data, error } = await supabase.storage
          .from("iconos")
          .upload(filePath, file);

        if (error) throw error;

        // Obtener URL pública
        const { data: publicUrlData } = supabase.storage
          .from("iconos")
          .getPublicUrl(filePath);

        form.setValue("imagen_url", publicUrlData.publicUrl);
        console.log(
          "[handleImagenUpload] Imagen subida:",
          publicUrlData.publicUrl
        );
      } catch (error) {
        console.error("[handleImagenUpload] Error:", error);
        toast({
          title: "Error",
          description: "No se pudo subir la imagen.",
          variant: "destructive",
        });
        // Limpiar preview en caso de error
        setImagenPreview(null);
      }
    }
  };

  // Manejar carga de icono 3D
  const handleIconoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Crear URL local temporal para vista previa
        const previewUrl = URL.createObjectURL(file);
        setIconoPreview(previewUrl);
        form.setValue("tipo_icono", "personalizado");

        // Subir icono a Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `evento-icono-3d-${Date.now()}.${fileExt}`;
        const filePath = `iconos-3d/${fileName}`;

        const { data, error } = await supabase.storage
          .from("iconos")
          .upload(filePath, file);

        if (error) throw error;

        // Obtener URL pública
        const { data: publicUrlData } = supabase.storage
          .from("iconos")
          .getPublicUrl(filePath);

        // Guardar la URL pública del archivo
        form.setValue("icono_url", publicUrlData.publicUrl);
        form.clearErrors("icono_url");
        console.log(
          "[handleIconoUpload] Icono subido:",
          publicUrlData.publicUrl
        );
      } catch (error) {
        console.error("[handleIconoUpload] Error:", error);
        toast({
          title: "Error",
          description: "No se pudo subir el icono.",
          variant: "destructive",
        });
        // Limpiar preview en caso de error
        setIconoPreview(null);
      }
    }
  };

  // Formulario para crear/editar juegos
  const juegoForm = useForm<JuegoFormValues>({
    resolver: zodResolver(juegoSchema),
    defaultValues: {
      nombre: "",
      slug: "",
      descripcion: "",
      desarrollador: "",
      fecha_lanzamiento: null,
    },
  });

  // Inicializar formulario de juego para edición
  const inicializarFormularioJuego = (juego: Juego | null) => {
    if (juego) {
      // Modo edición
      juegoForm.reset({
        id: juego.id,
        nombre: juego.nombre,
        descripcion: juego.descripcion || "",
        desarrollador: juego.desarrollador || "",
        fecha_lanzamiento: juego.fecha_lanzamiento
          ? new Date(juego.fecha_lanzamiento)
          : null,
        icono_url: juego.icono_url || "",
      });

      // Si el juego tiene icono, mostrar vista previa
      if (juego.icono_url) {
        const { data } = supabase.storage
          .from("iconos")
          .getPublicUrl(juego.icono_url);

        if (data && data.publicUrl) {
          setJuegoIconoPreview(data.publicUrl);
        }
      } else {
        setJuegoIconoPreview(null);
      }
    } else {
      // Modo creación
      juegoForm.reset({
        nombre: "",
        descripcion: "",
        desarrollador: "",
        fecha_lanzamiento: null,
        icono_url: "",
      });
      setJuegoIconoPreview(null);
    }
  };

  // Abrir diálogo para crear un nuevo juego
  const handleNuevoJuego = () => {
    setJuegoEditando(null);
    inicializarFormularioJuego(null);
    setIsJuegoDialogOpen(true);
  };

  // Abrir diálogo para editar un juego existente
  const handleEditarJuego = (juego: Juego) => {
    setJuegoEditando(juego);
    inicializarFormularioJuego(juego);
    setIsJuegoDialogOpen(true);
  };

  // Eliminar un juego existente
  const handleEliminarJuego = async (juego: JuegoListado) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar el juego "${juego.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmar) return;

    try {
      setJuegoEliminandoId(juego.id);

      if (juego.icono_url && !juego.icono_url.startsWith("http")) {
        try {
          await supabase.storage.from("iconos").remove([juego.icono_url]);
        } catch (errorRemocion) {
          console.warn(
            "No se pudo eliminar el icono asociado al juego:",
            errorRemocion
          );
        }
      }

      const { error } = await supabase
        .from("juegos")
        .delete()
        .eq("id", juego.id);

      if (error) throw error;

      if (form.getValues("juego_id") === juego.id) {
        form.setValue("juego_id", "");
        form.setValue("juego_nombre", "");
        setIconoPreview(null);
      }

      await fetchJuegos();

      toast({
        title: "Juego eliminado",
        description: `Se eliminó el juego "${juego.nombre}" correctamente.`,
      });
    } catch (error) {
      console.error("Error al eliminar juego:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el juego. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setJuegoEliminandoId(null);
    }
  };

  // Manejar carga de icono para juego
  const handleJuegoIconoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Crear URL local temporal para vista previa
        const previewUrl = URL.createObjectURL(file);
        setJuegoIconoPreview(previewUrl);

        // Subir icono a Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `juego-icono-${Date.now()}.${fileExt}`;
        const filePath = `iconos-3d/${fileName}`;

        // Si estamos editando un juego y ya tiene un icono, eliminarlo primero
        if (juegoEditando?.icono_url) {
          try {
            await supabase.storage
              .from("iconos")
              .remove([juegoEditando.icono_url]);
            console.log("Icono anterior eliminado:", juegoEditando.icono_url);
          } catch (removeError) {
            console.warn("No se pudo eliminar el icono anterior:", removeError);
            // Continuamos aunque falle la eliminación
          }
        }

        // Subir el nuevo icono
        const { data, error } = await supabase.storage
          .from("iconos")
          .upload(filePath, file, { upsert: true });

        if (error) throw error;

        // Guardar la ruta relativa del archivo en el bucket
        juegoForm.setValue("icono_url", filePath, {
          shouldDirty: true,
          shouldValidate: true,
        });
        console.log("Nuevo icono subido:", filePath);
      } catch (error) {
        console.error("Error al subir icono del juego:", error);
        toast({
          title: "Error",
          description: "No se pudo subir el icono del juego.",
          variant: "destructive",
        });
      }
    }
  };

  // Ya no necesitamos generar slug automáticamente desde el nombre en tiempo real
  // porque lo generaremos al momento de guardar

  // Guardar juego (crear o actualizar)
  const onSubmitJuego = async (data: JuegoFormValues) => {
    try {
      setIsSubmittingJuego(true);

      // Generar slug a partir del nombre
      const generatedSlug = data.nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const juegoData = {
        nombre: data.nombre,
        slug: generatedSlug,
        descripcion: data.descripcion || null,
        desarrollador: data.desarrollador || null,
        fecha_lanzamiento: data.fecha_lanzamiento
          ? data.fecha_lanzamiento.toISOString()
          : null,
        icono_url: data.icono_url || null,
      };

      console.log("Guardando juego con datos:", juegoData);

      let result;

      if (juegoEditando) {
        // Actualizar juego existente
        result = await supabase
          .from("juegos")
          .update(juegoData)
          .eq("id", juegoEditando.id)
          .select();
      } else {
        // Crear nuevo juego
        result = await supabase.from("juegos").insert([juegoData]).select();
      }

      const { data: juegoGuardado, error } = result;

      if (error) throw error;

      // Actualizar lista de juegos
      await fetchJuegos();

      // Cerrar diálogo
      setIsJuegoDialogOpen(false);

      // Mostrar mensaje de éxito
      toast({
        title: juegoEditando ? "Juego actualizado" : "Juego creado",
        description: `El juego ${data.nombre} ha sido ${
          juegoEditando ? "actualizado" : "creado"
        } correctamente.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error al guardar juego:", error);
      toast({
        title: "Error",
        description: `Ocurrió un error al ${
          juegoEditando ? "actualizar" : "crear"
        } el juego.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingJuego(false);
    }
  };

  if (authLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Cargando...</h1>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Redirigiendo...
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Crear Nuevo Evento</h1>
        <Button variant="outline" onClick={() => router.push("/admin/eventos")}>
          Volver a la lista
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Sección de Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Ingresa los detalles principales del evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título del evento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el evento"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha del evento</FormLabel>
                      <Popover
                        open={isFechaPopoverOpen}
                        onOpenChange={setIsFechaPopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date ?? null);
                              if (date) {
                                setIsFechaPopoverOpen(false);
                              }
                            }}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de evento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="actualizacion">
                            Actualización
                          </SelectItem>
                          <SelectItem value="parche">Parche</SelectItem>
                          <SelectItem value="evento">Evento</SelectItem>
                          <SelectItem value="torneo">Torneo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL (opcional)</FormLabel>
                    <FormControl>
                      <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                        <Link className="ml-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="https://ejemplo.com/evento"
                          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="borrador">Borrador</SelectItem>
                        <SelectItem value="publicado">Publicado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Sección de Juego */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Seleccionar Juego</CardTitle>
                <CardDescription>
                  Elige un juego para asociarlo con este evento
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleNuevoJuego}
              >
                <PlusCircle className="h-4 w-4" />
                <span>Nuevo Juego</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingJuegos ? (
                <div className="flex items-center justify-center py-12 border rounded-md bg-gray-50 dark:bg-gray-900/50">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Cargando juegos...
                  </span>
                </div>
              ) : juegosError ? (
                <div className="flex flex-col items-center justify-center py-12 border border-red-200 dark:border-red-900/50 rounded-md bg-red-50 dark:bg-red-900/10">
                  <AlertCircle className="h-5 w-5 text-red-500 mb-2" />
                  <p className="text-sm text-red-700 dark:text-red-400 text-center">
                    {juegosError}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => fetchJuegos()}
                  >
                    <RefreshCcw className="h-3 w-3 mr-1" />
                    Reintentar
                  </Button>
                </div>
              ) : juegos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-md bg-gray-50 dark:bg-gray-900/50">
                  <Gamepad2 className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    No hay juegos disponibles
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleNuevoJuego}
                  >
                    <PlusCircle className="h-3 w-3 mr-1" />
                    Crear el primer juego
                  </Button>
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="juego_id"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {juegos.map((juego) => {
                          const isSelected = field.value === juego.id;
                          const isDeleting = juegoEliminandoId === juego.id;

                          const seleccionarJuego = () => {
                            field.onChange(juego.id);
                            form.setValue("juego_nombre", juego.nombre);
                            form.setValue("icono_url", juego.icono_url || "");
                            form.setValue("tipo_icono", "juego_existente");
                            form.clearErrors(["juego_id", "icono_url"]);
                            setIconoPreview(juego.iconoPublicUrl);
                          };

                          return (
                            <div
                              key={juego.id}
                              role="button"
                              tabIndex={0}
                              onClick={seleccionarJuego}
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  seleccionarJuego();
                                }
                              }}
                              className={cn(
                                "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/60",
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                              )}
                            >
                              <div className="absolute top-2 right-2 flex gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleEditarJuego(juego);
                                  }}
                                >
                                  <EditIcon className="h-4 w-4" />
                                  <span className="sr-only">Editar juego</span>
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleEliminarJuego(juego);
                                  }}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">
                                    Eliminar juego
                                  </span>
                                </Button>
                              </div>

                              {isSelected && (
                                <div className="absolute top-2 left-2 rounded-full bg-primary text-primary-foreground p-1">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}

                              {juego.iconoPublicUrl ? (
                                <img
                                  src={juego.iconoPublicUrl}
                                  alt={juego.nombre}
                                  className="h-12 w-12 rounded-md object-cover"
                                  onError={(e) => {
                                    console.warn(
                                      `Error cargando icono de ${juego.nombre}`
                                    );
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <Gamepad2 className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <span className="text-xs font-medium text-center line-clamp-2 w-full">
                                {juego.nombre}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedJuego && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-md">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-900 dark:text-green-300">
                      Juego seleccionado:{" "}
                      <span className="font-medium">
                        {selectedJuego.nombre}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sección de Icono Personalizado */}
          <Card>
            <CardHeader>
              <CardTitle>Icono Personalizado (Opcional)</CardTitle>
              <CardDescription>
                Sube un icono personalizado si no quieres usar el del juego
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center w-32 h-32">
                  {iconoPreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={iconoPreview}
                        alt="Vista previa del icono"
                        className="w-full h-full object-cover rounded-md"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => {
                          setIconoPreview(null);
                          form.setValue("icono_url", "");
                          form.setValue("tipo_icono", "juego_existente");
                        }}
                      >
                        <span className="sr-only">Eliminar</span>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        <label
                          htmlFor="icono-upload"
                          className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80"
                        >
                          <span>Subir icono</span>
                          <input
                            id="icono-upload"
                            name="icono-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleIconoUpload}
                          />
                        </label>
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    El icono se mostrará junto al nombre del evento. Idealmente
                    debe ser un icono cuadrado con fondo transparente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección de Imagen Destacada */}
          <Card>
            <CardHeader>
              <CardTitle>Imagen Destacada</CardTitle>
              <CardDescription>
                Sube una imagen para el evento (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <div className="mt-2 flex items-center gap-4">
                  <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center w-full h-40">
                    {imagenPreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={imagenPreview}
                          alt="Vista previa"
                          className="w-full h-full object-cover rounded-md"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => {
                            setImagenPreview(null);
                            form.setValue("imagen_url", "");
                          }}
                        >
                          <span className="sr-only">Eliminar</span>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          <label
                            htmlFor="imagen-upload"
                            className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80"
                          >
                            <span>Subir imagen</span>
                            <input
                              id="imagen-upload"
                              name="imagen-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImagenUpload}
                            />
                          </label>
                          <p>o arrastra y suelta</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF hasta 5MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vista previa */}
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa</CardTitle>
              <CardDescription>
                Así se verá el evento en la página principal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {form.getValues("titulo") ? (
                <div className="border rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    {(iconoPreview || form.getValues("icono_url")) && (
                      <img
                        src={iconoPreview}
                        alt="Icono del evento"
                        className="w-12 h-12 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">
                          {form.getValues("titulo")}
                        </h3>
                        <Badge
                          className={
                            form.getValues("tipo") === "actualizacion"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              : form.getValues("tipo") === "parche"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : form.getValues("tipo") === "evento"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          }
                        >
                          {form.getValues("tipo") === "actualizacion"
                            ? "Actualización"
                            : form.getValues("tipo") === "parche"
                            ? "Parche"
                            : form.getValues("tipo") === "evento"
                            ? "Evento"
                            : "Torneo"}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {form.getValues("descripcion") || "Sin descripción"}
                      </p>

                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {form.getValues("fecha")
                            ? format(form.getValues("fecha"), "dd MMM yyyy", {
                                locale: es,
                              })
                            : "Fecha no especificada"}
                        </span>

                        {form.getValues("juego_nombre") && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{form.getValues("juego_nombre")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {(imagenPreview || form.getValues("imagen_url")) && (
                    <div className="mt-3">
                      <img
                        src={imagenPreview}
                        alt="Imagen del evento"
                        className="w-full h-40 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No hay datos suficientes
                  </h3>
                  <p className="text-gray-500">
                    Completa al menos el título y la descripción para ver una
                    vista previa.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/eventos")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Evento"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Diálogo para crear/editar juegos */}
      <Dialog open={isJuegoDialogOpen} onOpenChange={setIsJuegoDialogOpen}>
        <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              {juegoEditando ? "Editar juego" : "Crear nuevo juego"}
            </DialogTitle>
            <DialogDescription>
              {juegoEditando
                ? "Modifica los datos del juego seleccionado."
                : "Completa los datos para crear un nuevo juego."}
            </DialogDescription>
          </DialogHeader>

          <Form {...juegoForm}>
            <form
              onSubmit={juegoForm.handleSubmit(onSubmitJuego)}
              className="flex flex-col flex-1 overflow-hidden min-h-0"
            >
              <ScrollArea className="flex-1 w-full overflow-hidden">
                <div className="space-y-6 px-6 py-4 pb-20">
                  {/* Nombre del juego */}
                  <FormField
                    control={juegoForm.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="juego-nombre">
                          Nombre del juego
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="juego-nombre"
                            placeholder="Nombre del juego"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500">
                          El slug para URLs se generará automáticamente a partir
                          del nombre.
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Descripción */}
                  <FormField
                    control={juegoForm.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="juego-descripcion">
                          Descripción (opcional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            id="juego-descripcion"
                            placeholder="Descripción del juego"
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Desarrollador */}
                  <FormField
                    control={juegoForm.control}
                    name="desarrollador"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="juego-desarrollador">
                          Desarrollador (opcional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="juego-desarrollador"
                            placeholder="Nombre del desarrollador"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Fecha de lanzamiento */}
                  <FormField
                    control={juegoForm.control}
                    name="fecha_lanzamiento"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel htmlFor="juego-fecha">
                          Fecha de lanzamiento (opcional)
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                id="juego-fecha"
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Selecciona una fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Icono */}
                  <div>
                    <div className="flex items-center justify-between">
                      <FormLabel>Icono del juego (opcional)</FormLabel>
                      {juegoEditando?.icono_url && juegoIconoPreview && (
                        <Badge
                          variant="outline"
                          className="px-2 py-1 flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Icono existente</span>
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center w-32 h-32">
                        {juegoIconoPreview ? (
                          <div className="relative w-full h-full">
                            <img
                              src={juegoIconoPreview}
                              alt="Vista previa del icono"
                              className="w-full h-full object-contain rounded-md"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => {
                                setJuegoIconoPreview(null);
                                juegoForm.setValue("icono_url", "", {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }}
                            >
                              <span className="sr-only">Eliminar</span>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                              <label
                                htmlFor="juego-icono-upload"
                                className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80"
                              >
                                <span>
                                  {juegoEditando
                                    ? "Cambiar icono"
                                    : "Subir icono"}
                                </span>
                                <input
                                  id="juego-icono-upload"
                                  name="juego-icono-upload"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={handleJuegoIconoUpload}
                                />
                              </label>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {juegoEditando && juegoIconoPreview ? (
                            <>
                              Puedes <strong>cambiar</strong> el icono existente
                              o <strong>eliminarlo</strong> usando el botón X.
                            </>
                          ) : (
                            <>
                              El icono se mostrará junto al nombre del juego.
                              Idealmente debe ser un icono cuadrado con fondo
                              transparente.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="sticky bottom-0 bg-background px-6 py-4 border-t flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsJuegoDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingJuego}
                  className="flex items-center gap-2"
                >
                  {isSubmittingJuego ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Guardar</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
