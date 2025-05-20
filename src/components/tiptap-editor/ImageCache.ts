'use client'

// Clase para manejar el almacenamiento temporal de imágenes
export class ImageCache {
  private static instance: ImageCache;
  private imageMap: Map<string, File>;
  private urlMap: Map<string, string>;

  private constructor() {
    this.imageMap = new Map();
    this.urlMap = new Map();
  }

  // Patrón singleton para asegurar una sola instancia
  public static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }

  // Almacenar una imagen y generar una URL temporal
  public storeImage(file: File): string {
    // Generar un ID único para la imagen
    const imageId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Almacenar el archivo
    this.imageMap.set(imageId, file);
    
    // Crear una URL temporal usando URL.createObjectURL
    const tempUrl = URL.createObjectURL(file);
    this.urlMap.set(imageId, tempUrl);
    
    return tempUrl;
  }

  // Verificar si una URL es temporal
  public isTempUrl(url: string): boolean {
    // Verificar si la URL está en nuestro mapa de URLs temporales
    if (Array.from(this.urlMap.values()).includes(url)) {
      return true;
    }
    
    // Verificar si la URL es una URL de objeto (blob:)
    if (url && url.startsWith('blob:')) {
      return true;
    }
    
    return false;
  }

  // Obtener el ID de una URL temporal
  public getImageIdFromUrl(url: string): string | null {
    // Usar Array.from para convertir las entradas del Map a un array
    const entries = Array.from(this.urlMap.entries());
    for (const [id, tempUrl] of entries) {
      if (tempUrl === url) {
        return id;
      }
    }
    return null;
  }

  // Obtener el archivo de una URL temporal
  public getFileFromUrl(url: string): File | null {
    const id = this.getImageIdFromUrl(url);
    if (id) {
      return this.imageMap.get(id) || null;
    }
    return null;
  }

  // Obtener todas las imágenes temporales
  public getAllTempImages(): { id: string, file: File, url: string }[] {
    const result: { id: string, file: File, url: string }[] = [];
    
    // Usar Array.from para convertir las entradas del Map a un array
    const entries = Array.from(this.imageMap.entries());
    for (const [id, file] of entries) {
      const url = this.urlMap.get(id);
      if (url) {
        result.push({ id, file, url });
      }
    }
    
    return result;
  }

  // Limpiar las URLs temporales para evitar fugas de memoria
  public revokeUrls(): void {
    // Usar Array.from para convertir los valores del Map a un array
    const urls = Array.from(this.urlMap.values());
    for (const url of urls) {
      URL.revokeObjectURL(url);
    }
  }

  // Limpiar todas las imágenes y URLs
  public clear(): void {
    this.revokeUrls();
    this.imageMap.clear();
    this.urlMap.clear();
  }
}

// Exportar una instancia única
export const imageCache = ImageCache.getInstance();
