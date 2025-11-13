"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SubscriptionSection() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  if (loading) {
    return null;
  }

  if (user) {
    return null;
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para suscribirse
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <div className="hidden md:block bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 p-6 rounded-lg mt-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 mb-4">
          <Mail className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Mantente actualizado
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Recibe las últimas noticias y actualizaciones directamente en tu
          bandeja de entrada
        </p>

        {subscribed ? (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-md">
            ¡Gracias por suscribirte! Pronto recibirás nuestras noticias.
          </div>
        ) : (
          <form
            onSubmit={handleSubscribe}
            className="flex max-w-md mx-auto gap-2"
          >
            <Input
              type="email"
              placeholder="Tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 min-w-0"
              required
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Suscribirse
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
