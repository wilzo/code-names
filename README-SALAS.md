# 🎮 Sistema de Salas - Código Secreto

Este é um sistema completo de gerenciamento de salas para o jogo Código Secreto, integrado com Supabase e Next.js.

## 🚀 Funcionalidades

### ✅ **Backend (Node.js + Express)**

- **CRUD completo de salas** com validações
- **Sistema de jogadores** com controle de entrada/saída
- **Controle de status** (aguardando, jogando, cheia, encerrada)
- **Filtros e busca** por status e tipo de sala
- **Validações de negócio** (mínimo de jogadores, capacidade máxima)
- **Logs detalhados** para debug

### ✅ **Frontend (Next.js + TypeScript)**

- **Lista de salas em tempo real** carregada do banco
- **Filtros funcionais** (status, tipo de sala)
- **Sistema de autenticação** integrado
- **Interface responsiva** com Tailwind CSS
- **Proteção de rotas** para usuários logados
- **Atualização automática** da lista de salas

### ✅ **Banco de Dados (Supabase)**

- **Tabelas relacionais** com constraints
- **Row Level Security (RLS)** para segurança
- **Triggers automáticos** para validações
- **Índices otimizados** para performance
- **Funções SQL** para cálculos de tempo

## 🛠️ Configuração

### 1. **Backend**

```bash
cd backend
npm install
npm start
```

### 2. **Frontend**

```bash
cd frontend
npm install
npm run dev
```

### 3. **Banco de Dados (Supabase)**

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Abra seu projeto
3. Vá para **SQL Editor**
4. Execute o arquivo `supabase-schema.sql`

## 📊 Estrutura do Banco

### **Tabela `salas`**

- `id`: UUID único da sala
- `nome`: Nome da sala
- `max_jogadores`: Capacidade máxima
- `privada`: Se a sala é privada
- `host_id`: ID do criador da sala
- `status`: Status atual (aguardando, jogando, cheia, encerrada)
- `jogadores_atual`: Número atual de jogadores
- `criada_em`: Data de criação
- `tempo_inicio`: Quando o jogo começou
- `tempo_espera`: Quando começou a esperar

### **Tabela `jogadores_sala`**

- `id`: UUID único da participação
- `sala_id`: Referência à sala
- `usuario_id`: ID do usuário
- `nome_usuario`: Nome do jogador
- `is_host`: Se é o criador da sala
- `equipe`: Equipe do jogador (vermelha, azul, espectador)
- `pontos`: Pontuação no jogo

## 🔄 Fluxo de Funcionamento

### **1. Criar Sala**

```
Usuário → Formulário → Backend → Supabase → Sala criada
```

### **2. Listar Salas**

```
Frontend → Backend → Supabase → Dados processados → Interface
```

### **3. Entrar em Sala**

```
Usuário → Botão "Entrar" → Backend → Validações → Jogador adicionado
```

### **4. Atualizações**

```
Backend → Supabase → Frontend → Interface atualizada
```

## 🎯 Endpoints da API

### **Salas**

- `POST /api/salas` - Criar sala
- `GET /api/salas` - Listar salas (com filtros)
- `GET /api/salas/:id` - Detalhes da sala
- `POST /api/salas/:id/entrar` - Entrar na sala
- `POST /api/salas/:id/sair` - Sair da sala
- `POST /api/salas/:id/iniciar` - Iniciar jogo
- `POST /api/salas/:id/encerrar` - Encerrar sala

## 🔒 Segurança

### **Row Level Security (RLS)**

- Usuários autenticados podem ver todas as salas
- Apenas o host pode modificar sua sala
- Controle de acesso baseado em autenticação

### **Validações**

- Mínimo de 2 jogadores para iniciar
- Máximo de jogadores respeitado
- Verificação de permissões antes de ações

## 🎨 Interface

### **Componentes Principais**

- `SalasPage`: Lista principal de salas
- `CriarSalaForm`: Formulário para criar salas
- `ProtectedRoute`: Proteção de rotas
- `MenuPerfil`: Menu do usuário logado

### **Estados da Interface**

- **Loading**: Carregando dados
- **Error**: Exibindo erros
- **Empty**: Nenhuma sala encontrada
- **Success**: Dados carregados com sucesso

## 🚀 Como Usar

### **1. Primeira Execução**

1. Configure o Supabase com o schema
2. Inicie backend e frontend
3. Faça login/registro
4. Crie sua primeira sala

### **2. Uso Diário**

1. Acesse `/salas` para ver salas disponíveis
2. Use filtros para encontrar salas específicas
3. Clique em "Entrar" para participar
4. Crie novas salas quando necessário

### **3. Gerenciamento**

- **Host**: Pode iniciar, encerrar e gerenciar a sala
- **Jogadores**: Podem entrar/sair de salas disponíveis
- **Sistema**: Atualiza status automaticamente

## 🔧 Personalização

### **Adicionar Novos Campos**

1. Atualize o schema SQL
2. Modifique as interfaces TypeScript
3. Atualize o backend e frontend
4. Teste as funcionalidades

### **Novos Status**

1. Adicione na constraint CHECK da tabela
2. Atualize as funções de cor e texto
3. Implemente a lógica específica

## 🐛 Troubleshooting

### **Erro: "Tabela não encontrada"**

- Execute o schema SQL no Supabase
- Verifique se as tabelas foram criadas

### **Erro: "Permissão negada"**

- Verifique as políticas RLS
- Confirme se o usuário está autenticado

### **Salas não carregam**

- Verifique a conexão com o backend
- Confirme se o Supabase está acessível
- Verifique os logs do console

## 📈 Próximos Passos

### **Funcionalidades Futuras**

- [ ] Sistema de chat em tempo real
- [ ] Notificações push
- [ ] Sistema de rankings
- [ ] Histórico de jogos
- [ ] Estatísticas de usuários
- [ ] Sistema de convites
- [ ] Modo espectador

### **Melhorias Técnicas**

- [ ] WebSockets para atualizações em tempo real
- [ ] Cache Redis para performance
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Monitoramento e logs

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Teste localmente
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**Desenvolvido com ❤️ para a comunidade de jogos de palavras!**
