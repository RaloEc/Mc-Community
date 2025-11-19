"use client";

import React from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import TablaReportesNoticias from "@/components/admin/noticias/TablaReportesNoticias";

export default function ReportesNoticias() {
  const { isAdmin, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reportes de Noticias</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona los reportes de noticias y comentarios inapropiados
        </p>
      </div>

      <TablaReportesNoticias />
    </div>
  );
}
