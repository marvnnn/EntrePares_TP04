# Arquivo Vivo — TP4 de AEDs III

## Participantes

- Arthur Campos Pereira
- Felipe Barros Silva
- Mateus Martins Parreiras

## Descrição

Página web simples para visualizar o CRUD de produtos em um arquivo binário simulado.

Os dados são armazenados no LocalStorage somente como um vetor de números inteiros entre 0 e 255. Não existe vetor de objetos persistido. Inclusão, consulta, alteração, exclusão e compactação percorrem e modificam diretamente os bytes.

A proposta do sistema é ajudar alunos de Algoritmos e Estruturas de Dados III a entenderem, de forma visual, como registros podem ser armazenados em arquivos e como as operações do CRUD alteram a estrutura interna desse arquivo.

![Tela principal do sistema](img/tela-principal.png)

## Arquivos

- `index.html` — estrutura da página.
- `styles.css` — design básico e responsivo.
- `app.js` — formato binário, CRUD, LocalStorage e controle da interface.

## Formato do arquivo

O arquivo começa com um cabeçalho de 12 bytes:

- 4 bytes: último ID utilizado.
- 8 bytes: cabeça da lista de espaços vazios.

Cada registro contém:

- 1 byte de lápide: `20` para ativo e `2A` para excluído.
- 2 bytes indicando o tamanho do registro.
- 4 bytes para o ID.
- Nome e categoria em UTF-8.
- 8 bytes para o preço.
- 4 bytes para o estoque.

## Funcionalidades

- Cadastrar produtos.
- Buscar produtos.
- Alterar produtos.
- Excluir produtos.
- Realizar exclusão lógica por lápide.
- Compactar o arquivo.
- Realocar registros que aumentam de tamanho.
- Visualizar os bytes em formato hexadecimal.
- Identificar campos dos registros por cores.
- Visualizar informações dos bytes ao passar o mouse.
- Exibir leitura traduzida dos registros, com nome, categoria, preço e estoque.
- Persistir os dados no navegador usando LocalStorage.

## Como executar

Abra o arquivo `index.html` diretamente no navegador.

Não é necessário instalar dependências, pois o trabalho foi desenvolvido apenas com HTML, CSS e JavaScript.

## 🎥 Vídeo de Demonstração

O vídeo de demonstração apresenta as principais operações do sistema, incluindo cadastro, busca, alteração, exclusão e visualização dos registros no vetor de bytes.

Link do vídeo: https://youtu.be/wBSn35w8pNs

## Avaliação com usuários

A aplicação foi avaliada por alunos que estão cursando ou já cursaram a disciplina Algoritmos e Estruturas de Dados III.

O objetivo da avaliação foi verificar a utilidade e a facilidade de uso da visualização interativa do CRUD em um arquivo representado por vetor de bytes.

## Roteiro de avaliação

Antes de responder ao questionário, os usuários executaram as principais operações da aplicação:

1. Cadastrar um produto.
2. Buscar o produto cadastrado.
3. Alterar os dados do produto.
4. Excluir o produto.
5. Observar as alterações geradas no vetor de bytes.
6. Observar a diferença entre exclusão lógica e compactação do arquivo.

## Questionário aplicado

As perguntas fechadas foram respondidas usando a escala Likert:

1. Discordo totalmente  
2. Discordo  
3. Neutro  
4. Concordo  
5. Concordo totalmente  

### Perguntas fechadas

1. Utilidade: A aplicação ajudou a compreender como um produto é transformado em bytes.

2. Utilidade: A visualização deixou clara a relação entre as operações do CRUD e as alterações no arquivo.

3. Utilidade: As cores ajudaram a identificar os campos dos registros.

4. Utilidade: A diferença entre exclusão lógica e compactação ficou compreensível.

5. Usabilidade: As funções de cadastrar, buscar, alterar e excluir foram fáceis de usar.

6. Usabilidade: As mensagens e confirmações exibidas pela aplicação foram claras.

7. Usabilidade: Foi fácil relacionar os produtos cadastrados aos registros representados em bytes.

8. Usabilidade: Eu conseguiria usar a aplicação novamente sem ajuda.

### Perguntas abertas

1. O que mais ajudou você a entender o funcionamento do arquivo?

2. Em qual tarefa você teve mais dificuldade?

3. O que poderia ser melhorado na interface?

