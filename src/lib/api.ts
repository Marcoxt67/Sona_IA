export type Caption = { start: number; end: number; text: string };
export type Asset = {
  kind: "gltf";
  url: string;
  clip: string;
  version: string;
  duration: number;
  captions: Caption[];
};
export type Entry = {
  id: string;
  portuguese: string;
  category: string;
  status: string;
  playable: boolean;
  source: string | null;
};
export type HistoryItem = {
  id: number;
  text: string;
  status: string;
  createdAt: string;
};
export type Translation = {
  status: "available" | "unavailable";
  message: string;
  asset?: Asset;
  history: HistoryItem;
};
let memorySession = "";
function session() {
  try {
    const existing = localStorage.getItem("icaro-session");
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem("icaro-session", id);
    return id;
  } catch {
    return (memorySession ||= crypto.randomUUID());
  }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Icaro-Session": session(),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.error || "Não foi possível conectar ao servidor. Tente novamente.",
    );
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
