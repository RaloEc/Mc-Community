/**
 * Layout para la página de perfil
 * Soporta un slot paralelo @modal para Intercepting Routes
 * Esto permite abrir detalles de partidas en un modal sin desmontar el historial
 */

export default function PerfilLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
