# Publicação no GitHub

## Primeira publicação

1. Crie um repositório vazio no GitHub.
2. Abra um terminal dentro da pasta do projeto.
3. Execute:

```bash
git init
git add .
git commit -m "Primeira versão J&P"
git branch -M main
git remote add origin URL_DO_REPOSITORIO.git
git push -u origin main
```

4. No repositório, acesse **Settings > Pages**.
5. Em **Build and deployment**, selecione **GitHub Actions**.
6. Acompanhe a publicação na aba **Actions**.

## Próximas atualizações

```bash
git add .
git commit -m "Atualização do J&P"
git push
```

O deploy é automático após o push na branch `main`.
