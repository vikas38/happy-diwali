import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const scan = async (page) => {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
    }))
  ).toEqual([])
}
for (const viewport of [
  { width: 390, height: 844 },
  { width: 820, height: 1180 },
]) {
  test('activities and parent dialogs at ' + viewport.width + 'px', async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await scan(page)
    await page.getByRole('button', { name: 'For grown-ups' }).press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await scan(page)
    await page.getByRole('button', { name: 'Close dialog' }).press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('button', { name: /SLOW & GLOW|Light diyas/i }).first().click()
    for (let i = 1; i <= 5; i++)
      await page.getByRole('button', { name: 'Light diya ' + i, exact: true }).click()
    await expect(page.getByText('Look at all that warmth. Happy Diwali!')).toBeVisible()
    await scan(page)
    await page.getByRole('button', { name: 'Close dialog' }).click()
    await page.getByRole('button', { name: /MAKE IT YOURS|Make rangoli/i }).first().click()
    await page.getByRole('button', { name: 'Ocean', exact: true }).click()
    await scan(page)
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /Download SVG|Keep my rangoli/i }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/my-diwali-rangoli.*\.svg/)
    await page.getByRole('button', { name: 'Close dialog' }).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
test('failed audio does not prevent play', async ({ page }) => {
  await page.addInitScript(() => {
    window.AudioContext = function () {
      throw Error('blocked audio')
    }
    window.webkitAudioContext = undefined
  })
  await page.goto('/')
  await page.getByRole('button', { name: /Play Little Lights/i }).click()
  await page.getByRole('button', { name: 'Step into the courtyard' }).click()
  await expect(page.getByRole('button', { name: /Phuljhari/i, exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Enable sound' }).click()
  await expect(page.locator('.audio-status[role="status"]')).toContainText('silently')
})
