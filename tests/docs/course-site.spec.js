import { test, expect } from '@playwright/test';

// The course site's self-learner features: quizzes score and explain, "mark as
// done" persists, progress shows on the topic and roadmap pages, and pages fit
// a phone screen.

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    throw err;
  });
});

test('a quiz scores answers, explains them and saves the best score', async ({ page }) => {
  await page.goto('/topics/01-foundations/quiz/');
  const questions = page.locator('.quiz-q');
  await expect(questions).toHaveCount(10);
  await expect(questions.first().locator('.quiz-why')).toBeHidden();

  await questions.nth(0).locator('li[data-right="1"] button').click();
  await questions.nth(1).locator('li[data-right="0"] button').first().click();
  await expect(questions.nth(0).locator('.quiz-why')).toBeVisible();
  await expect(questions.nth(1).locator('li.quiz-right')).toHaveCount(1);
  await expect(page.locator('.quiz-score')).toContainText('Score: 1/2 answered');

  for (let i = 2; i < 10; i++) await questions.nth(i).locator('li[data-right="1"] button').click();
  await expect(page.locator('.quiz-score')).toContainText('Final score: 9/10');

  await page.goto('/topics/01-foundations/');
  await expect(page.locator('.topic-progress__text')).toContainText('best quiz score 9/10');
});

test('every quiz has exactly one right answer per question', async ({ page }) => {
  for (const topic of ['01-foundations', '02-test-design', '03-unit-component']) {
    await page.goto(`/topics/${topic}/quiz/`);
    const questions = page.locator('.quiz-q');
    const n = await questions.count();
    expect(n, topic).toBeGreaterThanOrEqual(8);
    for (let i = 0; i < n; i++) await expect(questions.nth(i).locator('li[data-right="1"]'), `${topic} q${i + 1}`).toHaveCount(1);
  }
});

test('"mark as done" persists and shows on the topic and roadmap pages', async ({ page }) => {
  await page.goto('/topics/02-test-design/lab/');
  await page.getByRole('button', { name: 'Mark “Lab” as done' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: /Done — click to undo/ })).toBeVisible();

  await page.goto('/topics/02-test-design/');
  await expect(page.locator('.topic-progress__text')).toContainText('1/4 pages done');
  await page.goto('/topics/');
  await expect(page.locator('.topic-progress-mini[data-topic="02"]')).toHaveText('1/4');
});

test('pages fit a phone screen without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const path of ['/', '/topics/', '/topics/01-foundations/quiz/', '/topics/02-test-design/lab/']) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
