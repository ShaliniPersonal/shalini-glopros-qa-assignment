# =============================================================================
#  Vacancy search — core behaviour
# =============================================================================
#
# Tags map each scenario to its status in the repository:
#
#   @automated  — implemented in tests/vacancySearch.spec.ts
#   @documented — specified here and not automated
#   @defect     — describes intended behaviour the application does not have

Feature: Vacancy search
  As a professional looking for a job
  I want to search vacancies by job title
  So that I can find roles that match what I do

  Background:
    Given I am on the GloPros homepage

  @automated
  Scenario: Search vacancies by job title from the homepage
    When I click "Vacancy search"
    Then I should be on the vacancy search page
    And the location field should be empty
    And the distance should be the default 100 km
    When I enter "Software Engineer" as the main job title
    And I submit the search using the search-icon button
    Then the URL should still identify a vacancy search
    And the URL should carry the job title I searched for
    And a non-zero number of matches should be shown
    And at least one vacancy card should show a title, a location and a match percentage

  @documented
  Scenario: Reach vacancy search directly by URL
    When I navigate directly to the vacancy search URL
    Then I should be on the vacancy search page
    And the search form should be ready to accept a job title

  @documented
  Scenario: Vacancy search shows results before any filter is applied
    When I click "Vacancy search"
    Then a non-zero number of matches should be shown
    And at least one vacancy card should be listed

  @documented
  Scenario: Changing the job title changes the number of matches
    When I click "Vacancy search"
    And I note the number of matches
    And I enter "Software Engineer" as the main job title
    And I submit the search using the search-icon button
    Then the number of matches should differ from the unfiltered total

  @documented
  Scenario: Distance defaults to 100 km and offers the documented range
    When I click "Vacancy search"
    Then the distance should be the default 100 km
    And the distance options should be 10, 20, 40, 60, 80, 100, 250 and 500 km

  @documented
  # Observation rather than a requirement. The application syncs the job title
  # into the URL as the user types, debounced — so the query parameter appears
  # before the search-icon button is clicked.
  Scenario: The job title appears in the URL while typing, before submission
    When I click "Vacancy search"
    And I enter "Software Engineer" as the main job title
    Then the URL should carry the job title I searched for
    And I should not yet have submitted the search
