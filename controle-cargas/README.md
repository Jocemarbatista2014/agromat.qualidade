# Controle de Cargas (Agromat)

Código-fonte do app web de logística: cargas, contratos, leitura da ordem de
carregamento, liberação de embarque (PDF) e solicitação de abertura de OS.

- Arquivo único: `index.html`. Roda como Artifact do Claude, que fornece o banco de dados
  e os recursos de leitura de imagem, download e armazenamento de arquivos.
- Os dados (cargas, contratos, liberações e ordens) ficam no Artifact, **não neste repositório**.
- Aberto fora do Claude, a tela carrega mas pede para entrar para ver dados.
