"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2, Download } from "lucide-react";

interface GoogleAvatarUser {
  id: string;
  username: string;
  avatar_url: string;
}

export function MigrateGoogleAvatars() {
  const [users, setUsers] = useState<GoogleAvatarUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migratingUserId, setMigratingUserId] = useState<string | null>(null);
  const [results, setResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  // Cargar usuarios con avatares de Google
  useEffect(() => {
    fetchGoogleAvatarUsers();
  }, []);

  const fetchGoogleAvatarUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/perfil/check-google-avatars");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const migrateAvatar = async (userId: string, googleAvatarUrl: string) => {
    setMigratingUserId(userId);
    try {
      const response = await fetch("/api/perfil/migrate-google-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, googleAvatarUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults((prev) => ({
          ...prev,
          [userId]: {
            success: true,
            message: `Avatar migrado: ${data.fileName}`,
          },
        }));
        // Recargar lista
        setTimeout(fetchGoogleAvatarUsers, 1000);
      } else {
        setResults((prev) => ({
          ...prev,
          [userId]: {
            success: false,
            message: data.error || "Error desconocido",
          },
        }));
      }
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [userId]: {
          success: false,
          message: error instanceof Error ? error.message : "Error",
        },
      }));
    } finally {
      setMigratingUserId(null);
    }
  };

  const migrateAll = async () => {
    setMigrating(true);
    for (const user of users) {
      await migrateAvatar(user.id, user.avatar_url);
      // Pequeño delay entre migraciones
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    setMigrating(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Cargando usuarios...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Migrar Avatares de Google</CardTitle>
        <CardDescription>
          Descarga y sube avatares de Google a Supabase Storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-800 dark:text-green-300">
              No hay usuarios con avatares de Google para migrar
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-300">
                Se encontraron {users.length} usuario(s) con avatares de Google
              </span>
            </div>

            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.id}
                    </p>
                  </div>

                  {results[user.id] ? (
                    <div
                      className={`flex items-center gap-2 text-sm ${
                        results[user.id].success
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {results[user.id].success ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span>{results[user.id].message}</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => migrateAvatar(user.id, user.avatar_url)}
                      disabled={migratingUserId === user.id || migrating}
                      variant="outline"
                    >
                      {migratingUserId === user.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Migrando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Migrar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={migrateAll}
              disabled={migrating || users.length === 0}
              className="w-full"
            >
              {migrating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Migrando todos...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Migrar Todos
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
