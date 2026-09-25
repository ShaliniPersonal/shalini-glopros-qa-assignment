import { expect, type Locator, type Page } from '@playwright/test';

export const DEFAULT_DISTANCE_KM = '100';

/**
 * VacancySearchPage — the search panel on `/search/?type=vacancies`.
 * Every locator here is scoped to `[data-testid="desktop-search-layout"]`
 * in order to make it unique.
 */
export class VacancySearchPage {
  private readonly page: Page;

  /** The desktop search panel. Everything below is scoped to it. */
  readonly panel: Locator;

  /** "Main job title" — a plain text input. */
  readonly jobTitleInput: Locator;

  /** "Add work location" — left empty by the happy path. */
  readonly locationInput: Locator;

  /** Distance in km. Default is 100km. */
  readonly distanceSelect: Locator;

  readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.getByTestId('desktop-search-layout');

    this.jobTitleInput = this.panel.locator('#main-job-title-input');
    this.locationInput = this.panel.locator('input[name="locations.0.location"]');
    this.distanceSelect = this.panel.locator('select');
    this.searchButton = this.panel.locator('button:has(svg[data-testid="search-icon"])');
  }

  /** Navigate straight to vacancy search. */
  async open() {
    await this.page.goto('/search/?type=vacancies');
    await this.expectLoaded();
  }

  /**
   * Load the results for a job title directly, via the URL rather than the form.
   */
  async openWithJobTitle(title: string) {
    const params = new URLSearchParams({
      type: 'vacancies',
      'main_job_title[0]': title,
    });
    await this.page.goto(`/search/?${params.toString()}`);
    await this.expectLoaded();
  }

  /** Assert the search panel is rendered and interactive. */
  async expectLoaded() {
    await expect(this.jobTitleInput).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  async expectDefaultFilters() {
    await expect(this.locationInput).toHaveValue('');
    await expect(this.distanceSelect).toHaveValue(DEFAULT_DISTANCE_KM);
  }

  async enterJobTitle(title: string) {
    await this.jobTitleInput.fill(title);
    await expect(this.jobTitleInput).toHaveValue(title);
  }

  async submit() {
    await this.searchButton.click();
  }

  /** Enter a job title and submit. */
  async searchFor(title: string) {
    await this.enterJobTitle(title);
    await this.submit();
  }
}
