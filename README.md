# J&P Serviços Médicos — GitHub Ready

Painel de recrutamento em React + TypeScript, preparado para versionamento no GitHub e publicação automática pelo GitHub Pages.

## Login preservado

O login foi mantido no visual aprovado da V13:
- imagem da clínica;
- animação/vídeo de folhas caindo;
- identidade visual J&P;
- botão de entrada sem seta.

## Executar localmente

```bash
npm install
npm run dev
```

## Gerar build

```bash
npm run build
```

## Publicar no GitHub Pages

O projeto já contém:
- `.gitignore`;
- `.github/workflows/deploy-pages.yml`;
- `public/.nojekyll`;
- `vite.config.ts` com base relativa para funcionar em repositórios do GitHub Pages.

Depois de criar um repositório vazio no GitHub:

```bash
git init
git add .
git commit -m "Primeira versão J&P"
git branch -M main
git remote add origin URL_DO_SEU_REPOSITORIO.git
git push -u origin main
```

No GitHub, abra **Settings > Pages** e selecione **GitHub Actions** como fonte de publicação.

A cada novo `git push` na branch `main`, o workflow gera o build e publica o site automaticamente.

## Importante sobre dados

Esta edição está pronta para hospedar o front-end no GitHub Pages. Dados de candidatos, currículos e documentos não devem ser tratados como banco de dados do GitHub. Para produção e sincronização entre dispositivos, use a API/Cloudflare (D1 + R2) planejada para o projeto.
