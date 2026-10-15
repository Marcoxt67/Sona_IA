import { createServer } from "node:http";
import { createApp } from "./app.mjs";
import { createStore } from "./db.mjs";
const store = createStore(process.env.DATABASE_PATH || "./data/icaro.sqlite");
const port = Number(process.env.PORT || 3001);
const server = createServer(createApp(store));
server.once("error", (error) => {
  console.error(
    `Ícaro: não foi possível iniciar o servidor (${error.code || "erro de inicialização"}).`,
  );
  store.close();
  process.exit(1);
});
server.listen(port, "0.0.0.0", () =>
  console.log(`Ícaro: servidor iniciado na porta ${port}`),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(() => {
      store.close();
      process.exit(0);
    }),
  );
