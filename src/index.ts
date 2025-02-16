import { App } from "@octokit/app";

import * as MarketplacePurchase from "./webhooks/marketplace-purchase";
import github from "./github";
import labels from "./labels";
import context from "./context";

const MAX_FILES = 1000;

function configureSentry(app: App) {
  if (process.env.SENTRY_DSN) {
    app.log.info("Setting up Sentry.io logging...");
  } else {
    app.log.info("Skipping Sentry.io setup");
  }
}

const app = new App({
  appId: process.env.APP_ID!,
  privateKey: process.env.PRIVATE_KEY!,
  webhooks: {
    secret: process.env.WEBHOOK_SECRET!,
  },
});

export type App = typeof app

export default (app: App) => {
  configureSentry(app);

  app.on(
    [
      "marketplace_purchase.purchased",
      "marketplace_purchase.changed",
      "marketplace_purchase.cancelled",
      "marketplace_purchase.pending_change",
    ],
    async (ctx) => {
      await MarketplacePurchase.handle(app.log, ctx);
    }
  );

  app.on(
    [
      "pull_request.opened",
      "pull_request.reopened",
      "pull_request.synchronize",
      "pull_request.edited",
    ],
    async (ctx) => {
      console.log("PULL REQUEST EVENT");
      if (
        context.blockedAccount(ctx) ||
        context.changedFiles(ctx) > MAX_FILES
      ) {
        return;
      }

      if (!(await github.hasValidSubscriptionForRepo(app, ctx))) {
        return;
      }

      const isPublicRepo = context.isPublicRepo(ctx);
      const [additions, deletions] = await github.getAdditionsAndDeletions(
        app,
        ctx,
        isPublicRepo
      );

      // Get custom size labels from config, falling back to defaults
      let sizeLabels = labels.labels;
      try {
        const customLabels = await ctx.config("labels.yml", labels.labels);
        if (customLabels) {
          sizeLabels = customLabels;
        }
      } catch (err) {
        app.log.error("Error loading labels.yml", err);
      }

      // Generate and apply size label
      const [labelColor, label] = labels.generateSizeLabel(
        additions + deletions,
        sizeLabels
      );

      await github.removeExistingLabels(ctx, label, sizeLabels);
      const labelConfig = Object.values(sizeLabels).find(
        (l) => l.name === label
      );
      await github.addLabel(ctx, label, labelColor, labelConfig?.description);

      // Add configured comment if one exists for this label
      const selectedLabel = Object.values(sizeLabels).find(
        (l) => l.name === label
      );

      if (selectedLabel?.comment) {
        await github.addCommentIfDoesntExist(ctx, selectedLabel.comment);
      }
    }
  );
};
