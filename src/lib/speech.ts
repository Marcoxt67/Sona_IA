import { useEffect, useRef, useState } from "react";
type SpeechEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
};
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
export function useSpeech(onText: (text: string) => void) {
  const [listening, setListening] = useState(false),
    [error, setError] = useState(""),
    [interim, setInterim] = useState("");
  const recognition = useRef<Recognition | null>(null),
    callback = useRef(onText);
  callback.current = onText;
  const supported = Boolean(
    (window as SpeechWindow).SpeechRecognition ||
      (window as SpeechWindow).webkitSpeechRecognition,
  );
  useEffect(
    () => () => {
      if (recognition.current) {
        recognition.current.onend = null;
        recognition.current.onresult = null;
        recognition.current.onerror = null;
        recognition.current.abort();
      }
    },
    [],
  );
  function toggle() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Constructor =
      (window as SpeechWindow).SpeechRecognition ||
      (window as SpeechWindow).webkitSpeechRecognition;
    if (!Constructor) return;
    if (!window.isSecureContext) {
      setError(
        "O microfone precisa de HTTPS ou localhost. Você pode digitar sua mensagem.",
      );
      return;
    }
    const engine = new Constructor();
    recognition.current = engine;
    engine.lang = "pt-BR";
    engine.continuous = true;
    engine.interimResults = true;
    engine.onresult = (e) => {
      let preview = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) callback.current(e.results[i][0].transcript);
        else preview += e.results[i][0].transcript;
      }
      setInterim(preview);
    };
    engine.onerror = (e) => {
      setError(
        (
          {
            "not-allowed":
              "Permissão de microfone negada. Autorize no navegador ou digite a mensagem.",
            "audio-capture": "Nenhum microfone disponível.",
            network:
              "O serviço de voz do navegador está indisponível. Use o campo de texto.",
            "no-speech": "Nenhuma fala detectada. Tente novamente.",
          } as Record<string, string>
        )[e.error] ||
          "O reconhecimento foi interrompido. Tente novamente ou digite.",
      );
      setListening(false);
    };
    engine.onend = () => {
      setListening(false);
      setInterim("");
    };
    setError("");
    try {
      engine.start();
      setListening(true);
    } catch {
      setError("Não foi possível iniciar o microfone. Tente novamente.");
    }
  }
  return {
    supported,
    listening,
    error,
    interim,
    toggle,
    stop: () => recognition.current?.stop(),
  };
}
