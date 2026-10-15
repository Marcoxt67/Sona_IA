import { useCallback, useState } from "react";
import Avatar, { AvatarBoundary } from "./Avatar";
import type { Asset } from "../lib/api";
type Study = {
  title: string;
  status: "experimental";
  source: string;
  sourceCredit: string;
  limitations: string[];
  asset: Asset;
};
export default function ExperimentalStudy() {
  const [study, setStudy] = useState<Study | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [opened, setOpened] = useState(false),
    [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [seekTime, setSeekTime] = useState(0),
    [speed, setSpeed] = useState(0.75),
    [repeat, setRepeat] = useState(false),
    [restart, setRestart] = useState(0),
    [angle, setAngle] = useState(0);
  const onEnd = useCallback(() => setPlaying(false), []),
    onTime = useCallback((value: number) => setTime(value), []);
  async function open() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/animations/oi-experimental.json");
      if (!response.ok) throw new Error("Não foi possível carregar o estudo.");
      const data: Study = await response.json();
      if (
        data.status !== "experimental" ||
        data.asset.url !== "/animations/oi-experimental.glb"
      )
        throw new Error("Manifesto do estudo inválido.");
      setStudy(data);
      setOpened(true);
      setTime(0);
      setSeekTime(0);
      setPlaying(false);
      setRestart((value) => value + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  const caption =
    study?.asset.captions.find((c) => time >= c.start && time < c.end)?.text ||
    "Estudo experimental · fim da sequência";
  return (
    <section className="card study-card" aria-labelledby="oi-study-title">
      <div className="study-header">
        <div>
          <p className="eyebrow">LABORATÓRIO DE MOVIMENTO</p>
          <h2 id="oi-study-title">Oi · animação para revisão</h2>
          <p>
            Keyframes manuais a partir do vídeo enviado. Este estudo não é uma
            tradução aprovada.
          </p>
        </div>
        <span className="study-badge">Experimental · não validado</span>
      </div>
      {!opened && (
        <button
          className="primary-button study-open"
          disabled={loading}
          onClick={() => void open()}
        >
          {loading ? "Carregando…" : "Abrir estudo experimental de Oi"}
        </button>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {opened && study && (
        <div className="study-layout">
          <div>
            <div className="study-stage">
              <span className="study-watermark">
                EXPERIMENTAL · AGUARDANDO REVISÃO
              </span>
              <AvatarBoundary key={restart}>
                <Avatar
                  asset={study.asset}
                  experimental
                  playing={playing}
                  speed={speed}
                  repeat={repeat}
                  restart={restart}
                  seekTime={seekTime}
                  cameraAngle={angle}
                  onTime={onTime}
                  onEnd={onEnd}
                />
              </AvatarBoundary>
            </div>
            <p className="study-caption" aria-live="off">
              {caption}
            </p>
            <div className="study-transport">
              <button
                className="primary-button"
                onClick={() => {
                  if (time >= study.asset.duration - 0.05) {
                    setRestart((v) => v + 1);
                    setSeekTime(0);
                    setTime(0);
                  }
                  setPlaying((v) => !v);
                }}
              >
                {playing ? "Pausar estudo" : "Reproduzir estudo"}
              </button>
              <button
                className="text-button"
                onClick={() => {
                  setPlaying(false);
                  setSeekTime(0);
                  setTime(0);
                  setRestart((v) => v + 1);
                }}
              >
                Voltar ao início
              </button>
            </div>
            <label className="study-label" htmlFor="study-position">
              Posição: {time.toFixed(1)}s / {study.asset.duration}s
            </label>
            <input
              id="study-position"
              className="study-range"
              type="range"
              min={0}
              max={study.asset.duration}
              step={0.01}
              value={time}
              onChange={(e) => {
                const value = Number(e.target.value);
                setPlaying(false);
                setSeekTime(value);
                setTime(value);
              }}
            />
          </div>
          <div className="study-details">
            <h3>Observe e compare</h3>
            <p>
              A mão dominante sobe, mantém a configuração inicial, estende o
              mínimo e retorna. A posição em profundidade e os contatos entre os
              dedos são aproximações de uma única vista do vídeo.
            </p>
            <label className="study-label" htmlFor="study-speed">
              Velocidade do estudo
            </label>
            <select
              id="study-speed"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={0.25}>0,25×</option>
              <option value={0.5}>0,5×</option>
              <option value={0.75}>0,75×</option>
              <option value={1}>1×</option>
            </select>
            <label className="study-label" htmlFor="study-camera">
              Girar avatar para inspecionar a mão
            </label>
            <input
              id="study-camera"
              type="range"
              min={-0.9}
              max={0.9}
              step={0.05}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
            />
            <label className="study-checkbox">
              <input
                type="checkbox"
                checked={repeat}
                onChange={(e) => {
                  setRepeat(e.target.checked);
                  setSeekTime(0);
                  setTime(0);
                }}
              />{" "}
              Repetir estudo
            </label>
            <h3>Antes de usar como Libras</h3>
            <p>
              Revisar configuração da mão, orientação, movimento, expressão
              facial e compreensão com uma pessoa surda e um especialista. O
              intérprete continua retornando tradução indisponível para “Oi”.
            </p>
            <a href={study.source} target="_blank" rel="noopener noreferrer">
              Ver referência original no YouTube
            </a>
            <small>
              {study.sourceCredit}. O vídeo original não é redistribuído neste
              projeto.
            </small>
            <button
              className="text-button study-close"
              onClick={() => {
                setPlaying(false);
                setOpened(false);
              }}
            >
              Fechar estudo
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
