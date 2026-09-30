# Cidade FiveM — RP + PVP

Servidor único com duas áreas: **RP** (cidade) e **PVP** (arena/zonas de combate).
Este repositório guarda os scripts (resources). O servidor em si (FXServer + banco) fica instalado à parte.

## Estrutura

```
fivem-server/
├── server.cfg.example      # modelo do server.cfg (sem segredos)
├── secrets.cfg             # NÃO vai pro Git: licença, senha do banco
├── resources/
│   ├── [shared]/           # libs e utilidades (ox_lib, etc.)
│   ├── [rp]/               # scripts de roleplay (jp_base, empregos, economia...)
│   └── [pvp]/              # scripts de PVP (arena, ranking, loadouts...)
└── docs/WORKFLOW.md        # como vocês dois trabalham juntos
```

## Como começar (cada um na sua máquina)

1. Baixe o **FXServer** (artifacts) oficial: https://runtime.fivem.net/artifacts/fivem/
2. Crie uma **license key** grátis em https://keymaster.fivem.net (uma por pessoa/servidor).
3. Clone este repositório e copie `server.cfg.example` → `server.cfg`; crie `secrets.cfg` com:
   ```
   sv_licenseKey "SUA_KEY"
   set mysql_connection_string "mysql://user:senha@localhost/fivem"
   ```
4. Aponte o FXServer para a pasta `fivem-server/` (`+exec server.cfg`) e rode.
5. Instale **Git + VS Code** (extensões: *Lua*, *GitLens*).

Recomendado: framework **QBCore**/**QBox** ou **ESX** + **oxmysql** + **ox_lib**. Escolham UM framework e
mantenham os dois iguais (ver `docs/WORKFLOW.md`).

## Regras de ouro

- Nunca commitar `secrets.cfg`, keys, senhas ou `txData/`.
- Um resource por pasta; cada resource com `fxmanifest.lua`.
- Nunca trabalhar direto na `main`: use branch + Pull Request (detalhes em `docs/WORKFLOW.md`).
