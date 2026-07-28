const { ga4EventsEnhanced } = require('ga4-export-fixer');

const config = {
  // using hard-coded GA4 export path
  sourceTable: '`retailiumtech.analytics_543168832.events_*`'
};

ga4EventsEnhanced.createTable(publish, config);