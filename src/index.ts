import * as Sentry from "@sentry/node";
import { RewriteFrames } from "@sentry/integrations";
import { hasValidSubscriptionForRepo, getAdditionsAndDeletions,removeExistingLabels, addLabel } from './github';
import {blockedAccount, changedFiles, isPublicRepo} from './context';
import { Labels, defaultLabels, generateSizeLabel } from './labels';
import type { ApplicationFunction } from 'probot/lib/types'
import { Context, Probot } from 'probot';
import { handleMarketplacePurchase } from './webhooks/marketplace-purchase';
import { MarketplaceEvent, PullRequestEvent } from './types';

const MAX_FILES = 1000;

function configureSentry(app: Probot) {
  if (process.env.SENTRY_DSN) {
    app.log('Setting up Sentry.io logging...');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      integrations: [
        new RewriteFrames({
          root: global.__dirname,
        })
      ],
    });
  } else {
    app.log('Skipping Sentry.io setup');
  }
}


const onApp: ApplicationFunction = (app: Probot) => {
  configureSentry(app);

  app.on([
    'marketplace_purchase.purchased',
    'marketplace_purchase.changed',
    'marketplace_purchase.cancelled',
    'marketplace_purchase.pending_change',
  ], async (ctx: Context<MarketplaceEvent>) => {
    const [account, change, plan] = await handleMarketplacePurchase(app, ctx);
    if (process.env.NODE_ENV !== 'test') {
      await Sentry.captureEvent({
        message: `Marketplace: ${change} ${plan}`,
        extra: {
          org: account,
        },
        level: 'info',
      });
    }
  });

  app.on([
    'pull_request.opened',
    'pull_request.reopened',
    'pull_request.synchronize',
    'pull_request.edited',
  ], async (ctx: Context<PullRequestEvent>) => {
    if (blockedAccount(ctx)) {
      return;
    }

    if (changedFiles(ctx) > MAX_FILES) {
      // TODO(benji): add gh comment about the number of files being too large
      return;
    }

    if (await hasValidSubscriptionForRepo(app, ctx)) {
      const publicRepo = isPublicRepo(ctx);
      const [additions, deletions] = await getAdditionsAndDeletions(ctx, publicRepo);

      // if (isPublicRepo) {
      //   await Sentry.captureEvent({
      //     message: 'Public Repo PRS Execution',
      //     extra: {
      //       repo: ctx.payload.repository.full_name,
      //       url: `${ctx.payload.repository.html_url}/pull/${ctx.payload.number}`,
      //       additions,
      //       deletions,
      //     },
      //   });
      // }

      let customLabels: Labels | null;
      try {
        // TODO(benji): add a GitHub comment to the PR if the labels configuration is
        // invalid

        // custom labels stored in .github/labels.yml
        customLabels = await ctx.config('labels.yml', defaultLabels);
      } catch {
        customLabels = null;
      }

      const labels: Labels = customLabels || defaultLabels;

      const [labelColor, label] = generateSizeLabel(additions + deletions, labels);

      // remove any existing size label if it exists and is not the label to add
      await removeExistingLabels(ctx, label, labels);

      // assign GitHub label
      await addLabel(ctx, label, labelColor);
    }
  });
};

export = onApp;
