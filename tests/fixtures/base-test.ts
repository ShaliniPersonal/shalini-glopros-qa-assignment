import { test as base, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { VacancySearchPage } from '../pages/VacancySearchPage';
import { SearchResultsPage } from '../pages/SearchResultsPage';

/**
 * Custom Playwright fixtures to inject the page objects into each test
 */

interface Fixtures {
  homePage: HomePage;
  vacancySearchPage: VacancySearchPage;
  searchResultsPage: SearchResultsPage;
}

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  vacancySearchPage: async ({ page }, use) => {
    await use(new VacancySearchPage(page));
  },

  searchResultsPage: async ({ page }, use) => {
    await use(new SearchResultsPage(page));
  },
});

export { expect };
