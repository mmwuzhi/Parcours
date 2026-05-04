import { test, expect } from '@playwright/test'

test('unauthenticated user is redirected to login', async ({ page }) => {
  await page.goto('/applications')
  await expect(page).toHaveURL(/\/login/)
})

test('login page renders', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
})

test('register page renders', async ({ page }) => {
  await page.goto('/register')
  await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
})

test('register then login flow', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`
  const password = 'password123'

  await page.goto('/register')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /create account/i }).click()

  await expect(page).toHaveURL(/\/(applications|dashboard)/, { timeout: 10000 })

  await page.goto('/login')
  await expect(page).toHaveURL(/\/(applications|dashboard)/)
})
