/*
Shared LinkedIn Ads configuration.

Single source of truth for the Airbyte LinkedIn connector location, the account the
marts are allowed to report on, and the small SQL snippets both LinkedIn marts need.
Deliberately mirrors the shape of the ga4-export-fixer Google Ads helpers so the two
platforms' marts read the same way - there is no LinkedIn module in that package, so
these live here instead.
*/

// Where the Airbyte LinkedIn Ads connector lands its tables.
const LINKEDIN_PROJECT = 'retailiumtech';
const LINKEDIN_DATASET = 'retailiumtech_linkedin';

/*
The connector syncs several advertisers into one dataset: this Retailium account plus
three belonging to another advertiser (517261062, 517816387, 517847054). Every model
must filter on this account or another client's spend silently lands in Retailium's
numbers. The analytics tables carry no account column of their own, so the filter has
to be applied to the campaign / creative dimension and joined in with an INNER join.
*/
const RETAILIUM_ACCOUNT_ID = '530170125';
const RETAILIUM_ACCOUNT_URN = `urn:li:sponsoredAccount:${RETAILIUM_ACCOUNT_ID}`;

// LinkedIn keeps revising the most recent days as clicks and cost settle - the latest
// day often arrives with impressions but null clicks / cost. A date is "final" once
// older than this many days. Shorter than the Google Ads threshold; LinkedIn settles faster.
const DAY_THRESHOLD = 3;

/**
 * Extracts the bare numeric id from a LinkedIn URN.
 *
 * The connector is inconsistent: dimension primary keys are bare integers
 * (`campaigns.id` = 814000403) while every foreign key is a URN
 * (`creatives.campaign` = 'urn:li:sponsoredCampaign:814000403'), and the analytics
 * tables key on the bare id as a string. Normalising to the trailing digits is what
 * makes the two sides joinable.
 *
 * @param {string} column - SQL expression holding the URN.
 * @returns {string} SQL expression producing the bare id as a string.
 */
const urnId = (column) => `regexp_extract(${column}, r'([0-9]+)$')`;

/**
 * SQL expression for the `data_is_final` flag, matching helpers.googleAdsDataIsFinal.
 *
 * @param {string} dateExpr - SQL expression for the row's date.
 * @param {number} dayThreshold - Days after which the data is considered final.
 * @returns {string} SQL expression evaluating to TRUE when the row is final.
 */
const dataIsFinal = (dateExpr, dayThreshold = DAY_THRESHOLD) => {
  if (!Number.isInteger(dayThreshold) || dayThreshold < 0) {
    throw new Error(`dataIsFinal: dayThreshold must be a non-negative integer. Received: ${JSON.stringify(dayThreshold)}`);
  }
  return `if(date_diff(current_date(), ${dateExpr}, day) > ${dayThreshold}, true, false)`;
};

/**
 * Keeps only the newest synced row per entity - the analogue of the Google Ads
 * transfer's `_DATA_DATE = _LATEST_DATE` snapshot filter.
 *
 * Airbyte currently writes these dimension tables already deduplicated, so this is
 * defensive; it costs nothing at this size and stops a future connector mode that
 * appends versions from fanning the marts out.
 *
 * @param {string[]} keyColumns - The columns identifying one entity.
 * @returns {string} A SQL QUALIFY clause.
 */
const latestRow = (keyColumns) => {
  if (!Array.isArray(keyColumns) || keyColumns.length === 0) {
    throw new Error("latestRow: 'keyColumns' must be a non-empty array of column names.");
  }
  return `qualify row_number() over (partition by ${keyColumns.join(', ')} order by _airbyte_extracted_at desc) = 1`;
};

module.exports = {
  LINKEDIN_PROJECT,
  LINKEDIN_DATASET,
  RETAILIUM_ACCOUNT_ID,
  RETAILIUM_ACCOUNT_URN,
  DAY_THRESHOLD,
  urnId,
  dataIsFinal,
  latestRow
};
