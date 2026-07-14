# Vida de CLT — Backend

Backend anti-cheat para o jogo Vida de CLT.  
Todo o estado do jogo fica no servidor — o cliente só envia **ações**, nunca valores diretos.

## Como funciona

```
Cliente                         Servidor
  │                                │
  │── dispatch({ type:'BUY_FOOD', qty:3 }) ──►│
  │                                │ valida ação contra estado salvo
  │                                │ aplica lógica (compra 3 comidas)
  │                                │ salva novo estado no SQLite
  │◄──── { ok:true, stats:{...} } ──│
  │                                │
  │  (atualiza UI com o novo estado)
```

Nenhum valor de `stats` vem do cliente. O servidor ignora qualquer tentativa de enviar
um saldo, comida ou saúde diretamente.

## Requisitos

- Node.js 20+
- npm

## Instalação

```bash
cd backend
npm install
```

## Rodar em desenvolvimento

```bash
cp .env.example .env
npm run dev
```

O servidor inicia em `http://localhost:3001`.  
O banco de dados `game.db` é criado automaticamente na primeira execução.

## Build para produção

```bash
npm run build
npm start
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/game/init` | Cria novo jogo. Body: `{ nick }`. Retorna `{ token, stats, events }` |
| `GET` | `/api/game/state` | Retorna estado atual. Header: `Authorization: Bearer <token>` |
| `POST` | `/api/game/action` | Processa uma ação. Header: token. Body: `{ type, ...params }` |
| `POST` | `/api/game/save` | Confirma o salvamento atual no servidor |
| `DELETE` | `/api/game/save` | Apaga o save do jogador |
| `GET` | `/health` | Health check do servidor |

## Integração no Frontend

1. Copie `apiClient.ts` para a raiz do projeto frontend
2. Adicione `VITE_API_URL=http://localhost:3001/api/game` no `.env.local`
3. No `App.tsx`, substitua o `saveSystem.ts` pelas funções do `apiClient.ts`:

```typescript
import { initGame, loadGame, dispatch, deleteSave } from './apiClient';

// Ao montar o app:
const saved = await loadGame();
if (saved) { setStats(saved.stats); setEvents(saved.events); }

// Ao passar mês:
const result = await dispatch({ type: 'PASS_MONTH' });
if (result.ok) { setStats(result.stats!); setEvents(result.events!); }

// Ao comprar comida:
const result = await dispatch({ type: 'BUY_FOOD', qty: 5 });
if (result.ok) { setStats(result.stats!); setEvents(result.events!); }
```

## Deploy em produção

Qualquer provedor Node.js funciona: **Render**, **Railway**, **Fly.io**, **VPS**.

Lembre de:
- Configurar `ALLOWED_ORIGIN` com a URL real do seu frontend
- O arquivo `game.db` precisa de um volume persistente (não use filesystem efêmero)
- Usar HTTPS em produção

## Segurança implementada

- **Estado server-side**: nenhum valor de stats vem do cliente
- **Rate limiting**: 200 req/15min global, 30 ações/min por IP
- **Validação de inputs**: qty, amounts e IDs são validados antes de aplicar
- **CORS restrito**: só aceita requisições da origem configurada
- **Tokens UUID**: identificam sessões sem expor dados sensíveis
- **Body size limit**: máximo 64kb por requisição

## Anti-cheat específico

Um jogador que tente:
- Editar o localStorage → consegue apagar o token, mas não alterar o estado (fica no SQLite)
- Usar DevTools para enviar `{ type: 'BUY_FOOD', qty: 99999 }` → servidor rejeita (qty > 200)
- Enviar `{ type: 'SET_SALDO', saldo: 9999999 }` → ação não existe, rejeitada
- Interceptar resposta e modificar → cliente recebe dados corretos na próxima ação (servidor ignora o estado local)
