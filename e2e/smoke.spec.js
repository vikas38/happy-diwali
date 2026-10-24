import { test, expect } from '@playwright/test'

test.describe('T17 — End-to-End Smoke Test', () => {
  test('completes 5-step celebration, earns a sticker, and persists progress on reload', async ({
    page,
  }, testInfo) => {
    // 1. Inject deterministic seeded RNG hook
    await page.addInitScript(() => {
      let seed = 42
      window.__SEEDED_RNG__ = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296
        return seed / 4294967296
      }
    })

    // 2. Load Home
    await page.goto('/')
    await expect(page).toHaveTitle(/Little Lights/i)

    // 3. Tap Play Little Lights
    const playBtn = page.getByRole('button', { name: /Play Little Lights/i })
    await expect(playBtn).toBeVisible()
    await playBtn.click()

    // 4. Enter Courtyard via safety splash if shown
    const splashBtn = page.getByRole('button', { name: /Step into the courtyard/i })
    if (await splashBtn.isVisible()) {
      await splashBtn.click()
    }

    // 5. Select the first firework (Phuljhari / Step 1)
    const phuljhariBtn = page.getByRole('button', { name: /Phuljhari/i }).first()
    await expect(phuljhariBtn).toBeVisible()
    await phuljhariBtn.click()

    // 6. Put on street (Step 2)
    const introDialog = page.getByRole('dialog', { name: /Meet/i })
    if (await introDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      await introDialog.getByRole('button', { name: /Watch/i }).click()
    } else {
      const placeBtn = page.getByRole('button', { name: /Place .* on street/i })
      if (await placeBtn.isVisible()) {
        await placeBtn.click()
      }
    }

    // 7. Light the fuse (Step 3: Ask a grown-up to light fuse)
    const lightBtn = page.getByRole('button', { name: /Ask a grown-up to light.*fuse/i })
    await expect(lightBtn).toBeVisible()
    await lightBtn.click()

    // 8. Step back to watching spot (Step 4) — optionally skip walk
    const skipBtn = page.getByRole('button', { name: /Skip/i })
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click()
    }

    // 9. Assert reward dialog appears upon celebration completion (Step 5)
    const rewardDialog = page.getByRole('dialog', { name: /You did it/i })
    await expect(rewardDialog).toBeVisible({ timeout: 25000 })
    await expect(rewardDialog).toContainText('New sticker unlocked')

    // DIW-001: the real provider must immediately expose progress and replay awards.
    await expect(rewardDialog.getByLabel('3 stars earned')).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath('first-reward-desktop.png') })
    await page.getByRole('button', { name: 'Light Again', exact: true }).press('Enter')
    await lightBtn.click()
    await expect(rewardDialog).toBeVisible({ timeout: 25000 })
    await expect(rewardDialog.getByLabel('1 stars earned')).toBeVisible()
    await expect(rewardDialog).not.toContainText('New sticker unlocked')
    await page.getByRole('button', { name: 'Light Again', exact: true }).press('Enter')
    await page.getByRole('option', { name: /Anar/i }).click()
    await expect(page.getByRole('dialog', { name: /Meet Anar/i })).toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.screenshot({ path: testInfo.outputPath('unlocked-intro-mobile-reduced.png') })

    // 10. Reload the page and assert progress persists in localStorage
    await page.reload()

    const save = await page.evaluate(() => {
      const raw = localStorage.getItem('chhotu_diwali_save_v1')
      return raw ? JSON.parse(raw) : null
    })

    expect(save).not.toBeNull()
    expect(save.stickers).toContain(0) // Phuljhari sticker collected
    expect(save.stickers).toEqual([0])
    expect(save.stars).toBe(4)
    expect(save.hasCompletedFirst).toBe(true)
  })
})
