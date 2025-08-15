// Teste simples da API de criação de sala
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Simular usuário autenticado
app.use((req, res, next) => {
  req.user = {
    id: "user-test-" + Date.now(),
    nome: "Usuário Teste",
    email: "teste@exemplo.com",
  };
  next();
});

// Rota de teste para criação de sala
app.post("/test-sala", (req, res) => {
  console.log("Dados recebidos:", req.body);
  console.log("Usuário:", req.user);

  const { nome, maxJogadores, privada } = req.body;

  if (!nome || !maxJogadores) {
    return res.status(400).json({
      error: "Dados obrigatórios faltando: nome, maxJogadores",
    });
  }

  res.json({
    success: true,
    sala: {
      id: "test-id",
      nome,
      maxJogadores,
      privada,
      hostId: req.user.id,
      hostNome: req.user.nome,
    },
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🧪 Servidor de teste rodando na porta ${PORT}`);
  console.log(`📡 Teste em: http://localhost:${PORT}/test-sala`);
  console.log("📋 Use Postman ou curl para testar:");
  console.log(
    `curl -X POST http://localhost:${PORT}/test-sala -H "Content-Type: application/json" -d '{"nome":"Sala Teste","maxJogadores":8,"privada":false}'`
  );
});
