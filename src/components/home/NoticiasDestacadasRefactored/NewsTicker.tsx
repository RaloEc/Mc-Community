"use client";

import { Bell } from "lucide-react";
import { useNewsTicker } from "./hooks/useNewsTicker";
import { TickerMessage } from "./types";

interface NewsTickerProps {
  userColor: string;
}

export function NewsTicker({ userColor }: NewsTickerProps) {
  const { messages, isLoading } = useNewsTicker();

  const handleMessageClick = (message: TickerMessage) => {
    if (message.noticia) {
      // Abrir la noticia en una nueva pestaña
      window.open(
        `/noticias/${message.noticia.slug || message.noticia.id}`,
        "_blank"
      );
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex items-center text-white text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4 rounded-t-lg w-full"
        style={{
          background: `linear-gradient(to right, ${userColor}80, ${userColor}cc)`,
        }}
      >
        <div className="flex items-center font-medium mr-2 sm:mr-4">
          <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="text-xs sm:text-sm">NOTICIAS</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="whitespace-nowrap">
            <span className="inline-block mr-4 sm:mr-8 text-ellipsis overflow-hidden max-w-[80vw] sm:max-w-none">
              Cargando noticias...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return null; // No mostrar el ticker si no hay mensajes
  }

  return (
    <div
      className="flex items-center text-white text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4 rounded-t-lg w-full overflow-hidden"
      style={{
        background: `linear-gradient(to right, ${userColor}80, ${userColor}cc)`,
      }}
    >
      <div className="flex items-center font-medium mr-2 sm:mr-4 whitespace-nowrap">
        <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
        <span className="text-xs sm:text-sm">NOTICIAS</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee text-ellipsis">
          {messages.map((message) => (
            <span
              key={message.id}
              className={`inline-block mr-4 sm:mr-8 ${
                message.noticia ? "cursor-pointer hover:underline" : ""
              } text-ellipsis overflow-hidden max-w-[80vw] sm:max-w-none`}
              onClick={() => message.noticia && handleMessageClick(message)}
              style={message.noticia ? { color: "white" } : {}}
            >
              {message.mensaje}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
