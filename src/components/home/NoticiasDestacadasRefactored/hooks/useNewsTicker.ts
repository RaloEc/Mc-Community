import { useState, useEffect } from "react";
import { TickerMessage } from "../types";
import { MENSAJES_TICKER_DEFAULT, MENSAJES_TICKER_ERROR } from "../constants";

export function useNewsTicker() {
  const [messages, setMessages] = useState<TickerMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTickerMessages = async () => {
      try {
        const response = await fetch("/api/admin/news-ticker");

        // ✅ Verificar status de respuesta
        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Error al cargar ticker: Status ${response.status}`,
            errorText.substring(0, 200)
          );
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // ✅ Parsear JSON solo si la respuesta es válida
        const data = await response.json();

        // Filtrar solo mensajes activos y con contenido
        const activeMessages = data
          .filter((msg: any) => msg.activo && msg.mensaje?.trim())
          .sort((a: any, b: any) => a.orden - b.orden);

        if (activeMessages.length > 0) {
          setMessages(activeMessages);
        } else {
          // Mensajes predeterminados en caso de que no haya ninguno configurado
          setMessages(MENSAJES_TICKER_DEFAULT);
        }
      } catch (error) {
        console.error("Error al cargar el ticker de noticias:", error);
        // Mensajes de respaldo en caso de error
        setMessages(MENSAJES_TICKER_ERROR);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickerMessages();

    // Actualizar el ticker cada 5 minutos
    const interval = setInterval(fetchTickerMessages, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { messages, isLoading };
}
