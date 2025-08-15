"use client";
import Link from "next/link";
import { User, Globe, Users, Lock, Unlock } from "lucide-react";
import CriarSalaForm from "@/components/CriarSalaForm";
import DicasCard from "@/components/DicasCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useRouter } from "next/router";

export default function CriarSala() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAuth = async () => {
    try {
      const token = localStorage.getItem("supabase.auth.token");
      console.log("🧪 Testando autenticação...");

      const response = await fetch("http://localhost:3001/api/test-auth", {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      console.log("📊 Status da resposta do teste:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Teste de autenticação passou:", data);
        alert("✅ Autenticação funcionando!");
      } else {
        const error = await response.json();
        console.error("❌ Teste de autenticação falhou:", error);
        alert("❌ Falha na autenticação: " + error.error);
      }
    } catch (error) {
      console.error("💥 Erro no teste:", error);
      alert("💥 Erro no teste: " + (error as Error).message);
    }
  };

  const handleCriarSala = async (formData: any) => {
    if (!user) {
      setError("Usuário não autenticado");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("Criando sala:", formData);

      const token = localStorage.getItem("supabase.auth.token");
      console.log("Token encontrado no localStorage:", token ? "Sim" : "Não");
      console.log(
        "Token (primeiros 20 chars):",
        token ? token.substring(0, 20) + "..." : "Nenhum"
      );

      // Verificar se o usuário está logado
      const user = localStorage.getItem("user");
      console.log(
        "Usuário no localStorage:",
        user ? JSON.parse(user) : "Nenhum"
      );

      // Temporariamente removendo autenticação para testar
      console.log(
        "🧪 Criando sala SEM autenticação para testar middleware temporário"
      );
      const response = await fetch("http://localhost:3001/api/salas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: formData.nome,
          maxJogadores: formData.maxJogadores,
          privada: formData.privada || false,
        }),
      });

      console.log("Status da resposta:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar sala");
      }

      const result = await response.json();
      console.log("Sala criada com sucesso:", result);

      // Redirecionar para o lobby da sala criada
      if (result.redirectTo) {
        alert("Sala criada com sucesso! Redirecionando para o lobby...");
        router.push(result.redirectTo);
      } else {
        // Fallback: redirecionar para /salas se não houver redirectTo
        alert("Sala criada com sucesso! Redirecionando...");
        router.push("/salas");
      }
    } catch (err: any) {
      console.error("Erro ao criar sala:", err);
      setError(err.message || "Erro ao criar sala. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-orange-600 flex flex-col items-center justify-center p-4">
        {user && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
            <p className="text-sm text-gray-700">
              Olá,{" "}
              <span className="font-semibold">{user.nome || user.email}</span>!
            </p>
          </div>
        )}

        <div className="w-full max-w-md bg-white shadow-2xl rounded-lg">
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              Criar Nova Sala
            </h1>

            <div className="flex items-center justify-center gap-2 mb-6">
              <Globe className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Idioma:</span>
              <div className="w-6 h-4 bg-green-500 rounded-sm flex items-center justify-center">
                <div className="w-3 h-2 bg-yellow-400 rounded-full"></div>
              </div>
              <span className="text-sm font-medium">Português</span>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm bg-red-100 text-red-800 border border-red-200">
                {error}
              </div>
            )}

            <CriarSalaForm onSubmit={handleCriarSala} />

            <Link href="/salas">
              <button className="w-full bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors mt-4">
                Ver Salas Existentes
              </button>
            </Link>
          </div>
        </div>
        <DicasCard />
      </div>
    </ProtectedRoute>
  );
}
