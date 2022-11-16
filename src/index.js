const Sentry = require('@sentry/node');
const MarketplacePurchase = require('./webhooks/marketplace-purchase');
const github = require('./github');
const context = require('./context');
const labels = require('./labels');

const MAX_FILES = 1000;

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
    const [account, change, plan] = await MarketplacePurchase.handle(app, ctx);
    await Sentry.captureEvent({
      message: `Marketplace: ${change} ${plan}`,
      extra: {
        org: account,
      },
    });
  });

  app.on([
    'pull_request.opened',
    'pull_request.reopened',
    'pull_request.synchronize',
    'pull_request.edited',
  ], async (ctx) => {
    if (context.blockedAccount(ctx)) {
      return;
    }

    if (context.changedFiles(ctx) > MAX_FILES) {
      // TODO(benji): add gh comment about the number of files being too large
      return;
    }

    // TODO(benji): add gh comment when user has a GitHub IP denylist set. Add static
    // outbound IP to lambda environment.

    if (await github.hasValidSubscriptionForRepo(app, ctx)) {
      const [additions, deletions] = await github.getAdditionsAndDeletions(ctx);

      let customLabels;
      try {
        // TODO(benji): add a GitHub comment to the PR if the labels configuration is
        // invalid

        // custom labels stored in .github/labels.yml
        customLabels = await ctx.config('labels.yml', labels.labels);
      } catch (err) {
        // catch error if the user hasn't granted permissions to this file yet
        customLabels = labels.labels;
      }

      const [labelColor, label] = labels.generateSizeLabel(additions + deletions, customLabels);
      // remove any existing size label if it exists and is not the label to add
      await github.removeExistingLabels(ctx, label, customLabels);

      // assign GitHub label
      await github.addLabel(ctx, label, labelColor);
    }
  });
};
