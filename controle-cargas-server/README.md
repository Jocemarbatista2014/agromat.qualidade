# Controle de Cargas — servidor (Agromat)

Versão do app que roda num servidor próprio (Railway), sem depender de conta no Claude.

- Login por código: `TEAM_CODE` (grupo) e `ADMIN_CODE` (só para o dono; também permite importar dados).
- Dados em SQLite e arquivos das ordens em disco (`DATA_DIR`, no Railway um Volume em `/data`).
- Leitura automática da ordem pela API da Anthropic. A chave fica só em `ANTHROPIC_API_KEY` (variável do servidor).
- `app-source.html` é o código do app; `node build.js` gera `public/app.html`.

## Variáveis de ambiente
`ADMIN_CODE`, `TEAM_CODE`, `SESSION_SECRET` (24+ caracteres), `ANTHROPIC_API_KEY`, `DATA_DIR`, `NODE_ENV=production`.
Opcional: `ANTHROPIC_MODEL`.

Nunca coloque códigos ou chave neste repositório.
