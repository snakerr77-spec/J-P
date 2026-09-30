# Porto Esmeralda — RP + PVP

> *"Sol, mar e pólvora. Em Porto Esmeralda a lei mora na Delegacia Central, e o morro manda no resto."*

Cidade de roleplay com PVP no mesmo servidor, feita com scripts **próprios** (sem framework externo,
sem banco de dados obrigatório). Roda no mapa padrão do GTA V.

## O que já vem pronto

| Resource | O que faz |
|---|---|
| `pe_core` | Jogador, dinheiro (mãos/banco), inventário, itens, empregos e salários, fome/sede, HUD, escolha de personagem, `/me` `/do` `/ooc` `/pagar` `/contratar` `/demitir` |
| `pe_menu` | Menu e caixa de digitação (NUI) usados por todos os scripts |
| `pe_bank` | Bancos, caixas eletrônicos (props do mapa), depósito/saque/transferência, `/cobrar` |
| `pe_shops` | Lojas 24h e Armas & Cia (arma só com **porte**) |
| `pe_police` | Serviço, armário por patente, viaturas e **blindados** (Riot, RCV, SUV tática), algemas, escolta, revista, apreensão, multa, prisão, porte de arma, cones/barreiras, `/190`, alerta de tiros |
| `pe_ems` | Sistema de ferido/sangrando, chamado de socorro, reanimar, tratar, hospital, `/192` |
| `pe_garage` | Concessionária PDM, **concessionária de blindados**, garagens, pátio, tranca (L), **oficina** (motor, freio, câmbio, suspensão, turbo, **blindagem 1–5**, pneus à prova de bala, pintura) |
| `pe_jobs` | Centro de empregos, Entregador, Taxista (passageiros NPC), Mecânico |
| `pe_favela` | **Morro do Corvo**: plantação → laboratório → venda pra NPCs, **mercado negro** (Zé do Morro), **desmanche** de carros roubados, **lavagem** de dinheiro, **assalto ao carro-forte** |
| `pe_pvp` | Arena PVP com kits, respawn rápido, recompensa por kill, sequência e `/ranking` |
| `pe_admin` | `/dinheiro` `/daritem` `/setjob` `/porte` `/anuncio` `/kick` `/ir` `/trazer` `/reviver` `/pos` `/tpm` `/noclip` `/car` `/dv` |

## Instalando

1. Baixe o **FXServer** (Windows/Linux): https://runtime.fivem.net/artifacts/fivem/
2. Crie uma **license key** grátis: https://keymaster.fivem.net
3. Nesta pasta: `cp server.cfg.example server.cfg` e crie `secrets.cfg`:
   ```
   sv_licenseKey "SUA_KEY"
   ```
4. No `server.cfg`, descomente/ajuste `add_principal identifier.license:SEU_LICENSE group.admin`
   (entre no servidor uma vez e veja seu `license:` no console).
5. Rode o FXServer apontando para esta pasta: `FXServer +exec server.cfg`.
6. Conecte pelo F8 → `connect localhost`. O primeiro spawn abre a escolha de personagem.

Os dados dos jogadores (dinheiro, inventário, veículos, ranking) ficam em **KVP** do próprio FXServer
(`resources/.../kvs`), então **não precisa de MySQL** para começar.

## Como jogar (resumo)

- **F2** inventário · **F6** menu do trabalho (polícia/paramédico/mecânico) · **L** trancar carro · **E** interagir nos marcadores.
- Emprego civil: **Centro de Empregos** (Legion Square). Polícia e paramédico são **por contratação**:
  admin define com `/setjob ID policia 4`; o chefe depois usa `/contratar ID grade`.
- **Porte de arma**: sargento+ usa o menu F6 → *Conceder porte*. Sem porte, Armas & Cia não vende,
  e armas nas mãos de quem não tem porte podem ser apreendidas na revista.
- **Crime**: pegue folhas na plantação → refine no laboratório do morro → venda a pedestres dentro do morro
  (ganha **dinheiro sujo**) → lave no lava-rápido (taxa 25%). Tiros dentro do morro **não** chamam a polícia.
- **Carro-forte**: precisa de **explosivo** (mercado negro), ≥ 2 policiais em serviço, e tem cooldown de 45 min.
- **Arena**: portal na Maze Bank Arena → escolha o kit → `/sairarena` para sair.

## Ajustando coordenadas

Todas as posições ficam no `config.lua` de cada resource. Como o mapa é o GTA padrão, algumas podem
precisar de ajuste fino no jogo: como admin, use **/pos**, copie o `vec4(...)` e cole no config.
(Se um marcador não aparece ou fica dentro de uma parede, é isso.)

## O que NÃO vem (ideias para a próxima etapa)

Criador de personagem/roupas, celular, casas/propriedades, chat de voz (recomendo **pma-voice**),
combustível, sistema de chaves mais completo, placas/MDT completo e migração do KVP para MySQL
(**oxmysql**) quando o servidor crescer. Ver `docs/WORKFLOW.md` para o fluxo de trabalho em dupla.

> ⚠️ Este código foi escrito e testado com simulação de lógica do servidor, mas **ainda não foi
> rodado dentro do GTA**. Espere pequenos ajustes de coordenadas e de animações no primeiro teste.
