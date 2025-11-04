"use client";

// Extender la interfaz Window para incluir resizingFrame
declare global {
  interface Window {
    resizingFrame: number | null;
  }
}

import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  useEditor,
  EditorContent,
  BubbleMenu,
  FloatingMenu,
} from "@tiptap/react";
import dynamic from "next/dynamic";
import { getDefaultExtensions } from "./extensions";
import { Toolbar, BubbleToolbar, FloatingToolbar } from "./toolbar";
import { LinkDialog, LinkPopover, YoutubeDialog, TableDialog, ColorDialog, ColorPopover } from "./dialogs";

import {
  findAllImages,
  findAllYoutubeVideos,
  uploadImageToSupabase,
  getYoutubeVideoId,
  calculateCharacterCount,
} from "./utils";

import { imageCache } from "./ImageCache";
import { MoveHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Importar estilos
import EditorStyles from "./styles";
import "./youtube-styles.css";
import "./editor-styles.css"; // Estilos específicos para encabezados
import "./code-block-styles.css"; // Estilos para bloques de código con resaltado de sintaxis

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onBlur?: () => void;
  onFocus?: () => void;
  editable?: boolean;
  userColor?: string;
  onImageChange?: (hasTemporaryImages: boolean) => void;
}

// Componente base del editor
const TiptapEditorBase = ({
  value,
  onChange,
  placeholder = "Escribe tu contenido aquí...",
  className = "",
  onBlur,
  onFocus,
  editable = true,
  userColor = "#3b82f6", // Color azul por defecto si no se proporciona
  onImageChange,
}: TiptapEditorProps) => {
  // Referencias
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados
  const [selectedImagePos, setSelectedImagePos] = useState<number | null>(null);
  const [images, setImages] = useState<{ node: any; pos: number }[]>([]);
  const [currentColor, setCurrentColor] = useState<string>("#000000");
  const [currentHighlightColor, setCurrentHighlightColor] =
    useState<string>("#ffcc00");
  // Estados para los diálogos
  // Los estados para el popover de enlaces ahora se manejan en la barra de herramientas
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState<boolean>(false);
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [selectedYoutubePos, setSelectedYoutubePos] = useState<number | null>(
    null
  );
  const [youtubeVideos, setYoutubeVideos] = useState<
    { node: any; pos: number }[]
  >([]);
  const [tableDialogOpen, setTableDialogOpen] = useState<boolean>(false);
  const [tableRows, setTableRows] = useState<number>(3);
  const [tableCols, setTableCols] = useState<number>(3);
  const [currentFontFamily, setCurrentFontFamily] = useState<string>("Arial");
  const [characterCount, setCharacterCount] = useState<{
    characters: number;
    words: number;
  }>({ characters: 0, words: 0 });
  const [mentionSuggestions] = useState<string[]>([
    "admin",
    "editor",
    "usuario",
    "invitado",
  ]);

  // Inicializar el editor
  const editor = useEditor({
    extensions: getDefaultExtensions(mentionSuggestions),
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);

      // Actualizar conteo de caracteres
      const stats = calculateCharacterCount(html);
      setCharacterCount(stats);
    },
    editorProps: {
      attributes: {
        class: "editor-content",
        "data-placeholder": placeholder,
      },
    },
    // Configuración explícita para evitar errores de SSR
    immediatelyRender: false,
  });

  // Función para detectar URLs de X/Twitter
  const detectTwitterUrl = (text: string): string | null => {
    const twitterUrlPattern = /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/g
    const match = text.match(twitterUrlPattern)
    return match ? match[0] : null
  }

  // Función para insertar embed de Twitter
  const insertTwitterEmbed = async (url: string) => {
    if (!editor) return

    try {
      // Insertar el embed inmediatamente (se cargará de forma asíncrona)
      editor.chain().focus().setTwitterEmbed({ url }).run()
    } catch (error) {
      console.error('Error al insertar embed de Twitter:', error)
    }
  }

  // Actualizar imágenes y videos cuando cambie el editor
  useEffect(() => {
    if (editor) {
      const foundImages = findAllImages(editor);
      setImages(foundImages);
      setYoutubeVideos(findAllYoutubeVideos(editor));

      // Actualizar conteo de caracteres
      const stats = calculateCharacterCount(editor.getHTML());
      setCharacterCount(stats);

      // Verificar si hay imágenes temporales y notificar al componente padre
      if (onImageChange) {
        const hasTemporaryImages = foundImages.some(
          (img) =>
            img.node.attrs.src && imageCache.isTempUrl(img.node.attrs.src)
        );
        onImageChange(hasTemporaryImages);
      }

      // Agregar manejador para pegar imágenes y URLs desde el portapapeles
      const handlePaste = async (event: ClipboardEvent) => {
        if (!event.clipboardData) return;

        // Verificar si hay texto en el portapapeles (para URLs de Twitter)
        const text = event.clipboardData.getData('text/plain');
        if (text) {
          const twitterUrl = detectTwitterUrl(text);
          if (twitterUrl) {
            event.preventDefault();
            event.stopPropagation();
            await insertTwitterEmbed(twitterUrl);
            return;
          }
        }

        // Verificar si hay imágenes en el portapapeles
        const items = Array.from(event.clipboardData.items);
        const imageItems = items.filter((item) =>
          item.type.startsWith("image/")
        );

        if (imageItems.length === 0) return;

        // Prevenir el comportamiento por defecto y detener la propagación
        event.preventDefault();
        event.stopPropagation();

        // Guardar la posición actual de desplazamiento
        const scrollPosition = window.scrollY;

        // Procesar cada imagen encontrada (normalmente solo habrá una)
        for (const item of imageItems) {
          const file = item.getAsFile();
          if (!file) continue;

          const loadingDiv = document.createElement("div");
          loadingDiv.id = `tiptap-loading-indicator-${Date.now()}`;
          loadingDiv.textContent = "Subiendo imagen...";
          loadingDiv.style.position = "fixed";
          loadingDiv.style.top = "50%";
          loadingDiv.style.left = "50%";
          loadingDiv.style.transform = "translate(-50%, -50%)";
          loadingDiv.style.backgroundColor = "rgba(0,0,0,0.7)";
          loadingDiv.style.color = "white";
          loadingDiv.style.padding = "10px 20px";
          loadingDiv.style.borderRadius = "4px";
          loadingDiv.style.zIndex = "1000";
          document.body.appendChild(loadingDiv);

          try {
            // Subir la imagen a Supabase y obtener la URL pública
            const imageUrl = await uploadImageToSupabase(
              file,
              "foro/contenido"
            );
            
            console.log('[handlePaste] URL recibida de uploadImageToSupabase:', imageUrl ? imageUrl.substring(0, 50) : 'null');
            console.log('[handlePaste] Llamando a setImageWithCaption con:', { src: imageUrl, alt: file.name, title: file.name });

            // Insertar la imagen con descripción en el editor
            editor
              .chain()
              .focus()
              .setImageWithCaption({
                src: imageUrl,
                alt: file.name,
                title: file.name,
              })
              .run();
              
            console.log('[handlePaste] setImageWithCaption ejecutado');

            // Restaurar la posición de desplazamiento
            window.scrollTo(0, scrollPosition);
          } catch (error) {
            console.error("Error al subir la imagen pegada:", error);
            alert("Error al subir la imagen. Por favor, inténtalo de nuevo.");
          } finally {
            // Quitar el indicador de carga
            loadingDiv.remove();
          }
        }
      };

      // Agregar el event listener al elemento del editor
      const editorElement = document.querySelector(".ProseMirror");
      editorElement?.addEventListener("paste", handlePaste as EventListener);

      // Limpiar el event listener y el caché cuando se desmonte el componente
      return () => {
        editorElement?.removeEventListener(
          "paste",
          handlePaste as EventListener
        );
        // Revocar las URLs de objetos para evitar fugas de memoria
        imageCache.revokeUrls();
      };
    }
  }, [editor]);

  // Manejador para seleccionar una imagen
  const handleImageClick = useCallback(
    (event: MouseEvent) => {
      if (!editor) return;

      const target = event.target as HTMLElement;
      if (target.tagName === "IMG") {
        // Encontrar la posición de la imagen en el documento
        const imageElement =
          target.closest(".ProseMirror-selectednode") || target;
        const images = findAllImages(editor);

        const clickedImage = images.find((img) => {
          const imgElement = document.querySelector(
            `img[src="${img.node.attrs.src}"]`
          );
          return imgElement === imageElement;
        });

        if (clickedImage) {
          setSelectedImagePos(clickedImage.pos);

          // Posicionar el toolkit junto a la imagen
          setTimeout(() => {
            const toolkit = document.querySelector(
              ".image-toolkit"
            ) as HTMLElement;
            const imgRect = target.getBoundingClientRect();
            toolkit.style.top = `${imgRect.top + window.scrollY - 40}px`;
            toolkit.style.left = `${imgRect.left + window.scrollY}px`;
          }, 10);
        }
      } else if (!target.closest(".image-toolkit")) {
        setSelectedImagePos(null);
      }
    },
    [editor]
  );

  // Manejador para seleccionar un video de YouTube
  const handleYoutubeClick = useCallback(
    (event: MouseEvent) => {
      if (!editor) return;

      const target = event.target as HTMLElement;
      if (target.tagName === "IFRAME") {
        // Encontrar la posición del video en el documento
        const youtubeElement =
          target.closest(".ProseMirror-selectednode") || target;
        const videos = findAllYoutubeVideos(editor);

        const clickedVideo = videos.find((video) => {
          const videoElement = document.querySelector(
            `iframe[src*="${video.node.attrs.src}"]`
          );
          return videoElement === target;
        });

        if (clickedVideo) {
          setSelectedYoutubePos(clickedVideo.pos);
        }
      } else if (!target.closest(".youtube-toolkit")) {
        setSelectedYoutubePos(null);
      }
    },
    [editor]
  );

  // Agregar event listeners
  useEffect(() => {
    document.addEventListener("click", handleImageClick);
    document.addEventListener("click", handleYoutubeClick);

    return () => {
      document.removeEventListener("click", handleImageClick);
      document.removeEventListener("click", handleYoutubeClick);
    };
  }, [handleImageClick, handleYoutubeClick]);

  // Manejadores para los diálogos
  // El manejador de enlaces ahora se maneja directamente en la barra de herramientas

  // El manejador de guardar enlaces ahora se maneja directamente en la barra de herramientas

  const handleOpenYoutubeDialog = useCallback(() => {
    setYoutubeUrl("");
    setYoutubeDialogOpen(true);
  }, []);

  const handleSaveYoutube = useCallback(() => {
    if (!editor) return;

    const videoId = getYoutubeVideoId(youtubeUrl);

    if (videoId) {
      editor
        .chain()
        .focus()
        .setYoutubeVideo({
          src: videoId,
          width: 640,
          height: 360,
        })
        .run();

      setYoutubeDialogOpen(false);
    }
  }, [editor, youtubeUrl]);

  const handleOpenTableDialog = useCallback(() => {
    setTableRows(3);
    setTableCols(3);
    setTableDialogOpen(true);
  }, []);

  const handleSaveTable = useCallback(() => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true })
      .run();

    setTableDialogOpen(false);
  }, [editor, tableRows, tableCols]);

  // Manejador para subir imágenes
  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!editor || !event.target.files || event.target.files.length === 0)
        return;

      const file = event.target.files[0];

      try {
        // Mostrar indicador de carga - usando un enfoque alternativo
        const loadingDiv = document.createElement("div");
        loadingDiv.id = "tiptap-loading-indicator";
        loadingDiv.textContent = "Subiendo imagen...";
        loadingDiv.style.position = "absolute";
        loadingDiv.style.top = "50%";
        loadingDiv.style.left = "50%";
        loadingDiv.style.transform = "translate(-50%, -50%)";
        loadingDiv.style.backgroundColor = "rgba(0,0,0,0.7)";
        loadingDiv.style.color = "white";
        loadingDiv.style.padding = "10px 20px";
        loadingDiv.style.borderRadius = "4px";
        loadingDiv.style.zIndex = "1000";
        document.body.appendChild(loadingDiv);

        // Subir imagen a Supabase
        const imageUrl = await uploadImageToSupabase(file);
        console.log('[handleImageUpload] URL recibida de uploadImageToSupabase:', imageUrl ? imageUrl.substring(0, 50) : 'null');
        console.log('[handleImageUpload] Llamando a setImageWithCaption con:', { src: imageUrl, alt: file.name, title: file.name });

        // Insertar imagen con descripción en el editor
        editor.chain().focus().setImageWithCaption({ 
          src: imageUrl,
          alt: file.name,
          title: file.name 
        }).run();
        console.log('[handleImageUpload] setImageWithCaption ejecutado');

        // Limpiar input de archivo
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Error al subir imagen:", error);
        alert("Error al subir la imagen. Por favor, inténtalo de nuevo.");
      } finally {
        // Quitar indicador de carga
        const loadingDiv = document.getElementById("tiptap-loading-indicator");
        if (loadingDiv) {
          loadingDiv.remove();
        }
      }
    },
    [editor]
  );

  // Manejadores para las acciones de imagen
  const handleRemoveImage = useCallback(() => {
    if (!editor || selectedImagePos === null) return;

    editor
      .chain()
      .focus()
      .deleteRange({ from: selectedImagePos, to: selectedImagePos + 1 })
      .run();

    setSelectedImagePos(null);
  }, [editor, selectedImagePos]);

  // Manejadores para las acciones de video de YouTube
  const handleRemoveYoutube = useCallback(() => {
    if (!editor || selectedYoutubePos === null) return;

    editor
      .chain()
      .focus()
      .deleteRange({ from: selectedYoutubePos, to: selectedYoutubePos + 1 })
      .run();

    setSelectedYoutubePos(null);
  }, [editor, selectedYoutubePos]);

  // Usar las variables CSS globales en lugar de estilos en línea
  // para mantener la consistencia en toda la aplicación
  const editorStyles = {
    // No necesitamos establecer las variables aquí ya que se manejan globalmente
  } as React.CSSProperties;

  // Renderizar el editor
  return (
    <div className="tiptap-editor" style={editorStyles}>
      {/* Nuevo contenedor para la barra de herramientas y el área de edición */}
      <div className="editor-container">
        {/* Barra de herramientas */}
        <Toolbar
          editor={editor}
          onImageClick={() => fileInputRef.current?.click()}
          onColorClick={() => {}}
          onHighlightColorClick={() => {}}
          onLinkClick={() => {}}
          onYoutubeClick={handleOpenYoutubeDialog}
          onTableClick={handleOpenTableDialog}
          currentFontFamily={currentFontFamily}
          setCurrentFontFamily={setCurrentFontFamily}
          onClearFormatting={() => {
            editor?.chain().focus().unsetAllMarks().clearNodes().run();
          }}
        />

        {/* Contenido del editor */}
        <EditorContent editor={editor} />
      </div>

      {/* Contador de caracteres */}
      <div className="character-count">
        {characterCount.characters} caracteres | {characterCount.words} palabras
      </div>

      {/* Menú flotante (aparece al seleccionar texto) - Deshabilitado por solicitud del usuario */}
      {/* {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <BubbleToolbar editor={editor} />
        </BubbleMenu>
      )} */}

      {/* Menú flotante (aparece al inicio de una línea vacía) */}
      {editor && (
        <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <FloatingToolbar editor={editor} />
        </FloatingMenu>
      )}

      {/* Toolkit para imágenes seleccionadas */}
      {selectedImagePos !== null && (
        <div
          className="image-toolkit"
          style={{ position: "absolute", zIndex: 100 }}
        >
          <Button
            variant="destructive"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRemoveImage();
            }}
            title="Eliminar imagen"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Toolkit para videos de YouTube seleccionados */}
      {selectedYoutubePos !== null && (
        <div className="youtube-toolkit">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemoveYoutube}
            title="Eliminar video"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input oculto para subir imágenes */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageUpload}
        multiple
      />

      {/* Los menús desplegables de color se implementan directamente en la barra de herramientas */}

      {/* El menú desplegable para insertar enlaces ahora se maneja en la barra de herramientas */}

      {/* Diálogo para insertar videos de YouTube */}
      <YoutubeDialog
        open={youtubeDialogOpen}
        url={youtubeUrl}
        onClose={() => setYoutubeDialogOpen(false)}
        onUrlChange={setYoutubeUrl}
        onSave={handleSaveYoutube}
      />

      {/* Diálogo para insertar tablas */}
      <TableDialog
        open={tableDialogOpen}
        rows={tableRows}
        cols={tableCols}
        onClose={() => setTableDialogOpen(false)}
        onRowsChange={setTableRows}
        onColsChange={setTableCols}
        onSave={handleSaveTable}
      />

      {/* Los estilos del editor ahora se cargan desde globals.css */}
      <EditorStyles />
    </div>
  );
};

// Exportar el componente con carga dinámica para evitar SSR
export default dynamic(() => Promise.resolve(TiptapEditorBase), {
  ssr: false,
});
