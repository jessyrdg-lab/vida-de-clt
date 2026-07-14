# Vida de CLT

Jogo de navegador em React/Vite com backend Node.js, Express e SQLite. O backend é a fonte da verdade do estado da partida: o navegador envia ações e recebe os novos dados já validados e persistidos.

## Requisitos

- Node.js 20+
- npm

## Instalação

Na raiz do projeto:

```bash
npm install
npm --prefix backend install
```

## Executar localmente

Abra dois terminais na raiz do projeto.

Terminal do backend:

```bash
npm run dev:backend
```

Terminal do frontend:

```bash
npm run dev
```

Depois abra `http://localhost:3000`. O backend responde em `http://localhost:3001` e cria o banco `game.db` automaticamente.

## Variáveis de ambiente

Frontend (`.env.local`):

```env
VITE_API_URL=http://localhost:3001/api/game
GEMINI_API_KEY=PLACEHOLDER_API_KEY
```

Backend (`backend/.env`, opcional em desenvolvimento):

```env
PORT=3001
ALLOWED_ORIGIN=http://localhost:3000
```

## Build

```bash
npm run build
npm run build:backend
```

Em produção, configure `VITE_API_URL` com a URL pública do backend e `ALLOWED_ORIGIN` com a URL pública do frontend. O arquivo `game.db` precisa ficar em armazenamento persistente.
