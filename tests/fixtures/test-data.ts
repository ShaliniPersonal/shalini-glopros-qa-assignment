/**
 * Test data for the vacancy search suite.
 */
export const JOB_TITLES = {
  /** The standard title. Expected to return matches. */
  common: 'Software Engineer',

  /** Different casing — documents whether matching is case-insensitive. */
  lowercase: 'software engineer',

  /** Surrounding whitespace — documents whether input is trimmed. */
  padded: '  Software Engineer  ',

  /** A plausible title with no matches in this environment. */
  unmatched: 'Underwater Basket Weaver',

  /** Hostile input, to confirm it is treated as text. */
  scriptTag: '<script>window.__xss = true;</script>',
} as const;
