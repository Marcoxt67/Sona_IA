import express from "express";
import { catalog, playable, resolveTranslation } from "./catalog.mjs";
import { existsSync } from "node:fs";
import path from "node:path";
export function createApp(store) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "8kb" }));
  app.get("/api/health", (_req, res) =>
    res.json({
      ok: true,
      service: "icaro",
      validatedPhrases: catalog.filter(playable).length,
    }),
  );
  app.get("/api/library", (_req, res) =>
    res.json(catalog.map((e) => ({ ...e, playable: Boolean(playable(e)) }))),
  );
  app.use("/api", (req, res, next) => {
    const session = req.get("X-Icaro-Session");
    if (!session || !/^[a-f0-9-]{36}$/i.test(session))
      return res
        .status(400)
        .json({ error: "Identificador local inválido. Recarregue a página." });
    res.locals.session = session;
    next();
  });
  app.get("/api/history", (_req, res) =>
    res.json(store.list(res.locals.session)),
  );
  app.delete("/api/history", (_req, res) => {
    store.clear(res.locals.session);
    res.sendStatus(204);
  });
  app.post("/api/translate", (req, res) => {
    const text = req.body?.text;
    if (typeof text !== "string" || !text.trim() || text.trim().length > 500)
      return res
        .status(400)
        .json({ error: "Digite uma mensagem de 1 a 500 caracteres." });
    const result = resolveTranslation(text.trim());
    res.json({
      ...result,
      history: store.add(res.locals.session, text.trim(), result),
    });
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "Rota não encontrada." }),
  );
  const client = path.resolve("dist/client");
  if (existsSync(client)) {
    app.use(express.static(client));
    app.get("/{*path}", (_req, res) =>
      res.sendFile(path.join(client, "index.html")),
    );
  }
  app.use((err, _req, res, _next) =>
    res
      .status(
        err.status === 413
          ? 413
          : err.type === "entity.parse.failed"
            ? 400
            : 500,
      )
      .json({
        error:
          err.status === 413
            ? "Mensagem muito grande."
            : err.type === "entity.parse.failed"
              ? "JSON inválido."
              : "Não foi possível concluir a solicitação.",
      }),
  );
  return app;
}
