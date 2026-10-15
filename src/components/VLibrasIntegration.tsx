import { useEffect, useRef, useState } from "react";
export default function VLibrasIntegration({ text }: { text: string }) {
  const [active, setActive] = useState(false),
    [revision, setRevision] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const [snapshot, setSnapshot] = useState("Oi");
  const send = () =>
    frame.current?.contentWindow?.postMessage(
      { type: "icaro:vlibras-text", text: snapshot },
      window.location.origin,
    );
  useEffect(() => {
    if (!active) return;
    const ready = (event: MessageEvent) => {
      if (
        event.source === frame.current?.contentWindow &&
        event.origin === window.location.origin &&
        event.data?.type === "icaro:vlibras-ready"
      )
        send();
    };
    window.addEventListener("message", ready);
    send();
    return () => window.removeEventListener("message", ready);
  }, [snapshot, active]);
  return (
    <section className="card vlibras-card" aria-labelledby="vlibras-title">
      <div className="study-header">
        <div>
          <p className="eyebrow">INTEGRAÇÃO COM A SUÍTE VLIBRAS</p>
          <h2 id="vlibras-title">Experimente o avatar 3D oficial</h2>
          <p>
            Use o VLibras com seu próprio player e sinais. O resultado é
            automático e não equivale à revisão humana.
          </p>
        </div>
        <span className="vlibras-badge">Serviço externo · gratuito</span>
      </div>
      <p className="vlibras-privacy">
        Ao ativar, seu navegador carregará recursos do VLibras e poderá enviar o
        texto que você escolher para seus serviços. Evite dados sensíveis. O
        recurso requer internet e não envia áudio pelo Ícaro.
      </p>
      <p className="vlibras-explanation">
        O avatar padrão do VLibras também se chama Ícaro. Este painel usa a
        ferramenta oficial; o avatar ilustrativo e o estudo manual de “Oi”
        continuam separados.
      </p>
      {!active ? (
        <button
          className="primary-button vlibras-activate"
          onClick={() => {
            setSnapshot(text.trim() || "Oi");
            setActive(true);
          }}
        >
          Ativar VLibras com avatar oficial
        </button>
      ) : (
        <>
          <div className="vlibras-actions">
            <button
              className="primary-button"
              onClick={() => {
                const next = text.trim() || "Oi";
                if (next === snapshot) send();
                else setSnapshot(next);
              }}
            >
              Copiar mensagem para o painel
            </button>
            <button
              className="text-button"
              onClick={() => setRevision((v) => v + 1)}
            >
              Recarregar integração
            </button>
            <button className="text-button" onClick={() => setActive(false)}>
              Desativar VLibras
            </button>
          </div>
          <p className="vlibras-instructions">
            No painel, abra o botão azul do VLibras e use os controles da
            ferramenta para interpretar o texto exibido. Copiar a mensagem
            apenas a coloca no painel; não confirma uma tradução.
          </p>
          <iframe
            ref={frame}
            key={revision}
            className="vlibras-frame"
            src="/integrations/vlibras.html"
            title="Painel de integração com o avatar oficial VLibras"
            onLoad={send}
            referrerPolicy="no-referrer"
          />
        </>
      )}
      <a
        className="vlibras-source"
        href="https://vlibras.gov.br/doc/widget/installation/webpageintegration.html"
        target="_blank"
        rel="noopener noreferrer"
      >
        Documentação oficial de integração do VLibras
      </a>
    </section>
  );
}
