-- Schema corrigido para permitir inserção via API
-- Execute este arquivo no Supabase SQL Editor

-- 1. CRIAR TABELAS (se não existirem)

-- Tabela de salas
CREATE TABLE IF NOT EXISTS salas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  max_jogadores INTEGER NOT NULL CHECK (max_jogadores >= 2 AND max_jogadores <= 20),
  privada BOOLEAN DEFAULT false,
  host_id UUID NOT NULL,
  host_nome VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'jogando', 'cheia', 'encerrada')),
  jogadores_atual INTEGER DEFAULT 1 CHECK (jogadores_atual >= 1),
  criada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tempo_inicio TIMESTAMP WITH TIME ZONE,
  tempo_espera TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  configuracao JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de jogadores por sala
CREATE TABLE IF NOT EXISTS jogadores_sala (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sala_id UUID REFERENCES salas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  nome_usuario VARCHAR(100) NOT NULL,
  is_host BOOLEAN DEFAULT false,
  equipe VARCHAR(20) DEFAULT 'espectador' CHECK (equipe IN ('vermelha', 'azul', 'espectador')),
  role VARCHAR(20) DEFAULT 'agente' CHECK (role IN ('agente', 'espião_mestre')),
  entrada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pronto BOOLEAN DEFAULT false,
  UNIQUE(sala_id, usuario_id)
);

-- Tabela de histórico de jogos
CREATE TABLE IF NOT EXISTS historico_jogos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sala_id UUID REFERENCES salas(id) ON DELETE SET NULL,
  vencedor VARCHAR(20) CHECK (vencedor IN ('vermelha', 'azul', 'empate')),
  duracao_minutos INTEGER,
  jogadores_participantes INTEGER,
  finalizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  detalhes JSONB DEFAULT '{}'
);

-- 2. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_salas_status ON salas(status);
CREATE INDEX IF NOT EXISTS idx_salas_host_id ON salas(host_id);
CREATE INDEX IF NOT EXISTS idx_jogadores_sala_id ON jogadores_sala(sala_id);
CREATE INDEX IF NOT EXISTS idx_jogadores_usuario_id ON jogadores_sala(usuario_id);

-- 3. CRIAR FUNÇÕES
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. CRIAR TRIGGERS (com DROP IF EXISTS para evitar duplicatas)
DROP TRIGGER IF EXISTS update_salas_updated_at ON salas;
CREATE TRIGGER update_salas_updated_at 
  BEFORE UPDATE ON salas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 5. CONFIGURAR RLS (Row Level Security) - VERSÃO CORRIGIDA

-- Habilitar RLS
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogadores_sala ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_jogos ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS CORRIGIDAS PARA PERMITIR INSERÇÃO VIA API

-- Políticas para salas - PERMITIR TUDO para desenvolvimento
DROP POLICY IF EXISTS "Usuários autenticados podem ver salas" ON salas;
DROP POLICY IF EXISTS "Usuários autenticados podem criar salas" ON salas;
DROP POLICY IF EXISTS "Apenas o host pode atualizar salas" ON salas;
DROP POLICY IF EXISTS "Permitir todas as operações em desenvolvimento" ON salas;

-- Política permissiva para desenvolvimento
CREATE POLICY "Permitir todas as operações em desenvolvimento" ON salas
  FOR ALL USING (true);

-- Políticas para jogadores_sala - PERMITIR TUDO para desenvolvimento
DROP POLICY IF EXISTS "Usuários autenticados podem ver jogadores" ON jogadores_sala;
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar participação" ON jogadores_sala;
DROP POLICY IF EXISTS "Permitir todas as operações em desenvolvimento" ON jogadores_sala;

CREATE POLICY "Permitir todas as operações em desenvolvimento" ON jogadores_sala
  FOR ALL USING (true);

-- Políticas para histórico - PERMITIR TUDO para desenvolvimento
DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico" ON historico_jogos;
DROP POLICY IF EXISTS "Permitir todas as operações em desenvolvimento" ON historico_jogos;

CREATE POLICY "Permitir todas as operações em desenvolvimento" ON historico_jogos
  FOR ALL USING (true);

-- 6. VERIFICAÇÃO FINAL
SELECT 'Schema corrigido criado com sucesso!' as resultado;
SELECT 'Tabelas criadas:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('salas', 'jogadores_sala', 'historico_jogos');

-- 7. TESTE DE INSERÇÃO
-- Esta inserção deve funcionar agora
INSERT INTO salas (nome, max_jogadores, privada, host_id, host_nome, status, jogadores_atual)
VALUES ('Sala Teste', 8, false, gen_random_uuid(), 'Usuário Teste', 'aguardando', 1)
RETURNING id, nome, host_nome;

-- Limpar dados de teste
DELETE FROM salas WHERE nome = 'Sala Teste';
