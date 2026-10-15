import { test, expect } from "@playwright/test";
test("message, unavailable translation, persistent browser history, library, deletion and mobile layout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Olá, eu sou o Ícaro." }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Mensagem em português" })
    .fill("Bom dia");
  await page.getByRole("button", { name: "Consultar tradução" }).click();
  await expect(page.getByRole("status")).toContainText(
    "ainda não possui tradução",
  );
  await expect(
    page.getByRole("button", { name: "Reproduzir animação" }),
  ).toBeDisabled();
  await page.getByRole("tab", { name: /Meu histórico/ }).click();
  await expect(page.locator(".history-list")).toContainText("Bom dia");
  await page.reload();
  await page.getByRole("tab", { name: /Meu histórico/ }).click();
  await expect(page.locator(".history-list")).toContainText("Bom dia");
  await page.getByRole("tab", { name: "Biblioteca", exact: true }).click();
  await page.getByRole("searchbox").fill("sala de aula");
  await expect(page.locator(".phrase-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Usar frase" }).first().click();
  await expect(
    page.getByRole("textbox", { name: "Mensagem em português" }),
  ).toHaveValue("Preciso de ajuda");
  await page.getByRole("button", { name: "Entenda o projeto" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("tab", { name: /Meu histórico/ }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Limpar histórico" }).click();
  await expect(
    page.getByRole("heading", { name: "Uma conexão começa com uma mensagem." }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: "Intérprete", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Mensagem em português" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/icaro-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.screenshot({ path: "/tmp/icaro-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("unsupported voice input offers usable manual alternative", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "SpeechRecognition", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /Toque para falar/ }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      "Reconhecimento de voz indisponível neste navegador. Digite abaixo.",
    ),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Mensagem em português" })
    .fill("Uma frase não cadastrada");
  await page.getByRole("button", { name: "Consultar tradução" }).click();
  await expect(page.getByRole("status")).toContainText(
    "ainda não possui tradução",
  );
});
test("voice lifecycle appends final Portuguese transcript and handles permission denial", async ({
  page,
}) => {
  await page.addInitScript(() => {
    class MockRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        (
          window as unknown as { testRecognition: MockRecognition }
        ).testRecognition = this;
      }
      stop() {
        this.onresult?.({
          resultIndex: 0,
          results: [{ isFinal: true, 0: { transcript: "Bom dia" } }],
        });
        this.onend?.();
      }
      abort() {}
    }
    Object.defineProperty(window, "SpeechRecognition", {
      value: MockRecognition,
      configurable: true,
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Toque para falar/ }).click();
  await expect(
    page.getByRole("button", { name: /Interromper microfone/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Interromper microfone/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Mensagem em português" }),
  ).toHaveValue("Bom dia");
  await page.getByRole("button", { name: "Consultar tradução" }).click();
  await expect(page.getByRole("status")).toContainText(
    "ainda não possui tradução",
  );
  await page.getByRole("button", { name: /Toque para falar/ }).click();
  await page.evaluate(() => {
    const recognition = (
      window as unknown as {
        testRecognition: {
          onerror: (e: { error: string }) => void;
          onend: () => void;
        };
      }
    ).testRecognition;
    recognition.onerror({ error: "not-allowed" });
    recognition.onend();
  });
  await expect(page.getByRole("alert")).toContainText(
    "Permissão de microfone negada",
  );
  await expect(
    page.getByRole("button", { name: /Toque para falar/ }),
  ).toHaveAttribute("aria-pressed", "false");
});
test("reusable GLB player synchronizes captions, pause, speed and repeat with an engineering fixture", async ({
  page,
}) => {
  // Synthetic empty scene, exclusively a player test. It is not a sign or a shipped library item.
  const values = new Float32Array([0, 4, 0, 0, 0, 0, 0.1, 0]);
  const binary = Buffer.from(values.buffer);
  const json = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: "fixture-root" }],
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 8 },
      { buffer: 0, byteOffset: 8, byteLength: 24 },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 2,
        type: "SCALAR",
        min: [0],
        max: [4],
      },
      { bufferView: 1, componentType: 5126, count: 2, type: "VEC3" },
    ],
    animations: [
      {
        name: "fixture",
        samplers: [{ input: 0, output: 1, interpolation: "LINEAR" }],
        channels: [{ sampler: 0, target: { node: 0, path: "translation" } }],
      },
    ],
  };
  const raw = Buffer.from(JSON.stringify(json));
  const padded = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 0x20);
  raw.copy(padded);
  const glb = Buffer.alloc(12 + 8 + padded.length + 8 + binary.length);
  glb.writeUInt32LE(0x46546c67, 0);
  glb.writeUInt32LE(2, 4);
  glb.writeUInt32LE(glb.length, 8);
  glb.writeUInt32LE(padded.length, 12);
  glb.writeUInt32LE(0x4e4f534a, 16);
  padded.copy(glb, 20);
  const offset = 20 + padded.length;
  glb.writeUInt32LE(binary.length, offset);
  glb.writeUInt32LE(0x004e4942, offset + 4);
  binary.copy(glb, offset + 8);
  await page.route("**/animations/fixture.glb", (route) =>
    route.fulfill({ contentType: "model/gltf-binary", body: glb }),
  );
  await page.route("**/api/translate", (route) =>
    route.fulfill({
      json: {
        status: "available",
        message: "Engineering fixture only",
        asset: {
          kind: "gltf",
          url: "/animations/fixture.glb",
          clip: "fixture",
          version: "test",
          duration: 4,
          captions: [
            { start: 0, end: 2, text: "Fixture: início" },
            { start: 2, end: 4, text: "Fixture: final" },
          ],
        },
        history: {
          id: 999,
          text: "Teste do reprodutor",
          status: "available",
          createdAt: new Date().toISOString(),
        },
      },
    }),
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Mensagem em português" })
    .fill("Teste do reprodutor");
  await page.getByRole("button", { name: "Consultar tradução" }).click();
  await expect(page.getByRole("status")).toHaveText("Fixture: início");
  await page.getByRole("button", { name: "Pausar animação" }).click();
  const progress = page.getByRole("progressbar");
  const frozen = Number(await progress.getAttribute("value"));
  await page.waitForTimeout(300);
  expect(Number(await progress.getAttribute("value"))).toBeCloseTo(frozen, 1);
  await page.getByLabel("Velocidade").selectOption("1.25");
  await page.getByRole("button", { name: "Reproduzir animação" }).click();
  await expect(page.getByRole("status")).toHaveText("Fixture: final", {
    timeout: 6000,
  });
  await expect(
    page.getByRole("button", { name: "Reproduzir animação" }),
  ).toBeVisible({ timeout: 6000 });
  expect(Number(await progress.getAttribute("value"))).toBeCloseTo(4, 1);
  await page.getByRole("button", { name: "Repetir animação" }).click();
  await page.getByRole("button", { name: "Reproduzir animação" }).click();
  await expect(page.getByRole("status")).toHaveText("Fixture: início");
  await expect(
    page.getByRole("button", { name: "Repetir animação" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(3500);
  await expect(
    page.getByRole("button", { name: "Pausar animação" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