4. Você usaria esta aplicação para estudar AEDs III? Por quê?

## Resultados da avaliação

A avaliação contou com 10 respostas nas perguntas fechadas em escala Likert.

| Item | Afirmação resumida | Média das respostas |
|---|---|---:|
| 1 | Compreensão da transformação do produto em bytes | 4,5 |
| 2 | Relação entre CRUD e alterações no arquivo | 4,9 |
| 3 | Identificação dos campos por cores | 5,0 |
| 4 | Compreensão da exclusão lógica e compactação | 4,4 |
| 5 | Facilidade de uso das funções do CRUD | 4,9 |
| 6 | Clareza das mensagens e confirmações | 4,2 |
| 7 | Relação entre produtos e registros em bytes | 4,8 |
| 8 | Uso da aplicação novamente sem ajuda | 4,9 |

## Análise das respostas abertas

As perguntas abertas receberam 9 respostas. Os principais elementos que ajudaram os usuários a compreender o funcionamento do arquivo foram a visualização dos bytes, o uso de cores, a legenda do vetor e as informações exibidas ao passar o mouse sobre os bytes. Alguns participantes também destacaram que o roteiro de teste e a explicação textual ajudaram no entendimento da proposta.

Em relação às dificuldades, parte dos usuários informou não ter encontrado problemas durante o uso da aplicação. No entanto, algumas respostas indicaram dificuldade em compreender onde um registro começa e termina, como o vetor de bytes representa as operações do CRUD e como funciona a remoção dos registros. Isso mostra que, apesar da interface ter sido considerada intuitiva por alguns usuários, a representação visual dos bytes ainda pode ser melhor explicada.

Sobre melhorias na interface, os usuários sugeriram tornar o design mais moderno, usar textos mais diretos e objetivos, deixar mais claro o que cada byte representa, melhorar o fluxo de uso da aplicação e aprimorar a visualização da remoção e da edição dos registros. Também houve uma observação indicando que a aplicação poderia ser mais intuitiva para explicar como um produto é transformado em bytes.

De forma geral, a maioria dos usuários afirmou que usaria a aplicação para estudar AEDs III. As justificativas mais frequentes foram que a aplicação facilita a compreensão de conceitos como arquivos, lápide, registros e estrutura em bytes. Assim, os resultados indicam que o sistema cumpre seu objetivo principal de apoiar o aprendizado de conceitos de armazenamento em arquivos, embora ainda existam pontos de melhoria relacionados à clareza da interface e à explicação visual dos bytes.

## Conclusão da avaliação

A avaliação com usuários mostrou que a aplicação é útil para auxiliar alunos na compreensão das operações de CRUD em arquivos. As maiores médias foram relacionadas à identificação dos campos por cores, à relação entre CRUD e alterações no arquivo, à facilidade de uso das funções e à possibilidade de usar a aplicação novamente sem ajuda.

O item com menor média foi a clareza das mensagens e confirmações, com média 4,2, seguido da compreensão da exclusão lógica e compactação, com média 4,4. Apesar de serem resultados positivos, esses pontos indicam oportunidades de melhoria na interface, principalmente na explicação do significado de cada byte, na identificação do início e fim dos registros e na visualização do processo de remoção.

Portanto, a aplicação atende ao objetivo extensionista do trabalho, pois oferece uma ferramenta de apoio para futuros alunos de AEDs III compreenderem, de forma visual e interativa, conceitos relacionados ao armazenamento de registros em arquivos.

## Checklist

- **A página web com a visualização interativa do CRUD de produtos foi criada?** Sim. A aplicação permite cadastrar, buscar, alterar e excluir produtos, mostrando as alterações diretamente no vetor de bytes.
- **Há um vídeo de até 3 minutos demonstrando o uso da visualização?** Sim. O vídeo está disponível em: https://youtu.be/wBSn35w8pNs
- **O trabalho foi criado apenas com HTML, CSS e JS?** Sim. O projeto utiliza apenas `index.html`, `styles.css` e `app.js`.
- **O relatório do trabalho foi entregue no APC?** Sim.
- **O trabalho está completo e funcionando sem erros de execução?** Sim. As principais operações foram implementadas e testadas.
- **O trabalho é original e não a cópia de um trabalho de outro grupo?** Sim. O trabalho foi desenvolvido pelo grupo.
