/*
Shared Google Ads conversion-action configuration.

Single source of truth for which conversion actions get their own metric column in the
Google Ads marts. Adding a column for a newly created conversion action is a config
edit here, not a SQL edit.

Actions are keyed on their numeric conversion action id rather than their name: names
are editable in the Google Ads UI, and keying on them would rename or orphan a report
column the moment someone renames an action. The `name` is carried only as a label for
whoever reads this file; `alias` is what the column is named after.

Conversions booked against an action that is not listed here are not lost — the marts
carry a `conversions_other` remainder column, so the per-action columns plus that
remainder always sum to the total `conversions` metric. A persistently non-zero
remainder means an action is live in the account and missing from this list.
*/

// One entry per conversion action that should get its own metric column.
// id: the numeric id, the trailing part of the `customers/<cid>/conversionActions/<id>`
//     resource name in `segments_conversion_action`
// alias: the column-name suffix, e.g. 'video_start' -> conversions_video_start
// name: the action's name in the Google Ads UI, for readability only
const CONVERSION_ACTIONS = [
  { id: 7693501631, alias: 'visit_contact_page', name: 'Visit Contact Page' },
  { id: 7693501634, alias: 'video_start', name: 'Video Start' },
  { id: 7651614953, alias: 'rolunk', name: 'Rólunk' },
];

// Aliases become column names, so they have to be valid BigQuery identifiers and
// distinct from one another. Checked at compile time, where the error is cheap.
const validateConversionActions = (actions) => {
  const seen = new Set();
  actions.forEach((action) => {
    if (!Number.isInteger(action.id)) {
      throw new Error(
        `google_ads_constants: conversion action id must be an integer. Received: ${JSON.stringify(action)}`
      );
    }
    if (!/^[a-z][a-z0-9_]*$/.test(action.alias || '')) {
      throw new Error(
        `google_ads_constants: alias must be lowercase letters, digits and underscores, starting with a letter. Received: ${JSON.stringify(action.alias)}`
      );
    }
    if (seen.has(action.alias)) {
      throw new Error(`google_ads_constants: duplicate alias '${action.alias}'.`);
    }
    seen.add(action.alias);
  });
  return actions;
};

validateConversionActions(CONVERSION_ACTIONS);

/**
 * Renders the pivot expressions that turn one row per conversion action into one
 * column per conversion action. For use in a select over a CTE that exposes
 * `conversion_action_id` and `conversions`.
 *
 * @param {string} [indent] - Leading whitespace for each rendered line.
 * @returns {string} Comma-separated `sum(if(...)) as conversions_<alias>` lines.
 */
const conversionActionPivot = (indent = '    ') =>
  CONVERSION_ACTIONS.map(
    (action) =>
      `${indent}sum(if(conversion_action_id = ${action.id}, conversions, 0)) as conversions_${action.alias}`
  ).join(',\n');

/**
 * Renders the matching output columns for a final select that left joins the pivoted
 * CTE. Null-safe: a grain key with no conversions at all reports zeros, not nulls.
 *
 * @param {string} source - Alias of the pivoted CTE in the query.
 * @param {string} [indent] - Leading whitespace for each rendered line.
 * @returns {string} Comma-separated `coalesce(...) as conversions_<alias>` lines.
 */
const conversionActionColumns = (source, indent = '  ') => {
  if (!source) {
    throw new Error("conversionActionColumns: 'source' must be the alias of the pivoted CTE.");
  }
  return CONVERSION_ACTIONS.map(
    (action) =>
      `${indent}coalesce(${source}.conversions_${action.alias}, 0) as conversions_${action.alias}`
  ).join(',\n');
};

module.exports = {
  CONVERSION_ACTIONS,
  conversionActionPivot,
  conversionActionColumns
};
