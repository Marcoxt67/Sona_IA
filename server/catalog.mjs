// Candidates are NOT translations. Never split a sentence into individual signs.
export const catalog = [
  {
    id: "bom-dia",
    portuguese: "Bom dia",
    category: "Saudações",
    status: "pending",
    asset: null,
    source: null,
    review: null,
  },
  {
    id: "obrigado",
    portuguese: "Obrigado",
    category: "Convivência",
    status: "pending",
    asset: null,
    source: null,
    review: null,
  },
  {
    id: "tudo-bem",
    portuguese: "Tudo bem?",
    category: "Saudações",
    status: "pending",
    asset: null,
    source: null,
    review: null,
  },
  {
    id: "meu-nome",
    portuguese: "Qual é o seu nome?",
    category: "Apresentação",
    status: "pending",
    asset: null,
    source: null,
    review: null,
  },
  {
    id: "ajuda",
    portuguese: "Preciso de ajuda",
    category: "Sala de aula",
    status: "pending",
    asset: null,
    source: null,
    review: null,
  },
  {
    id: "novamente",
    portuguese: "Pode repetir?",
    category: "Sala de aula",
    status: "pending",
    asset: null,
    source: null,
    review: null,
  },
];
export const normalize = (text) =>
  text
    .normalize("NFC")
    .toLocaleLowerCase("pt-BR")
    .trim()
    .replace(/[.!?]+$/u, "")
    .replace(/\s+/gu, " ");
export function playable(entry) {
  return (
    entry?.status === "validated" &&
    typeof entry.source === "string" &&
    /^https:\/\//.test(entry.source) &&
    entry.review?.deafReviewer &&
    entry.review?.specialist &&
    entry.review?.date &&
    entry.review?.assetVersion === entry.asset?.version &&
    entry.asset?.kind === "gltf" &&
    /^\/animations\/[a-zA-Z0-9/_-]+\.glb$/.test(entry.asset.url) &&
    entry.asset?.clip &&
    Number.isFinite(entry.asset.duration) &&
    entry.asset.duration > 0 &&
    Array.isArray(entry.asset.captions) &&
    entry.asset.captions.length > 0 &&
    entry.asset.captions.every(
      (c) =>
        typeof c.text === "string" &&
        Number.isFinite(c.start) &&
        Number.isFinite(c.end) &&
        c.start >= 0 &&
        c.end > c.start &&
        c.end <= entry.asset.duration,
    )
  );
}
// Replaceable provider boundary for future AI integrations; validated whole phrases only.
export function resolveTranslation(text, entries = catalog) {
  const entry = entries.find(
    (item) => normalize(item.portuguese) === normalize(text),
  );
  if (!playable(entry))
    return {
      status: "unavailable",
      entryId: entry?.id ?? null,
      message:
        "Esta frase ainda não possui tradução e animação validadas em Libras.",
    };
  return {
    status: "available",
    entryId: entry.id,
    message: "Frase validada",
    asset: entry.asset,
    source: entry.source,
    review: entry.review,
  };
}
