# 🗄️ Configuração do Banco de Dados Supabase

## 📋 Pré-requisitos

- Conta no Supabase (gratuita)
- Projeto criado no Supabase
- URL e chave anônima do projeto

## 🚀 Passo a Passo

### 1. Acessar o Supabase

1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Acesse seu projeto

### 2. Executar o Schema SQL

1. No painel do Supabase, vá para **SQL Editor**
2. Clique em **New Query**
3. Copie e cole todo o conteúdo do arquivo `supabase-schema.sql`
4. Clique em **Run** para executar

### 3. Verificar as Tabelas

1. Vá para **Table Editor**
2. Verifique se as seguintes tabelas foram criadas:
   - ✅ `salas`
   - ✅ `jogadores_sala`
   - ✅ `historico_jogos`

### 4. Configurar Variáveis de Ambiente

1. Vá para **Settings** > **API**
2. Copie a **URL** e **anon key**
3. Configure no arquivo `.env` do backend:

```env
SUPABASE_URL=sua_url_aqui
SUPABASE_ANON_KEY=sua_chave_aqui
```

### 5. Testar o Sistema

1. Reinicie o backend: `npm run dev`
2. Teste criar uma sala
3. Verifique se não há mais erros de relacionamento

## 🔧 Estrutura das Tabelas

### Tabela `salas`

- Armazena informações básicas das salas
- Status: aguardando, jogando, cheia, encerrada
- Controle de jogadores e configurações

### Tabela `jogadores_sala`

- Relaciona usuários com salas
- Controla quem é host e equipes
- Rastreia entrada e pontuação

### Tabela `historico_jogos`

- Armazena histórico de partidas
- Estatísticas e resultados

## 🚨 Problemas Comuns

### Erro: "relation does not exist"

- **Solução**: Execute o schema SQL primeiro
- **Verificação**: Confirme que as tabelas existem no Table Editor

### Erro: "foreign key relationship not found"

- **Solução**: As tabelas foram criadas mas sem relacionamentos
- **Verificação**: Execute o schema completo com FOREIGN KEYs

### Erro: "permission denied"

- **Solução**: Verifique as políticas RLS (Row Level Security)
- **Verificação**: Confirme que as políticas estão ativas

## 📞 Suporte

Se continuar com problemas:

1. Verifique os logs do backend
2. Confirme que as variáveis de ambiente estão corretas
3. Teste as conexões no SQL Editor do Supabase

## ✅ Checklist Final

- [ ] Schema SQL executado com sucesso
- [ ] Todas as tabelas criadas
- [ ] Variáveis de ambiente configuradas
- [ ] Backend reiniciado
- [ ] Teste de criação de sala funcionando
- [ ] Sem erros de relacionamento no console
