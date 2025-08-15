const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error(
    "❌ ERRO: Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não configuradas!"
  );
  console.error(
    "📋 Crie um arquivo .env na pasta backend/ com as configurações do Supabase"
  );
  process.exit(1);
}

//
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
console.log("Inicializando Supabase client...");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
console.log("Supabase client inicializado com sucesso");

app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// UUID fixo válido para testes temporários
const TEMP_USER_UUID = "550e8400-e29b-41d4-a716-446655440000";

// Middleware temporário para bypass da autenticação (apenas para debug)
const tempAuthMiddleware = (req, res, next) => {
  console.log("🚨 USANDO AUTENTICAÇÃO TEMPORÁRIA - REMOVER EM PRODUÇÃO");
  req.user = {
    id: TEMP_USER_UUID, // UUID fixo válido para testes
    email: "temp@teste.com",
    nome: "Usuário Temporário",
  };
  console.log("✅ Usuário temporário definido:", req.user);
  next();
};

// Middleware de autenticação
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log(
      "Header de autorização recebido:",
      authHeader ? "Presente" : "Ausente"
    );

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Token não fornecido ou formato inválido");
      return res
        .status(401)
        .json({ error: "Token de autenticação necessário" });
    }

    const token = authHeader.substring(7);
    console.log(
      "Token extraído (primeiros 20 chars):",
      token.substring(0, 20) + "..."
    );

    // Verificar token com Supabase usando o método correto
    const { data: user, error } = await req.supabase.auth.getUser(token);

    console.log("Resultado da validação - Error:", error);
    console.log(
      "Resultado da validação - User:",
      user ? "Presente" : "Ausente"
    );

    if (error || !user.user) {
      console.error(
        "Erro na validação do token:",
        error?.message || "User não encontrado"
      );
      return res.status(401).json({
        error: "Token inválido",
        details: error?.message || "Usuário não encontrado",
      });
    }

    // Usar dados básicos do auth
    req.user = {
      id: user.user.id,
      email: user.user.email,
      nome: user.user.user_metadata?.nome || user.user.email,
    };

    console.log("✅ Usuário autenticado com sucesso:", {
      id: req.user.id,
      email: req.user.email,
      nome: req.user.nome,
    });

    next();
  } catch (error) {
    console.error("💥 Erro crítico na autenticação:", error);
    res
      .status(401)
      .json({ error: "Erro na autenticação", details: error.message });
  }
};

// Rotas de usuário
app.use("/api/user", require("./routes/user"));

// Rotas diretas para login/register (compatibilidade frontend)
const userRoutes = require("./routes/user");
app.use("/api", userRoutes);

// Rotas de salas (com middleware de autenticação temporário)
app.use("/api/salas", tempAuthMiddleware, require("./routes/salas"));

app.get("/ping", (req, res) => {
  res.json({ message: "pong", timestamp: new Date().toISOString() });
});

// Rota de teste para autenticação (usando middleware real)
app.get("/api/test-auth", authenticateUser, (req, res) => {
  res.json({
    message: "Autenticação funcionando!",
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// Rota de teste para autenticação temporária
app.get("/api/test-temp-auth", tempAuthMiddleware, (req, res) => {
  res.json({
    message: "Autenticação temporária funcionando!",
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err);
  res.status(500).json({
    error: "Erro interno do servidor",
    details:
      process.env.NODE_ENV === "development" ? err.message : "Erro interno",
  });
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Teste a API em: http://localhost:${PORT}/ping`);
  console.log(`🔗 Frontend deve estar em: http://localhost:3000`);
  console.log(`🗄️ Supabase conectado: ${process.env.SUPABASE_URL}`);
});

const WebSocketServer = require("./websocket");
const wss = new WebSocketServer(server);
console.log("🔌 Servidor WebSocket inicializado");

app.set("wss", wss);
