const { googleAds } = require("ga4-export-fixer");

googleAds.clicks.createTable(publish, {
  // ── Required: which Google Ads Data Transfer export to read ──────────────
  source: {
    dataset: "retailiumtech.google_ads_110_359_2301", // "project.dataset" of the transfer
    customerId: "1103592301",                       // the account CID (dashes are fine too)
  },

  // ── Data freshness: a date is "final" once older than this many days ─────
  // Google Ads keeps revising recent days as clicks/conversions settle.
  dataIsFinal: { detectionMethod: "DAY_THRESHOLD", dayThreshold: 7 },

  // ── Optional: break the grain down by segment (default: summed away) ─────
  // extraDimensions: ["device", "ad_network_type"],

  // ── Optional: roll the grain up (drop a dimension) or drop a metric ──────
  // excludedColumns: ["search_term_match_type"],

  // ── Optional: write to a dedicated marts datas──
   dataformTableConfig: { schema: "marts_google_ads" },
});
