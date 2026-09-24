# J&P Serviços Médicos — Painel de Recrutamento

Painel de recrutamento em React + TypeScript, com back-end em **Cloudflare Workers**,
banco de dados **D1** (candidatos, entrevistas, usuários) e armazenamento de arquivos
(currículos, PDFs e demais documentos) no **R2**.

## Login preservado

O login foi mantido no visual aprovado da V13:
- imagem da clínica;
- animação/vídeo de folhas caindo;
- identidade visual J&P;
- botão de entrada sem seta.

A autenticação em si deixou de ser simulada: agora existe um usuário administrador
real, com senha protegida (hash + salt) e sessão assinada por cookie `HttpOnly`.

## Arquitetura

```
src/          front-end React (Vite) — dashboard administrativo e formulário público
worker/       API em Cloudflare Workers (framework Hono)
shared/       tipos TypeScript compartilhados entre front-end e worker
migrations/   schema do banco D1 (SQL)
wrangler.toml configuração do Worker: assets, banco D1 e bucket R2
```

O Worker cuida de tudo que precisa de servidor:
- autenticação do painel (`/api/auth/*`);
- CRUD de candidatos e entrevistas (`/api/candidates`, `/api/interviews`), gravados no **D1**;
- upload/download de documentos (currículos, RG, diplomas etc.), gravados no **R2**
  (`/api/candidates/:id/documents`, `/api/documents/:id`);
- recebimento da candidatura pública (`/api/public/applications`), usada pelo formulário
  que médicos e colaboradores preenchem.

Fora da rota `/api/*`, o próprio Worker serve o build do front-end (pasta `dist/`)
como assets estáticos — um único deploy publica o site inteiro.

## Executar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar os recursos no Cloudflare (uma vez só)

```bash
npx wrangler login
npx wrangler d1 create jp-recrutamento-db
npx wrangler r2 bucket create jp-recrutamento-documentos
```

O comando `d1 create` imprime um `database_id`. Copie esse valor para o campo
`database_id` em `wrangler.toml` (substituindo `REPLACE_WITH_YOUR_D1_DATABASE_ID`).

### 3. Configurar a chave de sessão local

```bash
cp .dev.vars.example .dev.vars
```

Edite `.dev.vars` e defina `AUTH_SECRET` com um valor aleatório (por exemplo,
gerado com `openssl rand -base64 48`). Esse arquivo nunca é commitado.

### 4. Aplicar o schema no banco local

```bash
npm run db:migrate:local
```

### 5. Rodar front-end e API juntos

Em dois terminais separados:

```bash
npm run dev:worker   # API (Worker) em http://localhost:8787
npm run dev          # front-end (Vite) em http://localhost:5173, com hot reload
```

O Vite encaminha automaticamente as chamadas `/api/*` para o Worker local
(veja `vite.config.ts`). Acesse `http://localhost:5173`.

No primeiro acesso, a tela de login detecta que ainda não existe administrador
cadastrado e exibe um formulário para criar a primeira conta (nome, e-mail e senha).

## Gerar build

```bash
npm run build
```

Gera o front-end em `dist/` e roda a checagem de tipos (front-end e Worker).

## Publicar no Cloudflare

### Primeira publicação (manual)

```bash
npx wrangler d1 migrations apply jp-recrutamento-db --remote
npx wrangler secret put AUTH_SECRET
npm run deploy
```

O `wrangler secret put` pede o valor da chave no terminal — use um valor aleatório
diferente do usado em desenvolvimento. `npm run deploy` gera o build e publica o
Worker (front-end + API) no seu domínio `*.workers.dev` (ou domínio customizado,
se configurado no painel da Cloudflare).

### Publicação automática (GitHub Actions)

O projeto já contém `.github/workflows/deploy-cloudflare.yml`, que publica a cada
push na branch `main`. Para ativar, cadastre em **Settings → Secrets and variables →
Actions** do repositório:

- `CLOUDFLARE_API_TOKEN` — token com permissão de editar Workers, D1 e R2;
- `CLOUDFLARE_ACCOUNT_ID` — id da sua conta Cloudflare.

A cada push, o workflow instala as dependências, valida os tipos, aplica migrações
pendentes do D1 e publica o Worker.

## Sobre os dados

Candidatos, entrevistas e usuários ficam no **D1**; currículos, documentos e demais
anexos (PDF, JPG, PNG) ficam no **R2**. Nada de dados de candidatos é salvo no
navegador ou no GitHub — o `localStorage` do painel só guarda preferências de
interface (tema claro/escuro, menu lateral recolhido).
