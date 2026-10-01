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

  /**
   * Hostile input, to confirm it is rendered as text rather than as markup.
   *
   * An `onerror` handler rather than a `<script>` tag on purpose. A script
   * element built by parsing an HTML string is flagged inert by the HTML spec
   * and never runs — including via `dangerouslySetInnerHTML`, which is
   * `innerHTML` underneath. So a `<script>` payload would pass against an
   * application that genuinely renders this as markup. The broken `src` makes
   * `onerror` fire the moment the element is inserted, so this one can fail.
   */
  htmlInjection: '<img src=x onerror="window.__xss = true">',
} as const;
