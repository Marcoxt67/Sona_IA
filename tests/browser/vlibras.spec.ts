import { test, expect } from "@playwright/test";
const plugin = "https://vlibras.gov.br/app/vlibras-plugin.js";
test("VLibras is opt-in, receives only the copied text and does not mark translation as validated", async ({
  page,
}) => {
  let requested = 0;
  // Contract fixture only: no assertion that a real avatar or translation service ran.
  await page.route(plugin, (route) => {
    requested++;
    return route.fulfill({
      contentType: "application/javascript",
      body: `window.VLibras={Widget:function(options){window.testOptions=options;const button=document.createElement('button');button.textContent='Botão VLibras de teste';document.body.appendChild(button);}};`,
    });
  });
  await page.goto("/");
  expect(requested).toBe(0);
  await page.getByRole("textbox", { name: "Mensagem em português" }).fill("Oi");
  await page
    .getByRole("button", { name: "Ativar VLibras com avatar oficial" })
    .click();
  const frame = page.frameLocator(
    'iframe[title="Painel de integração com o avatar oficial VLibras"]',
  );
  await expect(frame.locator("#status")).toContainText(
    "Componente oficial carregado",
  );
  await expect(frame.locator("#message")).toHaveText("Oi");
  expect(requested).toBe(1);
  const child = page
    .frames()
    .find((f) => f.url().endsWith("/integrations/vlibras.html"))!;
  expect(
    await child.evaluate(
      () =>
        (window as unknown as { testOptions: { avatar: string } }).testOptions
          .avatar,
    ),
  ).toBe("icaro");
  await page
    .getByRole("textbox", { name: "Mensagem em português" })
    .fill('<script>alert("x")</script>');
  await expect(frame.locator("#message")).toHaveText("Oi");
  await page
    .getByRole("button", { name: "Copiar mensagem para o painel" })
    .click();
  await expect(frame.locator("#message")).toHaveText(
    '<script>alert("x")</script>',
  );
  expect(await frame.locator("#message script").count()).toBe(0);
  await page.getByRole("textbox", { name: "Mensagem em português" }).fill("Oi");
  await page.getByRole("button", { name: "Consultar tradução" }).click();
  await expect(page.getByRole("status")).toContainText(
    "ainda não possui tradução",
  );
  await page
    .getByRole("button", { name: "Desativar VLibras", exact: true })
    .click();
  await expect(page.locator(".vlibras-frame")).toHaveCount(0);
});
test("official script network failure explains the limitation and preserves the local interpreter", async ({
  page,
}) => {
  await page.route(plugin, (route) => route.abort("blockedbyclient"));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Ativar VLibras com avatar oficial" })
    .click();
  const frame = page.frameLocator(".vlibras-frame");
  await expect(frame.locator("#status")).toContainText(
    "Não foi possível carregar o VLibras",
  );
  await page
    .getByRole("textbox", { name: "Mensagem em português" })
    .fill("Bom dia");
  await page.getByRole("button", { name: "Consultar tradução" }).click();
  await expect(page.getByRole("status")).toContainText(
    "ainda não possui tradução",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
