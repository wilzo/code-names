-- Apenas corrigir as políticas RLS - Execute este arquivo no Supabase SQL Editor

-- 1. REMOVER POLÍTICAS ANTIGAS
DROP POLICY IF EXISTS "Usuários autenticados podem ver salas" ON salas;
DROP POLICY IF EXISTS "Usuários autenticados podem criar salas" ON salas;
DROP POLICY IF EXISTS "Apenas o host pode atualizar salas" ON salas;
DROP POLICY IF EXISTS "Permitir todas as operações em desenvolvimento" ON salas;

DROP POLICY IF EXISTS "Usuários autenticados podem ver jogadores" ON jogadores_sala;
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar participação" ON jogadores_sala;
DROP POLICY IF EXISTS "Permitir todas as operações em desenvolvimento" ON jogadores_sala;

DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico" ON historico_jogos;
DROP POLICY IF EXISTS "Permitir todas as operações em desenvolvimento" ON historico_jogos;

-- 2. CRIAR NOVAS POLÍTICAS PERMISSIVAS
CREATE POLICY "Permitir todas as operações em desenvolvimento" ON salas
  FOR ALL USING (true);

CREATE POLICY "Permitir todas as operações em desenvolvimento" ON jogadores_sala
  FOR ALL USING (true);

CREATE POLICY "Permitir todas as operações em desenvolvimento" ON historico_jogos
  FOR ALL USING (true);

-- 3. VERIFICAÇÃO
SELECT 'Políticas RLS corrigidas com sucesso!' as resultado;
SELECT 'Agora você pode inserir dados via API' as info;
