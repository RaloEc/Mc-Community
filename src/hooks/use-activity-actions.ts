import { useState } from "react";
import { toast } from "sonner";

interface ActivityActionOptions {
  activityType: string;
  activityId: string;
}

export function useActivityActions() {
  const [isLoading, setIsLoading] = useState(false);

  const hideActivity = async (options: ActivityActionOptions) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user-activity/hide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al ocultar actividad");
      }

      toast.success("Actividad ocultada");
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unhideActivity = async (options: ActivityActionOptions) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user-activity/unhide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al mostrar actividad");
      }

      toast.success("Actividad mostrada");
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteActivity = async (options: ActivityActionOptions) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user-activity/admin-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar actividad");
      }

      toast.success("Actividad eliminada");
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hideActivity,
    unhideActivity,
    deleteActivity,
    isLoading,
  };
}
