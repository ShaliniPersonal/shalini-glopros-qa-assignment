import { expect, type Locator, type Page } from '@playwright/test';

/** Metadata for a single vacancy card. */
export interface VacancyCardMetadata {
  title: string;
  location: string;
  matchPercentage: string;
  fields: string[];
}

/**
 * SearchResultsPage — the match count and the vacancy cards.
 */
export class SearchResultsPage {
  private readonly page: Page;

  /** The result count for the matches */
  readonly matchCount: Locator;

  /** One per card, so `count()` gives the number of cards on the page. */
  readonly cards: Locator;

  /** The main anchor of each card, holding its title, location and match. */
  readonly cardLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    this.matchCount = page.getByText(/^\s*[\d,]+\s+matches\s*$/i);
    this.cards = page.getByTestId('testing-vacancy-match-card-apply');
    this.cardLinks = page.locator('a[href^="/vacancy-profiles/"]');
  }

  async expectNonZeroMatchCount(): Promise<number> {
    await expect(this.matchCount).toBeVisible();
    const text = (await this.matchCount.textContent()) ?? '';
    const digits = text.replace(/[^\d]/g, '');
    const count = Number.parseInt(digits, 10);

    expect(
      count,
      `Expected a non-zero match count, got "${text.trim()}"`,
    ).toBeGreaterThan(0);

    return count;
  }

  /** Read the match count without asserting anything. */
  async readMatchCount(): Promise<number> {
    const text = (await this.matchCount.textContent()) ?? '';
    return Number.parseInt(text.replace(/[^\d]/g, ''), 10);
  }

  /**
   * Wait until the match count settles within a tolerance of `expected`.
   */
  async expectMatchCountNear(expected: number) {
    const tolerance = Math.max(2, Math.ceil(expected * 0.02));

    await expect
      .poll(
        async () => Math.abs((await this.readMatchCount()) - expected),
        {
          message:
            `Match count should settle within ${tolerance} of the baseline ` +
            `${expected}. A large difference means the search is not matching ` +
            `this variant of the job title.`,
        },
      )
      .toBeLessThanOrEqual(tolerance);
  }

  /** Assert at least one card rendered, without pinning how many. */
  async expectAtLeastOneCard() {
    await expect(this.cards.first()).toBeVisible();
    expect(await this.cards.count()).toBeGreaterThan(0);
  }

  /**
   * Read the metadata off one card.
  */
  async readCardMetadata(index = 0): Promise<VacancyCardMetadata> {
    const card = this.cardLinks.nth(index * 2);
    await expect(card).toBeVisible();

    const fields = await card.evaluate((element) => {
      const ownText = (node: Element): string =>
        Array.from(node.childNodes)
          .filter((child) => child.nodeType === Node.TEXT_NODE)
          .map((child) => child.textContent ?? '')
          .join('')
          .trim();

      return Array.from(element.querySelectorAll('*'))
        .map(ownText)
        .filter((text) => text.length > 0);
    });

    const percentageIndex = fields.findIndex((field) => /^\d{1,3}%$/.test(field));

    return {
      title: fields[0] ?? '',
      matchPercentage: percentageIndex === -1 ? '' : (fields[percentageIndex] ?? ''),
      location: percentageIndex === -1 ? '' : (fields[percentageIndex + 1] ?? ''),
      fields,
    };
  }

  /**
   * Assert a card carries the three pieces of metadata:
   * a title, a location, and a match percentage.
   */
  async expectCardMetadata(index = 0): Promise<VacancyCardMetadata> {
    const metadata = await this.readCardMetadata(index);
    const onCard = `Card fields were: ${JSON.stringify(metadata.fields)}`;

    await expect(
      this.cardLinks.nth(index * 2).getByText(/^\d{1,3}%$/),
      'Card should render a match percentage element',
    ).toBeVisible();

    expect(metadata.title, `Card should render a non-empty title. ${onCard}`)
      .not.toBe('');

    expect(metadata.location, `Card should render a location. ${onCard}`)
      .not.toBe('');

    expect(
      metadata.location,
      `Location should not be a percentage — fields have shifted. ${onCard}`,
    ).not.toMatch(/^\d{1,3}%$/);

    expect(
      metadata.matchPercentage,
      `Card should render a match percentage. ${onCard}`,
    ).toMatch(/^\d{1,3}%$/);

    /* Validate that the percentage match is not above 100%. */
    const percentage = Number.parseInt(metadata.matchPercentage, 10);
    expect(
      percentage,
      `Match percentage should be between 0 and 100. ${onCard}`,
    ).toBeLessThanOrEqual(100);

    return metadata;
  }

  /**
   * Assert the URL still carries the search context after submitting.
   */
  async expectSearchContextInUrl(jobTitle: string) {
    await expect(this.page).toHaveURL(/type=vacancies/);

    await expect
      .poll(() => new URL(this.page.url()).searchParams.get('main_job_title[0]'), {
        message: 'URL should retain the job title query parameter.',
      })
      .toBe(jobTitle);
  }
}
