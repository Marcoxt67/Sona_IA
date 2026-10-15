import { useCallback, useEffect, useRef, useState } from "react";
import Avatar, { AvatarBoundary } from "./components/Avatar";
import { api, type Entry, type HistoryItem, type Translation } from "./lib/api";
import { useSpeech } from "./lib/speech";
function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    mic: (
      <>
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    play: <path d="m9 5 11 7-11 7Z" />,
    pause: (
      <>
        <path d="M9 5v14M15 5v14" />
      </>
    ),
    book: (
      <>
        <path d="M12 5c-4-3-9-1-9-1v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1Zm0 0v15" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    repeat: (
      <>
        <path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-11v1" />
      </>
    ),
    hand: (
      <>
        <path d="M8 12V5a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v9-5a2 2 0 0 1 4 0v8c0 5-3 7-7 7-3 0-5-2-7-5l-3-5a2 2 0 0 1 3-2l2 2Z" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    sound: (
      <>
        <path d="m11 5-6 4H2v6h3l6 4Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.info}
    </svg>
  );
}
export default function App() {
  const [tab, setTab] = useState("interpreter"),
    [text, setText] = useState(""),
    [library, setLibrary] = useState<Entry[]>([]),
    [history, setHistory] = useState<HistoryItem[]>([]);
  const [result, setResult] = useState<Translation | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false);
  const [speed, setSpeed] = useState(1),
    [repeat, setRepeat] = useState(false),
    [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [restart, setRestart] = useState(0),
    [query, setQuery] = useState("");
  const [about, setAbout] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null),
    requestLock = useRef(false);
  const speech = useSpeech((spoken) => {
    setText((old) => (old ? `${old} ${spoken}` : spoken).slice(0, 500));
    setResult(null);
    setPlaying(false);
  });
  const load = useCallback(async () => {
    try {
      const [entries, items] = await Promise.all([
        api<Entry[]>("/library"),
        api<HistoryItem[]>("/history"),
      ]);
      setLibrary(entries);
      setHistory(items);
      setLoaded(true);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const onEnd = useCallback(() => setPlaying(false), []);
  const onTime = useCallback((t: number) => setTime(t), []);
  async function translate() {
    if (!text.trim() || requestLock.current) return;
    requestLock.current = true;
    speech.stop();
    setBusy(true);
    setError("");
    setResult(null);
    setPlaying(false);
    setTime(0);
    try {
      const data = await api<Translation>("/translate", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setResult(data);
      setHistory((old) => [data.history, ...old].slice(0, 50));
      setPlaying(data.status === "available");
      setRestart((x) => x + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      requestLock.current = false;
      setBusy(false);
    }
  }
  function choose(value: string) {
    if (requestLock.current) return;
    speech.stop();
    setText(value);
    setResult(null);
    setPlaying(false);
    setTab("interpreter");
    setTimeout(() => input.current?.focus(), 0);
  }
  async function clearHistory() {
    try {
      await api("/history", { method: "DELETE" });
      setHistory([]);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const caption = result?.asset?.captions.find(
    (c) => time >= c.start && time < c.end,
  )?.text;
  const available = result?.status === "available" && Boolean(result.asset);
  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          href="#inicio"
          className="brand"
          onClick={() => setTab("interpreter")}
          aria-label="Somos Libras, início"
        >
          <span className="brand-mark">
            <Icon name="hand" size={26} />
          </span>
          <span>
            somos<span className="brand-light">libras</span>
            <small>CONEXÕES QUE TRANSFORMAM</small>
          </span>
        </a>
        <nav aria-label="Navegação principal">
          <button
            className={tab === "interpreter" ? "nav-active" : ""}
            onClick={() => setTab("interpreter")}
          >
            Intérprete
          </button>
          <button
            className={tab === "library" ? "nav-active" : ""}
            onClick={() => setTab("library")}
          >
            Biblioteca de frases
          </button>
          <button onClick={() => setAbout(true)}>
            Sobre o projeto <Icon name="arrow" size={12} />
          </button>
        </nav>
        <span className="prototype">
          <span /> Protótipo v0.1
        </span>
      </header>
      <main id="inicio">
        <section className="intro">
          <div>
            <p className="eyebrow">
              <span /> TECNOLOGIA A SERVIÇO DA INCLUSÃO
            </p>
            <h1>
              Olá, eu sou o{" "}
              <span>
                Ícaro<span className="title-dot">.</span>
              </span>
            </h1>
            <p>
              Um novo jeito de criar conexões entre o português e a Libras.
              <br className="desktop-break" /> Fale ou escreva. Vamos construir
              uma comunicação mais acessível.
            </p>
          </div>
          <div className="intro-stamp">
            <span className="stamp-icon">
              <Icon name="hand" size={27} />
            </span>
            <div>
              Feito para aproximar
              <small>Em construção, com a comunidade surda.</small>
            </div>
          </div>
        </section>
        <div
          className="workspace-tabs"
          role="tablist"
          aria-label="Área de trabalho"
        >
          {[
            ["interpreter", "Intérprete", "hand"],
            ["library", "Biblioteca", "book"],
            ["history", "Meu histórico", "clock"],
          ].map(([id, label, icon]) => (
            <button
              key={id}
              role="tab"
              id={`tab-${id}`}
              aria-controls="workspace-panel"
              tabIndex={tab === id ? 0 : -1}
              onKeyDown={(event) => {
                const ids = ["interpreter", "library", "history"];
                const index = ids.indexOf(id);
                const next =
                  event.key === "ArrowRight"
                    ? ids[(index + 1) % 3]
                    : event.key === "ArrowLeft"
                      ? ids[(index + 2) % 3]
                      : event.key === "Home"
                        ? ids[0]
                        : event.key === "End"
                          ? ids[2]
                          : null;
                if (next) {
                  event.preventDefault();
                  setTab(next);
                  document.getElementById(`tab-${next}`)?.focus();
                }
              }}
              aria-selected={tab === id}
              onClick={() => setTab(id)}
            >
              <Icon name={icon} size={18} />
              {label}
              {id === "history" && history.length > 0 && (
                <span className="count">{history.length}</span>
              )}
            </button>
          ))}
          <span className="local-label">
            <span /> Sem APIs pagas
          </span>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}{" "}
            <button onClick={() => void load()}>Tentar reconectar</button>
          </div>
        )}
        <div
          id="workspace-panel"
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
        >
          {tab === "interpreter" && (
            <section
              className="interpreter-grid"
              aria-label="Intérprete de Libras"
            >
              <div className="input-column">
                <article className="card input-card">
                  <div className="card-heading">
                    <span className="step">01</span>
                    <div>
                      <h2>Sua mensagem</h2>
                      <p>Comece com a sua voz ou com um texto.</p>
                    </div>
                    <span className="language">PT-BR</span>
                  </div>
                  <button
                    className={`mic-button ${speech.listening ? "recording" : ""}`}
                    disabled={!speech.supported || busy}
                    onClick={speech.toggle}
                    aria-pressed={speech.listening}
                  >
                    <span className="mic-circle">
                      <Icon name="mic" size={25} />
                    </span>
                    <span>
                      <strong>
                        {speech.listening
                          ? "Interromper microfone"
                          : "Toque para falar"}
                      </strong>
                      <small>
                        {speech.listening
                          ? "Ouvindo… fale em português"
                          : "Sua voz pode iniciar uma conexão"}
                      </small>
                    </span>
                    <span className="sound-wave">
                      {[10, 20, 14, 27, 18].map((h, i) => (
                        <i key={i} style={{ height: h }} />
                      ))}
                    </span>
                  </button>
                  <p className="mic-hint">
                    {speech.supported
                      ? "Permita o microfone quando o navegador solicitar."
                      : "Reconhecimento de voz indisponível neste navegador. Digite abaixo."}
                  </p>
                  {speech.error && (
                    <p className="speech-error" role="alert">
                      {speech.error}
                    </p>
                  )}
                  <div className="or">
                    <span /> ou digite sua mensagem <span />
                  </div>
                  <label htmlFor="message" className="sr-only">
                    Mensagem em português
                  </label>
                  <div className="textarea-wrap">
                    <textarea
                      ref={input}
                      id="message"
                      value={text}
                      maxLength={500}
                      disabled={busy}
                      onChange={(e) => {
                        setText(e.target.value);
                        setResult(null);
                        setPlaying(false);
                      }}
                      placeholder="O que você gostaria de comunicar?"
                    />
                    <span>{text.length}/500</span>
                  </div>
                  <p className="interim" aria-live="polite">
                    {speech.interim && `Ouvindo: ${speech.interim}`}
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => void translate()}
                    disabled={
                      !text.trim() || busy || !loaded || speech.listening
                    }
                  >
                    {busy
                      ? "Consultando biblioteca…"
                      : speech.listening
                        ? "Interrompa para revisar o texto"
                        : "Consultar tradução"}
                    <Icon name="arrow" size={20} />
                  </button>
                  <p className="input-foot">
                    <Icon name="info" size={14} /> Apenas frases completas com
                    validação podem ser reproduzidas.
                  </p>
                </article>
                <article className="card suggestions">
                  <div className="section-heading">
                    <h3>Experimente uma frase</h3>
                    <button onClick={() => setTab("library")}>
                      Ver biblioteca <Icon name="arrow" size={12} />
                    </button>
                  </div>
                  <div className="chips">
                    {library.slice(0, 4).map((e) => (
                      <button key={e.id} onClick={() => choose(e.portuguese)}>
                        {e.portuguese}
                        <Icon name="arrow" size={12} />
                      </button>
                    ))}
                  </div>
                  <p>Frases candidatas · aguardando validação em Libras</p>
                </article>
              </div>
              <article className="card avatar-card">
                <div className="avatar-heading">
                  <div className="card-heading">
                    <span className="step">02</span>
                    <div>
                      <h2>Espaço de interpretação</h2>
                      <p>Conheça o seu avatar digital.</p>
                    </div>
                  </div>
                  <span className="avatar-status">
                    <span />
                    {available ? "Animação validada" : "Modo demonstrativo"}
                  </span>
                </div>
                <div className="avatar-stage">
                  <div className="stage-orbit orbit-one" />
                  <div className="stage-orbit orbit-two" />
                  <div className="stage-label">
                    <span className="mini-logo">í</span> ÍCARO{" "}
                    <span>AVATAR 3D</span>
                  </div>
                  <div className="avatar-canvas">
                    <AvatarBoundary key={result?.asset?.url ?? "neutral"}>
                      <Avatar
                        asset={result?.asset}
                        playing={playing}
                        speed={speed}
                        repeat={repeat}
                        restart={restart}
                        onTime={onTime}
                        onEnd={onEnd}
                      />
                    </AvatarBoundary>
                  </div>
                  <span className="stage-note">
                    {available
                      ? "Conteúdo revisado em Libras"
                      : "Avatar ilustrativo · sem sinalização"}
                  </span>
                  <div
                    className={`caption ${result?.status === "unavailable" ? "caption-warning" : ""}`}
                    role="status"
                    aria-live="polite"
                  >
                    {available ? (
                      caption || "Pronto para reproduzir"
                    ) : result ? (
                      <>
                        <Icon name="info" size={18} />
                        <span>{result.message}</span>
                      </>
                    ) : (
                      <>
                        <span className="caption-dots">•••</span>
                        <span>Sua mensagem começa uma nova conexão.</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="playback">
                  <button
                    className="play-button"
                    aria-label={
                      playing ? "Pausar animação" : "Reproduzir animação"
                    }
                    disabled={!available}
                    onClick={() => {
                      if (
                        !playing &&
                        result?.asset &&
                        time >= result.asset.duration - 0.05
                      ) {
                        setRestart((x) => x + 1);
                        setTime(0);
                      }
                      setPlaying(!playing);
                    }}
                  >
                    <Icon name={playing ? "pause" : "play"} size={19} />
                  </button>
                  <div className="timeline">
                    <progress
                      max={result?.asset?.duration || 1}
                      value={time}
                      aria-label="Progresso da animação"
                    />
                    <span>
                      {available
                        ? `${time.toFixed(1)}s / ${result?.asset?.duration}s`
                        : "Aguardando frase validada"}
                    </span>
                  </div>
                  <div className="speed">
                    <label htmlFor="speed">Velocidade</label>
                    <select
                      id="speed"
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                    >
                      <option value={0.5}>0,5×</option>
                      <option value={0.75}>0,75×</option>
                      <option value={1}>1×</option>
                      <option value={1.25}>1,25×</option>
                    </select>
                  </div>
                  <button
                    className={`repeat-button ${repeat ? "selected" : ""}`}
                    aria-label="Repetir animação"
                    aria-pressed={repeat}
                    onClick={() => setRepeat(!repeat)}
                  >
                    <Icon name="repeat" size={20} />
                  </button>
                </div>
              </article>
            </section>
          )}
          {tab === "library" && (
            <section className="card library-page">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">CONTEÚDO COM RESPONSABILIDADE</p>
                  <h2>Biblioteca de frases</h2>
                  <p>
                    Frases completas para futura revisão. Nenhuma tradução
                    validada disponível nesta versão.
                  </p>
                </div>
                <span className="review-badge">
                  {library.filter((e) => e.playable).length} validadas ·{" "}
                  {library.filter((e) => !e.playable).length} candidatas
                </span>
              </div>
              <label htmlFor="search">Buscar frase ou categoria</label>
              <input
                id="search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex.: sala de aula"
              />
              <div className="library-grid">
                {library
                  .filter((e) =>
                    `${e.portuguese} ${e.category}`
                      .toLocaleLowerCase("pt-BR")
                      .includes(query.toLocaleLowerCase("pt-BR")),
                  )
                  .map((e) => (
                    <article key={e.id} className="phrase-card">
                      <span>{e.category}</span>
                      <h3>{e.portuguese}</h3>
                      <p>
                        {e.playable
                          ? "Conteúdo validado"
                          : "Aguardando fonte, animação e revisão"}
                      </p>
                      <button onClick={() => choose(e.portuguese)}>
                        Usar frase <Icon name="arrow" size={17} />
                      </button>
                    </article>
                  ))}
              </div>
              {loaded &&
                !library.some((e) =>
                  `${e.portuguese} ${e.category}`
                    .toLocaleLowerCase("pt-BR")
                    .includes(query.toLocaleLowerCase("pt-BR")),
                ) && <p>Nenhuma frase encontrada.</p>}
            </section>
          )}
          {tab === "history" && (
            <section className="card history-page">
              <div className="page-heading">
                <div>
                  <h2>Meu histórico</h2>
                  <p>
                    Últimas 50 consultas deste navegador, armazenadas no
                    servidor local.
                  </p>
                </div>
                <button
                  className="text-button"
                  disabled={!history.length}
                  onClick={() => {
                    if (
                      window.confirm("Apagar todo o histórico deste navegador?")
                    )
                      void clearHistory();
                  }}
                >
                  Limpar histórico
                </button>
              </div>
              {history.length === 0 ? (
                <div className="empty-state">
                  <Icon name="clock" size={36} />
                  <h3>Uma conexão começa com uma mensagem.</h3>
                  <p>Suas consultas aparecerão aqui.</p>
                  <button
                    className="text-button"
                    onClick={() => setTab("interpreter")}
                  >
                    Ir para o intérprete →
                  </button>
                </div>
              ) : (
                <ul className="history-list">
                  {history.map((item) => (
                    <li key={item.id}>
                      <div>
                        <h3>{item.text}</h3>
                        <p>
                          {new Date(item.createdAt).toLocaleString("pt-BR")} ·{" "}
                          {item.status === "available"
                            ? "Tradução validada"
                            : "Tradução indisponível"}
                        </p>
                      </div>
                      <button
                        onClick={() => choose(item.text)}
                        aria-label={`Usar novamente: ${item.text}`}
                      >
                        <Icon name="repeat" size={19} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="privacy-note">
                Evite inserir dados sensíveis. O identificador no navegador
                separa o histórico, mas não substitui uma conta autenticada.
              </p>
            </section>
          )}
        </div>
        <aside className="responsibility">
          <span className="responsibility-icon">
            <Icon name="check" size={20} />
          </span>
          <div>
            <h3>Libras é uma língua. E merece respeito.</h3>
            <p>
              Não traduzimos palavra por palavra. Cada frase precisa de
              contexto, expressão e validação por pessoas surdas e
              especialistas.
            </p>
          </div>
          <button onClick={() => setAbout(true)}>
            Entenda o projeto <Icon name="arrow" size={17} />
          </button>
        </aside>
        <footer>
          <span>
            Uma iniciativa{" "}
            <strong>
              somos<span>libras</span>
            </strong>
          </span>
          <p>Mais acesso. Mais encontros. Mais possibilidades.</p>
          <span>
            Feito com propósito <span className="footer-spark">✳</span>
          </span>
        </footer>
      </main>
      {about && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAbout(false);
          }}
        >
          <About onClose={() => setAbout(false)} />
        </div>
      )}
    </div>
  );
}
function About({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="about-dialog"
      onCancel={onClose}
      aria-labelledby="about-title"
    >
      <button className="close-modal" onClick={onClose} aria-label="Fechar">
        ×
      </button>
      <p className="eyebrow">PROJETO ÍCARO</p>
      <h2 id="about-title">Comunicação com responsabilidade.</h2>
      <p>
        O Ícaro é um protótipo da Somos Libras. A entrada por voz ou texto, o
        avatar 3D e o histórico já estão implementados. A tradução livre ainda
        não está disponível.
      </p>
      <p>
        A biblioteca contém propostas de frases, sem gestos ou traduções
        aprovadas. Para liberar uma animação, precisamos de fonte documentada,
        versão do arquivo, legendas e revisão registrada por uma pessoa surda e
        um especialista em Libras.
      </p>
      <p>
        O avatar em postura neutra é apenas uma ilustração. Libras envolve
        movimentos, configurações de mão, espaço, expressões faciais e contexto.
      </p>
      <p>
        <strong>Privacidade:</strong> a voz é processada pelo serviço de
        reconhecimento do seu navegador, que pode enviá-la ao fornecedor. O
        Ícaro não armazena áudio. O texto consultado fica no SQLite do servidor
        e pode ser apagado no histórico. O microfone depende do navegador, de
        permissão e de conexão.
      </p>
      <button className="primary-button" onClick={onClose}>
        Entendi <Icon name="check" size={18} />
      </button>
    </dialog>
  );
}
