# Ícaro · Somos Libras

Protótipo web responsivo para entrada em português por voz ou texto, consulta de frases completas, avatar 3D e histórico em SQLite. React 19, TypeScript, Tailwind CSS 4, Three.js/React Three Fiber e Node.js/Express.

**Não é um tradutor livre de português para Libras.** Não há sinais nem animações linguisticamente validados incluídos. As seis frases da biblioteca são candidatas à revisão, e todas as consultas retornam indisponibilidade de tradução. O avatar neutro é ilustrativo; não produz gestos apresentados como Libras. Isso evita atribuir significado a animações inventadas. O reprodutor de GLB, legendas temporizadas e velocidade está implementado, mas a validação de uma animação real ainda depende de material e revisão externos.

## Executar

Requisito: Node.js **24 LTS** e npm. Não precisa de conta, chave, banco externo ou API paga. O SQLite usa o módulo nativo `node:sqlite` (pode emitir aviso experimental no Node 24).

```sh
npm ci
npm run dev
```

Abra a porta 5173 no navegador. O Vite encaminha `/api` para a API na porta 3001. O desenvolvimento inicia ambos com um único comando. Pare com Ctrl+C.

Se o diretório padrão de cache npm não for gravável, acrescente `--cache /tmp/icaro-npm-cache` a `npm ci`.

Produção local:

```sh
npm run build
npm start
```

O Express serve a aplicação compilada e a API na porta 3001 (ou `PORT`). `DATABASE_PATH` configura o arquivo SQLite; padrão `./data/icaro.sqlite`. O diretório é criado automaticamente. Não execute várias réplicas compartilhando o mesmo arquivo. O frontend não necessita de variáveis secretas.

## Verificação

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Se já houver Chromium instalado, use `CHROMIUM_PATH=/caminho/do/chromium npm run test:e2e` em vez de baixar outro navegador. O teste de navegador inclui também um GLB sintético sem sinalização para verificar pausa, legendas, velocidade e repetição (esse ativo só existe no teste). Ele inicia um servidor isolado na porta 3101 com SQLite em memória; execute o build antes dele. Inclui fluxo de interface, responsividade, ausência de reconhecimento de voz e ciclo de reconhecimento simulado (não captura áudio real).

Os testes verificam a barreira de validação, frases inteiras, limites de entrada, isolamento de histórico, remoção, SQL parametrizado, retenção e persistência após reabertura. O build verifica TypeScript e compila o frontend. Não há testes de validação linguística ou de animações reais; nenhum sinal está liberado.

Teste manual: digite `Bom dia`, consulte, confira o aviso de indisponibilidade e veja a consulta no histórico. Recarregue e confira a persistência. Limpe o histórico. Busque uma frase na biblioteca e volte ao intérprete. Permita o microfone em um navegador compatível e HTTPS/localhost, fale, interrompa, revise a transcrição e consulte. Negue a permissão para verificar a alternativa textual.

## Estrutura

- `src/App.tsx`: interface, estados, biblioteca, histórico e controles.
- `src/components/Avatar.tsx`: modelo neutro e reprodutor reutilizável de animações GLB.
- `src/lib/speech.ts`: adaptação da Web Speech API, transcrição parcial/final e erros.
- `src/lib/api.ts`: cliente HTTP e identificador do navegador.
- `server/catalog.mjs`: catálogo e contrato de provedor de tradução substituível por integração futura com IA.
- `server/app.mjs`: API Express e arquivos estáticos de produção.
- `server/db.mjs`: SQLite, consultas parametrizadas e retenção de 50 itens por navegador.
- `tests/`: testes executáveis com o runner nativo do Node.
- `docs/REVISAO_LIBRAS.md`: fluxo de documentação e revisão.
- `render.yaml`: implantação do servidor completo com disco persistente.

## Contrato da API

`GET /api/health` e `GET /api/library` são públicos. `POST /api/translate` (`{"text":"Bom dia"}`), `GET /api/history` e `DELETE /api/history` exigem o cabeçalho `X-Icaro-Session`, com UUID gerado pelo navegador. Retornos de tradução: `available` com ativo validado, ou `unavailable` com explicação. Limite de 500 caracteres. O identificador é um mecanismo de separação do protótipo, **não autenticação**.

## Privacidade e limites

O app não grava áudio. A Web Speech API pode enviar áudio ao fornecedor do navegador, depende de rede, permissão e contexto seguro e não funciona em todos os navegadores. Sempre existe entrada por texto. As mensagens consultadas ficam no SQLite da máquina que executa o backend; `localStorage` guarda somente um identificador aleatório. O histórico pode ser apagado pela interface. O modo privado ou limpar o armazenamento do navegador perde o vínculo com histórico antigo. Não use dados sensíveis neste protótipo. Produção pública exige autenticação, política de retenção, consentimento adequado, controle de abuso e avaliação de acessibilidade com usuários reais.

## Publicação

**Render (recomendado):** conecte o repositório e use `render.yaml`. A aplicação usa `npm ci && npm run build`, inicia com `npm start` e responde em `/api/health`. O disco `/var/data` conserva o SQLite; a configuração usa instância paga porque disco persistente não é recurso gratuito. Sem disco, os dados são efêmeros. Nenhuma API paga é necessária para executar localmente. Deploy não foi feito por este projeto.

**Vercel:** o frontend estático pode ser publicado com `npm run build` e saída `dist/client`. O Express e o SQLite persistente devem continuar em um host com disco (como Render). Crie uma regra de rewrite `/api/:path*` apontando para a URL HTTPS real desse backend; confira `vercel.example.json` e substitua o hostname antes de usar. Não execute este SQLite em funções efêmeras da Vercel. Sem o backend e o rewrite, o frontend sozinho não funciona.

## Próximos passos

Obter materiais licenciados; revisar as frases com pessoas surdas e especialistas; criar e validar animações completas (mãos, expressões não manuais, espaço e contexto); testar o reprodutor com os ativos reais; auditar a interface e o serviço antes de disponibilização pública. Veja o protocolo em `docs/REVISAO_LIBRAS.md`.
