const express = require("express");
const router = express.Router();

// Criar uma nova sala
router.post("/", async (req, res) => {
  try {
    const { nome, maxJogadores, privada } = req.body;
    const supabase = req.supabase;

    // Verificar se o usuário está autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    if (!nome || !maxJogadores) {
      return res.status(400).json({
        error: "Dados obrigatórios faltando: nome, maxJogadores",
      });
    }

    console.log("Criando sala:", {
      nome,
      maxJogadores,
      privada,
      hostId: req.user.id,
      hostNome: req.user.nome || req.user.email,
    });

    const salaData = {
      nome,
      max_jogadores: maxJogadores,
      privada: privada || false,
      host_id: req.user.id,
      host_nome: req.user.nome || req.user.email,
      status: "aguardando",
      jogadores_atual: 1,
      criada_em: new Date().toISOString(),
      tempo_inicio: null,
      tempo_espera: new Date().toISOString(),
    };

    console.log("Criando sala:", salaData.nome);

    const { data: sala, error } = await supabase
      .from("salas")
      .insert([salaData])
      .select()
      .single();

    if (sala) {
      console.log(`✅ Sala "${sala.nome}" criada com ID: ${sala.id}`);
    }

    if (error) {
      console.error("Erro ao criar sala:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log("Sala criada com sucesso:", sala);
    res.status(201).json({
      sala,
      message: "Sala criada com sucesso!",
      redirectTo: `/lobby/${sala.id}`, // URL para redirecionar
    });
  } catch (err) {
    console.error("Erro interno ao criar sala:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Listar todas as salas disponíveis
router.get("/", async (req, res) => {
  try {
    console.log("🔍 Iniciando listagem de salas...");
    console.log("📋 Usuário da requisição:", req.user);

    const { status, privada } = req.query;
    const supabase = req.supabase;

    let query = supabase
      .from("salas")
      .select("*")
      .order("criada_em", { ascending: false });

    // Aplicar filtros
    if (status && status !== "todas") {
      query = query.eq("status", status);
    }
    if (privada === "false") {
      query = query.eq("privada", false);
    }

    // Não filtrar salas do próprio usuário - usuários podem ver suas próprias salas
    console.log("Usuário atual:", req.user?.id);

    const { data: salas, error } = await query;

    console.log(`${salas?.length || 0} salas encontradas`);

    // Log detalhado das salas para debug
    if (salas && salas.length > 0) {
      console.log("=== SALAS NO BANCO ===");
      salas.forEach((sala, index) => {
        console.log(
          `${index + 1}. ${sala.nome} (${sala.host_nome}) - Host ID: ${
            sala.host_id
          }`
        );
      });
      console.log("======================");
    }

    if (error) {
      console.error("Erro ao buscar salas:", error);
      // Se for erro de tabela não encontrada, retorna lista vazia
      if (
        error.message.includes("relation") &&
        error.message.includes("does not exist")
      ) {
        console.log("Tabela de salas ainda não existe, retornando lista vazia");
        return res.json([]);
      }
      return res.status(500).json({ error: error.message });
    }

    // Se não há dados, retorna lista vazia
    if (!salas || salas.length === 0) {
      console.log("Nenhuma sala encontrada, retornando lista vazia");
      return res.json([]);
    }

    // Processar dados das salas com estrutura compatível com o frontend
    const salasProcessadas = salas.map((sala) => {
      return {
        id: sala.id,
        nome: sala.nome,
        jogadores_atual: sala.jogadores_atual || 1,
        max_jogadores: sala.max_jogadores,
        status: sala.status,
        privada: sala.privada,
        host_nome: sala.host_nome || "Desconhecido",
        criada_em: sala.criada_em,
        tempo_espera: sala.tempo_espera,
      };
    });

    console.log(`${salasProcessadas.length} salas encontradas`);
    res.json(salasProcessadas);
  } catch (err) {
    console.error("Erro interno ao listar salas:", err);
    // Em caso de erro interno, retorna lista vazia em vez de erro 500
    res.json([]);
  }
});

// Obter detalhes de uma sala específica
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = req.supabase;

    // Buscar apenas dados básicos da sala (sem JOIN por enquanto)
    const { data: sala, error } = await supabase
      .from("salas")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar sala:", error);
      return res.status(404).json({ error: "Sala não encontrada" });
    }

    // Retornar dados no formato esperado pelo frontend
    const salaFormatada = {
      sala: {
        id: sala.id,
        nome: sala.nome,
        maxJogadores: sala.max_jogadores,
        status: sala.status,
        hostNome: sala.host_nome,
        privada: sala.privada,
        jogadoresAtual: sala.jogadores_atual,
        criadaEm: sala.criada_em,
      },
    };

    console.log(`Sala ${id} encontrada:`, salaFormatada.sala);
    res.json(salaFormatada);
  } catch (err) {
    console.error("Erro interno ao buscar sala:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Entrar em uma sala
router.post("/:id/entrar", async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId, nomeUsuario } = req.body;
    const supabase = req.supabase;

    console.log(`=== ENTRAR NA SALA ===`);
    console.log(`Sala ID: ${id}`);
    console.log(`Usuário: ${nomeUsuario} (${usuarioId})`);

    if (!usuarioId || !nomeUsuario) {
      console.log("❌ Dados obrigatórios faltando");
      return res.status(400).json({
        error: "Dados obrigatórios faltando: usuarioId, nomeUsuario",
      });
    }

    // Verificar se a sala existe e tem vaga
    const { data: sala, error: salaError } = await supabase
      .from("salas")
      .select("*")
      .eq("id", id)
      .single();

    if (salaError || !sala) {
      console.log("❌ Sala não encontrada:", salaError);
      return res.status(404).json({ error: "Sala não encontrada" });
    }

    console.log("✅ Sala encontrada:", {
      nome: sala.nome,
      host_id: sala.host_id,
      jogadores_atual: sala.jogadores_atual,
      max_jogadores: sala.max_jogadores,
      status: sala.status,
    });

    // Verificar se o usuário não é o host da sala
    if (sala.host_id === usuarioId) {
      console.log("❌ Usuário tentando entrar na própria sala");
      return res
        .status(400)
        .json({ error: "Você não pode entrar na sua própria sala" });
    }

    if (sala.status === "cheia" || sala.jogadores_atual >= sala.max_jogadores) {
      console.log("❌ Sala está cheia");
      return res.status(400).json({ error: "Sala está cheia" });
    }

    if (sala.status === "jogando") {
      console.log("❌ Jogo já começou");
      return res.status(400).json({ error: "Jogo já começou" });
    }

    // Por enquanto, vamos apenas verificar se a sala tem vaga
    // A tabela jogadores_sala será implementada depois

    // Atualizar contador de jogadores
    const { error: updateError } = await supabase
      .from("salas")
      .update({
        jogadores_atual: sala.jogadores_atual + 1,
        status:
          sala.jogadores_atual + 1 >= sala.max_jogadores
            ? "cheia"
            : sala.status,
      })
      .eq("id", id);

    if (updateError) {
      console.error("❌ Erro ao atualizar contador:", updateError);
      return res.status(500).json({ error: "Erro ao atualizar sala" });
    }

    console.log(`✅ ${nomeUsuario} entrou na sala ${sala.nome} com sucesso!`);
    console.log(`======================`);
    res.json({ message: "Entrou na sala com sucesso!" });
  } catch (err) {
    console.error("Erro interno ao entrar na sala:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Sair de uma sala
router.post("/:id/sair", async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.body;
    const supabase = req.supabase;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId é obrigatório" });
    }

    // Por enquanto, vamos apenas atualizar o contador
    // A tabela jogadores_sala será implementada depois

    // Atualizar contador de jogadores
    const { data: sala } = await supabase
      .from("salas")
      .select("jogadores_atual, max_jogadores, host_id")
      .eq("id", id)
      .single();

    if (sala) {
      const novosJogadores = Math.max(1, sala.jogadores_atual - 1); // Mínimo 1 (o host)
      const novoStatus =
        novosJogadores < sala.max_jogadores ? "aguardando" : sala.status;

      await supabase
        .from("salas")
        .update({
          jogadores_atual: novosJogadores,
          status: novoStatus,
        })
        .eq("id", id);
    }

    console.log(`Usuário ${usuarioId} saiu da sala ${id}`);
    res.json({ message: "Saiu da sala com sucesso!" });
  } catch (err) {
    console.error("Erro interno ao sair da sala:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Iniciar jogo
router.post("/:id/iniciar", async (req, res) => {
  try {
    const { id } = req.params;
    const { hostId } = req.body;
    const supabase = req.supabase;

    // Verificar se é o host
    const { data: sala } = await supabase
      .from("salas")
      .select("host_id, status")
      .eq("id", id)
      .single();

    if (!sala || sala.host_id !== hostId) {
      return res
        .status(403)
        .json({ error: "Apenas o host pode iniciar o jogo" });
    }

    if (sala.status !== "aguardando") {
      return res
        .status(400)
        .json({ error: "Só é possível iniciar salas aguardando" });
    }

    // Atualizar status da sala
    const { error } = await supabase
      .from("salas")
      .update({
        status: "jogando",
        tempo_inicio: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao iniciar jogo:", error);
      return res.status(500).json({ error: "Erro ao iniciar jogo" });
    }

    console.log(`Jogo iniciado na sala ${id}`);
    res.json({ message: "Jogo iniciado com sucesso!" });
  } catch (err) {
    console.error("Erro interno ao iniciar jogo:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Sincronizar contagem de jogadores
router.post("/:id/sync-players", async (req, res) => {
  try {
    const { id } = req.params;
    const { playerCount, players } = req.body;
    const supabase = req.supabase;

    console.log(
      `Sincronizando sala ${id} com ${playerCount} jogadores:`,
      players
    );

    // Se não há jogadores na sala, deletar a sala
    if (playerCount === 0) {
      const { error: deleteError } = await supabase
        .from("salas")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Erro ao deletar sala vazia:", deleteError);
        return res.status(500).json({ error: "Erro ao deletar sala vazia" });
      }

      console.log(`Sala ${id} deletada por estar vazia`);
      return res.json({ message: "Sala deletada por estar vazia" });
    }

    // Verificar se ainda existe um host ativo
    const { data: sala } = await supabase
      .from("salas")
      .select("host_id, host_nome, max_jogadores")
      .eq("id", id)
      .single();

    if (!sala) {
      return res.status(404).json({ error: "Sala não encontrada" });
    }

    // Verificar se o host atual ainda está na sala
    const hostStillInRoom = players.some(
      (player) => player.userId === sala.host_id
    );

    let newHostId = sala.host_id;
    let newHostName = sala.host_nome;

    // Se o host atual não está mais na sala, transferir liderança
    if (!hostStillInRoom && players.length > 0) {
      const newHost = players[0]; // Primeiro jogador vira líder
      newHostId = newHost.userId;
      newHostName = newHost.username;
      console.log(`Transferindo liderança da sala ${id} para ${newHostName}`);
    }

    // Atualizar contagem de jogadores e possivelmente o host
    const updateData = {
      jogadores_atual: playerCount,
      status: playerCount >= sala.max_jogadores ? "cheia" : "aguardando",
    };

    // Só atualizar host se realmente mudou
    if (newHostId !== sala.host_id) {
      updateData.host_id = newHostId;
      updateData.host_nome = newHostName;
    }

    console.log(`Atualizando sala ${id} com:`, updateData);

    const { error } = await supabase
      .from("salas")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Erro ao sincronizar jogadores:", error);
      return res.status(500).json({ error: "Erro ao sincronizar jogadores" });
    }

    res.json({
      message: "Jogadores sincronizados com sucesso",
      playerCount,
      newHost:
        newHostId !== sala.host_id
          ? { id: newHostId, name: newHostName }
          : null,
    });
  } catch (err) {
    console.error("Erro interno ao sincronizar jogadores:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Encerrar sala
router.post("/:id/encerrar", async (req, res) => {
  try {
    const { id } = req.params;
    const { hostId } = req.body;
    const supabase = req.supabase;

    // Verificar se é o host
    const { data: sala } = await supabase
      .from("salas")
      .select("host_id")
      .eq("id", id)
      .single();

    if (!sala || sala.host_id !== hostId) {
      return res
        .status(403)
        .json({ error: "Apenas o host pode encerrar a sala" });
    }

    // Atualizar status da sala
    const { error } = await supabase
      .from("salas")
      .update({ status: "encerrada" })
      .eq("id", id);

    if (error) {
      console.error("Erro ao encerrar sala:", error);
      return res.status(500).json({ error: "Erro ao encerrar sala" });
    }

    console.log(`Sala ${id} encerrada`);
    res.json({ message: "Sala encerrada com sucesso!" });
  } catch (err) {
    console.error("Erro interno ao encerrar sala:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;
