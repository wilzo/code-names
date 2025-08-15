const express = require("express");
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    console.log("Dados recebidos:", req.body);
    const { nome, email, password } = req.body;
    const supabase = req.supabase;

    if (!nome || !email || !password) {
      console.log("Dados obrigatórios faltando:", {
        nome: !!nome,
        email: !!email,
        password: !!password,
      });
      return res.status(400).json({ error: "Dados obrigatórios faltando." });
    }

    console.log("Tentando criar usuário via auth.signUp:", { email, password });

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          nome: nome,
        },
      },
    });

    if (authError) {
      console.error("Erro na autenticação:", authError);
      return res
        .status(500)
        .json({ error: authError.message, details: authError });
    }

    console.log("Usuário criado com sucesso via auth:", authData);

    // Retorna sucesso mesmo sem criar perfil na tabela
    res.status(201).json({
      usuario: {
        id: authData.user?.id,
        email: authData.user?.email,
        nome: nome,
      },
      message:
        "Usuário criado com sucesso! Verifique seu email para confirmar a conta.",
      requiresEmailConfirmation: true,
    });
  } catch (err) {
    console.error("Erro interno:", err);
    res
      .status(500)
      .json({ error: "Erro interno do servidor", details: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const supabase = req.supabase;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha obrigatórios." });
    }

    console.log("Tentando fazer login para:", email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Erro no login:", error);

      if (
        error.message.includes("Email not confirmed") ||
        error.message.includes("Invalid login credentials")
      ) {
        return res.status(401).json({
          error:
            "Email não confirmado. Verifique sua caixa de entrada e confirme o email antes de fazer login.",
          requiresEmailConfirmation: true,
        });
      }

      return res.status(401).json({ error: "Email ou senha inválidos." });
    }

    if (!data.session) {
      return res
        .status(401)
        .json({ error: "Sessão não criada. Tente novamente." });
    }

    console.log("Login bem-sucedido para:", email);

    res.status(200).json({
      usuario: {
        id: data.user.id,
        email: data.user.email,
        nome: data.user.user_metadata?.nome || data.user.email,
      },
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (err) {
    console.error("Erro interno no login:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;
