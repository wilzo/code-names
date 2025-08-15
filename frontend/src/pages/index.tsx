import Link from "next/link";
import { Users, Gamepad2, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Aguardar um pouco para verificar a autenticação
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Se estiver carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-800 via-red-900 to-orange-700 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            CodNames Wilzo
          </h2>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se usuário estiver logado, mostrar opções para usuários logados
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-800 via-red-900 to-orange-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <div className="mb-6">
            <Gamepad2 className="w-16 h-16 text-orange-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              CodNames Wilzo
            </h1>
            <p className="text-gray-600">
              Olá,{" "}
              <span className="font-semibold">{user.nome || user.email}</span>!
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/salas" className="block">
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                Ver Salas Disponíveis
              </button>
            </Link>

            <Link href="/criarsala" className="block">
              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                Criar Nova Sala
              </button>
            </Link>

            <button
              onClick={() => router.push("/login")}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Se não estiver logado, mostrar opções para visitantes
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-800 via-red-900 to-orange-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
        <div className="mb-6">
          <Gamepad2 className="w-16 h-16 text-orange-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Código Secreto
          </h1>
          <p className="text-gray-600">O jogo de palavras mais divertido!</p>
        </div>

        <div className="space-y-4">
          <Link href="/login" className="block">
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" />
              Entrar
            </button>
          </Link>

          <Link href="/register" className="block">
            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
              <UserPlus className="w-5 h-5" />
              Criar Conta
            </button>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Como Jogar
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              🎯 Descubra as palavras secretas com dicas dos seus companheiros
            </p>
            <p>👥 Forme equipes e trabalhem juntos</p>
            <p>🏆 Seja o primeiro a descobrir todas as palavras</p>
          </div>
        </div>
      </div>
    </div>
  );
}
