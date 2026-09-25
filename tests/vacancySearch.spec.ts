/**
 * ===========================================================================
 *  VACANCY SEARCH — AUTOMATED HAPPY PATH
 * ===========================================================================
 *   1. Open the homepage
 *   2. Click "Vacancy search" — arrives at /search/?type=vacancies
 *   3. Enter a job title; leave location empty; keep the default 100km
 *   4. Submit via the search-icon button
 *   5. Validate the URL, a non-zero match count, and one card's metadata
 */

import { test, expect } from './fixtures/base-test';
import { JOB_TITLES } from './fixtures/test-data';
import { DEFAULT_DISTANCE_KM } from './pages/VacancySearchPage';

test.describe('Vacancy search', () => {
  test('finds vacancies for a job title from the homepage', async ({
    page,
    homePage,
    vacancySearchPage,
    searchResultsPage,
  }) => {
    await test.step('Open the homepage', async () => {
      await homePage.open();
    });

    await test.step('Navigate to vacancy search', async () => {
      await homePage.goToVacancySearch();
      await vacancySearchPage.expectLoaded();
    });

    await test.step('Confirm location is empty and distance is the default', async () => {
      await vacancySearchPage.expectDefaultFilters();
    });

    await test.step(`Search for "${JOB_TITLES.common}"`, async () => {
      // Types the title and clicks the search-icon button, as the brief
      // specifies. The application runs the search on a debounce as the
      // title is typed, so every assertion below would also pass with the click removed.
      await vacancySearchPage.searchFor(JOB_TITLES.common);
    });

    await test.step('URL retains the search context', async () => {
      await searchResultsPage.expectSearchContextInUrl(JOB_TITLES.common);
    });

    await test.step('A non-zero number of matches is shown', async () => {
      const count = await searchResultsPage.expectNonZeroMatchCount();

      // Recorded in the report for diagnosis. The count is environment data, so
      // it is useful context on a failure but must not decide pass or fail.
      test.info().annotations.push({ type: 'match count', description: String(count) });
    });

    await test.step('At least one vacancy card renders with its metadata', async () => {
      await searchResultsPage.expectAtLeastOneCard();

      const { title, location, matchPercentage } =
        await searchResultsPage.expectCardMetadata();

      test.info().annotations.push({
        type: 'first card',
        description: `${title} · ${location} · ${matchPercentage}`,
      });
    });

    await test.step('Filters are unchanged by the search', async () => {
      await expect(vacancySearchPage.locationInput).toHaveValue('');
      await expect(vacancySearchPage.distanceSelect).toHaveValue(DEFAULT_DISTANCE_KM);
      await expect(page).toHaveURL(/type=vacancies/);
    });
  });

  /**
   * Two variants of the same job title that a real user would type, both of
   * which should return a comparable number of matches.
   */
  const equivalentTitles = [
    { variant: 'letter casing', title: JOB_TITLES.lowercase },
    { variant: 'surrounding whitespace', title: JOB_TITLES.padded },
  ];

  for (const { variant, title } of equivalentTitles) {
    test(`ignores ${variant} in the job title`, async ({
      vacancySearchPage,
      searchResultsPage,
    }) => {
      let baseline = 0;

      await test.step(`Establish the baseline for "${JOB_TITLES.common}"`, async () => {
        await vacancySearchPage.openWithJobTitle(JOB_TITLES.common);
        baseline = await searchResultsPage.expectNonZeroMatchCount();
      });

      await test.step(`Search for "${title}" through the form`, async () => {
        await vacancySearchPage.open();
        await vacancySearchPage.searchFor(title);
      });

      await test.step(`Match count settles near the baseline of ${baseline}`, async () => {
        await searchResultsPage.expectMatchCountNear(baseline);
      });
    });
  }
});