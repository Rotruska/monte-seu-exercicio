# Monte seu Exercício

Guia de exercícios com vídeos e montador de treino.
Site: https://rotruska.github.io/monte-seu-exercicio/

## O que dá para fazer

- Filtrar por músculo e equipamento e buscar pelo nome.
- Tocar na imagem do exercício e ver o vídeo ali mesmo.
- Montar treinos com séries, repetições e descanso. Começa com A, B e C; o botão **+**
  cria mais, até 7 (ex.: PPL + Upper/Lower = 5 treinos).
  O treino fica salvo no próprio celular ou computador.
- Mandar o treino pelo WhatsApp, copiar um link (quem abre recebe o treino pronto) ou imprimir.
- Instalar como app: no celular, abra o site e escolha "Adicionar à tela inicial".

## Como incluir ou mudar exercícios

Tudo fica em **`js/exercicios.js`**. Copie um bloco `{ ... }`, cole embaixo e troque
nome, músculo, equipamento, dica e link do vídeo. As instruções estão no topo do arquivo.
Os filtros e os números do topo se ajustam sozinhos.

Importante: não repita nomes. Se mudar o nome de um exercício, quem já tinha
ele salvo num treino perde só aquele item.

## Arquivos

| Arquivo | Para que serve |
| --- | --- |
| `index.html` | A página |
| `js/exercicios.js` | A lista de exercícios (é aqui que você edita) |
| `js/app.js` | O funcionamento do site |
| `css/estilo.css` | As cores e o visual |
| `manifest.webmanifest`, `sw.js`, `img/` | Ícone e "instalar como app" |
