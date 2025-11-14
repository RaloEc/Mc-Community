"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { UserActivityFeed } from "./UserActivityFeed";
import { Spinner } from "@nextui-org/react";

interface ActivityItem {
  id: string;
  type: "noticia" | "comentario" | "hilo" | "respuesta";
  title: string;
  preview?: string;
  timestamp: string;
  category: string;
}

interface UserActivityFeedContainerProps {
  fetchActivities: (page: number, limit: number) => Promise<ActivityItem[]>;
  userColor?: string;
  initialPage?: number;
  itemsPerPage?: number;
}

export const UserActivityFeedContainer = ({
  fetchActivities,
  userColor = "#3b82f6",
  initialPage = 1,
  itemsPerPage = 10,
}: UserActivityFeedContainerProps) => {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadActivities = useCallback(
    async (page: number, append: boolean = false) => {
      try {
        if (page === 1) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const newItems = await fetchActivities(page, itemsPerPage);

        if (append) {
          setItems((prev) => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }

        setHasMore(newItems.length === itemsPerPage);
      } catch (error) {
        console.error("Error loading activities:", error);
        if (page === 1) {
          setItems([]);
        }
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [fetchActivities, itemsPerPage]
  );

  // Cargar actividades iniciales
  useEffect(() => {
    loadActivities(1, false);
  }, []);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !isLoading
        ) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading]);

  // Cargar más cuando cambia la página
  useEffect(() => {
    if (currentPage > 1) {
      loadActivities(currentPage, true);
    }
  }, [currentPage]);

  return (
    <div className="space-y-6">
      <UserActivityFeed
        items={items}
        userColor={userColor}
        isLoading={isLoading && items.length === 0}
      />

      {/* Indicador de carga al final */}
      <div ref={observerTarget} className="flex justify-center py-4">
        {isLoadingMore && <Spinner size="sm" />}
        {!hasMore && items.length > 0 && (
          <p className="text-sm text-muted-foreground">
            No hay más actividades
          </p>
        )}
      </div>
    </div>
  );
};

export default UserActivityFeedContainer;
