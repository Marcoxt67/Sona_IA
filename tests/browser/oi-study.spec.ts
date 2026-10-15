import { test, expect } from "@playwright/test";
test("experimental Oi study remains separate from translation and supports review controls", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  const study = page.getByRole("region", {
    name: "Oi · animação para revisão",
  });
  await expect(study.getByText("Experimental · não validado")).toBeVisible();
  await study
    .getByRole("button", { name: "Abrir estudo experimental de Oi" })
    .click();
  await expect(study.locator("canvas")).toBeVisible();
  await expect(
    study.getByText("EXPERIMENTAL · AGUARDANDO REVISÃO", { exact: true }),
  ).toBeVisible();
  const seek = study.getByRole("slider", { name: /Posição/ });
  async function seekTo(time: number) {
    await seek.evaluate((element, value) => {
      const input = element as HTMLInputElement;
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(input, String(value));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, time);
  }
  await seekTo(1.7);
  await expect(study.locator(".study-caption")).toContainText(
    "primeira configuração",
  );
  await page.waitForTimeout(350);
  await study.screenshot({ path: "/tmp/icaro-oi-first-pose.png" });
  await seekTo(3.3);
  await expect(study.locator(".study-caption")).toContainText(
    "extensão do mínimo",
  );
  await page.waitForTimeout(350);
  await study.screenshot({ path: "/tmp/icaro-oi-second-pose.png" });
  await study
    .getByRole("combobox", { name: "Velocidade do estudo" })
    .selectOption("0.5");
  await study.getByRole("button", { name: "Reproduzir estudo" }).click();
  await expect(
    study.getByRole("button", { name: "Pausar estudo" }),
  ).toBeVisible();
  await study.getByRole("button", { name: "Pausar estudo" }).click();
  const paused = Number(await seek.inputValue());
  await page.waitForTimeout(200);
  expect(Number(await seek.inputValue())).toBeCloseTo(paused, 1);
  await study.getByRole("button", { name: "Voltar ao início" }).click();
  await expect(seek).toHaveValue("0");
  await study.getByRole("checkbox", { name: "Repetir estudo" }).check();
  await study.getByRole("button", { name: "Reproduzir estudo" }).click();
  await study.getByRole("button", { name: "Fechar estudo" }).click();
  await expect(study.locator("canvas")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Mensagem em português" }).fill("Oi");
  await page.getByRole("button", { name: "Consultar tradução" }).click();
  await expect(page.getByRole("status")).toContainText(
    "ainda não possui tradução",
  );
  await expect(
    page.getByRole("button", { name: "Reproduzir animação" }),
  ).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await study
    .getByRole("button", { name: "Abrir estudo experimental de Oi" })
    .click();
  await expect(study.locator("canvas")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
