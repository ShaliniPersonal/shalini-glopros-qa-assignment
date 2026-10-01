import { expect, type Locator, type Page } from '@playwright/test';

/**
 * HomePage — the GloPros landing page, and the entry point of the journey.
 * We navigate to the homePage, find the vacancy search button, click on it
 * and validate that vacancy search page is visible
 */
export class HomePage {
  private readonly page: Page;
  readonly vacancySearchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.vacancySearchButton = page.getByRole('button', { name: 'Vacancy search' });
  }

  async open() {
    await this.page.goto('/');
    await this.expectLoaded();
  }

  /** Assert the landing page is ready to interact with. */
  async expectLoaded() {
    await expect(this.vacancySearchButton).toBeVisible();
  }

  async goToVacancySearch() {
    await this.vacancySearchButton.click();
    await expect(this.page).toHaveURL(/\/search\/\?type=vacancies/);
    await expect(this.page.getByTestId('desktop-search-layout')).toBeVisible();
  }
}
