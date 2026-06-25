# 🏟️ QuizTático

> Adivinhe o time, técnico ou formação pela escalação — um desafio novo todo dia.

---

## 🎮 Sobre o Projeto

**QuizTático** é um jogo diário estilo Wordle focado em futebol. A cada dia, uma escalação é exibida no campo e o jogador deve adivinhar qual time, técnico ou formação está representado.

### Funcionalidades
- ⚽ **Desafio diário** — nova escalação toda meia-noite
- 🟩🟨⬛ **Feedback Wordle** — correto, parcial ou errado
- ⏱️ **Timer** — cronômetro para medir velocidade
- 🏆 **Ranking diário** — top jogadores do dia (por tentativas e tempo)
- 📊 **Ranking global** — histórico de vitórias de todos os jogadores
- 📈 **Estatísticas pessoais** — streak, distribuição de tentativas, melhor tempo
- 📤 **Compartilhamento** — compartilhe seu resultado com emojis
- 🔐 **Painel admin** — crie e gerencie quizzes

---

## 🚀 Stack Tecnológica

| Camada | Tecnologia | Motivo |
|--------|------------|--------|
| **Backend** | Node.js + Express + tRPC | Tipagem end-to-end, zero custo |
| **Frontend** | React + Vite + Tailwind | SPA moderna e responsiva |
| **Banco** | SQLite (better-sqlite3) | Embutido, zero custo, sem servidor |
| **ORM** | Drizzle ORM | Type-safe, leve |
| **Auth** | OAuth (sessão em cookie HTTP-only) | Segura, sem senha |
| **Deploy** | Render / Railway free tier | Gratuito |

---

## 🔒 Segurança

- ✅ **Validação server-side** — a resposta nunca vai ao cliente antes do fim do jogo
- ✅ **Rate limiting por IP** — máx. 300 req/min globalmente
- ✅ **Rate limiting por usuário** — máx. 30 tentativas/hora via banco
- ✅ **Headers HTTP de segurança** — X-Frame-Options, CSP, HSTS, etc.
- ✅ **Autenticação obrigatória** para enviar respostas
- ✅ **Autorização admin** — rota separada com verificação de role
- ✅ **Sanitização de inputs** — Zod valida todos os dados de entrada
- ✅ **Limite de tentativas** — máx. 6 por quiz, verificado no servidor
- ✅ **Sessão HTTP-only cookie** — token não acessível via JavaScript

---

## 📦 Instalação Local

### Pré-requisitos
- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/quiz-tatico.git
cd quiz-tatico

# 2. Instale as dependências
pnpm install

# 3. Configure o ambiente
cp .env.example .env
# Edite o .env com suas configurações

# 4. Rode em desenvolvimento
pnpm dev
```

O servidor estará em `http://localhost:3000`.

### Primeiro acesso (configurar admin)
1. Faça login normalmente
2. No `.env`, coloque seu `openId` em `OWNER_OPEN_ID`
3. Reinicie o servidor
4. Acesse `/admin` para criar quizzes

---

## 🌐 Deploy Gratuito

### Opção 1: Render.com (Recomendado)

1. Crie conta em [render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Crie um **Web Service**:
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `pnpm start`
4. Configure as variáveis de ambiente no painel do Render
5. O banco SQLite fica em disco persistente (Render free tier inclui 1GB)

### Opção 2: Railway.app

1. Crie conta em [railway.app](https://railway.app)
2. Conecte o repositório
3. Configure as variáveis de ambiente
4. Deploy automático a cada push

### Opção 3: Fly.io

```bash
# Instale o CLI
brew install flyctl

# Login e deploy
fly auth login
fly launch
fly deploy
```

### ⚠️ Importante sobre o SQLite em produção
- O banco fica em `./data/quiz-tatico.db`
- No Render, use um **Persistent Disk** para não perder dados no redeploy
- Faça backup periódico do arquivo `.db`

---

## 📁 Estrutura do Projeto

```
quiz-tatico/
├── client/               # Frontend React
│   └── src/
│       ├── pages/        # Páginas (Home, Ranking, Stats, Admin)
│       ├── components/   # Componentes (FootballPitch, UI)
│       └── index.css     # Design system (tema estádio noturno)
├── server/               # Backend Node.js
│   ├── routers/          # Endpoints tRPC (quiz, admin)
│   ├── _core/            # Infraestrutura (auth, segurança, OAuth)
│   └── db.ts             # Camada de dados com SQLite
├── drizzle/              # Schema do banco de dados
├── shared/               # Tipos compartilhados
├── data/                 # Banco SQLite (gerado automaticamente)
├── .env.example          # Variáveis de ambiente necessárias
└── README.md
```

---

## 🎨 Design

Tema **Estádio Noturno**:
- Fundo preto-esverdeado (`#0a0f0a`) — gramado às 22h
- Verde lima (`#22c55e`) — cor primária, chutes e gols
- Âmbar (`#f59e0b`) — destaques e dicas
- Tipografia: Inter (legível, moderna, esportiva)

---

## 🗓️ Roadmap

- [ ] Modo torneio entre amigos
- [ ] Escalações históricas (décadas de futebol)
- [ ] App mobile (PWA)
- [ ] Notificações diárias
- [ ] API pública para dados históricos

---

## 📄 Licença

MIT — use à vontade!
