const context = require('./context');
import { Context, Probot } from 'probot';
import { PullRequestEvent } from './types';


function freeProSubscription(login: string) {
  const organizations = ['AdaSupport', 'one-acre-fund'];
  const match = organizations.find((o) => o.toLowerCase() === String(login).toLowerCase());
  return match !== undefined;
}

function invoicedProSubscription(login: string) {
  const organizations = ['pace-int', 'honestbank'];
  const match = organizations.find((o) => o.toLowerCase() === String(login).toLowerCase());
  return match !== undefined;
}

async function isProPlan(app: Probot, ctx: Context<PullRequestEvent>) {
  try {
    const id = context.getRepoOwnerId(ctx);
    const login = context.getRepoOwnerLogin(ctx);
    app.log(`Checking Marketplace for organization: https://github.com/${login} ...`);
    if (freeProSubscription(login)) {
      app.log('Found free Pro ❤️ plan');
      return true;
    }
    if (invoicedProSubscription(login)) {
      app.log('Found invoiced Pro plan');
      return true;
    }

    const res = await ctx.octokit.apps.getSubscriptionPlanForAccount({ account_id: id });
    const purchase = res.data.marketplace_purchase;

    if (!purchase?.plan?.price_model) {
      app.log('Marketplace purchase not found');
      return false;
    }

    if (purchase.plan.price_model === 'FREE') {
      app.log('Found Free plan');
      return false;
    }
    app.log('Found Pro 💰 plan');
    return true;
  } catch (error) {
    app.log('Marketplace purchase not found');
    return false;
  }
}

module.exports = {
  isProPlan,
};
