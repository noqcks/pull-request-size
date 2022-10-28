const Sentry = require('@sentry/node');
const MarketplacePurchase = require('./webhooks/marketplace-purchase');
const github = require('./github');
const labels = require('./labels');

function configureSentry(app) {
  if (process.env.SENTRY_DSN) {
    app.log('Setting up Sentry.io logging...');
    Sentry.init({ dsn: process.env.SENTRY_DSN });
  } else {
    app.log('Skipping Sentry.io setup');
  }
}

module.exports = (app) => {
  configureSentry(app);

  app.on([
    'marketplace_purchase.purchased',
    'marketplace_purchase.changed',
    'marketplace_purchase.cancelled',
    'marketplace_purchase.pending_change',
  ], async (ctx) => {
    await MarketplacePurchase.handle(app, ctx);
  });

  app.on([
    'pull_request.opened',
    'pull_request.reopened',
    'pull_request.synchronize',
    'pull_request.edited',
  ], async (ctx) => {
    if (await github.hasValidSubscriptionForRepo(app, ctx)) {
      const [additions, deletions] = await github.getAdditionsAndDeletions(ctx);

      // custom labels stored in .github/labels.yml
      const customLabels = await ctx.config('labels.yml', labels.labels);

      const [labelColor, label] = labels.generateSizeLabel(additions + deletions, customLabels);
      // remove any existing size label if it exists and is not the label to add
      await github.removeExistingLabels(ctx, label, customLabels);

      // assign GitHub label
      await github.addLabel(ctx, label, labelColor);
    }
  });
};
