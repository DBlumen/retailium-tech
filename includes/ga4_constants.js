/*
Shared GA4 event-name configuration.

Single source of truth for which events count as conversions, so that the session
model and the conversions mart can never drift apart. To go live with a new
conversion, add its event name to CONVERSION_EVENTS and re-run — no SQL changes.
*/

// the main macro conversion(s)
const CONVERSION_EVENTS = ['book_demo'];

// secondary conversions, kept separate so they never inflate the headline conversion rate
// e.g. ['form_start', 'video_finish']
const MICRO_CONVERSION_EVENTS = [];

// video tracking events
const VIDEO_EVENTS = ['video_start', 'video_finish', 'video_pause'];

/**
 * Renders a JS array of strings as a SQL array literal, for use with
 * `event_name in unnest(...)`.
 *
 * An empty array yields `cast([] as array<string>)` so the SQL stays valid
 * (BigQuery cannot infer the element type of a bare empty literal).
 *
 * @param {string[]} values - The string values to render.
 * @returns {string} A SQL array literal.
 */
const sqlArray = (values) => {
  if (!Array.isArray(values)) {
    throw new Error("sqlArray: 'values' must be an array of strings.");
  }
  if (values.length === 0) {
    return 'cast([] as array<string>)';
  }
  return `[${values.map((value) => `'${value.replace(/'/g, "\\'")}'`).join(', ')}]`;
};

module.exports = {
  CONVERSION_EVENTS,
  MICRO_CONVERSION_EVENTS,
  VIDEO_EVENTS,
  sqlArray
};
