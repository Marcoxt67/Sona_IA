# Documentação e revisão de Libras

Nenhum item atual é uma tradução. Não promover candidatos por inferência, por tradução palavra a palavra ou por um modelo de IA sem revisão humana.

Para cada frase completa:
1. Registrar contexto de uso, variante regional, restrições e fonte HTTPS verificável, incluindo autoria e licença. Referências de uma palavra isolada não validam uma frase.
2. Uma pessoa surda e um especialista em Libras revisam a interpretação. Registrar responsáveis com consentimento, data e resultado. Obter autorização para materiais e identificação.
3. Produzir um GLB com avatar completo rigado, mãos articuladas e expressões faciais necessárias; câmera e enquadramento adequados. A animação de frase deve preservar gramática espacial e componentes não manuais. O GLB deve ser autocontido, sem dependências externas.
4. Validar a animação final no reprodutor com os revisores: compreensão, fidelidade, velocidade, pausas, enquadramento e legendas. Não basta validar apenas a intenção em português.
5. Versionar o ativo em `public/animations/<id>.glb`. O clipe deve ser nomeado e sua duração conferida. Usar coordenadas/câmera compatíveis com `Avatar.tsx` ou ajustar o enquadramento com testes.
6. Atualizar o catálogo em tarefa de conteúdo revisada. O item precisa de `status: 'validated'`, `source` HTTPS, `review: { deafReviewer, specialist, date, assetVersion }` e `asset: { kind: 'gltf', url: '/animations/<id>.glb', clip, version, duration, captions: [{ start, end, text }] }`. `assetVersion` deve coincidir com `version`; tempos são em segundos do clipe e não do relógio real. Fonte e responsáveis precisam de registros reais. O contrato não equivale a certificação automatizada.
7. Conferir no navegador o carregamento, as legendas sincronizadas, pausa, retomada, velocidades 0,5× a 1,25× e repetição. Rodar testes e build. Somente então liberar na versão publicada.

Reprovar ou revogar um item remove imediatamente sua condição reproduzível ao mudar o status para `pending`. Revisão e administração ainda são feitas em código, por pull request; não há painel ou endpoint público de aprovação. A integração futura com IA deve manter essa barreira: saída nova permanece proposta até revisão, sem compor sinais isolados automaticamente.
