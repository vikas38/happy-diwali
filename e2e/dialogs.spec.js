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
    await page.getByRole('button', { name: 'For grown-ups' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await scan(page)
    await page.getByRole('button', { name: 'Close dialog' }).press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('button', { name: 'SLOW & GLOW', exact: false }).click()
    for (let i = 1; i <= 5; i++)
      await page.getByRole('button', { name: 'Light diya ' + i, exact: true }).click()
    await expect(page.getByText('Look at all that warmth. Happy Diwali!')).toBeVisible()
    await scan(page)
    await page.getByRole('button', { name: 'Close dialog' }).click()
    await page.getByRole('button', { name: 'MAKE IT YOURS', exact: false }).click()
    await page.getByRole('button', { name: 'Ocean', exact: true }).click()
    await scan(page)
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Keep my rangoli' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('my-diwali-rangoli.svg')
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
  await page.getByRole('button', { name: "Let's light it up" }).click()
  await page.getByRole('button', { name: 'Step into the courtyard' }).click()
  await expect(page.getByRole('button', { name: 'Phuljhari', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Enable sound' }).click()
  await expect(page.getByRole('status')).toContainText('silently')
})
