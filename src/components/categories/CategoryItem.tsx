'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenuFixed as DropdownMenu,
  DropdownMenuContentFixed as DropdownMenuContent,
  DropdownMenuItemFixed as DropdownMenuItem,
  DropdownMenuSeparatorFixed as DropdownMenuSeparator,
  DropdownMenuTriggerFixed as DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu-fixed";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Loader2 } from "lucide-react";
import type { Category } from "./CategoryList";
import { useCategoryMutations } from "@/hooks/useCategoryMutations";

interface CategoryItemProps {
  category: Category;
  level: number;
  onRefetch?: () => void;
}

// Colores para cada nivel
const levelStyles = {
  1: {
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    borderColor: "border-blue-500",
    textColor: "text-blue-600 dark:text-blue-400",
    label: "Principal",
  },
  2: {
    bgColor: "bg-green-500/10 dark:bg-green-500/20",
    borderColor: "border-green-500",
    textColor: "text-green-600 dark:text-green-400",
    label: "Subcategoría",
  },
  3: {
    bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
    borderColor: "border-purple-500",
    textColor: "text-purple-600 dark:text-purple-400",
    label: "Sub-Subcategoría",
  },
};

// Schema de validación para renombrar
const renameSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  slug: z.string().min(1, 'El slug es requerido').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  color: z.string().optional(),
  icono: z.string().max(2, 'Máximo 2 caracteres').optional(),
});

// Schema de validación para crear subcategoría
const createSubcategorySchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  slug: z.string().min(1, 'El slug es requerido').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  color: z.string().optional(),
  icono: z.string().max(2, 'Máximo 2 caracteres').optional(),
});

type RenameFormData = z.infer<typeof renameSchema>;
type CreateSubcategoryFormData = z.infer<typeof createSubcategorySchema>;

export const CategoryItem = ({ category, level, onRefetch }: CategoryItemProps) => {
  const hasChildren = category.children && category.children.length > 0;
  const style = levelStyles[level as keyof typeof levelStyles] || levelStyles[3];
  
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { updateCategory, createSubcategory, deleteCategory } = useCategoryMutations();

  // Form para renombrar
  const renameForm = useForm<RenameFormData>({
    resolver: zodResolver(renameSchema),
    defaultValues: {
      nombre: category.nombre,
      slug: category.slug,
      descripcion: category.descripcion || '',
      color: category.color || '#3b82f6',
      icono: category.icono || '',
    },
  });

  // Form para crear subcategoría
  const createForm = useForm<CreateSubcategoryFormData>({
    resolver: zodResolver(createSubcategorySchema),
    defaultValues: {
      nombre: '',
      slug: '',
      descripcion: '',
      color: '#3b82f6',
      icono: '',
    },
  });

  // Función para generar slug automáticamente
  const generarSlug = (nombre: string) => {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Handler para renombrar
  const handleRename = async (data: RenameFormData) => {
    await updateCategory.mutateAsync({
      id: category.id,
      nombre: data.nombre,
      slug: data.slug,
      descripcion: data.descripcion,
      color: data.color,
      icono: data.icono,
    });
    setRenameDialogOpen(false);
    renameForm.reset();
    onRefetch?.();
  };

  // Handler para crear subcategoría
  const handleCreateSubcategory = async (data: CreateSubcategoryFormData) => {
    await createSubcategory.mutateAsync({
      nombre: data.nombre,
      slug: data.slug,
      descripcion: data.descripcion,
      color: data.color,
      icono: data.icono,
      parent_id: category.id,
      nivel: level + 1,
    });
    setCreateDialogOpen(false);
    createForm.reset();
    onRefetch?.();
  };

  // Handler para eliminar
  const handleDelete = async () => {
    await deleteCategory.mutateAsync({ id: category.id });
    setDeleteDialogOpen(false);
    onRefetch?.();
  };

  const content = (
    <div className="flex items-center justify-between w-full p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {category.icono && (
            <span className="text-xl flex-shrink-0">{category.icono}</span>
          )}
          <span className="font-semibold truncate">{category.nombre}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${style.bgColor} ${style.borderColor} ${style.textColor}`}>
            {style.label}
          </span>
          <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
            {category.slug}
          </span>
          {category.total_hilos !== undefined && (
            <span className="text-xs text-muted-foreground">
              {category.total_hilos} hilo{category.total_hilos !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {level < 3 && (
            <>
              <DropdownMenuItem 
                onSelect={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setCreateDialogOpen(true);
                }}
              >
                Crear Subcategoría
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem 
            onSelect={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setRenameDialogOpen(true);
            }}
          >
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDeleteDialogOpen(true);
            }}
            className="text-red-600 dark:text-red-400"
          >
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      <div className="border rounded-md bg-card">
        {hasChildren ? (
          <Accordion type="single" collapsible>
            <AccordionItem value={category.id} className="border-b-0">
              <AccordionTrigger className="hover:no-underline">
                {content}
              </AccordionTrigger>
              <AccordionContent className="pl-4 sm:pl-8 border-t">
                <div className="space-y-2 py-2 pr-2">
                  {category.children!.map((child) => (
                    <CategoryItem 
                      key={child.id} 
                      category={child} 
                      level={level + 1}
                      onRefetch={onRefetch}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          content
        )}
      </div>

      {/* Dialog para Renombrar/Editar */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>
              Modifica los datos de la categoría "{category.nombre}"
            </DialogDescription>
          </DialogHeader>
          
          <Form {...renameForm}>
            <form onSubmit={renameForm.handleSubmit(handleRename)} className="space-y-4">
              <FormField
                control={renameForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Discusión General" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          // Auto-generar slug
                          renameForm.setValue('slug', generarSlug(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={renameForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug *</FormLabel>
                    <FormControl>
                      <Input placeholder="discusion-general" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL amigable (se genera automáticamente)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={renameForm.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descripción de la categoría..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={renameForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            type="color" 
                            className="w-16 h-10 cursor-pointer"
                            {...field}
                          />
                        </FormControl>
                        <FormControl>
                          <Input 
                            placeholder="#3b82f6"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={renameForm.control}
                  name="icono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icono (emoji)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="📁"
                          maxLength={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setRenameDialogOpen(false)}
                  disabled={updateCategory.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateCategory.isPending}>
                  {updateCategory.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Crear Subcategoría */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Subcategoría</DialogTitle>
            <DialogDescription>
              Nueva subcategoría dentro de "{category.nombre}"
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateSubcategory)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Ayuda y Soporte" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          createForm.setValue('slug', generarSlug(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug *</FormLabel>
                    <FormControl>
                      <Input placeholder="ayuda-y-soporte" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL amigable (se genera automáticamente)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descripción de la subcategoría..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            type="color" 
                            className="w-16 h-10 cursor-pointer"
                            {...field}
                          />
                        </FormControl>
                        <FormControl>
                          <Input 
                            placeholder="#3b82f6"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="icono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icono (emoji)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="📂"
                          maxLength={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={createSubcategory.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createSubcategory.isPending}>
                  {createSubcategory.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Crear Subcategoría
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para Eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la categoría "{category.nombre}"
              {hasChildren && ' y todas sus subcategorías'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCategory.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCategory.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
