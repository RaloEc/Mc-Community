"use client";

import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import FABMobile from "@/components/ui/FABMobile";
import { ReactQueryProvider } from "@/lib/react-query/provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Providers({
  children,
  session,
  userColor,
}: {
  children: React.ReactNode;
  session?: any;
  userColor?: string;
}) {
  return (
    <ErrorBoundary>
      <ReactQueryProvider>
        <ThemeProvider userColor={userColor}>
          <AuthProvider session={session}>
            {children}
            <Toaster />
            {/* Botón flotante global solo móvil */}
            {/* <FABMobile /> */}
          </AuthProvider>
        </ThemeProvider>
      </ReactQueryProvider>
    </ErrorBoundary>
  );
}
