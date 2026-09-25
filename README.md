# GloPros — Vacancy Search E2E

End-to-end automation for the vacancy search journey on the GloPros review
environment, written with Playwright and TypeScript and organised with the
Page Object Model.

[![E2E Tests](https://github.com/ShaliniPersonal/shalini-glopros-qa-assignment/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/ShaliniPersonal/shalini-glopros-qa-assignment/actions/workflows/tests.yml)

> **Note on the badge.** The review environment has been decommissioned, 
> so CI runs now fail at the first navigation rather than on any assertion.

## Install

```bash
npm install
npx playwright install --with-deps   # downloads the browser engines
```

## Run

```bash
npm test                    # chromium + firefox + webkit
npm run test:chromium       # a single engine — fastest feedback
npm run test:headed         # watch the browser drive the app
npm run test:ui             # interactive runner with time-travel debugging
npm run test:report         # open the HTML report from the last run
npm run typecheck           # tsc --noEmit
```

The environment under test is set by `BASE_URL`, defaulting to the review URL
in `playwright.config.ts`

## Layout

```
tests/
├── vacancySearch.spec.ts        # happy path + the two job title variants
├── pages/
│   ├── HomePage.ts              # landing page → vacancy search
│   ├── VacancySearchPage.ts     # the search panel
│   └── SearchResultsPage.ts     # match count and vacancy cards
└── fixtures/
    ├── base-test.ts             # page objects as Playwright fixtures
    └── test-data.ts             # job titles used by the spec and the features

features/
├── vacancy-search.feature             # core behaviour
└── vacancy-search-edge-cases.feature  # edge cases, negatives, alternatives
```

## Coverage

| Area | What is covered |
| --- | --- |
| Happy path (automated) | Homepage → vacancy search link → job title entered → submitted via the search-icon button → URL retains `type=vacancies` and the job title parameter → non-zero match count → a card renders with title, location and match percentage |
| Filter defaults (automated) | Location empty and distance at 100 km, asserted both before and after submitting |
| Input equivalence (automated) | A lowercase job title and one padded with whitespace both return a match count comparable to the canonical title's — compared within a tolerance, since the environment's data shifts between the two readings |
| Core behaviour (documented) | Reaching vacancy search directly by URL, results shown before any filter, changing the title changes the count, the distance range, and the job title appearing in the URL while typing |
| Input handling (documented) | Zero-match terms, over-long input, script-like input |
| Filters and alternatives (documented) | Location narrowing, distance narrowing, talent search, AI search |
| URL and navigation (documented) | Reload restores the search, browser back, clearing the title clears the parameter |
| Accessibility (documented) | Accessible name on the submit button, labelled inputs, keyboard-only completion, card metadata exposed to assistive technology |
| Resilience (documented) | Slow request shows progress, failed request surfaces an error |

The automated test asserts **shape, never content**: a non-zero count rather
than a specific number, a `NN%` pattern rather than a particular percentage, a
non-empty title rather than one containing the search term.

## BDD approach

The `features/` directory is the specification, written as Gherkin and tagged:

- `@automated` — implemented in `tests/vacancySearch.spec.ts`
- `@documented` — specified not automated
- `@defect` — describes intended behaviour the application does not currently have

**The feature files are documentation, not an execution layer.** There is no
Cucumber runner and no step definitions.

## Findings

Five things surfaced while building this.

**1. The search form is rendered twice, and the submit button has no accessible
name.** Both `desktop-search-layout` and `mobile-search-layout` are in the DOM
at all times, one hidden by CSS, so every unscoped locator matches two elements
— handled by scoping. The search-icon button has neither text nor an
`aria-label`, so a screen reader announces only "button".

**2. The inputs are labelled only by placeholder.** "Job title" and "Location"
are visible headings but are not programmatically associated with their inputs,
so the field's identity disappears the moment the user types — a problem for
screen readers, voice control and anyone who glances away mid-form. It also
removes the accessible name that `getByRole` and `getByLabel` depend on, which
is why the page objects fall back to `id` and `name`.

**3. There is no `<form>` element and no `type="submit"` attribute.**
Submission is a click handler, so nothing navigates and the page does not
refresh. Pressing Enter is therefore not guaranteed to submit, and
`button[type="submit"]` matches nothing — the submit control is located by the
icon it contains.

**4. The search-icon button is not needed — the search has already run before
it is clicked.** The app searches on a ~500 ms debounce while the title is
typed, writing the URL parameter, issuing the request and rendering the cards.

The consequence matters more than the finding: **the happy path passes whether
or not the button works.** Search-as-you-type is a legitimate design; a control 
that produces no effect at all is not.

**5. There is nothing on a card to locate its fields by.** The only
`data-testid` on a card sits on its Apply button, which is why the suite counts
cards by that. The title, location and match percentage are plain `div`s with
no test id, heading or label, so `readCardMetadata` has to find them by
position.

That caused a real bug. A card's text runs together as `996%Netherlands…` —
the title is `9` and the match is `96%`, with nothing separating them — so a
regex looking for a percentage matched `996%` and left the title empty. The fix
reads each element's own text in DOM order, so the field boundaries come from
the DOM instead of from a pattern. An assertion that the percentage is at most
100 now guards against a repeat.

## Note on AI use

**What I used it for.** I worked with Claude throughout: exploring the live
application to establish locators, generating the first draft of the page
objects, config and workflow, and reviewing my own test design. The bulk of the
prose in the comments and this README was drafted in conversation and then
edited.

**What I changed or rejected.** Four things are mine rather than the model's.
It initially proposed asserting that the first card's title contains "Software
Engineer", which the environment's seed data breaks — I replaced that with the
shape assertions described above.

The second is finding 4, and it is the one I would point at. Using the
application, I noticed that results appeared as I typed and that clicking the
search button refreshed nothing. The model had already recorded the
URL-updates-while-typing behaviour, but had also written that the count changed
on submit — which was wrong, because it implied the button worked. Measuring
it properly showed the click fires no request at all, and therefore that the
happy path passes whether or not the button works. Noticing that a passing test
proves nothing is not something the model volunteered.

The third is `HomePage.goToVacancySearch`, which the model wrote as a click
followed by `await expect(page).toHaveURL(...)`. Reading it, I questioned
whether a URL assertion really waits for the page, because using the
application I could see the address bar change while the page was still
arriving. It does not. This is a Next.js app doing client-side routing, so
`history.pushState` runs the moment the route commits and the page data follows
separately — measured on the live environment, the URL changed 933 ms after the
click and the search form did not exist until 1880 ms. For almost a second the
assertion passes and there is nothing to interact with.

**What I would not delegate.** Deciding what is worth asserting. The model will
happily generate a test for anything, including assertions that cannot fail —
an earlier draft checked that the results page shows results before any filter
is applied, which is true of the page on load and therefore proves nothing
about searching. Knowing which assertions carry signal is the part of this job
that does not transfer.

## CI

`.github/workflows/tests.yml` runs on push and pull request to `main` or `master`, plus
manual dispatch — useful for re-running a red build to tell a flaky environment
apart from a real regression. One job per browser engine, `fail-fast: false` so a 
single-engine failure is distinguishable from a genuine regression. The HTML report
— traces, screenshots, video — is uploaded on every run including failures.

`concurrency` cancels in-flight runs on the same branch, since an earlier run
is testing code that has already been replaced. It also runs at 06:00 UTC on
weekdays.