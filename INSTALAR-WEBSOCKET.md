# 🔌 Configuração do WebSocket para Comunicação em Tempo Real

## 📦 **Instalação das Dependências**

### Backend

```bash
cd backend
npm install ws uuid
```

### Frontend

```bash
cd frontend
npm install
```

## 🚀 **Como Funciona**

### **1. Servidor WebSocket**

- **Arquivo**: `backend/websocket.js`
- **Porta**: Mesma do servidor HTTP (3001)
- **Funcionalidades**:
  - ✅ Conexão automática ao entrar no lobby
  - ✅ Notificações em tempo real
  - ✅ Gerenciamento de salas e jogadores
  - ✅ Reconexão automática

### **2. Hook Personalizado**

- **Arquivo**: `frontend/src/hooks/useWebSocket.ts`
- **Funcionalidades**:
  - ✅ Conexão automática
  - ✅ Reconexão automática
  - ✅ Métodos para diferentes tipos de mensagem
  - ✅ Tratamento de erros

### **3. Integração no Lobby**

- **Arquivo**: `frontend/src/pages/lobby/[id].tsx`
- **Funcionalidades**:
  - ✅ Status de conexão visual
  - ✅ Log de eventos em tempo real
  - ✅ Sincronização de jogadores
  - ✅ Chat em tempo real

## 🔄 **Tipos de Mensagens**

### **Entrada/Saída de Sala**

```typescript
// Entrar na sala
{
  type: 'JOIN_ROOM',
  roomId: 'sala-123',
  userId: 'user-456',
  username: 'João'
}

// Sair da sala
{
  type: 'LEAVE_ROOM',
  roomId: 'sala-123',
  userId: 'user-456'
}
```

### **Mudança de Equipe**

```typescript
{
  type: 'JOIN_TEAM',
  roomId: 'sala-123',
  userId: 'user-456',
  username: 'João',
  equipe: 'vermelho',
  role: 'agente'
}
```

### **Chat**

```typescript
{
  type: 'CHAT_MESSAGE',
  roomId: 'sala-123',
  userId: 'user-456',
  username: 'João',
  message: 'Olá pessoal!'
}
```

### **Iniciar Jogo**

```typescript
{
  type: 'START_GAME',
  roomId: 'sala-123'
}
```

## 🧪 **Testando o WebSocket**

### **1. Iniciar o Backend**

```bash
cd backend
npm run dev
```

### **2. Verificar Logs**

```
🔌 Servidor WebSocket inicializado
Nova conexão WebSocket estabelecida
WebSocket conectado ao lobby
```

### **3. Testar no Frontend**

1. Crie uma sala
2. Entre no lobby
3. Verifique o status "Online" no header
4. Teste mudar de equipe
5. Observe o log de eventos em tempo real

## 🔧 **Configuração Avançada**

### **Variáveis de Ambiente**

```env
# backend/.env
WS_PORT=3002  # Porta separada para WebSocket (opcional)
WS_HEARTBEAT=30000  # Intervalo de heartbeat em ms
```

### **Personalizar Reconexão**

```typescript
const { isConnected } = useWebSocket(wsUrl, {
  autoReconnect: true,
  reconnectInterval: 5000, // 5 segundos
  onMessage: handleMessage,
  onOpen: handleOpen,
  onClose: handleClose,
  onError: handleError,
});
```

## 🐛 **Solução de Problemas**

### **Erro: "WebSocket connection failed"**

- ✅ Verificar se o backend está rodando
- ✅ Confirmar se a porta 3001 está livre
- ✅ Verificar se não há firewall bloqueando

### **Erro: "Connection closed unexpectedly"**

- ✅ Verificar logs do backend
- ✅ Confirmar se o servidor não caiu
- ✅ Verificar se há problemas de rede

### **Reconexão não funciona**

- ✅ Verificar se `autoReconnect: true`
- ✅ Confirmar se `reconnectInterval` está configurado
- ✅ Verificar logs de reconexão no console

## 🚀 **Próximos Passos**

### **Funcionalidades Futuras**

- [ ] Chat em tempo real entre jogadores
- [ ] Notificações push para eventos importantes
- [ ] Sincronização de estado do jogo
- [ ] Compartilhamento de tela
- [ ] Áudio/vídeo em tempo real

### **Melhorias de Performance**

- [ ] Compressão de mensagens
- [ ] Rate limiting
- [ ] Pool de conexões
- [ ] Load balancing

## 📞 **Suporte**

Se encontrar problemas:

1. Verifique os logs do backend
2. Confirme se todas as dependências foram instaladas
3. Teste a conexão WebSocket no console do navegador
4. Verifique se não há conflitos de porta

---

**🎯 O WebSocket está configurado e funcionando! Agora você tem comunicação em tempo real no lobby!**
