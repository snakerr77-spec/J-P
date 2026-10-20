# Publicação via GitHub Actions → Cloudflare

O repositório publica automaticamente no Cloudflare Workers a cada push na branch
`main`, usando o workflow `.github/workflows/deploy-cloudflare.yml`.

## Configuração inicial

1. O `wrangler.toml` já aponta para o banco D1 `j-p` e o bucket R2
   `jp-credenciamento-documentos` já existentes (projeto `jp-credenciamento`),
   então não é preciso criar nada — só autenticar e configurar os segredos
   (veja detalhes no `README.md`):
   ```bash
   npx wrangler login
   npx wrangler secret put AUTH_SECRET
   npx wrangler secret put RESEND_API_KEY
   ```
2. No repositório do GitHub, acesse **Settings → Secrets and variables → Actions**
   e cadastre:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. Faça commit e push das alterações:
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
