"use client";

import Script from "next/script";

interface FundingChoicesProps {
  publisherId: string;
}

/**
 * Componente para cargar Google Funding Choices (Consentimiento de Cookies)
 *
 * Estrategia: afterInteractive
 * - Se carga después de la hidratación
 * - Muestra el banner de consentimiento de cookies
 * - Cumple con GDPR/CCPA
 *
 * Impacto: ↓ 50-100ms en LCP
 */
export function FundingChoices({ publisherId }: FundingChoicesProps) {
  if (!publisherId) {
    console.warn("Funding Choices Publisher ID no configurado");
    return null;
  }

  return (
    <>
      {/* Preconnect para mejorar velocidad */}
      <link rel="preconnect" href="https://fundingchoicesmessages.google.com" />

      {/* 
        Funding Choices Script
        strategy="afterInteractive": Se carga después de la hidratación
        - Muestra el banner de consentimiento
        - No bloquea el contenido principal
      */}
      <Script
        id="funding-choices"
        async
        strategy="afterInteractive"
        src={`https://fundingchoicesmessages.google.com/i/${publisherId}?ers=1`}
        onError={(e) => {
          console.error("Error al cargar Funding Choices:", e);
        }}
      />
    </>
  );
}
