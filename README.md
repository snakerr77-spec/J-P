# J&P Serviços Médicos — GitHub Ready

Painel de recrutamento em React + TypeScript, preparado para versionamento no GitHub e publicação automática pelo GitHub Pages.

## Login preservado

O login foi mantido no visual aprovado da V13:
- imagem da clínica;
- animação/vídeo de folhas caindo;
- identidade visual J&P;
- botão de entrada sem seta.

## Agendamento de consultas (novo)

Página pública para o paciente agendar consulta escolhendo o profissional, com valores à vista.

- **Link:** `#/agendar` (e `#/agendar/<id-do-profissional>` para abrir já no profissional, ex.: `#/agendar/camila-nogueira`).
- **Fluxo em 4 etapas:** profissional (busca + filtro por especialidade, valor e próximo horário livre) → data/horário (presencial ou telemedicina; primeira consulta ou retorno) → dados do paciente (particular ou convênio, aceite LGPD) → confirmação (protocolo, WhatsApp e arquivo `.ics` para o calendário).
- **Valores de exemplo** (BRL): Clínica Geral R$ 200–220, Cardiologia R$ 380, Dermatologia R$ 420, Ginecologia R$ 350, Pediatria R$ 300, Ortopedia R$ 380, Neurologia R$ 450, Psiquiatria R$ 480; retorno = 50% e telemedicina com valor próprio.
- **Painel > Clínica > Consultas:** KPIs, lista de agendamentos (confirmar, concluir, faltou, cancelar, reabrir, WhatsApp do paciente), edição de valores e visibilidade por profissional, links diretos. Cancelar libera o horário.
- **Onde editar os dados:** `src/booking/config.ts` (clínica, contatos, profissionais, agenda semanal, valores). **Os profissionais, CRMs, WhatsApp e valores atuais são exemplos: substitua antes de publicar** e desligue `clinic.demoNotice`.

### Paleta

Azul-marinho da marca J&P (`#0a3b6f`), turquesa do "&" da logo (`#20b8c6` / texto `#0b7c88`) e dourado de destaque (`#d7a94d`) sobre fundo `#f3f8fb`. Tokens em `src/tailwind.css` (classe `.clinic-theme`); contrastes conferidos para WCAG AA.

### Componentes (compatível com 21st.dev / shadcn)

A página usa Tailwind v4 + componentes no padrão shadcn/ui (`src/components/ui`, `cn` em `src/lib/utils.ts`, `components.json`). Para trazer outros componentes do 21st.dev:

```bash
npx shadcn@latest add "https://21st.dev/r/<autor>/<componente>"
```

O CSS antigo do painel (`src/styles.css`) fica na cascade layer `legacy`, por isso o painel não é afetado pelo Tailwind. O reset do Tailwind é aplicado só dentro de `.clinic-theme`.

### Limitações atuais

Sem back-end, as consultas ficam no `localStorage` do navegador (mesmo modelo das candidaturas): o painel só enxerga agendamentos feitos no mesmo navegador. Para uso real multi-dispositivo, conecte a API planejada (Cloudflare D1) trocando as funções de `src/booking/storage.ts`. Enquanto isso, `SIMULATE_BUSY_SLOTS` em `config.ts` marca ~28% dos horários como ocupados só para demonstração; coloque `false` ao integrar a agenda real.

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
