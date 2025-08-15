"use client";
import Link from "next/link";
import {
  Users,
  Clock,
  Lock,
  Unlock,
  Play,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import MenuPerfil from "@/components/MenuPerfil";

interface Sala {
  id: string;
  nome: string;
  jogadores_atual: number;
  max_jogadores: number;
  status: string;
  privada: boolean;
  host_nome: string;
  criada_em: string;
}

export default function SalasPage() {
  const { user } = useAuth();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [filtroPrivada, setFiltroPrivada] = useState<string | null>(null);

  const carregarSalas = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let url = "http://localhost:3001/api/salas";
      const params = new URLSearchParams();

      if (filtroStatus !== "todas") {
        params.append("status", filtroStatus);
      }
      if (filtroPrivada !== null) {
        params.append("privada", filtroPrivada);
      }

      if (params.toString()) {
        url += "?" + params.toString();
      }

      // Temporariamente removendo autenticação para testar
      console.log(
        "🧪 Fazendo requisição SEM autenticação para testar middleware temporário"
      );
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 500) {
          console.log("Erro 500 - possivelmente tabelas não criadas ainda");
          setSalas([]);
          return;
        }
        throw new Error("Erro ao carregar salas");
      }

      const data = await response.json();

      console.log("Dados recebidos do backend:", data);

      if (Array.isArray(data)) {
        // Verificar se os dados têm campos válidos
        data.forEach((sala, index) => {
          console.log(`Sala ${index}:`, sala);
          if (!sala.criada_em) {
            console.warn(`Sala ${sala.id || index} sem campo criada_em:`, sala);
          }
        });
        setSalas(data);
      } else {
        console.warn("Resposta não é um array:", data);
        setSalas([]);
      }
    } catch (err: any) {
      console.error("Erro ao carregar salas:", err);

      setSalas([]);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const entrarSala = async (salaId: string) => {
    if (!user) return;

    try {
      // Temporariamente removendo autenticação para testar
      console.log(
        "🧪 Entrando na sala SEM autenticação para testar middleware temporário"
      );
      const response = await fetch(
        `http://localhost:3001/api/salas/${salaId}/entrar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuarioId: user.id,
            nomeUsuario: user.nome || user.email,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao entrar na sala");
      }

      // Redirecionar para o lobby da sala
      window.location.href = `/lobby/${salaId}`;
    } catch (err: any) {
      console.error("Erro ao entrar na sala:", err);
      alert(err.message || "Erro ao entrar na sala");
    }
  };

  const calcularTempoDecorrido = (dataString: string) => {
    if (!dataString) return "Data inválida";

    const data = new Date(dataString);

    // Verificar se a data é válida
    if (isNaN(data.getTime())) {
      console.error("Data inválida recebida:", dataString);
      return "Data inválida";
    }

    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}min`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
  };

  useEffect(() => {
    carregarSalas();
  }, [filtroStatus, filtroPrivada]);

  // Auto-refresh removido conforme solicitado pelo usuário

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aguardando":
        return "text-green-600 bg-green-100";
      case "jogando":
        return "text-blue-600 bg-blue-100";
      case "cheia":
        return "text-red-600 bg-red-100";
      case "encerrada":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "aguardando":
        return "Aguardando";
      case "jogando":
        return "Em Jogo";
      case "cheia":
        return "Sala Cheia";
      case "encerrada":
        return "Encerrada";
      default:
        return status;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-orange-600">
        <header className="flex justify-between items-center p-4">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-400 text-black px-4 py-2 rounded-full font-bold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Salas Abertas
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/criarsala">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-full font-bold transition-colors">
                Criar Sala
              </button>
            </Link>
            <Link href="/">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-full font-bold transition-colors">
                Início
              </button>
            </Link>
            <MenuPerfil />
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Salas Disponíveis
              </h1>
              <div className="text-sm text-gray-600">
                {isLoading
                  ? "Carregando..."
                  : `${salas.length} salas encontradas`}
              </div>
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm bg-red-100 text-red-800 border border-red-200">
                {error}
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <span className="ml-2 text-gray-600">Carregando salas...</span>
              </div>
            )}

            {/* Lista de Salas */}
            {!isLoading && salas.length > 0 && (
              <div className="space-y-4">
                {salas.map((sala) => (
                  <div
                    key={sala.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {sala.nome}
                          </h3>
                          {sala.privada ? (
                            <Lock className="w-4 h-4 text-gray-500" />
                          ) : (
                            <Unlock className="w-4 h-4 text-green-500" />
                          )}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              sala.status
                            )}`}
                          >
                            {getStatusText(sala.status)}
                          </span>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {sala.jogadores_atual || 0}/
                            {sala.max_jogadores || 0} jogadores
                          </div>
                          <div className="flex items-center gap-1">
                            <UserCheck className="w-4 h-4" />
                            Host: {sala.host_nome || "Usuário desconhecido"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {sala.status === "aguardando"
                              ? `Esperando há ${calcularTempoDecorrido(
                                  sala.criada_em
                                )}`
                              : sala.status === "jogando"
                              ? "Em jogo agora"
                              : `Criada há ${calcularTempoDecorrido(
                                  sala.criada_em
                                )}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {sala.status === "aguardando" &&
                          sala.jogadores_atual < sala.max_jogadores && (
                            <button
                              onClick={() => entrarSala(sala.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Entrar
                            </button>
                          )}
                        {sala.status === "jogando" && (
                          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            Assistir
                          </button>
                        )}
                        {sala.status === "cheia" && (
                          <button
                            className="bg-gray-400 text-white px-4 py-2 rounded-lg font-medium cursor-not-allowed"
                            disabled
                          >
                            Sala Cheia
                          </button>
                        )}
                        {sala.status === "encerrada" && (
                          <button
                            className="bg-gray-400 text-white px-4 py-2 rounded-lg font-medium cursor-not-allowed"
                            disabled
                          >
                            Encerrada
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mensagem quando não há salas */}
            {!isLoading && salas.length === 0 && (
              <div className="text-center py-8">
                <div className="mb-4">
                  <Users className="w-16 h-16 text-gray-300 mx-auto" />
                </div>
                <p className="text-gray-500 text-lg font-medium mb-2">
                  Nenhuma sala encontrada
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  {filtroStatus !== "todas" || filtroPrivada !== null
                    ? "Tente ajustar os filtros ou"
                    : "Seja o primeiro a criar uma sala e começar a jogar!"}
                </p>
                <Link href="/criarsala" className="inline-block">
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto">
                    <Users className="w-4 h-4" />
                    Criar Primeira Sala
                  </button>
                </Link>
                <p className="text-xs text-gray-400 mt-4">
                  💡 Dica: Crie uma sala para começar a jogar com seus amigos!
                </p>
              </div>
            )}

            {/* Filtros e Opções */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setFiltroStatus("todas")}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filtroStatus === "todas"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setFiltroStatus("aguardando")}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filtroStatus === "aguardando"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    Aguardando
                  </button>
                  <button
                    onClick={() => setFiltroStatus("jogando")}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filtroStatus === "jogando"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    Em Jogo
                  </button>
                  <button
                    onClick={() =>
                      setFiltroPrivada(
                        filtroPrivada === "false" ? null : "false"
                      )
                    }
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filtroPrivada === "false"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    Públicas
                  </button>
                </div>

                <button
                  onClick={carregarSalas}
                  disabled={isLoading}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Atualizar Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
