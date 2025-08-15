const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({
      server,
      verifyClient: (info) => {
        // Aceitar todas as conexões por enquanto
        return true;
      },
    });
    this.rooms = new Map(); // Map<roomId, Set<WebSocket>>
    this.clients = new Map(); // Map<WebSocket, {userId, roomId, username}>

    this.init();
  }

  init() {
    this.wss.on("connection", (ws, request) => {
      const clientId = uuidv4();
      console.log(`🔌 Nova conexão WebSocket estabelecida [${clientId}]`);

      // Adicionar ID único ao WebSocket
      ws.clientId = clientId;

      // Configurar heartbeat
      ws.isAlive = true;
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log(`📨 Mensagem recebida de [${clientId}]:`, data);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error(
            `❌ Erro ao processar mensagem de [${clientId}]:`,
            error
          );
          this.sendError(ws, "Formato de mensagem inválido");
        }
      });

      ws.on("close", (code, reason) => {
        console.log(
          `🔌 Conexão WebSocket fechada [${clientId}] - Código: ${code}, Razão: ${reason}`
        );
        this.handleDisconnect(ws);
      });

      ws.on("error", (error) => {
        console.error(`💥 Erro na conexão WebSocket [${clientId}]:`, error);
        this.handleDisconnect(ws);
      });

      // Enviar mensagem de boas-vindas
      this.sendToClient(ws, {
        type: "WELCOME",
        clientId: clientId,
        message: "Conectado ao servidor WebSocket",
        timestamp: new Date().toISOString(),
      });
    });

    // Heartbeat para detectar conexões mortas
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
          console.log(`💀 Terminando conexão morta [${ws.clientId}]`);
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 segundos

    console.log("🚀 Servidor WebSocket inicializado com heartbeat");
  }

  handleMessage(ws, data) {
    const { type, roomId, userId, username, message, equipe, role } = data;

    // Validação básica
    if (!type) {
      return this.sendError(ws, "Tipo de mensagem não especificado");
    }

    try {
      switch (type) {
        case "JOIN_ROOM":
          if (!roomId || !userId || !username) {
            return this.sendError(
              ws,
              "JOIN_ROOM requer roomId, userId e username"
            );
          }
          this.joinRoom(ws, roomId, userId, username);
          break;

        case "LEAVE_ROOM":
          if (!roomId || !userId) {
            return this.sendError(ws, "LEAVE_ROOM requer roomId e userId");
          }
          this.leaveRoom(ws, roomId, userId);
          break;

        case "JOIN_TEAM":
          if (!roomId || !userId || !username || !equipe || !role) {
            return this.sendError(ws, "JOIN_TEAM requer todos os campos");
          }
          this.joinTeam(ws, roomId, userId, username, equipe, role);
          break;

        case "CHAT_MESSAGE":
          if (!roomId || !userId || !username || !message) {
            return this.sendError(ws, "CHAT_MESSAGE requer todos os campos");
          }
          this.handleChatMessage(ws, roomId, userId, username, message);
          break;

        case "PLAYER_READY":
          if (!roomId || !userId || !username) {
            return this.sendError(
              ws,
              "PLAYER_READY requer roomId, userId e username"
            );
          }
          this.handlePlayerReady(ws, roomId, userId, username);
          break;

        case "START_GAME":
          if (!roomId) {
            return this.sendError(ws, "START_GAME requer roomId");
          }
          this.handleStartGame(ws, roomId);
          break;

        default:
          console.log(`❓ Tipo de mensagem desconhecido: ${type}`);
          this.sendError(ws, `Tipo de mensagem desconhecido: ${type}`);
      }
    } catch (error) {
      console.error(`💥 Erro ao processar mensagem ${type}:`, error);
      this.sendError(ws, "Erro interno do servidor");
    }
  }

  joinRoom(ws, roomId, userId, username) {
    try {
      // Remover cliente de outras salas primeiro
      this.leaveAllRooms(ws);

      // Criar sala se não existir
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
        console.log(`🏠 Sala criada: ${roomId}`);
      }

      // Adicionar cliente à sala
      const room = this.rooms.get(roomId);
      room.add(ws);
      this.clients.set(ws, { userId, roomId, username, joinedAt: new Date() });

      // Enviar confirmação para o cliente
      this.sendToClient(ws, {
        type: "JOIN_ROOM_SUCCESS",
        roomId,
        userId,
        username,
        message: `Você entrou na sala ${roomId}`,
        roomInfo: this.getRoomInfo(roomId),
        timestamp: new Date().toISOString(),
      });

      // Notificar outros jogadores na sala
      this.broadcastToRoom(
        roomId,
        {
          type: "PLAYER_JOINED",
          userId,
          username,
          roomInfo: this.getRoomInfo(roomId),
          timestamp: new Date().toISOString(),
        },
        ws
      );

      console.log(
        `✅ ${username} [${userId}] entrou na sala ${roomId} (${room.size} jogadores)`
      );

      // Sincronizar com o banco de dados (com delay para evitar conflito na criação)
      setTimeout(() => {
        this.syncRoomPlayers(roomId);
      }, 2000);
    } catch (error) {
      console.error("Erro em joinRoom:", error);
      this.sendError(ws, "Erro ao entrar na sala");
    }
  }

  leaveRoom(ws, roomId, userId = null) {
    try {
      const clientInfo = this.clients.get(ws);
      if (!clientInfo) {
        console.log("Cliente não encontrado para deixar sala");
        return;
      }

      const targetRoomId = roomId || clientInfo.roomId;
      const room = this.rooms.get(targetRoomId);

      if (room && room.has(ws)) {
        room.delete(ws);

        // Enviar confirmação para o cliente
        this.sendToClient(ws, {
          type: "LEAVE_ROOM_SUCCESS",
          roomId: targetRoomId,
          userId: clientInfo.userId,
          username: clientInfo.username,
          message: `Você saiu da sala ${targetRoomId}`,
          timestamp: new Date().toISOString(),
        });

        // Se a sala ficou vazia, remover
        if (room.size === 0) {
          this.rooms.delete(targetRoomId);
          console.log(`🗑️ Sala ${targetRoomId} removida (vazia)`);
        } else {
          // Notificar outros jogadores
          this.broadcastToRoom(targetRoomId, {
            type: "PLAYER_LEFT",
            userId: clientInfo.userId,
            username: clientInfo.username,
            roomInfo: this.getRoomInfo(targetRoomId),
            timestamp: new Date().toISOString(),
          });
        }

        console.log(
          `❌ ${clientInfo.username} saiu da sala ${targetRoomId} (${room.size} jogadores restantes)`
        );
      }

      // Remover cliente do mapeamento
      this.clients.delete(ws);

      // Sincronizar com o banco de dados (com delay para evitar conflitos)
      if (targetRoomId) {
        setTimeout(() => {
          this.syncRoomPlayers(targetRoomId);
        }, 1000);
      }
    } catch (error) {
      console.error("Erro em leaveRoom:", error);
    }
  }

  leaveAllRooms(ws) {
    const clientInfo = this.clients.get(ws);
    if (clientInfo && clientInfo.roomId) {
      this.leaveRoom(ws, clientInfo.roomId);
    }
  }

  joinTeam(ws, roomId, userId, username, equipe, role) {
    try {
      // Verificar se o cliente está na sala
      const clientInfo = this.clients.get(ws);
      if (!clientInfo || clientInfo.roomId !== roomId) {
        return this.sendError(
          ws,
          "Você precisa estar na sala para mudar de equipe"
        );
      }

      // Enviar confirmação para o cliente
      this.sendToClient(ws, {
        type: "JOIN_TEAM_SUCCESS",
        roomId,
        userId,
        username,
        equipe,
        role,
        message: `Você entrou como ${role} da equipe ${equipe}`,
        timestamp: new Date().toISOString(),
      });

      // Notificar todos na sala sobre a mudança de equipe
      this.broadcastToRoom(roomId, {
        type: "TEAM_CHANGE",
        userId,
        username,
        equipe,
        role,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `🎯 ${username} entrou como ${role} no time ${equipe} na sala ${roomId}`
      );
    } catch (error) {
      console.error("Erro em joinTeam:", error);
      this.sendError(ws, "Erro ao mudar de equipe");
    }
  }

  handleChatMessage(ws, roomId, userId, username, message) {
    try {
      // Verificar se o cliente está na sala
      const clientInfo = this.clients.get(ws);
      if (!clientInfo || clientInfo.roomId !== roomId) {
        return this.sendError(
          ws,
          "Você precisa estar na sala para enviar mensagens"
        );
      }

      // Broadcast para todos na sala (incluindo o remetente)
      this.broadcastToRoom(roomId, {
        type: "CHAT_MESSAGE",
        userId,
        username,
        message,
        timestamp: new Date().toISOString(),
      });

      console.log(`💬 ${username} na sala ${roomId}: ${message}`);
    } catch (error) {
      console.error("Erro em handleChatMessage:", error);
      this.sendError(ws, "Erro ao enviar mensagem");
    }
  }

  handlePlayerReady(ws, roomId, userId, username) {
    try {
      this.broadcastToRoom(roomId, {
        type: "PLAYER_READY",
        userId,
        username,
        timestamp: new Date().toISOString(),
      });

      console.log(`✋ ${username} está pronto na sala ${roomId}`);
    } catch (error) {
      console.error("Erro em handlePlayerReady:", error);
      this.sendError(ws, "Erro ao marcar como pronto");
    }
  }

  handleStartGame(ws, roomId) {
    try {
      this.broadcastToRoom(roomId, {
        type: "START_GAME",
        roomId,
        timestamp: new Date().toISOString(),
      });

      console.log(`🎮 Jogo iniciado na sala ${roomId}`);
    } catch (error) {
      console.error("Erro em handleStartGame:", error);
      this.sendError(ws, "Erro ao iniciar jogo");
    }
  }

  broadcastToRoom(roomId, message, excludeWs = null) {
    const room = this.rooms.get(roomId);
    if (!room) {
      console.warn(`Tentativa de broadcast para sala inexistente: ${roomId}`);
      return;
    }

    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    room.forEach((client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          sentCount++;
        } catch (error) {
          console.error(`Erro ao enviar mensagem para cliente:`, error);
          room.delete(client); // Remover cliente com erro
        }
      }
    });

    console.log(`📡 Broadcast para sala ${roomId}: ${sentCount} clientes`);
  }

  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error(
          `Erro ao enviar mensagem para cliente [${ws.clientId}]:`,
          error
        );
        return false;
      }
    }
    return false;
  }

  sendError(ws, errorMessage) {
    this.sendToClient(ws, {
      type: "ERROR",
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(ws) {
    try {
      const clientInfo = this.clients.get(ws);
      if (clientInfo) {
        console.log(`👋 Desconectando ${clientInfo.username} [${ws.clientId}]`);
        this.leaveRoom(ws, clientInfo.roomId);
      } else {
        console.log(`👋 Cliente desconectado [${ws.clientId}]`);
      }
    } catch (error) {
      console.error("Erro em handleDisconnect:", error);
    }
  }

  getRoomInfo(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return { playerCount: 0, players: [] };

    const players = [];
    room.forEach((client) => {
      const clientInfo = this.clients.get(client);
      if (clientInfo) {
        players.push({
          userId: clientInfo.userId,
          username: clientInfo.username,
          joinedAt: clientInfo.joinedAt,
        });
      }
    });

    return {
      playerCount: players.length,
      players,
    };
  }

  // Método para obter estatísticas do servidor
  getServerStats() {
    return {
      totalConnections: this.wss.clients.size,
      totalRooms: this.rooms.size,
      totalClients: this.clients.size,
      rooms: Array.from(this.rooms.keys()).map((roomId) => ({
        roomId,
        playerCount: this.rooms.get(roomId).size,
      })),
    };
  }

  // Sincronizar jogadores da sala com o banco de dados
  async syncRoomPlayers(roomId) {
    try {
      const roomInfo = this.getRoomInfo(roomId);

      console.log(
        `🔄 Sincronizando sala ${roomId} com ${roomInfo.playerCount} jogadores`
      );

      // Fazer chamada para o backend para sincronizar
      const fetch = require("node-fetch");
      const response = await fetch(
        `http://localhost:3001/api/salas/${roomId}/sync-players`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerCount: roomInfo.playerCount,
            players: roomInfo.players,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Sala ${roomId} sincronizada:`, result.message);

        // Se um novo host foi definido, notificar a sala
        if (result.newHost) {
          this.broadcastToRoom(roomId, {
            type: "NEW_HOST",
            newHostId: result.newHost.id,
            newHostName: result.newHost.name,
            message: `${result.newHost.name} agora é o líder da sala`,
            timestamp: new Date().toISOString(),
          });
        }

        // Se a sala foi deletada (playerCount = 0), limpar localmente
        if (roomInfo.playerCount === 0) {
          this.rooms.delete(roomId);
          console.log(
            `🗑️ Sala ${roomId} removida localmente após deleção no banco`
          );
        }
      } else {
        console.error(
          `❌ Erro ao sincronizar sala ${roomId}:`,
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error(`❌ Erro na sincronização da sala ${roomId}:`, error);
    }
  }
}

module.exports = WebSocketServer;
