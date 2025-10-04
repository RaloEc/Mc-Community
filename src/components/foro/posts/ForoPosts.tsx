"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import PostCard from "./PostCard";
import PostForm from "./PostForm";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import type { ForoPostConAutor } from "@/types/foro";
import { useForoPosts, useCreatePost, useUpdatePost, useDeletePost, useMarkSolution } from "../hooks/useForoPosts";

interface ForoPostsProps {
  hiloId: string;
  autorHiloId: string;
  hiloCerrado?: boolean;
}

export default function ForoPosts({
  hiloId,
  autorHiloId,
  hiloCerrado = false,
}: ForoPostsProps) {
  const { user } = useAuth();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [postRespondiendoId, setPostRespondiendoId] = useState<string | null>(null);
  const [postEditandoId, setPostEditandoId] = useState<string | null>(null);

  // Hooks de React Query
  const { data: posts, isLoading, error } = useForoPosts(hiloId);
  const createPostMutation = useCreatePost();
  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();
  const markSolutionMutation = useMarkSolution();

  const esAutorHilo = user?.id === autorHiloId;

  const handleCrearPost = async (contenido: string) => {
    if (!user) {
      alert("Debes iniciar sesión para responder");
      return;
    }

    await createPostMutation.mutateAsync({
      contenido,
      hilo_id: hiloId,
      post_padre_id: postRespondiendoId,
    });

    setMostrarFormulario(false);
    setPostRespondiendoId(null);
  };

  const handleEditarPost = async (postId: string, contenido: string) => {
    await updatePostMutation.mutateAsync({
      postId,
      data: { contenido },
    });
    setPostEditandoId(null);
  };

  const handleEliminarPost = async (postId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta respuesta?")) {
      return;
    }
    await deletePostMutation.mutateAsync(postId);
  };

  const handleMarcarSolucion = async (postId: string) => {
    await markSolutionMutation.mutateAsync({ hiloId, postId });
  };

  const handleResponder = (postId: string) => {
    setPostRespondiendoId(postId);
    setMostrarFormulario(true);
  };

  // Organizar posts en estructura jerárquica
  const organizarPosts = (posts: ForoPostConAutor[]): ForoPostConAutor[] => {
    const postsMap = new Map<string, ForoPostConAutor>();
    const postsPrincipales: ForoPostConAutor[] = [];

    // Crear mapa de posts
    posts.forEach((post) => {
      postsMap.set(post.id, { ...post, respuestas: [] });
    });

    // Organizar jerarquía
    posts.forEach((post) => {
      const postConRespuestas = postsMap.get(post.id)!;
      
      if (post.post_padre_id) {
        const padre = postsMap.get(post.post_padre_id);
        if (padre) {
          if (!padre.respuestas) padre.respuestas = [];
          padre.respuestas.push(postConRespuestas);
        } else {
          // Si no encuentra el padre, lo pone como principal
          postsPrincipales.push(postConRespuestas);
        }
      } else {
        postsPrincipales.push(postConRespuestas);
      }
    });

    return postsPrincipales;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">
          Error al cargar las respuestas: {error.message}
        </p>
      </div>
    );
  }

  const postsOrganizados = posts ? organizarPosts(posts) : [];
  const totalPosts = posts?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header de respuestas */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare size={24} />
          {totalPosts} {totalPosts === 1 ? "Respuesta" : "Respuestas"}
        </h2>

        {!hiloCerrado && user && !mostrarFormulario && (
          <Button onClick={() => setMostrarFormulario(true)}>
            <MessageSquare size={16} className="mr-2" />
            Responder
          </Button>
        )}
      </div>

      {/* Formulario de nueva respuesta */}
      {mostrarFormulario && !hiloCerrado && user && (
        <div className="bg-white dark:bg-black amoled:bg-black rounded-lg border border-gray-200 dark:border-gray-700 amoled:border-gray-800 p-4">
          <h3 className="font-semibold mb-3">
            {postRespondiendoId ? "Responder a comentario" : "Nueva respuesta"}
          </h3>
          <PostForm
            hiloId={hiloId}
            postPadreId={postRespondiendoId}
            onSubmit={handleCrearPost}
            onCancel={() => {
              setMostrarFormulario(false);
              setPostRespondiendoId(null);
            }}
          />
        </div>
      )}

      {/* Mensaje si el hilo está cerrado */}
      {hiloCerrado && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-300">
            Este hilo está cerrado. No se pueden agregar nuevas respuestas.
          </p>
        </div>
      )}

      {/* Lista de posts */}
      {postsOrganizados.length > 0 ? (
        <div className="space-y-4">
          {postsOrganizados.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              esAutorHilo={esAutorHilo}
              puedeEditar={user?.id === post.autor_id}
              puedeEliminar={user?.id === post.autor_id || esAutorHilo}
              puedeMarcarSolucion={esAutorHilo && !post.es_solucion}
              onResponder={!hiloCerrado ? handleResponder : undefined}
              onEditar={(postId) => setPostEditandoId(postId)}
              onEliminar={handleEliminarPost}
              onMarcarSolucion={handleMarcarSolucion}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 amoled:bg-gray-950 rounded-lg">
          <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Aún no hay respuestas en este hilo
          </p>
          {!hiloCerrado && user && (
            <Button onClick={() => setMostrarFormulario(true)}>
              Sé el primero en responder
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
