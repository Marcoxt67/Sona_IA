// Own integration code. Loads the official distribution unmodified, only inside the opt-in panel.
(() => {
  const status = document.getElementById("status");
  const message = document.getElementById("message");
  window.addEventListener("message", (event) => {
    if (
      event.source !== window.parent ||
      event.origin !== window.location.origin
    )
      return;
    if (
      event.data?.type !== "icaro:vlibras-text" ||
      typeof event.data.text !== "string"
    )
      return;
    const text = event.data.text.trim();
    if (!text || text.length > 500) return;
    message.textContent = text;
  });
  document.getElementById("select-text").addEventListener("click", () => {
    const range = document.createRange();
    range.selectNodeContents(message);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
  const script = document.createElement("script");
  script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
  script.async = true;
  function failure() {
    status.dataset.error = "true";
    status.textContent =
      "Não foi possível carregar o VLibras. Verifique sua conexão e o acesso a vlibras.gov.br, ou tente Recarregar integração. O restante do Ícaro continua disponível.";
  }
  const timeout = window.setTimeout(failure, 20000);
  script.onerror = () => {
    window.clearTimeout(timeout);
    failure();
  };
  script.onload = () => {
    window.clearTimeout(timeout);
    if (typeof window.VLibras?.Widget !== "function") return failure();
    try {
      // Configuration format and avatar identifier documented by the official project.
      new window.VLibras.Widget({
        rootPath: "https://vlibras.gov.br/app",
        avatar: "icaro",
        position: "R",
      });
      delete status.dataset.error;
      status.textContent =
        "Componente oficial carregado. Abra o botão azul do VLibras para iniciar o avatar; o carregamento dos sinais depende do serviço externo.";
    } catch {
      failure();
    }
  };
  document.body.appendChild(script);
  window.parent.postMessage(
    { type: "icaro:vlibras-ready" },
    window.location.origin,
  );
})();
