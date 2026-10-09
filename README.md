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
real, com senha protegida (hash + salt), **verificação em duas etapas por e-mail
(MFA)** a cada login e sessão revogável guardada no D1 (cookie `HttpOnly`). Veja a
seção [Segurança](#segurança) para os detalhes.

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

### 3. Criar uma conta no Resend (envio do código de verificação)

O código de login (MFA) é enviado por e-mail usando o [Resend](https://resend.com):

1. Crie uma conta gratuita em https://resend.com e gere uma API key em
   https://resend.com/api-keys.
2. (Recomendado) Verifique um domínio seu em https://resend.com/domains para
   poder enviar como, por exemplo, `login@jpcredenciamentos.com.br` — isso só
   adiciona registros TXT/CNAME de autenticação (SPF/DKIM), **não muda o MX do
   seu domínio**, então não afeta o e-mail que você já usa para receber
   mensagens. Enquanto não verificar, o Resend só entrega para o e-mail da
   própria conta (serve para testar, não para produção).

### 4. Configurar os segredos locais

```bash
cp .dev.vars.example .dev.vars
```

Edite `.dev.vars` e defina:
- `AUTH_SECRET`: valor aleatório, por exemplo gerado com `openssl rand -base64 48`;
- `RESEND_API_KEY`: a chave criada no passo anterior.

Esse arquivo nunca é commitado.

### 5. Aplicar o schema no banco local

```bash
npm run db:migrate:local
```

### 6. Rodar front-end e API juntos

Em dois terminais separados:

```bash
npm run dev:worker   # API (Worker) em http://localhost:8787
npm run dev          # front-end (Vite) em http://localhost:5173, com hot reload
```

O Vite encaminha automaticamente as chamadas `/api/*` para o Worker local
(veja `vite.config.ts`). Acesse `http://localhost:5173`.

No primeiro acesso, a tela de login detecta que ainda não existe administrador
cadastrado e exibe um formulário para criar a primeira conta (nome, e-mail e
senha). Depois de enviar, chega um código de 6 dígitos no e-mail informado —
sem confirmar esse código, a conta não é liberada.

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
npx wrangler secret put RESEND_API_KEY
npm run deploy
```

Cada `wrangler secret put` pede o valor no terminal — use um `AUTH_SECRET`
aleatório diferente do usado em desenvolvimento, e a `RESEND_API_KEY` real da sua
conta Resend. `npm run deploy` gera o build e publica o Worker (front-end + API)
no seu domínio `*.workers.dev` (ou domínio customizado, se configurado no painel
da Cloudflare — por exemplo `jpcredenciamentos.com.br`, veja **Domínio customizado**
abaixo).

### Publicação automática (GitHub Actions)

O projeto já contém `.github/workflows/deploy-cloudflare.yml`, que publica a cada
push na branch `main`. Para ativar, cadastre em **Settings → Secrets and variables →
Actions** do repositório:

- `CLOUDFLARE_API_TOKEN` — token com permissão de editar Workers, D1 e R2;
- `CLOUDFLARE_ACCOUNT_ID` — id da sua conta Cloudflare.

A cada push, o workflow instala as dependências, valida os tipos, aplica migrações
pendentes do D1 e publica o Worker.

### Domínio customizado

Se o domínio (por exemplo `jpcredenciamentos.com.br`) já estiver na sua conta
Cloudflare: painel → **Workers & Pages** → o Worker `jp-recrutamento` →
**Settings → Domains & Routes → Add → Custom Domain**. A Cloudflare cria o
registro DNS e o certificado automaticamente. Se o domínio ainda aponta para
outro serviço (hospedagem antiga, outro Worker etc.), desative/apague essa
configuração antes para evitar conflito.

## Segurança

### Login em duas etapas (MFA por e-mail)

Depois de validar e-mail e senha, o painel **não libera acesso direto**: gera um
código de 6 dígitos, guarda só o hash dele no D1 (nunca o valor em texto puro) e
envia por e-mail via Resend. Regras:
- código expira em 10 minutos;
- no máximo 5 tentativas incorretas — depois disso é preciso fazer login de novo;
- reenvio tem intervalo mínimo de 30 segundos.

A sessão só é criada depois do código correto. Ela também fica no D1 (um token
aleatório no cookie, só o hash dele no banco), então **logout revoga de verdade**
— diferente de um JWT simples, que continuaria válido até expirar mesmo depois
do logout.

### Outras proteções já implementadas

- **Força bruta**: 5 tentativas de login erradas para o mesmo e-mail em 10
  minutos bloqueiam novas tentativas (mesmo com a senha certa) por esse tempo.
- **Senhas**: hash com PBKDF2 (100.000 iterações) + salt aleatório por usuário;
  nunca gravadas nem logadas em texto puro.
- **Cookies**: `HttpOnly`, `Secure` (em HTTPS) e `SameSite=Lax` — não acessíveis
  por JavaScript nem enviados em requisições cross-site.
- **Upload de documentos**: tipo (PDF/JPG/PNG) e tamanho (10 MB) validados no
  servidor, não só no navegador — e a candidatura só é criada se todos os
  arquivos passarem a validação.
- **Cabeçalhos HTTP** aplicados em toda resposta (API e site): `Content-Security-Policy`,
  `Strict-Transport-Security` (HSTS), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Cross-Origin-Opener-Policy` e `Cross-Origin-Resource-Policy`
  (veja `worker/index.ts`).

### Checklist no painel da Cloudflare

Isso não dá para configurar por aqui sem acesso à sua conta — faça manualmente
em **SSL/TLS** e **Security** no painel do domínio:
- **SSL/TLS → Overview**: modo **Full (strict)**;
- **SSL/TLS → Edge Certificates**: **Always Use HTTPS** ligado, **Minimum TLS
  Version** 1.2 ou superior, **HSTS** ativado (o Worker já envia o cabeçalho,
  mas ativar aqui também cobre outros hosts do mesmo domínio);
- **Security → WAF**: regras gerenciadas ligadas (disponível a partir do plano
  Pro) e, se quiser, uma regra de *rate limiting* específica para `/api/auth/*`
  como camada extra além do bloqueio por e-mail que a aplicação já faz;
- **Security → Bots**: Bot Fight Mode ligado;
- confira em **DNS** se não há registro antigo apontando esse domínio para
  outra hospedagem.

## Sobre os dados

Candidatos, entrevistas e usuários ficam no **D1**; currículos, documentos e demais
anexos (PDF, JPG, PNG) ficam no **R2**. Nada de dados de candidatos é salvo no
navegador ou no GitHub — o `localStorage` do painel só guarda preferências de
interface (tema claro/escuro, menu lateral recolhido).
