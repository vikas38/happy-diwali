import { test, expect } from '@playwright/test'
import fs from 'fs'

const VIEWPORTS = [
  { name: 'phone-small-portrait', width: 360, height: 640 },
  { name: 'phone-small-landscape', width: 640, height: 360 },
  { name: 'phone-modern-portrait', width: 390, height: 844 },
  { name: 'phone-modern-landscape', width: 844, height: 390 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'desktop-portrait', width: 800, height: 1280 },
  { name: 'desktop-landscape', width: 1280, height: 800 },
]

test.describe('T19 — Responsive Viewport Matrix', () => {
  fs.mkdirSync('docs/screenshots/responsive', { recursive: true })

  for (const vp of VIEWPORTS) {
    test(`renders stage without clipping or overlapping at ${vp.width}x${vp.height} (${vp.name})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/')

      // 1. Home screen verification — dominant Play action is accessible
      const playBtn = page.getByRole('button', { name: /Play Little Lights/i })
      await expect(playBtn).toBeVisible()
      await playBtn.scrollIntoViewIfNeeded()
      const playBox = await playBtn.boundingBox()
      expect(playBox).not.toBeNull()
      expect(playBox.x).toBeGreaterThanOrEqual(0)
      expect(playBox.x + playBox.width).toBeLessThanOrEqual(vp.width + 2)

      // 2. Enter Courtyard stage
      await playBtn.click()
      const splashBtn = page.getByRole('button', { name: /Step into the courtyard/i })
      if (await splashBtn.isVisible()) {
        await splashBtn.click()
      }

      // Allow stage and layout to stabilize
      await page.waitForTimeout(400)

      // 3. Assert Courtyard HUD top controls sit inside viewport bounds
      const backHomeBtn = page.getByRole('button', { name: /Back to festival/i })
      await expect(backHomeBtn).toBeVisible()
      const backBox = await backHomeBtn.boundingBox()
      expect(backBox).not.toBeNull()
      expect(backBox.x).toBeGreaterThanOrEqual(0)
      expect(backBox.y).toBeGreaterThanOrEqual(0)
      expect(backBox.x + backBox.width).toBeLessThanOrEqual(vp.width + 1)
      expect(backBox.y + backBox.height).toBeLessThanOrEqual(vp.height + 1)

      const breathBtn = page.getByRole('button', { name: /Take a breath/i })
      await expect(breathBtn).toBeVisible()
      const breathBox = await breathBtn.boundingBox()
      expect(breathBox).not.toBeNull()
      expect(breathBox.x).toBeGreaterThanOrEqual(0)
      expect(breathBox.y).toBeGreaterThanOrEqual(0)
      expect(breathBox.x + breathBox.width).toBeLessThanOrEqual(vp.width + 1)
      expect(breathBox.y + breathBox.height).toBeLessThanOrEqual(vp.height + 1)

      // 4. Assert contextual action button and step dots sit inside viewport bounds
      const actionBtn = page.locator('.contextual-primary-btn')
      let actionBox = null
      if (await actionBtn.isVisible()) {
        actionBox = await actionBtn.boundingBox()
        expect(actionBox).not.toBeNull()
        expect(actionBox.x).toBeGreaterThanOrEqual(0)
        expect(actionBox.y).toBeGreaterThanOrEqual(0)
        expect(actionBox.x + actionBox.width).toBeLessThanOrEqual(vp.width + 1)
        expect(actionBox.y + actionBox.height).toBeLessThanOrEqual(vp.height + 1)
      }

      // 5. Assert firework dock sits inside viewport bounds
      const dock = page.locator('.firework-dock')
      let dockBox = null
      if (await dock.isVisible()) {
        dockBox = await dock.boundingBox()
        expect(dockBox).not.toBeNull()
        expect(dockBox.x).toBeGreaterThanOrEqual(0)
        expect(dockBox.y).toBeGreaterThanOrEqual(0)
        expect(dockBox.x + dockBox.width).toBeLessThanOrEqual(vp.width + 1)
        expect(dockBox.y + dockBox.height).toBeLessThanOrEqual(vp.height + 1)
      }

      // 6. Assert contextual action bar does not collide or overlap with the dock
      if (actionBox && dockBox) {
        const overlaps = !(
          actionBox.x + actionBox.width <= dockBox.x ||
          dockBox.x + dockBox.width <= actionBox.x ||
          actionBox.y + actionBox.height <= dockBox.y ||
          dockBox.y + dockBox.height <= actionBox.y
        )
        expect(
          overlaps,
          `Action button (y: ${actionBox.y}..${actionBox.y + actionBox.height}) and dock (y: ${dockBox.y}..${dockBox.y + dockBox.height}) must not overlap at ${vp.width}x${vp.height}`
        ).toBe(false)
      }

      // 7. Capture screenshot for review
      await page.screenshot({
        path: `docs/screenshots/responsive/${vp.name}-${vp.width}x${vp.height}.png`,
      })
    })
  }
})
