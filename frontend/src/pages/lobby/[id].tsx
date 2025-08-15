"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useChat } from "@/hooks/useChat";
import ProtectedRoute from "@/components/ProtectedRoute";
import ChatPanel from "@/components/ChatPanel";
import JogadoresOnlineModal from "@/components/JogadoresOnlineModal";
import MenuPerfil from "@/components/MenuPerfil";
import {
  Users,
  User,
  Crown,
  MessageSquare,
  Wifi,
  WifiOff,
  ArrowLeft,
  LogOut,
} from "lucide-react";

interface Jogador {
  id: string;
  nome: string;
  equipe: "vermelho" | "azul";
  role: "agente" | "espião_mestre";
  isHost: boolean;
}

interface Sala {
  id: string;
  nome: string;
  max_jogadores: number;
  status: string;
  host_id: string;
  host_nome: string;
}

export default function LobbyPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, logout } = useAuth();
  const [sala, setSala] = useState<Sala | null>(null);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jogadoresModalAberto, setJogadoresModalAberto] = useState(false);

  // WebSocket - usar refs para evitar dependências instáveis
  const wsUrl = id ? `ws://localhost:3001` : null;
  const userRef = useRef(user);
  const roomIdRef = useRef(id);
  const hasJoinedRoomRef = useRef(false);

  // Atualizar refs quando valores mudam
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    roomIdRef.current = id;
    hasJoinedRoomRef.current = false; // Reset ao mudar de sala
  }, [id]);

  // Chat hook
  const chat = useChat({
    maxMessages: 100,
    onSendMessage: (message) => {
      if (user && id) {
        sendChatMessage(
          id as string,
          user.id,
          user.nome || user.email,
          message
        );
      }
    },
  });

  const {
    isConnected,
    error: wsError,
    joinRoom,
    leaveRoom,
    joinTeam,
    sendChatMessage,
  } = useWebSocket(wsUrl, {
    onMessage: handleWebSocketMessage,
    onOpen: handleWebSocketOpen,
    onClose: handleWebSocketClose,
    onError: handleWebSocketError,
  });

  // Carregar dados da sala
  useEffect(() => {
    if (id && user) {
      carregarSala();
    }
  }, [id, user]);

  // Conectar ao WebSocket quando entrar na sala (apenas uma vez)
  useEffect(() => {
    if (id && user && isConnected && !hasJoinedRoomRef.current) {
      console.log("Entrando na sala WebSocket:", id);
      joinRoom(id as string, user.id, user.nome || user.email);
      hasJoinedRoomRef.current = true;
    }
  }, [id, user, isConnected]);

  // Limpar ao sair (sem dependências problemáticas)
  useEffect(() => {
    return () => {
      const currentUser = userRef.current;
      const currentRoomId = roomIdRef.current;

      if (currentRoomId && currentUser && hasJoinedRoomRef.current) {
        console.log("Saindo da sala WebSocket:", currentRoomId);
        leaveRoom(currentRoomId as string, currentUser.id);
        hasJoinedRoomRef.current = false;
      }
    };
  }, []); // Array vazio - executar apenas na desmontagem

  function handleWebSocketMessage(message: any) {
    console.log("📥 WebSocket recebeu:", message);

    switch (message.type) {
      case "WELCOME":
        chat.addSystemMessage(
          `Conectado ao servidor! ID: ${message.clientId?.slice(0, 8)}`
        );
        break;

      case "JOIN_ROOM_SUCCESS":
        chat.addSystemMessage(`Você entrou na sala ${message.roomId}`);
        if (message.roomInfo) {
          chat.addSystemMessage(
            `${message.roomInfo.playerCount} jogador(es) na sala`
          );
        }
        break;

      case "LEAVE_ROOM_SUCCESS":
        chat.addSystemMessage(`Você saiu da sala ${message.roomId}`);
        break;

      case "JOIN_TEAM_SUCCESS":
        chat.addSystemMessage(
          `Você entrou como ${message.role} da equipe ${message.equipe}`
        );
        break;

      case "PLAYER_JOINED":
        chat.addSystemMessage(`${message.username} entrou na sala`);
        // Adicionar jogador à lista se não existir
        if (message.userId !== user?.id) {
          setJogadores((prev) => {
            const exists = prev.find((j) => j.id === message.userId);
            if (!exists) {
              return [
                ...prev,
                {
                  id: message.userId,
                  nome: message.username,
                  equipe: "vermelho", // padrão
                  role: "agente", // padrão
                  isHost: false,
                },
              ];
            }
            return prev;
          });
        }
        break;

      case "PLAYER_LEFT":
        chat.addSystemMessage(`${message.username} saiu da sala`);
        // Remover jogador da lista
        setJogadores((prev) => prev.filter((j) => j.id !== message.userId));
        break;

      case "TEAM_CHANGE":
        chat.addSystemMessage(
          `${message.username} entrou como ${message.role} (${
            message.equipe === "vermelho" ? "Vermelho" : "Azul"
          })`
        );
        updateJogador(
          message.userId,
          message.username,
          message.equipe,
          message.role
        );
        break;

      case "CHAT_MESSAGE":
        chat.addMessage(
          message.userId,
          message.username,
          message.message,
          "chat"
        );
        break;

      case "PLAYER_READY":
        chat.addSystemMessage(`${message.username} está pronto!`);
        break;

      case "START_GAME":
        chat.addSystemMessage("Jogo iniciado!");
        // TODO: Redirecionar para a tela do jogo
        break;

      case "NEW_HOST":
        chat.addSystemMessage(`${message.newHostName} agora é o líder da sala`);
        // Atualizar o host nos jogadores
        setJogadores((prev) =>
          prev.map((jogador) => ({
            ...jogador,
            isHost: jogador.id === message.newHostId,
          }))
        );
        // Atualizar dados da sala se necessário
        if (sala) {
          setSala((prev) =>
            prev
              ? {
                  ...prev,
                  host_nome: message.newHostName,
                }
              : null
          );
        }
        break;

      case "ERROR":
        chat.addSystemMessage(`Erro: ${message.error}`);
        console.error("Erro do WebSocket:", message.error);
        break;

      default:
        console.log("❓ Tipo de mensagem desconhecido:", message.type);
        chat.addSystemMessage(`Mensagem desconhecida: ${message.type}`);
    }
  }

  function handleWebSocketOpen() {
    console.log("WebSocket conectado ao lobby");
    chat.addSystemMessage("Conectado ao chat em tempo real");
  }

  function handleWebSocketClose() {
    console.log("WebSocket desconectado do lobby");
    chat.addSystemMessage("Desconectado do chat");
  }

  function handleWebSocketError(error: Event) {
    console.error("Erro no WebSocket:", error);
    chat.addSystemMessage("Erro na conexão");
  }

  const carregarSala = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("supabase.auth.token");
      const response = await fetch(`http://localhost:3001/api/salas/${id}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar sala");
      }

      const data = await response.json();
      setSala(data.sala);

      // Adicionar o host como primeiro jogador
      if (user) {
        setJogadores([
          {
            id: user.id,
            nome: user.nome || user.email,
            equipe: "vermelho",
            role: "espião_mestre",
            isHost: true,
          },
        ]);
      }

      // Log inicial
      chat.addSystemMessage(`${user?.nome || user?.email} criou a sala`);
    } catch (err: any) {
      console.error("Erro ao carregar sala:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateJogador = (
    userId: string,
    nome: string,
    equipe: string,
    role: string
  ) => {
    setJogadores((prev) => {
      const existing = prev.find((j) => j.id === userId);
      if (existing) {
        return prev.map((j) =>
          j.id === userId
            ? {
                ...j,
                equipe: equipe as "vermelho" | "azul",
                role: role as "agente" | "espião_mestre",
              }
            : j
        );
      } else {
        return [
          ...prev,
          {
            id: userId,
            nome,
            equipe: equipe as "vermelho" | "azul",
            role: role as "agente" | "espião_mestre",
            isHost: false,
          },
        ];
      }
    });
  };

  const entrarComoAgente = (equipe: "vermelho" | "azul") => {
    if (!user || !id) return;

    joinTeam(id as string, user.id, user.nome || user.email, equipe, "agente");
  };

  const entrarComoEspiaoMestre = (equipe: "vermelho" | "azul") => {
    if (!user || !id) return;

    joinTeam(
      id as string,
      user.id,
      user.nome || user.email,
      equipe,
      "espião_mestre"
    );
  };

  const iniciarJogo = () => {
    // TODO: Implementar lógica para iniciar o jogo
    chat.addSystemMessage(
      "Tentativa de iniciar jogo (funcionalidade em desenvolvimento)"
    );
  };

  const sairDaSala = async () => {
    if (!user || !id) return;

    try {
      const token = localStorage.getItem("supabase.auth.token");
      const response = await fetch(
        `http://localhost:3001/api/salas/${id}/sair`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            usuarioId: user.id,
          }),
        }
      );

      if (response.ok) {
        router.push("/salas");
      }
    } catch (error) {
      console.error("Erro ao sair da sala:", error);
      // Redirecionar mesmo se der erro
      router.push("/salas");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-800 via-red-900 to-orange-700 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando lobby...</p>
        </div>
      </div>
    );
  }

  if (error || !sala) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-800 via-red-900 to-orange-700 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-red-600 mb-4">Erro ao carregar sala</p>
          <button
            onClick={() => router.push("/salas")}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg"
          >
            Voltar para Salas
          </button>
        </div>
      </div>
    );
  }

  const jogadoresVermelho = jogadores.filter((j) => j.equipe === "vermelho");
  const jogadoresAzul = jogadores.filter((j) => j.equipe === "azul");

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-orange-800 via-red-900 to-orange-700">
        <div className="flex justify-between items-center p-4">
          <div className="flex gap-2">
            {/* Botão Sair da Sala */}
            <button
              onClick={sairDaSala}
              className="bg-red-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair da Sala
            </button>

            {/* Botão Jogadores */}
            <button
              onClick={() => setJogadoresModalAberto(true)}
              className="bg-yellow-400 text-black px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-yellow-500 transition-colors"
            >
              <Users className="w-4 h-4" />
              Jogadores
              <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                {jogadores.length}
              </span>
            </button>
          </div>

          <div className="flex gap-2">
            <MenuPerfil />
          </div>
        </div>

        {/* Título */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-lg px-8 py-3 inline-block">
            <h1 className="text-xl font-bold text-black">
              Preparando a sala...
            </h1>
            <p className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
              <Crown className="w-4 h-4 text-yellow-500" />
              Líder: {sala.host_nome}
            </p>
          </div>
        </div>

        {/* Layout principal */}
        <div className="flex justify-between items-start px-8 gap-8">
          {/* Painel Vermelho */}
          <div className="bg-red-800 rounded-lg p-8 w-80 text-center">
            <div className="text-white text-6xl font-bold mb-4">9</div>
            <div className="text-red-300 mb-6">Agentes de campo</div>
            <div className="space-y-4">
              <button
                onClick={() => entrarComoAgente("vermelho")}
                className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold w-full hover:bg-yellow-500 transition-colors"
              >
                Entra como agente de campo
              </button>
              <div className="text-red-300">Espião[espiões] mestre</div>
              <button
                onClick={() => entrarComoEspiaoMestre("vermelho")}
                className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold w-full hover:bg-yellow-500 transition-colors"
              >
                Entra como espião mestre
              </button>
            </div>

            {/* Lista de jogadores do time vermelho */}
            <div className="mt-6 space-y-2">
              {jogadoresVermelho.map((jogador) => (
                <div
                  key={jogador.id}
                  className="bg-red-700 rounded p-2 text-white text-sm flex items-center justify-between"
                >
                  <span>
                    {jogador.isHost && (
                      <Crown className="w-4 h-4 inline mr-1" />
                    )}
                    {jogador.nome} -{" "}
                    {jogador.role === "agente" ? "Agente" : "Espião Mestre"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Painel Central - Chat & Registro */}
          <div className="flex-1 max-w-md">
            <ChatPanel
              messages={chat.messages}
              inputMessage={chat.inputMessage}
              onInputChange={chat.setInputMessage}
              onSendMessage={chat.sendMessage}
              onKeyPress={chat.handleKeyPress}
              messagesEndRef={
                chat.messagesEndRef as React.RefObject<HTMLDivElement>
              }
              className="h-96"
            />
          </div>

          {/* Painel Azul */}
          <div className="bg-blue-800 rounded-lg p-8 w-80 text-center">
            <div className="text-white text-6xl font-bold mb-4">8</div>
            <div className="text-blue-300 mb-6">Agentes de campo</div>
            <div className="space-y-4">
              <button
                onClick={() => entrarComoAgente("azul")}
                className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold w-full hover:bg-yellow-500 transition-colors"
              >
                Entra como agente de campo
              </button>
              <div className="text-blue-300">Espião[espiões] mestre</div>
              <button
                onClick={() => entrarComoEspiaoMestre("azul")}
                className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold w-full hover:bg-yellow-500 transition-colors"
              >
                Entra como espião mestre
              </button>
            </div>

            {/* Lista de jogadores do time azul */}
            <div className="mt-6 space-y-2">
              {jogadoresAzul.map((jogador) => (
                <div
                  key={jogador.id}
                  className="bg-blue-700 rounded p-2 text-white text-sm flex items-center justify-between"
                >
                  <span>
                    {jogador.isHost && (
                      <Crown className="w-4 h-4 inline mr-1" />
                    )}
                    {jogador.nome} -{" "}
                    {jogador.role === "agente" ? "Agente" : "Espião Mestre"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botão Iniciar Jogo - Apenas para o líder */}
        {user?.id === sala?.host_id && (
          <div className="text-center mt-8">
            <button
              onClick={iniciarJogo}
              className="bg-green-500 text-white px-8 py-4 rounded-lg font-bold text-xl hover:bg-green-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <Crown className="w-5 h-5" />
              Iniciar Jogo
            </button>
          </div>
        )}

        {/* Modal de Jogadores Online */}
        <JogadoresOnlineModal
          isOpen={jogadoresModalAberto}
          onClose={() => setJogadoresModalAberto(false)}
          jogadores={jogadores}
          currentUserId={user?.id || ""}
        />
      </div>
    </ProtectedRoute>
  );
}
