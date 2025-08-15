import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export const useWebSocket = (
  url: string | null,
  options: UseWebSocketOptions = {}
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Usar refs para callbacks para evitar dependências instáveis
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const { autoReconnect = true, reconnectInterval = 3000 } = options;

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      // Remover listeners antes de fechar
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;

      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!url) {
      console.warn("WebSocket URL não fornecida");
      return;
    }

    // Evitar múltiplas conexões
    if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      console.log("WebSocket já está tentando conectar");
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket já está conectado");
      return;
    }

    cleanup();

    try {
      console.log(`Conectando WebSocket em: ${url}`);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = (event) => {
        console.log("✅ WebSocket conectado com sucesso");
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        optionsRef.current.onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("📥 Mensagem WebSocket:", message);
          optionsRef.current.onMessage?.(message);
        } catch (err) {
          console.error("Erro ao processar mensagem WebSocket:", err);
          console.log("Mensagem bruta:", event.data);
        }
      };

      ws.onclose = (event) => {
        console.log(
          `WebSocket desconectado - Código: ${event.code}, Razão: ${event.reason}`
        );
        setIsConnected(false);
        wsRef.current = null;
        optionsRef.current.onClose?.();

        // Reconectar automaticamente se habilitado e dentro do limite
        if (
          autoReconnect &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `Tentativa de reconexão ${reconnectAttemptsRef.current}/${maxReconnectAttempts} em ${reconnectInterval}ms`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error("Máximo de tentativas de reconexão atingido");
          setError("Falha na conexão após múltiplas tentativas");
        }
      };

      ws.onerror = (event) => {
        console.error("💥 Erro no WebSocket:", event);
        setError("Erro na conexão WebSocket");
        optionsRef.current.onError?.(event);
      };
    } catch (err) {
      console.error("Erro ao criar WebSocket:", err);
      setError("Erro ao criar conexão WebSocket");
    }
  }, [url, autoReconnect, reconnectInterval, cleanup]);

  const disconnect = useCallback(() => {
    console.log("Desconectando WebSocket manualmente");
    reconnectAttemptsRef.current = maxReconnectAttempts; // Evitar reconexão automática
    cleanup();
  }, [cleanup]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!wsRef.current) {
      console.warn("WebSocket não inicializado");
      return false;
    }

    if (wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn(
        "WebSocket não está conectado. Estado:",
        wsRef.current.readyState
      );
      return false;
    }

    try {
      const messageStr = JSON.stringify(message);
      wsRef.current.send(messageStr);
      console.log("📤 Mensagem enviada:", message);
      return true;
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      return false;
    }
  }, []);

  // Funções de conveniência
  const joinRoom = useCallback(
    (roomId: string, userId: string, username: string) => {
      return sendMessage({
        type: "JOIN_ROOM",
        roomId,
        userId,
        username,
      });
    },
    [sendMessage]
  );

  const leaveRoom = useCallback(
    (roomId: string, userId: string) => {
      return sendMessage({
        type: "LEAVE_ROOM",
        roomId,
        userId,
      });
    },
    [sendMessage]
  );

  const joinTeam = useCallback(
    (
      roomId: string,
      userId: string,
      username: string,
      equipe: string,
      role: string
    ) => {
      return sendMessage({
        type: "JOIN_TEAM",
        roomId,
        userId,
        username,
        equipe,
        role,
      });
    },
    [sendMessage]
  );

  const sendChatMessage = useCallback(
    (roomId: string, userId: string, username: string, message: string) => {
      return sendMessage({
        type: "CHAT_MESSAGE",
        roomId,
        userId,
        username,
        message,
      });
    },
    [sendMessage]
  );

  const setPlayerReady = useCallback(
    (roomId: string, userId: string, username: string) => {
      return sendMessage({
        type: "PLAYER_READY",
        roomId,
        userId,
        username,
      });
    },
    [sendMessage]
  );

  const startGame = useCallback(
    (roomId: string) => {
      return sendMessage({
        type: "START_GAME",
        roomId,
      });
    },
    [sendMessage]
  );

  // Efeito principal - conectar quando URL muda
  useEffect(() => {
    if (url) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup na desmontagem
    return () => {
      disconnect();
    };
  }, [url]); // Apenas URL como dependência

  return {
    isConnected,
    error,
    sendMessage,
    joinRoom,
    leaveRoom,
    joinTeam,
    sendChatMessage,
    setPlayerReady,
    startGame,
    connect,
    disconnect,
  };
};
