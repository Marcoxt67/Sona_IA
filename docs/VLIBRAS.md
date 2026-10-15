# Integração com VLibras

A ferramenta externa oficial possui avatar 3D próprio (incluindo o avatar chamado Ícaro), dicionário de sinais e mecanismo de tradução automática. O Ícaro/Somos Libras agora inclui um painel opcional para carregar o widget oficial sem copiar ou modificar seus modelos, sinais ou engine.

## Uso

Na aba **Intérprete**, digite ou transcreva sua mensagem. No cartão **Experimente o avatar 3D oficial**, leia o aviso de serviço externo e clique **Ativar VLibras com avatar oficial**. Um painel separado será aberto com o texto atual (ou “Oi”, se vazio). Abra o botão azul do widget e utilize a seleção de texto e os controles próprios do VLibras. O botão **Selecionar mensagem** do painel destaca a frase.

Se mudar a mensagem no intérprete, clique **Copiar mensagem para o painel**. Isso só copia o texto localmente: não chama uma API privada de tradução nem confirma que houve interpretação. O botão nativo do VLibras controla a tradução e o avatar. Use **Desativar VLibras** para remover o iframe do DOM e interromper sua execução no painel. Dados já enviados ao serviço não são apagados por essa ação.

A ativação usa a integração documentada:

```js
new window.VLibras.Widget({
  rootPath: 'https://vlibras.gov.br/app',
  avatar: 'icaro',
  position: 'R'
});
```

O script externo é `https://vlibras.gov.br/app/vlibras-plugin.js`. Ele é carregado somente após a ativação, em um documento próprio, sem incorporar o histórico ao texto do painel. O código local passa texto usando `postMessage`, verifica a origem e a janela remetente, limita 500 caracteres e escreve com `textContent`. Não transmite áudio ao VLibras pelo nosso backend. O widget e seus serviços têm comportamento e políticas próprios; não use dados sensíveis.

## Limites técnicos

- O player oficial usa Unity/WebGL, com builds WebAssembly/Unity, e seus sinais usam um pipeline próprio. Não são animações `.glb` prontas para o avatar Three.js do estudo manual.
- Esta integração utiliza os recursos oficiais como distribuídos. Ela não extrai sinais, converte rigs ou faz captura do avatar para apresentá-lo como conteúdo autoral.
- O avatar ilustrativo Three.js e o estudo manual de “Oi” permanecem separados. O catálogo validado também permanece separado: consultar “Oi” continua retornando `unavailable`, mesmo com o widget ativado.
- O componente externo pode usar tradução automática, datilologia ou outras estratégias próprias. Sua saída não recebe automaticamente o selo de revisão linguística da Somos Libras.
- O status “Componente oficial carregado” confirma apenas a inicialização do componente JavaScript. O carregamento do avatar, dicionário e interpretação ainda depende do serviço e da rede. Não há API privada nem detecção simulada de que uma animação real foi reproduzida.
- O serviço exige internet, WebGL e acesso aos domínios oficiais. Não é uma solução offline. Uma implantação própria do VLibras, incluindo dicionário, engine e tradução, seria um trabalho adicional.

## Origem e licenças consultadas

A documentação e o código públicos foram examinados na organização `spbgovbr-vlibras`, sem copiar os fontes ou binários externos para este projeto:

- [Portal oficial, código e documentação](https://github.com/spbgovbr-vlibras/vlibras-portal), referência consultada `1641a6f73e53c8c0c6fd0914dbc9109e5c490417`.
- [Player WebJS](https://github.com/spbgovbr-vlibras/vlibras-player-webjs), com licença LGPLv3 registrada no repositório.
- [Integração web documentada](https://vlibras.gov.br/doc/widget/installation/webpageintegration.html).
- [Política CSP documentada](https://vlibras.gov.br/doc/widget/installation/content-security-policy.html).

O portal também declara LGPLv3. Hospedar ou modificar componentes, modelos e sinais exige verificar as licenças e atribuições aplicáveis a cada componente e dependência; não se deve presumir que todos os ativos têm os mesmos termos apenas porque a suíte é aberta. Aqui, a distribuição é carregada do serviço oficial sem alterações.

## Rede e verificação

Neste ambiente de desenvolvimento, o proxy recusou a conexão HTTPS a `vlibras.gov.br` com `CONNECT tunnel failed, response 403`. Isso é um bloqueio deste ambiente, não uma comprovação de indisponibilidade geral do VLibras. A documentação foi consultada pelos fontes públicos no GitHub. Não foi possível validar o avatar nem a tradução reais no serviço remoto.

Os testes de navegador verificam ativação explícita, contrato de configuração, transferência segura de texto e falha de rede. O caso de inicialização usa um componente simulado e não confirma execução real do VLibras. O build e as funcionalidades locais são testáveis independentemente.

Foi salvo no rascunho da configuração do ambiente o acesso a `vlibras.gov.br` e `*.vlibras.gov.br`, preservando os presets existentes. Salvar o rascunho não aplica a política à máquina atual: é necessário revisar/salvar e publicar no produto para ativar a configuração. O domínio de fontes `cdn.jsdelivr.net` já pertence ao preset disponível. Depois da liberação efetiva, repetir o carregamento real e conferir os pedidos de recursos, o avatar, o sinal “Oi” e frases com revisão humana.

Em sites que aplicam CSP, siga a documentação oficial: liberar o script externo em `script-src`, o player em `frame-src https://vlibras.gov.br`, fontes em `font-src https://vlibras.gov.br https://cdn.jsdelivr.net` e os serviços necessários às conexões conforme a implantação. A página própria `/integrations/vlibras.html` também precisa ser permitida em `frame-src 'self'`. Não desative TLS ou outras verificações para contornar falhas.
