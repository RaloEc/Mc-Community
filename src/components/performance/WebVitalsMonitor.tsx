"use client";

import { useEffect } from "react";

/**
 * Componente para monitorear Web Vitals en desarrollo
 * Registra métricas de performance en la consola
 */
export function WebVitalsMonitor() {
  useEffect(() => {
    // Solo ejecutar en desarrollo
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    // Importar dinámicamente web-vitals v4
    import("web-vitals").then((module) => {
      const { getCLS, getFCP, getLCP, getTTFB, getINP } = module as any;

      // Cumulative Layout Shift
      if (getCLS) {
        getCLS((metric: any) => {
          console.log("📊 CLS (Cumulative Layout Shift):", {
            value: metric.value.toFixed(4),
            rating: metric.rating,
            delta: metric.delta.toFixed(4),
          });
        });
      }

      // Interaction to Next Paint (reemplaza FID en v4)
      if (getINP) {
        getINP((metric: any) => {
          console.log("⚡ INP (Interaction to Next Paint):", {
            value: `${metric.value.toFixed(2)}ms`,
            rating: metric.rating,
            delta: `${metric.delta.toFixed(2)}ms`,
          });
        });
      }

      // First Contentful Paint
      if (getFCP) {
        getFCP((metric: any) => {
          console.log("🎨 FCP (First Contentful Paint):", {
            value: `${metric.value.toFixed(2)}ms`,
            rating: metric.rating,
            delta: `${metric.delta.toFixed(2)}ms`,
          });
        });
      }

      // Largest Contentful Paint
      if (getLCP) {
        getLCP((metric: any) => {
          console.log("📏 LCP (Largest Contentful Paint):", {
            value: `${metric.value.toFixed(2)}ms`,
            rating: metric.rating,
            delta: `${metric.delta.toFixed(2)}ms`,
          });
        });
      }

      // Time to First Byte
      if (getTTFB) {
        getTTFB((metric: any) => {
          console.log("🌐 TTFB (Time to First Byte):", {
            value: `${metric.value.toFixed(2)}ms`,
            rating: metric.rating,
            delta: `${metric.delta.toFixed(2)}ms`,
          });
        });
      }
    });

    // Monitorear Performance API
    if ("PerformanceObserver" in window) {
      try {
        // Observar navegación
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === "navigation") {
              const navTiming = entry as PerformanceNavigationTiming;
              console.log("🚀 Navigation Timing:", {
                "DNS Lookup": `${(
                  navTiming.domainLookupEnd - navTiming.domainLookupStart
                ).toFixed(2)}ms`,
                "TCP Connection": `${(
                  navTiming.connectEnd - navTiming.connectStart
                ).toFixed(2)}ms`,
                "Request Time": `${(
                  navTiming.responseStart - navTiming.requestStart
                ).toFixed(2)}ms`,
                "Response Time": `${(
                  navTiming.responseEnd - navTiming.responseStart
                ).toFixed(2)}ms`,
                "DOM Interactive": `${(
                  navTiming.domInteractive - navTiming.fetchStart
                ).toFixed(2)}ms`,
                "DOM Complete": `${(
                  navTiming.domComplete - navTiming.fetchStart
                ).toFixed(2)}ms`,
                "Load Complete": `${(
                  navTiming.loadEventEnd - navTiming.fetchStart
                ).toFixed(2)}ms`,
              });
            }
          });
        });

        navObserver.observe({ entryTypes: ["navigation"] });

        // Observar recursos
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const resources = entries.filter(
            (entry) => entry.entryType === "resource"
          );

          if (resources.length > 0) {
            console.log(
              "📦 Resource Timing:",
              resources.map((resource) => ({
                name: resource.name.split("/").pop(),
                duration: `${resource.duration.toFixed(2)}ms`,
                size: `${(
                  (resource as PerformanceResourceTiming).transferSize / 1024
                ).toFixed(2)}KB`,
              }))
            );
          }
        });

        resourceObserver.observe({ entryTypes: ["resource"] });

        // Observar pintura
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            console.log(
              `🎨 Paint Timing (${entry.name}):`,
              `${entry.startTime.toFixed(2)}ms`
            );
          });
        });

        paintObserver.observe({ entryTypes: ["paint"] });
      } catch (error) {
        console.warn("Performance Observer no disponible:", error);
      }
    }

    // Monitorear memoria (si está disponible)
    if ("memory" in performance) {
      const memInfo = (performance as any).memory;
      console.log("💾 Memory Usage:", {
        "Used JS Heap": `${(memInfo.usedJSHeapSize / 1048576).toFixed(2)}MB`,
        "Total JS Heap": `${(memInfo.totalJSHeapSize / 1048576).toFixed(2)}MB`,
        "Heap Limit": `${(memInfo.jsHeapSizeLimit / 1048576).toFixed(2)}MB`,
      });
    }
  }, []);

  return null; // Este componente solo monitorea, no renderiza nada
}

export default WebVitalsMonitor;
