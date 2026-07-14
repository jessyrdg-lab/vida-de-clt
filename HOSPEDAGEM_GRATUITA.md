# Hospedagem gratuita do Vida de CLT

Esta configuração usa três serviços gratuitos:

- **GitHub Pages:** exibe o jogo imediatamente.
- **Render:** executa o backend e valida as ações.
- **Neon:** guarda saves e o Ranking Global em PostgreSQL.

O jogo continua usando SQLite quando é executado no computador. Na hospedagem, ele troca automaticamente para PostgreSQL quando encontra a variável `DATABASE_URL`.

## 1. Colocar o projeto no GitHub

1. Crie um repositório público no GitHub.
2. Coloque o conteúdo da pasta `entrada` na raiz desse repositório.
3. Confirme que a branch principal se chama `main`.

Não envie arquivos `.env`, `game.db`, `game.db-shm` ou `game.db-wal`. Eles já estão protegidos pelo `.gitignore`.

## 2. Criar o banco gratuito no Neon

1. Crie uma conta em https://neon.com.
2. Crie um projeto PostgreSQL gratuito.
3. Escolha a região **AWS US East (N. Virginia)** para ficar na mesma região do backend.
4. Abra **Connect** e copie a connection string completa.
5. Prefira a conexão com pool e mantenha `sslmode=require` no final.

As tabelas são criadas automaticamente quando o backend iniciar pela primeira vez.

## 3. Publicar o backend no Render

1. Crie uma conta em https://render.com e conecte o GitHub.
2. Escolha **New > Blueprint** e selecione o repositório.
3. O Render encontrará o arquivo `render.yaml` e criará o serviço `vida-de-clt-api`.
   A região **Virginia** já está configurada no arquivo.
4. Quando solicitado, informe:
   - `DATABASE_URL`: cole a connection string do Neon.
   - `ALLOWED_ORIGIN`: use `https://SEU-USUARIO.github.io`.
5. Aguarde a publicação terminar.
6. Copie o endereço criado, parecido com `https://vida-de-clt-api.onrender.com`.

Teste abrindo `https://SEU-ENDERECO.onrender.com/health`. A resposta deve conter `"ok": true`.

## 4. Ligar o GitHub Pages ao backend

1. No repositório, abra **Settings > Secrets and variables > Actions > Variables**.
2. Crie uma variável chamada `VITE_API_URL`.
3. Use como valor o endereço do Render com `/api/game` no final, por exemplo:
   `https://vida-de-clt-api.onrender.com/api/game`
4. Abra **Settings > Pages**.
5. Em **Source**, selecione **GitHub Actions**.
6. Abra a aba **Actions**, escolha **Publicar jogo no GitHub Pages** e execute o fluxo.

O endereço final será semelhante a:
`https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`

## Comportamento do servidor gratuito

Depois de alguns minutos sem visitas, o Render pode suspender o backend. O site do GitHub Pages continuará abrindo imediatamente e mostrará a mensagem **Iniciando o servidor, aguarde alguns segundos...**. O jogo tenta novamente de forma automática e carrega o save assim que o backend responder.

Como os dados ficam no Neon, o servidor dormir ou reiniciar não apaga saves nem o Ranking Global.
