-- Schema para o sistema de salas do Código Secreto
-- Execute este SQL no SQL Editor do Supabase

-- Tabela de salas
CREATE TABLE IF NOT EXISTS salas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  max_jogadores INTEGER NOT NULL CHECK (max_jogadores >= 2 AND max_jogadores <= 20),
  privada BOOLEAN DEFAULT false,
  host_id UUID NOT NULL,
  host_nome VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'jogando', 'cheia', 'encerrada')),
  jogadores_atual INTEGER DEFAULT 1 CHECK (jogadores_atual >= 0),
  criada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tempo_inicio TIMESTAMP WITH TIME ZONE,
  tempo_espera TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  configuracao JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de jogadores em salas
CREATE TABLE IF NOT EXISTS jogadores_sala (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  nome_usuario VARCHAR(100) NOT NULL,
  entrada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_host BOOLEAN DEFAULT false,
  equipe VARCHAR(10) CHECK (equipe IN ('vermelha', 'azul', 'espectador')),
  pontos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de jogos
CREATE TABLE IF NOT EXISTS historico_jogos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE SET NULL,
  vencedor VARCHAR(10) CHECK (vencedor IN ('vermelha', 'azul', 'empate')),
  duracao_minutos INTEGER,
  jogadores_participantes INTEGER,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_salas_status ON salas(status);
CREATE INDEX IF NOT EXISTS idx_salas_host_id ON salas(host_id);
CREATE INDEX IF NOT EXISTS idx_salas_criada_em ON salas(criada_em);
CREATE INDEX IF NOT EXISTS idx_jogadores_sala_sala_id ON jogadores_sala(sala_id);
CREATE INDEX IF NOT EXISTS idx_jogadores_sala_usuario_id ON jogadores_sala(usuario_id);

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_salas_updated_at 
  BEFORE UPDATE ON salas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Função para verificar se uma sala pode ser iniciada
CREATE OR REPLACE FUNCTION verificar_sala_iniciar()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se há pelo menos 2 jogadores para iniciar
  IF NEW.status = 'jogando' AND NEW.jogadores_atual < 2 THEN
    RAISE EXCEPTION 'É necessário pelo menos 2 jogadores para iniciar o jogo';
  END IF;
  
  -- Verificar se a sala não está cheia
  IF NEW.jogadores_atual > NEW.max_jogadores THEN
    RAISE EXCEPTION 'A sala não pode ter mais jogadores que o máximo permitido';
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para verificar regras de negócio
CREATE TRIGGER verificar_sala_iniciar_trigger
  BEFORE UPDATE ON salas
  FOR EACH ROW
  EXECUTE FUNCTION verificar_sala_iniciar();

-- Função para calcular tempo decorrido
CREATE OR REPLACE FUNCTION calcular_tempo_decorrido(data_inicio TIMESTAMP WITH TIME ZONE)
RETURNS TEXT AS $$
DECLARE
  diff_interval INTERVAL;
  diff_minutes INTEGER;
  diff_hours INTEGER;
  diff_days INTEGER;
BEGIN
  diff_interval = NOW() - data_inicio;
  diff_minutes = EXTRACT(MINUTE FROM diff_interval);
  diff_hours = EXTRACT(HOUR FROM diff_interval);
  diff_days = EXTRACT(DAY FROM diff_interval);
  
  IF diff_days > 0 THEN
    RETURN diff_days || 'd ' || diff_hours || 'h';
  ELSIF diff_hours > 0 THEN
    RETURN diff_hours || 'h ' || diff_minutes || 'min';
  ELSIF diff_minutes > 0 THEN
    RETURN diff_minutes || ' min';
  ELSE
    RETURN 'Agora mesmo';
  END IF;
END;
$$ language 'plpgsql';

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogadores_sala ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_jogos ENABLE ROW LEVEL SECURITY;

-- Política para salas (qualquer usuário autenticado pode ver)
CREATE POLICY "Usuários autenticados podem ver salas" ON salas
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para criar salas (qualquer usuário autenticado pode criar)
CREATE POLICY "Usuários autenticados podem criar salas" ON salas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para atualizar salas (apenas o host pode atualizar)
CREATE POLICY "Apenas o host pode atualizar salas" ON salas
  FOR UPDATE USING (auth.uid()::text = host_id::text);

-- Política para jogadores_sala (qualquer usuário autenticado pode ver)
CREATE POLICY "Usuários autenticados podem ver jogadores" ON jogadores_sala
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para entrar/sair de salas
CREATE POLICY "Usuários autenticados podem gerenciar participação" ON jogadores_sala
  FOR ALL USING (auth.role() = 'authenticated');

-- Política para histórico (qualquer usuário autenticado pode ver)
CREATE POLICY "Usuários autenticados podem ver histórico" ON historico_jogos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Inserir algumas salas de exemplo (opcional)
-- INSERT INTO salas (nome, max_jogadores, host_id, host_nome) VALUES 
--   ('Sala dos Iniciantes', 8, '00000000-0000-0000-0000-000000000001', 'Sistema'),
--   ('Pro Players', 6, '00000000-0000-0000-0000-000000000002', 'Sistema');

-- Comentários das tabelas
COMMENT ON TABLE salas IS 'Tabela principal para armazenar informações das salas de jogo';
COMMENT ON TABLE jogadores_sala IS 'Tabela para armazenar jogadores participantes de cada sala';
COMMENT ON TABLE historico_jogos IS 'Tabela para armazenar histórico de jogos finalizados';
COMMENT ON COLUMN salas.status IS 'Status da sala: aguardando, jogando, cheia, encerrada';
COMMENT ON COLUMN salas.configuracao IS 'Configurações específicas do jogo em formato JSON';
COMMENT ON COLUMN jogadores_sala.equipe IS 'Equipe do jogador: vermelha, azul, espectador';


