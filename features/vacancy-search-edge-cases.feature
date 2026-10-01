# =============================================================================
#  Vacancy search — edge cases, negatives and alternatives
# =============================================================================
#
# Tag conventions are described at the top of vacancy-search.feature.
# Two scenarios here are automated — the case and whitespace variants, which
# expect the same outcome as the happy path.

Feature: Vacancy search edge cases
  As a QA engineer
  I want the search to behave predictably at its boundaries
  So that users are not misled by input the application mishandles

  Background:
    Given I am on the vacancy search page

  # ---------------------------------------------------------------------------
  # Input handling
  # ---------------------------------------------------------------------------

  # Both scenarios below compare match *counts*, not result sets.
  # And they compare them within a small tolerance rather than exactly. 

  @automated
  Scenario: Job title matching ignores letter case
    Given I know the number of matches for "Software Engineer"
    When I enter "software engineer" as the main job title
    And I submit the search using the search-icon button
    Then the number of matches should be comparable to that number

  @automated
  Scenario: Surrounding whitespace in the job title is ignored
    Given I know the number of matches for "Software Engineer"
    When I enter "  Software Engineer  " as the main job title
    And I submit the search using the search-icon button
    Then the number of matches should be comparable to that number

  @documented
  Scenario: A job title with no matches reports zero and lists no cards
    When I enter "Underwater Basket Weaver" as the main job title
    And I submit the search using the search-icon button
    Then the match count should be zero
    And no vacancy cards should be listed
    And I should see a message explaining that nothing matched

  @documented
  # Boundary probe with 255 characters
  Scenario: An over-long job title does not break the form
    When I enter a 255-character job title
    And I submit the search using the search-icon button
    Then the search should complete without error
    And I should be able to run a normal search afterwards

  @documented
  # The payload uses an onerror handler rather than a <script> tag deliberately.
  # A script element created by parsing an HTML string never executes, so a
  # <script> payload would satisfy the last step even against an application
  # that renders the input as markup. A broken image src fires immediately.
  Scenario: Markup in the job title is rendered as text and not executed
    When I enter "<img src=x onerror=\"window.__xss = true\">" as the main job title
    And I submit the search using the search-icon button
    Then the input should be echoed as plain text
    And no handler from the input should have executed

  # ---------------------------------------------------------------------------
  # Filters and alternatives
  # ---------------------------------------------------------------------------

  @documented
  Scenario: Adding a work location narrows the results
    When I enter "Software Engineer" as the main job title
    And I add "Netherlands" as the work location
    And I submit the search using the search-icon button
    Then the number of matches should be no greater than the unfiltered total
    And every visible card should show a location within the search radius

  @documented
  Scenario: Narrowing the distance with a location set reduces the results
    When I enter "Software Engineer" as the main job title
    And I add "Netherlands" as the work location
    And I change the distance to 10 km
    And I submit the search using the search-icon button
    Then the number of matches should be no greater than the number at 100 km

  @documented
  Scenario: Switching to talent search changes the search type
    When I switch to "Talent search"
    Then the URL should identify a professionals search
    And the results should no longer be vacancies

  @documented
  Scenario: AI search is offered as an alternative entry point
    Then I should see an "AI search (Beta)" option
    And choosing it should offer a free-text search instead of structured filters

  # ---------------------------------------------------------------------------
  # URL and navigation integrity
  # ---------------------------------------------------------------------------

  @documented
  Scenario: Reloading the results page restores the same search
    When I enter "Software Engineer" as the main job title
    And I submit the search using the search-icon button
    And I reload the page
    Then the job title field should still contain "Software Engineer"
    And a non-zero number of matches should be shown

  @documented
  Scenario: Browser back returns to the page I came from
    Given I arrived at vacancy search from the homepage
    When I submit a search for "Software Engineer"
    And I navigate back
    Then I should be on the GloPros homepage

  @documented
  Scenario: Clearing the job title removes it from the URL
    When I enter "Software Engineer" as the main job title
    And I clear the main job title field
    Then the URL should no longer carry a job title parameter
    And the unfiltered results should be shown again

  # ---------------------------------------------------------------------------
  # Accessibility
  # ---------------------------------------------------------------------------

  @documented @defect
  # The search-icon button has neither text nor an aria-label, so a screen
  # reader announces it only as "button". Since it is the sole reliable way to
  # submit the search, this makes the journey difficult to complete without
  # sight. Recorded as a finding in the README.
  Scenario: The search-icon button has an accessible name
    Then the search submit button should have an accessible name describing its action

  @documented @defect
  # The form has visible column headings ("Job title", "Location") but the
  # inputs are labelled only by placeholder, which disappears on typing and is
  # an unreliable accessible name.
  Scenario: Search inputs are labelled for assistive technology
    Then the main job title field should have a programmatically associated label
    And the work location field should have a programmatically associated label

  @documented
  # The whole journey should be achievable without a pointing device. Worth
  # specifying rather than assuming, because with no `<form>` element in the
  # markup, pressing Enter is not guaranteed to submit.
  Scenario: The search can be completed using the keyboard alone
    When I move focus to the main job title field
    And I type "Software Engineer"
    And I submit the search using the keyboard
    Then a non-zero number of matches should be shown

  @documented @defect
  # The card fields carry no test id, heading element or aria-label so the
  # title, location and percentage are announced as undifferentiated text.
  Scenario: Result cards are announced with their key metadata
    When I submit a search for "Software Engineer"
    Then each result should expose its title, location and match percentage to assistive technology

  # ---------------------------------------------------------------------------
  # Resilience
  # ---------------------------------------------------------------------------

  @documented
  # Would be automated with request interception rather than against the live
  # environment — the only way to produce these states deterministically.
  Scenario: A slow search shows progress rather than an empty result set
    When the search request is delayed
    And I submit a search for "Software Engineer"
    Then I should see a loading indicator
    And I should not see a "no results" message while the request is in flight

  @documented
  Scenario: A failed search request surfaces an error
    When the search request returns a server error
    And I submit a search for "Software Engineer"
    Then I should see an error message
    And I should be able to retry the search
