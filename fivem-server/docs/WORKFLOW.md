# Como trabalhar juntos nos scripts

## 1. Dar acesso ao amigo
GitHub → repositório → **Settings → Collaborators → Add people** (permissão *Write*).
Se o repositório for privado (recomendado), só vocês dois veem o código.

## 2. Fluxo do dia a dia (branches)

```bash
git checkout main && git pull           # sempre começa atualizado
git checkout -b feat/nome-da-coisa      # ex: feat/emprego-mecanico, fix/arena-spawn
# ... edita os scripts, testa no servidor local ...
git add -A && git commit -m "feat: emprego de mecânico"
git push -u origin feat/nome-da-coisa
```
Abra um **Pull Request** no GitHub → o outro revisa → **Merge** na `main`.
Dica: proteja a `main` (Settings → Branches → Require pull request), assim ninguém quebra o servidor sem querer.

## 3. Evitar conflitos
- Combinem quem mexe em qual resource (ex.: você = `[rp]`, amigo = `[pvp]`). Use *Issues* como lista de tarefas.
- Arquivos compartilhados (`server.cfg.example`, configs globais): mudanças pequenas e commits frequentes.
- `git pull` antes de começar e antes de abrir o PR.

## 4. Ambientes
| Ambiente | Para quê | Como atualiza |
|---|---|---|
| Local (cada um) | desenvolver/testar | `git pull` |
| Servidor de teste | testar junto | `git pull` + `restart resource` |
| Produção | jogadores | só o que está na `main` |

Dica: no VPS, `git pull` e depois `refresh` + `ensure jp_base` no console (sem reiniciar tudo).

## 5. Editar ao mesmo tempo, ao vivo (opcional)
- **VS Code Live Share** — os dois editam o mesmo arquivo em tempo real (bom para programar em dupla).
- **Codespaces/Claude Code** — editar pelo navegador direto no repositório.

## 6. Banco de dados
Não versionem o banco. Versionem **arquivos `.sql`** em `resources/[rp]/<resource>/sql/` e rodem nos dois ambientes.

## 7. Segurança (não pular)
- Validar tudo no **server-side**: o client nunca decide dinheiro, itens, dano ou permissões.
- Segredos só em `secrets.cfg` (fora do Git). Se vazar uma key, troque no Keymaster.
- Sem caixa-preta: não instalem scripts "leaked/crackeados" (backdoors são comuns e podem derrubar/roubar o servidor). Usem fontes oficiais (Cfx.re forum, GitHub de QBCore/ox).
