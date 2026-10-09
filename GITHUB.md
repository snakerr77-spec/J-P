# Publicação via GitHub Actions → Cloudflare

O repositório publica automaticamente no Cloudflare Workers a cada push na branch
`main`, usando o workflow `.github/workflows/deploy-cloudflare.yml`.

## Configuração inicial

1. Crie os recursos na Cloudflare (uma vez só, veja detalhes no `README.md`):
   ```bash
   npx wrangler login
   npx wrangler d1 create jp-recrutamento-db
   npx wrangler r2 bucket create jp-recrutamento-documentos
   npx wrangler secret put AUTH_SECRET
   npx wrangler secret put RESEND_API_KEY
   ```
2. Copie o `database_id` retornado por `d1 create` para `wrangler.toml`.
3. No repositório do GitHub, acesse **Settings → Secrets and variables → Actions**
   e cadastre:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. Faça commit e push das alterações (incluindo o `database_id` em `wrangler.toml`):
   ```bash
   git add .
   git commit -m "Configurar deploy Cloudflare"
   git push
   ```

## Próximas atualizações

```bash
git add .
git commit -m "Atualização do J&P"
git push
```

O deploy é automático após o push na branch `main`: o workflow instala as
dependências, checa os tipos, aplica migrações pendentes do banco D1 e publica o
Worker (front-end + API) na Cloudflare. Acompanhe o progresso na aba **Actions**.
