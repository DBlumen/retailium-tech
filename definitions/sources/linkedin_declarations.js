const { LINKEDIN_PROJECT, LINKEDIN_DATASET } = require('includes/linkedin_constants');

/*
Airbyte LinkedIn Ads connector tables.

Declared rather than interpolated as literal table names so the LinkedIn marts get
real lineage in the Dataform graph. The Google Ads sources do not: they arrive as
compile-time strings from ga4-export-fixer, which leaves Dataform with no dependency
edge to them. There is no LinkedIn module in that package, so declarations are the
right mechanism here.

account_users is deliberately left undeclared - nothing consumes it.
*/
[
  'accounts',
  'campaign_groups',
  'campaigns',
  'creatives',
  'ad_campaign_analytics',
  'ad_creative_analytics',
].forEach((name) => {
  declare({
    database: LINKEDIN_PROJECT,
    schema: LINKEDIN_DATASET,
    name,
  });
});
