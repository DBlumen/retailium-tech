/*
Shared GA4 event-name configuration.

Single source of truth for which events count as conversions, so that the session
model and the conversions mart can never drift apart. To go live with a new
conversion, add its event name to CONVERSION_EVENTS and re-run — no SQL changes.
*/

// the main macro conversion(s)
const CONVERSION_EVENTS = ['book_demo'];

// secondary conversions, kept separate so they never inflate the headline conversion rate
// e.g. ['form_start', 'video_end']
const MICRO_CONVERSION_EVENTS = [];

// video tracking events
const VIDEO_EVENTS = ['video_start', 'video_end'];

/*
The virtual booth landing page (https://retailium.tech/virtual-booth). Only the production
hostname counts, so traffic on preview / staging builds of the site stays out of the report.
Every event that fires only on this page carries the vb_ prefix; the regexes group them by
the feature they measure, so a new event under an existing prefix is counted without SQL changes.
*/
const VIRTUAL_BOOTH = {
  hostname: 'retailium.tech',
  pathRegex: '^/virtual-booth/?$',
  eventRegex: '^vb_',
  videoEventRegex: '^vb_video',
  pdfEventRegex: '^vb_pdf',
  linkedinEventRegex: '^vb_linkedin_click'
};

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
  VIRTUAL_BOOTH,
  sqlArray
};
