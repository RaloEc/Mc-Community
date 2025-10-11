"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ForoHiloRelacionado } from "@/types/foro";

interface HilosRelacionadosInlineProps {
  categoriaId: string;
  categoriaNombre: string;
  hiloActualId: string;
  hilosRelacionadosIniciales?: ForoHiloRelacionado[];
}

export default function HilosRelacionadosInline({
  categoriaId,
  categoriaNombre,
  hiloActualId,
  hilosRelacionadosIniciales = [],
}: HilosRelacionadosInlineProps) {
  const { data: hilosRelacionados } = useQuery({
    queryKey: ["hilos-relacionados", categoriaId, hiloActualId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("foro_hilos")
        .select("id, slug, titulo")
        .eq("categoria_id", categoriaId)
        .neq("id", hiloActualId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw new Error(error.message);
      return (data as ForoHiloRelacionado[]) || [];
    },
    initialData: hilosRelacionadosIniciales,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <section className="mt-6">
      <div className="bg-white dark:bg-black amoled:bg-black rounded-lg border border-gray-200 dark:border-gray-700 amoled:border-gray-800 p-4">
        <h3 className="font-semibold mb-3">Más en {categoriaNombre}</h3>
        <ul className="space-y-2">
          {hilosRelacionados && hilosRelacionados.length > 0 ? (
            hilosRelacionados.map((hilo) => (
              <li key={hilo.id}>
                <Link
                  className="text-sm text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 line-clamp-2"
                  href={`/foro/hilos/${hilo.slug ?? hilo.id}`}
                  prefetch={false}
                >
                  {hilo.titulo}
                </Link>
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-600 dark:text-gray-300 amoled:text-gray-200">
              No hay hilos relacionados.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
